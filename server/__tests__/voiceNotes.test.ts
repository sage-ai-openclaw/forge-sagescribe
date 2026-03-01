import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import voiceNotesRoutes from '../routes/voiceNotes';
import { generateToken } from '../middleware/auth';

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
    it('should return list of voice notes for authenticated user', async () => {
      const response = await request(app)
        .get('/api/voice-notes')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notes');
      expect(Array.isArray(response.body.notes)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/voice-notes');
      
      expect(response.status).toBe(401);
    });
  });
});
