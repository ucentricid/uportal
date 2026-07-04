import { NextRequest, NextResponse } from 'next/server';
import { fetchBackoffice } from '@/lib/backoffice';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Call the Backoffice Login API
    const response = await fetchBackoffice('/api/v1/public/backoffice/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("LOGIN RESPONSE:", data);
    
    // Forward the response and the set-cookie headers
    const nextResponse = NextResponse.json(data, { status: response.status });
    
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
