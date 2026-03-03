'use client';

import dynamic from 'next/dynamic';
import React from 'react';

interface GPSWaypoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  status?: string; // Booking status saat waypoint direkam
}

interface GPSMapProps {
  waypoints: GPSWaypoint[];
  pickup?: { lat: number; lng: number; name: string } | null;
  destination?: { lat: number; lng: number; name: string } | null;
  currentLocation?: { latitude: number; longitude: number } | null;
  liveUserLocation?: { latitude: number; longitude: number } | null;
  currentStatus?: string;
  height?: string;
  showPickupDestination?: boolean;
}

// Dynamic import of GPSMap to avoid SSR issues with Leaflet
const GPSMapDynamic = dynamic(
  () => import('./gps-map'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-lg border bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat peta...</p>
        </div>
      </div>
    ),
  }
);

export function GPSMapWrapper(props: GPSMapProps) {
  return <GPSMapDynamic {...props} />;
}
