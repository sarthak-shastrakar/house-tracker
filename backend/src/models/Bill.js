const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Bill title is required'],
      trim: true,
    },
    billType: {
      type: String,
      enum: [
        'material_invoice',
        'contractor_bill',
        'labour_bill',
        'utility_bill',
        'permit_fee',
        'miscellaneous',
      ],
      required: [true, 'Bill type is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    filePublicId: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf'],
      required: true,
    },
    originalFileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    amount: {
      type: Number,
      default: null,
    },
    billDate: {
      type: Date,
      required: [true, 'Bill date is required'],
    },
    vendorName: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedBy: {
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

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
