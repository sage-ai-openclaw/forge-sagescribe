import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { UploadForm } from './components/UploadForm';
import { Transcription, Usage } from './types';

function Dashboard() {
  const { token, usage, refreshUsage } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5583/api';

  const fetchTranscriptions = async () => {
    const res = await fetch(`${API_URL}/transcriptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTranscriptions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTranscriptions();
  }, [token]);

  const handleUploadSuccess = () => {
    fetchTranscriptions();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold mb-4">Upload Audio</h2>
            <UploadForm onSuccess={handleUploadSuccess} />
          </div>
          
          {usage && usage.tier === 'free' && (
            <div className="mt-6 bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="font-medium mb-3">Your Plan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tier</span>
                  <span className="text-slate-200">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily transcriptions</span>
                  <span className="text-slate-200">{usage.usedToday} / {usage.dailyLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max duration</span>
                  <span className="text-slate-200">10 minutes</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 px-4 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Transcription History</h2>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : transcriptions.length === 0 ? (
            <p className="text-slate-400">No transcriptions yet. Upload your first audio file!</p>
          ) : (
            <div className="space-y-4">
              {transcriptions.map((t) => (
                <div key={t.id} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-200">{t.filename}</h3>
                    <span className="text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">{t.text}</p>
                  {t.duration_seconds && (
                    <span className="text-xs text-slate-500">{formatDuration(t.duration_seconds)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">🎙️</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            SageScribe
          </h1>
          <p className="text-slate-400">AI transcription made simple</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <>
      <Header />
      {user ? <Dashboard /> : <AuthForm />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
