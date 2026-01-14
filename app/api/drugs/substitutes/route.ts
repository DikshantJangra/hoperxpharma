import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/drugs/substitutes
 * Find substitute medicines with the same salt composition
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const drugId = searchParams.get('drugId');
    let storeId = searchParams.get('storeId');

    if (!drugId) {
      return NextResponse.json({ error: 'drugId is required' }, { status: 400 });
    }

    // If storeId is 'default', get it from user session/cookies
    if (!storeId || storeId === 'default') {
      // Try to get from cookies or return empty array
      console.log('[Substitutes API] No valid storeId, returning empty array');
      return NextResponse.json([]);
    }

    const params = new URLSearchParams();
    params.append('drugId', drugId);
    params.append('storeId', storeId);

    console.log('[Substitutes API] Fetching for drugId:', drugId, 'storeId:', storeId);
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/substitutes?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Substitutes API] Backend error:', response.status, errorText);
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error
    }
    
    const data = await response.json();
    console.log('[Substitutes API] Success, found:', Array.isArray(data) ? data.length : 0, 'substitutes');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Substitutes API] Error:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}
