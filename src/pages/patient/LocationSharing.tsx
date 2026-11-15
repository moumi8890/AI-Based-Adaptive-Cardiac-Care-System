import { ShieldOff, MapPin, Loader2, AlertCircle, Navigation, Hospital as HospitalIcon } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { usePatientData } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';
import { LocationIndicator } from '@/components/LocationIndicator';
import { PatientMap } from '@/components/PatientMap';
import { ShareLocation } from '@/components/ShareLocation';

export function LocationSharing() {
  const { isSharing, currentLocation, accuracy, error, startSharing, stopSharing, clearError } = useLocation();
  const { patient } = usePatientData();

  const handleStart = async () => {
    clearError();
    await startSharing();
  };

  return (
    <div>
      <PageHeader title="Location Sharing" subtitle="Share your live location with your doctor or emergency contacts" />

      {/* Location indicator (shown when sharing) */}
      <div className="mb-6">
        <LocationIndicator />
      </div>

      {/* Privacy notice */}
      <div className="card mb-6 bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <ShieldOff className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700">Privacy Notice</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your location is only tracked when you tap "Share my live location" and stops when you tap "Stop sharing" or log out.
              Location points are saved to a secure database and automatically deleted 24 hours after sharing ends.
              Your doctor can see your live position only while you are actively sharing. This is an educational demonstration — not for clinical use.
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 text-sm">Dismiss</button>
          </div>
        </div>
      )}

      {/* Consent screen / Start button */}
      {!isSharing && !currentLocation && (
        <div className="card text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Share Your Live Location</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Tap the button below to start sharing your real-time GPS location. Your doctor will be able to see your position on a map, and you'll be able to generate emergency share links and find nearby hospitals.
          </p>
          <button onClick={handleStart} className="btn-primary inline-flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Share my live location
          </button>
          <p className="text-xs text-slate-400 mt-4">
            Your browser will ask for location permission. GPS works best outdoors.
          </p>
        </div>
      )}

      {/* Map + controls when sharing */}
      {isSharing && currentLocation && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-800">Your Live Location</h3>
              </div>
              <button
                onClick={() => void stopSharing()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Stop sharing
              </button>
            </div>
            {accuracy !== null && (
              <p className="text-xs text-slate-500 mb-3">
                GPS accuracy: ±{Math.round(accuracy)}m — blue circle shows the accuracy range
              </p>
            )}
            <PatientMap location={currentLocation} accuracy={accuracy} />
          </div>

          <ShareLocation patientName={patient?.name || 'Patient'} patientPhone={patient?.phone || null} />
        </div>
      )}

      {/* Loading state: sharing but no fix yet */}
      {isSharing && !currentLocation && (
        <div className="card text-center py-10">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Acquiring GPS signal... Please make sure location is enabled.</p>
        </div>
      )}
    </div>
  );
}
