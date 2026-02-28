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
    const templates = await db.whatsAppTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, content, isActive } = body;

    if (!name || !type || !content) {
      return NextResponse.json(
        { error: 'Name, type, and content are required' },
        { status: 400 }
      );
    }

    const template = await db.whatsAppTemplate.create({
      data: {
        name,
        type,
        content,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
