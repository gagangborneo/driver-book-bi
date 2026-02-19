'use client';

import { Badge } from '@/components/ui/badge';

export function StatusBadgeBooking({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Menunggu Konfirmasi</Badge>;
    case 'APPROVED':
      return <Badge className="bg-blue-500">Disetujui</Badge>;
    case 'DEPARTED':
      return <Badge className="bg-cyan-500">Berangkat</Badge>;
    case 'ARRIVED':
      return <Badge className="bg-orange-500">Tiba di Tujuan</Badge>;
    case 'RETURNING':
      return <Badge className="bg-purple-500">Dalam Perjalanan Pulang</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-500">Selesai</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive">Dibatalkan</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function StatusBadgeSimple({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Menunggu</Badge>;
    case 'APPROVED':
      return <Badge className="bg-blue-500 text-xs">Disetujui</Badge>;
    case 'DEPARTED':
      return <Badge className="bg-cyan-500 text-xs">Berangkat</Badge>;
    case 'ARRIVED':
      return <Badge className="bg-orange-500 text-xs">Tiba</Badge>;
    case 'RETURNING':
      return <Badge className="bg-purple-500 text-xs">Kembali</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-500 text-xs">Selesai</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive" className="text-xs">Dibatalkan</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

export function StatusBadgeDriver({ status }: { status: string }) {
  switch (status) {
    case 'AVAILABLE':
      return <Badge className="bg-green-500">Tersedia</Badge>;
    case 'IN_TRIP':
      return <Badge className="bg-yellow-500">Dalam Perjalanan</Badge>;
    case 'HAS_PENDING':
      return <Badge className="bg-orange-500">Ada Pesanan</Badge>;
    case 'MAINTENANCE':
      return <Badge className="bg-red-500">Maintenance</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function StatusBadgeVehicle({ status }: { status: string }) {
  switch (status) {
    case 'AVAILABLE':
      return <Badge className="bg-green-500">Tersedia</Badge>;
    case 'IN_USE':
      return <Badge className="bg-blue-500">Digunakan</Badge>;
    case 'MAINTENANCE':
      return <Badge className="bg-red-500">Maintenance</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'ADMIN':
      return <Badge className="bg-red-500">Admin</Badge>;
    case 'DRIVER':
      return <Badge className="bg-blue-500">Driver</Badge>;
    case 'EMPLOYEE':
      return <Badge className="bg-green-500">Karyawan</Badge>;
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
}
