import mongoose from 'mongoose';

// product schema definition
const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [1000, 'Product description cannot exceed 1000 characters'],
    },

    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [1, 'Product price must be at least 1'],
    },

    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Product stock cannot be negative'],
      default: 0,
    },

    images: {
      type: [String],
      validate: {
        validator: function(images) {
          return images.length >= 1 && images.length <= 5;
        },
        message: 'At least 1 image is required and no more than 5 images are allowed',
      },
      required: [true, 'At least one product image is required'],
    },

    category: {
      type: String,
      enum: {
        values: [
          'School Supplies',
          'Electronics',
          'Books',
          'Clothing',
          'Food & Beverages',
          'Handmade Items',
          'Sports Equipment',
          'Dorm Essentials',
          'Beauty & Personal Care',
          'Others',
        ],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Product category is required'],
    },

    condition: {
      type: String,
      enum: {
        values: ['New', 'Like New', 'Good', 'Fair'],
        message: '{VALUE} is not a valid condition',
      },
      required: [true, 'Product condition is required'],
    },

    shippingAvailable: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: {
        values: ['active', 'paused', 'sold', 'deleted'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative'],
    },

    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative'],
    },

    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'Total sales cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes for faster queries
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });

// instance method: increment views
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// instance method: update rating
productSchema.methods.updateRating = async function() {

  const Review = mongoose.model('Review');
  const result = await Review.getAverageRating(this._id);

  this.averageRating = result.averageRating;
  this.totalReviews = result.totalReviews;

  return this.save();
};

// instance method: decrement stock
productSchema.methods.decrementStock = function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;

  // we will auto-mark as sold if stock reaches 0
  if (this.stock === 0) {
    this.status = 'sold';
  }

  return this.save();
};

// instance method: increment stock
productSchema.methods.incrementStock = function(quantity) {
  this.stock += quantity;

  // reactivate if product was sold
  if (this.status === 'sold' && this.stock > 0) {
    this.status = 'active';
  }

  return this.save();
};

// instance method: mark as sold
productSchema.methods.markAsSold = function() {
  this.status = 'sold';
  this.totalSales += 1;
  return this.save();
};

// static method: find active products
productSchema.statics.findActive = function(options = {}) {
  const { limit = 20, skip = 0, category = null } = options;

  const query = { status: 'active', stock: { $gt: 0 } };
  if (category) query.category = category;

  return this.find(query)
    .populate('seller', 'name profilePicture sellerInfo')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// static method: find by seller
productSchema.statics.findBySeller = function(sellerId, status = null) {
  const query = { seller: sellerId };
  if (status) query.status = status;

  return this.find(query).sort({ createdAt: -1 });
};

// static method: search products
productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  const { limit = 20, skip = 0, category = null, minPrice = null, maxPrice = null } = options;

  const query = {
    status: 'active',
    $text: { $search: searchTerm },
  };

  if (category) query.category = category;
  if (minPrice !== null) query.price = { ...query.price, $gte: minPrice };
  if (maxPrice !== null) query.price = { ...query.price, $lte: maxPrice };

  return this.find(query)
    .populate('seller', 'name profilePicture')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .skip(skip);
};

// static method: get low stock products
productSchema.statics.findLowStock = function(threshold = 5) {
  return this.find({
    status: 'active',
    stock: { $lte: threshold, $gt: 0 },
  })
    .populate('seller', 'name email')
    .sort({ stock: 1 });
};

// virtual: is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// virtual: is low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= 5;
});

const Product = mongoose.model('Product', productSchema);

export default Product;