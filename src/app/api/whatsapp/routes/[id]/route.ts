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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, groupId, description, isActive } = body;

    const route = await db.whatsAppRoute.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(groupId && { groupId }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(route);
  } catch (error) {
    console.error('Error updating WhatsApp route:', error);
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.whatsAppRoute.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting WhatsApp route:', error);
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
