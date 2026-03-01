import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import voiceNotesRoutes from '../routes/voiceNotes';
import { generateToken } from '../middleware/auth';

// Mock the transcription service
vi.mock('../services/transcription', () => ({
  processTranscription: vi.fn().mockResolvedValue(undefined),
}));

describe('Voice Notes API', () => {
  let app: express.Application;
  let authToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.raw({ type: 'audio/*', limit: '50mb' }));
    app.use('/api/voice-notes', voiceNotesRoutes);
    
    // Create a test token
    authToken = generateToken(1, 'test@example.com');
  });

  describe('POST /api/voice-notes', () => {
    it('should save a voice note with valid audio data', async () => {
      const audioBuffer = Buffer.from('fake audio data');
      
      const response = await request(app)
        .post('/api/voice-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'audio/webm')
        .set('X-Duration-Ms', '5000')
        .send(audioBuffer);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Voice note saved successfully');
      expect(response.body.transcriptStatus).toBe('pending');
    });

    it('should return 401 without auth token', async () => {
      const audioBuffer = Buffer.from('fake audio data');
      
      const response = await request(app)
        .post('/api/voice-notes')
        .set('Content-Type', 'audio/webm')
        .send(audioBuffer);
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should return 400 with no audio data', async () => {
      const response = await request(app)
        .post('/api/voice-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'audio/webm');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No audio data provided');
    });
  });

  describe('GET /api/voice-notes', () => {
    it('should return list of voice notes with transcription status', async () => {
      const response = await request(app)
        .get('/api/voice-notes')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notes');
      expect(Array.isArray(response.body.notes)).toBe(true);
      
      // Check that notes have transcription fields
      if (response.body.notes.length > 0) {
        const note = response.body.notes[0];
        expect(note).toHaveProperty('transcript');
        expect(note).toHaveProperty('transcript_status');
        expect(note).toHaveProperty('transcript_error');
      }
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/voice-notes');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/voice-notes/:id/transcription', () => {
    it('should return transcription status for a voice note', async () => {
      // First create a note
      const audioBuffer = Buffer.from('fake audio data');
      const createResponse = await request(app)
        .post('/api/voice-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'audio/webm')
        .set('X-Duration-Ms', '5000')
        .send(audioBuffer);
      
      const noteId = createResponse.body.id;
      
      // Get transcription status
      const response = await request(app)
        .get(`/api/voice-notes/${noteId}/transcription`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('transcript');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('updatedAt');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(response.body.status);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/voice-notes/99999/transcription')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Voice note not found');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/voice-notes/1/transcription');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/voice-notes/:id', () => {
    it('should return a single voice note with transcript', async () => {
      // First create a note
      const audioBuffer = Buffer.from('fake audio data');
      const createResponse = await request(app)
        .post('/api/voice-notes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'audio/webm')
        .set('X-Duration-Ms', '5000')
        .send(audioBuffer);
      
      const noteId = createResponse.body.id;
      
      // Get the note
      const response = await request(app)
        .get(`/api/voice-notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('note');
      expect(response.body.note).toHaveProperty('transcript');
      expect(response.body.note).toHaveProperty('transcript_status');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/voice-notes/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });
  });
});
