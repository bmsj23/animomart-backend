import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import AppError from '../utils/AppError.js';

// get user's cart
// param {string} userId - user id
// returns {Object} cart with populated products

export const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name price images stock status seller category',
      populate: {
        path: 'seller',
        select: 'name profilePicture sellerInfo',
      },
    });

  if (!cart) {
    // create empty cart if doesn't exist
    cart = await Cart.create({ user: userId, items: [] });
  }

  // validate items (check stock and availability)
  const validation = await cart.validateItems();

  return {
    cart,
    validation,
  };
};

// add item to cart
// param {string} userId - user id
// param {string} productId - product ID
// param {number} quantity - quantity to add
// returns {Object} updated cart

export const addToCart = async (userId, productId, quantity = 1) => {
  // verify product exists and is available
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.status !== 'active') {
    throw new AppError('Product is not available', 400);
  }

  if (product.stock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  // users cannot add their own products to cart
  if (product.seller.toString() === userId) {
    throw new AppError('You cannot add your own products to cart', 400);
  }

  // get or create cart
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // add item
  await cart.addItem(productId, quantity);

  // populate and return
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock status seller',
    populate: {
      path: 'seller',
      select: 'name profilePicture sellerInfo',
    },
  });

  return cart;
};

// update cart item quantity
// param {string} userId - user id
// param {string} productId - product ID
// param {number} quantity - new quantity
// returns {Object} updated cart

export const updateCartItem = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // check product stock
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (quantity > product.stock) {
    throw new AppError(`Only ${product.stock} items available`, 400);
  }

  // update quantity
  await cart.updateQuantity(productId, quantity);

  await cart.populate({
    path: 'items.product',
    select: 'name price images stock status seller',
    populate: {
      path: 'seller',
      select: 'name profilePicture sellerInfo',
    },
  });

  return cart;
};

// remove item from cart
// param {string} userId - user id
// param {string} productId - product ID
// returns {Object} updated cart

export const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.removeItem(productId);

  await cart.populate({
    path: 'items.product',
    select: 'name price images stock status seller',
    populate: {
      path: 'seller',
      select: 'name profilePicture sellerInfo',
    },
  });

  return cart;
};

// clear entire cart
// param {string} userId - user id
// returns {Object} empty cart

export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.clearCart();

  return cart;
};

// get cart summary with totals
// param {string} userId - user id
// returns {Object} cart summary

export const getCartSummary = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name price images stock status seller',
      populate: {
        path: 'seller',
        select: 'name profilePicture sellerInfo',
      },
    });

  if (!cart || cart.items.length === 0) {
    return {
      itemCount: 0,
      subtotal: 0,
      items: [],
    };
  }

  // calculate totals
  const subtotal = await cart.getTotal();
  const itemCount = cart.getItemCount();

  return {
    itemCount,
    subtotal,
    items: cart.items,
  };
};

// group cart items by seller for checkout
// param {string} userId - user id
// returns {Object} cart grouped by sellers

export const getCartGroupedBySeller = async (userId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    return {
      sellers: [],
      totalAmount: 0,
    };
  }

  // validate items first
  const validation = await cart.validateItems();

  if (!validation.isValid) {
    throw new AppError('Cart contains invalid items. Please review your cart.', 400);
  }

  // group by seller
  const grouped = await cart.groupBySeller();

  // calculate total
  const totalAmount = Object.values(grouped).reduce(
    (sum, seller) => sum + seller.subtotal,
    0
  );

  return {
    sellers: Object.values(grouped),
    totalAmount,
    itemCount: cart.getItemCount(),
  };
};

// validate cart before checkout
// param {string} userId - user id
// returns {Object} validation result

export const validateCartForCheckout = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      populate: {
        path: 'seller',
        select: 'name profilePicture sellerInfo',
      },
    });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  const validation = await cart.validateItems();

  if (!validation.isValid) {
    return {
      valid: false,
      invalidItems: validation.invalid,
      message: 'Some items in your cart are no longer available',
    };
  }

  return {
    valid: true,
    message: 'Cart is valid for checkout',
  };
};

// merge guest cart with user cart (for future use)
// param {string} userId - user id
// param {Array} guestItems - guest cart items
// returns {Object} merged cart

export const mergeGuestCart = async (userId, guestItems) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // add guest items to cart
  for (const item of guestItems) {
    const product = await Product.findById(item.productId);
    if (product && product.status === 'active' && product.stock > 0) {
      await cart.addItem(item.productId, item.quantity);
    }
  }

  await cart.populate({
    path: 'items.product',
    select: 'name price images stock status seller',
    populate: {
      path: 'seller',
      select: 'name profilePicture sellerInfo',
    },
  });

  return cart;
};

export const validateStock = async (items) => {
  // extract all product ids
  const productIds = items.map(item => item.productId);

  const products = await Product.find({
    _id: { $in: productIds },
  }).select('_id name stock status').lean();

  // create a map for quick lookup
  const productMap = new Map(
    products.map(p => [p._id.toString(), p])
  );

  const invalidItems = [];
  const warnings = [];

  // validate each requested item
  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      // product not found
      invalidItems.push({
        productId: item.productId,
        productName: 'Unknown Product',
        requestedQuantity: item.quantity,
        availableStock: 0,
        reason: 'Product not found',
      });
      continue;
    }

    if (product.status !== 'active') {
      // product inactive or deleted
      invalidItems.push({
        productId: item.productId,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableStock: 0,
        reason: `Product is ${product.status}`,
      });
      continue;
    }

    if (product.stock === 0) {
      // out of stock
      invalidItems.push({
        productId: item.productId,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableStock: 0,
        reason: 'Out of stock',
      });
      continue;
    }

    if (product.stock < item.quantity) {
      // insufficient stock
      invalidItems.push({
        productId: item.productId,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableStock: product.stock,
        reason: `Only ${product.stock} item(s) available`,
      });
      continue;
    }

    // check for low stock warning
    if (product.stock > 0 && product.stock < 5 && product.stock >= item.quantity) {
      warnings.push({
        productId: item.productId,
        productName: product.name,
        availableStock: product.stock,
        message: `Low stock: only ${product.stock} item(s) remaining`,
      });
    }
  }

  const isValid = invalidItems.length === 0;

  return {
    valid: isValid,
    message: isValid
      ? 'All items are in stock'
      : 'Some items have insufficient stock',
    invalidItems,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  getCartGroupedBySeller,
  validateCartForCheckout,
  mergeGuestCart,
  validateStock,
};