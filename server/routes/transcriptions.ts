import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Get usage limits based on tier
function getTierLimits(tier: string) {
  return tier === 'pro' 
    ? { maxTranscriptions: 1000, maxDuration: 7200 } // Pro: 1000/month, 2 hours per file
    : { maxTranscriptions: 10, maxDuration: 600 };   // Free: 10/month, 10 min per file
}

// Check usage
function checkUsage(userId: number, tier: string) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const limits = getTierLimits(tier);
  
  let usage = db.prepare('SELECT * FROM usage WHERE user_id = ? AND month = ?').get(userId, month) as any;
  
  if (!usage) {
    db.prepare('INSERT INTO usage (user_id, month, transcription_count, total_seconds) VALUES (?, ?, 0, 0)').run(userId, month);
    usage = { transcription_count: 0, total_seconds: 0 };
  }

  return {
    canTranscribe: usage.transcription_count < limits.maxTranscriptions,
    remaining: limits.maxTranscriptions - usage.transcription_count,
    limits,
  };
}

router.post('/', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(userId) as any;

    const usage = checkUsage(userId, user.tier);
    if (!usage.canTranscribe) {
      return res.status(429).json({ 
        error: 'Monthly limit reached. Upgrade to Pro for more transcriptions.',
        upgradeRequired: true 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: require('fs').createReadStream(req.file.path),
      model: 'whisper-1',
    });

    // Estimate duration (rough approximation: ~150 words per minute)
    const wordCount = transcription.text.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    if (estimatedDuration > usage.limits.maxDuration) {
      return res.status(400).json({ 
        error: `Audio too long. ${user.tier === 'pro' ? '2 hours' : '10 minutes'} max per file.` 
      });
    }

    // Save transcription
    const result = db.prepare(`
      INSERT INTO transcriptions (user_id, filename, original_name, text, duration)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, req.file.filename, req.file.originalname, transcription.text, estimatedDuration);

    // Update usage
    const month = new Date().toISOString().slice(0, 7);
    db.prepare(`
      UPDATE usage 
      SET transcription_count = transcription_count + 1,
          total_seconds = total_seconds + ?
      WHERE user_id = ? AND month = ?
    `).run(estimatedDuration, userId, month);

    res.json({
      id: result.lastInsertRowid,
      text: transcription.text,
      duration: estimatedDuration,
      remaining: usage.remaining - 1,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).userId;
    const transcriptions = db.prepare(`
      SELECT id, original_name, text, duration, created_at
      FROM transcriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json(transcriptions);
  } catch (error) {
    console.error('Get transcriptions error:', error);
    res.status(500).json({ error: 'Failed to get transcriptions' });
  }
});

router.get('/usage', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(userId) as any;
    const month = new Date().toISOString().slice(0, 7);
    
    const usage = db.prepare('SELECT * FROM usage WHERE user_id = ? AND month = ?').get(userId, month) as any;
    const limits = getTierLimits(user.tier);

    res.json({
      tier: user.tier,
      used: usage?.transcription_count || 0,
      limit: limits.maxTranscriptions,
      remaining: limits.maxTranscriptions - (usage?.transcription_count || 0),
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

export default router;
