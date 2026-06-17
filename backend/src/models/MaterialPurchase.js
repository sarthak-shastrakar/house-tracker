const mongoose = require('mongoose');

const materialPurchaseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project link is required'],
    },
    materialType: {
      type: String,
      enum: [
        'cement',
        'sand',
        'steel',
        'brick',
        'paint',
        'wood',
        'tiles',
        'electrical',
        'plumbing',
        'custom',
      ],
      required: [true, 'Material type is required'],
    },
    customMaterialName: {
      type: String,
      trim: true,
      required: function () {
        return this.materialType === 'custom';
      },
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than zero'],
    },
    unit: {
      type: String,
      enum: ['bags', 'tons', 'kg', 'pieces', 'sqft', 'rft', 'litre', 'custom'],
      required: [true, 'Unit of measurement is required'],
    },
    customUnit: {
      type: String,
      trim: true,
      required: function () {
        return this.unit === 'custom';
      },
      default: '',
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
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
    receiptUrl: {
      type: String,
      default: null,
    },
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

// Auto-calculate totalAmount before saving
materialPurchaseSchema.pre('save', function () {
  this.totalAmount = (this.quantity || 0) * (this.rate || 0);
});

const MaterialPurchase = mongoose.model('MaterialPurchase', materialPurchaseSchema);

module.exports = MaterialPurchase;
