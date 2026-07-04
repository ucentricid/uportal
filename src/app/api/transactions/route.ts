import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const dummyData = [
    { id: '1', merchantName: 'Toko Budi', amount: 50000, status: 'SUCCESS', createdAt: '2026-07-04T10:00:00Z' },
    { id: '2', merchantName: 'Warung Sederhana', amount: 150000, status: 'PENDING', createdAt: '2026-07-04T11:00:00Z' },
    { id: '3', merchantName: 'Toko Budi', amount: 20000, status: 'FAILED', createdAt: '2026-07-04T12:00:00Z' },
  ];
  return NextResponse.json({ success: true, data: dummyData, meta: { total: 3, page: 1, limit: 100 } }, { status: 200 });
}
