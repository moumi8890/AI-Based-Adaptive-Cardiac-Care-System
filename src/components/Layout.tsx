import { ShieldAlert } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <p className="text-xs text-amber-700 font-medium">
          Educational Demonstration — Not for Clinical Use. All data is fictional.
        </p>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
