import { useState, useEffect } from 'react';
import { Transcription } from '../types';
import { transcriptions } from '../services/api';
import { 
  Clock, 
  FileAudio, 
  Download, 
  Trash2, 
  ChevronLeft, 
  X,
  Loader2,
  Calendar
} from 'lucide-react';

interface TranscriptionHistoryProps {
  onBack: () => void;
}

export function TranscriptionHistory({ onBack }: TranscriptionHistoryProps) {
  const [items, setItems] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Transcription | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTranscriptions();
  }, []);

  const loadTranscriptions = async () => {
    try {
      const response = await transcriptions.getAll();
      setItems(response.data);
    } catch (err) {
      setError('Failed to load transcriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this transcription?')) return;
    
    try {
      await transcriptions.delete(id);
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      setError('Failed to delete transcription');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreview = (text: string) => {
    return text.slice(0, 120) + (text.length > 120 ? '...' : '');
  };

  const downloadAsTxt = (item: Transcription) => {
    const blob = new Blob([item.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.originalFilename.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsSrt = (item: Transcription) => {
    // Simple SRT format - in production, you'd want proper timestamp segmentation
    const lines = item.text.split(/[.!?]+/).filter(s => s.trim());
    let srtContent = '';
    lines.forEach((line, index) => {
      const startTime = index * 5;
      const endTime = startTime + 5;
      const formatTime = (s: number) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},000`;
      };
      srtContent += `${index + 1}\n${formatTime(startTime)} --> ${formatTime(endTime)}\n${line.trim()}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.originalFilename.replace(/\.[^/.]+$/, '')}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to history
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                {selectedItem.originalFilename}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedItem.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(selectedItem.duration)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadAsTxt(selectedItem)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                TXT
              </button>
              <button
                onClick={() => downloadAsSrt(selectedItem)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                SRT
              </button>
              <button
                onClick={(e) => handleDelete(selectedItem.id, e)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="bg-slate-950/50 rounded-xl p-6 text-slate-300 leading-relaxed whitespace-pre-wrap">
              {selectedItem.text}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h2 className="text-2xl font-bold text-slate-100">Transcription History</h2>
        </div>
        <span className="text-sm text-slate-400">
          {items.length} transcription{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <FileAudio className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No transcriptions yet</h3>
          <p className="text-slate-400">Upload your first audio file to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileAudio className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-medium text-slate-200 truncate">
                      {item.originalFilename}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {getPreview(item.text)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(item.duration)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAsTxt(item);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Download as TXT"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
