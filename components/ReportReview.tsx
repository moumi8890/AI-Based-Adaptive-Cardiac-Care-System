import { useState } from 'react';
import { CheckCircle, XCircle, Loader, FileText, Activity, Eye, Pencil, X, ShieldCheck, AlertTriangle, ClipboardList, Plus, Trash2, CalendarClock } from 'lucide-react';
import { supabase, type CardiacReport, type FollowUp } from '@/lib/supabase';
import { useCardiacReports, useTreatmentPlans } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { BadgeCheck } from 'lucide-react';

const ECG_FIELDS: Array<{ key: keyof CardiacReport; label: string }> = [
  { key: 'ecg_heart_rate', label: 'Heart Rate (bpm)' },
  { key: 'ecg_pr_interval', label: 'PR Interval (ms)' },
  { key: 'ecg_qrs_duration', label: 'QRS Duration (ms)' },
  { key: 'ecg_qt_interval', label: 'QT Interval (ms)' },
  { key: 'ecg_qtc_interval', label: 'QTc Interval (ms)' },
];

const ECHO_TEXT_FIELDS: Array<{ key: keyof CardiacReport; label: string }> = [
  { key: 'echo_ventricular_function', label: 'Ventricular Function' },
  { key: 'echo_valve_abnormalities', label: 'Valve Abnormalities' },
  { key: 'echo_structural_findings', label: 'Structural Findings' },
];

