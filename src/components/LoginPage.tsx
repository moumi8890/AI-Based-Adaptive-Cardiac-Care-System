import { Stethoscope, Activity, ShieldAlert, Brain, Mic } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">MediConnect AI</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Connecting Patients<br />and Doctors with AI
          </h2>
          <p className="text-cyan-100 text-lg mb-10 max-w-md">
            A smart healthcare platform with AI-assisted guidance, voice input, and ML-based risk demonstration.
          </p>
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Real-time Health Monitoring</p>
                <p className="text-sm text-cyan-100">Track vitals and symptoms with voice input</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">AI-Powered Guidance</p>
                <p className="text-sm text-cyan-100">Demo AI assistant for patients and doctors</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">ML Risk Classification</p>
                <p className="text-sm text-cyan-100">Educational demonstration using UCI Heart Disease data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Voice Input</p>
                <p className="text-sm text-cyan-100">Speak your symptoms instead of typing</p>
              </div>
            </div>
          </div>
          <div className="mt-10 px-4 py-3 bg-white/10 backdrop-blur rounded-lg max-w-md">
            <p className="text-sm text-cyan-50">
              <strong>Educational Demonstration — Not for Clinical Use</strong>
            </p>
            <p className="text-xs text-cyan-200 mt-1">
              All data is fictional. This is a college project demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">MediConnect AI</h1>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome Back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to your demo account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demo Accounts (click to fill)</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => quickLogin('patient1', 'patient123')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors text-sm"
                >
                  <p className="font-medium text-slate-700">Patient 1</p>
                  <p className="text-xs text-slate-400">patient1 / patient123</p>
                </button>
                <button
                  onClick={() => quickLogin('patient2', 'patient123')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors text-sm"
                >
                  <p className="font-medium text-slate-700">Patient 2</p>
                  <p className="text-xs text-slate-400">patient2 / patient123</p>
                </button>
                <button
                  onClick={() => quickLogin('patient3', 'patient123')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors text-sm"
                >
                  <p className="font-medium text-slate-700">Patient 3</p>
                  <p className="text-xs text-slate-400">patient3 / patient123</p>
                </button>
                <button
                  onClick={() => quickLogin('doctor', 'doctor123')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors text-sm"
                >
                  <p className="font-medium text-slate-700">Doctor</p>
                  <p className="text-xs text-slate-400">doctor / doctor123</p>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Educational Demonstration — Not for Clinical Use
          </p>
        </div>
      </div>
    </div>
  );
}
