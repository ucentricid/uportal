import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto-js';

const API_KEY = process.env.NEXT_PUBLIC_UKASIR_API_KEY || process.env.API_KEY || '';
const API_SECRET = process.env.NEXT_PUBLIC_UKASIR_API_SECRET || process.env.API_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_UKASIR_BASE_URL || 'https://api.ukasir.id/v1';

function generateSignature(body: string, timestamp: string) {
  const payload = `${API_KEY}:${timestamp}:${body}`;
  return crypto.HmacSHA256(payload, API_SECRET).toString();
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const bodyString = JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature(bodyString, timestamp);

    const url = `${BASE_URL}/qris-activations/${id}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
        'x-role': 'superadmin',
      },
      body: bodyString,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to update QRIS activation ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update QRIS activation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = '{}';
    const signature = generateSignature(body, timestamp);

    const url = `${BASE_URL}/qris-activations/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
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
    console.error(`Failed to delete QRIS activation ${id}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete QRIS activation' },
      { status: 500 }
    );
  }
}
