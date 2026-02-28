'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GPSWaypoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface GPSMapProps {
  waypoints: GPSWaypoint[];
  pickup?: { lat: number; lng: number; name: string } | null;
  destination?: { lat: number; lng: number; name: string } | null;
  currentLocation?: { latitude: number; longitude: number } | null;
  height?: string;
}

export function GPSMap({
  waypoints,
  pickup,
  destination,
  currentLocation,
  height = 'h-96',
}: GPSMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with default center (Balikpapan)
    const defaultCenter: [number, number] = [-1.2720, 116.7896];
    
    map.current = L.map(mapContainer.current).setView(defaultCenter, 12);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Custom markers
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

    const driverMarker = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iI0VGNDQ0NCIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjEyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });

    const waypointMarker = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjNjM2MzYzIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });

    // Add markers
    if (pickup) {
      L.marker([pickup.lat, pickup.lng], { icon: pickupMarker })
        .addTo(map.current)
        .bindPopup(`<strong>Keberangkatan</strong><br/>${pickup.name}`)
        .openPopup();
    }

    if (destination) {
      L.marker([destination.lat, destination.lng], { icon: destinationMarker })
        .addTo(map.current)
        .bindPopup(`<strong>Tujuan</strong><br/>${destination.name}`);
    }

    if (currentLocation) {
      L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: driverMarker,
      })
        .addTo(map.current)
        .bindPopup('<strong>Lokasi Saat Ini</strong>');
    }

    // Add waypoints
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach((waypoint) => {
        L.marker([waypoint.latitude, waypoint.longitude], {
          icon: waypointMarker,
        })
          .addTo(map.current!)
          .bindPopup(
            `<small>Waktu: ${new Date(waypoint.timestamp).toLocaleTimeString('id-ID')}</small>`
          );
      });

      // Draw polyline connecting waypoints
      const waypointCoords: [number, number][] = waypoints.map((w) => [
        w.latitude,
        w.longitude,
      ]);

      L.polyline(waypointCoords, {
        color: '#FF9800',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1.0,
      }).addTo(map.current);

      // Fit bounds to show all waypoints
      if (waypointCoords.length > 0) {
        const bounds = L.latLngBounds(waypointCoords);
        if (pickup) bounds.extend([pickup.lat, pickup.lng]);
        if (destination) bounds.extend([destination.lat, destination.lng]);
        map.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (pickup && destination) {
      // If no waypoints, fit bounds between pickup and destination
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ]);
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [waypoints, pickup, destination, currentLocation]);

  return <div ref={mapContainer} className={`w-full ${height} rounded-lg border`} />;
}
