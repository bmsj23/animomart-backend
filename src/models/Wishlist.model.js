import mongoose from 'mongoose';

// wishlist schema definition
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// compound index to ensure user can only add a product to wishlist once
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

// index for querying user's wishlist
wishlistSchema.index({ user: 1, createdAt: -1 });

// static method: get user's wishlist with product details
wishlistSchema.statics.getUserWishlist = async function(userId, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;

  return this.find({ user: userId })
    .populate({
      path: 'product',
      select: 'title price images category condition status seller',
      populate: {
        path: 'seller',
        select: 'firstName lastName profilePicture',
      },
    })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

// static method: check if user has added a product to wishlist
wishlistSchema.statics.isInWishlist = async function(userId, productId) {
  const wishlistItem = await this.findOne({ user: userId, product: productId });
  return !!wishlistItem;
};

// static method: get wishlist count for a product
wishlistSchema.statics.getProductWishlistCount = async function(productId) {
  return this.countDocuments({ product: productId });
};

// static method: remove wishlist items for a product (when product is deleted)
wishlistSchema.statics.removeByProduct = async function(productId) {
  return this.deleteMany({ product: productId });
};

// static method: remove wishlist items by user (when user is deleted)
wishlistSchema.statics.removeByUser = async function(userId) {
  return this.deleteMany({ user: userId });
};

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;