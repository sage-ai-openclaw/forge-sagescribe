interface ProgressBarProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function ProgressBar({ status }: ProgressBarProps) {
  const steps = [
    { key: 'pending', label: 'Uploading' },
    { key: 'processing', label: 'Transcribing' },
    { key: 'completed', label: 'Done' }
  ];

  const currentStep = status === 'failed' ? -1 : steps.findIndex(s => s.key === status);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <span
            key={step.key}
            className={`text-sm ${
              index <= currentStep ? 'text-indigo-400' : 'text-slate-600'
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            status === 'failed' ? 'bg-red-500 w-full' : 'bg-indigo-500'
          }`}
          style={{
            width: status === 'failed' ? '100%' : `${((currentStep + 1) / steps.length) * 100}%`
          }}
        />
      </div>
      {status === 'failed' && (
        <p className="mt-2 text-red-400 text-sm">Transcription failed. Please try again.</p>
      )}
    </div>
  );
}
