import { Clock, Thermometer, Heart, Activity, Droplet, AlertCircle } from 'lucide-react';
import { usePatientData } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';
import { RiskBadge, StatusBadge } from '@/components/Badges';

export function PatientHistory() {
  const { updates, loading } = usePatientData();

  if (loading) return <div className="p-6 text-slate-400">Loading history...</div>;

  return (
    <div>
      <PageHeader title="Health Update History" subtitle={`Total submissions: ${updates.length}`} />

      {updates.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">No health updates submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update, idx) => (
            <div key={update.id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                    #{updates.length - idx}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{new Date(update.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-slate-400">{new Date(update.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <RiskBadge level={update.risk_level} />
                  <StatusBadge status={update.status} />
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Temp', value: update.temperature ? `${update.temperature}°F` : 'N/A', icon: Thermometer, color: 'text-orange-500' },
                  { label: 'Heart Rate', value: update.heart_rate ? `${update.heart_rate} bpm` : 'N/A', icon: Heart, color: 'text-red-500' },
                  { label: 'BP', value: update.blood_pressure_systolic ? `${update.blood_pressure_systolic}/${update.blood_pressure_diastolic}` : 'N/A', icon: Activity, color: 'text-blue-500' },
                  { label: 'SpO2', value: update.oxygen_saturation ? `${update.oxygen_saturation}%` : 'N/A', icon: Droplet, color: 'text-cyan-500' },
                ].map(v => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${v.color}`} />
                        <span className="text-xs text-slate-500">{v.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{v.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Symptoms:</span>
                  <p className="text-slate-700">{update.symptoms || 'None reported'}</p>
                </div>
                {update.feeling && <p className="text-slate-600"><span className="text-slate-400 text-xs">Feeling:</span> {update.feeling}</p>}
                {update.duration && <p className="text-slate-600"><span className="text-slate-400 text-xs">Duration:</span> {update.duration}</p>}
                {update.notes && <p className="text-slate-600"><span className="text-slate-400 text-xs">Notes:</span> {update.notes}</p>}
              </div>

              {update.risk_factors && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400">Risk factors:</span>
                      <p className="text-xs text-slate-600">{update.risk_factors}</p>
                    </div>
                  </div>
                </div>
              )}

              {update.ai_guidance && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">AI Guidance:</span>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{update.ai_guidance}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
