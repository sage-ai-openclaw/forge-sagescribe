import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loadStripe } from '@stripe/stripe-js';

const API_URL = 'http://localhost:5583/api';

interface SubscriptionStatus {
  tier: 'free' | 'pro';
  status: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
}

export default function Settings() {
  const { token, user, updateTier } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (success) {
      setMessage('Subscription activated successfully!');
      // Refresh subscription status
      fetchSubscription();
    } else if (canceled) {
      setMessage('Subscription canceled. You can try again anytime.');
    }
  }, [success, canceled]);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/stripe/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
        updateTier(data.tier);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      setMessage('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stripe/create-portal-session`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      setMessage('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPro = subscription?.tier === 'pro' && subscription?.status === 'active';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {message && (
        <div className={`p-4 rounded-lg ${
          success ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
        }`}>
          {message}
        </div>
      )}

      {/* Subscription Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Subscription</h2>
            <p className="text-slate-400 mt-1">Manage your plan and billing</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPro ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-700 text-slate-300'
          }`}>
            {isPro ? 'Pro Plan' : 'Free Plan'}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-slate-400">Current Plan</div>
            <div className="text-white font-medium">{isPro ? 'Pro' : 'Free'}</div>
            
            <div className="text-slate-400">Transcriptions</div>
            <div className="text-white font-medium">
              {isPro ? 'Unlimited' : '10 per month'}
            </div>
            
            <div className="text-slate-400">Max Duration</div>
            <div className="text-white font-medium">
              {isPro ? '2 hours per file' : '10 minutes per file'}
            </div>

            {isPro && subscription?.currentPeriodEnd && (
              <>
                <div className="text-slate-400">Renews On</div>
                <div className="text-white font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800">
            {!isPro ? (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-2">Upgrade to Pro</h3>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>✓ Unlimited transcriptions</li>
                    <li>✓ Up to 2 hours per audio file</li>
                    <li>✓ Priority processing</li>
                    <li>✓ Export to multiple formats</li>
                  </ul>
                  <div className="mt-4 text-2xl font-bold text-white">
                    $19<span className="text-sm font-normal text-slate-400">/month</span>
                  </div>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full btn-primary py-3"
                >
                  {loading ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  You're on the Pro plan. You can manage your subscription, update payment methods, or cancel anytime.
                </p>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="btn-secondary"
                >
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <div className="text-white">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
