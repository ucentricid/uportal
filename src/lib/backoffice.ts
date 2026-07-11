import { NextRequest } from 'next/server';
import crypto from 'crypto';

const API_URL = process.env.BACKOFFICE_API_URL || 'https://api-dev.ucentric.id';
const API_KEY = process.env.BACKOFFICE_API_KEY || '';
const API_SECRET = process.env.BACKOFFICE_API_SECRET || '';

const rawKey = process.env.BACKOFFICE_RSA_PRIVATE_KEY || '';
let RSA_PRIVATE_KEY = '';

const beginMarker = '-----BEGIN RSA PRIVATE KEY-----';
const endMarker = '-----END RSA PRIVATE KEY-----';

if (rawKey.includes(beginMarker) && rawKey.includes(endMarker)) {
  // Extract base64 content between markers
  let base64Data = rawKey.substring(
    rawKey.indexOf(beginMarker) + beginMarker.length,
    rawKey.indexOf(endMarker)
  );
  
  // Remove all whitespace, literal \n, literal \r, and any surrounding quotes
  base64Data = base64Data.replace(/\\n/g, '').replace(/\\r/g, '').replace(/['"]/g, '').replace(/\s+/g, '');
  
  // Chunk into 64 characters
  const chunks = [];
  for (let i = 0; i < base64Data.length; i += 64) {
    chunks.push(base64Data.substring(i, i + 64));
  }
  
  RSA_PRIVATE_KEY = `${beginMarker}\n${chunks.join('\n')}\n${endMarker}\n`;
} else {
  // Fallback
  RSA_PRIVATE_KEY = rawKey.replace(/\\n/g, '\n');
}

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
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  mergedHeaders.set('X-Timestamp', timestamp);
  
  const method = (restOptions.method || 'GET').toUpperCase();
  let bodyString = '';
  if (restOptions.body && typeof restOptions.body === 'string') {
    bodyString = restOptions.body;
  }
  
  const dataToSign = `${method}:${cleanPath}:${timestamp}:${bodyString}`;
  if (RSA_PRIVATE_KEY) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(dataToSign);
    sign.end();
    const signatureBase64 = sign.sign(RSA_PRIVATE_KEY, 'base64');
    mergedHeaders.set('X-Signature', signatureBase64);
  }

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
