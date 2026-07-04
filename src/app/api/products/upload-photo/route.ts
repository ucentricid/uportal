import { NextRequest, NextResponse } from 'next/server';
import { ukasirFetch } from '@/lib/ukasir';
import { requireRole } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const denied = await requireRole(request, ['admin', 'superadmin']);
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const { status, data } = await ukasirFetch('/products/upload-photo', {
      method: 'POST',
      body: formData,
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 },
    );
  }
}
