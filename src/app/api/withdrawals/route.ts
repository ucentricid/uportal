import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const dummyData = [
    { id: '1', merchantName: 'Toko Budi', amount: 500000, status: 'PENDING', createdAt: '2026-07-04T10:00:00Z' },
    { id: '2', merchantName: 'Warung Sederhana', amount: 1500000, status: 'COMPLETED', createdAt: '2026-07-03T11:00:00Z' },
  ];
  return NextResponse.json({ success: true, data: dummyData, meta: { total: 2, page: 1, limit: 100 } }, { status: 200 });
}
