import { useState } from 'react';
import { Activity, Heart, Droplet, Thermometer, Clock, FileText, TrendingUp, Calendar, MapPin, AlertCircle, X, ShieldCheck, Loader2, ChartLine, ClipboardList, CalendarClock } from 'lucide-react';
import { usePatientData, useCardiacReports, useTreatmentPlans } from '@/lib/hooks';
import { useLocation } from '@/lib/location-context';
import { PageHeader } from '@/components/Layout';
import { RiskBadge, StatusBadge } from '@/components/Badges';
import { PatientMap } from '@/components/PatientMap';
import { AgeGroupBadge } from '@/components/AgeGroupBadge';
import { VitalTrendChart } from '@/components/VitalTrendChart';
import { getAgeGroupFromDob, assessVital, type VitalKey } from '@/lib/cardiacReference';
import type { PageProps } from '@/App';

export function PatientDashboard({ onNavigate }: PageProps) {
  const { patient, updates, doctorNotes, loading } = usePatientData();
  const { reports } = useCardiacReports(patient?.id);
  const { plans, followUps } = useTreatmentPlans(patient?.id, true);
  const { isSharing, currentLocation, accuracy, error, startSharing, stopSharing, clearError } = useLocation();
  const [showConsent, setShowConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const latestUpdate = updates[0] || null;

  if (loading) {
    return <div className="p-6 text-slate-400">Loading your dashboard...</div>;
  }

  if (!patient) {
    return <div className="p-6 text-slate-400">Patient profile not found.</div>;
  }

  const handleConsentAccept = async () => {
    setShowConsent(false);
    setStarting(true);
    clearError();
    await startSharing();
    setStarting(false);
  };

  const ageGroup = getAgeGroupFromDob(patient.date_of_birth, patient.age);

  const vitalAssessments: Array<{ key: VitalKey; label: string; value: string; icon: typeof Heart; color: string; bg: string; status: ReturnType<typeof assessVital>['status'] }> = [
    { key: 'heart_rate', label: 'Heart Rate', value: latestUpdate?.heart_rate ? `${latestUpdate.heart_rate} bpm` : 'N/A', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', status: assessVital(ageGroup.id, 'heart_rate', latestUpdate?.heart_rate).status },
    { key: 'bp_systolic', label: 'Blood Pressure', value: latestUpdate?.blood_pressure_systolic ? `${latestUpdate.blood_pressure_systolic}/${latestUpdate.blood_pressure_diastolic}` : 'N/A', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', status: assessVital(ageGroup.id, 'bp_systolic', latestUpdate?.blood_pressure_systolic).status },
    { key: 'spo2', label: 'Oxygen Sat.', value: latestUpdate?.oxygen_saturation ? `${latestUpdate.oxygen_saturation}%` : 'N/A', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-50', status: assessVital(ageGroup.id, 'spo2', latestUpdate?.oxygen_saturation).status },
  ];

  const statusStyles: Record<string, string> = {
    normal: 'border-slate-200',
    borderline: 'border-amber-300 bg-amber-50/40',
    abnormal: 'border-red-300 bg-red-50/40',
    missing: 'border-slate-200',
  };

  const trendSeries = (key: VitalKey) =>
    [...updates]
      .reverse()
      .map(u => ({
        value: key === 'heart_rate' ? u.heart_rate : key === 'spo2' ? u.oxygen_saturation : key === 'bp_systolic' ? u.blood_pressure_systolic : u.blood_pressure_diastolic,
        date: u.created_at,
      }));

  return (
    <div>
      <PageHeader title={`Welcome, ${patient.name}`} subtitle="Your health overview at a glance">
        <div className="flex items-center gap-3">
          {!isSharing && (
            <button
              onClick={() => setShowConsent(true)}
              disabled={starting}
              className="btn-secondary flex items-center gap-2"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Share my live location
            </button>
          )}
          <button onClick={() => onNavigate('my-health')} className="btn-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Update My Health
          </button>
        </div>
      </PageHeader>

      {/* Consent popup */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Share Live Location</h3>
              </div>
              <button onClick={() => setShowConsent(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-600">
                Your doctor will be able to see your real-time position on a map while you are sharing.
              </p>
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p>
                  Location is tracked only while you are actively sharing. You can stop at any time.
                  Points are automatically deleted 24 hours after sharing ends.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Your browser will ask for location permission. GPS works best outdoors.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConsent(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleConsentAccept} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                Start sharing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location error */}
      {error && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 text-sm">Dismiss</button>
          </div>
        </div>
      )}

      {/* Live location card */}
      {isSharing && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h3 className="font-semibold text-slate-800">Location sharing ON</h3>
            </div>
            <button
              onClick={() => void stopSharing()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              Stop sharing
            </button>
          </div>
          {currentLocation ? (
            <>
              <p className="text-xs text-slate-500 mb-3">
                {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                {accuracy ? ` (±${Math.round(accuracy)}m)` : ''}
              </p>
              <PatientMap location={currentLocation} accuracy={accuracy} />
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              Acquiring GPS signal...
            </div>
          )}
        </div>
      )}

      {/* Profile card */}
      <div className="card mb-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
            {patient.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
              <span>Age: {patient.age}</span>
              <AgeGroupBadge dob={patient.date_of_birth} age={patient.age} />
              <span>Gender: {patient.gender}</span>
              <span>Blood: {patient.blood_group}</span>
              <span>Conditions: {patient.medical_conditions || 'None'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {latestUpdate && <RiskBadge level={latestUpdate.risk_level} />}
            <span className="text-sm text-slate-500">Status: {patient.current_status}</span>
          </div>
        </div>
      </div>

      {/* Vitals grid — highlighted against age-specific reference ranges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Temperature', value: latestUpdate?.temperature ? `${latestUpdate.temperature}°F` : 'N/A', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50', status: 'normal' as const },
          ...vitalAssessments,
        ].map(v => {
          const Icon = v.icon;
          const flagged = v.status === 'abnormal' || v.status === 'borderline';
          return (
            <div key={v.label} className={`card ${statusStyles[v.status]} ${flagged ? 'border-2' : ''}`}>
              <div className={`w-10 h-10 rounded-lg ${v.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${v.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{v.value}</p>
              <p className="text-sm text-slate-500">{v.label}</p>
              {v.status === 'abnormal' && <p className="text-xs font-medium text-red-600 mt-1">Abnormal for your age</p>}
              {v.status === 'borderline' && <p className="text-xs font-medium text-amber-600 mt-1">Borderline for your age</p>}
            </div>
          );
        })}
      </div>

      {/* Doctor-approved treatment plan (only APPROVED plans are fetched) */}
      {plans.length > 0 && (
        <div className="card mb-6 border-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800">My Treatment Plan</h3>
          </div>
          <div className="space-y-3">
            {plans.map(p => (
              <div key={p.id} className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3" /> Doctor-approved — Dr. {p.doctor_name.replace(/^Dr\.?\s*/i, '')}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(p.updated_at).toLocaleString()}</span>
                </div>
                {p.medications && <p className="text-sm text-slate-700"><strong>Medications:</strong> {p.medications}</p>}
                {p.lifestyle_recommendations && <p className="text-sm text-slate-700"><strong>Lifestyle:</strong> {p.lifestyle_recommendations}</p>}
                {p.follow_up_instructions && <p className="text-sm text-slate-700"><strong>Follow-up:</strong> {p.follow_up_instructions}</p>}
                {p.doctor_note && <p className="text-xs text-slate-600 mt-1">Doctor note: {p.doctor_note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up schedule */}
      {followUps.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-slate-800">Follow-up Schedule</h3>
          </div>
          <div className="space-y-2">
            {followUps.map(fu => (
              <div key={fu.id} className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{fu.title}</p>
                  <p className="text-xs text-slate-400">{fu.due_date ? `Due ${new Date(fu.due_date).toLocaleDateString()}` : 'Date to be confirmed'} • by Dr. {fu.doctor_name.replace(/^Dr\.?\s*/i, '')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vitals history trends */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartLine className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Vitals Over Time</h3>
          <span className="text-xs text-slate-400">green = normal, amber = borderline, red = abnormal for your age group ({ageGroup.label})</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <VitalTrendChart group={ageGroup.id} vital="heart_rate" points={trendSeries('heart_rate')} />
          <VitalTrendChart group={ageGroup.id} vital="bp_systolic" points={trendSeries('bp_systolic')} />
          <VitalTrendChart group={ageGroup.id} vital="bp_diastolic" points={trendSeries('bp_diastolic')} />
          <VitalTrendChart group={ageGroup.id} vital="spo2" points={trendSeries('spo2')} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Previous health updates */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Previous Health Updates</h3>
          </div>
          {updates.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No health updates yet. Submit your first update!</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {updates.slice(0, 5).map(update => (
                <div key={update.id} className="border border-slate-200 rounded-lg p-3 hover:border-cyan-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">{new Date(update.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <RiskBadge level={update.risk_level} />
                      <StatusBadge status={update.status} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{update.symptoms || 'No symptoms reported'}</p>
                  {update.feeling && <p className="text-xs text-slate-500 mt-1">Feeling: {update.feeling}</p>}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onNavigate('history')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium mt-3">
            View all history →
          </button>
        </div>

        {/* Doctor recommendations */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Doctor Recommendations</h3>
          </div>
          {doctorNotes.length === 0 ? (
            <div className="py-4">
              <p className="text-sm text-slate-400 mb-3">No doctor recommendations yet. Your doctor will review your submissions and respond here.</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Check back after submitting a health update</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {doctorNotes.slice(0, 3).map(note => (
                <div key={note.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{note.doctor_name}</span>
                    <span className="text-xs text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                  {note.doctor_summary && <p className="text-sm text-slate-600 mb-2">{note.doctor_summary}</p>}
                  {note.doctor_recommendation && (
                    <p className="text-xs text-slate-500"><strong>Recommendation:</strong> {note.doctor_recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onNavigate('recommendations')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium mt-3">
            View all recommendations →
          </button>
        </div>
      </div>

      {/* Latest reports */}
      {reports.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">My ECG / Echo Reports</h3>
          </div>
          <div className="space-y-2">
            {reports.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{r.report_type} Report — {new Date(r.created_at).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-400">
                    {r.verification === 'VERIFIED'
                      ? `Verified by Dr. ${r.verified_by?.replace(/^Dr\.?\s*/i, '')}`
                      : r.verification === 'REJECTED'
                      ? 'Re-entry required'
                      : 'Awaiting doctor verification'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('my-reports')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium mt-3">
            View all reports / upload →
          </button>
        </div>
      )}
    </div>
  );
}
