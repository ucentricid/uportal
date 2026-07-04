import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ ip: string }> }
) {
  try {
    const params = await props.params;
    const response = await fetchBackoffice(`/api/v1/backoffice/ips/${encodeURIComponent(params.ip)}/approve`, { 
      method: 'PUT', 
      req 
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