export function ReportReviewSection({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { user } = useAuth();
  const { reports, refetch } = useCardiacReports(patientId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<CardiacReport | null>(null);

  const doctorName = user?.username || 'Doctor';

  const startEdit = (r: CardiacReport) => {
    setEditingId(r.id);
    setEdits({});
    setError('');
  };

  const saveVerification = async (r: CardiacReport, verdict: 'VERIFIED' | 'REJECTED') => {
    if (!user?.patient_id && !r.id) return;
    setBusy(r.id);
    setError('');

    const num = (k: string) => (edits[k]?.trim() ? parseInt(edits[k], 10) : (r[k as keyof CardiacReport] as number | null));
    const txt = (k: string) => (edits[k] !== undefined ? (edits[k].trim() || null) : (r[k as keyof CardiacReport] as string | null));

    const updates: Partial<CardiacReport> = {
      verification: verdict,
      verified_by: doctorName,
      verified_at: new Date().toISOString(),
    };
    if (r.report_type === 'ECG') {
      updates.ecg_heart_rate = num('ecg_heart_rate');
      updates.ecg_pr_interval = num('ecg_pr_interval');
      updates.ecg_qrs_duration = num('ecg_qrs_duration');
      updates.ecg_qt_interval = num('ecg_qt_interval');
      updates.ecg_qtc_interval = num('ecg_qtc_interval');
      updates.ecg_rhythm = txt('ecg_rhythm');
      updates.ecg_abnormalities = txt('ecg_abnormalities');
    } else {
      updates.echo_lvef = num('echo_lvef');
      updates.echo_ventricular_function = txt('echo_ventricular_function');
      updates.echo_valve_abnormalities = txt('echo_valve_abnormalities');
      updates.echo_structural_findings = txt('echo_structural_findings');
    }
    if (edits.verification_notes?.trim()) updates.verification_notes = edits.verification_notes.trim();

    const { error: updErr } = await supabase.from('cardiac_reports').update(updates).eq('id', r.id);
    setBusy(null);
    if (updErr) {
      setError('Failed to save verification. Please try again.');
      return;
    }
    setEditingId(null);
    setEdits({});
    refetch();
  };

  if (reports.length === 0) {
    return (
      <div className="card text-center py-8">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No ECG/Echo reports uploaded by {patientName} yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
      {reports.map(r => {
        const isEditing = editingId === r.id;
        const Icon = r.report_type === 'ECG' ? FileText : Activity;
        return (
          <div key={r.id} className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{r.report_type} Report</p>
                  <p className="text-xs text-slate-400">
                    Uploaded by {r.uploaded_by} • {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.verification === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Verified — Dr. {r.verified_by?.replace(/^Dr\.?\s*/i, '')}
                    {r.verified_at && ` • ${new Date(r.verified_at).toLocaleDateString()}`}
                  </span>
                ) : r.verification === 'REJECTED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Rejected — re-entry needed</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">PENDING</span>
                )}
                {!isEditing && (
                  <button onClick={() => startEdit(r)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Verify / Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Fields */}
              <div>
                {isEditing ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-500">Correct any value that does not match the report file. Blank keeps the existing value.</p>
                    {r.report_type === 'ECG' ? (
                      <>
                        {ECG_FIELDS.map(f => (
                          <div key={f.key} className="flex items-center gap-2">
                            <label className="w-36 text-xs text-slate-600">{f.label}</label>
                            <input
                              type="number"
                              className="input-field py-1.5 text-sm"
                              placeholder={String(r[f.key] ?? '')}
                              value={edits[f.key as string] ?? ''}
                              onChange={e => setEdits(p => ({ ...p, [f.key as string]: e.target.value }))}
                            />
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <label className="w-36 text-xs text-slate-600">Rhythm</label>
                          <input
                            type="text"
                            className="input-field py-1.5 text-sm"
                            placeholder={r.ecg_rhythm || ''}
                            value={edits.ecg_rhythm ?? ''}
                            onChange={e => setEdits(p => ({ ...p, ecg_rhythm: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="w-36 text-xs text-slate-600">Abnormalities</label>
                          <input
                            type="text"
                            className="input-field py-1.5 text-sm"
                            placeholder={r.ecg_abnormalities || ''}
                            value={edits.ecg_abnormalities ?? ''}
                            onChange={e => setEdits(p => ({ ...p, ecg_abnormalities: e.target.value }))}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="w-36 text-xs text-slate-600">LVEF (%)</label>
                          <input
                            type="number"
                            className="input-field py-1.5 text-sm"
                            placeholder={String(r.echo_lvef ?? '')}
                            value={edits.echo_lvef ?? ''}
                            onChange={e => setEdits(p => ({ ...p, echo_lvef: e.target.value }))}
                          />
                        </div>
                        {ECHO_TEXT_FIELDS.map(f => (
                          <div key={f.key} className="flex items-center gap-2">
                            <label className="w-36 text-xs text-slate-600">{f.label}</label>
                            <input
                              type="text"
                              className="input-field py-1.5 text-sm"
                              placeholder={String(r[f.key] ?? '')}
                              value={edits[f.key as string] ?? ''}
                              onChange={e => setEdits(p => ({ ...p, [f.key as string]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </>
                    )}
                    <div>
                      <label className="text-xs text-slate-600">Verification note (optional)</label>
                      <input
                        type="text"
                        className="input-field py-1.5 text-sm"
                        placeholder="e.g. QTc corrected per report"
                        value={edits.verification_notes ?? ''}
                        onChange={e => setEdits(p => ({ ...p, verification_notes: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveVerification(r, 'VERIFIED')}
                        disabled={busy === r.id}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60"
                      >
                        {busy === r.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Confirm values
                      </button>
                      <button
                        onClick={() => saveVerification(r, 'REJECTED')}
                        disabled={busy === r.id}
                        className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button onClick={() => { setEditingId(null); setEdits({}); }} className="text-sm text-slate-400 hover:text-slate-600 px-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    {r.report_type === 'ECG' ? (
                      <>
                        <p><span className="text-xs text-slate-400">Heart rate:</span> {r.ecg_heart_rate ?? '—'} bpm</p>
                        <p><span className="text-xs text-slate-400">PR interval:</span> {r.ecg_pr_interval ?? '—'} ms</p>
                        <p><span className="text-xs text-slate-400">QRS duration:</span> {r.ecg_qrs_duration ?? '—'} ms</p>
                        <p><span className="text-xs text-slate-400">QT / QTc:</span> {r.ecg_qt_interval ?? '—'} / {r.ecg_qtc_interval ?? '—'} ms</p>
                        <p><span className="text-xs text-slate-400">Rhythm:</span> {r.ecg_rhythm || '—'}</p>
                        <p><span className="text-xs text-slate-400">Abnormalities:</span> {r.ecg_abnormalities || '—'}</p>
                      </>
                    ) : (
                      <>
                        <p><span className="text-xs text-slate-400">LVEF:</span> {r.echo_lvef !== null ? `${r.echo_lvef}%` : '—'}</p>
                        <p><span className="text-xs text-slate-400">Ventricular function:</span> {r.echo_ventricular_function || '—'}</p>
                        <p><span className="text-xs text-slate-400">Valve abnormalities:</span> {r.echo_valve_abnormalities || '—'}</p>
                        <p><span className="text-xs text-slate-400">Structural findings:</span> {r.echo_structural_findings || '—'}</p>
                      </>
                    )}
                    {r.verification_notes && (
                      <p className="text-xs text-slate-500 pt-1"><ShieldCheck className="w-3 h-3 inline mr-1 text-emerald-600" />{r.verification_notes}</p>
                    )}
                  </div>
                )}
              </div>

              {/* File preview side-by-side */}
              <div>
                {r.file_url ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                      <span>{r.file_name}</span>
                      <button onClick={() => setPreview(r)} className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Full view
                      </button>
                    </div>
                    {r.file_type === 'application/pdf' ? (
                      <iframe src={`${r.file_url}#toolbar=0`} className="w-full h-64" title="Report file" />
                    ) : (
                      <img src={r.file_url} alt="Report" className="w-full max-h-64 object-contain bg-slate-50" />
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-lg h-full min-h-32 flex items-center justify-center text-xs text-slate-400">
                    No file attached — values entered manually
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <p className="font-semibold text-slate-800">{preview.report_type} Report — {preview.file_name}</p>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {preview.file_type === 'application/pdf' ? (
                <iframe src={preview.file_url ?? ''} className="w-full h-[70vh]" title="Report file" />
              ) : (
                <img src={preview.file_url ?? ''} alt="Report" className="max-w-full mx-auto" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type FuDraft = { title: string; due_date: string; instructions: string };

export function TreatmentPlanSection({ patientId, patientName, aiNote }: { patientId: string; patientName: string; aiNote: string | null }) {
  const { user } = useAuth();
  const { plans, followUps, refetch } = useTreatmentPlans(patientId);
  const [medications, setMedications] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [doctorNote, setDoctorNote] = useState('');
  const [useAiNote, setUseAiNote] = useState(false);
  const [fuDrafts, setFuDrafts] = useState<FuDraft[]>([{ title: '', due_date: '', instructions: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  const doctorName = user?.username || 'Doctor';

  const handleCreate = async () => {
    setError('');
    if (!medications.trim() && !lifestyle.trim() && !doctorNote.trim()) {
      setError('Add at least one of: medications, lifestyle recommendations, or a plan note.');
      return;
    }
    setSaving(true);
    try {
      // Status is APPROVED from creation: the doctor authoring it IS the approval.
      // Patients only ever see APPROVED plans — enforced by the approvedOnly query.
      const { data: plan, error: planErr } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: patientId,
          doctor_name: doctorName,
          status: 'APPROVED',
          medications: medications.trim() || null,
          lifestyle_recommendations: lifestyle.trim() || null,
          follow_up_date: followUpDate || null,
          follow_up_instructions: followUpInstructions.trim() || null,
          ai_note: useAiNote && aiNote ? aiNote : null,
          doctor_note: doctorNote.trim() || null,
          approval_note: `Doctor-approved by ${doctorName}`,
        })
        .select()
        .single();
      if (planErr || !plan) throw new Error('Failed to save the treatment plan.');

      const validFus = fuDrafts.filter(f => f.title.trim());
      if (validFus.length > 0) {
        const { error: fuErr } = await supabase.from('follow_ups').insert(
          validFus.map(f => ({
            patient_id: patientId,
            doctor_name: doctorName,
            title: f.title.trim(),
            due_date: f.due_date || null,
            instructions: f.instructions.trim() || null,
          }))
        );
        if (fuErr) throw new Error('Plan saved but follow-up entries failed. Please re-add them.');
      }

      setCreated(true);
      setMedications(''); setLifestyle(''); setFollowUpDate(''); setFollowUpInstructions(''); setDoctorNote('');
      setFuDrafts([{ title: '', due_date: '', instructions: '' }]);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFu = async (fu: FollowUp) => {
    await supabase.from('follow_ups').delete().eq('id', fu.id);
    refetch();
  };

  return (
    <div className="space-y-5">
      {created && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" /> Treatment plan approved and visible to {patientName}.
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

      {/* Existing plans */}
      {plans.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-slate-400" /> Plan history</p>
          {plans.map(p => (
            <div key={p.id} className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> Doctor-approved — Dr. {p.doctor_name.replace(/^Dr\.?\s*/i, '')}
                </span>
                <span className="text-[10px] text-slate-400">{new Date(p.updated_at).toLocaleString()}</span>
              </div>
              {p.medications && <p className="text-sm text-slate-700"><strong>Medications:</strong> {p.medications}</p>}
              {p.lifestyle_recommendations && <p className="text-sm text-slate-700"><strong>Lifestyle:</strong> {p.lifestyle_recommendations}</p>}
              {p.follow_up_instructions && <p className="text-sm text-slate-700"><strong>Follow-up:</strong> {p.follow_up_instructions}</p>}
              {p.follow_up_date && <p className="text-xs text-slate-500">Review date: {new Date(p.follow_up_date).toLocaleDateString()}</p>}
              {p.ai_note && <p className="text-xs text-slate-500 mt-1 border-t border-emerald-100 pt-1">AI suggestion considered: {p.ai_note}</p>}
              {p.doctor_note && <p className="text-xs text-slate-600 mt-1">Doctor note: {p.doctor_note}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Follow-up schedule management */}
      {followUps.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-slate-400" /> Follow-up schedule</p>
          {followUps.map(fu => (
            <div key={fu.id} className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{fu.title}</p>
                <p className="text-xs text-slate-400">
                  {fu.due_date ? `Due ${new Date(fu.due_date).toLocaleDateString()}` : 'No date set'} • {fu.status}
                </p>
              </div>
              <button onClick={() => handleDeleteFu(fu)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New plan form */}
      <div className="border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-600" /> Create new treatment plan</p>
        {aiNote && (
          <label className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3 mb-3 cursor-pointer">
            <input type="checkbox" checked={useAiNote} onChange={e => setUseAiNote(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            <span><strong>Include AI suggestion on record</strong> (the patient sees it labeled as AI, alongside your approved plan): {aiNote}</span>
          </label>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medications</label>
            <input type="text" value={medications} onChange={e => setMedications(e.target.value)} className="input-field" placeholder="e.g. Aspirin 75mg daily" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lifestyle recommendations</label>
            <textarea value={lifestyle} onChange={e => setLifestyle(e.target.value)} className="input-field resize-none" rows={2} placeholder="Diet, exercise, smoking cessation..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up review date</label>
              <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up instructions</label>
              <input type="text" value={followUpInstructions} onChange={e => setFollowUpInstructions(e.target.value)} className="input-field" placeholder="e.g. Repeat ECG before visit" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan note</label>
            <textarea value={doctorNote} onChange={e => setDoctorNote(e.target.value)} className="input-field resize-none" rows={2} placeholder="Your clinical reasoning for this plan..." />
          </div>

          <p className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-slate-400" /> Follow-up schedule items</p>
          {fuDrafts.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div className="grid sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={f.title}
                  onChange={e => setFuDrafts(prev => prev.map((d, j) => j === i ? { ...d, title: e.target.value } : d))}
                  className="input-field"
                  placeholder="e.g. Repeat ECG"
                />
                <input
                  type="date"
                  value={f.due_date}
                  onChange={e => setFuDrafts(prev => prev.map((d, j) => j === i ? { ...d, due_date: e.target.value } : d))}
                  className="input-field"
                />
                <input
                  type="text"
                  value={f.instructions}
                  onChange={e => setFuDrafts(prev => prev.map((d, j) => j === i ? { ...d, instructions: e.target.value } : d))}
                  className="input-field"
                  placeholder="Instructions (optional)"
                />
              </div>
              {fuDrafts.length > 1 && (
                <button onClick={() => setFuDrafts(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500 pb-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setFuDrafts(prev => [...prev, { title: '', due_date: '', instructions: '' }])} className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add another item
          </button>

          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {saving ? 'Approving...' : 'Approve & Publish Plan'}
          </button>
          <p className="text-[11px] text-slate-400">Approving publishes this plan to {patientName}'s dashboard under your name with a timestamp. Plans are never visible to patients without doctor approval.</p>
        </div>
      </div>
    </div>
  );
}
