import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetchBackoffice('/api/v1/public/backoffice/forgot-password', { 
      method: 'POST', 
      req,
      body: JSON.stringify(body) 
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
