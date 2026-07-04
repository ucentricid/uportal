import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side auth helpers for API route handlers.
 *
 * Since we don't hold the JWT signing secret in this app, we can't verify the
 * access token locally. Instead we ask the auth backend (`GET /api/auth/me`)
 * to validate the Bearer token and tell us the user's role. This module is
 * server-only — never import it from a Client Component.
 */

const AUTH_URL =
  process.env.AUTH_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://auth.ucentric.id';

export type Role = 'user' | 'admin' | 'superadmin';

export interface VerifiedAuth {
  role: Role;
}

// --- Short-lived in-process cache to soften the per-request /me round-trip. ---
// Keyed by token hash; entries expire after CACHE_TTL_MS. This trades a little
// staleness for far fewer calls to the auth backend under load.
const CACHE_TTL_MS = 30_000;
const authCache = new Map<string, { auth: VerifiedAuth | null; expiresAt: number }>();

function tokenKey(token: string): string {
  // Simple FNV-1a hash — not for security, just to avoid storing raw tokens.
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Validate the incoming request's Bearer token against the auth backend and
 * return the user's role. Returns `null` for missing/invalid/expired tokens.
 */
export async function verifyAuth(
  request: NextRequest,
): Promise<VerifiedAuth | null> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const key = tokenKey(token);
  const cached = authCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.auth;
  }

  let auth: VerifiedAuth | null = null;
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      // Don't let a slow auth backend hang the whole request indefinitely.
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data?.role) {
        auth = { role: json.data.role as Role };
      }
    }
  } catch {
    // Network/timeout/parse error — treat as unverified (don't cache failures).
    return null;
  }

  authCache.set(key, { auth, expiresAt: Date.now() + CACHE_TTL_MS });
  return auth;
}

function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

function forbidden(message = 'Insufficient permissions') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Guard for API route handlers. Verifies the request is authenticated AND that
 * the caller's role is in `allowedRoles`.
 *
 * Returns a `NextResponse` (401/403) to send back when access is denied, or
 * `null` when the caller is authorized and the handler should proceed:
 *
 *   const denied = await requireRole(request, ['superadmin']);
 *   if (denied) return denied;
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Role[],
): Promise<NextResponse | null> {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();
  if (!allowedRoles.includes(auth.role)) return forbidden();
  return null;
}
