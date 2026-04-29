const axios = require('axios');
const User = require('../models/User');
const { del } = require('../services/RedisService');

/**
 * POST /api/sustainability/scan-ticket
 * Processes a ticket image, extracts route, calculates CO2 saved, and awards points.
 */
const scanTicket = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a ticket image.' });
    }

    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required.' });
    }

    // 1. Convert image to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // 2. Call xAI Grok Vision API
    const xaiApiKey = process.env.XAI_API_KEY; 
    if (!xaiApiKey) {
       // Fallback to a mock response if no key is provided for the prototype
       console.warn("XAI_API_KEY not found. Using simulation logic.");
       return simulateScan(userId, res);
    }

    const prompt = "You are a transit data extractor. Analyze this ticket image. Return ONLY a raw JSON object with no markdown, no code blocks, and no extra text. The JSON must have these exact keys: 'origin' (string, default 'Unknown'), 'destination' (string, default 'Unknown'), 'transport_mode' (string: 'bus', 'metro', 'train', or 'unknown').";

    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: "grok-vision-beta",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0
    }, {
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content.trim();
    let ticketData;
    try {
      // Handle potential markdown blocks if LLM ignored instructions
      const jsonStr = content.replace(/```json|```/g, '').trim();
      ticketData = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse ticket data. Please try a clearer photo or enter details manually.' });
    }

    // 3. Calculation Logic
    // Mock distance between 5km and 30km
    const distance = Math.floor(Math.random() * 25) + 5;
    // Saved CO2 (kg) = Distance (km) * (0.192 - 0.04)
    const carbonSaved = parseFloat((distance * (0.192 - 0.04)).toFixed(3));
    // Points = Math.round(Saved CO2 * 10)
    const points = Math.round(carbonSaved * 10) || 10;

    // 4. Update Database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.totalCarbonSaved += carbonSaved;
    user.commuteHistory.push({
      origin: ticketData.origin,
      destination: ticketData.destination,
      transportMode: ticketData.transport_mode,
      carbonSaved,
      pointsAwarded: points
    });
    
    user.recalculateEcoScore();
    await user.save();

    // 🌐 Real-Time Update
    const { emitUpdate } = require('../services/SocketService');
    emitUpdate(userId, {
      id: user._id,
      name: user.name,
      ecoScore: user.ecoScore,
      currentStreak: user.currentStreak,
      totalCarbonSaved: user.totalCarbonSaved,
      totalRupeesSaved: user.totalRupeesSaved
    });

    // Clear leaderboard cache
    await del('leaderboard:default');

    res.json({
      success: true,
      data: {
        origin: ticketData.origin,
        destination: ticketData.destination,
        transportMode: ticketData.transport_mode,
        carbonSaved,
        pointsAwarded: points,
        newEcoScore: user.ecoScore
      }
    });

  } catch (err) {
    console.error('[Scan Error]', err.response?.data || err.message);
    res.status(500).json({ error: 'Server error during ticket processing.' });
  }
};

/**
 * Simulation logic for when API key is missing during development
 */
const simulateScan = async (userId, res) => {
    // Wait 2 seconds to simulate processing
    await new Promise(r => setTimeout(r, 2000));
    
    const ticketData = {
        origin: "Koramangala",
        destination: "Indiranagar",
        transport_mode: "metro"
    };
    
    const distance = 12;
    const carbonSaved = parseFloat((distance * (0.192 - 0.04)).toFixed(3));
    const points = Math.round(carbonSaved * 10);

    const user = await User.findById(userId);
    if (user) {
        user.totalCarbonSaved += carbonSaved;
        user.commuteHistory.push({
            ...ticketData,
            transportMode: ticketData.transport_mode,
            carbonSaved,
            pointsAwarded: points
        });
        user.recalculateEcoScore();
        await user.save();
        await del('leaderboard:default');
    }

    res.json({
        success: true,
        isSimulated: true,
        data: {
            ...ticketData,
            transportMode: ticketData.transport_mode,
            carbonSaved,
            pointsAwarded: points,
            newEcoScore: user?.ecoScore || 75
        }
    });
};

module.exports = { scanTicket };
