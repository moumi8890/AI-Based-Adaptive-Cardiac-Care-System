import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Thermometer, Heart, Activity, Droplet, AlertCircle, FileText, Send, Loader, Brain, User as UserIcon, Clock, MapPin, Navigation, Hospital as HospitalIcon, GitCompare, ClipboardList } from 'lucide-react';
import { supabase, type ChatMessage, type Hospital, type HealthUpdate } from '@/lib/supabase';
import { useDoctorData, getUpdatesForPatient } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';
import { RiskBadge, StatusBadge } from '@/components/Badges';
import { AgeGroupBadge } from '@/components/AgeGroupBadge';
import { ChatPanel } from '@/components/ChatPanel';
import { DoctorMap } from '@/components/DoctorMap';
import { ReportReviewSection, TreatmentPlanSection } from '@/components/ReportReview';
import { getAgeGroupFromDob, assessVital } from '@/lib/cardiacReference';
import { doctorAIResponse, generateDoctorSummary, type AIContext } from '@/lib/ai-engine';
import { useAuth } from '@/lib/auth-context';
import { nearestHospitals, googleMapsDirections, type Coords } from '@/lib/geo-utils';

const SUGGESTED_QUESTIONS = [
  'Summarize this patient\'s latest issue',
  'Show me their vitals',
  'What are the warning signs?',
  'What do you recommend?',
];

