import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const limit = searchParams.get('limit') || '10';

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name parameter is required (min 2 chars)' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('name', name);
    params.append('limit', limit);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/drugs/similar?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch similar drugs' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    console.error('Similar drugs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch similar drugs' }, { status: 500 });
  }
}
