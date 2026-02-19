import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BookingStatus } from '@prisma/client';

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

// Jakarta area coordinates for dummy locations
const JAKARTA_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  'Kantor BI Jakarta': { lat: -6.1751, lng: 106.8248, name: 'Kantor BI Jakarta' },
  'Bandara Soekarno-Hatta': { lat: -6.1256, lng: 106.6559, name: 'Bandara Soekarno-Hatta' },
  'Gedung DPR': { lat: -6.2088, lng: 106.8007, name: 'Gedung DPR' },
  'Istana Merdeka': { lat: -6.1699, lng: 106.8264, name: 'Istana Merdeka' },
  'Monas': { lat: -6.1754, lng: 106.8272, name: 'Monas' },
  'Kantor BI Surabaya': { lat: -7.2575, lng: 112.7521, name: 'Kantor BI Surabaya' },
  'Hotel Indonesia': { lat: -6.1952, lng: 106.8232, name: 'Hotel Indonesia' },
  'GBK Senayan': { lat: -6.2182, lng: 106.8071, name: 'GBK Senayan' },
};

// Find matching location coordinates
function findLocationCoords(locationName: string) {
  for (const [key, coords] of Object.entries(JAKARTA_LOCATIONS)) {
    if (locationName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(locationName.toLowerCase())) {
      return coords;
    }
  }
  // Default to Monas area if not found
  return { lat: -6.1754 + (Math.random() * 0.01 - 0.005), lng: 106.8272 + (Math.random() * 0.01 - 0.005), name: locationName };
}

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
      // Show pending bookings assigned to this driver, and bookings already accepted by this driver
      whereClause.OR = [
        { status: BookingStatus.PENDING, driverId: userId },
        { driverId: userId, status: { not: BookingStatus.PENDING } },
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

// Create new booking
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId, pickupLocation, destination, bookingDate, bookingTime, notes } = await request.json();

    if (!driverId || !pickupLocation || !destination || !bookingDate || !bookingTime) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const driver = await db.user.findUnique({ where: { id: driverId } });
    if (!driver) {
      return NextResponse.json({ error: 'Driver tidak ditemukan' }, { status: 404 });
    }

    const assignedVehicle = await db.vehicle.findFirst({
      where: { assignedToId: driverId },
    });

    // Find coordinates for pickup and destination
    const pickupCoords = findLocationCoords(pickupLocation);
    const destinationCoords = findLocationCoords(destination);

    const newBooking = await db.booking.create({
      data: {
        employeeId: userId,
        driverId,
        vehicleId: assignedVehicle?.id || null,
        pickupLocation,
        destination,
        bookingDate: new Date(bookingDate),
        bookingTime,
        status: BookingStatus.PENDING,
        notes: notes || null,
        pickupCoords: JSON.stringify(pickupCoords),
        destinationCoords: JSON.stringify(destinationCoords),
      },
      include: {
        employee: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        driver: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        vehicle: true,
      },
    });

    // Parse location coordinates
    const bookingWithCoords = {
      ...newBooking,
      pickupCoords: newBooking.pickupCoords ? JSON.parse(newBooking.pickupCoords) : null,
      destinationCoords: newBooking.destinationCoords ? JSON.parse(newBooking.destinationCoords) : null,
      currentCoords: newBooking.currentCoords ? JSON.parse(newBooking.currentCoords) : null,
    };

    return NextResponse.json({ booking: bookingWithCoords });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
