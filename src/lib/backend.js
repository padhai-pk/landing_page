import {
  backendNotConfiguredMessage,
  formatBackendError,
  networkErrorMessage,
} from './apiErrors.js';

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

async function requestBackend(method, path, body) {
  if (!BASE_URL) {
    throw new Error(backendNotConfiguredMessage());
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(networkErrorMessage());
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(formatBackendError(res.status, data));
  }
  return data;
}

export async function postToBackend(path, body) {
  return requestBackend('POST', path, body);
}

export async function getFromBackend(path) {
  return requestBackend('GET', path);
}
