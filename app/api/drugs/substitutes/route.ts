import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/drugs/substitutes
 * Find substitute medicines with the same salt composition
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const drugId = searchParams.get('drugId');
    const storeId = searchParams.get('storeId');

    if (!drugId) {
      return NextResponse.json({ error: 'drugId is required' }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('drugId', drugId);
    params.append('storeId', storeId);

    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/drugs/substitutes?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch substitutes' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Substitutes API error:', error);
    return NextResponse.json({ error: 'Failed to fetch substitutes' }, { status: 500 });
  }
}
