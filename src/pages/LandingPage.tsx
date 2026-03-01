import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AI Transcription
          </span>
          <br />
          Made Simple
        </h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Upload your audio, get accurate transcripts with timestamps in seconds.
          Private, fast, and powered by OpenAI Whisper.
        </p>
        <div className="flex justify-center gap-4">
          {user ? (
            <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                Start for Free
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-24 grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
          <p className="text-slate-400">Get your transcripts in seconds, not hours. Powered by cutting-edge AI.</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Private & Secure</h3>
          <p className="text-slate-400">Your audio is processed securely and never stored longer than necessary.</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Timestamps Included</h3>
          <p className="text-slate-400">Every word is timestamped for easy navigation and reference.</p>
        </div>
      </div>
    </div>
  );
}
