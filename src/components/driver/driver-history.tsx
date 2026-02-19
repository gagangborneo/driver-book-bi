'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, MapPin, Flag, FileText, Droplets, Wrench, Fuel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/shared/loading';

interface DriverHistoryProps {
  token: string;
}

export function DriverHistory({ token }: DriverHistoryProps) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [logBooks, setLogBooks] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'logbook'>('trips');

  useEffect(() => {
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

    fetchData();
  }, [token]);

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
        bookings.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada riwayat perjalanan</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3 pr-4">
              {bookings.map((booking) => (
                <Card key={booking.id as string}>
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
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span>{booking.pickupLocation as string}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flag className="h-4 w-4 text-red-500" />
                        <span>{booking.destination as string}</span>
                      </div>
                    </div>

                    {(booking.startOdometer || booking.endOdometer) ? (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        Odometer: {String(booking.startOdometer ?? '-')} km → {String(booking.endOdometer ?? '-')} km
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )
      ) : (
        logBooks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada catatan logbook</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3 pr-4">
              {logBooks.map((log) => (
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
            </div>
          </ScrollArea>
        )
      )}
    </div>
  );
}
