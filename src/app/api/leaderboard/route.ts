import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, BookingStatus } from '@prisma/client';

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

// Get start of month
function getStartOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

// Get end of month
function getEndOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59);
}

// Get start of year
function getStartOfYear(year: number): Date {
  return new Date(year, 0, 1);
}

// Get end of year
function getEndOfYear(year: number): Date {
  return new Date(year, 11, 31, 23, 59, 59);
}

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
    const filterYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const filterMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Available years for filter (current year and 4 years back)
    const availableYears = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
      availableYears.push(y);
    }

    // Calculate monthly stats
    const monthStart = getStartOfMonth(filterYear, filterMonth || currentMonth);
    const monthEnd = getEndOfMonth(filterYear, filterMonth || currentMonth);

    // Calculate yearly stats
    const yearStart = getStartOfYear(filterYear);
    const yearEnd = getEndOfYear(filterYear);

    // Get all completed bookings with relations
    const completedBookings = await db.booking.findMany({
      where: { status: BookingStatus.COMPLETED },
      include: {
        employee: { select: { id: true, name: true, email: true, phone: true } },
        driver: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
      },
    });

    // Get all employees
    const employees = await db.user.findMany({
      where: { role: UserRole.EMPLOYEE, isActive: true },
      select: { id: true, name: true, email: true, phone: true },
    });

    // Employee Leaderboard
    const employeeLeaderboard = employees.map((employee) => {
      const employeeBookings = completedBookings.filter((b) => b.employeeId === employee.id);

      const monthly = employeeBookings.filter((b) => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      }).length;

      const yearly = employeeBookings.filter((b) => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= yearStart && bookingDate <= yearEnd;
      }).length;

      const total = employeeBookings.length;

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        monthly,
        yearly,
        total,
      };
    }).sort((a, b) => b.total - a.total);

    // Get all drivers with their vehicles
    const drivers = await db.user.findMany({
      where: { role: UserRole.DRIVER, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        vehicleAssignments: true,
      },
    });

    // Driver Leaderboard
    const driverLeaderboard = drivers.map((driver) => {
      const driverBookings = completedBookings.filter((b) => b.driverId === driver.id);

      const monthly = driverBookings.filter((b) => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      }).length;

      const yearly = driverBookings.filter((b) => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= yearStart && bookingDate <= yearEnd;
      }).length;

      const total = driverBookings.length;

      const assignedVehicle = driver.vehicleAssignments[0];

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle: assignedVehicle
          ? {
              plateNumber: assignedVehicle.plateNumber,
              brand: assignedVehicle.brand,
              model: assignedVehicle.model,
            }
          : null,
        monthly,
        yearly,
        total,
      };
    }).sort((a, b) => b.total - a.total);

    // Get all vehicles with their drivers
    const vehicles = await db.vehicle.findMany({
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Vehicle Leaderboard
    const vehicleLeaderboard = vehicles.map((vehicle) => {
      const vehicleBookings = completedBookings.filter((b) => b.vehicleId === vehicle.id);

      const monthly = vehicleBookings.filter((b) => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      }).length;

      const yearly = vehicleBookings.filter((b) => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= yearStart && bookingDate <= yearEnd;
      }).length;

      const total = vehicleBookings.length;

      return {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        driver: vehicle.assignedTo
          ? {
              name: vehicle.assignedTo.name,
            }
          : null,
        monthly,
        yearly,
        total,
      };
    }).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      filter: {
        year: filterYear,
        month: filterMonth,
      },
      current: {
        year: currentYear,
        month: currentMonth,
      },
      availableYears,
      monthNames: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ],
      employees: employeeLeaderboard,
      drivers: driverLeaderboard,
      vehicles: vehicleLeaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
