import { setCache, getCache } from './cache';
import { addToQueue } from './sync';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function get<T>(endpoint: string, cacheKey?: string, ttlMinutes = 30): Promise<{ data: T; fromCache: boolean }> {
  try {
    const data = await request<T>(endpoint);
    if (cacheKey) setCache(cacheKey, data, ttlMinutes);
    return { data, fromCache: false };
  } catch {
    if (cacheKey) {
      const cached = await getCache<T>(cacheKey);
      if (cached) return { data: cached, fromCache: true };
    }
    throw new Error('Sem conexão e sem dados em cache');
  }
}

export async function post<T>(endpoint: string, body?: any): Promise<T> {
  try {
    return await request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : null,
    });
  } catch {
    await addToQueue({ endpoint, method: 'POST', body });
    throw new Error('Operação enfileirada para sincronização');
  }
}

export async function put<T>(endpoint: string, body?: any): Promise<T> {
  try {
    return await request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : null,
    });
  } catch {
    await addToQueue({ endpoint, method: 'PUT', body });
    throw new Error('Operação enfileirada para sincronização');
  }
}

export async function del<T = void>(endpoint: string): Promise<T> {
  try {
    return await request<T>(endpoint, { method: 'DELETE' });
  } catch {
    await addToQueue({ endpoint, method: 'DELETE' });
    throw new Error('Operação enfileirada para sincronização');
  }
}
