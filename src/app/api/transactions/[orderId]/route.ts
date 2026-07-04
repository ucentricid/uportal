import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const denied = await requireRole(request, ['superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch(`/cashier-transactions/${orderId}`);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error(`Failed to fetch transaction status for ${orderId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction status' },
      { status: 500 },
    );
  }
}
