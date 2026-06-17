const Bill = require('../models/Bill');
const Project = require('../models/Project');
const { logActivity } = require('../utils/activityLog');

// ─── Helper: Verify Project Ownership ────────────────────────────────────────
const verifyProjectOwnership = async (projectId, userId) => {
  return Project.findOne({ _id: projectId, owner: userId, isDeleted: false });
};

// ─── Upload Bill ──────────────────────────────────────────────────────────────
// POST /api/bills/upload   (multer middleware runs before this)
exports.uploadBill = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { project: projectId, title, billType, amount, billDate, vendorName, notes } = req.body;

    if (!projectId || !title || !billType || !billDate) {
      return res.status(400).json({
        success: false,
        message: 'project, title, billType, and billDate are required.',
      });
    }

    const project = await verifyProjectOwnership(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
    }

    // Determine file type
    const isPdf = req.file.mimetype === 'application/pdf';
    const fileType = isPdf ? 'pdf' : 'image';

    const bill = new Bill({
      project: projectId,
      title: title.trim(),
      billType,
      fileUrl: req.file.path,               // Cloudinary secure URL
      filePublicId: req.file.filename || req.file.public_id || '',
      fileType,
      originalFileName: req.file.originalname || '',
      fileSize: req.file.size || 0,
      amount: amount ? Number(amount) : null,
      billDate: new Date(billDate),
      vendorName: vendorName ? vendorName.trim() : '',
      notes: notes ? notes.trim() : '',
      uploadedBy: req.user._id,
    });

    await bill.save();

    await logActivity(
      req.user._id,
      'uploaded',
      'bill',
      bill._id,
      `Uploaded bill "${title}" (${billType.replace('_', ' ')}) for project "${project.name}".`,
      null,
      bill.toObject()
    );

    res.status(201).json({
      success: true,
      message: 'Bill uploaded successfully.',
      data: { bill },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List Bills ───────────────────────────────────────────────────────────────
// GET /api/bills
exports.getBills = async (req, res, next) => {
  try {
    const { projectId, billType, startDate, endDate } = req.query;

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

    if (billType) filter.billType = billType;
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    const bills = await Bill.find(filter)
      .populate('project', 'name')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ billDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: { bills },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Bill ──────────────────────────────────────────────────────────
// GET /api/bills/:id
exports.getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, isDeleted: false })
      .populate('project', 'name owner')
      .populate('uploadedBy', 'firstName lastName');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    if (bill.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: { bill } });
  } catch (error) {
    next(error);
  }
};

// ─── Update Bill Metadata ─────────────────────────────────────────────────────
// PUT /api/bills/:id
exports.updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, isDeleted: false });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    const project = await verifyProjectOwnership(bill.project, req.user._id);
    if (!project) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const oldValue = bill.toObject();

    const { title, billType, amount, billDate, vendorName, notes } = req.body;

    if (title !== undefined) bill.title = title.trim();
    if (billType !== undefined) bill.billType = billType;
    if (amount !== undefined) bill.amount = amount === '' ? null : Number(amount);
    if (billDate !== undefined) bill.billDate = new Date(billDate);
    if (vendorName !== undefined) bill.vendorName = vendorName.trim();
    if (notes !== undefined) bill.notes = notes.trim();

    await bill.save();

    const newValue = bill.toObject();

    await logActivity(
      req.user._id,
      'updated',
      'bill',
      bill._id,
      `Updated bill metadata for "${bill.title}" in project "${project.name}".`,
      oldValue,
      newValue
    );

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully.',
      data: { bill: newValue },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Soft Delete Bill ─────────────────────────────────────────────────────────
// DELETE /api/bills/:id
exports.deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, isDeleted: false });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    const project = await verifyProjectOwnership(bill.project, req.user._id);
    if (!project) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Soft delete only — do NOT delete from Cloudinary
    bill.isDeleted = true;
    await bill.save();

    await logActivity(
      req.user._id,
      'deleted',
      'bill',
      bill._id,
      `Removed bill "${bill.title}" from project "${project.name}". (File kept in cloud storage.)`,
      bill.toObject(),
      null
    );

    res.status(200).json({ success: true, message: 'Bill removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Bill Summary for Project ─────────────────────────────────────────────────
// GET /api/bills/summary/:projectId
exports.getBillSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await verifyProjectOwnership(projectId, req.user._id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
    }

    const bills = await Bill.find({ project: projectId, isDeleted: false }).sort({ billDate: -1 });

    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalFileSize = bills.reduce((sum, b) => sum + (b.fileSize || 0), 0);

    // Breakdown by type
    const breakdown = {};
    bills.forEach((b) => {
      if (!breakdown[b.billType]) {
        breakdown[b.billType] = { count: 0, amount: 0 };
      }
      breakdown[b.billType].count++;
      breakdown[b.billType].amount += b.amount || 0;
    });

    // This month count
    const now = new Date();
    const thisMonthBills = bills.filter((b) => {
      const d = new Date(b.billDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const recentBills = bills.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalBills,
        totalAmount,
        totalFileSize,
        thisMonthBills,
        breakdown,
        recentBills,
      },
    });
  } catch (error) {
    next(error);
  }
};
