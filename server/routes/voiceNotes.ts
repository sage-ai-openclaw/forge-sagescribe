import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { processTranscription } from '../services/transcription.js';

const router = express.Router();

// Get all voice notes for authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    const stmt = db.prepare(`
      SELECT id, duration_ms, created_at, transcript, transcript_status, transcript_error
      FROM voice_notes 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    const notes = stmt.all(userId);
    res.json({ notes });
  } catch (error) {
    console.error('Error fetching voice notes:', error);
    res.status(500).json({ error: 'Failed to fetch voice notes' });
  }
});

// Get a single voice note with full details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    
    const stmt = db.prepare(`
      SELECT id, duration_ms, created_at, transcript, transcript_status, transcript_error
      FROM voice_notes 
      WHERE id = ? AND user_id = ?
    `);
    const note = stmt.get(noteId, userId);
    
    if (!note) {
      return res.status(404).json({ error: 'Voice note not found' });
    }
    
    res.json({ note });
  } catch (error) {
    console.error('Error fetching voice note:', error);
    res.status(500).json({ error: 'Failed to fetch voice note' });
  }
});

// Get transcription status for a voice note
router.get('/:id/transcription', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    
    const stmt = db.prepare(`
      SELECT id, transcript, transcript_status, transcript_error, updated_at
      FROM voice_notes 
      WHERE id = ? AND user_id = ?
    `);
    const note = stmt.get(noteId, userId) as { 
      id: number; 
      transcript: string | null; 
      transcript_status: string; 
      transcript_error: string | null;
      updated_at: string;
    } | undefined;
    
    if (!note) {
      return res.status(404).json({ error: 'Voice note not found' });
    }
    
    res.json({
      id: note.id,
      status: note.transcript_status,
      transcript: note.transcript,
      error: note.transcript_error,
      updatedAt: note.updated_at,
    });
  } catch (error) {
    console.error('Error fetching transcription status:', error);
    res.status(500).json({ error: 'Failed to fetch transcription status' });
  }
});

// Get a single voice note audio
router.get('/:id/audio', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    
    const stmt = db.prepare(`
      SELECT audio_blob, mime_type 
      FROM voice_notes 
      WHERE id = ? AND user_id = ?
    `);
    const note = stmt.get(noteId, userId) as { audio_blob: Buffer; mime_type: string } | undefined;
    
    if (!note) {
      return res.status(404).json({ error: 'Voice note not found' });
    }
    
    res.setHeader('Content-Type', note.mime_type);
    res.send(note.audio_blob);
  } catch (error) {
    console.error('Error fetching audio:', error);
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
});

// Save a new voice note
router.post('/', authenticateToken, express.raw({ type: 'audio/*', limit: '50mb' }), async (req, res) => {
  try {
    const userId = req.userId;
    const audioBlob = req.body as Buffer;
    const mimeType = req.headers['content-type'] || 'audio/webm';
    const durationMs = parseInt(req.headers['x-duration-ms'] as string) || null;
    
    if (!audioBlob || audioBlob.length === 0) {
      return res.status(400).json({ error: 'No audio data provided' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO voice_notes (user_id, audio_blob, mime_type, duration_ms, transcript_status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(userId, audioBlob, mimeType, durationMs);
    const noteId = result.lastInsertRowid as number;
    
    // Trigger transcription asynchronously
    // Don't await - let it run in the background
    processTranscription(noteId, audioBlob, mimeType).catch(err => {
      console.error('Background transcription error:', err);
    });
    
    res.status(201).json({ 
      id: noteId,
      message: 'Voice note saved successfully',
      transcriptStatus: 'pending'
    });
  } catch (error) {
    console.error('Error saving voice note:', error);
    res.status(500).json({ error: 'Failed to save voice note' });
  }
});

// Delete a voice note
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    
    const stmt = db.prepare(`
      DELETE FROM voice_notes 
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(noteId, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Voice note not found' });
    }
    
    res.json({ message: 'Voice note deleted successfully' });
  } catch (error) {
    console.error('Error deleting voice note:', error);
    res.status(500).json({ error: 'Failed to delete voice note' });
  }
});

export default router;
