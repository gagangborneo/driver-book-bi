import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth-utils';

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }

  const user = verifyToken(token);
  return user && user.role === 'ADMIN' ? user : null;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const routes = await db.whatsAppRoute.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching WhatsApp routes:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, groupId, type, description, isActive } = body;

    if (!name || !groupId) {
      return NextResponse.json(
        { error: 'Name and groupId are required' },
        { status: 400 }
      );
    }

    const route = await db.whatsAppRoute.create({
      data: {
        name,
        groupId,
        type: type || 'BOOKING',
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp route:', error);
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}
