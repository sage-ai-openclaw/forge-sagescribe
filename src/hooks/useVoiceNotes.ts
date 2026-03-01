import { useState, useCallback } from 'react';
import { apiFetch } from '../store/authStore';

export interface VoiceNote {
  id: number;
  duration_ms: number | null;
  created_at: string;
  transcript: string | null;
  transcript_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript_error: string | null;
}

export interface TranscriptionStatus {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript: string | null;
  error: string | null;
  updatedAt: string;
}

export interface UseVoiceNotesReturn {
  notes: VoiceNote[];
  isLoading: boolean;
  error: string | null;
  saveRecording: (blob: Blob, durationMs: number) => Promise<void>;
  fetchNotes: () => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  getTranscriptionStatus: (id: number) => Promise<TranscriptionStatus>;
  clearError: () => void;
}

export function useVoiceNotes(): UseVoiceNotesReturn {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/voice-notes');
      setNotes(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTranscriptionStatus = useCallback(async (id: number): Promise<TranscriptionStatus> => {
    const data = await apiFetch(`/api/voice-notes/${id}/transcription`);
    return data;
  }, []);

  const saveRecording = useCallback(async (blob: Blob, durationMs: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sagescribe-auth');
      const parsed = token ? JSON.parse(token) : null;
      const authToken = parsed?.state?.token;

      const response = await fetch('/api/voice-notes', {
        method: 'POST',
        headers: {
          'Content-Type': blob.type,
          'X-Duration-Ms': durationMs.toString(),
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: blob,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(errorData.error || 'Failed to save recording');
      }

      const result = await response.json();
      
      // Add new note to list with pending status
      const newNote: VoiceNote = {
        id: result.id,
        duration_ms: durationMs,
        created_at: new Date().toISOString(),
        transcript: null,
        transcript_status: 'pending',
        transcript_error: null,
      };
      setNotes(prev => [newNote, ...prev]);

      // Start polling for transcription status
      pollTranscriptionStatus(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollTranscriptionStatus = useCallback(async (noteId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await getTranscriptionStatus(noteId);
        
        // Update the note in the list
        setNotes(prev => 
          prev.map(note => 
            note.id === noteId 
              ? { 
                  ...note, 
                  transcript: status.transcript,
                  transcript_status: status.status,
                  transcript_error: status.error,
                }
              : note
          )
        );

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling transcription status:', err);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Stop polling after 5 minutes (transcription shouldn't take that long)
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  }, [getTranscriptionStatus]);

  const deleteNote = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/voice-notes/${id}`, { method: 'DELETE' });
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
    getTranscriptionStatus,
    clearError,
  };
}
