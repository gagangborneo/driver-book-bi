'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/shared/loading';
import { BookText, Car, User, Calendar, DollarSign, Gauge, Search, Droplets, Trophy, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

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

  // === Washing (Pencucian) Statistics ===
  const washingStats = useMemo(() => {
    const washingLogs = logbooks.filter((log) => log.type === 'WASHING');

    // Group by driver
    const driverMap = new Map<string, { name: string; count: number; totalCost: number }>();
    washingLogs.forEach((log) => {
      const existing = driverMap.get(log.driverId);
      if (existing) {
        existing.count += 1;
        existing.totalCost += log.cost || 0;
      } else {
        driverMap.set(log.driverId, {
          name: log.driver.name,
          count: 1,
          totalCost: log.cost || 0,
        });
      }
    });

    // Sort by count descending
    const ranked = Array.from(driverMap.values())
      .sort((a, b) => b.count - a.count);

    return ranked;
  }, [logbooks]);

  // Logbook type distribution (pie chart)
  const typeDistribution = useMemo(() => {
    const typeMap: Record<string, number> = { WASHING: 0, SERVICE: 0, FUEL: 0, OTHER: 0 };
    logbooks.forEach((log) => {
      typeMap[log.type] = (typeMap[log.type] || 0) + 1;
    });
    return Object.entries(typeMap)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        name: logBookTypeLabels[type],
        value: count,
        type,
      }));
  }, [logbooks]);

  const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#6b7280'];
  const BAR_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#cbd5e1', '#94a3b8', '#64748b', '#475569'];

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

      {/* Washing Statistics Charts */}
      {!isLoading && logbooks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Drivers by Washing Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-600" />
                Top Driver Pencucian Terbanyak
              </CardTitle>
              <p className="text-xs text-muted-foreground">Jumlah logbook pencucian per driver</p>
            </CardHeader>
            <CardContent>
              {washingStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Droplets className="h-10 w-10 mb-2" />
                  <p className="text-sm">Belum ada data pencucian</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(200, washingStats.slice(0, 10).length * 44)}>
                    <BarChart
                      data={washingStats.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} fontSize={12} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} kali`, 'Pencucian']}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {washingStats.slice(0, 10).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Ranking List */}
                  <div className="mt-4 space-y-2">
                    {washingStats.slice(0, 5).map((driver, index) => (
                      <div key={driver.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium">{driver.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                            {driver.count}x cuci
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(driver.totalCost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Washing Cost per Driver */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Biaya Pencucian per Driver
              </CardTitle>
              <p className="text-xs text-muted-foreground">Total biaya pencucian per driver</p>
            </CardHeader>
            <CardContent>
              {washingStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mb-2" />
                  <p className="text-sm">Belum ada data biaya pencucian</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, washingStats.filter(d => d.totalCost > 0).slice(0, 10).length * 44)}>
                  <BarChart
                    data={washingStats.filter(d => d.totalCost > 0).slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      fontSize={12}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value)
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Total Biaya']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="totalCost" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {washingStats.filter(d => d.totalCost > 0).slice(0, 10).map((_, index) => (
                        <Cell key={`cost-${index}`} fill={index % 2 === 0 ? '#22c55e' : '#4ade80'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Logbook Type Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-5 w-5 text-purple-600" />
                Distribusi Tipe Logbook
              </CardTitle>
              <p className="text-xs text-muted-foreground">Perbandingan jumlah logbook berdasarkan tipe</p>
            </CardHeader>
            <CardContent>
              {typeDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <BookText className="h-10 w-10 mb-2" />
                  <p className="text-sm">Belum ada data logbook</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={12}
                      >
                        {typeDistribution.map((_, index) => (
                          <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} logbook`, 'Jumlah']}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Summary beside pie */}
                  <div className="space-y-3 min-w-45">
                    {typeDistribution.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.value} logbook</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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
