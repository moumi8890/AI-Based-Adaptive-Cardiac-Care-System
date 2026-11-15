import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Coords } from '@/lib/geo-utils';

type PatientMapProps = {
  location: Coords;
  accuracy: number | null;
};

export function PatientMap({ location, accuracy }: PatientMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [location.lat, location.lng],
        zoom: 16,
        zoomControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
  }, [location.lat, location.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([location.lat, location.lng], 16);

    if (markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
    } else {
      const icon = L.divIcon({
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#0891b2;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.3);"></div>',
        className: 'patient-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      markerRef.current = L.marker([location.lat, location.lng], { icon }).addTo(map);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([location.lat, location.lng]);
      if (accuracy !== null) circleRef.current.setRadius(accuracy);
    } else if (accuracy !== null && accuracy > 0) {
      circleRef.current = L.circle([location.lat, location.lng], {
        radius: accuracy,
        color: '#0891b2',
        fillColor: '#06b6d4',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    }
  }, [location.lat, location.lng, accuracy]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-96 rounded-xl overflow-hidden border border-slate-200 z-0" />;
}
