import Product from '../models/Product.model.js';

export async function trackProductView(req, res, next) {
  try {
    const { productId } = req.params;

    if (productId) {
      Product.findByIdAndUpdate(productId, { $inc: { views: 1 } }).exec();
    }

    next();
  } catch (error) {
    next();
  }
}