import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Return dummy data for QRIS activations
  const dummyData = [
    { id: '1', merchantName: 'Toko Budi', status: 'PENDING', submittedAt: '2026-07-01T10:00:00Z' },
    { id: '2', merchantName: 'Warung Sederhana', status: 'ACTIVE', submittedAt: '2026-07-02T11:30:00Z' },
  ];
  
  return NextResponse.json({ success: true, data: dummyData }, { status: 200 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Dummy QRIS activation created' }, { status: 201 });
}
