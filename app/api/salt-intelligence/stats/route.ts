import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');

    console.log('[API /salt-intelligence/stats] Request received, storeId:', storeId);

    if (!storeId) {
      console.log('[API /salt-intelligence/stats] Missing storeId');
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/api/v1/salt-intelligence/stats?storeId=${storeId}`;
    console.log('[API /salt-intelligence/stats] Calling backend:', apiUrl);

    const response = await fetch(apiUrl);
    
    console.log('[API /salt-intelligence/stats] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[API /salt-intelligence/stats] Backend response data:', JSON.stringify(data));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /salt-intelligence/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
