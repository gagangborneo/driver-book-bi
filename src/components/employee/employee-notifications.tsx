'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadgeSimple } from '@/components/shared/status-badges';
import { LoadingSkeleton } from '@/components/shared/loading';
import { Bell, Car, MapPin, Flag, Clock, CheckCircle2, XCircle, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeNotificationsProps {
  token: string;
}

interface Notification {
  id: string;
  type: 'booking_approved' | 'booking_departed' | 'booking_arrived' | 'booking_returning' | 'booking_completed' | 'booking_cancelled' | 'booking_pending';
  title: string;
  description: string;
  status: string;
  bookingId: string;
  createdAt: string;
  pickupLocation: string;
  destination: string;
  driverName?: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'booking_approved':
      return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
    case 'booking_departed':
      return <Car className="h-5 w-5 text-cyan-500" />;
    case 'booking_arrived':
      return <Flag className="h-5 w-5 text-orange-500" />;
    case 'booking_returning':
      return <ArrowRight className="h-5 w-5 text-purple-500" />;
    case 'booking_completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'booking_cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'booking_pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
}

function getNotificationFromBooking(booking: Record<string, unknown>): Notification {
  const status = booking.status as string;
  const driver = booking.driver as Record<string, unknown> | null;
  const driverName = driver?.name as string | undefined;
  const pickupLocation = booking.pickupLocation as string;
  const destination = booking.destination as string;

  const statusMap: Record<string, { type: Notification['type']; title: string; description: string }> = {
    PENDING: {
      type: 'booking_pending',
      title: 'Pemesanan Menunggu Konfirmasi',
      description: `Pemesanan Anda dari ${pickupLocation} ke ${destination} sedang menunggu konfirmasi${driverName ? ` dari driver ${driverName}` : ''}.`,
    },
    APPROVED: {
      type: 'booking_approved',
      title: 'Pemesanan Disetujui',
      description: `Driver ${driverName || ''} telah menyetujui pemesanan Anda dari ${pickupLocation} ke ${destination}.`,
    },
    DEPARTED: {
      type: 'booking_departed',
      title: 'Driver Sedang Menjemput',
      description: `Driver ${driverName || ''} sedang dalam perjalanan menjemput Anda di ${pickupLocation}.`,
    },
    ARRIVED: {
      type: 'booking_arrived',
      title: 'Tiba di Tujuan',
      description: `Anda telah tiba di ${destination} bersama driver ${driverName || ''}.`,
    },
    RETURNING: {
      type: 'booking_returning',
      title: 'Dalam Perjalanan Pulang',
      description: `Driver ${driverName || ''} sedang dalam perjalanan pulang dari ${destination}.`,
    },
    COMPLETED: {
      type: 'booking_completed',
      title: 'Perjalanan Selesai',
      description: `Perjalanan Anda dari ${pickupLocation} ke ${destination} telah selesai.`,
    },
    CANCELLED: {
      type: 'booking_cancelled',
      title: 'Pemesanan Dibatalkan',
      description: `Pemesanan dari ${pickupLocation} ke ${destination} telah dibatalkan.`,
    },
  };

  const info = statusMap[status] || {
    type: 'booking_pending' as const,
    title: 'Pemesanan',
    description: `Status pemesanan: ${status}`,
  };

  return {
    id: booking.id as string,
    type: info.type,
    title: info.title,
    description: info.description,
    status,
    bookingId: booking.id as string,
    createdAt: booking.updatedAt as string || booking.createdAt as string,
    pickupLocation,
    destination,
    driverName,
  };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return formatDate(dateString);
}

export function EmployeeNotifications({ token }: EmployeeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api('/bookings', {}, token);
        const bookings = data.bookings as Array<Record<string, unknown>>;
        
        // Convert bookings to notifications, sorted by latest update
        const notifs = bookings
          .map(getNotificationFromBooking)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(notifs);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Notifikasi</h2>
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h2 className="text-xl font-bold">Notifikasi</h2>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada notifikasi</p>
            <p className="text-sm text-muted-foreground mt-1">Notifikasi akan muncul saat Anda membuat pemesanan</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3 pr-4">
            {notifications.map((notif) => (
              <Card key={`${notif.id}-${notif.status}`} className={cn(
                'transition-all',
                notif.status === 'COMPLETED' || notif.status === 'CANCELLED' ? 'opacity-70' : ''
              )}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <StatusBadgeSimple status={notif.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {notif.pickupLocation}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flag className="h-3 w-3" />
                          {notif.destination}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
