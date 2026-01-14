import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const manufacturer = searchParams.get('manufacturer');
    const hasComposition = searchParams.get('hasComposition');

    // Get storeId from user data (should be in localStorage on client, but we need it here)
    // For now, we'll get it from the request or use a default approach
    const userStr = request.cookies.get('user')?.value;
    let storeId = searchParams.get('storeId');
    
    if (!storeId && userStr) {
      try {
        const user = JSON.parse(userStr);
        storeId = user.storeId;
      } catch (e) {
        console.error('Failed to parse user cookie:', e);
      }
    }

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('storeId', storeId);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (manufacturer) params.append('manufacturer', manufacturer);
    if (hasComposition) params.append('hasComposition', hasComposition);

    console.log('Fetching drugs from backend:', `${process.env.BACKEND_URL}/api/v1/drugs/bulk?${params}`);
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/drugs/bulk?${params}`);
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Failed to fetch drugs' };
      }
      
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch drugs', details: errorData }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Backend returned data, count:', Array.isArray(data) ? data.length : 'not an array');

    // Ensure we always return an array
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    console.error('Bulk drugs API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch drugs', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
