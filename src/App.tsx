import { useState, useEffect } from 'react';
import { Upload, LogOut, History, Sparkles } from 'lucide-react';
import { AuthForm } from './components/AuthForm';
import { UploadForm } from './components/UploadForm';
import { TranscriptionHistory } from './components/TranscriptionHistory';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<'upload' | 'history'>('upload');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setView('upload');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Landing Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
          <div className="relative max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered Transcription
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                SageScribe
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                Transform your audio into accurate text with AI. Simple, fast, and private. 
                Powered by OpenAI's Whisper.
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Free tier available
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Private & secure
                </span>
              </div>
            </div>

            {/* Auth Form */}
            <div className="max-w-md mx-auto">
              <AuthForm onLogin={handleLogin} />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
              <p className="text-slate-400">Drag and drop your audio files. Supports MP3, WAV, M4A, and more.</p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Powered</h3>
              <p className="text-slate-400">State-of-the-art Whisper model delivers accurate transcriptions in seconds.</p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                <History className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">History & Export</h3>
              <p className="text-slate-400">Access all your transcriptions anytime. Download as TXT or SRT.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-bold">SageScribe</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView(view === 'upload' ? 'history' : 'upload')}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {view === 'upload' ? (
                <>
                  <History className="w-4 h-4" />
                  History
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {view === 'upload' ? (
          <UploadForm />
        ) : (
          <TranscriptionHistory onBack={() => setView('upload')} />
        )}
      </main>
    </div>
  );
}

export default App;
