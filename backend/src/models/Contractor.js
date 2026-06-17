const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment must be at least ₹1'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'other'],
      default: 'cash',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const contractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contractor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    workType: {
      type: String,
      enum: ['civil', 'electrical', 'plumbing', 'carpentry', 'painting', 'tiling', 'labour', 'custom'],
      required: [true, 'Work type is required'],
    },
    customWorkType: {
      type: String,
      trim: true,
      required: function () {
        return this.workType === 'custom';
      },
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    contractAmount: {
      type: Number,
      required: [true, 'Contract amount is required'],
      min: [0, 'Contract amount cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'terminated'],
      default: 'active',
    },
    startDate: {
      type: Date,
    },
    expectedEndDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    payments: [paymentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: balance due
contractorSchema.virtual('balanceDue').get(function () {
  return Math.max(0, this.contractAmount - this.amountPaid);
});

contractorSchema.set('toJSON', { virtuals: true });
contractorSchema.set('toObject', { virtuals: true });

const Contractor = mongoose.model('Contractor', contractorSchema);

module.exports = Contractor;
