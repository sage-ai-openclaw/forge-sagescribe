import { useAuth } from '../context/AuthContext';

export function UsageBadge() {
  const { usage, user } = useAuth();

  if (!user || !usage) return null;

  const isPro = user.tier === 'pro';

  return (
    <div className="flex items-center gap-3">
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
        {isPro ? '✨ Pro' : 'Free'}
      </div>
      {!isPro && usage.remainingToday !== null && (
        <div className="text-sm text-slate-400">
          {usage.remainingToday} / {usage.dailyLimit} transcriptions today
        </div>
      )}
    </div>
  );
}
