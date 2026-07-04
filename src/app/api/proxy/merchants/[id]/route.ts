import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await fetchBackoffice(`/api/v1/backoffice/partnership/user/${id}`, { method: 'GET', req });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const response = await fetchBackoffice(`/api/v1/backoffice/partnership/user/${id}`, { 
      method: 'PUT', 
      req,
      body: formData
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await fetchBackoffice(`/api/v1/backoffice/partnership/user/${id}`, { method: 'DELETE', req });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
