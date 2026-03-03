'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/shared/loading';
import { BookText, Car, User, Calendar, DollarSign, Gauge, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AdminLogbooksProps {
  token: string;
}

interface LogBook {
  id: string;
  driverId: string;
  vehicleId: string;
  type: 'WASHING' | 'SERVICE' | 'FUEL' | 'OTHER';
  description: string;
  date: string;
  cost: number | null;
  odometer: number | null;
  createdAt: string;
  updatedAt: string;
  driver: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
  };
}

const logBookTypeLabels: Record<string, string> = {
  WASHING: 'Pencucian',
  SERVICE: 'Servis',
  FUEL: 'Bahan Bakar',
  OTHER: 'Lainnya',
};

const logBookTypeColors: Record<string, string> = {
  WASHING: 'bg-blue-100 text-blue-800',
  SERVICE: 'bg-orange-100 text-orange-800',
  FUEL: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function AdminLogbooks({ token }: AdminLogbooksProps) {
  const [logbooks, setLogbooks] = useState<LogBook[]>([]);
  const [filteredLogbooks, setFilteredLogbooks] = useState<LogBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchLogbooks();
  }, [token]);

  useEffect(() => {
    filterLogbooks();
  }, [logbooks, searchQuery, filterType]);

  const fetchLogbooks = async () => {
    try {
      const data = await api('/logbooks', {}, token);
      setLogbooks(data.logBooks || []);
    } catch (error) {
      console.error('Error fetching logbooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogbooks = () => {
    let filtered = logbooks;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((log) => log.type === filterType);
    }

    // Filter by search query (driver name, vehicle plate, or description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.driver.name.toLowerCase().includes(query) ||
          log.vehicle.plateNumber.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query)
      );
    }

    setFilteredLogbooks(filtered);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Logbook Driver</h2>
        <p className="text-muted-foreground text-sm">Data catatan aktivitas kendaraan oleh driver</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari driver, plat nomor, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="WASHING">Pencucian</SelectItem>
            <SelectItem value="SERVICE">Servis</SelectItem>
            <SelectItem value="FUEL">Bahan Bakar</SelectItem>
            <SelectItem value="OTHER">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Logbook</p>
            <p className="text-2xl font-bold">{filteredLogbooks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Biaya</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                filteredLogbooks.reduce((sum, log) => sum + (log.cost || 0), 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pencucian</p>
            <p className="text-2xl font-bold">
              {filteredLogbooks.filter((log) => log.type === 'WASHING').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Servis</p>
            <p className="text-2xl font-bold">
              {filteredLogbooks.filter((log) => log.type === 'SERVICE').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logbook List */}
      {isLoading ? (
        <LoadingSkeleton count={5} height="h-32" />
      ) : filteredLogbooks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterType !== 'all'
                ? 'Tidak ada logbook yang sesuai dengan filter'
                : 'Belum ada logbook'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogbooks.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Icon */}
                  <div className="shrink-0">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <BookText className="h-6 w-6 text-slate-600" />
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Badge className={logBookTypeColors[log.type]}>
                          {logBookTypeLabels[log.type]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(log.date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm">{log.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{log.driver.name}</p>
                          <p className="text-xs text-muted-foreground">{log.driver.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{log.vehicle.plateNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.vehicle.brand} {log.vehicle.model} ({log.vehicle.year})
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cost and Odometer */}
                    <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
                      {log.cost !== null && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(log.cost)}
                          </span>
                        </div>
                      )}
                      {log.odometer !== null && (
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-600">
                            {log.odometer.toLocaleString('id-ID')} km
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
