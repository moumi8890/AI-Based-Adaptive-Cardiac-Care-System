import { MapPin, Loader2, Square } from 'lucide-react';
import { useLocation } from '@/lib/location-context';

export function LocationIndicator() {
  const { isSharing, currentLocation, accuracy, stopSharing } = useLocation();

  if (!isSharing) return null;

  return (
    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-800">Location sharing ON</p>
        <p className="text-xs text-emerald-600 truncate">
          {currentLocation
            ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}${accuracy ? ` (±${Math.round(accuracy)}m)` : ''}`
            : 'Acquiring GPS signal...'}
        </p>
      </div>
      <button
        onClick={() => void stopSharing()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
      >
        <Square className="w-3.5 h-3.5" />
        Stop sharing
      </button>
    </div>
  );
}

export function LocationLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );
}
