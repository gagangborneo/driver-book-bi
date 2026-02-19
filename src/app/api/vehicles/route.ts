import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, VehicleStatus } from '@prisma/client';

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

// Get all vehicles
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status = status;
    }

    const vehicles = await db.vehicle.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { plateNumber, brand, model, year, color, assignedToId } = await request.json();

    if (!plateNumber || !brand || !model || !year || !color) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const existingVehicle = await db.vehicle.findUnique({
      where: { plateNumber },
    });
    if (existingVehicle) {
      return NextResponse.json({ error: 'Nomor plat sudah terdaftar' }, { status: 400 });
    }

    const newVehicle = await db.vehicle.create({
      data: {
        plateNumber,
        brand,
        model,
        year: parseInt(year),
        color,
        status: VehicleStatus.AVAILABLE,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });

    return NextResponse.json({ vehicle: newVehicle });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
