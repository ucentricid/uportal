import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const denied = await requireRole(request, ['superadmin']);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { status, data } = await ukasirFetch(`/qris-activations/${id}`, {
      method: 'PUT',
      body,
      role: 'superadmin',
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error(`Failed to update QRIS activation ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update QRIS activation' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const denied = await requireRole(request, ['superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch(`/qris-activations/${id}`, {
      method: 'DELETE',
      role: 'superadmin',
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error(`Failed to delete QRIS activation ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete QRIS activation' },
      { status: 500 },
    );
  }
}
