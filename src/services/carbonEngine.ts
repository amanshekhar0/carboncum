export const CARBON_CONSTANTS = {
  PUE: 1.2, // Power Usage Effectiveness
  GRID_INTENSITY: 0.71, // India CEA 2023 Grid Intensity (kg CO2/kWh)

  // Cost metrics (₹ per unit)
  COSTS: {
    EMAIL: 0.005, // per MB
    CLOUD_STORAGE: 0.001, // per MB
    AI_TOKENS: 0.0003, // per token
    WEB_SEARCH: 0.02 // per search
  },

  // Base energy estimates (kWh per unit)
  ENERGY: {
    EMAIL: 0.0002, // per MB
    CLOUD_STORAGE: 0.00005, // per MB
    AI_TOKENS: 0.00001, // per token
    WEB_SEARCH: 0.001, // per search
    VIDEO_STREAM_4K: 0.15, // per hour
    VIDEO_STREAM_720P: 0.05, // per hour
    ZOMBIE_TAB: 0.005 // per hour
  }
};

/**
 * Core engine formula:
 * Carbon (kg) = Usage * Base Energy (kWh) * PUE (1.2) * Grid Intensity (0.71)
 */
export const calculateCarbonImpact = (
usage: number,
baseEnergyKwh: number)
: number => {
  return (
    usage *
    baseEnergyKwh *
    CARBON_CONSTANTS.PUE *
    CARBON_CONSTANTS.GRID_INTENSITY);

};

export const calculateCostImpact = (
usage: number,
costPerUnit: number)
: number => {
  return usage * costPerUnit;
};

// Helper for specific activities
export const calculateActivityImpact = (
type: keyof typeof CARBON_CONSTANTS.ENERGY,
usage: number) =>
{
  const energy = CARBON_CONSTANTS.ENERGY[type];
  const carbon = calculateCarbonImpact(usage, energy);

  let cost = 0;
  if (type === 'EMAIL')
  cost = calculateCostImpact(usage, CARBON_CONSTANTS.COSTS.EMAIL);else
  if (type === 'CLOUD_STORAGE')
  cost = calculateCostImpact(usage, CARBON_CONSTANTS.COSTS.CLOUD_STORAGE);else
  if (type === 'AI_TOKENS')
  cost = calculateCostImpact(usage, CARBON_CONSTANTS.COSTS.AI_TOKENS);else
  if (type === 'WEB_SEARCH')
  cost = calculateCostImpact(usage, CARBON_CONSTANTS.COSTS.WEB_SEARCH);else
  cost = carbon * 10; // Fallback estimate: 10₹ per kg CO2

  return { carbon, cost };
};