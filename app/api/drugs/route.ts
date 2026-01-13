import { NextRequest, NextResponse } from 'next/server';

// This would connect to your backend service
// For now, creating the API structure

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');

    // Call backend drug service
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/drugs?storeId=${storeId}&status=${status}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drugs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call backend drug service to create drug
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/drugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create drug' }, { status: 500 });
  }
}
