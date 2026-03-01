import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, BookingStatus, VehicleStatus } from '@prisma/client';
import { verifyToken } from '@/lib/auth-utils';

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// Get all drivers with their availability status
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drivers = await db.user.findMany({
      where: {
        role: UserRole.DRIVER,
        isActive: true,
      },
      include: {
        vehicleAssignments: true,
        bookingsAsDriver: {
          include: {
            vehicle: true,
            employee: { select: { id: true, name: true, email: true, phone: true, role: true } },
          },
        },
      },
    });

    const driversWithStatus = drivers.map((driver) => {
      const assignedVehicle = driver.vehicleAssignments[0] || null;
      const driverBookings = driver.bookingsAsDriver;

      const activeStatuses: BookingStatus[] = [
        BookingStatus.APPROVED,
        BookingStatus.DEPARTED,
        BookingStatus.ARRIVED,
        BookingStatus.RETURNING,
      ];

      const hasActiveBooking = driverBookings.some((b) =>
        activeStatuses.includes(b.status)
      );
      const hasPendingBooking = driverBookings.some((b) => b.status === BookingStatus.PENDING);

      let availabilityStatus = 'AVAILABLE';
      if (hasActiveBooking) {
        availabilityStatus = 'IN_TRIP';
      } else if (hasPendingBooking) {
        availabilityStatus = 'HAS_PENDING';
      }

      if (assignedVehicle && assignedVehicle.status === VehicleStatus.MAINTENANCE) {
        availabilityStatus = 'MAINTENANCE';
      }

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        availabilityStatus,
        assignedVehicle: assignedVehicle
          ? {
              id: assignedVehicle.id,
              plateNumber: assignedVehicle.plateNumber,
              brand: assignedVehicle.brand,
              model: assignedVehicle.model,
            }
          : null,
        bookingsAsDriver: driverBookings.map((b) => ({
          id: b.id,
          status: b.status,
          vehicle: b.vehicle,
          employee: b.employee,
        })),
      };
    });

    return NextResponse.json({ drivers: driversWithStatus });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
