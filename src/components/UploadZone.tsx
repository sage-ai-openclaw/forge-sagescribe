import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File exceeds 25MB limit. Upgrade for larger files.');
      } else {
        setError('Please upload a valid audio file (MP3, WAV, M4A, OGG, WEBM)');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4']
    },
    maxSize: 25 * 1024 * 1024,
    disabled: isUploading
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        {isUploading ? (
          <p className="text-slate-400">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-indigo-400 font-medium">Drop the audio file here</p>
        ) : (
          <>
            <p className="text-slate-300 font-medium mb-2">Drag & drop your audio file here</p>
            <p className="text-slate-500 text-sm">or click to browse</p>
            <p className="text-slate-600 text-xs mt-4">MP3, WAV, M4A, OGG, WEBM • Max 25MB</p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
