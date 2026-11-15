import type { RiskLevel } from '@/lib/ml-model';

export function RiskBadge({ level }: { level: RiskLevel | string }) {
  const cls = level === 'HIGH' ? 'badge-high' : level === 'MODERATE' ? 'badge-moderate' : 'badge-low';
  return <span className={cls}>{level}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const cls = status === 'WAITING FOR DOCTOR' ? 'badge-waiting' : status === 'UNDER REVIEW' ? 'badge-under-review' : 'badge-reviewed';
  return <span className={cls}>{status}</span>;
}
