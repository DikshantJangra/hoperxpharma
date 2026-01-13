import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const drugId = searchParams.get('drugId');
    const storeId = searchParams.get('storeId');
    const includePartialMatches = searchParams.get('includePartialMatches') === 'true';

    if (!drugId || !storeId) {
      return NextResponse.json(
        { error: 'drugId and storeId are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/substitutes?drugId=${drugId}&storeId=${storeId}&includePartialMatches=${includePartialMatches}`
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch substitutes' }, { status: 500 });
  }
}
