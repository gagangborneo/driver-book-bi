import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, LogBookType } from '@prisma/client';

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.split(':')[0];
  } catch {
    return null;
  }
}

// Get all logbooks
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');

    const whereClause: Record<string, unknown> = {};

    // Filter by user role
    if (user.role === UserRole.DRIVER) {
      whereClause.driverId = userId;
    } else if (driverId) {
      whereClause.driverId = driverId;
    }

    if (vehicleId) {
      whereClause.vehicleId = vehicleId;
    }

    if (type) {
      whereClause.type = type;
    }

    const logBooks = await db.logBook.findMany({
      where: whereClause,
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true, role: true } },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ logBooks });
  } catch (error) {
    console.error('Get logbooks error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create new logbook entry
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== UserRole.DRIVER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { vehicleId, type, description, date, cost, odometer } = await request.json();

    if (!vehicleId || !type || !description || !date) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const newLogBook = await db.logBook.create({
      data: {
        driverId: userId,
        vehicleId,
        type: type as LogBookType,
        description,
        date: new Date(date),
        cost: cost ? parseFloat(cost) : null,
        odometer: odometer ? parseInt(odometer) : null,
      },
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true, role: true } },
        vehicle: true,
      },
    });

    return NextResponse.json({ logBook: newLogBook });
  } catch (error) {
    console.error('Create logbook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
