import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function POST(req: NextRequest) {
  try {
    const response = await fetchBackoffice('/api/v1/public/backoffice/logout', {
      method: 'POST',
      req, // Forward auth token/cookies
    });

    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward cookie clears if any
    const cookies = response.headers.getSetCookie();
    if (cookies) {
      cookies.forEach((cookie) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }

    return nextResponse;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
