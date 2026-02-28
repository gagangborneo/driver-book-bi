'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDateShort } from '@/lib/format';
import { formatDate } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, MapPin, Flag, Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/shared/loading';
import { TravelDetailModal } from '@/components/shared/travel-detail-modal';
import { Label } from '@/components/ui/label';

interface AdminBookingsProps {
  token: string;
}

export function AdminBookings({ token }: AdminBookingsProps) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<'10' | '25' | '50'>('10');

  useEffect(() => {
    fetchBookings();
  }, [token, filter, searchQuery, startDate, endDate]);

  const fetchBookings = async () => {
    try {
      let url = '/bookings';
      const params = new URLSearchParams();

      if (filter !== 'all') params.append('status', filter);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) url += '?' + params.toString();
      
      const data = await api(url, {}, token);
      setBookings(data.bookings || []);
      setCurrentPage(1);
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

  // Pagination logic
  const itemsPerPageNum = parseInt(itemsPerPage);
  const totalPages = Math.ceil(bookings.length / itemsPerPageNum);
  const startIdx = (currentPage - 1) * itemsPerPageNum;
  const displayedBookings = bookings.slice(startIdx, startIdx + itemsPerPageNum);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat Perjalanan</h2>
        <p className="text-muted-foreground text-sm">Data semua perjalanan</p>
      </div>

      {/* Status Filter */}
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

      {/* Advanced Filters */}
      <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter tambahan:</span>
          {(searchQuery || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search by name */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs font-medium">Cari Nama</Label>
            <Input
              id="search"
              placeholder="Nama karyawan atau driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-xs font-medium">Tanggal Mulai</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-xs font-medium">Tanggal Akhir</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Results Info and Items Per Page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Menampilkan <span className="font-medium">{displayedBookings.length}</span> dari <span className="font-medium">{bookings.length}</span> perjalanan
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Item per halaman:</span>
          <Select value={itemsPerPage} onValueChange={(val) => {
            setItemsPerPage(val as '10' | '25' | '50');
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} height="h-32" />
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-muted-foreground">Tidak ada perjalanan yang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedBookings.map((booking) => (
            <Card 
              key={booking.id as string}
              className={cn('cursor-pointer transition-shadow', 'hover:shadow-md')}
              onClick={() => {
                setSelectedBooking(booking);
                setIsDetailModalOpen(true);
              }}
            >
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


                <div className="flex items-center justify-between text-sm">
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
      )}

      {/* Pagination Controls */}
      {bookings.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-slate-600">
            Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="min-w-9"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
