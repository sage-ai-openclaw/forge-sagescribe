import express from 'express';
import db from '../db.ts';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all voice notes for authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    const stmt = db.prepare(`
      SELECT id, duration_ms, created_at 
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
router.post('/', authenticateToken, express.raw({ type: 'audio/*', limit: '50mb' }), (req, res) => {
  try {
    const userId = req.userId;
    const audioBlob = req.body as Buffer;
    const mimeType = req.headers['content-type'] || 'audio/webm';
    const durationMs = parseInt(req.headers['x-duration-ms'] as string) || null;
    
    if (!audioBlob || audioBlob.length === 0) {
      return res.status(400).json({ error: 'No audio data provided' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO voice_notes (user_id, audio_blob, mime_type, duration_ms)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, audioBlob, mimeType, durationMs);
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: 'Voice note saved successfully' 
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
