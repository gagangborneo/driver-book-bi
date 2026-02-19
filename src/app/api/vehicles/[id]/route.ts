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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true, role: true } },
        logBooks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            driver: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existingVehicle = await db.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    if (data.plateNumber) updateData.plateNumber = data.plateNumber;
    if (data.brand) updateData.brand = data.brand;
    if (data.model) updateData.model = data.model;
    if (data.year) updateData.year = parseInt(data.year);
    if (data.color) updateData.color = data.color;
    if (data.status) updateData.status = data.status as VehicleStatus;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

    const updatedVehicle = await db.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });

    return NextResponse.json({ vehicle: updatedVehicle });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await db.vehicle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
