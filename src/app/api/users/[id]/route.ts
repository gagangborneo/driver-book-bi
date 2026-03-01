import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, DriverStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { verifyToken } from '@/lib/auth-utils';

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  return payload?.userId || null;
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
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        driverStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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
    const { id } = await params;

    // Users can only update their own profile unless admin
    if (currentUserId !== id && currentUser?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    // If password change is requested, verify current password first
    if (data.password) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: 'Password saat ini diperlukan untuk mengubah password' }, { status: 400 });
      }

      const isPasswordValid = await bcrypt.compare(data.currentPassword, existingUser.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Password saat ini tidak sesuai' }, { status: 400 });
      }

      if (data.password.length < 6) {
        return NextResponse.json({ error: 'Password harus minimal 6 karakter' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.name) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role && currentUser?.role === UserRole.ADMIN) updateData.role = data.role;
    
    if (data.driverStatus !== undefined) {
      // Validate driverStatus is a valid enum value
      const validStatuses = [DriverStatus.AVAILABLE, DriverStatus.ON_TRIP, DriverStatus.OFFLINE, DriverStatus.ON_BREAK];
      if (!validStatuses.includes(data.driverStatus)) {
        return NextResponse.json({ error: 'Status driver tidak valid' }, { status: 400 });
      }
      updateData.driverStatus = data.driverStatus as DriverStatus;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        driverStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
    const { id } = await params;

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
