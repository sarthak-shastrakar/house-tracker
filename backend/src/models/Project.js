const mongoose = require('mongoose');

const budgetHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: 'Budget set initially',
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Project location is required'],
      trim: true,
    },
    landArea: {
      type: Number, // In square feet
      default: 0,
    },
    constructionArea: {
      type: Number, // In square feet
      default: 0,
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    amountSpent: {
      type: Number,
      default: 0,
      min: [0, 'Amount spent cannot be negative'],
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: null,
    },
    expectedEndDate: {
      type: Date,
      default: null,
    },
    budgetWarningThreshold: {
      type: Number,
      default: 80, // Default to 80% warning
      min: [1, 'Threshold must be at least 1%'],
      max: [100, 'Threshold cannot exceed 100%'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    budgetHistory: [budgetHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Auto-add initial budget history on project creation
projectSchema.pre('save', function () {
  if (this.isNew && this.budgetHistory.length === 0) {
    this.budgetHistory.push({
      amount: this.totalBudget,
      changedBy: this.owner,
      changedAt: new Date(),
      note: 'Initial budget registration',
    });
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
