import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, apiFetch } from '../store/authStore'

function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Verify token is still valid
    apiFetch('/api/auth/me').catch(() => {
      // Error handled by apiFetch (logs out and redirects)
    })
  }, [isAuthenticated, navigate])

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
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Welcome, {user?.email}</h1>
          <p className="text-slate-400 mb-8">Your transcription dashboard is coming soon.</p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Free tier active
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
