const Contractor = require('../models/Contractor');
const Project = require('../models/Project');
const { logActivity } = require('../utils/activityLog');

// ─── Helper to Verify Project Ownership ──────────────────────────────────────
const verifyProjectOwnership = async (projectId, userId) => {
  return Project.findOne({ _id: projectId, owner: userId, isDeleted: false });
};

// ─── Create Contractor ────────────────────────────────────────────────────────
exports.createContractor = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      alternatePhone,
      workType,
      customWorkType,
      project: projectId,
      contractAmount,
      status,
      startDate,
      expectedEndDate,
      notes,
    } = req.body;

    const project = await verifyProjectOwnership(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
    }

    const contractor = new Contractor({
      name,
      phone,
      alternatePhone,
      workType,
      customWorkType,
      project: projectId,
      contractAmount,
      status: status || 'active',
      startDate,
      expectedEndDate,
      notes,
      createdBy: req.user._id,
    });

    await contractor.save();

    await logActivity(
      req.user._id,
      'created',
      'contractor',
      contractor._id,
      `Hired contractor "${name}" (${workType === 'custom' ? customWorkType : workType}) for project "${project.name}" with contract amount ₹${Number(contractAmount).toLocaleString('en-IN')}.`,
      null,
      contractor.toObject()
    );

    res.status(201).json({
      success: true,
      message: 'Contractor added successfully.',
      data: { contractor },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Contractors ─────────────────────────────────────────────────────────
exports.getContractors = async (req, res, next) => {
  try {
    const { projectId, workType, status } = req.query;

    let projectIds = [];

    if (projectId) {
      const project = await verifyProjectOwnership(projectId, req.user._id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
      }
      projectIds = [projectId];
    } else {
      const projects = await Project.find({ owner: req.user._id, isDeleted: false });
      projectIds = projects.map((p) => p._id);
    }

    const filter = { project: { $in: projectIds }, isDeleted: false };

    if (workType) filter.workType = workType;
    if (status) filter.status = status;

    const contractors = await Contractor.find(filter)
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contractors.length,
      data: { contractors },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Contractor ────────────────────────────────────────────────────
exports.getContractorById = async (req, res, next) => {
  try {
    const contractor = await Contractor.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('project', 'name owner');

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found.' });
    }

    if (contractor.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: { contractor } });
  } catch (error) {
    next(error);
  }
};

// ─── Update Contractor ────────────────────────────────────────────────────────
exports.updateContractor = async (req, res, next) => {
  try {
    const contractor = await Contractor.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found.' });
    }

    const project = await verifyProjectOwnership(contractor.project, req.user._id);
    if (!project) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const oldValue = contractor.toObject();

    const {
      name,
      phone,
      alternatePhone,
      workType,
      customWorkType,
      contractAmount,
      status,
      startDate,
      expectedEndDate,
      notes,
    } = req.body;

    if (name !== undefined) contractor.name = name;
    if (phone !== undefined) contractor.phone = phone;
    if (alternatePhone !== undefined) contractor.alternatePhone = alternatePhone;
    if (workType !== undefined) contractor.workType = workType;
    if (customWorkType !== undefined) contractor.customWorkType = customWorkType;
    if (contractAmount !== undefined) contractor.contractAmount = contractAmount;
    if (status !== undefined) contractor.status = status;
    if (startDate !== undefined) contractor.startDate = startDate;
    if (expectedEndDate !== undefined) contractor.expectedEndDate = expectedEndDate;
    if (notes !== undefined) contractor.notes = notes;

    await contractor.save();

    const newValue = contractor.toObject();

    await logActivity(
      req.user._id,
      'updated',
      'contractor',
      contractor._id,
      `Updated contractor "${contractor.name}" details for project "${project.name}".`,
      oldValue,
      newValue
    );

    res.status(200).json({
      success: true,
      message: 'Contractor updated successfully.',
      data: { contractor: newValue },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Contractor (Soft Delete) ─────────────────────────────────────────
exports.deleteContractor = async (req, res, next) => {
  try {
    const contractor = await Contractor.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found.' });
    }

    const project = await verifyProjectOwnership(contractor.project, req.user._id);
    if (!project) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Subtract paid amount from project spent
    if (contractor.amountPaid > 0) {
      project.amountSpent = Math.max(0, (project.amountSpent || 0) - contractor.amountPaid);
      await project.save();
    }

    contractor.isDeleted = true;
    await contractor.save();

    await logActivity(
      req.user._id,
      'deleted',
      'contractor',
      contractor._id,
      `Removed contractor "${contractor.name}" from project "${project.name}". (Total paid: ₹${contractor.amountPaid.toLocaleString('en-IN')})`,
      contractor.toObject(),
      null
    );

    res.status(200).json({ success: true, message: 'Contractor removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Record Payment ───────────────────────────────────────────────────────────
exports.recordPayment = async (req, res, next) => {
  try {
    const contractor = await Contractor.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found.' });
    }

    const project = await verifyProjectOwnership(contractor.project, req.user._id);
    if (!project) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { amount, paymentDate, paymentMode, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    const payment = {
      amount: Number(amount),
      paymentDate: paymentDate || new Date(),
      paymentMode: paymentMode || 'cash',
      note: note || '',
      recordedBy: req.user._id,
    };

    contractor.payments.push(payment);

    // Recalculate amountPaid from all payments
    contractor.amountPaid = contractor.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    await contractor.save();

    // Increment project's amountSpent by this payment
    project.amountSpent = (project.amountSpent || 0) + Number(amount);
    await project.save();

    await logActivity(
      req.user._id,
      'created',
      'payment',
      contractor._id,
      `Recorded payment of ₹${Number(amount).toLocaleString('en-IN')} to contractor "${contractor.name}" for project "${project.name}" via ${paymentMode || 'cash'}.`,
      null,
      payment
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: { contractor },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Payment ───────────────────────────────────────────────────────────
exports.deletePayment = async (req, res, next) => {
  try {
    const contractor = await Contractor.findOne({
      _id: req.params.contractorId,
      isDeleted: false,
    });

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found.' });
    }

    const project = await verifyProjectOwnership(contractor.project, req.user._id);
    if (!project) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const paymentIndex = contractor.payments.findIndex(
      (p) => p._id.toString() === req.params.paymentId
    );

    if (paymentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const removedAmount = contractor.payments[paymentIndex].amount || 0;

    contractor.payments.splice(paymentIndex, 1);

    // Recalculate amountPaid
    contractor.amountPaid = contractor.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    await contractor.save();

    // Subtract from project spent
    project.amountSpent = Math.max(0, (project.amountSpent || 0) - removedAmount);
    await project.save();

    await logActivity(
      req.user._id,
      'deleted',
      'payment',
      contractor._id,
      `Removed payment of ₹${removedAmount.toLocaleString('en-IN')} from contractor "${contractor.name}" for project "${project.name}".`,
      { amount: removedAmount },
      null
    );

    res.status(200).json({ success: true, message: 'Payment removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Get Contractor Summary for Project ───────────────────────────────────────
exports.getContractorSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await verifyProjectOwnership(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
    }

    const contractors = await Contractor.find({ project: projectId, isDeleted: false });

    const totalContractValue = contractors.reduce((sum, c) => sum + (c.contractAmount || 0), 0);
    const totalAmountPaid = contractors.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
    const totalBalance = totalContractValue - totalAmountPaid;

    const activeCount = contractors.filter((c) => c.status === 'active').length;
    const completedCount = contractors.filter((c) => c.status === 'completed').length;
    const terminatedCount = contractors.filter((c) => c.status === 'terminated').length;

    res.status(200).json({
      success: true,
      data: {
        totalContractors: contractors.length,
        totalContractValue,
        totalAmountPaid,
        totalBalance,
        activeCount,
        completedCount,
        terminatedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
