import { useState } from 'react';
import { Search, ChevronRight, Thermometer, Heart, Activity, Droplet, Filter } from 'lucide-react';
import { useDoctorData, getLatestUpdateForPatient } from '@/lib/hooks';
import { PageHeader } from '@/components/Layout';
import { RiskBadge, StatusBadge } from '@/components/Badges';
import { AgeGroupBadge } from '@/components/AgeGroupBadge';
import { getAgeGroupFromDob, ALL_AGE_GROUPS, type AgeGroupId } from '@/lib/cardiacReference';
import type { PageProps } from '@/App';

type FilterMode = 'all' | 'waiting' | 'reviewed' | 'high' | 'moderate' | 'low';

export function PatientList({ title, subtitle, filterMode, onSelectPatient }: {
  title: string;
  subtitle: string;
  filterMode: FilterMode;
  onSelectPatient: (id: string) => void;
}) {
  const { patients, allUpdates, loading } = useDoctorData();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'latest' | 'name' | 'waiting'>('risk');
  const [ageFilter, setAgeFilter] = useState<'ALL' | AgeGroupId>('ALL');

  if (loading) return <div className="p-6 text-slate-400">Loading patients...</div>;

  let patientsWithData = patients.map(p => ({
    patient: p,
    latest: getLatestUpdateForPatient(p.id, allUpdates),
  }));

  // Filter by mode
  if (filterMode === 'high') patientsWithData = patientsWithData.filter(p => p.latest?.risk_level === 'HIGH');
  else if (filterMode === 'moderate') patientsWithData = patientsWithData.filter(p => p.latest?.risk_level === 'MODERATE');
  else if (filterMode === 'low') patientsWithData = patientsWithData.filter(p => p.latest?.risk_level === 'LOW');
  else if (filterMode === 'waiting') patientsWithData = patientsWithData.filter(p => p.latest?.status === 'WAITING FOR DOCTOR');
  else if (filterMode === 'reviewed') patientsWithData = patientsWithData.filter(p => p.latest?.status === 'REVIEWED');

  // Filter by age group
  if (ageFilter !== 'ALL') {
    patientsWithData = patientsWithData.filter(p => getAgeGroupFromDob(p.patient.date_of_birth, p.patient.age).id === ageFilter);
  }

  // Filter by search
  if (search) {
    patientsWithData = patientsWithData.filter(p =>
      p.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.latest?.symptoms || '').toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort
  const riskOrder = { HIGH: 0, MODERATE: 1, LOW: 2 };
  patientsWithData.sort((a, b) => {
    if (sortBy === 'name') return a.patient.name.localeCompare(b.patient.name);
    if (sortBy === 'latest') {
      if (!a.latest) return 1;
      if (!b.latest) return -1;
      return new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime();
    }
    if (sortBy === 'waiting') {
      const aw = a.latest?.status === 'WAITING FOR DOCTOR' ? 0 : 1;
      const bw = b.latest?.status === 'WAITING FOR DOCTOR' ? 0 : 1;
      if (aw !== bw) return aw - bw;
    }
    // default: risk
    const ra = a.latest ? riskOrder[a.latest.risk_level as keyof typeof riskOrder] ?? 3 : 3;
    const rb = b.latest ? riskOrder[b.latest.risk_level as keyof typeof riskOrder] ?? 3 : 3;
    if (ra !== rb) return ra - rb;
    if (a.latest && b.latest) return new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime();
    return 0;
  });

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
              placeholder="Search by patient name or symptoms..."
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="input-field w-auto">
            <option value="risk">Sort by Risk Level</option>
            <option value="latest">Sort by Latest Update</option>
            <option value="waiting">Sort by Waiting for Review</option>
            <option value="name">Sort by Patient Name</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            Age group:
          </div>
          <button
            onClick={() => setAgeFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              ageFilter === 'ALL' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
            }`}
          >
            All
          </button>
          {ALL_AGE_GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setAgeFilter(g.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                ageFilter === g.id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
              }`}
            >
              {g.label} ({g.range})
            </button>
          ))}
        </div>
      </div>

      {patientsWithData.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No patients match your filter.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientsWithData.map(({ patient, latest }) => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="card hover:border-cyan-300 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{patient.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">{patient.age} yrs • {patient.gender} • {patient.blood_group} <AgeGroupBadge dob={patient.date_of_birth} age={patient.age} /></p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>

              {latest ? (
                <>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{latest.symptoms || 'No symptoms reported'}</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: 'T', value: latest.temperature ? `${latest.temperature}°` : '-', icon: Thermometer },
                      { label: 'HR', value: latest.heart_rate ? `${latest.heart_rate}` : '-', icon: Heart },
                      { label: 'BP', value: latest.blood_pressure_systolic ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}` : '-', icon: Activity },
                      { label: 'SpO2', value: latest.oxygen_saturation ? `${latest.oxygen_saturation}%` : '-', icon: Droplet },
                    ].map(v => {
                      const Icon = v.icon;
                      return (
                        <div key={v.label} className="bg-slate-50 rounded px-2 py-1.5 text-center">
                          <Icon className="w-3 h-3 text-slate-400 mx-auto mb-0.5" />
                          <p className="text-[11px] font-medium text-slate-600">{v.value}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <RiskBadge level={latest.risk_level} />
                      <StatusBadge status={latest.status} />
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(latest.created_at).toLocaleDateString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 py-3">No health updates submitted yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
