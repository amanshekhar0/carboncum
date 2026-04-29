/**
 * CarbonTwin Constants
 * Centralized config for the Carbon Engine formula and cost metrics.
 * Formula: Carbon (kg) = Usage × BaseEnergy (kWh) × PUE × GridIntensity
 */
module.exports = {
  // Power Usage Effectiveness – standard datacenter overhead multiplier
  PUE: 1.2,

  // India CEA 2023 Grid Intensity (kg CO2 per kWh)
  GRID_INTENSITY: 0.71,

  // Cost metrics (₹ per unit)
  COSTS: {
    EMAIL: 0.005,        // per MB
    CLOUD_STORAGE: 0.001, // per MB
    AI_TOKENS: 0.0003,   // per token
    WEB_SEARCH: 0.02,    // per search
    VIDEO_HOUR: 2.5,     // per hour of streaming
    AC_HOUR: 8.0,        // per hour of AC usage
    ZOMBIE_TAB_HOUR: 0.5, // per zombie tab per hour
    METRO_TRIP: 45.0,    // savings per trip vs car (₹)
    MEAT_FREE_MEAL: 150.0, // savings per meal (₹)
    PAPERLESS_PAGE: 0.5  // savings per page (₹)
  },

  // Base energy estimates (kWh per unit)
  ENERGY: {
    EMAIL: 0.0002,          // per MB
    CLOUD_STORAGE: 0.00005, // per MB
    AI_TOKENS: 0.00001,     // per token
    WEB_SEARCH: 0.001,      // per search
    VIDEO_4K: 0.15,         // per hour
    VIDEO_1080P: 0.08,      // per hour
    VIDEO_720P: 0.05,       // per hour
    VIDEO_480P: 0.02,       // per hour
    ZOMBIE_TAB: 0.005,      // per tab per hour
    AC_PER_DEGREE: 0.12,    // kWh saved per °C increase
    LAPTOP_SLEEP: 0.003,    // per hour in sleep vs active
    SCREEN_BRIGHTNESS: 0.02, // kWh per hour at 100% vs 50%
    DARK_MODE_SAVINGS: 0.01, // kWh per hour saved on OLED
    VAMPIRE_POWER: 0.005,    // kWh per hour for idle peripherals
    METRO_SAVINGS_KG: 2.1,   // CO2 saved per average commute trip
    MEAT_FREE_SAVINGS_KG: 3.3, // CO2 saved per meal
    PAPERLESS_SAVINGS_KG: 0.005 // CO2 saved per page
  },

  // Redis TTL values (seconds)
  CACHE: {
    LEADERBOARD_TTL: 300,  // 5 minutes
    SIMULATOR_TTL: 3600,   // 1 hour
    METRICS_TTL: 60        // 1 minute
  },

  // Eco-score thresholds
  ECO_SCORE: {
    SLACK_NOTIFY_THRESHOLD: 90,
    STREAK_BONUS_DAYS: 7
  }
};
