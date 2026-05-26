"""
Mock database: in-memory document store with JSON persistence.
Implements a subset of Motor/MongoDB async API sufficient for server.py.
Fallback quando MongoDB não está disponível.
"""
import json
import os
import re
import copy
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# bson pode nao estar disponivel sem motor/pymongo
try:
    from bson import ObjectId
except ImportError:
    class ObjectId:
        def __init__(self, oid=None):
            self._id = oid or os.urandom(12).hex()
        def __str__(self):
            return self._id
        def __repr__(self):
            return f"ObjectId('{self._id}')"


def _serialize(obj):
    """Convert non-serializable types to strings for JSON."""
    if hasattr(obj, '__class__') and obj.__class__.__name__ == 'ObjectId':
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def _to_str(val):
    """Convert ObjectId-like values to string for comparison."""
    if hasattr(val, '__class__') and val.__class__.__name__ == 'ObjectId':
        return str(val)
    return val


def _matches(doc, query):
    """Check if doc matches query (supports $regex, $gte, $lte, $in, $or, $exists, $ne, $and)."""
    for key, value in query.items():
        if key == '$or':
            if not any(_matches(doc, cond) for cond in value):
                return False
            continue
        if key == '$and':
            if not all(_matches(doc, cond) for cond in value):
                return False
            continue

        doc_val = doc.get(key)

        if isinstance(value, dict):
            if '$regex' in value:
                flags = 0
                if value.get('$options') == 'i':
                    flags = re.IGNORECASE
                if not re.search(value['$regex'], str(doc_val or ''), flags):
                    return False

            for op, op_val in value.items():
                if op in ('$regex', '$options'):
                    continue
                if op == '$gte':
                    if not (doc_val is not None and doc_val >= op_val):
                        return False
                elif op == '$lte':
                    if not (doc_val is not None and doc_val <= op_val):
                        return False
                elif op == '$in':
                    if _to_str(doc_val) not in [_to_str(v) for v in op_val]:
                        return False
                elif op == '$nin':
                    if _to_str(doc_val) in [_to_str(v) for v in op_val]:
                        return False
                elif op == '$ne':
                    if _to_str(doc_val) == _to_str(op_val):
                        return False
                elif op == '$exists':
                    if op_val != (key in doc):
                        return False
                elif op == '$gt':
                    if not (doc_val is not None and doc_val > op_val):
                        return False
                elif op == '$lt':
                    if not (doc_val is not None and doc_val < op_val):
                        return False
        else:
            if _to_str(doc_val) != _to_str(value):
                return False
    return True


class MockCursor:
    """Async cursor that mimics Motor's cursor with sort().to_list()."""

    def __init__(self, docs):
        self._docs = list(docs)

    def sort(self, key, direction):
        reverse = direction == -1
        self._docs.sort(key=lambda d: str(d.get(key, '') or ''), reverse=reverse)
        return self

    async def to_list(self, length=None):
        if length is not None and length > 0:
            return self._docs[:length]
        return self._docs


