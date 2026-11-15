import { useState, useEffect } from 'react';
import { Share2, MapPin, Phone, MessageSquare, Navigation, Hospital as HospitalIcon, Loader2 } from 'lucide-react';
import { supabase, type Hospital } from '@/lib/supabase';
import { useLocation } from '@/lib/location-context';
import { nearestHospitals, googleMapsLink, googleMapsDirections, whatsappLink, smsLink, type Coords } from '@/lib/geo-utils';

type ShareLocationProps = {
  patientName: string;
  patientPhone: string | null;
};

export function ShareLocation({ patientName, patientPhone }: ShareLocationProps) {
  const { currentLocation, isSharing } = useLocation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('hospitals').select('*').order('name');
      if (data) setHospitals(data as Hospital[]);
      setLoadingHospitals(false);
    })();
  }, []);

  if (!currentLocation) {
    return (
      <div className="card text-center py-8">
        <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Start sharing your location to generate share links and find nearby hospitals.</p>
      </div>
    );
  }

  const coords: Coords = currentLocation;
  const mapsUrl = googleMapsLink(coords.lat, coords.lng);
  const shareMessage = `${patientName} is sharing their live location via MediConnect AI. View on map: ${mapsUrl}`;
  const nearby = nearestHospitals(coords, hospitals, 5);

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Share links */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Share My Location</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Your location links are ready. Tap a link below to open it — you will need to press send yourself. Nothing is sent automatically.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-medium text-sm transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Google Maps
          </a>
          <a
            href={whatsappLink(patientPhone, shareMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors"
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={smsLink(patientPhone, shareMessage)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            SMS
          </a>
        </div>
        <button
          onClick={handleCopy}
          className="mt-3 text-sm text-slate-500 hover:text-slate-700 font-medium"
        >
          {copied ? 'Copied to clipboard!' : 'Copy message to clipboard'}
        </button>
      </div>

      {/* Nearest hospitals */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <HospitalIcon className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-slate-800">Nearest Hospitals</h3>
        </div>
        {loadingHospitals ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Finding hospitals near you...
          </div>
        ) : nearby.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No hospital data available.</p>
        ) : (
          <div className="space-y-3">
            {nearby.map((h, i) => (
              <div key={h.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:border-cyan-300 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                    <p className="text-xs text-slate-500">{h.specialties}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="font-medium text-cyan-600">{h.distanceKm.toFixed(1)} km away</span>
                      {h.phone && <span>{h.phone}</span>}
                    </div>
                  </div>
                </div>
                <a
                  href={googleMapsDirections(coords, { lat: h.lat, lng: h.lng })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors flex-shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Directions
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
