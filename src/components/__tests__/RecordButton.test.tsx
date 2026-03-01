import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordButton } from '../RecordButton';

// Mock MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null,
  onstop: null,
  onerror: null,
  state: 'inactive',
  mimeType: 'audio/webm',
}));

global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  }),
} as unknown as MediaDevices;

describe('RecordButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the record button in idle state', () => {
    render(<RecordButton />);
    
    expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
    expect(screen.getByText('Tap to record')).toBeInTheDocument();
  });

  it('requests microphone permission when clicked', async () => {
    render(<RecordButton />);
    
    const button = screen.getByLabelText('Start recording');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it('shows recording state when active', async () => {
    render(<RecordButton />);
    
    const button = screen.getByLabelText('Start recording');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Tap to stop recording')).toBeInTheDocument();
    });
  });

  it('calls onRecordingComplete when recording stops', async () => {
    const mockOnComplete = vi.fn();
    let stopHandler: (() => void) | null = null;
    
    // @ts-expect-error - Mocking MediaRecorder
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(function() {
        if (this.onstop) {
          stopHandler = this.onstop;
        }
      }),
      ondataavailable: null,
      onstop: null,
      onerror: null,
      state: 'recording',
      mimeType: 'audio/webm',
    }));
    
    render(<RecordButton onRecordingComplete={mockOnComplete} />);
    
    const button = screen.getByLabelText('Start recording');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();
    });
    
    // Click to stop
    fireEvent.click(screen.getByLabelText('Stop recording'));
    
    // Simulate the onstop callback
    if (stopHandler) {
      stopHandler();
    }
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('calls onError when microphone permission is denied', async () => {
    const mockOnError = vi.fn();
    
    global.navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError')
    );
    
    render(<RecordButton onError={mockOnError} />);
    
    const button = screen.getByLabelText('Start recording');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Microphone permission denied');
    });
  });
});
