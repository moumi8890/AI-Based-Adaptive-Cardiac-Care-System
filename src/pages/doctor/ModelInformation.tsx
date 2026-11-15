import { Brain, Database, BarChart3, GitBranch, ShieldAlert, ExternalLink, CheckCircle2, TrendingUp, LineChart } from 'lucide-react';
import { MODEL_INFO, ROC_CURVE } from '@/lib/ml-model';
import { PageHeader } from '@/components/Layout';

export function ModelInformation() {
  const metrics = [
    { label: 'Accuracy', value: `${(MODEL_INFO.metrics.accuracy * 100).toFixed(1)}%`, color: 'bg-cyan-500', width: `${MODEL_INFO.metrics.accuracy * 100}%` },
    { label: 'Precision', value: `${(MODEL_INFO.metrics.precision * 100).toFixed(1)}%`, color: 'bg-teal-500', width: `${MODEL_INFO.metrics.precision * 100}%` },
    { label: 'Recall', value: `${(MODEL_INFO.metrics.recall * 100).toFixed(1)}%`, color: 'bg-blue-500', width: `${MODEL_INFO.metrics.recall * 100}%` },
    { label: 'F1 Score', value: `${(MODEL_INFO.metrics.f1Score * 100).toFixed(1)}%`, color: 'bg-emerald-500', width: `${MODEL_INFO.metrics.f1Score * 100}%` },
    { label: 'ROC-AUC', value: MODEL_INFO.metrics.rocAuc.toFixed(2), color: 'bg-violet-500', width: `${MODEL_INFO.metrics.rocAuc * 100}%` },
  ];

  const features = [
    { name: 'Age', description: 'Patient age in years' },
    { name: 'Sex', description: 'Male / Female' },
    { name: 'CP', description: 'Chest pain type (0-3)' },
    { name: 'Trestbps', description: 'Resting blood pressure (mm Hg)' },
    { name: 'Chol', description: 'Serum cholesterol (mg/dl)' },
    { name: 'FBS', description: 'Fasting blood sugar > 120 mg/dl' },
    { name: 'Restecg', description: 'Resting ECG results (0-2)' },
    { name: 'Thalach', description: 'Maximum heart rate achieved' },
    { name: 'Exang', description: 'Exercise induced angina' },
    { name: 'Oldpeak', description: 'ST depression induced by exercise' },
    { name: 'Slope', description: 'Slope of peak exercise ST segment' },
    { name: 'CA', description: 'Number of major vessels (0-3)' },
    { name: 'Thal', description: 'Thalassemia indicator (0-3)' },
  ];

  const riskLevels = [
    { level: 'LOW', description: 'Probability < 35%', color: 'badge-low' },
    { level: 'MODERATE', description: 'Probability 35% - 65%', color: 'badge-moderate' },
    { level: 'HIGH', description: 'Probability > 65%', color: 'badge-high' },
  ];

  return (
    <div>
      <PageHeader title="Dataset & Model Information" subtitle="Machine learning educational demonstration" />

      {/* Disclaimer banner */}
      <div className="card mb-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Important Disclaimer</p>
            <p className="text-sm text-amber-700 mt-1">{MODEL_INFO.disclaimer}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Dataset info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-slate-800">Dataset</h3>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Name</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.dataset}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Total Samples</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.totalSamples}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Features</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.features}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Classes</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.classes} (Presence / Absence)</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-slate-500">Source</dt>
              <dd>
                <a
                  href={MODEL_INFO.datasetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  UCI ML Repository <ExternalLink className="w-3 h-3" />
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* Model info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800">Model</h3>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Algorithm</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.model}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Training Samples</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.trainingSamples}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Testing Samples</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.testingSamples}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Train/Test Split</dt>
              <dd className="text-sm font-medium text-slate-800">{MODEL_INFO.trainTestSplit}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-slate-500">Purpose</dt>
              <dd className="text-sm font-medium text-slate-800">Educational ML demonstration</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Performance metrics with charts */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Model Performance Metrics</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {metrics.map(m => (
            <div key={m.label} className="bg-slate-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-slate-800">{m.value}</p>
              <p className="text-sm text-slate-500 mb-3">{m.label}</p>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: m.width }} />
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart comparison */}
        <div className="space-y-3 pt-2">
          {metrics.map(m => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-20">{m.label}</span>
              <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${m.color} rounded-lg flex items-center justify-end px-3 transition-all duration-500`}
                  style={{ width: m.width }}
                >
                  <span className="text-xs font-semibold text-white">{m.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROC curve */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-slate-800">ROC Curve</h3>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm font-semibold">
            AUC = {MODEL_INFO.metrics.rocAuc.toFixed(2)}
          </span>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <svg viewBox="0 0 400 400" className="w-full" role="img" aria-label="ROC curve for the trained model">
              {/* Grid lines */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => (
                <g key={v}>
                  <line x1={60 + v * 320} y1={340} x2={60 + v * 320} y2={20} stroke="#e2e8f0" strokeWidth={1} />
                  <line x1={60} y1={340 - v * 320} x2={380} y2={340 - v * 320} stroke="#e2e8f0" strokeWidth={1} />
                  <text x={60 + v * 320} y={360} textAnchor="middle" fontSize={12} fill="#64748b">{v}</text>
                  <text x={48} y={344 - v * 320} textAnchor="end" fontSize={12} fill="#64748b">{v}</text>
                </g>
              ))}
              {/* Axis labels */}
              <text x={220} y={382} textAnchor="middle" fontSize={13} fill="#334155">False Positive Rate</text>
              <text x={14} y={180} textAnchor="middle" fontSize={13} fill="#334155" transform="rotate(-90 14 180)">True Positive Rate</text>
              {/* Chance line */}
              <line x1={60} y1={340} x2={380} y2={20} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />
              {/* Area under curve */}
              <polygon
                points={`60,340 ${ROC_CURVE.map(p => `${60 + p.fpr * 320},${340 - p.tpr * 320}`).join(' ')} 380,340`}
                fill="rgba(20, 184, 166, 0.15)"
              />
              {/* Curve */}
              <polyline
                points={ROC_CURVE.map(p => `${60 + p.fpr * 320},${340 - p.tpr * 320}`).join(' ')}
                fill="none"
                stroke="#0d9488"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-slate-800">{MODEL_INFO.metrics.rocAuc.toFixed(2)}</p>
              <p className="text-sm text-slate-500">Area Under the Curve (AUC)</p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The ROC curve plots the true positive rate against the false positive rate at every decision threshold.
              An AUC of {MODEL_INFO.metrics.rocAuc.toFixed(2)} means the model ranks a randomly chosen diseased patient
              above a randomly chosen healthy patient {Math.round(MODEL_INFO.metrics.rocAuc * 100)}% of the time —
              measured on the held-out test set of {MODEL_INFO.testingSamples} samples.
            </p>
            <div className="text-xs text-slate-400">
              <p>1.0 – 0.9: Excellent</p>
              <p>0.9 – 0.8: Good</p>
              <p>0.8 – 0.7: Fair</p>
              <p>Below 0.7: Poor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Features */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Model Features (13)</h3>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {features.map(f => (
              <div key={f.name} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{f.name}</p>
                  <p className="text-xs text-slate-500">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk classification */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Demonstration Risk Classification</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            The model produces a probability score which is mapped to three risk levels for demonstration purposes:
          </p>
          <div className="space-y-3">
            {riskLevels.map(r => (
              <div key={r.level} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className={r.color}>{r.level}</span>
                <span className="text-sm text-slate-600">{r.description}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              This classification is produced by a logistic regression model trained on the UCI Heart Disease dataset. It is for educational demonstration only and must NOT be used for medical diagnosis or treatment decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">ML Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2">
          {['Data Loading', 'Feature Standardization', 'Train/Test Split (80/20)', 'Logistic Regression Training', 'Model Evaluation', 'Risk Classification'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium border border-cyan-200">
                {i + 1}. {step}
              </div>
              {i < arr.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="card bg-slate-50">
        <h3 className="font-semibold text-slate-800 mb-2">Attribution</h3>
        <p className="text-sm text-slate-600 mb-2">
          Dataset provided by the UCI Machine Learning Repository.
        </p>
        <a
          href={MODEL_INFO.attribution}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
        >
          {MODEL_INFO.attribution} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
