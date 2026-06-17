const mongoose = require('mongoose');
const MaterialPurchase = require('../models/MaterialPurchase');
const Project = require('../models/Project');
const { logActivity } = require('../utils/activityLog');

// ─── Helper to Verify Project Ownership ──────────────────────────────────────
const verifyProjectOwnership = async (projectId, userId) => {
  const project = await Project.findOne({
    _id: projectId,
    owner: userId,
    isDeleted: false,
  });
  return project;
};

// ─── Create Purchase ─────────────────────────────────────────────────────────
exports.createPurchase = async (req, res, next) => {
  try {
    const {
      project: projectId,
      materialType,
      customMaterialName,
      quantity,
      unit,
      customUnit,
      rate,
      purchaseDate,
      vendorName,
      notes,
      receiptUrl,
    } = req.body;

    // Verify project belongs to user
    const project = await verifyProjectOwnership(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found or access denied.',
      });
    }

    const purchase = new MaterialPurchase({
      project: projectId,
      materialType,
      customMaterialName,
      quantity,
      unit,
      customUnit,
      rate,
      purchaseDate,
      vendorName,
      notes,
      receiptUrl,
      createdBy: req.user._id,
    });

    // Save purchase (will auto-calculate totalAmount in pre-save)
    await purchase.save();

    // Increment Project Spent
    project.amountSpent = (project.amountSpent || 0) + purchase.totalAmount;
    await project.save();

    // Log Activity
    const displayName = materialType === 'custom' ? customMaterialName : materialType;
    await logActivity(
      req.user._id,
      'created',
      'material',
      purchase._id,
      `Purchased ${quantity} ${unit === 'custom' ? customUnit : unit} of "${displayName}" for project "${project.name}" costing ₹${purchase.totalAmount.toLocaleString('en-IN')}.`,
      null,
      purchase.toObject()
    );

    res.status(201).json({
      success: true,
      message: 'Material purchase logged successfully.',
      data: { purchase },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Purchases ──────────────────────────────────────────────────────────
exports.getPurchases = async (req, res, next) => {
  try {
    const { projectId, materialType, startDate, endDate } = req.query;

    let projectIds = [];

    if (projectId) {
      const project = await verifyProjectOwnership(projectId, req.user._id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied.',
        });
      }
      projectIds = [projectId];
    } else {
      // Find all projects owned by the user
      const projects = await Project.find({ owner: req.user._id, isDeleted: false });
      projectIds = projects.map((p) => p._id);
    }

    const filter = {
      project: { $in: projectIds },
      isDeleted: false,
    };

    if (materialType) {
      filter.materialType = materialType;
    }

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    const purchases = await MaterialPurchase.find(filter)
      .populate('project', 'name')
      .sort({ purchaseDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: { purchases },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Purchase ────────────────────────────────────────────────────
exports.getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await MaterialPurchase.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('project', 'name owner');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Material purchase record not found.',
      });
    }

    // Verify project owner matches
    if (purchase.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    res.status(200).json({
      success: true,
      data: { purchase },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Purchase ─────────────────────────────────────────────────────────
exports.updatePurchase = async (req, res, next) => {
  try {
    const purchase = await MaterialPurchase.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Material purchase record not found.',
      });
    }

    // Verify project belongs to user
    const project = await verifyProjectOwnership(purchase.project, req.user._id);
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to associated project.',
      });
    }

    const oldValue = purchase.toObject();
    const oldTotal = purchase.totalAmount || 0;

    const {
      materialType,
      customMaterialName,
      quantity,
      unit,
      customUnit,
      rate,
      purchaseDate,
      vendorName,
      notes,
      receiptUrl,
    } = req.body;

    if (materialType !== undefined) purchase.materialType = materialType;
    if (customMaterialName !== undefined) purchase.customMaterialName = customMaterialName;
    if (quantity !== undefined) purchase.quantity = quantity;
    if (unit !== undefined) purchase.unit = unit;
    if (customUnit !== undefined) purchase.customUnit = customUnit;
    if (rate !== undefined) purchase.rate = rate;
    if (purchaseDate !== undefined) purchase.purchaseDate = purchaseDate;
    if (vendorName !== undefined) purchase.vendorName = vendorName;
    if (notes !== undefined) purchase.notes = notes;
    if (receiptUrl !== undefined) purchase.receiptUrl = receiptUrl;

    // Save purchase (recalculates totalAmount)
    await purchase.save();

    const newTotal = purchase.totalAmount;

    // Adjust project Spent
    if (oldTotal !== newTotal) {
      project.amountSpent = (project.amountSpent || 0) - oldTotal + newTotal;
      await project.save();
    }

    const newValue = purchase.toObject();

    // Log Activity
    const displayName = purchase.materialType === 'custom' ? purchase.customMaterialName : purchase.materialType;
    await logActivity(
      req.user._id,
      'updated',
      'material',
      purchase._id,
      `Updated material purchase details of "${displayName}" for project "${project.name}".`,
      oldValue,
      newValue
    );

    res.status(200).json({
      success: true,
      message: 'Material purchase details updated successfully.',
      data: { purchase: newValue },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Purchase (Soft Delete) ──────────────────────────────────────────
exports.deletePurchase = async (req, res, next) => {
  try {
    const purchase = await MaterialPurchase.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Material purchase record not found.',
      });
    }

    // Verify project belongs to user
    const project = await verifyProjectOwnership(purchase.project, req.user._id);
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to associated project.',
      });
    }

    // Soft Delete
    purchase.isDeleted = true;
    await purchase.save();

    // Subtract from project spent
    project.amountSpent = Math.max(0, (project.amountSpent || 0) - (purchase.totalAmount || 0));
    await project.save();

    // Log Activity
    const displayName = purchase.materialType === 'custom' ? purchase.customMaterialName : purchase.materialType;
    await logActivity(
      req.user._id,
      'deleted',
      'material',
      purchase._id,
      `Deleted material purchase of "${displayName}" (Total: ₹${purchase.totalAmount.toLocaleString('en-IN')}) from project "${project.name}".`,
      purchase.toObject(),
      null
    );

    res.status(200).json({
      success: true,
      message: 'Material purchase record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Summary Analytics for Project ────────────────────────────────────────
exports.getSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const project = await verifyProjectOwnership(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied.',
      });
    }

    const objProjId = new mongoose.Types.ObjectId(projectId);

    // Aggregate total amount & count grouped by type
    const breakdown = await MaterialPurchase.aggregate([
      {
        $match: {
          project: objProjId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$materialType',
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: '$_id',
          totalAmount: 1,
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Calculate sum of spent
    let totalSpent = 0;
    let totalEntries = 0;
    breakdown.forEach((item) => {
      totalSpent += item.totalAmount;
      totalEntries += item.count;
    });

    const mostExpensiveType = breakdown.length > 0 ? breakdown[0].type : 'N/A';

    res.status(200).json({
      success: true,
      data: {
        totalSpent,
        totalEntries,
        mostExpensiveType,
        breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
