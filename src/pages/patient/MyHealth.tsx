import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Thermometer, Heart, Activity, Droplet, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { usePatientData } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { generatePatientGuidance } from '@/lib/ai-engine';
import { extractFeaturesFromHealthUpdate, predictHeartDiseaseProbability, classifyRisk, getRiskFactors } from '@/lib/ml-model';
import { PageHeader } from '@/components/Layout';
import { RiskBadge } from '@/components/Badges';

// Minimal SpeechRecognition type
type SpeechRecognitionResult = {
  0: { transcript: string };
  isFinal: boolean;
};
type SpeechRecognitionEvent = {
  results: { length: number; [i: number]: SpeechRecognitionResult };
  resultIndex: number;
};
type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function MyHealth() {
  const { user } = useAuth();
  const { patient, refetch } = usePatientData();
  const [form, setForm] = useState({
    temperature: '',
    heart_rate: '',
    bp_systolic: '',
    bp_diastolic: '',
    oxygen_saturation: '',
    symptoms: '',
    feeling: '',
    duration: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [riskResult, setRiskResult] = useState<{ level: string; factors: string[]; probability: number } | null>(null);
  const [aiGuidance, setAiGuidance] = useState('');

  // Voice input state
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    const rec = new (SR as new () => SpeechRecognition)();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setForm(prev => ({ ...prev, symptoms: transcript }));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const toggleVoice = () => {
    if (!voiceSupported || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setForm(prev => ({ ...prev, symptoms: '' }));
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setRiskResult(null);
    setAiGuidance('');
  };

  const handleAiPreview = () => {
    const guidance = generatePatientGuidance({
      symptoms: form.symptoms,
      feeling: form.feeling,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      heartRate: form.heart_rate ? parseInt(form.heart_rate) : null,
      bloodPressureSystolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
      bloodPressureDiastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
      oxygenSaturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : null,
    });
    setAiGuidance(guidance);
  };

  const handleClassifyRisk = () => {
    if (!patient) return;
    const features = extractFeaturesFromHealthUpdate({
      age: patient.age,
      gender: patient.gender || 'Male',
      bloodPressureSystolic: form.bp_systolic ? parseInt(form.bp_systolic) : 120,
      heartRate: form.heart_rate ? parseInt(form.heart_rate) : 75,
      oxygenSaturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : 98,
      temperature: form.temperature ? parseFloat(form.temperature) : 98.6,
      symptoms: form.symptoms,
      medicalConditions: patient.medical_conditions || '',
    });
    const prob = predictHeartDiseaseProbability(features);
    const level = classifyRisk(prob);
    const factors = getRiskFactors(features);
    setRiskResult({ level, factors, probability: prob });
  };

  const handleSubmit = async () => {
    if (!user?.patient_id) return;
    setError('');
    setSuccess(false);

    if (!form.symptoms.trim()) {
      setError('Please enter your symptoms before submitting.');
      return;
    }

    setSubmitting(true);

    // Generate AI guidance
    const guidance = generatePatientGuidance({
      symptoms: form.symptoms,
      feeling: form.feeling,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      heartRate: form.heart_rate ? parseInt(form.heart_rate) : null,
      bloodPressureSystolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
      bloodPressureDiastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
      oxygenSaturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : null,
    });

    // Calculate risk
    const features = extractFeaturesFromHealthUpdate({
      age: patient?.age || 40,
      gender: patient?.gender || 'Male',
      bloodPressureSystolic: form.bp_systolic ? parseInt(form.bp_systolic) : 120,
      heartRate: form.heart_rate ? parseInt(form.heart_rate) : 75,
      oxygenSaturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : 98,
      temperature: form.temperature ? parseFloat(form.temperature) : 98.6,
      symptoms: form.symptoms,
      medicalConditions: patient?.medical_conditions || '',
    });
    const prob = predictHeartDiseaseProbability(features);
    const riskLevel = classifyRisk(prob);
    const riskFactors = getRiskFactors(features);

    const { error: insertError } = await supabase.from('health_updates').insert({
      patient_id: user.patient_id,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
      blood_pressure_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
      blood_pressure_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
      oxygen_saturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : null,
      symptoms: form.symptoms,
      feeling: form.feeling,
      duration: form.duration,
      notes: form.notes,
      ai_guidance: guidance,
      risk_level: riskLevel,
      risk_factors: riskFactors.join(', '),
      status: 'WAITING FOR DOCTOR',
    });

    if (insertError) {
      setError('Failed to submit. Please try again.');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    setForm({
      temperature: '', heart_rate: '', bp_systolic: '', bp_diastolic: '',
      oxygen_saturation: '', symptoms: '', feeling: '', duration: '', notes: '',
    });
    setRiskResult(null);
    setAiGuidance('');
    refetch();
  };

  const fields = [
    { key: 'temperature', label: 'Temperature (°F)', icon: Thermometer, placeholder: '98.6', type: 'text' },
    { key: 'heart_rate', label: 'Heart Rate (bpm)', icon: Heart, placeholder: '72', type: 'text' },
    { key: 'bp_systolic', label: 'Blood Pressure (Systolic)', icon: Activity, placeholder: '120', type: 'text' },
    { key: 'bp_diastolic', label: 'Blood Pressure (Diastolic)', icon: Activity, placeholder: '80', type: 'text' },
    { key: 'oxygen_saturation', label: 'Oxygen Saturation (%)', icon: Droplet, placeholder: '98', type: 'text' },
    { key: 'duration', label: 'Duration of Symptoms', icon: AlertCircle, placeholder: 'e.g., 2 days', type: 'text' },
  ];

  return (
    <div>
      <PageHeader title="Update My Health" subtitle="Enter your health information or use voice input" />

      {success && (
        <div className="card mb-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Health update submitted successfully!</p>
              <p className="text-sm text-emerald-600">Your doctor has been notified. You can check your recommendations page for their response.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Vital Signs</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {fields.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => handleChange(f.key, e.target.value)}
                      className="input-field"
                      placeholder={f.placeholder}
                    />
                  </div>
                );
              })}
            </div>

            <h3 className="font-semibold text-slate-800 mb-4">Symptoms & Description</h3>

            {/* Symptoms with voice input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Symptoms</label>
                <button
                  onClick={toggleVoice}
                  disabled={!voiceSupported}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    listening
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : voiceSupported
                      ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {listening ? 'Stop' : 'Voice Input'}
                </button>
              </div>
              <textarea
                value={form.symptoms}
                onChange={e => handleChange('symptoms', e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder={listening ? 'Listening... speak your symptoms' : 'Type or speak your symptoms (e.g., fever, headache, fatigue)'}
              />
              {!voiceSupported && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Voice recognition is not available in this browser. You can type your symptoms instead.
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">How I Am Feeling</label>
                <select
                  value={form.feeling}
                  onChange={e => handleChange('feeling', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Great">Great</option>
                  <option value="Good">Good</option>
                  <option value="Okay">Okay</option>
                  <option value="A bit unwell">A bit unwell</option>
                  <option value="Unwell">Unwell</option>
                  <option value="Very unwell">Very unwell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  className="input-field"
                  placeholder="Any other information..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={handleAiPreview} className="btn-secondary flex items-center gap-2" disabled={!form.symptoms.trim()}>
                <Activity className="w-4 h-4" />
                Get AI Guidance Preview
              </button>
              <button onClick={handleClassifyRisk} className="btn-secondary flex items-center gap-2" disabled={!form.symptoms.trim()}>
                <AlertCircle className="w-4 h-4" />
                Check Risk Classification
              </button>
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-2 ml-auto" disabled={submitting}>
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit to Doctor'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="space-y-4">
          {aiGuidance && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                AI Guidance Preview
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{aiGuidance}</p>
            </div>
          )}

          {riskResult && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                ML Risk Classification
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <RiskBadge level={riskResult.level} />
                <span className="text-sm text-slate-500">
                  Probability: {(riskResult.probability * 100).toFixed(1)}%
                </span>
              </div>
              {riskResult.factors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Risk factors used by model:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {riskResult.factors.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                Educational demonstration only. Not a medical diagnosis.
              </p>
            </div>
          )}

          {!aiGuidance && !riskResult && (
            <div className="card text-center py-8">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                Enter your symptoms and click "Get AI Guidance" or "Check Risk Classification" to see a preview before submitting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
