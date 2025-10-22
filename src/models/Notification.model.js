import mongoose from 'mongoose';

// notification schema definition
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },

    type: {
      type: String,
      enum: {
        values: [
          'new_order',
          'order_status_update',
          'new_message',
          'new_review',
          'product_back_in_stock',
          'admin_announcement',
          'account_warning',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },

    relatedEntity: {
      entityType: {
        type: String,
        enum: ['order', 'product', 'message', 'review'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// compound indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

// instance method: mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// static method: create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    user: data.user,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedEntity: data.relatedEntity,
  });
};

// static method: get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;

  const query = { user: userId };
  if (unreadOnly) query.isRead = false;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// static method: mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// static method: get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// static method: delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });
};

// static method: create new order notification for seller
notificationSchema.statics.notifyNewOrder = function(sellerId, orderId, orderNumber) {
  return this.createNotification({
    user: sellerId,
    type: 'new_order',
    title: 'New Order Received',
    message: `You have a new order: ${orderNumber}`,
    relatedEntity: {
      entityType: 'order',
      entityId: orderId,
    },
  });
};

// static method: create order status update notification for buyer
notificationSchema.statics.notifyOrderStatusUpdate = function(buyerId, orderId, orderNumber, newStatus) {
  return this.createNotification({
    user: buyerId,
    type: 'order_status_update',
    title: 'Order Status Updated',
    message: `Your order ${orderNumber} is now ${newStatus.replace(/_/g, ' ')}`,
    relatedEntity: {
      entityType: 'order',
      entityId: orderId,
    },
  });
};

// static method: create new message notification
notificationSchema.statics.notifyNewMessage = function(recipientId, senderId, senderName) {
  return this.createNotification({
    user: recipientId,
    type: 'new_message',
    title: 'New Message',
    message: `${senderName} sent you a message`,
    relatedEntity: {
      entityType: 'message',
      entityId: senderId,
    },
  });
};

// static method: create new review notification for seller
notificationSchema.statics.notifyNewReview = function(sellerId, productId, productName, rating) {
  return this.createNotification({
    user: sellerId,
    type: 'new_review',
    title: 'New Review Received',
    message: `Your product "${productName}" received a ${rating}-star review`,
    relatedEntity: {
      entityType: 'product',
      entityId: productId,
    },
  });
};

// create and export model
const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;