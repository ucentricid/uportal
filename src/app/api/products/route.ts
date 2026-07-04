import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch, collectQuery } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch('/products', {
      query: collectQuery(request, { optional: ['search', 'status'] }),
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { status, data } = await ukasirFetch('/products', {
      method: 'POST',
      body,
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 },
    );
  }
}
