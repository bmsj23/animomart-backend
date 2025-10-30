import dotenv from 'dotenv';

dotenv.config();

// configuration object containing all environment variables
const config = {
  // server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/animomart',

  // jwt configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    accessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // google oauth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  // cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'AnimoMart <noreply@animomart.com>',
  },

  // frontend url
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  },

  // order settings
  pendingOrderTimeoutHours: parseInt(process.env.PENDING_ORDER_TIMEOUT_HOURS) || 48,

  // file upload limits
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    maxImagesPerProduct: parseInt(process.env.MAX_IMAGES_PER_PRODUCT) || 5,
  },

  // allowed email domain
  allowedEmailDomain: '@dlsl.edu.ph',

  // gemini configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
};

export default config;