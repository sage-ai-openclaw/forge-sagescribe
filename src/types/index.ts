export interface User {
  id: number;
  email: string;
  tier: 'free' | 'pro';
}

export interface Usage {
  tier: 'free' | 'pro';
  dailyLimit: number | null;
  durationLimit: number | null;
  usedToday: number;
  totalDurationToday: number;
  remainingToday: number | null;
}

export interface Transcription {
  id: number;
  filename: string;
  text: string;
  duration_seconds: number | null;
  created_at: string;
}
