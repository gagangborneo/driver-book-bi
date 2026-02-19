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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUserId = getUserIdFromToken(request.headers.get('authorization'));
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingLogBook = await db.logBook.findUnique({ where: { id } });
    if (!existingLogBook) {
      return NextResponse.json({ error: 'LogBook not found' }, { status: 404 });
    }

    // Check ownership or admin
    if (existingLogBook.driverId !== currentUserId && currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    if (data.type) updateData.type = data.type as LogBookType;
    if (data.description) updateData.description = data.description;
    if (data.date) updateData.date = new Date(data.date);
    if (data.cost !== undefined) updateData.cost = data.cost ? parseFloat(data.cost) : null;
    if (data.odometer !== undefined) updateData.odometer = data.odometer ? parseInt(data.odometer) : null;

    const updatedLogBook = await db.logBook.update({
      where: { id },
      data: updateData,
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true, role: true } },
        vehicle: true,
      },
    });

    return NextResponse.json({ logBook: updatedLogBook });
  } catch (error) {
    console.error('Update logbook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUserId = getUserIdFromToken(request.headers.get('authorization'));
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingLogBook = await db.logBook.findUnique({ where: { id } });
    if (!existingLogBook) {
      return NextResponse.json({ error: 'LogBook not found' }, { status: 404 });
    }

    // Check ownership or admin
    if (existingLogBook.driverId !== currentUserId && currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.logBook.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete logbook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
