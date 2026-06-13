import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto-js';

const API_KEY = process.env.NEXT_PUBLIC_UKASIR_API_KEY || process.env.API_KEY || '';
const API_SECRET = process.env.NEXT_PUBLIC_UKASIR_API_SECRET || process.env.API_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_UKASIR_BASE_URL || 'https://api.ukasir.id/v1';

function generateSignature(body: string, timestamp: string) {
  const payload = `${API_KEY}:${timestamp}:${body}`;
  return crypto.HmacSHA256(payload, API_SECRET).toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '100';
  const search = searchParams.get('search') || '';
  const merchantName = searchParams.get('merchant_name') || '';
  const paymentStatus = searchParams.get('payment_status') || '';
  const tokenNumber = searchParams.get('token_number') || '';

  const queryParams: any = { page, limit };
  if (search) queryParams.search = search;
  if (merchantName) queryParams.merchant_name = merchantName;
  if (paymentStatus) queryParams.payment_status = paymentStatus;
  if (tokenNumber) queryParams.token_number = tokenNumber;

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${BASE_URL}/transactions?${queryString}`;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = '{}';
    const signature = generateSignature(body, timestamp);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
        'x-role': 'superadmin',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
