import { useState, useRef, useCallback } from 'react';

interface RecordButtonProps {
  onRecordingComplete?: (blob: Blob, durationMs: number) => void;
  onError?: (error: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'processing';

export function RecordButton({ onRecordingComplete, onError }: RecordButtonProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        setRecordingState('processing');
        
        // Call the completion handler
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, durationMs);
        }
        
        setRecordingState('idle');
        setRecordingDuration(0);
      };
      
      // Handle errors
      mediaRecorder.onerror = () => {
        if (onError) {
          onError('Recording error occurred');
        }
        setRecordingState('idle');
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState('recording');
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      if (onError) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          onError('Microphone permission denied');
        } else if (error instanceof DOMException && error.name === 'NotFoundError') {
          onError('No microphone found');
        } else {
          onError('Failed to start recording');
        }
      }
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  const toggleRecording = useCallback(() => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  // Cleanup on unmount
  const cleanupRef = useRef(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  });

  // Expose cleanup for parent components if needed
  // useEffect(() => cleanupRef.current, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Recording Status */}
      {recordingState === 'recording' && (
        <div className="flex items-center gap-2 text-red-400 animate-pulse">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-lg font-mono">{formatDuration(recordingDuration)}</span>
        </div>
      )}
      
      {recordingState === 'processing' && (
        <div className="text-emerald-400 text-sm">
          Saving...
        </div>
      )}
      
      {/* Main Record Button */}
      <button
        onClick={toggleRecording}
        disabled={recordingState === 'processing'}
        className={`
          relative w-32 h-32 rounded-full transition-all duration-200 ease-out
          flex items-center justify-center
          ${recordingState === 'recording' 
            ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/30' 
            : recordingState === 'processing'
            ? 'bg-slate-600 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-105 shadow-lg shadow-emerald-500/30'
          }
        `}
        aria-label={recordingState === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {/* Pulsing ring effect when recording */}
        {recordingState === 'recording' && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30"></span>
        )}
        
        {/* Icon */}
        <svg 
          className={`w-16 h-16 transition-colors ${
            recordingState === 'recording' ? 'text-white' : 'text-white'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {recordingState === 'recording' ? (
            // Stop icon (square)
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            // Microphone icon
            <>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </>
          )}
        </svg>
      </button>
      
      {/* Instruction text */}
      <p className="text-slate-400 text-sm">
        {recordingState === 'recording' 
          ? 'Tap to stop recording' 
          : recordingState === 'processing'
          ? 'Saving your voice note...'
          : 'Tap to record'
        }
      </p>
    </div>
  );
}

export default RecordButton;
