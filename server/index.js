/**
 * CarbonTwin Express Server
 * Entry point for the backend API.
 * 
 * Startup sequence:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Connect to Redis (with fallback)
 * 4. Mount Express routes
 * 5. Start HTTP server
 * 6. Start daily nudge cron
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

// Disable buffering to prevent timeouts when DB is down
mongoose.set('bufferCommands', false);

const routes = require('./src/routes/index');
const { connectRedis } = require('./src/services/RedisService');
const { startNudgeCron } = require('./src/jobs/nudgeCron');
const { startSleeper } = require('./src/jobs/idleSleeper');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware ----
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // HTTP request logging

// ---- Routes ----
app.use('/api', routes);

// ---- Root ----
app.get('/', (req, res) => {
  res.json({
    name: 'CarbonTwin API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health'
  });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ---- Bootstrap ----
const bootstrap = async () => {
  // 2. Connect Redis (non-blocking, has fallback)
  await connectRedis();

  // 3. Start HTTP server (always start, even if DB is down)
  const server = app.listen(PORT, () => {
    console.log(`[Server] CarbonTwin API running on http://localhost:${PORT}`);
    console.log(`[Server] Frontend expected at ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });

  // 7. Initialize Real-Time WebSockets
  const { init } = require('./src/services/SocketService');
  init(server);

  // 1. Connect MongoDB (non-fatal – server still starts without it)
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'carbontwin',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('[MongoDB] Connected to Atlas cluster ✓');

    // 4. Start daily nudge cron (only if DB is connected)
    startNudgeCron();

    // 6. Start Windows Auto-Sleep monitor (Digital Sustainability)
    if (process.platform === 'win32') {
      startSleeper();
    }
  } catch (err) {
    console.error('[MongoDB] Connection FAILED:', err.message);
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('');
      console.error('╔══════════════════════════════════════════════════════════╗');
      console.error('║  MONGODB AUTH ERROR – ACTION REQUIRED                   ║');
      console.error('║  1. Go to MongoDB Atlas → Database Access               ║');
      console.error('║  2. Check that user "carboncum" exists with password     ║');
      console.error('║     "carboncum"                                          ║');
      console.error('║  3. Ensure Network Access allows your IP (0.0.0.0/0)    ║');
      console.error('║  4. Update MONGO_URI in server/.env                     ║');
      console.error('║                                                          ║');
      console.error('║  API is still running – Groq AI chatbot will work!      ║');
      console.error('╚══════════════════════════════════════════════════════════╝');
    }
    console.warn('[Server] Running WITHOUT database. Some endpoints will return 500.');
  }
};

bootstrap();

module.exports = app;
