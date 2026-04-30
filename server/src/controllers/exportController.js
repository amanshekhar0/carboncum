/**
 * exportController.js
 *
 * GET /api/export/esg
 *
 * Aggregates Scope 2 (digital) and Scope 3 (lifestyle) emissions for the
 * authenticated user (or the entire org if requested) and returns a CSV or JSON
 * report. Built from real ActivityLog data only – no demo rows.
 */

const mongoose = require('mongoose');

const ActivityLog = require('../models/ActivityLog');

const exportESG = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is currently unavailable.' });
    }

    const format = (req.query.format || 'csv').toLowerCase();
    const scopeOrgWide = req.query.scope === 'org';

    const match = scopeOrgWide ? {} : { userId: new mongoose.Types.ObjectId(req.userId) };

    const aggregation = await ActivityLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { userId: '$userId', category: '$category' },
          totalCarbon: { $sum: '$carbonImpact' },
          totalCost: { $sum: '$costImpact' },
          activityCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ]);

    const totalScope2 = aggregation
      .filter((r) => r._id.category === 'Browser' || r._id.category === 'Hardware')
      .reduce((acc, r) => acc + r.totalCarbon, 0);

    const totalScope3 = aggregation
      .filter((r) => r._id.category === 'Lifestyle')
      .reduce((acc, r) => acc + r.totalCarbon, 0);

    if (format === 'json') {
      return res.json({
        reportDate: new Date().toISOString(),
        scope: scopeOrgWide ? 'organization' : 'user',
        scope2_digital_kg: round(totalScope2),
        scope3_lifestyle_kg: round(totalScope3),
        total_kg: round(totalScope2 + totalScope3),
        breakdown: aggregation.map((r) => ({
          user: r.user?.name || 'Unknown',
          category: r._id.category,
          carbonKg: round(r.totalCarbon, 3),
          costInr: round(r.totalCost),
          activityCount: r.activityCount
        }))
      });
    }

    const rows = [
      ['CARBON TWIN – DIGITAL SUSTAINABILITY ESG REPORT'],
      [`Report ID: CT-ESG-${Date.now()}`],
      [`Generated At: ${new Date().toISOString()}`],
      [`Scope: ${scopeOrgWide ? 'Organization' : 'Individual user'}`],
      [],
      ['Section,Metric,Value'],
      [`Summary,Scope 2 net (kg CO2),${round(totalScope2, 3)}`],
      [`Summary,Scope 3 net (kg CO2),${round(totalScope3, 3)}`],
      [`Summary,Total net (kg CO2),${round(totalScope2 + totalScope3, 3)}`],
      [],
      ['User,Category,Carbon Net (kg),Cost Net (INR),Activity Count']
    ];

    aggregation.forEach((r) => {
      rows.push([
        csvEscape(r.user?.name || 'Unknown'),
        csvEscape(r._id.category || 'Other'),
        round(r.totalCarbon, 3),
        round(r.totalCost, 2),
        r.activityCount
      ]);
    });

    const csvContent = rows.map((row) => (Array.isArray(row) ? row.join(',') : row)).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="CarbonTwin_ESG_Report_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csvContent);
  } catch (err) {
    console.error('[exportController] exportESG error:', err.message);
    res.status(500).json({ error: 'Failed to generate ESG export' });
  }
};

const round = (n, d = 2) => Number((n || 0).toFixed(d));
const csvEscape = (str) => {
  if (str == null) return '';
  const s = String(str);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

module.exports = { exportESG };
