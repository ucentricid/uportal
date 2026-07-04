import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch, collectQuery } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch('/merchants', {
      query: collectQuery(request, { optional: ['search'] }),
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to fetch merchants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchants' },
      { status: 500 },
    );
  }
}
