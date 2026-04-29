/**
 * CarbonEngine.js
 * The core math engine for all carbon calculations.
 * 
 * PRIMARY FORMULA:
 * Carbon (kg CO2) = Usage × BaseEnergy (kWh) × PUE (1.2) × GridIntensity (0.71)
 * 
 * This engine is the single source of truth for all CO2 and cost computations.
 * All ingest controllers funnel through this module.
 */

const { PUE, GRID_INTENSITY, ENERGY, COSTS } = require('../config/constants');

/**
 * Core formula: computes CO2 in kg given usage and base energy
 * @param {number} usage - Quantity (MB, tokens, hours, count)
 * @param {number} baseEnergyKwh - Energy per unit in kWh
 * @returns {number} Carbon impact in kg CO2
 */
const calculateCarbonImpact = (usage, baseEnergyKwh) => {
  return usage * baseEnergyKwh * PUE * GRID_INTENSITY;
};

/**
 * Calculates cost impact in Indian Rupees
 * @param {number} usage
 * @param {number} costPerUnit - ₹ per unit
 * @returns {number} Cost in INR
 */
const calculateCostImpact = (usage, costPerUnit) => {
  return usage * costPerUnit;
};

/**
 * Browser activity: zombie tabs, video streaming, extensions
 * @param {object} data - { tabCount, videoHours, videoQuality, searchCount, emailMb }
 */
const calculateBrowserImpact = (data) => {
  const { 
    tabCount = 0, 
    videoHours = 0, 
    videoQuality = '1080p', 
    searchCount = 0, 
    emailMb = 0,
    aiTokens = 0,
    isDarkMode = false,
    directNavigationCount = 0
  } = data;

  // Map quality string to energy constant
  const videoEnergyMap = {
    '4K': ENERGY.VIDEO_4K,
    '1080p': ENERGY.VIDEO_1080P,
    '720p': ENERGY.VIDEO_720P,
    '480p': ENERGY.VIDEO_480P
  };
  const videoEnergy = videoEnergyMap[videoQuality] || ENERGY.VIDEO_1080P;

  const zombieCO2 = calculateCarbonImpact(tabCount, ENERGY.ZOMBIE_TAB);
  const videoCO2 = calculateCarbonImpact(videoHours, videoEnergy);
  const searchCO2 = calculateCarbonImpact(searchCount, ENERGY.WEB_SEARCH);
  const emailCO2 = calculateCarbonImpact(emailMb, ENERGY.EMAIL);
  const aiCO2 = calculateCarbonImpact(aiTokens, ENERGY.AI_TOKENS);
  
  // Dark mode savings (assuming 1 hour of browsing)
  const darkModeCO2Saved = isDarkMode ? calculateCarbonImpact(1, ENERGY.DARK_MODE_SAVINGS) : 0;
  
  // Search mindfulness: saved CO2 by avoiding redundant searches
  const searchMindfulnessCO2Saved = calculateCarbonImpact(directNavigationCount, ENERGY.WEB_SEARCH);

  const totalCO2 = (zombieCO2 + videoCO2 + searchCO2 + emailCO2 + aiCO2) - (darkModeCO2Saved + searchMindfulnessCO2Saved);
  
  const totalCost = calculateCostImpact(tabCount, COSTS.ZOMBIE_TAB_HOUR) +
                    calculateCostImpact(videoHours, COSTS.VIDEO_HOUR) +
                    calculateCostImpact(searchCount, COSTS.WEB_SEARCH) +
                    calculateCostImpact(emailMb, COSTS.EMAIL) +
                    calculateCostImpact(aiTokens, COSTS.AI_TOKENS);

  return {
    carbonImpact: parseFloat(totalCO2.toFixed(4)),
    costImpact: parseFloat(totalCost.toFixed(2)),
    breakdown: {
      zombieTabs: { co2: zombieCO2, cost: 0 },
      videoStreaming: { co2: videoCO2, cost: 0 },
      aiUsage: { co2: aiCO2, cost: 0 },
      savings: { co2: -(darkModeCO2Saved + searchMindfulnessCO2Saved), cost: 0 }
    }
  };
};

/**
 * Hardware activity: sleep mode, screen brightness, charging, unplugging
 * @param {object} data - { sleepHours, brightnessReductionPercent, smartChargingEnabled, unpluggedHours, peripheralsDisconnected }
 */
const calculateHardwareImpact = (data) => {
  const { 
    sleepHours = 0, 
    brightnessReductionPercent = 0, 
    smartChargingEnabled = false,
    unpluggedHours = 0,
    peripheralsDisconnected = 0
  } = data;

  const sleepCO2Saved = calculateCarbonImpact(sleepHours, ENERGY.LAPTOP_SLEEP);
  const brightnessRatio = brightnessReductionPercent / 100;
  const brightnessCO2Saved = calculateCarbonImpact(brightnessRatio, ENERGY.SCREEN_BRIGHTNESS);
  
  // Vampire power savings from unplugging and disconnecting peripherals
  const vampireCO2Saved = calculateCarbonImpact(unpluggedHours, ENERGY.VAMPIRE_POWER) + 
                          calculateCarbonImpact(peripheralsDisconnected, ENERGY.VAMPIRE_POWER);

  const chargingSavings = smartChargingEnabled ? 250 : 0; 

  const totalCO2Saved = sleepCO2Saved + brightnessCO2Saved + vampireCO2Saved;
  const totalCostSaved = (sleepHours * 0.3) + (brightnessRatio * 1.2) + chargingSavings;

  return {
    carbonImpact: -parseFloat(totalCO2Saved.toFixed(4)),
    costImpact: -parseFloat(totalCostSaved.toFixed(2)),
    breakdown: {
      sleepMode: { co2: -sleepCO2Saved, cost: -(sleepHours * 0.3) },
      vampirePower: { co2: -vampireCO2Saved, cost: 0 }
    }
  };
};

