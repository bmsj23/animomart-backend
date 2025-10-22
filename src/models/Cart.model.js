import mongoose from 'mongoose';

// cart schema definition
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },

    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// middleware to update updatedAt on save
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// instance method: add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1) {

  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString()
  );

  if (existingItem) {

    // just increment quantity if prod already exists in cart
    existingItem.quantity += quantity;

  } else {
    // add new item to cart
    this.items.push({
      product: productId,
      quantity,
      addedAt: new Date(),
    });
  }

  return this.save();
};

// instance method: remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// instance method: update item quantity
cartSchema.methods.updateQuantity = function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {

      // remove item if quantity is 0 or less
      return this.removeItem(productId);
    }
    item.quantity = quantity;
    return this.save();
  }

  throw new Error('Item not found in cart');
};

// instance method: clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// instance method: get cart total
cartSchema.methods.getTotal = async function() {

    // populate products to get prices
  await this.populate('items.product', 'price');

  const total = this.items.reduce((sum, item) => {
    if (item.product && item.product.price) {
      return sum + (item.product.price * item.quantity);
    }
    return sum;
  }, 0);

  return total;
};

// instance method: get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
};

// instance method: group items by seller
cartSchema.methods.groupBySeller = async function() {

    // populate product with seller info
  await this.populate('items.product', 'seller price title images');

  const grouped = {};

  this.items.forEach(item => {
    if (item.product && item.product.seller) {
      const sellerId = item.product.seller.toString();

      if (!grouped[sellerId]) {
        grouped[sellerId] = {
          seller: item.product.seller,
          items: [],
          subtotal: 0,
        };
      }

      grouped[sellerId].items.push({
        product: item.product._id,
        productName: item.product.title,
        productImage: item.product.images[0] || null,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      });

      grouped[sellerId].subtotal += item.product.price * item.quantity;
    }
  });

  return grouped;
};

// instance method: validate cart items (check stock, availability)
cartSchema.methods.validateItems = async function() {
  await this.populate('items.product');

  const invalidItems = [];
  const validItems = [];

  for (const item of this.items) {
    if (!item.product) {

      // product aint existing in cart
      invalidItems.push({
        item,
        reason: 'Product no longer exists',
      });
    } else if (item.product.status !== 'active') {

      // product not active na
      invalidItems.push({
        item,
        reason: `Product is ${item.product.status}`,
      });
    } else if (item.product.stock < item.quantity) {

      // insufficient stock
      invalidItems.push({
        item,
        reason: `Only ${item.product.stock} items available`,
      });
    } else {
      validItems.push(item);
    }
  }

  return {
    valid: validItems,
    invalid: invalidItems,
    isValid: invalidItems.length === 0,
  };
};

// static method: find or create cart for user
cartSchema.statics.findOrCreate = async function(userId) {
  let cart = await this.findOne({ user: userId });

  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

// static method: clear all carts (admin utility)
cartSchema.statics.clearAllCarts = function() {
  return this.updateMany({}, { $set: { items: [] } });
};

// virtual: item count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// virtual: is empty
cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;