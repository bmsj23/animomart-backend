import nodemailer from 'nodemailer';
import config from '../config/config.js';

// create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// verify email connection
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error.message);
    return false;
  }
};

// send email helper function
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

// email templates

// send report notification to admin
export const sendReportNotification = async (adminEmail, report) => {
  const subject = `New Report: ${report.reportType}`;
  const html = `
    <h2>New Report Received</h2>
    <p><strong>Report Type:</strong> ${report.reportType}</p>
    <p><strong>Reported By:</strong> ${report.reporter?.email || 'Unknown'}</p>
    <p><strong>Reason:</strong> ${report.reason}</p>
    <p><strong>Description:</strong> ${report.description || 'N/A'}</p>
    <p><strong>Created At:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
    <br>
    <p>Please review this report in the admin dashboard.</p>
  `;

  await sendEmail({ to: adminEmail, subject, html });
};

// send report notification to reported user
export const sendReportedUserNotification = async (userEmail, reportType) => {
  const subject = `Your ${reportType} has been reported`;
  const html = `
    <h2>Report Notification</h2>
    <p>Hello,</p>
    <p>Your ${reportType} has been reported by another user. Our admin team will review this report shortly.</p>
    <p>If you believe this report is a mistake, please contact support.</p>
    <br>
    <p>Best regards,<br>AnimoMart Team</p>
  `;

  await sendEmail({ to: userEmail, subject, html });
};

// send order status update notification
export const sendOrderStatusEmail = async (buyerEmail, order, newStatus) => {
  const subject = `Order #${order._id} Status Update: ${newStatus}`;
  const html = `
    <h2>Order Status Update</h2>
    <p>Hello,</p>
    <p>Your order status has been updated to: <strong>${newStatus}</strong></p>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Total Amount:</strong> ₱${order.totalAmount}</p>
    <br>
    <p>Thank you for using AnimoMart!</p>
  `;

  await sendEmail({ to: buyerEmail, subject, html });
};

// send new order notification to seller
export const sendNewOrderEmail = async (sellerEmail, order) => {
  const subject = `New Order Received - Order #${order._id}`;
  const html = `
    <h2>New Order Notification</h2>
    <p>Hello,</p>
    <p>You have received a new order!</p>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Total Amount:</strong> ₱${order.totalAmount}</p>
    <p><strong>Number of Items:</strong> ${order.items.length}</p>
    <br>
    <p>Please confirm the order in your AnimoMart dashboard.</p>
  `;

  await sendEmail({ to: sellerEmail, subject, html });
};

// send review notification to seller
export const sendReviewNotification = async (sellerEmail, review, productTitle) => {
  const subject = `New Review for "${productTitle}"`;
  const html = `
    <h2>New Product Review</h2>
    <p>Hello,</p>
    <p>Your product "<strong>${productTitle}</strong>" has received a new review!</p>
    <p><strong>Rating:</strong> ${review.rating}/5 stars</p>
    <p><strong>Comment:</strong> ${review.comment || 'No comment provided'}</p>
    <br>
    <p>View it on your AnimoMart dashboard.</p>
  `;

  await sendEmail({ to: sellerEmail, subject, html });
};

// send low stock warning to seller
export const sendLowStockWarning = async (sellerEmail, product) => {
  const subject = `Low Stock Alert: ${product.title}`;
  const html = `
    <h2>Low Stock Warning</h2>
    <p>Hello,</p>
    <p>Your product "<strong>${product.title}</strong>" is running low on stock.</p>
    <p><strong>Current Stock:</strong> ${product.stock} units</p>
    <br>
    <p>Please update your inventory to avoid running out of stock.</p>
  `;

  await sendEmail({ to: sellerEmail, subject, html });
};

export default transporter;