/**
 * Lifestyle activity: AC thermostat, transport, diet, paperless
 * @param {object} data - { acTempIncrease, meatFreeDays, publicTransportDays, paperlessPages, deviceFreeHours }
 */
const calculateLifestyleImpact = (data) => {
  const { 
    acTempIncrease = 0, 
    meatFreeDays = 0, 
    publicTransportDays = 0,
    paperlessPages = 0,
    deviceFreeHours = 0
  } = data;

  const acCO2Saved = calculateCarbonImpact(acTempIncrease, ENERGY.AC_PER_DEGREE);
  const dietCO2Saved = meatFreeDays * ENERGY.MEAT_FREE_SAVINGS_KG;
  const transportCO2Saved = publicTransportDays * ENERGY.METRO_SAVINGS_KG;
  const paperlessCO2Saved = paperlessPages * ENERGY.PAPERLESS_SAVINGS_KG;
  
  // Device-free hours: savings from not using a laptop/phone (~0.05 kWh/hr)
  const deviceFreeCO2Saved = calculateCarbonImpact(deviceFreeHours, 0.05);

  const totalCO2Saved = acCO2Saved + dietCO2Saved + transportCO2Saved + paperlessCO2Saved + deviceFreeCO2Saved;
  
  const totalCostSaved = (acTempIncrease * COSTS.AC_HOUR) + 
                         (meatFreeDays * COSTS.MEAT_FREE_MEAL) + 
                         (publicTransportDays * COSTS.METRO_TRIP) +
                         (paperlessPages * COSTS.PAPERLESS_PAGE);

  return {
    carbonImpact: -parseFloat(totalCO2Saved.toFixed(4)),
    costImpact: -parseFloat(totalCostSaved.toFixed(2)),
    breakdown: {
      lifestyle: { co2: -totalCO2Saved, cost: -totalCostSaved }
    }
  };
};

/**
 * What-If simulator – stateless, no DB writes
 * @param {string} habit - 'videoQuality' | 'acTemp' | 'zombieTabs' | 'transport' | 'diet'
 * @param {number} value - Slider value 0-100
 */
const simulateHabitChange = (habit, value) => {
  let savingsPercent = 0;
  let carbonSavedKg = 0;
  let rupeesSavedInr = 0;

  switch (habit) {
    case 'videoQuality':
      // 0 = 4K, 100 = 480p; linear interpolation of energy savings
      savingsPercent = value * 0.4;
      carbonSavedKg = parseFloat((value * 0.05).toFixed(3));
      rupeesSavedInr = parseFloat((value * 0.8).toFixed(2));
      break;
    case 'acTemp':
      // 0 = 18°C, 100 = 26°C; each point = 0.08°C increase
      savingsPercent = value * 0.6;
      carbonSavedKg = parseFloat((value * 0.12).toFixed(3));
      rupeesSavedInr = parseFloat((value * 1.5).toFixed(2));
      break;
    case 'zombieTabs':
      // 0 = 100 tabs open, 100 = all tabs closed
      savingsPercent = value * 0.15;
      carbonSavedKg = parseFloat((value * 0.02).toFixed(3));
      rupeesSavedInr = parseFloat((value * 0.3).toFixed(2));
      break;
    case 'transport':
      savingsPercent = value * 0.5;
      carbonSavedKg = parseFloat((value * 0.21).toFixed(3));
      rupeesSavedInr = parseFloat((value * 0.8).toFixed(2));
      break;
    case 'diet':
      savingsPercent = value * 0.33;
      carbonSavedKg = parseFloat((value * 0.033 * 365 / 100).toFixed(3)); // scaled for 100% = every meal meat-free
      rupeesSavedInr = parseFloat((value * 1.5).toFixed(2));
      break;
    case 'paperless':
      savingsPercent = value * 0.1;
      carbonSavedKg = parseFloat((value * 0.01).toFixed(3));
      rupeesSavedInr = parseFloat((value * 0.5).toFixed(2));
      break;
    case 'deviceFree':
      savingsPercent = value * 0.25;
      carbonSavedKg = parseFloat((value * 0.08).toFixed(3));
      rupeesSavedInr = parseFloat((value * 0.6).toFixed(2));
      break;
    default:
      savingsPercent = value * 0.2;
      carbonSavedKg = parseFloat((value * 0.03).toFixed(3));
      rupeesSavedInr = parseFloat((value * 0.5).toFixed(2));
  }

  return { savingsPercent, carbonSavedKg, rupeesSavedInr };
};

module.exports = {
  calculateCarbonImpact,
  calculateCostImpact,
  calculateBrowserImpact,
  calculateHardwareImpact,
  calculateLifestyleImpact,
  simulateHabitChange
};
