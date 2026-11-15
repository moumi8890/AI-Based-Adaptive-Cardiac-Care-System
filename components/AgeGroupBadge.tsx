import { Users } from 'lucide-react';
import { getAgeGroupFromDob, type AgeGroupInfo } from '@/lib/cardiacReference';

const GROUP_STYLES: Record<AgeGroupInfo['id'], string> = {
  CHILDREN: 'bg-sky-50 text-sky-700 border-sky-200',
  TEENAGERS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  YOUNG_ADULTS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MIDDLE_AGED: 'bg-amber-50 text-amber-700 border-amber-200',
  OLDER_ADULTS: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function AgeGroupBadge({ dob, age }: { dob?: string | null; age: number }) {
  const group = getAgeGroupFromDob(dob, age);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${GROUP_STYLES[group.id]}`}
      title={`${group.label} (${group.range})`}
    >
      <Users className="w-3 h-3" />
      {group.shortLabel}
    </span>
  );
}
