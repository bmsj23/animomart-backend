// import all route modules
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import messageRoutes from './message.routes.js';
import reviewRoutes from './review.routes.js';
import reportRoutes from './report.routes.js';
import uploadRoutes from './upload.routes.js';
import adminRoutes from './admin.routes.js';

// mount all routes with /api prefix
export default (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/admin', adminRoutes);
};