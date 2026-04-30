/**
 * CarbonTwin API server.
 *
 * Boot sequence:
 *   1. Load env vars
 *   2. Connect to MongoDB Atlas (non-fatal: server still starts so the UI can show 503s)
 *   3. Connect to Redis (non-fatal: falls back to in-memory cache)
 *   4. Initialise Express + Socket.io
 *   5. Schedule the daily Eco-Nudge cron (only when MongoDB is up)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

const routes = require('./src/routes/index');
const { connectRedis } = require('./src/services/RedisService');
const { startNudgeCron } = require('./src/jobs/nudgeCron');

mongoose.set('bufferCommands', false);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // permissive for hackathon demo
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'CarbonTwin API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health'
  });
});

app.use((err, req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const bootstrap = async () => {
  await connectRedis();

  const server = app.listen(PORT, () => {
    console.log(`[Server] CarbonTwin API listening on http://localhost:${PORT}`);
    console.log(`[Server] Frontend expected at ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });

  const { init } = require('./src/services/SocketService');
  init(server);

  if (!process.env.MONGO_URI) {
    console.warn('[MongoDB] MONGO_URI is not set. The API will respond with 503 until configured.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || 'carbontwin',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('[MongoDB] Connected to Atlas cluster');

    startNudgeCron();
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    console.warn('[Server] Running without database. Authenticated endpoints will return 503 until the DB recovers.');
  }
};

bootstrap();

module.exports = app;
