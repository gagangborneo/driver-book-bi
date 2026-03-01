import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BookingStatus, VehicleStatus } from '@prisma/client';
import { notifyBookingAccepted } from '@/lib/whatsapp-notification';
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
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        driver: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        vehicle: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Parse location coordinates
    const bookingWithCoords = {
      ...booking,
      pickupCoords: booking.pickupCoords ? JSON.parse(booking.pickupCoords) : null,
      destinationCoords: booking.destinationCoords ? JSON.parse(booking.destinationCoords) : null,
      currentCoords: booking.currentCoords ? JSON.parse(booking.currentCoords) : null,
    };

    return NextResponse.json({ booking: bookingWithCoords });
  } catch (error) {
    console.error('Get booking error:', error);
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
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const currentBooking = await db.booking.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const data = await request.json();
    const newStatus = data.status as BookingStatus | undefined;

    // Prepare update data
    let updateData: Record<string, unknown> = {};

    // Driver can update status with new workflow
    if (currentUser.role === 'DRIVER') {
      // Driver can accept an unassigned pending booking (driverId = null)
      if (currentBooking.status === BookingStatus.PENDING && newStatus === BookingStatus.APPROVED && currentBooking.driverId === null) {
        // Verify driver is available
        if (currentUser.driverStatus !== 'AVAILABLE') {
          return NextResponse.json(
            { error: 'Anda harus status AVAILABLE untuk menerima pesanan' },
            { status: 400 }
          );
        }
        updateData.status = BookingStatus.APPROVED;
        updateData.driverId = currentUserId; // Assign booking to accepting driver
        if (data.vehicleId) {
          updateData.vehicleId = data.vehicleId;
          // Update vehicle status to IN_USE
          await db.vehicle.update({
            where: { id: data.vehicleId },
            data: { status: VehicleStatus.IN_USE },
          });
        }
      }
      // Driver can accept a pending booking assigned to them (original logic)
      else if (currentBooking.status === BookingStatus.PENDING && newStatus === BookingStatus.APPROVED && currentBooking.driverId === currentUserId) {
        updateData.status = BookingStatus.APPROVED;
        if (data.vehicleId) {
          updateData.vehicleId = data.vehicleId;
          // Update vehicle status to IN_USE
          await db.vehicle.update({
            where: { id: data.vehicleId },
            data: { status: VehicleStatus.IN_USE },
          });
        }
      }
      
      // Driver can reject a pending booking assigned to them with reason
      if (currentBooking.status === BookingStatus.PENDING && newStatus === BookingStatus.CANCELLED && (currentBooking.driverId === currentUserId || currentBooking.driverId === null)) {
        updateData.status = BookingStatus.CANCELLED;
        if (data.rejectionReason) {
          updateData.rejectionReason = data.rejectionReason;
        }
      }
      
      // Driver can update their own assigned bookings for status progression
      if (currentBooking.driverId === currentUserId) {
        // Status progression: APPROVED -> DEPARTED -> ARRIVED -> RETURNING -> COMPLETED
        switch (newStatus) {
          case BookingStatus.DEPARTED:
            updateData.status = BookingStatus.DEPARTED;
            updateData.departedAt = new Date();
            if (data.startOdometer) {
              updateData.startOdometer = data.startOdometer;
            }
            if (data.currentCoords) {
              updateData.currentCoords = typeof data.currentCoords === 'string' 
                ? data.currentCoords 
                : JSON.stringify(data.currentCoords);
            }
            break;
          case BookingStatus.ARRIVED:
            updateData.status = BookingStatus.ARRIVED;
            updateData.arrivedAt = new Date();
            if (data.currentCoords) {
              updateData.currentCoords = typeof data.currentCoords === 'string' 
                ? data.currentCoords 
                : JSON.stringify(data.currentCoords);
            }
            break;
          case BookingStatus.RETURNING:
            updateData.status = BookingStatus.RETURNING;
            updateData.returningAt = new Date();
            if (data.currentCoords) {
              updateData.currentCoords = typeof data.currentCoords === 'string' 
                ? data.currentCoords 
                : JSON.stringify(data.currentCoords);
            }
            break;
          case BookingStatus.COMPLETED:
            updateData.status = BookingStatus.COMPLETED;
            updateData.completedAt = new Date();
            if (data.endOdometer) {
              updateData.endOdometer = data.endOdometer;
            }
            if (data.currentCoords) {
              updateData.currentCoords = typeof data.currentCoords === 'string' 
                ? data.currentCoords 
                : JSON.stringify(data.currentCoords);
            }
            // Set vehicle back to AVAILABLE
            if (currentBooking.vehicleId) {
              await db.vehicle.update({
                where: { id: currentBooking.vehicleId },
                data: { status: VehicleStatus.AVAILABLE },
              });
            }
            break;
        }
      }
    }

    // Employee can cancel their own booking
    if (currentUser.role === 'EMPLOYEE' && currentBooking.employeeId === currentUserId) {
      if (newStatus === BookingStatus.CANCELLED && currentBooking.status === BookingStatus.PENDING) {
        updateData.status = BookingStatus.CANCELLED;
      }
      // Employee can add rating to completed bookings
      if (data.rating && currentBooking.status === BookingStatus.COMPLETED) {
        updateData.rating = data.rating;
        if (data.ratingComment) {
          updateData.ratingComment = data.ratingComment;
        }
      } else if (data.rating && currentBooking.status !== BookingStatus.COMPLETED) {
        return NextResponse.json({ 
          error: `Perjalanan belum selesai. Status saat ini: ${currentBooking.status}` 
        }, { status: 400 });
      }
    } else if (currentUser.role === 'EMPLOYEE' && currentBooking.employeeId !== currentUserId) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses untuk mengubah pesanan ini' }, { status: 403 });
    }

    // Admin can update anything
    if (currentUser.role === 'ADMIN') {
      if (data.status) updateData.status = data.status;
      if (data.driverId) updateData.driverId = data.driverId;
      if (data.vehicleId) updateData.vehicleId = data.vehicleId;
      if (data.pickupLocation) updateData.pickupLocation = data.pickupLocation;
      if (data.destination) updateData.destination = data.destination;
      if (data.bookingDate) updateData.bookingDate = new Date(data.bookingDate);
      if (data.bookingTime) updateData.bookingTime = data.bookingTime;
      if (data.notes) updateData.notes = data.notes;
      if (data.startOdometer) updateData.startOdometer = data.startOdometer;
      if (data.endOdometer) updateData.endOdometer = data.endOdometer;
      if (data.departedAt) updateData.departedAt = new Date(data.departedAt);
      if (data.arrivedAt) updateData.arrivedAt = new Date(data.arrivedAt);
      if (data.returningAt) updateData.returningAt = new Date(data.returningAt);
      if (data.completedAt) updateData.completedAt = new Date(data.completedAt);
      if (data.rejectionReason) updateData.rejectionReason = data.rejectionReason;
      if (data.rating) updateData.rating = data.rating;
      if (data.ratingComment) updateData.ratingComment = data.ratingComment;
    }

    // If no updates were made, return error
    if (Object.keys(updateData).length === 0) {
      // Check if this is a permission issue or just invalid request
      if (currentUser.role === 'DRIVER' && currentBooking.driverId !== currentUserId) {
        return NextResponse.json({ error: 'Anda tidak memiliki akses untuk mengubah pesanan ini' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Tidak ada perubahan yang dilakukan' }, { status: 400 });
    }

    // Update the booking
    const updatedBooking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        driver: { select: { id: true, email: true, name: true, phone: true, role: true, isActive: true } },
        vehicle: true,
      },
    });

    // Send WhatsApp notification to employee if driver just accepted an unassigned booking
    if (
      currentUser.role === 'DRIVER' &&
      currentBooking.status === BookingStatus.PENDING &&
      currentBooking.driverId === null &&
      updatedBooking.status === BookingStatus.APPROVED &&
      updatedBooking.employee?.phone
    ) {
      try {
        await notifyBookingAccepted(
          updatedBooking.employee.phone as string,
          currentUser.name
        );
      } catch (whatsappError) {
        console.error('WhatsApp notification to employee failed:', whatsappError);
        // Don't fail the booking update if WhatsApp notification fails
      }
    }

    // Parse location coordinates
    const bookingWithCoords = {
      ...updatedBooking,
      pickupCoords: updatedBooking.pickupCoords ? JSON.parse(updatedBooking.pickupCoords) : null,
      destinationCoords: updatedBooking.destinationCoords ? JSON.parse(updatedBooking.destinationCoords) : null,
      currentCoords: updatedBooking.currentCoords ? JSON.parse(updatedBooking.currentCoords) : null,
    };

    return NextResponse.json({ booking: bookingWithCoords });
  } catch (error) {
    console.error('Update booking error:', error);
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.booking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
