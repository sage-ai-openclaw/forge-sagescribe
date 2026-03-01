import { useAuth } from '../context/AuthContext';
import { UsageBadge } from './UsageBadge';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎙️</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            SageScribe
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <UsageBadge />
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
