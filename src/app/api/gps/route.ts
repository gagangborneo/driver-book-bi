import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth-utils';

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { bookingId, latitude, longitude, accuracy } = data;

    if (!bookingId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Verify that the booking belongs to this driver
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.driverId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to track this booking' },
        { status: 403 }
      );
    }

    // Create GPS waypoint
    const waypoint = await db.gPSWaypoint.create({
      data: {
        bookingId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
      },
    });

    // Update current coordinates in booking
    await db.booking.update({
      where: { id: bookingId },
      data: {
        currentCoords: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ waypoint });
  } catch (error) {
    console.error('GPS tracking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Get booking and verify access
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { driver: { select: { id: true } }, employee: { select: { id: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check access - allow driver or employee
    if (booking.driverId !== userId && booking.employeeId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this booking' },
        { status: 403 }
      );
    }

    // Get all waypoints for this booking
    const waypoints = await db.gPSWaypoint.findMany({
      where: { bookingId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ waypoints });
  } catch (error) {
    console.error('Get GPS waypoints error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
