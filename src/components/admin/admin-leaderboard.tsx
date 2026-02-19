'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Car, Users, Truck, Calendar, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/loading';

interface AdminLeaderboardProps {
  token: string;
}

export function AdminLeaderboard({ token }: AdminLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<{
    filter: { year: number; month: number | null };
    current: { year: number; month: number };
    availableYears: number[];
    monthNames: string[];
    employees: Array<Record<string, unknown>>;
    drivers: Array<Record<string, unknown>>;
    vehicles: Array<Record<string, unknown>>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'drivers' | 'vehicles'>('employees');
  const [periodFilter, setPeriodFilter] = useState<'monthly' | 'yearly' | 'total'>('total');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const { toast } = useToast();

  const fetchLeaderboard = async (year?: number, month?: number | null) => {
    setIsLoading(true);
    try {
      let endpoint = '/leaderboard';
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      if (params.toString()) endpoint += `?${params.toString()}`;
      
      const data = await api(endpoint, {}, token);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memuat data leaderboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedYear, periodFilter === 'monthly' ? selectedMonth : null);
  }, [token, selectedYear, selectedMonth, periodFilter]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">1</div>;
    } else if (rank === 2) {
      return <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold">2</div>;
    } else if (rank === 3) {
      return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">3</div>;
    }
    return <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600">{rank}</div>;
  };

  if (isLoading || !leaderboardData) {
    return <LoadingSpinner />;
  }

  const currentData = activeTab === 'employees' 
    ? leaderboardData.employees 
    : activeTab === 'drivers' 
      ? leaderboardData.drivers 
      : leaderboardData.vehicles;

  const sortedData = [...currentData].sort((a, b) => {
    if (periodFilter === 'monthly') return (b.monthly as number) - (a.monthly as number);
    if (periodFilter === 'yearly') return (b.yearly as number) - (a.yearly as number);
    return (b.total as number) - (a.total as number);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-muted-foreground text-sm">Peringkat penggunaan terbanyak</p>
      </div>

      {/* Period Filter */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'total', label: 'Total' },
            { id: 'yearly', label: 'Tahunan' },
            { id: 'monthly', label: 'Bulanan' },
          ].map((p) => (
            <Button
              key={p.id}
              variant={periodFilter === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodFilter(p.id as 'monthly' | 'yearly' | 'total')}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {(periodFilter === 'yearly' || periodFilter === 'monthly') && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">Tahun:</Label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaderboardData.availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {periodFilter === 'monthly' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">Bulan:</Label>
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaderboardData.monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Active Filter Display */}
      <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {periodFilter === 'total' && 'Periode: Semua Waktu'}
            {periodFilter === 'yearly' && `Periode: Tahun ${selectedYear}`}
            {periodFilter === 'monthly' && `Periode: ${leaderboardData.monthNames[selectedMonth - 1]} ${selectedYear}`}
          </span>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        {[
          { id: 'employees', label: 'Karyawan', icon: Users },
          { id: 'drivers', label: 'Driver', icon: Car },
          { id: 'vehicles', label: 'Kendaraan', icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'employees' | 'drivers' | 'vehicles')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === tab.id ? 'bg-white shadow-sm' : 'text-muted-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      {sortedData.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada data untuk ditampilkan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedData.map((item, index) => (
            <Card key={item.id as string} className={cn(
              index === 0 && 'border-yellow-200 bg-yellow-50/50',
              index === 1 && 'border-slate-200 bg-slate-50/50',
              index === 2 && 'border-amber-200 bg-amber-50/50',
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {getRankBadge(index + 1)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {activeTab === 'vehicles' ? (
                        <>
                          <Car className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.plateNumber as string}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.brand as string} {item.model as string} ({item.year as number})
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {(item.name as string).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.name as string}</p>
                            <p className="text-sm text-muted-foreground">
                              {activeTab === 'drivers' && item.vehicle ? (
                                <span className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  {(item.vehicle as Record<string, unknown>).plateNumber as string}
                                </span>
                              ) : null}
                              {activeTab === 'employees' && (item.email as string)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {Number(periodFilter === 'monthly' ? item.monthly : periodFilter === 'yearly' ? item.yearly : item.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">perjalanan</p>
                  </div>
                </div>
                
                {/* Stats breakdown */}
                <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="font-bold text-slate-700">{item.monthly as number}</p>
                    <p className="text-muted-foreground">Bulanan</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="font-bold text-slate-700">{item.yearly as number}</p>
                    <p className="text-muted-foreground">Tahunan</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="font-bold text-slate-700">{item.total as number}</p>
                    <p className="text-muted-foreground">Total</p>
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
