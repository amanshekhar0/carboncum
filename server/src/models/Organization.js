const mongoose = require('mongoose');

/**
 * OrganizationSchema
 * Represents a company using CarbonTwin for corporate ESG tracking.
 */
const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    totalEmployees: {
      type: Number,
      default: 1,
      min: 1
    },
    // Aggregated carbon footprint across all employees (kg)
    totalCarbonFootprint: {
      type: Number,
      default: 0
    },
    // ESG compliance score 0-100
    esgComplianceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Slack webhook for eco-notifications
    slackWebhookUrl: {
      type: String,
      default: ''
    },
    // Teams webhook
    teamsWebhookUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Organization', OrganizationSchema);
