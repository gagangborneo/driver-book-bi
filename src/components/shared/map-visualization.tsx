'use client';

import { Car, MapPin, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapVisualizationProps {
  pickup: { lat: number; lng: number; name: string } | null;
  destination: { lat: number; lng: number; name: string } | null;
  currentStatus: string;
}

export function MapVisualization({ pickup, destination, currentStatus }: MapVisualizationProps) {
  const getRelativePosition = (lat: number, lng: number) => {
    const minLat = -1.4, maxLat = -1.1;
    const minLng = 116.6, maxLng = 117.0;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const pickupPos = pickup ? getRelativePosition(pickup.lat, pickup.lng) : null;
  const destPos = destination ? getRelativePosition(destination.lat, destination.lng) : null;

  const getCurrentPos = () => {
    if (!pickupPos || !destPos) return null;
    
    switch (currentStatus) {
      case 'APPROVED':
        return pickupPos;
      case 'DEPARTED':
        return { x: pickupPos.x + (destPos.x - pickupPos.x) * 0.25, y: pickupPos.y + (destPos.y - pickupPos.y) * 0.25 };
      case 'ARRIVED':
        return destPos;
      case 'RETURNING':
        return { x: destPos.x + (pickupPos.x - destPos.x) * 0.5, y: destPos.y + (pickupPos.y - destPos.y) * 0.5 };
      case 'COMPLETED':
        return pickupPos;
      default:
        return pickupPos;
    }
  };

  const currentPos = getCurrentPos();

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div key={`h-${i}`} className="absolute w-full h-px bg-slate-300" style={{ top: `${i * 25}%` }} />
        ))}
        {[...Array(5)].map((_, i) => (
          <div key={`v-${i}`} className="absolute h-full w-px bg-slate-300" style={{ left: `${i * 25}%` }} />
        ))}
      </div>

      {/* Route line */}
      {pickupPos && destPos && (
        <svg className="absolute inset-0 w-full h-full">
          <line
            x1={`${pickupPos.x}%`}
            y1={`${pickupPos.y}%`}
            x2={`${destPos.x}%`}
            y2={`${destPos.y}%`}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}

      {/* Pickup marker */}
      {pickupPos && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pickupPos.x}%`, top: `${pickupPos.y}%` }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
              {pickup?.name || 'Titik Jemput'}
            </div>
          </div>
        </div>
      )}

      {/* Destination marker */}
      {destPos && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${destPos.x}%`, top: `${destPos.y}%` }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Flag className="h-4 w-4 text-white" />
            </div>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
              {destination?.name || 'Tujuan'}
            </div>
          </div>
        </div>
      )}

      {/* Current position marker */}
      {currentPos && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
        >
          <div className="relative animate-pulse">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
              currentStatus === 'APPROVED' ? 'bg-blue-500' :
              currentStatus === 'DEPARTED' ? 'bg-indigo-500' :
              currentStatus === 'ARRIVED' ? 'bg-purple-500' : 
              currentStatus === 'RETURNING' ? 'bg-orange-500' :
              currentStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
            )}>
              <Car className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-inherit rotate-45" />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 text-xs bg-white/80 px-2 py-1 rounded">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Jemput</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>Tujuan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Posisi</span>
        </div>
      </div>
    </div>
  );
}
