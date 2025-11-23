import { NextRequest } from 'next/server';

export function jsonRequest(
  url: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>
) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

export function mockParams<T extends Record<string, string>>(params: T) {
  return Promise.resolve(params);
}
