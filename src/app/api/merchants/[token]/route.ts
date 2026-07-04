import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch(`/merchants/${token}`);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to fetch merchant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchant' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { status, data } = await ukasirFetch(`/merchants/${token}`, {
      method: 'PUT',
      body,
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to update merchant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update merchant' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch(`/merchants/${token}`, {
      method: 'DELETE',
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to delete merchant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete merchant' },
      { status: 500 },
    );
  }
}
