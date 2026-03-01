import db from '../db.js';

interface WhisperResponse {
  text: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<WhisperResponse> {
  // Create a temporary file from the buffer
  const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const extension = mimeType === 'audio/webm' ? 'webm' : 
                    mimeType === 'audio/wav' ? 'wav' : 
                    mimeType === 'audio/mp4' ? 'm4a' : 'audio';
  const tempFilePath = `/tmp/${tempFileName}.${extension}`;
  
  try {
    // Write buffer to temp file
    const fs = await import('fs');
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Create form data for the Whisper API
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath));
    form.append('model', 'whisper-1');

    // Call the Whisper API
    const response = await fetch('http://truenas-scale:5555/transcribe', {
      method: 'POST',
      body: form as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      text: result.text || result.transcription || '',
      segments: result.segments,
    };
  } finally {
    // Clean up temp file
    try {
      const fs = await import('fs');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
  }
}

export async function processTranscription(noteId: number, audioBuffer: Buffer, mimeType: string): Promise<void> {
  try {
    // Update status to processing
    const updateStmt = db.prepare(`
      UPDATE voice_notes 
      SET transcript_status = 'processing', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(noteId);

    // Call Whisper API
    const result = await transcribeAudio(audioBuffer, mimeType);

    // Update with transcript
    const completeStmt = db.prepare(`
      UPDATE voice_notes 
      SET transcript = ?, transcript_status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    completeStmt.run(result.text, noteId);

    console.log(`Transcription completed for note ${noteId}`);
  } catch (error) {
    console.error(`Transcription failed for note ${noteId}:`, error);
    
    // Update with error status
    const errorStmt = db.prepare(`
      UPDATE voice_notes 
      SET transcript_status = 'failed', 
          transcript_error = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    errorStmt.run(error instanceof Error ? error.message : 'Unknown error', noteId);
  }
}
