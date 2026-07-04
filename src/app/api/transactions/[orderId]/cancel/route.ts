import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const denied = await requireRole(request, ['superadmin']);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { status, data } = await ukasirFetch(
      `/cashier-transactions/${orderId}/cancel`,
      { method: 'POST', body },
    );
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error(`Failed to cancel transaction ${orderId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel transaction' },
      { status: 500 },
    );
  }
}
