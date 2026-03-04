'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, MapPin, Flag, FileText, Droplets, Wrench, Fuel, Calendar, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/shared/loading';
import { TravelDetailModal } from '@/components/shared/travel-detail-modal';

const TRIP_STATUS_OPTIONS = [
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

const LOGBOOK_TYPE_OPTIONS = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'WASHING', label: 'Pencucian' },
  { value: 'SERVICE', label: 'Servis' },
  { value: 'FUEL', label: 'Bahan Bakar' },
  { value: 'OTHER', label: 'Lainnya' },
];

const ITEMS_PER_PAGE = 10;

interface DriverHistoryProps {
  token: string;
}

export function DriverHistory({ token }: DriverHistoryProps) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [logBooks, setLogBooks] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'logbook'>('trips');
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Trip filters
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');
  const [tripPage, setTripPage] = useState(1);

  // Logbook filters
  const [logbookSearch, setLogbookSearch] = useState('');
  const [logbookTypeFilter, setLogbookTypeFilter] = useState('all');
  const [logbookPage, setLogbookPage] = useState(1);

  const fetchData = async () => {
    try {
      const [bookingsData, logBooksData] = await Promise.all([
        api('/bookings', {}, token),
        api('/logbooks', {}, token),
      ]);
      setBookings(bookingsData.bookings);
      setLogBooks(logBooksData.logBooks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Reset pages when filters change
  useEffect(() => { setTripPage(1); }, [tripSearch, tripStatusFilter]);
  useEffect(() => { setLogbookPage(1); }, [logbookSearch, logbookTypeFilter]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    let filtered = bookings;

    if (tripStatusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === tripStatusFilter);
    }

    if (tripSearch.trim()) {
      const q = tripSearch.toLowerCase();
      filtered = filtered.filter((b) => {
        const employee = b.employee as Record<string, unknown> | null;
        const vehicle = b.vehicle as Record<string, unknown> | null;
        const empName = employee ? (employee.name as string).toLowerCase() : '';
        const plate = vehicle ? (vehicle.plateNumber as string).toLowerCase() : '';
        const pickup = (b.pickupLocation as string).toLowerCase();
        const dest = (b.destination as string).toLowerCase();
        return empName.includes(q) || plate.includes(q) || pickup.includes(q) || dest.includes(q);
      });
    }

    return filtered;
  }, [bookings, tripStatusFilter, tripSearch]);

  const tripTotalPages = Math.max(1, Math.ceil(filteredTrips.length / ITEMS_PER_PAGE));
  const paginatedTrips = filteredTrips.slice(
    (tripPage - 1) * ITEMS_PER_PAGE,
    tripPage * ITEMS_PER_PAGE
  );

  // Filtered logbooks
  const filteredLogbooks = useMemo(() => {
    let filtered = logBooks;

    if (logbookTypeFilter !== 'all') {
      filtered = filtered.filter((l) => l.type === logbookTypeFilter);
    }

    if (logbookSearch.trim()) {
      const q = logbookSearch.toLowerCase();
      filtered = filtered.filter((l) => {
        const vehicle = l.vehicle as Record<string, unknown> | null;
        const plate = vehicle ? (vehicle.plateNumber as string).toLowerCase() : '';
        const desc = (l.description as string).toLowerCase();
        return plate.includes(q) || desc.includes(q);
      });
    }

    return filtered;
  }, [logBooks, logbookTypeFilter, logbookSearch]);

  const logbookTotalPages = Math.max(1, Math.ceil(filteredLogbooks.length / ITEMS_PER_PAGE));
  const paginatedLogbooks = filteredLogbooks.slice(
    (logbookPage - 1) * ITEMS_PER_PAGE,
    logbookPage * ITEMS_PER_PAGE
  );

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

  const getLogBookIcon = (type: string) => {
    switch (type) {
      case 'WASHING':
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case 'SERVICE':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'FUEL':
        return <Fuel className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) => (
    <div className="flex items-center justify-between pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Sebelumnya
      </Button>
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Selanjutnya
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat</h2>
        <p className="text-muted-foreground text-sm">Catatan perjalanan dan aktivitas</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('trips')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'trips' ? 'bg-white shadow-sm' : 'text-muted-foreground'
          )}
        >
          Perjalanan
        </button>
        <button
          onClick={() => setActiveTab('logbook')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'logbook' ? 'bg-white shadow-sm' : 'text-muted-foreground'
          )}
        >
          LogBook
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : activeTab === 'trips' ? (
        <>
          {/* Trip Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari karyawan, plat nomor, lokasi..."
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tripStatusFilter} onValueChange={setTripStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {TRIP_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip result count */}
          <p className="text-xs text-muted-foreground">
            Menampilkan {paginatedTrips.length} dari {filteredTrips.length} perjalanan
          </p>

          {filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {tripSearch || tripStatusFilter !== 'all'
                  ? 'Tidak ada perjalanan yang sesuai filter'
                  : 'Belum ada riwayat perjalanan'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTrips.map((booking) => (
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
                          <p className="font-medium">{(booking.employee as Record<string, unknown>).name as string}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.vehicle ? `${(booking.vehicle as Record<string, unknown>).brand as string}` : '-'}
                          </p>
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

                    <p className="text-xs text-muted-foreground text-center py-2">
                      Klik untuk melihat detail
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Trip Pagination */}
              {filteredTrips.length > ITEMS_PER_PAGE && (
                <PaginationControls
                  currentPage={tripPage}
                  totalPages={tripTotalPages}
                  onPageChange={setTripPage}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Logbook Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari plat nomor, deskripsi..."
                value={logbookSearch}
                onChange={(e) => setLogbookSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={logbookTypeFilter} onValueChange={setLogbookTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                {LOGBOOK_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logbook result count */}
          <p className="text-xs text-muted-foreground">
            Menampilkan {paginatedLogbooks.length} dari {filteredLogbooks.length} logbook
          </p>

          {filteredLogbooks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {logbookSearch || logbookTypeFilter !== 'all'
                  ? 'Tidak ada logbook yang sesuai filter'
                  : 'Belum ada catatan logbook'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedLogbooks.map((log) => (
                <Card key={log.id as string}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getLogBookIcon(log.type as string)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{log.description as string}</p>
                        <p className="text-sm text-muted-foreground">
                          {(log.vehicle as Record<string, unknown>).plateNumber as string} • {formatDate(log.date as string)}
                        </p>
                        {log.cost ? (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Rp {(log.cost as number).toLocaleString('id-ID')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Logbook Pagination */}
              {filteredLogbooks.length > ITEMS_PER_PAGE && (
                <PaginationControls
                  currentPage={logbookPage}
                  totalPages={logbookTotalPages}
                  onPageChange={setLogbookPage}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <TravelDetailModal 
        booking={selectedBooking}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        token={token}
        onRatingSubmitted={fetchData}
        showDriver={false}
      />
    </div>
  );
}
