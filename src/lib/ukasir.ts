import crypto from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Server-only client for the ukasir backend API.
 *
 * IMPORTANT: these secrets must NEVER be exposed to the browser, so we only read
 * the non-public variants here (no NEXT_PUBLIC_ prefix). Route handlers run on
 * the server, so this module is safe to import from API route files only.
 */
const API_KEY =
  process.env.UKASIR_API_KEY || process.env.API_KEY || '';
const API_SECRET =
  process.env.UKASIR_API_SECRET || process.env.API_SECRET || '';
const BASE_URL =
  process.env.UKASIR_BASE_URL ||
  process.env.NEXT_PUBLIC_UKASIR_BASE_URL ||
  'https://api.ukasir.id/v1';

/** Build the HMAC-SHA256 signature expected by the ukasir backend. */
function generateSignature(body: string, timestamp: string): string {
  const payload = `${API_KEY}:${timestamp}:${body}`;
  return crypto
    .createHmac('sha256', API_SECRET)
    .update(payload)
    .digest('hex');
}

function buildUrl(
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = `${BASE_URL}${cleanPath}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export interface UkasirFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Query params; empty values are dropped automatically. */
  query?: Record<string, string | undefined>;
  /**
   * Request body. Plain objects are JSON-serialized; `FormData` is forwarded
   * untouched (signature computed from `{}` as the backend expects for multipart).
   * Omit for GET/DELETE-with-empty-body.
   */
  body?: unknown;
  /** Optional value for the `x-role` header (e.g. `superadmin`). */
  role?: string;
}

export interface UkasirResponse<T = unknown> {
  status: number;
  data: T;
}

/**
 * Perform a signed request against the ukasir backend and return its parsed JSON.
 * The signature is always computed over the *canonical* body string the backend
 * uses to verify (`'{}'` for GET/DELETE/multipart, the JSON string otherwise).
 */
export async function ukasirFetch<T = unknown>(
  path: string,
  options: UkasirFetchOptions = {},
): Promise<UkasirResponse<T>> {
  const { method = 'GET', query, body, role } = options;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const bodyString =
    isFormData || body === undefined || body === null
      ? '{}'
      : JSON.stringify(body);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateSignature(bodyString, timestamp);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-timestamp': timestamp,
    'x-signature': signature,
  };
  if (role) headers['x-role'] = role;

  // For multipart, let fetch set the boundary — drop our explicit Content-Type.
  let fetchBody: BodyInit | undefined;
  if (isFormData) {
    delete headers['Content-Type'];
    fetchBody = body as FormData;
  } else if (body !== undefined && body !== null) {
    fetchBody = bodyString;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: fetchBody,
  });

  const data = (await response.json()) as T;
  return { status: response.status, data };
}

/**
 * Collect query params from a NextRequest for proxying to the backend.
 * Always includes `page` + `limit` (with defaults), plus any optional keys
 * that are present. Pass the exact (possibly snake_case) param names to forward.
 */
export function collectQuery(
  request: NextRequest,
  options: {
    defaultLimit?: string;
    optional?: string[];
  } = {},
): Record<string, string> {
  const { defaultLimit = '20', optional = [] } = options;
  const sp = request.nextUrl.searchParams;
  const query: Record<string, string> = {
    page: sp.get('page') || '1',
    limit: sp.get('limit') || defaultLimit,
  };
  for (const key of optional) {
    const value = sp.get(key);
    if (value) query[key] = value;
  }
  return query;
}
