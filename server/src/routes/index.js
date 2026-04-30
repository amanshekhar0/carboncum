/**
 * routes/index.js
 * Central router that mounts every API endpoint.
 */

const express = require('express');
const multer = require('multer');

const authMiddleware = require('../middleware/authMiddleware');
const {
  signup,
  login,
  me,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/authController');
const {
  ingestBrowser,
  ingestHardware,
  ingestLifestyle
} = require('../controllers/ingestController');
const {
  getMetrics,
  getLeaderboard,
  getActivity
} = require('../controllers/dashboardController');
const { whatIf } = require('../controllers/simulatorController');
const { sendMessage } = require('../controllers/chatController');
const {
  getSuggestions,
  actionSuggestion,
  generateSuggestions
} = require('../controllers/suggestionController');
const { exportESG } = require('../controllers/exportController');
const { tradePoints } = require('../controllers/tradeController');
const { scanTicket } = require('../controllers/scanController');
const { getGlobalStats } = require('../controllers/statsController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ---- Public ----
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CarbonTwin API', timestamp: new Date().toISOString() });
});
router.get('/stats/global', getGlobalStats);

// ---- Auth ----
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, me);
router.patch('/auth/profile', authMiddleware, updateProfile);
router.patch('/auth/password', authMiddleware, changePassword);
router.delete('/auth/account', authMiddleware, deleteAccount);

// ---- Dashboard ----
router.get('/dashboard/metrics', authMiddleware, getMetrics);
router.get('/dashboard/leaderboard', authMiddleware, getLeaderboard);
router.get('/dashboard/activity', authMiddleware, getActivity);

// ---- Ingestion ----
router.post('/ingest/browser', authMiddleware, ingestBrowser);
router.post('/ingest/hardware', authMiddleware, ingestHardware);
router.post('/ingest/lifestyle', authMiddleware, ingestLifestyle);

// ---- Sustainability features ----
router.post(
  '/sustainability/scan-ticket',
  authMiddleware,
  upload.single('image'),
  scanTicket
);

// ---- Simulator ----
router.post('/simulator/what-if', authMiddleware, whatIf);

// ---- AI ----
router.post('/chat', authMiddleware, sendMessage);
router.get('/suggestions', authMiddleware, getSuggestions);
router.patch('/suggestions/:id', authMiddleware, actionSuggestion);
router.post('/suggestions/generate', authMiddleware, generateSuggestions);

// ---- ESG ----
router.get('/export/esg', authMiddleware, exportESG);

// ---- P2P trading ----
router.post('/trade/points', authMiddleware, tradePoints);

module.exports = router;
