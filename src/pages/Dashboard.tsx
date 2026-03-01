import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UploadZone from '../components/UploadZone';
import ProgressBar from '../components/ProgressBar';

interface Transcription {
  id: number;
  original_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  text: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Transcription | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTranscriptions();
  }, [token, navigate]);

  const fetchTranscriptions = async () => {
    const res = await fetch('/api/transcriptions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTranscriptions(data);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch('/api/transcriptions/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      setUploadStatus({
        id: data.id,
        original_name: file.name,
        status: 'pending',
        text: null,
        created_at: new Date().toISOString(),
        completed_at: null
      });

      // Poll for status
      pollStatus(data.id);
    } catch (err: any) {
      alert(err.message);
      setIsUploading(false);
    }
  };

  const pollStatus = async (id: number) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/transcriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      setUploadStatus(prev => prev ? { ...prev, status: data.status } : null);

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval);
        setIsUploading(false);
        setUploadStatus(null);
        fetchTranscriptions();
        if (data.status === 'completed') {
          navigate(`/transcription/${id}`);
        }
      }
    }, 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Processing...';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.round(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Audio</h2>
        <UploadZone onUpload={handleUpload} isUploading={isUploading} />
        {uploadStatus && (
          <div className="mt-6">
            <p className="text-sm text-slate-400 mb-2">{uploadStatus.original_name}</p>
            <ProgressBar status={uploadStatus.status} />
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Transcriptions</h2>
        {transcriptions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No transcriptions yet. Upload your first audio file above!</p>
        ) : (
          <div className="space-y-3">
            {transcriptions.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/transcription/${t.id}`)}
                className="w-full text-left p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-200">{t.original_name}</p>
                    <p className="text-sm text-slate-500">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      t.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                      t.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {t.status}
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatDuration(t.created_at, t.completed_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
