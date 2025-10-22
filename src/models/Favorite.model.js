import mongoose from 'mongoose';

// favorite schema definition
const favoriteSchema = new mongoose.Schema(
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

// compound index to ensure user can only favorite a product once
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

// index for querying user's favorites
favoriteSchema.index({ user: 1, createdAt: -1 });

// static method: get user's favorites with product details
favoriteSchema.statics.getUserFavorites = async function(userId, options = {}) {
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

// static method: check if user has favorited a product
favoriteSchema.statics.isFavorited = async function(userId, productId) {
  const favorite = await this.findOne({ user: userId, product: productId });
  return !!favorite;
};

// static method: get favorite count for a product
favoriteSchema.statics.getProductFavoriteCount = async function(productId) {
  return this.countDocuments({ product: productId });
};

// static method: remove favorites for a product (when product is deleted)
favoriteSchema.statics.removeByProduct = async function(productId) {
  return this.deleteMany({ product: productId });
};

// static method: remove favorites by user (when user is deleted)
favoriteSchema.statics.removeByUser = async function(userId) {
  return this.deleteMany({ user: userId });
};

const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);

export default Favorite;