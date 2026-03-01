import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.ts';

const app = express();
const PORT = process.env.PORT || 5584;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
