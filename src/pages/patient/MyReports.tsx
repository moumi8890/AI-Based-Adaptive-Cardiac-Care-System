import { useState, useRef } from 'react';
import { Upload, FileText, Activity, CheckCircle, AlertCircle, Loader, Eye, Trash2, X, PenLine } from 'lucide-react';
import { supabase, type CardiacReport } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCardiacReports } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';

type ReportType = 'ECG' | 'ECHO';

const ECG_FIELDS: Array<{ key: keyof CardiacReport; label: string; placeholder: string }> = [
  { key: 'ecg_heart_rate', label: 'Heart Rate (bpm)', placeholder: 'e.g. 72' },
  { key: 'ecg_pr_interval', label: 'PR Interval (ms)', placeholder: 'e.g. 160' },
  { key: 'ecg_qrs_duration', label: 'QRS Duration (ms)', placeholder: 'e.g. 90' },
  { key: 'ecg_qt_interval', label: 'QT Interval (ms)', placeholder: 'e.g. 400' },
  { key: 'ecg_qtc_interval', label: 'QTc Interval (ms)', placeholder: 'e.g. 420' },
];

export function MyReports() {
  const { user } = useAuth();
  const { reports, loading, refetch } = useCardiacReports(user?.patient_id);
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('ECG');
  const [file, setFile] = useState<File | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<CardiacReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = 'application/pdf,image/jpeg,image/png';

  const handleUploadAndSubmit = async () => {
    if (!user?.patient_id) return;
    setError('');
    setSuccess('');

    const hasAnyValue = Object.values(values).some(v => v.trim()) || notes.trim();
    if (!file && !hasAnyValue) {
      setError('Upload a report file or enter at least one value from it.');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (file) {
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
          throw new Error('Only PDF, JPG or PNG files are accepted.');
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File is too large (max 10 MB).');
        }
        const path = `${user.patient_id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: upErr } = await supabase.storage
          .from('medical-reports')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error('File upload failed. Please try again.');
        const { data: urlData } = supabase.storage.from('medical-reports').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
        fileType = file.type;
      }

      const numeric = (k: string) => (values[k]?.trim() ? parseInt(values[k], 10) : null);

      const row: Partial<CardiacReport> = {
        patient_id: user.patient_id,
        report_type: reportType,
        uploaded_by: 'patient',
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        report_notes: notes.trim() || null,
        verification: 'PENDING',
      };
      if (reportType === 'ECG') {
        row.ecg_heart_rate = numeric('ecg_heart_rate');
        row.ecg_pr_interval = numeric('ecg_pr_interval');
        row.ecg_qrs_duration = numeric('ecg_qrs_duration');
        row.ecg_qt_interval = numeric('ecg_qt_interval');
        row.ecg_qtc_interval = numeric('ecg_qtc_interval');
        row.ecg_rhythm = values.ecg_rhythm?.trim() || null;
        row.ecg_abnormalities = values.ecg_abnormalities?.trim() || null;
      } else {
        row.echo_lvef = numeric('echo_lvef');
        row.echo_ventricular_function = values.echo_ventricular_function?.trim() || null;
        row.echo_valve_abnormalities = values.echo_valve_abnormalities?.trim() || null;
        row.echo_structural_findings = values.echo_structural_findings?.trim() || null;
      }

      const { error: insertErr } = await supabase.from('cardiac_reports').insert(row);
      if (insertErr) throw new Error('Failed to save the report. Please try again.');

      setSuccess('Report submitted. Your doctor will verify the values.');
      setShowForm(false);
      setFile(null);
      setValues({});
      setNotes('');
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: CardiacReport) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    if (r.file_url) {
      const path = r.file_url.split('/medical-reports/')[1];
      if (path) await supabase.storage.from('medical-reports').remove([decodeURIComponent(path)]);
    }
    await supabase.from('cardiac_reports').delete().eq('id', r.id);
    refetch();
  };

  const reportIcon = (t: string) => (t === 'ECG' ? FileText : Activity);

  return (
    <div>
      <PageHeader title="My Reports" subtitle="Upload ECG and Echo reports for your doctor to review">
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Report
          </button>
        )}
      </PageHeader>

      {success && (
        <div className="card mb-6 bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      )}
      {error && !showForm && (
        <div className="card mb-6 bg-red-50 border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-cyan-600" />
              New Report
            </h3>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            {(['ECG', 'ECHO'] as ReportType[]).map(t => (
              <button
                key={t}
                onClick={() => { setReportType(t); setValues({}); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  reportType === t ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
                }`}
              >
                {t === 'ECG' ? 'ECG Report' : 'Echocardiogram (Echo)'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Report File (PDF, JPG or PNG — max 10 MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={e => { setFile(e.target.files?.[0] || null); setError(''); }}
              className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:text-cyan-700 file:font-medium hover:file:bg-cyan-100"
            />
            {file && <p className="text-xs text-slate-500 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
          </div>

          <p className="text-xs text-slate-500 mb-4">
            This system does not analyze the file automatically. Enter the values exactly as printed on the report — anything you enter is recorded as <strong>"Entered by patient"</strong> until your doctor verifies it. Do not guess or estimate numbers.
          </p>

          {reportType === 'ECG' ? (
            <>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {ECG_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                    <input
                      type="number"
                      value={values[f.key as string] || ''}
                      onChange={e => setValues(prev => ({ ...prev, [f.key as string]: e.target.value }))}
                      className="input-field"
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Rhythm (as reported)</label>
                  <input
                    type="text"
                    value={values.ecg_rhythm || ''}
                    onChange={e => setValues(prev => ({ ...prev, ecg_rhythm: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. Sinus rhythm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reported Abnormalities</label>
                  <input
                    type="text"
                    value={values.ecg_abnormalities || ''}
                    onChange={e => setValues(prev => ({ ...prev, ecg_abnormalities: e.target.value }))}
                    className="input-field"
                    placeholder="Exactly as written on the report, or leave blank"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">LVEF (%)</label>
                  <input
                    type="number"
                    value={values.echo_lvef || ''}
                    onChange={e => setValues(prev => ({ ...prev, echo_lvef: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. 60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ventricular Function</label>
                  <select
                    value={values.echo_ventricular_function || ''}
                    onChange={e => setValues(prev => ({ ...prev, echo_ventricular_function: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">As reported...</option>
                    <option value="Normal">Normal</option>
                    <option value="Mildly reduced">Mildly reduced</option>
                    <option value="Moderately reduced">Moderately reduced</option>
                    <option value="Severely reduced">Severely reduced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Valve Abnormalities</label>
                <input
                  type="text"
                  value={values.echo_valve_abnormalities || ''}
                  onChange={e => setValues(prev => ({ ...prev, echo_valve_abnormalities: e.target.value }))}
                  className="input-field"
                  placeholder="Exactly as written on the report, or 'None reported'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Structural Findings</label>
                <textarea
                  value={values.echo_structural_findings || ''}
                  onChange={e => setValues(prev => ({ ...prev, echo_structural_findings: e.target.value }))}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Exactly as written on the report, or leave blank"
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              placeholder="Anything else from the report..."
            />
          </div>

          <button
            onClick={handleUploadAndSubmit}
            disabled={submitting}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      )}

      {/* Report list */}
      {loading ? (
        <div className="p-6 text-slate-400">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No reports yet. Upload your first ECG or Echo report.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map(r => {
            const Icon = reportIcon(r.report_type);
            return (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{r.report_type} Report</p>
                      <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.verification === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Verified{r.verified_by ? ` — Dr. ${r.verified_by.replace(/^Dr\.?\s*/i, '')}` : ''}
                      </span>
                    ) : r.verification === 'REJECTED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Re-enter required</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Awaiting verification</span>
                    )}
                  </div>
                </div>

                {r.report_type === 'ECG' ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {[
                      ['Heart Rate', r.ecg_heart_rate, 'bpm'],
                      ['PR Interval', r.ecg_pr_interval, 'ms'],
                      ['QRS Duration', r.ecg_qrs_duration, 'ms'],
                      ['QT / QTc', (r.ecg_qt_interval || r.ecg_qtc_interval) ? `${r.ecg_qt_interval ?? '—'} / ${r.ecg_qtc_interval ?? '—'}` : null, 'ms'],
                      ['Rhythm', r.ecg_rhythm, ''],
                      ['Abnormalities', r.ecg_abnormalities, ''],
                    ].map(([label, v, unit]) => (
                      <div key={label as string}>
                        <span className="text-xs text-slate-400">{label}:</span>{' '}
                        <span className="text-slate-700">{v !== null && v !== undefined && v !== '' ? `${v}${unit ? ` ${unit}` : ''}` : '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <div><span className="text-xs text-slate-400">LVEF:</span> <span className="text-slate-700">{r.echo_lvef !== null ? `${r.echo_lvef}%` : '—'}</span></div>
                    <div><span className="text-xs text-slate-400">Ventricular function:</span> <span className="text-slate-700">{r.echo_ventricular_function || '—'}</span></div>
                    <div><span className="text-xs text-slate-400">Valve abnormalities:</span> <span className="text-slate-700">{r.echo_valve_abnormalities || '—'}</span></div>
                    <div><span className="text-xs text-slate-400">Structural findings:</span> <span className="text-slate-700">{r.echo_structural_findings || '—'}</span></div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    {r.file_url && (
                      <button onClick={() => setPreview(r)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View file
                      </button>
                    )}
                    <button onClick={() => handleDelete(r)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                  {r.verified_by && r.verified_at && (
                    <span className="text-[10px] text-slate-400">Verified {new Date(r.verified_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File preview modal */}
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
