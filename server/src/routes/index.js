/**
 * routes/index.js
 * Central router that mounts all API endpoints.
 */

const express = require('express');
const router = express.Router();

const { ingestBrowser, ingestHardware, ingestLifestyle } = require('../controllers/ingestController');
const { getMetrics, getLeaderboard, seedDemo } = require('../controllers/dashboardController');
const { whatIf } = require('../controllers/simulatorController');
const { sendMessage } = require('../controllers/chatController');
const { getSuggestions, actionSuggestion, generateSuggestions } = require('../controllers/suggestionController');
const { exportESG } = require('../controllers/exportController');
const { tradePoints } = require('../controllers/tradeController');
const { signup, login } = require('../controllers/authController');

const { scanTicket } = require('../controllers/scanController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ---- Auth Routes ----
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// ---- Ingestion Routes ----
router.post('/ingest/browser', ingestBrowser);
router.post('/ingest/hardware', ingestHardware);
router.post('/ingest/lifestyle', ingestLifestyle);

// ---- Sustainability Features ----
router.post('/sustainability/scan-ticket', upload.single('image'), scanTicket);

// ---- Dashboard Routes ----
router.get('/dashboard/metrics', getMetrics);
router.get('/dashboard/leaderboard', getLeaderboard);
router.get('/dashboard/seed', seedDemo); // Dev only: seed demo data

// ---- Simulator ----
router.post('/simulator/what-if', whatIf);

// ---- AI Chat ----
router.post('/chat', sendMessage);

// ---- Suggestions ----
router.get('/suggestions', getSuggestions);
router.patch('/suggestions/:id', actionSuggestion);
router.post('/suggestions/generate', generateSuggestions);

// ---- ESG Export ----
router.get('/export/esg', exportESG);

// ---- P2P Trading ----
router.post('/trade/points', tradePoints);

// ---- Health Check ----
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CarbonTwin API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
