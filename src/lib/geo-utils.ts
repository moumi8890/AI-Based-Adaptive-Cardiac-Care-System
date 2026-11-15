import type { Hospital } from '@/lib/supabase';

export type Coords = { lat: number; lng: number };

export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export type HospitalWithDistance = Hospital & { distanceKm: number };

export function nearestHospitals(point: Coords, hospitals: Hospital[], limit = 5): HospitalWithDistance[] {
  return hospitals
    .map(h => ({ ...h, distanceKm: haversineKm(point, { lat: h.lat, lng: h.lng }) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function googleMapsDirections(from: Coords, to: Coords): string {
  return `https://www.google.com/maps/dir/${from.lat},${from.lng}/${to.lat},${to.lng}`;
}

export function whatsappLink(phone: string | null, message: string): string {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return `https://wa.me/?text=${encodeURIComponent(message)}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function smsLink(phone: string | null, message: string): string {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}
