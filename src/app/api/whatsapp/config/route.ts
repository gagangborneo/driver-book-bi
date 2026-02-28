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
    const config = await db.whatsAppConfig.findFirst();
    return NextResponse.json(config || null);
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { deviceId, apiUrl, isActive } = body;

    // Update or create config
    const config = await db.whatsAppConfig.findFirst();
    
    if (config) {
      const updated = await db.whatsAppConfig.update({
        where: { id: config.id },
        data: {
          deviceId: deviceId || config.deviceId,
          apiUrl: apiUrl || config.apiUrl,
          isActive: isActive !== undefined ? isActive : config.isActive,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await db.whatsAppConfig.create({
        data: {
          deviceId,
          apiUrl: apiUrl || 'https://app.whacenter.com/api',
          isActive: isActive !== undefined ? isActive : true,
        },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
