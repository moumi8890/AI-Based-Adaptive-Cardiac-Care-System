import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LocationProvider } from '@/lib/location-context';
import { LoginPage } from '@/components/LoginPage';
import { Sidebar } from '@/components/Sidebar';
import { DemoBanner } from '@/components/Layout';
import { LocationIndicator } from '@/components/LocationIndicator';
import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { MyHealth } from '@/pages/patient/MyHealth';
import { PatientAIAssistant } from '@/pages/patient/PatientAIAssistant';
import { PatientHistory } from '@/pages/patient/PatientHistory';
import { DoctorRecommendations } from '@/pages/patient/DoctorRecommendations';
import { LocationSharing } from '@/pages/patient/LocationSharing';
import { MyReports } from '@/pages/patient/MyReports';
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { PatientList } from '@/pages/doctor/PatientList';
import { PatientDetail } from '@/pages/doctor/PatientDetail';
import { DoctorAIAssistant } from '@/pages/doctor/DoctorAIAssistant';
import { ModelInformation } from '@/pages/doctor/ModelInformation';

export type PageProps = {
  onNavigate: (page: string) => void;
  onSelectPatient?: (id: string) => void;
};

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    setPage('dashboard');
    setSelectedPatientId(null);
  }, [user?.username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading MediConnect AI...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigate = (p: string) => {
    if (p === 'patient-history') {
      setPage('patient-history');
      return;
    }
    setSelectedPatientId(null);
    setPage(p);
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setPage('patient-detail');
  };

  const isDoctor = user.role === 'doctor';

  // Guard: prevent role-crossing
  const validPatientPages = ['dashboard', 'my-health', 'ai-assistant', 'history', 'recommendations', 'location', 'my-reports'];
  const validDoctorPages = ['dashboard', 'patients', 'high-priority', 'moderate-priority', 'low-priority', 'patient-history', 'ai-assistant', 'model-info', 'patient-detail'];

  if (isDoctor && !validDoctorPages.includes(page)) {
    setPage('dashboard');
  }
  if (!isDoctor && !validPatientPages.includes(page)) {
    setPage('dashboard');
  }

  const renderPage = () => {
    if (isDoctor) {
      switch (page) {
        case 'dashboard':
          return <DoctorDashboard onNavigate={handleNavigate} onSelectPatient={handleSelectPatient} />;
        case 'patients':
          return <PatientList title="All Patients" subtitle="Complete patient list" filterMode="all" onSelectPatient={handleSelectPatient} />;
        case 'high-priority':
          return <PatientList title="High Priority" subtitle="Patients with high demonstration risk" filterMode="high" onSelectPatient={handleSelectPatient} />;
        case 'moderate-priority':
          return <PatientList title="Moderate Priority" subtitle="Patients with moderate demonstration risk" filterMode="moderate" onSelectPatient={handleSelectPatient} />;
        case 'low-priority':
          return <PatientList title="Low Priority / Stable" subtitle="Patients with low demonstration risk — not medically cleared" filterMode="low" onSelectPatient={handleSelectPatient} />;
        case 'patient-history':
          return <PatientList title="Patient History" subtitle="All patients and their submission timeline" filterMode="all" onSelectPatient={handleSelectPatient} />;
        case 'ai-assistant':
          return <DoctorAIAssistant />;
        case 'model-info':
          return <ModelInformation />;
        case 'patient-detail':
          return selectedPatientId
            ? <PatientDetail patientId={selectedPatientId} onBack={() => { setSelectedPatientId(null); setPage('dashboard'); }} />
            : <DoctorDashboard onNavigate={handleNavigate} onSelectPatient={handleSelectPatient} />;
        default:
          return <DoctorDashboard onNavigate={handleNavigate} onSelectPatient={handleSelectPatient} />;
      }
    }

    switch (page) {
      case 'dashboard':
        return <PatientDashboard onNavigate={handleNavigate} />;
      case 'my-health':
        return <MyHealth />;
      case 'ai-assistant':
        return <PatientAIAssistant />;
      case 'history':
        return <PatientHistory />;
      case 'recommendations':
        return <DoctorRecommendations />;
      case 'location':
        return <LocationSharing />;
      case 'my-reports':
        return <MyReports />;
      default:
        return <PatientDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activePage={page} onNavigate={handleNavigate} />
      <div className="flex-1 min-w-0 flex flex-col">
        <DemoBanner />
        {!isDoctor && (
          <div className="px-6 pt-4">
            <LocationIndicator />
          </div>
        )}
        <main className="flex-1 p-6 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
