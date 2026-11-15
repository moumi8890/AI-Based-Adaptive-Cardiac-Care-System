import { Activity, LayoutDashboard, Heart, MessageSquare, ClockIcon, FileText, Users, AlertTriangle, Shield, Brain, LogOut, Stethoscope, MapPin, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from '@/lib/location-context';

type NavItem = {
  id: string;
  label: string;
  icon: typeof Activity;
};

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

const patientNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-health', label: 'My Health', icon: Heart },
  { id: 'ai-assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'history', label: 'History', icon: ClockIcon },
  { id: 'recommendations', label: 'Doctor Recommendations', icon: FileText },
  { id: 'my-reports', label: 'My Reports', icon: ClipboardList },
  { id: 'location', label: 'Location Sharing', icon: MapPin },
];

const doctorNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'high-priority', label: 'High Priority', icon: AlertTriangle },
  { id: 'moderate-priority', label: 'Moderate Priority', icon: Activity },
  { id: 'low-priority', label: 'Low Priority / Stable', icon: Shield },
  { id: 'patient-history', label: 'Patient History', icon: ClockIcon },
  { id: 'ai-assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'model-info', label: 'Model Information', icon: Brain },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { stopSharing } = useLocation();
  const nav = user?.role === 'doctor' ? doctorNav : patientNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-tight">MediConnect AI</h1>
            <p className="text-[10px] text-slate-400 leading-tight">Educational Demo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-200">
        <div className="px-3 py-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        <div className="nav-item" onClick={() => { void stopSharing(); logout(); }}>
          <LogOut style={{ width: 18, height: 18 }} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}
