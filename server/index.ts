import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5583;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|mp4|mpeg|mpga|m4a|wav|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed'));
  }
});

app.use(cors());
app.use(express.json());

// Database initialization
let db: any;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, '../database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transcriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      duration INTEGER,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    const token = jwt.sign(
      { userId: result.lastID, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    res.json({ token, email });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, email },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );

  res.json({ token, email });
});

app.post('/api/transcribe', authenticateToken, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    // Get audio duration (simplified - in production use a library like get-audio-duration)
    const duration = Math.floor(Math.random() * 300) + 60; // Placeholder: 1-5 min

    const result = await db.run(
      'INSERT INTO transcriptions (user_id, filename, original_filename, duration, text) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, req.file.filename, req.file.originalname, duration, transcription.text]
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      id: result.lastID,
      text: transcription.text,
      duration,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Transcription error:', err);
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Get transcription history
app.get('/api/transcriptions', authenticateToken, async (req, res) => {
  try {
    const transcriptions = await db.all(
      'SELECT id, original_filename as originalFilename, duration, text, created_at as createdAt FROM transcriptions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(transcriptions);
  } catch (err) {
    console.error('Error fetching transcriptions:', err);
    res.status(500).json({ error: 'Failed to fetch transcriptions' });
  }
});

// Get single transcription
app.get('/api/transcriptions/:id', authenticateToken, async (req, res) => {
  try {
    const transcription = await db.get(
      'SELECT id, original_filename as originalFilename, duration, text, created_at as createdAt FROM transcriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }
    
    res.json(transcription);
  } catch (err) {
    console.error('Error fetching transcription:', err);
    res.status(500).json({ error: 'Failed to fetch transcription' });
  }
});

// Delete transcription
app.delete('/api/transcriptions/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM transcriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transcription not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting transcription:', err);
    res.status(500).json({ error: 'Failed to delete transcription' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
