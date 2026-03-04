'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Car, MapPin, Flag, Calendar, Clock, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadgeBooking } from '@/components/shared/status-badges';
import { LoadingSkeleton } from '@/components/shared/loading';
import { TravelDetailModal } from '@/components/shared/travel-detail-modal';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'DEPARTED', label: 'Berangkat' },
  { value: 'ARRIVED', label: 'Tiba' },
  { value: 'RETURNING', label: 'Kembali' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'REJECTED', label: 'Ditolak' },
];

const ITEMS_PER_PAGE = 10;

interface EmployeeHistoryProps {
  token: string;
}

export function EmployeeHistory({ token }: EmployeeHistoryProps) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        const driver = b.driver as Record<string, unknown> | null;
        const vehicle = b.vehicle as Record<string, unknown> | null;
        const driverName = driver ? (driver.name as string).toLowerCase() : '';
        const plate = vehicle ? (vehicle.plateNumber as string).toLowerCase() : '';
        const pickup = (b.pickupLocation as string).toLowerCase();
        const dest = (b.destination as string).toLowerCase();
        return driverName.includes(q) || plate.includes(q) || pickup.includes(q) || dest.includes(q);
      });
    }

    return filtered;
  }, [bookings, filterStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari driver, plat nomor, lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Menampilkan {paginatedBookings.length} dari {filteredBookings.length} perjalanan
        </p>
      )}

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-8">
          <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== 'all'
              ? 'Tidak ada perjalanan yang sesuai filter'
              : 'Belum ada riwayat perjalanan'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedBookings.map((booking) => (
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
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
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
                  <div className="shrink-0">
                    <StatusBadgeBooking status={booking.status as string} />
                  </div>
                </div>

                <hr className="my-2" />
                
                <div className="space-y-1 mb-2 flex items-center justify-between">
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="truncate">{booking.pickupLocation as string}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flag className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{booking.destination as string}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(booking.bookingDate as string)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
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

      {/* Pagination */}
      {!isLoading && filteredBookings.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
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
