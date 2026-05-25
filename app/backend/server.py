from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
import json
import zipfile
from io import BytesIO
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Auth config
SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """FastAPI dependency that returns current user from JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "viewer")
    }

def require_role(*roles: str):
    """Dependency factory: require specific roles"""
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user.email,
        "name": user.name,
        "password": get_password_hash(user.password),
        "role": "admin",  # First user is admin
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Check if this is the first user, otherwise new users get "viewer" role
    user_count = await db.users.count_documents({})
    if user_count > 0:
        user_dict["role"] = "viewer"
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    access_token = create_access_token({"sub": str(result.inserted_id), "role": user_dict["role"]})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(result.inserted_id),
            email=user_dict["email"],
            name=user_dict["name"],
            role=user_dict["role"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin):
    """Login and get JWT token"""
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({
        "sub": str(db_user["_id"]),
        "role": db_user.get("role", "viewer")
    })
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(db_user["_id"]),
            email=db_user["email"],
            name=db_user["name"],
            role=db_user.get("role", "viewer")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(**user)

# Models
class Contact(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    photo: Optional[str] = None  # base64
    notes: Optional[str] = ""
    tags: List[str] = []
    isFavorite: bool = False
    rawContactId: Optional[str] = None
    organizationId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    isFavorite: Optional[bool] = None
    birthday: Optional[str] = None  # ISO format date

class Event(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    date: datetime
    type: str  # birthday, anniversary, custom
    contactId: Optional[str] = None
    organizationId: Optional[str] = None
    isRecurring: bool = False
    recurringPattern: Optional[str] = None
    isActive: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    type: Optional[str] = None
    contactId: Optional[str] = None
    isRecurring: Optional[bool] = None
    recurringPattern: Optional[str] = None
    isActive: Optional[bool] = None

class Group(BaseModel):
    id: Optional[str] = None
    name: str
    color: Optional[str] = "#4A90E2"
    contactIds: List[str] = []
    organizationId: Optional[str] = None
    createdAt: Optional[datetime] = None

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    contactIds: Optional[List[str]] = None

class ScheduledMessage(BaseModel):
    id: Optional[str] = None
    groupId: str
    message: str
    scheduledTime: datetime
    isRecurring: bool = False
    recurringPattern: Optional[str] = None  # daily, weekly, monthly
    isActive: bool = True
    status: str = "pending"  # pending, sent, failed
    organizationId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class ScheduledMessageUpdate(BaseModel):
    message: Optional[str] = None
    scheduledTime: Optional[datetime] = None
    isRecurring: Optional[bool] = None
    recurringPattern: Optional[str] = None
    isActive: Optional[bool] = None
    status: Optional[str] = None

class Organization(BaseModel):
    id: Optional[str] = None
    name: str
    color: Optional[str] = "#4A90E2"
    description: Optional[str] = ""
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

# Helper function to convert ObjectId to string
def contact_helper(contact) -> dict:
    return {
        "id": str(contact["_id"]),
        "name": contact["name"],
        "phone": contact["phone"],
        "photo": contact.get("photo"),
        "notes": contact.get("notes", ""),
        "tags": contact.get("tags", []),
        "isFavorite": contact.get("isFavorite", False),
        "rawContactId": contact.get("rawContactId"),
        "organizationId": contact.get("organizationId"),
        "createdAt": contact.get("createdAt"),
        "updatedAt": contact.get("updatedAt")
    }

def group_helper(group) -> dict:
    return {
        "id": str(group["_id"]),
        "name": group["name"],
        "color": group.get("color", "#4A90E2"),
        "contactIds": group.get("contactIds", []),
        "organizationId": group.get("organizationId"),
        "createdAt": group.get("createdAt")
    }

def scheduled_message_helper(scheduled_message) -> dict:
    return {
        "id": str(scheduled_message["_id"]),
        "groupId": scheduled_message["groupId"],
        "message": scheduled_message["message"],
        "scheduledTime": scheduled_message["scheduledTime"],
        "isRecurring": scheduled_message.get("isRecurring", False),
        "recurringPattern": scheduled_message.get("recurringPattern"),
        "isActive": scheduled_message.get("isActive", True),
        "status": scheduled_message.get("status", "pending"),
        "organizationId": scheduled_message.get("organizationId"),
        "createdAt": scheduled_message.get("createdAt"),
        "updatedAt": scheduled_message.get("updatedAt")
    }

def organization_helper(org) -> dict:
    return {
        "id": str(org["_id"]),
        "name": org["name"],
        "color": org.get("color", "#4A90E2"),
        "description": org.get("description", ""),
        "createdAt": org.get("createdAt"),
        "updatedAt": org.get("updatedAt")
    }

def event_helper(event) -> dict:
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "description": event.get("description"),
        "date": event["date"],
        "type": event["type"],
        "contactId": event.get("contactId"),
        "organizationId": event.get("organizationId"),
        "isRecurring": event.get("isRecurring", False),
        "recurringPattern": event.get("recurringPattern"),
        "isActive": event.get("isActive", True),
        "createdAt": event.get("createdAt"),
        "updatedAt": event.get("updatedAt")
    }

# Contact Routes
@api_router.post("/contacts/sync")
async def sync_contacts(contacts: List[Contact]):
    """Sync contacts from device"""
    synced_count = 0
    for contact in contacts:
        # Check if contact already exists by phone
        existing = await db.contacts.find_one({"phone": contact.phone})
        if not existing:
            contact_dict = contact.dict(exclude={"id"})
            contact_dict["createdAt"] = datetime.utcnow()
            contact_dict["updatedAt"] = datetime.utcnow()
            await db.contacts.insert_one(contact_dict)
            synced_count += 1
    return {"message": f"Synced {synced_count} new contacts", "count": synced_count}

@api_router.get("/contacts")
async def get_contacts(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    favorite: Optional[bool] = None,
    groupId: Optional[str] = None,
    organizationId: Optional[str] = None,
    createdAfter: Optional[str] = None,
    createdBefore: Optional[str] = None
):
    """Get all contacts with optional filters"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"notes": {"$regex": search, "$options": "i"}}
        ]
    if tag:
        query["tags"] = tag
    if favorite is not None:
        query["isFavorite"] = favorite
    if groupId:
        group = await db.groups.find_one({"_id": ObjectId(groupId)})
        if group and group.get("contactIds"):
            query["_id"] = {"$in": [ObjectId(cid) for cid in group["contactIds"]]}
    if organizationId:
        query["organizationId"] = organizationId
    if createdAfter:
        query.setdefault("createdAt", {})
        query["createdAt"]["$gte"] = datetime.fromisoformat(createdAfter)
    if createdBefore:
        query.setdefault("createdAt", {})
        query["createdAt"]["$lte"] = datetime.fromisoformat(createdBefore)
    
    contacts = await db.contacts.find(query).sort("name", 1).to_list(1000)
    return [contact_helper(contact) for contact in contacts]

