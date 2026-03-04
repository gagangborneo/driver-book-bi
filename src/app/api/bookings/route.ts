import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BookingStatus, VehicleStatus, DriverStatus } from '@prisma/client';
import { notifyNewBooking } from '@/lib/whatsapp-notification';
import { pushNotifyNewBooking } from '@/lib/push-notification';
import { verifyToken } from '@/lib/auth-utils';

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  return payload?.userId || null;
}

// Default Balikpapan coordinates with some variation for different locations
function getDefaultBalikpapanCoords(locationType: 'pickup' | 'destination') {
  // Center of Balikpapan: -1.2720, 116.7896
  // Add small offsets for pickup vs destination to show different markers
  const baseCoords = {
    pickup: { lat: -1.2720, lng: 116.7896 }, // BI Office Balikpapan area
    destination: { lat: -1.2683, lng: 116.8289 }, // Sultan Aji Muhammad Sulaiman Airport area
  };
  
  return baseCoords[locationType];
}

// Note: pickup/destination coordinates are optional and should be provided explicitly when available.

// Get all bookings
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
    const status = searchParams.get('status');
    const filterUserId = searchParams.get('userId');

    let whereClause: Record<string, unknown> = {};

    // Filter by user role
    if (user.role === 'EMPLOYEE') {
      whereClause.employeeId = userId;
    } else if (user.role === 'DRIVER') {
      // Show available pending bookings (not yet assigned) for available drivers
      // AND bookings already assigned or accepted by this driver
      whereClause.OR = [
        // Available pending bookings (no driver assigned yet) - only if driver is AVAILABLE
        user.driverStatus === DriverStatus.AVAILABLE
          ? { status: BookingStatus.PENDING, driverId: null }
          : { id: '' }, // empty condition to exclude unassigned bookings if driver is not AVAILABLE
        // Bookings assigned to or accepted by this driver
        { driverId: userId },
      ];
    } else if (filterUserId) {
      const userRole = searchParams.get('userRole');
      if (userRole === 'employee') {
        whereClause.employeeId = filterUserId;
      } else if (userRole === 'driver') {
        whereClause.driverId = filterUserId;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    const bookings = await db.booking.findMany({
      where: whereClause,
      include: {
        employee: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        driver: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse location coordinates from JSON strings
    const bookingsWithCoords = bookings.map((b) => ({
      ...b,
      pickupCoords: b.pickupCoords ? JSON.parse(b.pickupCoords) : null,
      destinationCoords: b.destinationCoords ? JSON.parse(b.destinationCoords) : null,
      currentCoords: b.currentCoords ? JSON.parse(b.currentCoords) : null,
    }));

    return NextResponse.json({ bookings: bookingsWithCoords });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create new booking with multi-driver notification system
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pickupLocation, destination, bookingDate, bookingTime, notes } = await request.json();

    if (!pickupLocation || !destination || !bookingDate || !bookingTime) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Find all available drivers (status != OFFLINE and no active bookings)
    const activeStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.APPROVED,
      BookingStatus.DEPARTED,
      BookingStatus.ARRIVED,
      BookingStatus.RETURNING,
    ];

    const allDrivers = await db.user.findMany({
      where: { role: 'DRIVER', isActive: true },
      include: {
        vehicleAssignments: true,
        bookingsAsDriver: {
          where: { status: { in: activeStatuses } },
        },
      },
    });

    const availableDrivers = allDrivers.filter((driver) => {
      const hasActiveOrPending = driver.bookingsAsDriver.length > 0;
      const vehicleInMaintenance = driver.vehicleAssignments.some(
        (v) => v.status === VehicleStatus.MAINTENANCE
      );
      // Driver must be AVAILABLE status and not have active/pending bookings and vehicle not in maintenance
      const isAvailable = driver.driverStatus === DriverStatus.AVAILABLE;
      return isAvailable && !hasActiveOrPending && !vehicleInMaintenance;
    });

    if (availableDrivers.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada driver yang tersedia saat ini. Silakan coba beberapa saat lagi.' },
        { status: 400 }
      );
    }

    // Create a pending booking without assigning to any driver yet
    // This allows first-come-first-serve for available drivers
    // Add default Balikpapan coordinates if not provided
    const pickupCoords = getDefaultBalikpapanCoords('pickup');
    const destinationCoords = getDefaultBalikpapanCoords('destination');

    const newBooking = await db.booking.create({
      data: {
        employeeId: userId,
        driverId: null, // No driver assigned yet - will be assigned when driver accepts
        vehicleId: null,
        pickupLocation,
        destination,
        bookingDate: new Date(bookingDate),
        bookingTime,
        status: BookingStatus.PENDING,
        notes: notes || null,
        pickupCoords: JSON.stringify({ ...pickupCoords, name: pickupLocation }),
        destinationCoords: JSON.stringify({ ...destinationCoords, name: destination }),
      },
      include: {
        employee: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        driver: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        vehicle: true,
      },
    });

    // Send WhatsApp notification to driver group
    try {
      await notifyNewBooking(pickupLocation, destination, bookingTime);
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
      // Don't fail the booking creation if WhatsApp notification fails
    }

    // Send Push Notification to all available drivers
    try {
      const employee = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      await pushNotifyNewBooking({
        employee_name: employee?.name || 'Karyawan',
        pickup: pickupLocation,
        destination,
        time: bookingTime,
        booking_id: newBooking.id,
      });
    } catch (pushError) {
      console.error('Push notification failed:', pushError);
      // Don't fail the booking creation if push notification fails
    }

    // Parse location coordinates
    const bookingWithCoords = {
      ...newBooking,
      pickupCoords: newBooking.pickupCoords ? JSON.parse(newBooking.pickupCoords) : null,
      destinationCoords: newBooking.destinationCoords ? JSON.parse(newBooking.destinationCoords) : null,
      currentCoords: newBooking.currentCoords ? JSON.parse(newBooking.currentCoords) : null,
    };

    return NextResponse.json({
      booking: bookingWithCoords,
      message: 'Pesanan driver telah dibuat. Notifikasi telah dikirim ke driver yang tersedia.',
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
