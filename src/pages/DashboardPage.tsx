import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, apiFetch } from '../store/authStore'
import { RecordButton } from '../components/RecordButton'

interface VoiceNote {
  id: number
  duration_ms: number
  created_at: string
}

function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchVoiceNotes()
  }, [isAuthenticated, navigate])

  const fetchVoiceNotes = async () => {
    try {
      const response = await apiFetch('/api/voice-notes')
      const data = await response.json()
      setVoiceNotes(data.notes || [])
    } catch (error) {
      console.error('Error fetching voice notes:', error)
    }
  }

  const handleRecordingComplete = useCallback(async (blob: Blob, durationMs: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiFetch('/api/voice-notes', {
        method: 'POST',
        headers: {
          'Content-Type': blob.type,
          'X-Duration-Ms': durationMs.toString(),
        },
        body: blob,
      })
      
      if (!response.ok) {
        throw new Error('Failed to save voice note')
      }
      
      // Refresh the list
      await fetchVoiceNotes()
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
      await fetchVoiceNotes()
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
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Voice Note #{note.id}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(note.created_at).toLocaleString()} • {formatDuration(note.duration_ms)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <audio 
                      controls 
                      src={`/api/voice-notes/${note.id}/audio`}
                      className="h-8 w-48"
                    />
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage