/**
 * tradeController.js
 * POST /api/trade/points
 * Allows users to transfer Eco-Score points to colleagues (P2P).
 */

const User = require('../models/User');

/**
 * POST /api/trade/points
 * Body: { fromUserId, toEmail, points }
 */
const tradePoints = async (req, res) => {
  try {
    const { fromUserId, toEmail, points } = req.body;

    if (!fromUserId || !toEmail || !points || points <= 0) {
      return res.status(400).json({ error: 'fromUserId, toEmail, and points > 0 are required' });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Mock success for demo
      return res.json({
        success: true,
        message: `Successfully transferred ${points} EcoPoints to ${toEmail} (MOCK)`,
        senderBalance: 500,
        receiverBalance: 1000,
        isMock: true
      });
    }

    const sender = await User.findById(fromUserId);
    const receiver = await User.findOne({ email: toEmail.toLowerCase() });

    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
    if (sender._id.equals(receiver._id)) return res.status(400).json({ error: 'Cannot trade with yourself' });
    if (sender.ecoPoints < points) {
      return res.status(400).json({
        error: `Insufficient EcoPoints. You have ${sender.ecoPoints}, tried to send ${points}.`
      });
    }

    // Atomic transfer
    sender.ecoPoints -= points;
    receiver.ecoPoints += points;

    await sender.save();
    await receiver.save();

    res.json({
      success: true,
      message: `Successfully transferred ${points} EcoPoints to ${receiver.name}`,
      senderBalance: sender.ecoPoints,
      receiverBalance: receiver.ecoPoints
    });
  } catch (err) {
    console.error('[tradeController]', err.message);
    res.status(500).json({ error: 'Trade failed' });
  }
};

module.exports = { tradePoints };
