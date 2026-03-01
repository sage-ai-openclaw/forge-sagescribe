import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  tier: 'free' | 'pro';
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateTier: (tier: 'free' | 'pro') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateTier: (tier) => set((state) => ({
        user: state.user ? { ...state.user, tier } : null,
      })),
    }),
    {
      name: 'sagescribe-auth',
    }
  )
);
