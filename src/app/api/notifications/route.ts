import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const dummyData = [
    { id: '1', title: 'Promo Kemerdekaan', message: 'Diskon 50% untuk transaksi pertama', status: 'SENT', sentAt: '2026-07-04T10:00:00Z' },
    { id: '2', title: 'Maintenance Server', message: 'Downtime pada tanggal 10 Juli 2026', status: 'DRAFT', sentAt: null },
  ];
  return NextResponse.json({ success: true, data: dummyData, meta: { total: 2, page: 1, limit: 100 } }, { status: 200 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Dummy notification created' }, { status: 201 });
}
