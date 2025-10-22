import mongoose from 'mongoose';

// review schema definition
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
    },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    reviewText: {
      type: String,
      maxlength: [500, 'Review text cannot exceed 500 characters'],
      trim: true,
    },

    images: {
      type: [String],
      validate: {
        validator: function(images) {
          return images.length <= 3;
        },
        message: 'Maximum 3 images allowed',
      },
      default: [],
    },

    sellerResponse: {
      text: {
        type: String,
        maxlength: [300, 'Seller response cannot exceed 300 characters'],
        trim: true,
      },
      respondedAt: {
        type: Date,
      },
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },

    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// compound index to ensure one review per product per order
reviewSchema.index({ product: 1, buyer: 1, order: 1 }, { unique: true });

// indexes for faster queries
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ seller: 1, createdAt: -1 });

// instance method: add seller response
reviewSchema.methods.addSellerResponse = function(responseText) {
  this.sellerResponse = {
    text: responseText,
    respondedAt: new Date(),
  };
  return this.save();
};

// instance method: increment helpful count
reviewSchema.methods.incrementHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// static method: get average rating for product
reviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // round to 1 decimal
      totalReviews: result[0].totalReviews,
    };
  }

  return { averageRating: 0, totalReviews: 0 };
};

// static method: get average rating for seller
reviewSchema.statics.getSellerRating = async function(sellerId) {
  const result = await this.aggregate([
    { $match: { seller: sellerId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    };
  }

  return { averageRating: 0, totalReviews: 0 };
};

// static method: check if buyer can review product from order
reviewSchema.statics.canReview = async function(buyerId, productId, orderId) {

  const existingReview = await this.findOne({
    buyer: buyerId,
    product: productId,
    order: orderId,
  });

  return !existingReview;
};

// static method: get reviews by rating
reviewSchema.statics.findByRating = function(productId, rating) {
  return this.find({ product: productId, rating })
    .populate('buyer', 'name profilePicture')
    .sort({ createdAt: -1 });
};

// virtual: has seller response
reviewSchema.virtual('hasSellerResponse').get(function() {
  return !!(this.sellerResponse && this.sellerResponse.text);
});

// create and export model
const Review = mongoose.model('Review', reviewSchema);

export default Review;