@api_router.get("/contacts/{contact_id}")
async def get_contact(contact_id: str):
    """Get a single contact"""
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact_helper(contact)

@api_router.put("/contacts/{contact_id}")
async def update_contact(contact_id: str, update: ContactUpdate):
    """Update a contact"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        update_data["updatedAt"] = datetime.utcnow()
        result = await db.contacts.update_one(
            {"_id": ObjectId(contact_id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
    
    contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
    return contact_helper(contact)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact"""
    result = await db.contacts.delete_one({"_id": ObjectId(contact_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}

@api_router.get("/tags")
async def get_all_tags(organizationId: Optional[str] = None):
    """Get all unique tags"""
    query = {}
    if organizationId:
        query["organizationId"] = organizationId
    tags = await db.contacts.distinct("tags", query)
    return {"tags": sorted([tag for tag in tags if tag])}

# Group Routes
@api_router.post("/groups")
async def create_group(group: Group):
    """Create a new group"""
    group_dict = group.dict(exclude={"id"})
    group_dict["createdAt"] = datetime.utcnow()
    result = await db.groups.insert_one(group_dict)
    group_dict["_id"] = result.inserted_id
    return group_helper(group_dict)

@api_router.get("/groups")
async def get_groups(organizationId: Optional[str] = None):
    """Get all groups"""
    query = {}
    if organizationId:
        query["organizationId"] = organizationId
    groups = await db.groups.find(query).sort("name", 1).to_list(100)
    return [group_helper(group) for group in groups]

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str):
    """Get a single group with contacts"""
    group = await db.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get contacts in group
    contact_ids = [ObjectId(cid) for cid in group.get("contactIds", [])]
    contacts = await db.contacts.find({"_id": {"$in": contact_ids}}).to_list(1000)
    
    result = group_helper(group)
    result["contacts"] = [contact_helper(contact) for contact in contacts]
    return result

@api_router.put("/groups/{group_id}")
async def update_group(group_id: str, update: GroupUpdate):
    """Update a group"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        result = await db.groups.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Group not found")
    
    group = await db.groups.find_one({"_id": ObjectId(group_id)})
    return group_helper(group)

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    """Delete a group"""
    result = await db.groups.delete_one({"_id": ObjectId(group_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Group deleted successfully"}

class ImportGroup(BaseModel):
    name: str
    color: Optional[str] = "#4A90E2"
    contactPhones: List[str] = []

@api_router.post("/groups/import")
async def import_groups(groups: List[ImportGroup]):
    """Import multiple groups at once, avoiding duplicates by name"""
    imported = 0
    skipped = 0
    for group in groups:
        existing = await db.groups.find_one({"name": group.name})
        if existing:
            skipped += 1
            continue
        # Resolve contacts by phone
        contact_ids = []
        for phone in group.contactPhones:
            contact = await db.contacts.find_one({"phone": phone})
            if contact:
                contact_ids.append(str(contact["_id"]))
        
        group_dict = {
            "name": group.name,
            "color": group.color or "#4A90E2",
            "contactIds": contact_ids,
            "createdAt": datetime.utcnow()
        }
        await db.groups.insert_one(group_dict)
        imported += 1
    
    return {"imported": imported, "skipped": skipped, "total": len(groups)}

# Organization Routes
@api_router.post("/organizations", dependencies=[Depends(require_role("admin"))])
async def create_organization(org: Organization):
    """Create a new organization"""
    org_dict = org.dict(exclude={"id"})
    now = datetime.utcnow()
    org_dict["createdAt"] = now
    org_dict["updatedAt"] = now
    result = await db.organizations.insert_one(org_dict)
    org_dict["_id"] = result.inserted_id
    return organization_helper(org_dict)

@api_router.get("/organizations", dependencies=[Depends(require_role("admin"))])
async def get_organizations():
    """Get all organizations"""
    orgs = await db.organizations.find().sort("name", 1).to_list(100)
    return [organization_helper(org) for org in orgs]

@api_router.get("/organizations/{org_id}", dependencies=[Depends(require_role("admin"))])
async def get_organization(org_id: str):
    """Get a single organization"""
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization_helper(org)

@api_router.put("/organizations/{org_id}", dependencies=[Depends(require_role("admin"))])
async def update_organization(org_id: str, update: OrganizationUpdate):
    """Update an organization"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        update_data["updatedAt"] = datetime.utcnow()
        result = await db.organizations.update_one(
            {"_id": ObjectId(org_id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Organization not found")
    
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    return organization_helper(org)

@api_router.delete("/organizations/{org_id}", dependencies=[Depends(require_role("admin"))])
async def delete_organization(org_id: str):
    """Delete an organization"""
    result = await db.organizations.delete_one({"_id": ObjectId(org_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"message": "Organization deleted successfully"}

# Include router
app.include_router(api_router)

# Scheduled Message Routes
@api_router.post("/scheduled-messages")
async def create_scheduled_message(scheduled_message: ScheduledMessage):
    """Create a new scheduled message"""
    scheduled_message_dict = scheduled_message.dict(exclude={"id"})
    scheduled_message_dict["createdAt"] = datetime.utcnow()
    scheduled_message_dict["updatedAt"] = datetime.utcnow()
    result = await db.scheduled_messages.insert_one(scheduled_message_dict)
    scheduled_message_dict["_id"] = result.inserted_id
    return scheduled_message_helper(scheduled_message_dict)

@api_router.get("/scheduled-messages")
async def get_scheduled_messages(group_id: Optional[str] = None, status: Optional[str] = None, active: Optional[bool] = None, organizationId: Optional[str] = None):
    """Get all scheduled messages with optional filters"""
    query = {}
    if group_id:
        query["groupId"] = group_id
    if status:
        query["status"] = status
    if active is not None:
        query["isActive"] = active
    if organizationId:
        query["organizationId"] = organizationId
    
    scheduled_messages = await db.scheduled_messages.find(query).sort("scheduledTime", 1).to_list(1000)
    return [scheduled_message_helper(msg) for msg in scheduled_messages]

@api_router.get("/scheduled-messages/{message_id}")
async def get_scheduled_message(message_id: str):
    """Get a single scheduled message"""
    scheduled_message = await db.scheduled_messages.find_one({"_id": ObjectId(message_id)})
    if not scheduled_message:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    return scheduled_message_helper(scheduled_message)

@api_router.put("/scheduled-messages/{message_id}")
async def update_scheduled_message(message_id: str, update: ScheduledMessageUpdate):
    """Update a scheduled message"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        update_data["updatedAt"] = datetime.utcnow()
        result = await db.scheduled_messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Scheduled message not found")
    
    scheduled_message = await db.scheduled_messages.find_one({"_id": ObjectId(message_id)})
    return scheduled_message_helper(scheduled_message)

@api_router.delete("/scheduled-messages/{message_id}")
async def delete_scheduled_message(message_id: str):
    """Delete a scheduled message"""
    result = await db.scheduled_messages.delete_one({"_id": ObjectId(message_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    return {"message": "Scheduled message deleted successfully"}

@app.post("/api/scheduled-messages/send")
async def send_scheduled_message(message_id: str):
    """Send a scheduled message immediately"""
    scheduled_message = await db.scheduled_messages.find_one({"_id": ObjectId(message_id)})
    if not scheduled_message:
        raise HTTPException(status_code=404, detail="Scheduled message not found")
    
    try:
        # Get group details
        group = await db.groups.find_one({"_id": ObjectId(scheduled_message["groupId"])})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Send message to WhatsApp (placeholder - would integrate with WhatsApp API)
        await send_whatsapp_message(group, scheduled_message["message"])
        
        # Update status to sent
        await db.scheduled_messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"status": "sent", "updatedAt": datetime.utcnow()}}
        )
        
        return {"message": "Message sent successfully"}
    except Exception as e:
        await db.scheduled_messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"status": "failed", "updatedAt": datetime.utcnow()}}
        )
        raise HTTPException(status_code=500, detail=str(e))

def send_whatsapp_message(group: dict, message: str):
    """Placeholder function to send WhatsApp messages"""
    # In a real implementation, this would integrate with WhatsApp Business API
    print(f"Sending message to group {group['name']}: {message}")
    # Example URL for WhatsApp Web: https://web.whatsapp.com/send?text=message
    return True

# Backup and Restore Routes
@api_router.get("/backup")
async def create_backup():
    """Create a backup of all data"""
    try:
        # Create backup data
        backup_data = {
            "backupId": str(ObjectId()),
            "createdAt": datetime.utcnow(),
            "version": "1.0",
            "contacts": [],
            "groups": [],
            "scheduledMessages": []
        }
        
        # Export contacts
        contacts = await db.contacts.find().to_list(1000)
        backup_data["contacts"] = [contact_helper(contact) for contact in contacts]
        
        # Export groups
        groups = await db.groups.find().to_list(1000)
        backup_data["groups"] = [group_helper(group) for group in groups]
        
        # Export scheduled messages
        scheduled_messages = await db.scheduled_messages.find().to_list(1000)
        backup_data["scheduledMessages"] = [scheduled_message_helper(msg) for msg in scheduled_messages]
        
        # Create ZIP file
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add backup data as JSON
            zip_file.writestr('backup.json', json.dumps(backup_data, indent=2, default=str))
            
            # Add contact photos if they exist
            for contact in backup_data["contacts"]:
                if contact.get("photo"):
                    # In a real implementation, you'd handle image data properly
                    pass
        
        zip_buffer.seek(0)
        
        return {
            "backupId": backup_data["backupId"],
            "createdAt": backup_data["createdAt"],
            "size": len(zip_buffer.getvalue()),
            "data": zip_buffer.getvalue()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@api_router.post("/restore")
async def restore_backup(backup_data: dict):
    """Restore data from backup"""
    try:
        # Clear existing data (optional - add confirmation in production)
        # await db.contacts.delete_many({})
        # await db.groups.delete_many({})
        # await db.scheduled_messages.delete_many({})
        
        # Restore contacts
        if backup_data.get("contacts"):
            for contact in backup_data["contacts"]:
                await db.contacts.insert_one(contact)
        
        # Restore groups
        if backup_data.get("groups"):
            for group in backup_data["groups"]:
                await db.groups.insert_one(group)
        
        # Restore scheduled messages
        if backup_data.get("scheduledMessages"):
            for message in backup_data["scheduledMessages"]:
                await db.scheduled_messages.insert_one(message)
        
        return {
            "message": "Backup restored successfully",
            "contactsCount": len(backup_data.get("contacts", [])),
            "groupsCount": len(backup_data.get("groups", [])),
            "scheduledMessagesCount": len(backup_data.get("scheduledMessages", []))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@api_router.get("/export/contacts")
async def export_contacts():
    """Export contacts as CSV"""
    try:
        contacts = await db.contacts.find().to_list(1000)
        
        # Generate CSV content
        csv_lines = ["Name,Phone,Email,Tags,Favorite,Notes"]
        for contact in contacts:
            tags = ";".join(contact.get("tags", []))
            csv_lines.append(f'"{contact.get("name", "")}","{contact.get("phone", "")}","{tags}","{contact.get("isFavorite", "")}","{contact.get("notes", "")}"')
        
        csv_content = "\n".join(csv_lines)
        
        return {
            "filename": f"contacts_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "content": csv_content,
            "contentType": "text/csv"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@api_router.get("/export/groups")
async def export_groups():
    """Export groups as JSON"""
    try:
        groups = await db.groups.find().to_list(1000)
        
        return {
            "filename": f"groups_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "content": json.dumps(groups, indent=2, default=str),
            "contentType": "application/json"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.get("/download/backup")
async def download_backup():
    """Download backup file"""
    try:
        backup_response = await create_backup()
        
        return {
            "filename": f"whatsapp_organizer_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
            "content": backup_response["data"],
            "contentType": "application/zip"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# Event Routes
@api_router.post("/events")
async def create_event(event: Event):
    """Create a new event"""
    event_dict = event.dict(exclude={"id"})
    event_dict["createdAt"] = datetime.utcnow()
    event_dict["updatedAt"] = datetime.utcnow()
    result = await db.events.insert_one(event_dict)
    event_dict["_id"] = result.inserted_id
    return event_helper(event_dict)

@api_router.get("/events")
async def get_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    type: Optional[str] = None,
    contact_id: Optional[str] = None,
    active: Optional[bool] = None,
    organizationId: Optional[str] = None
):
    """Get all events with optional filters"""
    query = {}
    
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date
    
    if type:
        query["type"] = type
    
    if contact_id:
        query["contactId"] = contact_id
    
    if active is not None:
        query["isActive"] = active
    
    if organizationId:
        query["organizationId"] = organizationId
    
    events = await db.events.find(query).sort("date", 1).to_list(1000)
    return [event_helper(event) for event in events]

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Get a single event"""
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_helper(event)

@api_router.put("/events/{event_id}")
async def update_event(event_id: str, update: EventUpdate):
    """Update an event"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        update_data["updatedAt"] = datetime.utcnow()
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
    
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    return event_helper(event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    """Delete an event"""
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

@api_router.get("/events/upcoming")
async def get_upcoming_events(days_ahead: int = 7, organizationId: Optional[str] = None):
    """Get upcoming events within specified days"""
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=days_ahead)
    
    query = {
        "date": {"$gte": start_date, "$lte": end_date},
        "isActive": True
    }
    if organizationId:
        query["organizationId"] = organizationId
    
    events = await db.events.find(query).sort("date", 1).to_list(100)
    
    return [event_helper(event) for event in events]

@app.post("/api/events/birthday-check")
async def check_birthdays():
    """Check for birthdays and create events if needed"""
    try:
        today = datetime.utcnow()
        
        # Get contacts with birthdays
        contacts = await db.contacts.find({
            "birthday": {"$exists": True}
        }).to_list(1000)
        
        birthday_count = 0
        for contact in contacts:
            if contact.get("birthday"):
                # Parse birthday date
                birthday_date = datetime.fromisoformat(contact["birthday"].replace('Z', '+00:00'))
                
                # Check if birthday event already exists for this year
                existing_event = await db.events.find_one({
                    "contactId": contact["_id"],
                    "type": "birthday",
                    "date": {
                        "$gte": datetime(today.year, birthday_date.month, birthday_date.day, 0, 0, 0),
                        "$lt": datetime(today.year, birthday_date.month, birthday_date.day + 1, 0, 0, 0)
                    }
                })
                
                if not existing_event:
                    # Create birthday event
                    birthday_event = {
                        "title": f"Aniversário de {contact['name']}",
                        "description": f"Hoje é o aniversário de {contact['name']}!",
                        "date": datetime(today.year, birthday_date.month, birthday_date.day, 9, 0, 0),  # 9 AM
                        "type": "birthday",
                        "contactId": str(contact["_id"]),
                        "isRecurring": True,
                        "recurringPattern": "yearly",
                        "isActive": True,
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow()
                    }
                    
                    await db.events.insert_one(birthday_event)
                    birthday_count += 1
        
        return {"message": f"Created {birthday_count} birthday events"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Birthday check failed: {str(e)}")

@app.post("/api/events/notification")
async def send_event_notification(event_id: str):
    """Send notification for an event"""
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get contact details if associated
        contact_name = "Evento"
        if event.get("contactId"):
            contact = await db.contacts.find_one({"_id": ObjectId(event["contactId"])})
            if contact:
                contact_name = contact["name"]
        
        # Send notification (placeholder - would integrate with push notification service)
        notification_data = {
            "title": event["title"],
            "body": event.get("description", f"Evento de {event['type']} para {contact_name}"),
            "data": {
                "eventId": str(event["_id"]),
                "type": event["type"],
                "contactId": event.get("contactId")
            }
        }
        
        # In a real implementation, this would send push notifications
        print(f"Notification sent: {notification_data}")
        
        return {"message": "Notification sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notification failed: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Background scheduler for checking scheduled messages
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    scheduler.start()

async def check_and_send_scheduled_messages():
    """Check for scheduled messages that need to be sent"""
    try:
        now = datetime.now(timezone.utc)
        pending_messages = await db.scheduled_messages.find({
            "scheduledTime": {"$lte": now},
            "status": "pending",
            "isActive": True
        }).to_list(100)
        
        for message in pending_messages:
            try:
                # Get group details
                group = await db.groups.find_one({"_id": ObjectId(message["groupId"])})
                if group:
                    # Send message
                    await send_whatsapp_message(group, message["message"])
                    
                    # Update status
                    await db.scheduled_messages.update_one(
                        {"_id": ObjectId(message["_id"])},
                        {"$set": {"status": "sent", "updatedAt": datetime.utcnow()}}
                    )
                    
                    # Handle recurring messages
                    if message.get("isRecurring") and message.get("recurringPattern"):
                        await schedule_next_recurring_message(message)
                
            except Exception as e:
                await db.scheduled_messages.update_one(
                    {"_id": ObjectId(message["_id"])},
                    {"$set": {"status": "failed", "updatedAt": datetime.utcnow()}}
                )
                
    except Exception as e:
        logger.error(f"Error checking scheduled messages: {e}")

async def schedule_next_recurring_message(message):
    """Schedule the next occurrence of a recurring message"""
    try:
        next_time = message["scheduledTime"]
        
        if message.get("recurringPattern") == "daily":
            next_time += timedelta(days=1)
        elif message.get("recurringPattern") == "weekly":
            next_time += timedelta(weeks=1)
        elif message.get("recurringPattern") == "monthly":
            next_time += timedelta(days=30)
        
        # Create new scheduled message
        new_message = {
            "groupId": message["groupId"],
            "message": message["message"],
            "scheduledTime": next_time,
            "isRecurring": True,
            "recurringPattern": message.get("recurringPattern"),
            "isActive": True,
            "status": "pending",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        await db.scheduled_messages.insert_one(new_message)
        
    except Exception as e:
        logger.error(f"Error scheduling next recurring message: {e}")

async def check_and_send_event_notifications():
    """Check for events that need notifications"""
    try:
        now = datetime.now(timezone.utc)
        tomorrow = now + timedelta(days=1)
        
        # Get events happening tomorrow
        events = await db.events.find({
            "date": {"$gte": now, "$lt": tomorrow},
            "isActive": True,
            "type": {"$in": ["birthday", "anniversary"]}
        }).to_list(50)
        
        for event in events:
            try:
                await send_event_notification(str(event["_id"]))
            except Exception as e:
                logger.error(f"Error sending notification for event {event['_id']}: {e}")
                
    except Exception as e:
        logger.error(f"Error checking event notifications: {e}")

# Schedule the checkers to run at different intervals
scheduler.add_job(check_and_send_scheduled_messages, 'interval', minutes=1)
scheduler.add_job(check_and_send_event_notifications, 'interval', hours=1)
scheduler.add_job(check_birthdays, 'cron', hour=0, minute=0)  # Run daily at midnight


