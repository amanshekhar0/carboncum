/**
 * tradeController.js
 *
 * POST /api/trade/points
 * Atomic peer-to-peer transfer of Eco-Points between two CarbonTwin users.
 */

const mongoose = require('mongoose');
const User = require('../models/User');

const tradePoints = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is currently unavailable.' });
  }

  const session = await mongoose.startSession();
  try {
    const { toEmail, points } = req.body;
    const fromUserId = req.userId;
    const transferAmount = Math.floor(Number(points));

    if (!toEmail || !Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'A valid recipient email and positive points value are required.' });
    }

    let response;
    await session.withTransaction(async () => {
      const sender = await User.findById(fromUserId).session(session);
      const receiver = await User.findOne({ email: toEmail.toLowerCase() }).session(session);

      if (!sender) throw new Error('Sender not found');
      if (!receiver) throw new Error('Recipient not found');
      if (sender._id.equals(receiver._id)) throw new Error('You cannot trade points with yourself');
      if ((sender.ecoPoints || 0) < transferAmount) {
        throw new Error(
          `Insufficient EcoPoints. You have ${sender.ecoPoints || 0}, tried to send ${transferAmount}.`
        );
      }

      sender.ecoPoints -= transferAmount;
      receiver.ecoPoints = (receiver.ecoPoints || 0) + transferAmount;

      await sender.save({ session });
      await receiver.save({ session });

      response = {
        success: true,
        message: `Transferred ${transferAmount} EcoPoints to ${receiver.name}`,
        senderBalance: sender.ecoPoints,
        receiverBalance: receiver.ecoPoints
      };
    });

    res.json(response);
  } catch (err) {
    console.error('[tradeController] tradePoints error:', err.message);
    res.status(400).json({ error: err.message || 'Trade failed' });
  } finally {
    session.endSession();
  }
};

module.exports = { tradePoints };
