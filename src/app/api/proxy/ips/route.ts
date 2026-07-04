import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function GET(req: NextRequest) {
  try {
    const response = await fetchBackoffice('/api/v1/backoffice/ips', { method: 'GET', req });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
