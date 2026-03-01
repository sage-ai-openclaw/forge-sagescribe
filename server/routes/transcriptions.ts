import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import db from '../db.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/upload', authenticate, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = (req as any).userId;
  const { filename, originalname, size } = req.file;

  if (size > MAX_FILE_SIZE) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File exceeds 25MB limit' });
  }

  const result = db.prepare(
    'INSERT INTO transcriptions (user_id, filename, original_name, status) VALUES (?, ?, ?, ?)'
  ).run(userId, filename, originalname, 'processing');

  const transcriptionId = result.lastInsertRowid;

  res.json({ id: transcriptionId, status: 'processing' });

  // Process in background
  processTranscription(transcriptionId, req.file!.path);
});

async function processTranscription(id: number, filePath: string) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    const segments = (transcription as any).segments || [];

    db.prepare(
      'UPDATE transcriptions SET status = ?, text = ?, segments = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('completed', transcription.text, JSON.stringify(segments), id);

    fs.unlinkSync(filePath);
  } catch (error: any) {
    db.prepare(
      'UPDATE transcriptions SET status = ?, error = ? WHERE id = ?'
    ).run('failed', error.message, id);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

router.get('/', authenticate, (req, res) => {
  const userId = (req as any).userId;
  const transcriptions = db.prepare(
    'SELECT id, original_name, status, text, created_at, completed_at FROM transcriptions WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
  res.json(transcriptions);
});

router.get('/:id', authenticate, (req, res) => {
  const userId = (req as any).userId;
  const transcription = db.prepare(
    'SELECT * FROM transcriptions WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId) as any;
  
  if (!transcription) return res.status(404).json({ error: 'Not found' });
  
  res.json({
    ...transcription,
    segments: transcription.segments ? JSON.parse(transcription.segments) : null
  });
});

export default router;
