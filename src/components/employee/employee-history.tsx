'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Car, MapPin, Flag, Calendar, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadgeBooking } from '@/components/shared/status-badges';
import { LoadingSkeleton } from '@/components/shared/loading';
import { TravelDetailModal } from '@/components/shared/travel-detail-modal';

interface EmployeeHistoryProps {
  token: string;
}

export function EmployeeHistory({ token }: EmployeeHistoryProps) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      const data = await api('/bookings', {}, token);
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await api(`/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Pesanan berhasil dibatalkan',
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat Perjalanan</h2>
        <p className="text-muted-foreground text-sm">Daftar perjalanan Anda</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada riwayat perjalanan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <Card 
              key={booking.id as string} 
              className={cn(
                'cursor-pointer hover:shadow-md transition-shadow',
                (booking.status as string) === 'CANCELLED' && 'opacity-60'
              )}
              onClick={() => {
                setSelectedBooking(booking);
                setIsDetailModalOpen(true);
              }}
            >
              <CardContent className="px-2">
                <div className="flex items-start justify-between gap-2 mb-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {booking.driver ? (booking.driver as Record<string, unknown>).name as string : 'Menunggu Driver'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.vehicle 
                          ? `${(booking.vehicle as Record<string, unknown>).brand as string} - ${(booking.vehicle as Record<string, unknown>).plateNumber as string}` 
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadgeBooking status={booking.status as string} />
                  </div>
                </div>

                <hr className="my-2" />
                
                <div className="space-y-1 mb-2 flex items-center justify-between">
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="truncate">{booking.pickupLocation as string}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flag className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span className="truncate">{booking.destination as string}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatDate(booking.bookingDate as string)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{booking.bookingTime as string} WITA</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(booking.status as string) === 'PENDING' && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full text-xs h-8"
                      disabled={cancellingId === booking.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(booking.id as string);
                      }}
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" />
                          Membatalkan...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Batalkan
                        </>
                      )}
                    </Button>
                  )}
                  {(booking.status as string) !== 'PENDING' && (
                    <p className="text-xs w-full text-center py-1 text-gray-800">
                      Klik untuk detail
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <TravelDetailModal 
        booking={selectedBooking}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        token={token}
        onRatingSubmitted={fetchBookings}
        showDriver={true}
      />
    </div>
  );
}
