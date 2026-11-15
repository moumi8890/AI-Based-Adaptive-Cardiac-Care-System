import { FileText, User as UserIcon, Calendar, Stethoscope, ClipboardList, Pill, ArrowRight } from 'lucide-react';
import { usePatientData } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';
import { RiskBadge, StatusBadge } from '@/components/Badges';

export function DoctorRecommendations() {
  const { doctorNotes, updates, loading } = usePatientData();

  if (loading) return <div className="p-6 text-slate-400">Loading recommendations...</div>;

  return (
    <div>
      <PageHeader title="Doctor Recommendations" subtitle={`Total responses: ${doctorNotes.length}`} />

      {doctorNotes.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No doctor recommendations yet.</p>
          <p className="text-sm text-slate-400">Your doctor will review your health updates and respond here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {doctorNotes.map(note => {
            const relatedUpdate = updates.find(u => u.id === note.health_update_id);
            return (
              <div key={note.id} className="card border-l-4 border-l-cyan-500">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{note.doctor_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {relatedUpdate && (
                    <div className="flex gap-2">
                      <RiskBadge level={relatedUpdate.risk_level} />
                      <StatusBadge status={relatedUpdate.status} />
                    </div>
                  )}
                </div>

                {relatedUpdate && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-400 mb-1">Regarding your submission:</p>
                    <p className="text-sm text-slate-600">{relatedUpdate.symptoms}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(relatedUpdate.created_at).toLocaleDateString()}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {note.doctor_summary && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ClipboardList className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-700">Doctor Summary</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed pl-6">{note.doctor_summary}</p>
                    </div>
                  )}
                  {note.doctor_recommendation && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Pill className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-700">Recommendation</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed pl-6">{note.doctor_recommendation}</p>
                    </div>
                  )}
                  {note.follow_up_instructions && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-700">Follow-up Instructions</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed pl-6">{note.follow_up_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
