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
    const payload = await request.json();
    const { status, data } = await ukasirFetch(`/withdrawals/${id}`, {
      method: 'PUT',
      body: payload,
      role: 'superadmin',
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error(`Failed to update withdrawal ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update withdrawal' },
      { status: 500 },
    );
  }
}