export function PatientDetail({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { patients, allUpdates, allDoctorNotes, refetch } = useDoctorData();
  const patient = patients.find(p => p.id === patientId) || null;
  const updates = getUpdatesForPatient(patientId, allUpdates);
  const latest = updates[0] || null;

  const [doctorSummary, setDoctorSummary] = useState('');
  const [doctorRecommendation, setDoctorRecommendation] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(latest?.status || 'WAITING FOR DOCTOR');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [latestLocationCoords, setLatestLocationCoords] = useState<Coords | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Load hospitals
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('hospitals').select('*').order('name');
      if (data) setHospitals(data as Hospital[]);
    })();
  }, []);

  // Fetch latest location point when patient is sharing
  useEffect(() => {
    if (!patient?.is_sharing_location) {
      setLatestLocationCoords(null);
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
      if (data) setLatestLocationCoords({ lat: data.lat, lng: data.lng });
    })();
  }, [patientId, patient?.is_sharing_location]);

  // Realtime subscription for location updates
  useEffect(() => {
    if (!patient?.is_sharing_location) return;
    const channel = supabase
      .channel(`doc-loc-${patientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_updates', filter: `patient_id=eq.${patientId}` },
        (payload) => {
          const row = payload.new as { lat: number; lng: number };
          setLatestLocationCoords({ lat: row.lat, lng: row.lng });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [patientId, patient?.is_sharing_location]);

  // AI chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load existing AI conversation
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSessionId(data.id);
        setMessages(data.messages || []);
      }
    })();
  }, [user, patientId]);

  const saveMessages = useCallback(async (newMessages: ChatMessage[]) => {
    if (!user) return;
    if (sessionId) {
      await supabase.from('ai_interactions').update({ messages: newMessages, updated_at: new Date().toISOString() }).eq('id', sessionId);
    } else {
      const { data } = await supabase.from('ai_interactions').insert({
        user_id: user.id,
        patient_id: patientId,
        role: 'doctor',
        messages: newMessages,
      }).select().maybeSingle();
      if (data) setSessionId(data.id);
    }
  }, [user, patientId, sessionId]);

  const handleSend = useCallback((message: string) => {
    if (!patient) return;
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const context: AIContext = { role: 'doctor', patient, healthUpdates: updates, latestUpdate: latest };
    const response = doctorAIResponse(message, context);
    const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg, aiMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
  }, [messages, patient, updates, latest, saveMessages]);

  const handleGetSummary = () => {
    if (!patient) return;
    const summary = generateDoctorSummary(patient, updates);
    const userMsg: ChatMessage = { role: 'user', content: 'Summarize this patient\'s latest issue', timestamp: new Date().toISOString() };
    const aiMsg: ChatMessage = { role: 'assistant', content: summary, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg, aiMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
  };

  const handleSendToPatient = async () => {
    if (!latest || !patient) return;
    setError('');
    setSending(true);

    const { error: insertError } = await supabase.from('doctor_notes').insert({
      health_update_id: latest.id,
      patient_id: patient.id,
      doctor_name: 'Dr. Demo',
      doctor_summary: doctorSummary,
      doctor_recommendation: doctorRecommendation,
      follow_up_instructions: followUp,
    });

    if (insertError) {
      setError('Failed to send. Please try again.');
      setSending(false);
      return;
    }

    // Update health update status to REVIEWED
    await supabase.from('health_updates').update({ status: 'REVIEWED' }).eq('id', latest.id);

    setSent(true);
    setSending(false);
    setStatus('REVIEWED');
    setDoctorSummary('');
    setDoctorRecommendation('');
    setFollowUp('');
    refetch();
  };

  if (!patient) {
    return (
      <div>
        <button onClick={onBack} className="btn-secondary mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card text-center py-12">
          <p className="text-slate-400">Patient not found.</p>
        </div>
      </div>
    );
  }

  const ageGroup = getAgeGroupFromDob(patient.date_of_birth, patient.age);

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 3 ? [...prev.slice(1), id] : [...prev, id]
    );
  };

  const compareUpdates = compareIds
    .map(id => updates.find(u => u.id === id))
    .filter((u): u is HealthUpdate => Boolean(u))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const vitals = [
    { label: 'Temperature', value: latest?.temperature ? `${latest.temperature}°F` : 'N/A', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Heart Rate', value: latest?.heart_rate ? `${latest.heart_rate} bpm` : 'N/A', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Blood Pressure', value: latest?.blood_pressure_systolic ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}` : 'N/A', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Oxygen Sat.', value: latest?.oxygen_saturation ? `${latest.oxygen_saturation}%` : 'N/A', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  ];

  return (
    <div>
      <button onClick={onBack} className="btn-secondary mb-4 flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Patient profile header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-slate-500">
                <span>{patient.age} yrs</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <AgeGroupBadge dob={patient.date_of_birth} age={patient.age} />
                <span>•</span>
                <span>Blood: {patient.blood_group}</span>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                <span>Conditions: {patient.medical_conditions || 'None'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {latest && <RiskBadge level={latest.risk_level} />}
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {/* Live location map */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Patient Live Location</h3>
          {patient.is_sharing_location && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <DoctorMap patientId={patientId} isSharing={patient.is_sharing_location} />
        {latestLocationCoords && hospitals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <HospitalIcon className="w-4 h-4 text-red-500" />
              <p className="text-sm font-medium text-slate-700">Nearest Hospitals</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {nearestHospitals(latestLocationCoords, hospitals, 3).map((h) => (
                <div key={h.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                    <p className="text-xs text-cyan-600 font-medium">{h.distanceKm.toFixed(1)} km away</p>
                  </div>
                  <a
                    href={googleMapsDirections(latestLocationCoords, { lat: h.lat, lng: h.lng })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors flex-shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Directions
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column - patient info & history */}
        <div className="space-y-6">
          {/* Current vitals */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Current Vital Signs</h3>
            <div className="grid grid-cols-2 gap-3">
              {vitals.map(v => {
                const Icon = v.icon;
                return (
                  <div key={v.label} className="bg-slate-50 rounded-lg p-3">
                    <div className={`w-9 h-9 rounded-lg ${v.bg} flex items-center justify-center mb-2`}>
                      <Icon className={`w-4.5 h-4.5 ${v.color}`} style={{ width: 18, height: 18 }} />
                    </div>
                    <p className="text-lg font-bold text-slate-800">{v.value}</p>
                    <p className="text-xs text-slate-500">{v.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current symptoms */}
          {latest && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-3">Current Health Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Symptoms:</span>
                  <p className="text-slate-700">{latest.symptoms || 'None reported'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">How patient feels:</span>
                  <p className="text-slate-700">{latest.feeling || 'Not specified'}</p>
                </div>
                {latest.duration && <p className="text-slate-600"><span className="text-xs text-slate-400">Duration:</span> {latest.duration}</p>}
                {latest.notes && <p className="text-slate-600"><span className="text-xs text-slate-400">Notes:</span> {latest.notes}</p>}
              </div>
              {latest.ai_guidance && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <Brain className="w-3.5 h-3.5" /> Patient AI Guidance:
                  </span>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{latest.ai_guidance}</p>
                </div>
              )}
              {latest.risk_factors && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-400">ML Risk Factors:</span>
                      <p className="text-xs text-slate-600">{latest.risk_factors}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Timeline of Previous Submissions</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Select up to 3 submissions to compare side by side.</p>
            {compareUpdates.length >= 2 && (
              <div className="mb-5 overflow-x-auto border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 px-3 pt-3">
                  <GitCompare className="w-4 h-4 text-cyan-600" />
                  <p className="text-sm font-medium text-slate-700">History Comparison</p>
                  <button onClick={() => setCompareIds([])} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Clear</button>
                </div>
                <table className="w-full text-xs mt-2">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="text-left px-3 py-2 font-medium">Metric</th>
                      {compareUpdates.map(u => (
                        <th key={u.id} className="text-left px-3 py-2 font-medium">
                          {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { label: 'Heart rate', get: (u: HealthUpdate) => u.heart_rate, unit: 'bpm', vital: 'heart_rate' as const },
                      { label: 'Systolic BP', get: (u: HealthUpdate) => u.blood_pressure_systolic, unit: 'mmHg', vital: 'bp_systolic' as const },
                      { label: 'Diastolic BP', get: (u: HealthUpdate) => u.blood_pressure_diastolic, unit: 'mmHg', vital: 'bp_diastolic' as const },
                      { label: 'SpO2', get: (u: HealthUpdate) => u.oxygen_saturation, unit: '%', vital: 'spo2' as const },
                    ]).map(row => (
                      <tr key={row.vital} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2 text-slate-500">{row.label}</td>
                        {compareUpdates.map(u => {
                          const a = assessVital(ageGroup.id, row.vital, row.get(u));
                          return (
                            <td key={u.id} className={`px-3 py-2 font-medium ${
                              a.status === 'abnormal' ? 'text-red-600' : a.status === 'borderline' ? 'text-amber-600' : 'text-slate-700'
                            }`}>
                              {row.get(u) !== null ? `${row.get(u)} ${row.unit}` : '—'}
                              {a.status !== 'normal' && a.status !== 'missing' && (
                                <span className="ml-1 text-[10px] font-normal">({a.status})</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-500">Risk level</td>
                      {compareUpdates.map(u => (
                        <td key={u.id} className="px-3 py-2"><RiskBadge level={u.risk_level} /></td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {updates.length === 0 ? (
              <p className="text-sm text-slate-400">No health updates submitted.</p>
            ) : (
              <div className="space-y-3">
                {updates.map((u, i) => (
                  <div key={u.id} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-l-transparent last:pb-0">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-cyan-500" />
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-slate-400">{new Date(u.created_at).toLocaleString()}</span>
                      <RiskBadge level={u.risk_level} />
                      <StatusBadge status={u.status} />
                      <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(u.id)}
                          onChange={() => toggleCompare(u.id)}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        Compare
                      </label>
                    </div>
                    <p className="text-sm text-slate-700">{u.symptoms || 'No symptoms'}</p>
                    {u.feeling && <p className="text-xs text-slate-500 mt-0.5">Feeling: {u.feeling}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - AI assistant & doctor response */}
        <div className="space-y-6">
          {/* Doctor AI Assistant */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Doctor AI Assistant</h3>
              <button onClick={handleGetSummary} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Get Summary
              </button>
            </div>
            <ChatPanel
              title="Doctor AI Assistant"
              subtitle="Patient-specific AI analysis • Educational demo"
              messages={messages}
              onSend={handleSend}
              placeholder="Ask about this patient..."
              suggestedQuestions={messages.length === 0 ? SUGGESTED_QUESTIONS : undefined}
            />
          </div>

          {/* Report review & verification */}
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold text-slate-800">ECG / Echo Reports</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Verify or correct values against the uploaded file. Verified values show "Verified by Dr. {user?.username?.replace(/^Dr\.?\s*/i, '')}" with the date.</p>
            <ReportReviewSection patientId={patientId} patientName={patient.name} />
          </div>

          {/* Treatment plan & follow-up schedule */}
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-800">Treatment Plan & Follow-up</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Plans are only visible to the patient after you approve them. Your name and a timestamp are shown on approval.</p>
            <TreatmentPlanSection
              patientId={patientId}
              patientName={patient.name}
              aiNote={latest?.ai_guidance || null}
            />
          </div>

          {/* Doctor response form */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Doctor's Response</h3>
            </div>

            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <p className="font-medium text-emerald-800">Response sent to patient successfully!</p>
                <p className="text-sm text-emerald-600 mt-1">The patient can now view your recommendation in their dashboard.</p>
                <button onClick={() => setSent(false)} className="text-sm text-cyan-600 mt-2 font-medium">Write another response →</button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">{error}</div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Summary</label>
                    <textarea
                      value={doctorSummary}
                      onChange={e => setDoctorSummary(e.target.value)}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Summarize the patient's current condition..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Recommendation</label>
                    <textarea
                      value={doctorRecommendation}
                      onChange={e => setDoctorRecommendation(e.target.value)}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Provide your recommendation..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Follow-up Instructions</label>
                    <textarea
                      value={followUp}
                      onChange={e => setFollowUp(e.target.value)}
                      className="input-field resize-none"
                      rows={2}
                      placeholder="Follow-up instructions for the patient..."
                    />
                  </div>
                  <button
                    onClick={handleSendToPatient}
                    disabled={sending || (!doctorSummary && !doctorRecommendation && !followUp)}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending...' : 'Send to Patient'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