class MockCollection:
    """In-memory collection mimicking Motor's async collection methods."""

    def __init__(self, name, store):
        self._name = name
        self._store = store  # dict of id -> doc

    def _save(self):
        if isinstance(self._store, MockStore):
            self._store.save()

    def _all_docs(self):
        return list(self._store.values())

    def find(self, query=None):
        query = query or {}
        return MockCursor(d for d in self._all_docs() if _matches(d, query))

    async def find_one(self, query=None):
        query = query or {}
        for d in self._all_docs():
            if _matches(d, query):
                return d
        return None

    async def insert_one(self, doc):
        doc = copy.deepcopy(doc)
        if '_id' not in doc:
            from bson import ObjectId
            doc['_id'] = ObjectId()
        doc_id = _to_str(doc['_id'])
        self._store[doc_id] = doc
        self._save()
        return type('InsertOneResult', (), {'inserted_id': doc['_id']})()

    async def update_one(self, query, update):
        for doc_id in list(self._store.keys()):
            if _matches(self._store[doc_id], query):
                self._apply_update(self._store[doc_id], update)
                self._save()
                return type('UpdateResult', (), {'modified_count': 1})()
        return type('UpdateResult', (), {'modified_count': 0})()

    async def update_many(self, query, update):
        count = 0
        for doc_id in list(self._store.keys()):
            if _matches(self._store[doc_id], query):
                self._apply_update(self._store[doc_id], update)
                count += 1
        if count:
            self._save()
        return type('UpdateResult', (), {'modified_count': count})()

    async def delete_one(self, query):
        for doc_id in list(self._store.keys()):
            if _matches(self._store[doc_id], query):
                del self._store[doc_id]
                self._save()
                return type('DeleteResult', (), {'deleted_count': 1})()
        return type('DeleteResult', (), {'deleted_count': 0})()

    async def delete_many(self, query):
        count = 0
        for doc_id in list(self._store.keys()):
            if _matches(self._store[doc_id], query):
                del self._store[doc_id]
                count += 1
        if count:
            self._save()
        return type('DeleteResult', (), {'deleted_count': count})()

    async def count_documents(self, query=None):
        query = query or {}
        return sum(1 for d in self._store.values() if _matches(d, query))

    async def distinct(self, key, query=None):
        query = query or {}
        values = set()
        for d in self._store.values():
            if _matches(d, query):
                val = d.get(key)
                if isinstance(val, list):
                    for item in val:
                        values.add(_to_str(item))
                elif val is not None:
                    values.add(_to_str(val))
        return list(values)

    def aggregate(self, pipeline):
        docs = list(self._store.values())
        for stage in pipeline:
            if '$match' in stage:
                docs = [d for d in docs if _matches(d, stage['$match'])]
            elif '$unwind' in stage:
                field = stage['$unwind'].lstrip('$')
                new_docs = []
                for d in docs:
                    arr = d.get(field)
                    if isinstance(arr, list) and len(arr) > 0:
                        for item in arr:
                            nd = copy.deepcopy(d)
                            nd[field] = item
                            new_docs.append(nd)
                    else:
                        new_docs.append(copy.deepcopy(d))
                docs = new_docs
            elif '$group' in stage:
                gb = stage['$group']
                groups = {}
                for d in docs:
                    gk = self._group_key(gb['_id'], d)
                    if gk not in groups:
                        groups[gk] = {'_id': gk}
                    for acc, expr in gb.items():
                        if acc == '_id':
                            continue
                        if isinstance(expr, dict) and '$sum' in expr:
                            sv = expr['$sum']
                            if sv == 1:
                                groups[gk][acc] = groups[gk].get(acc, 0) + 1
                            elif isinstance(sv, str) and sv.startswith('$'):
                                fv = d.get(sv[1:], 0)
                                groups[gk][acc] = groups[gk].get(acc, 0) + (fv if isinstance(fv, (int, float)) else 0)
                            else:
                                groups[gk][acc] = groups[gk].get(acc, 0) + sv
                        else:
                            groups[gk][acc] = d.get(acc, expr)
                docs = list(groups.values())
            elif '$sort' in stage:
                for sk, sd in stage['$sort'].items():
                    docs.sort(key=lambda d: str(d.get(sk, '') or ''), reverse=(sd == -1))
            elif '$limit' in stage:
                docs = docs[:stage['$limit']]
            elif '$skip' in stage:
                docs = docs[stage['$skip']:]
        return MockCursor(docs)

    def _group_key(self, id_expr, doc):
        """Compute group _id from expression."""
        if isinstance(id_expr, dict) and '$dateToString' in id_expr:
            fmt = id_expr['$dateToString']['format']
            field = id_expr['$dateToString']['date'].lstrip('$')
            val = doc.get(field)
            if val is None:
                return '__null__'
            if isinstance(val, datetime):
                return val.strftime(fmt)
            if isinstance(val, str):
                return val[:10] if fmt == '%Y-%m-%d' else val
            return str(val)
        if isinstance(id_expr, str) and id_expr.startswith('$'):
            val = doc.get(id_expr[1:])
            return _to_str(val) if val is not None else '__null__'
        return str(id_expr) if id_expr is not None else '__null__'

    def _apply_update(self, doc, update):
        if '$set' in update:
            for k, v in update['$set'].items():
                doc[k] = v
        if '$unset' in update:
            for k in update['$unset']:
                doc.pop(k, None)
        if '$inc' in update:
            for k, v in update['$inc'].items():
                doc[k] = doc.get(k, 0) + v

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        return self  # chainable methods like .sort()


class MockStore(dict):
    """Dict subclass that auto-saves to a JSON file on mutation."""

    def __init__(self, data_file=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._data_file = data_file

    def save(self):
        if self._data_file:
            tmp = {}
            for coll_name, docs in self.items():
                tmp[coll_name] = list(docs.values())
            with open(self._data_file, 'w') as f:
                json.dump(tmp, f, indent=2, default=_serialize)

    def load(self):
        if self._data_file and os.path.exists(self._data_file):
            with open(self._data_file, 'r') as f:
                raw = json.load(f)
            for coll_name, docs in raw.items():
                coll = {}
                for doc in docs:
                    doc_id = _to_str(doc.get('_id', ''))
                    if not doc_id:
                        from bson import ObjectId
                        doc_id = str(ObjectId())
                        doc['_id'] = doc_id
                    coll[doc_id] = doc
                self[coll_name] = coll


class MockDB:
    """Top-level mock database. Access collections via attribute: db.collection."""

    def __init__(self, data_file=None):
        self._store = MockStore(data_file)
        self._store.load()

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        if name not in self._store:
            self._store[name] = {}
        return MockCollection(name, self._store[name])


# Singleton
_instance = None


def get_mock_db(data_file=None):
    global _instance
    if _instance is None:
        if data_file is None:
            data_file = str(Path(__file__).parent / 'data.json')
        _instance = MockDB(data_file)
    return _instance
