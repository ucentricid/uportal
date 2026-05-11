import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto-js';

const API_KEY = process.env.NEXT_PUBLIC_UKASIR_API_KEY || '';
const API_SECRET = process.env.NEXT_PUBLIC_UKASIR_API_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_UKASIR_BASE_URL || 'https://api.ukasir.id/v1';

function generateSignature(body: string, timestamp: string) {
  const payload = `${API_KEY}:${timestamp}:${body}`;
  return crypto.HmacSHA256(payload, API_SECRET).toString();
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = `${BASE_URL}/products/${slug}`;

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
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json();
  const url = `${BASE_URL}/products/${slug}`;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = JSON.stringify(body);
    const signature = generateSignature(bodyString, timestamp);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      body: bodyString,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = `${BASE_URL}/products/${slug}`;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = '{}';
    const signature = generateSignature(body, timestamp);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
