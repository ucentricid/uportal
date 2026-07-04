import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { status, data } = await ukasirFetch('/unlink-device', {
      method: 'POST',
      body,
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to unlink device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unlink device' },
      { status: 500 },
    );
  }
}
