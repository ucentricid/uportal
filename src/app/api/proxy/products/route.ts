import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const path = queryString ? `/api/v1/backoffice/products?${queryString}` : '/api/v1/backoffice/products';

    const response = await fetchBackoffice(path, { method: 'GET', req });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const response = await fetchBackoffice('/api/v1/backoffice/products', { 
      method: 'POST', 
      req,
      body: formData // fetch will automatically set multipart/form-data and boundary
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
