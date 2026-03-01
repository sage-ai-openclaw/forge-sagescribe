import { useState } from 'react';
import { Upload, Loader2, Check, Copy, Download, Mic } from 'lucide-react';
import { transcriptions } from '../services/api';
import { RecordButton } from './RecordButton';
import { useVoiceNotes } from '../hooks/useVoiceNotes';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ text: string; id: number } | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { saveRecording } = useVoiceNotes();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const response = await transcriptions.upload(file);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRecordingComplete = async (blob: Blob, durationMs: number) => {
    setError('');
    setSaveSuccess(false);
    try {
      // Convert blob to file for transcription
      const audioFile = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type });
      
      // Save to voice notes
      await saveRecording(blob, durationMs);
      
      // Also transcribe
      setUploading(true);
      const response = await transcriptions.upload(audioFile);
      setResult(response.data);
      setSaveSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to process recording');
    } finally {
      setUploading(false);
    }
  };

  const handleRecordingError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.text);
    }
  };

  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${result.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Transcription Complete</h2>
              <p className="text-sm text-slate-400">Your audio has been processed</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-6 mb-6">
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.text}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={downloadTxt}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
                setSaveSuccess(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors ml-auto"
            >
              <Upload className="w-4 h-4" />
              {activeTab === 'record' ? 'Record Another' : 'Upload Another'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-slate-800/50 rounded-xl">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'record'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            Record Voice
          </button>
        </div>

        {activeTab === 'upload' ? (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Upload Audio</h2>
              <p className="text-slate-400">Supported formats: MP3, WAV, M4A, WEBM (max 100MB)</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-8 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-300 font-medium mb-1">
                  {file ? file.name : 'Click to select or drag audio file'}
                </p>
                <p className="text-sm text-slate-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'MP3, WAV, M4A up to 100MB'}
                </p>
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full mt-6 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Transcribe Audio
                </>
              )}
            </button>
          </form>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Record Voice Note</h2>
              <p className="text-slate-400">Click the button below to start recording</p>
            </div>

            <RecordButton
              onRecordingComplete={handleRecordingComplete}
              onError={handleRecordingError}
            />

            {uploading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Transcribing...
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center">
            Recording saved and transcribed successfully!
          </div>
        )}
      </div>
    </div>
  );
}
