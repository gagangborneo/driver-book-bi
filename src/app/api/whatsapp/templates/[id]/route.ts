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
    const { name, type, content, isActive } = body;

    const template = await db.whatsAppTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(content && { content }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating WhatsApp template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
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
    await db.whatsAppTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting WhatsApp template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
