const Project = require('../models/Project');
const Contractor = require('../models/Contractor');
const ActivityLog = require('../models/ActivityLog');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    // Fetch all projects for this user
    const projects = await Project.find({ owner: ownerId, isDeleted: false });

    const totalProjects = projects.length;
    let totalBudget = 0;
    let totalSpent = 0;

    projects.forEach((proj) => {
      totalBudget += proj.totalBudget || 0;
      totalSpent += proj.amountSpent || 0;
    });

    // Count actual active contractors from DB
    const projectIds = projects.map((p) => p._id);
    const activeContractors = await Contractor.countDocuments({
      project: { $in: projectIds },
      status: 'active',
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalBudget,
        totalSpent,
        activeContractors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Budget Overview Chart Data ───────────────────────────────────────────────
exports.getBudgetOverview = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    const projects = await Project.find({ owner: ownerId, isDeleted: false });

    // Format data for Recharts BarChart in frontend
    const chartData = projects.map((proj) => ({
      name: proj.name,
      Budget: proj.totalBudget,
      Spent: proj.amountSpent,
    }));

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Recent Activity Log (Last 10 entries) ───────────────────────────────────
exports.getRecentActivity = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    const logs = await ActivityLog.find({ userId: ownerId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Deleted items log ───────────────────────────────────────────────────────
exports.getDeletedItems = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    const logs = await ActivityLog.find({ userId: ownerId, action: 'deleted' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

