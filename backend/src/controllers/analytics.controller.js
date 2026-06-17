const mongoose = require('mongoose');
const Project = require('../models/Project');
const MaterialPurchase = require('../models/MaterialPurchase');
const Contractor = require('../models/Contractor');
const Bill = require('../models/Bill');

// ─── Helper: Get user's project IDs ──────────────────────────────────────────
const getUserProjectIds = async (userId) => {
  const projects = await Project.find({ owner: userId, isDeleted: false });
  return projects.map((p) => p._id);
};

// ─── Overview Stats ───────────────────────────────────────────────────────────
// GET /api/analytics/overview
exports.getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectIds = await getUserProjectIds(userId);

    const [projectStats, materialStats, contractorStats, billCount] = await Promise.all([
      // Project aggregates
      Project.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId), isDeleted: false } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            totalBudget: { $sum: '$totalBudget' },
            totalSpent: { $sum: '$amountSpent' },
            projectsAtRisk: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      '$amountSpent',
                      { $multiply: ['$totalBudget', { $divide: ['$budgetWarningThreshold', 100] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Material total spent
      MaterialPurchase.aggregate([
        { $match: { project: { $in: projectIds }, isDeleted: false } },
        { $group: { _id: null, totalMaterialSpent: { $sum: '$totalAmount' } } },
      ]),

      // Contractor total paid
      Contractor.aggregate([
        { $match: { project: { $in: projectIds }, isDeleted: false } },
        { $group: { _id: null, totalContractorPaid: { $sum: '$amountPaid' } } },
      ]),

      // Bill count
      Bill.countDocuments({ project: { $in: projectIds }, isDeleted: false }),
    ]);

    const ps = projectStats[0] || { totalProjects: 0, totalBudget: 0, totalSpent: 0, projectsAtRisk: 0 };
    const ms = materialStats[0] || { totalMaterialSpent: 0 };
    const cs = contractorStats[0] || { totalContractorPaid: 0 };

    const budgetUtilization = ps.totalBudget > 0
      ? parseFloat(((ps.totalSpent / ps.totalBudget) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalProjects: ps.totalProjects,
        totalBudget: ps.totalBudget,
        totalSpent: ps.totalSpent,
        totalMaterialSpent: ms.totalMaterialSpent,
        totalContractorPaid: cs.totalContractorPaid,
        totalBills: billCount,
        budgetUtilization,
        projectsAtRisk: ps.projectsAtRisk,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Budget Overview Per Project ──────────────────────────────────────────────
// GET /api/analytics/budget-overview
exports.getBudgetOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ owner: userId, isDeleted: false }).sort({ totalBudget: -1 });

    const data = projects.map((p) => {
      const percentageUsed = p.totalBudget > 0
        ? parseFloat(((p.amountSpent / p.totalBudget) * 100).toFixed(1))
        : 0;
      const remaining = Math.max(0, p.totalBudget - p.amountSpent);
      let status = 'safe';
      if (percentageUsed >= 100) status = 'danger';
      else if (percentageUsed >= p.budgetWarningThreshold) status = 'warning';

      return {
        projectName: p.name,
        projectId: p._id,
        totalBudget: p.totalBudget,
        amountSpent: p.amountSpent,
        remaining,
        percentageUsed,
        status,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ─── Material Breakdown ───────────────────────────────────────────────────────
// GET /api/analytics/material-breakdown
exports.getMaterialBreakdown = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectIds = await getUserProjectIds(userId);
    const matchStage = { $match: { project: { $in: projectIds }, isDeleted: false } };

    const [byType, topVendors, monthlyTrend] = await Promise.all([
      // By material type
      MaterialPurchase.aggregate([
        matchStage,
        {
          $group: {
            _id: '$materialType',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // Top vendors
      MaterialPurchase.aggregate([
        matchStage,
        { $match: { vendorName: { $ne: '' } } },
        {
          $group: {
            _id: '$vendorName',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
      ]),

      // Monthly trend (last 12 months)
      MaterialPurchase.aggregate([
        matchStage,
        {
          $group: {
            _id: {
              year: { $year: '$purchaseDate' },
              month: { $month: '$purchaseDate' },
            },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    // Compute percentages for byType
    const grandTotal = byType.reduce((s, t) => s + t.totalAmount, 0);
    const byTypeFormatted = byType.map((t) => ({
      type: t._id,
      totalAmount: t.totalAmount,
      count: t.count,
      percentage: grandTotal > 0 ? parseFloat(((t.totalAmount / grandTotal) * 100).toFixed(1)) : 0,
    }));

    const topVendorsFormatted = topVendors.map((v) => ({
      vendorName: v._id,
      totalAmount: v.totalAmount,
      count: v.count,
    }));

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendFormatted = monthlyTrend.map((m) => ({
      month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
      totalAmount: m.totalAmount,
    }));

    res.status(200).json({
      success: true,
      data: {
        byType: byTypeFormatted,
        topVendors: topVendorsFormatted,
        monthlyTrend: monthlyTrendFormatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Contractor Summary ───────────────────────────────────────────────────────
// GET /api/analytics/contractor-summary
exports.getContractorSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectIds = await getUserProjectIds(userId);
    const matchStage = { $match: { project: { $in: projectIds }, isDeleted: false } };

    const [byWorkType, topContractors, paymentTrend] = await Promise.all([
      // By work type
      Contractor.aggregate([
        matchStage,
        {
          $group: {
            _id: '$workType',
            totalPaid: { $sum: '$amountPaid' },
            totalContract: { $sum: '$contractAmount' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            workType: '$_id',
            totalPaid: 1,
            totalContract: 1,
            totalPending: { $subtract: ['$totalContract', '$totalPaid'] },
            count: 1,
          },
        },
        { $sort: { totalPaid: -1 } },
      ]),

      // Top 5 contractors by contract amount
      Contractor.aggregate([
        matchStage,
        {
          $project: {
            name: 1,
            workType: 1,
            contractAmount: 1,
            amountPaid: 1,
            pending: { $subtract: ['$contractAmount', '$amountPaid'] },
          },
        },
        { $sort: { contractAmount: -1 } },
        { $limit: 5 },
      ]),

      // Payment trend by month (from embedded payments array)
      Contractor.aggregate([
        matchStage,
        { $unwind: '$payments' },
        {
          $group: {
            _id: {
              year: { $year: '$payments.paymentDate' },
              month: { $month: '$payments.paymentDate' },
            },
            totalPaid: { $sum: '$payments.amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const paymentTrendFormatted = paymentTrend.map((m) => ({
      month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
      totalPaid: m.totalPaid,
    }));

    res.status(200).json({
      success: true,
      data: {
        byWorkType,
        topContractors,
        paymentTrend: paymentTrendFormatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Monthly Spending Trend ────────────────────────────────────────────────────
// GET /api/analytics/monthly-spending?year=2025
exports.getMonthlySpending = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const projectIds = await getUserProjectIds(userId);

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const [materialMonthly, contractorMonthly] = await Promise.all([
      MaterialPurchase.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            isDeleted: false,
            purchaseDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $month: '$purchaseDate' },
            materialSpent: { $sum: '$totalAmount' },
          },
        },
      ]),

      // Contractor payments (from embedded array)
      Contractor.aggregate([
        { $match: { project: { $in: projectIds }, isDeleted: false } },
        { $unwind: '$payments' },
        {
          $match: {
            'payments.paymentDate': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $month: '$payments.paymentDate' },
            contractorPaid: { $sum: '$payments.amount' },
          },
        },
      ]),
    ]);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build full 12-month array
    const monthlyMap = {};
    MONTHS.forEach((m, i) => {
      monthlyMap[i + 1] = { month: m, materialSpent: 0, contractorPaid: 0, totalSpent: 0 };
    });

    materialMonthly.forEach((m) => {
      if (monthlyMap[m._id]) monthlyMap[m._id].materialSpent = m.materialSpent;
    });

    contractorMonthly.forEach((m) => {
      if (monthlyMap[m._id]) monthlyMap[m._id].contractorPaid = m.contractorPaid;
    });

    const result = Object.values(monthlyMap).map((m) => ({
      ...m,
      totalSpent: m.materialSpent + m.contractorPaid,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── Budget Alerts ────────────────────────────────────────────────────────────
// GET /api/analytics/budget-alerts
exports.getBudgetAlerts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ owner: userId, isDeleted: false });

    const alerts = projects
      .map((p) => {
        const percentageUsed = p.totalBudget > 0
          ? parseFloat(((p.amountSpent / p.totalBudget) * 100).toFixed(1))
          : 0;
        const threshold = p.budgetWarningThreshold || 80;

        if (percentageUsed >= threshold) {
          return {
            projectId: p._id,
            projectName: p.name,
            totalBudget: p.totalBudget,
            amountSpent: p.amountSpent,
            percentageUsed,
            threshold,
            alertLevel: percentageUsed >= 100 ? 'danger' : 'warning',
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.percentageUsed - a.percentageUsed);

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    next(error);
  }
};
