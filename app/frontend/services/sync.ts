import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@sync_queue';

export interface SyncOperation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: any;
  createdAt: number;
  retries: number;
}

export async function addToQueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retries'>): Promise<void> {
  const queue = await getQueue();
  const newOp: SyncOperation = {
    ...operation,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    retries: 0,
  };
  queue.push(newOp);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<SyncOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter(op => op.id !== id)));
}

export async function processQueue(baseUrl: string): Promise<{ success: number; failed: number }> {
  const queue = await getQueue();
  let success = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      const options: RequestInit = {
        method: op.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (op.body && op.method !== 'DELETE') {
        options.body = JSON.stringify(op.body);
      }
      const response = await fetch(`${baseUrl}${op.endpoint}`, options);
      if (response.ok) {
        await removeFromQueue(op.id);
        success++;
      } else {
        op.retries++;
        if (op.retries >= 5) {
          await removeFromQueue(op.id);
        }
        failed++;
      }
    } catch {
      op.retries++;
      if (op.retries >= 5) {
        await removeFromQueue(op.id);
      }
      failed++;
    }
  }

  const updated = await getQueue();
  if (updated.length > 0) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  }

  return { success, failed };
}

export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
