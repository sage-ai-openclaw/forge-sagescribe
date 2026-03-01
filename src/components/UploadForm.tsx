import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface UploadFormProps {
  onSuccess: () => void;
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { token, usage, refreshUsage } = useAuth();

  const API_URL = 'http://localhost:5583/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch(`${API_URL}/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      await refreshUsage();
      onSuccess();
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const isAtLimit = usage?.tier === 'free' && usage.remainingToday === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="audio-upload"
          disabled={isAtLimit}
        />
        <label 
          htmlFor="audio-upload" 
          className={`cursor-pointer block ${isAtLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {file ? (
            <span className="text-slate-200">{file.name}</span>
          ) : (
            <div className="text-slate-400">
              <p className="text-lg mb-2">Drop audio file here or click to browse</p>
              <p className="text-sm">MP3, WAV, M4A up to {usage?.tier === 'free' ? '10 minutes' : 'any length'}</p>
            </div>
          )}
        </label>
      </div>

      {isAtLimit && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-amber-400 text-sm">
            You've reached your daily limit. <button type="button" className="underline font-medium">Upgrade to Pro</button> for unlimited transcriptions.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || uploading || isAtLimit}
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        {uploading ? 'Transcribing...' : 'Transcribe Audio'}
      </button>
    </form>
  );
}
