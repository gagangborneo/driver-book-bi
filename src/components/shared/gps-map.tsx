'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Maximize2, Minimize2 } from 'lucide-react';

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
  showPickupDestination?: boolean; // Only show pickup/destination if there are waypoints
}

function GPSMap({
  waypoints,
  pickup,
  destination,
  currentLocation,
  liveUserLocation,
  currentStatus,
  height = 'h-96',
  showPickupDestination = true,
}: GPSMapProps): JSX.Element {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const layersRef = useRef<L.Layer[]>([]);

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'APPROVED':
        return '#3B82F6'; // Blue - disetujui
      case 'DEPARTED':
        return '#6366F1'; // Indigo - berangkat
      case 'ARRIVED':
        return '#A855F7'; // Purple - tiba di tujuan
      case 'RETURNING':
        return '#F97316'; // Orange - kembali
      case 'COMPLETED':
        return '#22C55E'; // Green - selesai
      default:
        return '#EF4444'; // Red - default
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'APPROVED':
        return '✓ Disetujui';
      case 'DEPARTED':
        return '🚗 Berangkat';
      case 'ARRIVED':
        return '📍 Tiba di Tujuan';
      case 'RETURNING':
        return '🔙 Kembali';
      case 'COMPLETED':
        return '✅ Selesai';
      default:
        return '📍 Titik GPS';
    }
  };

  const getRouteColor = (status?: string): string => {
    switch (status) {
      case 'APPROVED':
        return '#3B82F6';
      case 'DEPARTED':
        return '#6366F1';
      case 'ARRIVED':
        return '#A855F7';
      case 'RETURNING':
        return '#F97316';
      case 'COMPLETED':
        return '#22C55E';
      default:
        return '#FF9800';
    }
  };

  const createCircleMarkerIcon = (color: string, size = 48, innerRadius = 12): L.Icon => {
    const radius = size / 2;
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${color}"/>
        <circle cx="${radius}" cy="${radius}" r="${innerRadius}" fill="white"/>
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      iconSize: [size, size],
      iconAnchor: [radius, size],
      popupAnchor: [0, -size],
    });
  };

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with default center (Balikpapan)
    const defaultCenter: [number, number] = [-1.2720, 116.7896];
    
    try {
      map.current = L.map(mapContainer.current).setView(defaultCenter, 12);
    } catch (error) {
      console.error('Error initializing map:', error);
      return;
    }

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Cleanup: only remove map on component unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers and layers when data changes
  useEffect(() => {
    if (!map.current) return;

    // Remove all previous layers
    layersRef.current.forEach((layer) => {
      if (map.current) {
        map.current.removeLayer(layer);
      }
    });
    layersRef.current = [];

    // Custom markers - Pickup/Destination (only shown when there are waypoints)
    const pickupMarker = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iIzMwN0FFQyIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjEyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    const destinationMarker = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iIzMzQzc4QSIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjEyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    // Live User Location Marker (prominent, pulsing blue)
    const liveUserMarker = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzNiODJmNiIgZmlsbC1vcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyMCIgZmlsbD0iIzNiODJmNiIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
      iconSize: [64, 64],
      iconAnchor: [32, 32],
      popupAnchor: [0, -32],
    });

    const driverMarker = createCircleMarkerIcon(getStatusColor(currentStatus));

    // Helper function to create colored waypoint markers
    const createWaypointMarker = (status?: string) => {
      const color = getStatusColor(status);
      const svg = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${color}" fill-opacity="0.3"/>
          <circle cx="16" cy="16" r="8" fill="${color}"/>
          <circle cx="16" cy="16" r="4" fill="white"/>
        </svg>
      `;
      return L.icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
    };

    // Always show live user location if available (untuk melihat posisi perangkat)
    const hasWaypoints = waypoints && waypoints.length > 0;
    
    if (liveUserLocation) {
      const marker = L.marker([liveUserLocation.latitude, liveUserLocation.longitude], { icon: liveUserMarker })
        .addTo(map.current)
        .bindPopup('<strong>📍 Lokasi Anda Saat Ini</strong>');
      
      // Open popup only if no waypoints yet (before journey starts)
      if (!hasWaypoints) {
        marker.openPopup();
      }
      
      layersRef.current.push(marker);
      
      // Set initial view only if no waypoints yet
      if (!hasWaypoints) {
        map.current.setView([liveUserLocation.latitude, liveUserLocation.longitude], 15);
      }
    }
    
    if (hasWaypoints && showPickupDestination) {
      // Add pickup marker
      if (pickup) {
        const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupMarker })
          .addTo(map.current)
          .bindPopup(`<strong>Penjemputan</strong><br/>${pickup.name}`);
        layersRef.current.push(marker);
      }

      // Add destination marker
      if (destination) {
        const marker = L.marker([destination.lat, destination.lng], { icon: destinationMarker })
          .addTo(map.current)
          .bindPopup(`<strong>Tujuan</strong><br/>${destination.name}`);
        layersRef.current.push(marker);
      }
    }

    // Show current driver/vehicle location during journey
    if (currentLocation && hasWaypoints) {
      const marker = L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: driverMarker,
      })
        .addTo(map.current)
        .bindPopup('<strong>Lokasi Driver Saat Ini</strong>');
      layersRef.current.push(marker);
    }

    // Add waypoints (recorded GPS points during journey) - dengan marker berwarna per status
    if (hasWaypoints) {
      waypoints.forEach((waypoint, index) => {
        const isFirst = index === 0;
        const waypointIcon = isFirst ? pickupMarker : createWaypointMarker(waypoint.status);
        const statusLabel = getStatusLabel(waypoint.status);
        
        const marker = L.marker([waypoint.latitude, waypoint.longitude], {
          icon: waypointIcon,
        })
          .addTo(map.current!)
          .bindPopup(
            isFirst 
              ? '<strong>🚗 Titik Keberangkatan</strong><br/>' + new Date(waypoint.timestamp).toLocaleString('id-ID')
              : `<strong>${statusLabel}</strong><br/><small>⏰ ${new Date(waypoint.timestamp).toLocaleString('id-ID')}</small>`
          );
        layersRef.current.push(marker);
      });

      // Draw polyline connecting waypoints
      const waypointCoords: [number, number][] = waypoints.map((w) => [
        w.latitude,
        w.longitude,
      ]);

      const polyline = L.polyline(waypointCoords, {
        color: getRouteColor(currentStatus),
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1.0,
      }).addTo(map.current);
      layersRef.current.push(polyline);

      // Fit bounds to show all waypoints and live location
      const bounds = L.latLngBounds(waypointCoords);
      if (showPickupDestination && pickup) bounds.extend([pickup.lat, pickup.lng]);
      if (showPickupDestination && destination) bounds.extend([destination.lat, destination.lng]);
      if (currentLocation) bounds.extend([currentLocation.latitude, currentLocation.longitude]);
      if (liveUserLocation) bounds.extend([liveUserLocation.latitude, liveUserLocation.longitude]); // Include live location
      map.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (!liveUserLocation) {
      // No waypoints and no live location: keep default center
      // (This happens when viewing old completed trips)
      if (pickup) {
        map.current.setView([pickup.lat, pickup.lng], 13);
      }
    }
  }, [waypoints, pickup, destination, currentLocation, liveUserLocation, showPickupDestination, currentStatus]);

  const toggleFullscreen = () => {
    if (!mapContainer.current) return;
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (mapContainer.current.requestFullscreen) {
        mapContainer.current.requestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const centerToLiveLocation = () => {
    if (!map.current) return;

    if (liveUserLocation) {
      map.current.setView([liveUserLocation.latitude, liveUserLocation.longitude], 15);
      return;
    }

    if (currentLocation) {
      map.current.setView([currentLocation.latitude, currentLocation.longitude], 15);
    }
  };

  return (
    <div className="relative">
      <div ref={mapContainer} className={`w-full ${height} rounded-lg border`} />
      
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <button
          onClick={centerToLiveLocation}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-md border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Lokasi Live"
          disabled={!liveUserLocation && !currentLocation}
        >
          <LocateFixed className="h-5 w-5 text-gray-700" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-md border border-gray-200 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-700" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </div>
    </div>
  );
}

export default GPSMap;
export { GPSMap };
