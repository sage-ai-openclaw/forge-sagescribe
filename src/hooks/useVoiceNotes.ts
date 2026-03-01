import { useState, useCallback } from 'react';

const API_URL = 'http://localhost:5583/api';

export interface VoiceNote {
  id: number;
  duration_ms: number | null;
  created_at: string;
}

export interface UseVoiceNotesReturn {
  notes: VoiceNote[];
  isLoading: boolean;
  error: string | null;
  saveRecording: (blob: Blob, durationMs: number) => Promise<void>;
  fetchNotes: () => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useVoiceNotes(): UseVoiceNotesReturn {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/voice-notes`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveRecording = useCallback(async (blob: Blob, durationMs: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/voice-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type,
          'X-Duration-Ms': durationMs.toString(),
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: blob,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(errorData.error || 'Failed to save recording');
      }

      // Refresh the notes list after saving
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/voice-notes/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    notes,
    isLoading,
    error,
    saveRecording,
    fetchNotes,
    deleteNote,
    clearError,
  };
}
