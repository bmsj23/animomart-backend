import multer from 'multer';
import path from 'path';
import config from '../config/config.js';
import AppError from '../utils/AppError.js';

// configure multer storage (memory storage for cloudinary upload)
const storage = multer.memoryStorage();

// file filter to accept only images
const fileFilter = (req, file, cb) => {
  // allowed image types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpeg, jpg, png, gif, webp)', 400));
  }
};

// multer upload configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter,
});

// middleware to handle single image upload
export const uploadSingle = upload.single('image');

// middleware to handle multiple image uploads
export const uploadMultiple = upload.array('images', config.upload.maxImagesPerProduct);

// middleware to handle profile picture upload
export const uploadProfile = upload.single('profilePicture');

export default upload;