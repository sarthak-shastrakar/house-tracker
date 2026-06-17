const Project = require('../models/Project');
const { logActivity } = require('../utils/activityLog');

// ─── Create Project ─────────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      location,
      landArea,
      constructionArea,
      totalBudget,
      status,
      startDate,
      expectedEndDate,
      budgetWarningThreshold,
    } = req.body;

    const project = new Project({
      name,
      description,
      location,
      landArea,
      constructionArea,
      totalBudget,
      status,
      startDate,
      expectedEndDate,
      budgetWarningThreshold,
      owner: req.user._id,
    });

    await project.save();

    // Log the creation audit log
    await logActivity(
      req.user._id,
      'created',
      'project',
      project._id,
      `Project "${name}" was created at ${location} with budget of ₹${totalBudget.toLocaleString('en-IN')}.`,
      null,
      project.toObject()
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Projects ──────────────────────────────────────────────────────────
exports.getProjects = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {
      owner: req.user._id,
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Query projects sorted by newest first
    const projectsList = await Project.find(filter).sort({ createdAt: -1 });

    // Format output with computed percentageUsed
    const projects = projectsList.map((p) => {
      const pObj = p.toObject();
      const budget = pObj.totalBudget || 0;
      const spent = pObj.amountSpent || 0;
      pObj.percentageUsed = budget > 0 ? parseFloat(((spent / budget) * 100).toFixed(2)) : 0;
      return pObj;
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Project ──────────────────────────────────────────────────────
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const pObj = project.toObject();
    const budget = pObj.totalBudget || 0;
    const spent = pObj.amountSpent || 0;
    pObj.percentageUsed = budget > 0 ? parseFloat(((spent / budget) * 100).toFixed(2)) : 0;

    // Placeholder details for sub-modules before integration
    pObj.materialCount = 0;
    pObj.contractorCount = 0;
    pObj.billCount = 0;

    res.status(200).json({
      success: true,
      data: { project: pObj },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Project ──────────────────────────────────────────────────────────
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const oldValue = project.toObject();
    const {
      name,
      description,
      location,
      landArea,
      constructionArea,
      totalBudget,
      status,
      startDate,
      expectedEndDate,
      budgetWarningThreshold,
      budgetNote,
    } = req.body;

    // Manage budget modification history
    if (totalBudget !== undefined && totalBudget !== project.totalBudget) {
      project.budgetHistory.push({
        amount: totalBudget,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: budgetNote || `Budget modified from ₹${project.totalBudget.toLocaleString('en-IN')} to ₹${totalBudget.toLocaleString('en-IN')}`,
      });
      project.totalBudget = totalBudget;
    }

    // Apply other updates
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (location !== undefined) project.location = location;
    if (landArea !== undefined) project.landArea = landArea;
    if (constructionArea !== undefined) project.constructionArea = constructionArea;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (expectedEndDate !== undefined) project.expectedEndDate = expectedEndDate;
    if (budgetWarningThreshold !== undefined) project.budgetWarningThreshold = budgetWarningThreshold;

    await project.save();

    const newValue = project.toObject();

    // Log the edit audit log
    await logActivity(
      req.user._id,
      'updated',
      'project',
      project._id,
      `Project "${project.name}" details were updated by owner.`,
      oldValue,
      newValue
    );

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: { project: newValue },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Soft Delete Project ────────────────────────────────────────────────────
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    project.isDeleted = true;
    await project.save();

    // Log deletion activity
    await logActivity(
      req.user._id,
      'deleted',
      'project',
      project._id,
      `Project "${project.name}" was soft-deleted by owner.`,
      project.toObject(),
      null
    );

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Project Stats ──────────────────────────────────────────────────────
exports.getProjectStats = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const totalBudget = project.totalBudget || 0;
    const amountSpent = project.amountSpent || 0;
    const remaining = Math.max(0, totalBudget - amountSpent);
    const percentageUsed = totalBudget > 0 ? parseFloat(((amountSpent / totalBudget) * 100).toFixed(2)) : 0;

    // Determine warning levels
    let budgetStatus = 'safe';
    if (percentageUsed >= 100) {
      budgetStatus = 'danger';
    } else if (percentageUsed >= project.budgetWarningThreshold) {
      budgetStatus = 'warning';
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBudget,
          amountSpent,
          remaining,
          percentageUsed,
          materialCount: 0,
          contractorCount: 0,
          billCount: 0,
          budgetStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
