import mongoose from 'mongoose';

// report schema definition
const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },

    reportedEntity: {
      entityType: {
        type: String,
        enum: {
          values: ['product', 'user'],
          message: '{VALUE} is not a valid entity type',
        },
        required: [true, 'Entity type is required'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Entity ID is required'],
        index: true,
      },
    },

    reason: {
      type: String,
      enum: {
        values: [
          'inappropriate_content',
          'scam_or_fraud',
          'counterfeit_product',
          'harassment',
          'spam',
          'other',
        ],
        message: '{VALUE} is not a valid reason',
      },
      required: [true, 'Reason is required'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },

    evidence: {
      type: [String], // cloudinary urls for screenshots
      default: [],
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'under_review', 'resolved', 'dismissed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },

    adminNotes: {
      type: String,
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    reviewedAt: {
      type: Date,
    },

    resolution: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// compound indexes
reportSchema.index({ 'reportedEntity.entityType': 1, 'reportedEntity.entityId': 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

// instance method: update status
reportSchema.methods.updateStatus = function(newStatus, adminId, notes = '') {
  this.status = newStatus;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.adminNotes = notes;
  return this.save();
};

// instance method: resolve report
reportSchema.methods.resolve = function(adminId, resolution) {
  this.status = 'resolved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.resolution = resolution;
  return this.save();
};

// instance method: dismiss report
reportSchema.methods.dismiss = function(adminId, reason) {
  this.status = 'dismissed';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = reason;
  return this.save();
};

// static method: find pending reports
reportSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('reporter', 'name email')
    .sort({ createdAt: 1 }); // oldest first
};

// static method: find reports by entity
reportSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({
    'reportedEntity.entityType': entityType,
    'reportedEntity.entityId': entityId,
  })
    .populate('reporter', 'name email')
    .sort({ createdAt: -1 });
};

// static method: get report statistics
reportSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const reasonStats = await this.aggregate([
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return {
    byStatus: stats,
    byReason: reasonStats,
  };
};

// static method: check if user already reported entity
reportSchema.statics.hasUserReported = async function(reporterId, entityType, entityId) {
  const report = await this.findOne({
    reporter: reporterId,
    'reportedEntity.entityType': entityType,
    'reportedEntity.entityId': entityId,
  });
  return !!report;
};

// static method: get reports by status
reportSchema.statics.findByStatus = function(status, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({ status })
    .populate('reporter', 'name email')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// virtual: is pending
reportSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// virtual: is resolved
reportSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved';
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;