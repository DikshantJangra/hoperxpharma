import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drugId, saltLinks } = body;

    if (!drugId) {
      return NextResponse.json({ error: 'drugId is required' }, { status: 400 });
    }

    if (!saltLinks || !Array.isArray(saltLinks)) {
      return NextResponse.json({ error: 'saltLinks must be an array' }, { status: 400 });
    }

    // Frontend validation - check each salt entry (only if there are salts)
    if (saltLinks.length > 0) {
      const validationErrors: string[] = [];
      saltLinks.forEach((salt: any, index: number) => {
        if (!salt.name || typeof salt.name !== 'string' || salt.name.trim().length < 2) {
          validationErrors.push(`Salt ${index + 1}: Name must be at least 2 characters`);
        }
        if (salt.strengthValue === null || salt.strengthValue === undefined || salt.strengthValue <= 0) {
          validationErrors.push(`Salt ${index + 1}: Strength must be greater than 0`);
        }
        if (!salt.strengthUnit || typeof salt.strengthUnit !== 'string' || salt.strengthUnit.trim().length === 0) {
          validationErrors.push(`Salt ${index + 1}: Unit is required`);
        }
      });

      if (validationErrors.length > 0) {
        return NextResponse.json({ 
          error: 'Validation failed', 
          details: validationErrors 
        }, { status: 400 });
      }
    }

    console.log('[Update Composition] Updating drug:', drugId, 'with salts:', saltLinks.length > 0 ? saltLinks : '(clearing composition)');

    const response = await fetch(`${process.env.BACKEND_URL}/api/v1/drugs/${drugId}/composition`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saltLinks }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Update Composition] Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to update composition', details: errorData.details },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Update Composition] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update composition', message: error.message },
      { status: 500 }
    );
  }
}
