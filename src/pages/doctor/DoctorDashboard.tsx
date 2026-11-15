import { useState } from 'react';
import { Users, AlertTriangle, Activity, Shield, Clock, ChevronRight, Filter } from 'lucide-react';
import { useDoctorData, getLatestUpdateForPatient } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';
import { RiskBadge, StatusBadge } from '@/components/Badges';
import { AgeGroupBadge } from '@/components/AgeGroupBadge';
import { getAgeGroupFromDob, ALL_AGE_GROUPS, type AgeGroupId } from '@/lib/cardiacReference';
import type { PageProps } from '@/App';

export function DoctorDashboard({ onNavigate, onSelectPatient }: PageProps) {
  const { patients, allUpdates, loading } = useDoctorData();
  const [ageFilter, setAgeFilter] = useState<'ALL' | AgeGroupId>('ALL');

  if (loading) return <div className="p-6 text-slate-400">Loading dashboard...</div>;

  const filteredPatients = ageFilter === 'ALL'
    ? patients
    : patients.filter(p => getAgeGroupFromDob(p.date_of_birth, p.age).id === ageFilter);

  const stats = {
    total: patients.length,
    pending: allUpdates.filter(u => u.status === 'WAITING FOR DOCTOR').length,
    high: allUpdates.filter(u => u.risk_level === 'HIGH' && u.status === 'WAITING FOR DOCTOR').length,
    moderate: allUpdates.filter(u => u.risk_level === 'MODERATE' && u.status === 'WAITING FOR DOCTOR').length,
    low: allUpdates.filter(u => u.risk_level === 'LOW' && u.status === 'WAITING FOR DOCTOR').length,
  };

  const statCards = [
    { label: 'Total Patients', value: stats.total, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Pending Reviews', value: stats.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'High Priority', value: stats.high, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Moderate Priority', value: stats.moderate, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Low Priority', value: stats.low, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Sort patients by latest update risk and recency
  const patientsWithUpdates = filteredPatients.map(p => ({
    patient: p,
    latest: getLatestUpdateForPatient(p.id, allUpdates),
  })).sort((a, b) => {
    if (!a.latest && !b.latest) return 0;
    if (!a.latest) return 1;
    if (!b.latest) return -1;
    const riskOrder = { HIGH: 0, MODERATE: 1, LOW: 2 };
    const ra = riskOrder[a.latest.risk_level as keyof typeof riskOrder] ?? 3;
    const rb = riskOrder[b.latest.risk_level as keyof typeof riskOrder] ?? 3;
    if (ra !== rb) return ra - rb;
    return new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime();
  });

  return (
    <div>
      <PageHeader title="Doctor Dashboard" subtitle="Overview of all patients and pending reviews" />

      {/* Age group filter */}
      <div className="card mb-6 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          Age group:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAgeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              ageFilter === 'ALL' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
            }`}
          >
            All ({patients.length})
          </button>
          {ALL_AGE_GROUPS.map(g => {
            const count = patients.filter(p => getAgeGroupFromDob(p.date_of_birth, p.age).id === g.id).length;
            return (
              <button
                key={g.id}
                onClick={() => setAgeFilter(g.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  ageFilter === g.id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
                }`}
              >
                {g.shortLabel} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Priority sections */}
      {['HIGH', 'MODERATE', 'LOW'].map(riskLevel => {
        const sectionPatients = patientsWithUpdates.filter(p => p.latest?.risk_level === riskLevel);
        if (sectionPatients.length === 0) return null;

        const sectionInfo = {
          HIGH: { title: 'High Priority', icon: AlertTriangle, color: 'text-red-600', border: 'border-red-200', nav: 'high-priority' },
          MODERATE: { title: 'Moderate Priority', icon: Activity, color: 'text-amber-600', border: 'border-amber-200', nav: 'moderate-priority' },
          LOW: { title: 'Low Priority / Stable', icon: Shield, color: 'text-emerald-600', border: 'border-emerald-200', nav: 'low-priority' },
        }[riskLevel as 'HIGH' | 'MODERATE' | 'LOW'];

        const Icon = sectionInfo.icon;
        return (
          <div key={riskLevel} className={`card mb-6 ${sectionInfo.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${sectionInfo.color}`} />
                <h3 className={`font-semibold ${sectionInfo.color}`}>{sectionInfo.title}</h3>
                <span className="text-sm text-slate-400">({sectionPatients.length})</span>
              </div>
              <button onClick={() => onNavigate(sectionInfo.nav)} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                View all →
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {sectionPatients.slice(0, 4).map(({ patient, latest }) => (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient?.(patient.id)}
                  className="border border-slate-200 rounded-lg p-4 hover:border-cyan-300 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{patient.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">{patient.age} yrs • {patient.gender} <AgeGroupBadge dob={patient.date_of_birth} age={patient.age} /></p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                  {latest && (
                    <>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-1">{latest.symptoms}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <RiskBadge level={latest.risk_level} />
                          <StatusBadge status={latest.status} />
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(latest.created_at).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
