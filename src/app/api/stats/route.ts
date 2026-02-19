import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, BookingStatus, VehicleStatus } from '@prisma/client';

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

    const activeStatuses: BookingStatus[] = [
      BookingStatus.APPROVED,
      BookingStatus.DEPARTED,
      BookingStatus.ARRIVED,
      BookingStatus.RETURNING,
    ];

    if (user.role === UserRole.ADMIN) {
      // Admin stats
      const [totalUsers, totalEmployees, totalDrivers, totalVehicles, availableVehicles, totalBookings, pendingBookings, completedBookings, inProgressBookings] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { role: UserRole.EMPLOYEE } }),
        db.user.count({ where: { role: UserRole.DRIVER } }),
        db.vehicle.count(),
        db.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
        db.booking.count(),
        db.booking.count({ where: { status: BookingStatus.PENDING } }),
        db.booking.count({ where: { status: BookingStatus.COMPLETED } }),
        db.booking.count({ where: { status: { in: activeStatuses } } }),
      ]);

      return NextResponse.json({
        totalUsers,
        totalEmployees,
        totalDrivers,
        totalVehicles,
        availableVehicles,
        totalBookings,
        pendingBookings,
        completedBookings,
        inProgressBookings,
      });
    } else if (user.role === UserRole.DRIVER) {
      // Driver stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [pendingBookings, completedBookings, todayBookings] = await Promise.all([
        db.booking.count({ where: { driverId: userId, status: BookingStatus.PENDING } }),
        db.booking.count({ where: { driverId: userId, status: BookingStatus.COMPLETED } }),
        db.booking.count({
          where: {
            driverId: userId,
            bookingDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
      ]);

      return NextResponse.json({
        pendingBookings,
        completedBookings,
        todayBookings,
      });
    } else {
      // Employee stats
      const [totalBookings, pendingBookings, completedBookings, inProgressBookings] = await Promise.all([
        db.booking.count({ where: { employeeId: userId } }),
        db.booking.count({ where: { employeeId: userId, status: BookingStatus.PENDING } }),
        db.booking.count({ where: { employeeId: userId, status: BookingStatus.COMPLETED } }),
        db.booking.count({ where: { employeeId: userId, status: { in: activeStatuses } } }),
      ]);

      return NextResponse.json({
        totalBookings,
        pendingBookings,
        completedBookings,
        inProgressBookings,
      });
    }
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
