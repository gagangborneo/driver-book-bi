'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        <LoadingSkeleton count={3} height="h-32" />
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada riwayat perjalanan</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3 pr-4">
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
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {booking.driver ? (booking.driver as Record<string, unknown>).name as string : 'Menunggu Driver'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.vehicle 
                            ? `${(booking.vehicle as Record<string, unknown>).brand as string} - ${(booking.vehicle as Record<string, unknown>).plateNumber as string}` 
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <StatusBadgeBooking status={booking.status as string} />
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
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.bookingDate as string)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.bookingTime as string}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(booking.status as string) === 'PENDING' && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        disabled={cancellingId === booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id as string);
                        }}
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Membatalkan...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Batalkan Pesanan
                          </>
                        )}
                      </Button>
                    )}
                    {(booking.status as string) !== 'PENDING' && (
                      <p className="text-xs text-muted-foreground w-full text-center py-2">
                        Klik untuk melihat detail
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
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
