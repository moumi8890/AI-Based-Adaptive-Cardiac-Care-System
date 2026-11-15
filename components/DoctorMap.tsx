import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { supabase, type LocationUpdate } from '@/lib/supabase';
import { MapPin, Clock } from 'lucide-react';

type DoctorMapProps = {
  patientId: string;
  isSharing: boolean;
};

export function DoctorMap({ patientId, isSharing }: DoctorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [latestPoint, setLatestPoint] = useState<LocationUpdate | null>(null);

  // Fetch latest point on mount and when sharing toggles
  useEffect(() => {
    if (!isSharing) {
      setLatestPoint(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('location_updates')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLatestPoint(data as LocationUpdate);
    })();
  }, [patientId, isSharing]);

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!isSharing) return;
    const channel = supabase
      .channel(`location-${patientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_updates', filter: `patient_id=eq.${patientId}` },
        (payload) => {
          setLatestPoint(payload.new as LocationUpdate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, isSharing]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!latestPoint) return;
    mapRef.current = L.map(containerRef.current, {
      center: [latestPoint.lat, latestPoint.lng],
      zoom: 16,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [latestPoint]);

  // Update marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !latestPoint) return;
    map.setView([latestPoint.lat, latestPoint.lng], 16);

    if (markerRef.current) {
      markerRef.current.setLatLng([latestPoint.lat, latestPoint.lng]);
    } else {
      const icon = L.divIcon({
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.3);"></div>',
        className: 'doctor-patient-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      markerRef.current = L.marker([latestPoint.lat, latestPoint.lng], { icon }).addTo(map);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([latestPoint.lat, latestPoint.lng]);
      if (latestPoint.accuracy) circleRef.current.setRadius(latestPoint.accuracy);
    } else if (latestPoint.accuracy && latestPoint.accuracy > 0) {
      circleRef.current = L.circle([latestPoint.lat, latestPoint.lng], {
        radius: latestPoint.accuracy,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    }
  }, [latestPoint]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  if (!isSharing && !latestPoint) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Patient is not currently sharing their location.</p>
        </div>
      </div>
    );
  }

  if (isSharing && !latestPoint) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Waiting for location data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 z-0" />
      {latestPoint && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Last updated: {new Date(latestPoint.created_at).toLocaleString()}</span>
          {latestPoint.accuracy && <span className="text-slate-400">GPS accuracy: ±{Math.round(latestPoint.accuracy)}m</span>}
        </div>
      )}
    </div>
  );
}
