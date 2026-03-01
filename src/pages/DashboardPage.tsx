import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, apiFetch } from '../store/authStore'
import { RecordButton } from '../components/RecordButton'

interface VoiceNote {
  id: number
  duration_ms: number
  created_at: string
  transcript: string | null
  transcript_status: 'pending' | 'processing' | 'completed' | 'failed'
  transcript_error: string | null
}

const STATUS_COLORS = {
  pending: 'bg-slate-700 text-slate-300',
  processing: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
}

const STATUS_LABELS = {
  pending: 'Transcribing...',
  processing: 'Transcribing...',
  completed: 'Transcribed',
  failed: 'Failed',
}

function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedNote, setExpandedNote] = useState<number | null>(null)
  const [pollingIds, setPollingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchVoiceNotes()
  }, [isAuthenticated, navigate])

  // Poll transcription status for notes that are pending/processing
  useEffect(() => {
    const pendingNotes = voiceNotes.filter(
      note => note.transcript_status === 'pending' || note.transcript_status === 'processing'
    )
    
    pendingNotes.forEach(note => {
      if (!pollingIds.has(note.id)) {
        setPollingIds(prev => new Set(prev).add(note.id))
        pollTranscriptionStatus(note.id)
      }
    })
  }, [voiceNotes])

  const fetchVoiceNotes = async () => {
    try {
      const data = await apiFetch('/api/voice-notes')
      setVoiceNotes(data.notes || [])
    } catch (error) {
      console.error('Error fetching voice notes:', error)
    }
  }

  const pollTranscriptionStatus = async (noteId: number) => {
    const maxAttempts = 150 // 5 minutes at 2 second intervals
    let attempts = 0

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/voice-notes/${noteId}/transcription`)
        
        setVoiceNotes(prev => 
          prev.map(note => 
            note.id === noteId 
              ? { 
                  ...note, 
                  transcript: data.transcript,
                  transcript_status: data.status,
                  transcript_error: data.error,
                }
              : note
          )
        )

        attempts++
        
        // Stop polling if completed, failed, or max attempts reached
        if (data.status === 'completed' || data.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(interval)
          setPollingIds(prev => {
            const next = new Set(prev)
            next.delete(noteId)
            return next
          })
        }
      } catch (err) {
        console.error('Error polling transcription status:', err)
        clearInterval(interval)
        setPollingIds(prev => {
          const next = new Set(prev)
          next.delete(noteId)
          return next
        })
      }
    }, 2000)
  }

  const handleRecordingComplete = useCallback(async (blob: Blob, durationMs: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = useAuthStore.getState().token
      const response = await fetch('/api/voice-notes', {
        method: 'POST',
        headers: {
          'Content-Type': blob.type,
          'X-Duration-Ms': durationMs.toString(),
          'Authorization': `Bearer ${token}`,
        },
        body: blob,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save voice note' }))
        throw new Error(errorData.error || 'Failed to save voice note')
      }
      
      const result = await response.json()
      
      // Add new note to list immediately with pending status
      const newNote: VoiceNote = {
        id: result.id,
        duration_ms: durationMs,
        created_at: new Date().toISOString(),
        transcript: null,
        transcript_status: 'pending',
        transcript_error: null,
      }
      setVoiceNotes(prev => [newNote, ...prev])
      
      // Start polling for this note
      setPollingIds(prev => new Set(prev).add(result.id))
      pollTranscriptionStatus(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this voice note?')) return
    
    try {
      await apiFetch(`/api/voice-notes/${id}`, { method: 'DELETE' })
      setVoiceNotes(prev => prev.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting voice note:', error)
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleExpand = (noteId: number) => {
    setExpandedNote(expandedNote === noteId ? null : noteId)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-emerald-400">
            SageScribe
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Recording Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-white mb-8">Record a Voice Note</h1>
          <RecordButton 
            onRecordingComplete={handleRecordingComplete}
            onError={setError}
          />
          {isLoading && (
            <p className="text-emerald-400 mt-4">Saving...</p>
          )}
          {error && (
            <p className="text-red-400 mt-4">{error}</p>
          )}
        </div>

        {/* Voice Notes List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Your Voice Notes</h2>
          
          {voiceNotes.length === 0 ? (
            <p className="text-slate-400 text-center py-12">
              No voice notes yet. Tap the button above to record your first note!
            </p>
          ) : (
            <div className="space-y-4">
              {voiceNotes.map((note) => (
                <div 
                  key={note.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium">
                            Voice Note #{note.id}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[note.transcript_status]}`}>
                            {STATUS_LABELS[note.transcript_status]}
                            {(note.transcript_status === 'pending' || note.transcript_status === 'processing') && (
                              <span className="ml-1 animate-pulse">⏳</span>
                            )}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {new Date(note.created_at).toLocaleString()} • {formatDuration(note.duration_ms)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <audio 
                        controls 
                        src={`/api/voice-notes/${note.id}/audio`}
                        className="h-8 w-32 sm:w-48"
                      />
                      {note.transcript && (
                        <button
                          onClick={() => toggleExpand(note.id)}
                          className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                          title={expandedNote === note.id ? 'Hide transcript' : 'Show transcript'}
                        >
                          <svg 
                            className={`w-5 h-5 transition-transform ${expandedNote === note.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Transcript */}
                  {expandedNote === note.id && note.transcript && (
                    <div className="border-t border-slate-800 p-4 bg-slate-900/50">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Transcript:</h4>
                      <p className="text-slate-200 whitespace-pre-wrap">{note.transcript}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(note.transcript || '')
                        }}
                        className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                  )}

                  {/* Error Display */}
                  {note.transcript_status === 'failed' && note.transcript_error && (
                    <div className="border-t border-slate-800 p-4 bg-red-500/10">
                      <p className="text-red-400 text-sm">
                        <span className="font-medium">Transcription failed:</span> {note.transcript_error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
