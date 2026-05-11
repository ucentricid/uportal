import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto-js';

const API_KEY = process.env.NEXT_PUBLIC_UKASIR_API_KEY || '';
const API_SECRET = process.env.NEXT_PUBLIC_UKASIR_API_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_UKASIR_BASE_URL || 'https://api.ukasir.id/v1';

function generateSignature(body: string, timestamp: string) {
  const payload = `${API_KEY}:${timestamp}:${body}`;
  return crypto.HmacSHA256(payload, API_SECRET).toString();
}

export async function POST(request: NextRequest) {
  const url = `${BASE_URL}/products/upload-photo`;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // For multipart/form-data, signature is calculated from empty body {}
    const body = '{}';
    const signature = generateSignature(body, timestamp);

    // Get the form data from the request
    const formData = await request.formData();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
