import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, DriverStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Simple token validation
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

// Get all users
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    const whereClause: Record<string, unknown> = {};
    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    const users = await db.user.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Create new user
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

    const { email, password, name, phone, role: newRole } = await request.json();

    if (!email || !password || !name || !newRole) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: newRole as UserRole,
        isActive: true,
        driverStatus: newRole === 'DRIVER' ? DriverStatus.OFFLINE : null,
      },
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

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
