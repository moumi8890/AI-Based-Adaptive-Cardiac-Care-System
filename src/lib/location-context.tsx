import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Coords } from '@/lib/geo-utils';

type LocationState = {
  isSharing: boolean;
  currentLocation: Coords | null;
  accuracy: number | null;
  error: string | null;
  isHttpsOrLocalhost: boolean;
  startSharing: () => Promise<void>;
  stopSharing: () => Promise<void>;
  clearError: () => void;
};

const LocationContext = createContext<LocationState | undefined>(undefined);

const isHttpsOrLocalhost = () => {
  if (typeof window === 'undefined') return true;
  const { protocol, hostname } = window.location;
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSaveRef = useRef<number>(0);
  const patientIdRef = useRef<string | null>(null);

  patientIdRef.current = user?.patient_id ?? null;

  const deleteOldTrails = useCallback(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('location_updates').delete().lt('created_at', cutoff);
  }, []);

  const insertLocationPoint = useCallback(async (coords: Coords, acc: number | null, spd: number | null) => {
    const pid = patientIdRef.current;
    if (!pid) return;
    await supabase.from('location_updates').insert({
      patient_id: pid,
      lat: coords.lat,
      lng: coords.lng,
      accuracy: acc,
      speed: spd,
    });
  }, []);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const acc = pos.coords.accuracy ?? null;
    const spd = pos.coords.speed ?? null;
    setCurrentLocation(coords);
    setAccuracy(acc);
    setError(null);
    const now = Date.now();
    if (now - lastSaveRef.current >= 10000) {
      lastSaveRef.current = now;
      void insertLocationPoint(coords, acc, spd);
    }
  }, [insertLocationPoint]);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Location error occurred.';
    if (err.code === err.PERMISSION_DENIED) msg = 'Location permission denied. Please allow location access in your browser settings.';
    else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location information is unavailable. Please check your GPS or network connection.';
    else if (err.code === err.TIMEOUT) msg = 'Location request timed out. Please try again.';
    setError(msg);
    stopTracking();
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    setCurrentLocation(null);
    setAccuracy(null);
    lastSaveRef.current = 0;
  }, []);

  const setSharingFlag = useCallback(async (pid: string, sharing: boolean) => {
    await supabase.from('patients').update({ is_sharing_location: sharing }).eq('id', pid);
  }, []);

  const startSharing = useCallback(async () => {
    setError(null);
    if (!isHttpsOrLocalhost()) {
      setError('Location tracking requires HTTPS or localhost. Please use a secure connection.');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    const pid = patientIdRef.current;
    if (!pid) {
      setError('No patient profile linked to your account.');
      return;
    }
    await setSharingFlag(pid, true);
    void deleteOldTrails();
    setIsSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    );
  }, [handlePosition, handleError, setSharingFlag, deleteOldTrails]);

  const stopSharing = useCallback(async () => {
    const pid = patientIdRef.current;
    if (pid) await setSharingFlag(pid, false);
    stopTracking();
    void deleteOldTrails();
  }, [setSharingFlag, stopTracking, deleteOldTrails]);

  const clearError = useCallback(() => setError(null), []);

  // Stop sharing when user changes or logs out
  useEffect(() => {
    if (!user) {
      void stopSharing();
    }
  }, [user, stopSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <LocationContext.Provider value={{ isSharing, currentLocation, accuracy, error, isHttpsOrLocalhost: isHttpsOrLocalhost(), startSharing, stopSharing, clearError }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
