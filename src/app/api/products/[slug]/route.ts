import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch(`/products/${slug}`);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { status, data } = await ukasirFetch(`/products/${slug}`, {
      method: 'PUT',
      body,
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const { status, data } = await ukasirFetch(`/products/${slug}`, {
      method: 'DELETE',
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 },
    );
  }
}
