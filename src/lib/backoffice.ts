import { NextRequest } from 'next/server';

const API_URL = process.env.BACKOFFICE_API_URL || 'https://api-dev.ucentric.id';
const API_KEY = process.env.BACKOFFICE_API_KEY || '';
const API_SECRET = process.env.BACKOFFICE_API_SECRET || '';

interface BackofficeFetchOptions extends RequestInit {
  req?: NextRequest;
}

/**
 * Server-only helper to call the Backoffice API.
 * Automatically injects X-API-KEY and X-API-SECRET.
 * Automatically forwards Authorization Bearer token or cookies if a NextRequest is provided.
 */
export async function fetchBackoffice(path: string, options: BackofficeFetchOptions = {}) {
  const { req, headers, ...restOptions } = options;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;
  
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set('X-API-KEY', API_KEY);
  mergedHeaders.set('X-API-SECRET', API_SECRET);
  
  // Default to JSON if not sending FormData
  if (!mergedHeaders.has('Content-Type') && !(restOptions.body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  // If a NextRequest is provided, forward auth headers and cookies
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      mergedHeaders.set('Authorization', authHeader);
    }
    
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      mergedHeaders.set('Cookie', cookieHeader);
    }
  }

  return fetch(url, {
    ...restOptions,
    headers: mergedHeaders,
  });
}
