'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDateShort } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, MapPin, Flag, Calendar, Clock } from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/loading';

interface AdminBookingsProps {
  token: string;
}

export function AdminBookings({ token }: AdminBookingsProps) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, [token, filter]);

  const fetchBookings = async () => {
    try {
      const url = filter !== 'all' ? `/bookings?status=${filter}` : '/bookings';
      const data = await api(url, {}, token);
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Menunggu</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-orange-500">Berlangsung</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat Perjalanan</h2>
        <p className="text-muted-foreground text-sm">Data semua perjalanan</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="whitespace-nowrap"
          >
            {status === 'all' ? 'Semua' : 
             status === 'PENDING' ? 'Menunggu' :
             status === 'APPROVED' ? 'Disetujui' :
             status === 'IN_PROGRESS' ? 'Berlangsung' :
             status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-32" />
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-3 pr-4">
            {bookings.map((booking) => (
              <Card key={booking.id as string}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {String((booking.employee as Record<string, unknown>).name).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{(booking.employee as Record<string, unknown>).name as string}</p>
                        <p className="text-sm text-muted-foreground">Karyawan</p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status as string)}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{booking.pickupLocation as string}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flag className="h-4 w-4 text-red-500" />
                      <span>{booking.destination as string}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateShort(booking.bookingDate as string)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.bookingTime as string}</span>
                      </div>
                    </div>
                    {booking.driver ? (
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>{(booking.driver as Record<string, unknown>).name as string}</span>
                      </div>
                    ) : null}
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
