import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  assessVital,
  getReferenceRange,
  type AgeGroupId,
  type VitalKey,
  type VitalStatus,
} from '@/lib/cardiacReference';

export type TrendPoint = { value: number | null; date: string };

const VITAL_META: Record<VitalKey, { title: string; color: string; fill: string }> = {
  heart_rate: { title: 'Heart Rate (bpm)', color: '#ef4444', fill: 'rgba(239,68,68,0.12)' },
  bp_systolic: { title: 'Systolic BP (mmHg)', color: '#3b82f6', fill: 'rgba(59,130,246,0.12)' },
  bp_diastolic: { title: 'Diastolic BP (mmHg)', color: '#8b5cf6', fill: 'rgba(139,92,246,0.12)' },
  spo2: { title: 'Oxygen Saturation (%)', color: '#06b6d4', fill: 'rgba(6,182,212,0.12)' },
};

const STATUS_DOT: Record<VitalStatus, string> = {
  normal: 'text-emerald-600',
  borderline: 'text-amber-600',
  abnormal: 'text-red-600',
  missing: 'text-slate-300',
};

function cleanPoints(points: TrendPoint[]): Array<{ value: number; date: string }> {
  return points
    .filter(p => p.value !== null && p.value !== undefined && !Number.isNaN(p.value))
    .map(p => ({ value: p.value as number, date: p.date }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function changeIndicator(series: Array<{ value: number; date: string }>) {
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (last > first) return { icon: TrendingUp, text: `+${(last - first).toFixed(1)}`, cls: 'text-red-600' };
  if (last < first) return { icon: TrendingDown, text: `${(last - first).toFixed(1)}`, cls: 'text-emerald-600' };
  return { icon: Minus, text: 'No change', cls: 'text-slate-500' };
}

export function VitalTrendChart({ group, vital, points }: { group: AgeGroupId; vital: VitalKey; points: TrendPoint[] }) {
  const meta = VITAL_META[vital];
  const series = cleanPoints(points);
  const range = getReferenceRange(group, vital);
  const change = changeIndicator(series);

  if (series.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-700">{meta.title}</h4>
        </div>
        <p className="text-xs text-slate-400 py-6 text-center">No data recorded yet.</p>
      </div>
    );
  }

  const values = series.map(s => s.value);
  const lo = Math.min(...values, range.borderlineLow, range.low);
  const hi = Math.max(...values, range.borderlineHigh, range.high);
  const pad = (hi - lo) * 0.1 || 2;
  const yMin = lo - pad;
  const yMax = hi + pad;

  const W = 320, H = 140, PAD_L = 34, PAD_R = 8, PAD_T = 10, PAD_B = 20;
  const x = (i: number) => PAD_L + (i / Math.max(series.length - 1, 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD_T - PAD_B);

  const line = series.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const area = `${PAD_L},${y(yMin)} ${line} ${x(series.length - 1)},${y(yMin)}`;

  const latestAssessment = assessVital(group, vital, series[series.length - 1].value);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-medium text-slate-700">{meta.title}</h4>
        {change && (
          <span className={`flex items-center gap-1 text-xs font-medium ${change.cls}`}>
            <change.icon className="w-3.5 h-3.5" />
            {change.text}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mb-2">
        Latest: <span className={`font-semibold ${STATUS_DOT[latestAssessment.status]}`}>
          {series[series.length - 1].value} {range.unit} — {latestAssessment.label}
        </span>
        <span className="mx-1">•</span>
        Normal for {group === 'CHILDREN' || group === 'TEENAGERS' ? 'this age' : 'this age'}: {range.low}–{range.high} {range.unit}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${meta.title} trend`}>
        {/* Normal band */}
        <rect x={PAD_L} y={y(range.high)} width={W - PAD_L - PAD_R} height={y(range.low) - y(range.high)} fill="rgba(16,185,129,0.10)" />
        {/* Borderline bands */}
        <rect x={PAD_L} y={y(range.low)} width={W - PAD_L - PAD_R} height={y(range.borderlineLow) - y(range.low)} fill="rgba(245,158,11,0.12)" />
        <rect x={PAD_L} y={y(range.borderlineHigh)} width={W - PAD_L - PAD_R} height={y(range.high) - y(range.borderlineHigh)} fill="rgba(245,158,11,0.12)" />
        {/* Range labels */}
        <text x={PAD_L - 3} y={y(range.high) + 4} textAnchor="end" fontSize={8} fill="#64748b">{range.high}</text>
        <text x={PAD_L - 3} y={y(range.low) + 4} textAnchor="end" fontSize={8} fill="#64748b">{range.low}</text>
        <text x={PAD_L - 3} y={y(yMax) + 10} textAnchor="end" fontSize={8} fill="#94a3b8">{Math.round(yMax)}</text>
        {/* Area + line */}
        <polygon points={area} fill={meta.fill} />
        <polyline points={line} fill="none" stroke={meta.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Points, colored by status */}
        {series.map((p, i) => {
          const a = assessVital(group, vital, p.value);
          const dotColor = a.status === 'normal' ? '#10b981' : a.status === 'borderline' ? '#f59e0b' : '#ef4444';
          return <circle key={i} cx={x(i)} cy={y(p.value)} r={3.5} fill={dotColor} stroke="white" strokeWidth={1.5} />;
        })}
        {/* Date labels: first / last */}
        <text x={PAD_L} y={H - 4} fontSize={8} fill="#94a3b8">{new Date(series[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
        <text x={W - PAD_R} y={H - 4} textAnchor="end" fontSize={8} fill="#94a3b8">{new Date(series[series.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
      </svg>
      <p className="text-[10px] text-slate-400 mt-1">Source: {range.source}</p>
    </div>
  );
}
