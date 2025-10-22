import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config.js';
import AppError from '../utils/AppError.js';

// configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});


// upload single image to Cloudinary
// param {Buffer} fileBuffer - file buffer from multer
// param {Object} options - upload options
// returns {Object} upload result with URL and public_id

export const uploadImage = async (fileBuffer, options = {}) => {
  try {
    const { folder = 'animomart', transformation } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: transformation || [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(new AppError('Image upload failed', 500));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new AppError('Image upload failed', 500);
  }
};


// upload multiple images to Cloudinary
// param {Array} files - array of file buffers from multer
// param {Object} options - upload options
// returns {Array} array of upload results

export const uploadMultipleImages = async (files, options = {}) => {
  if (!files || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  const uploadPromises = files.map((file) =>
    uploadImage(file.buffer, options)
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new AppError('Failed to upload one or more images', 500);
  }
};


// delete image from cloudinary
// param {string} publicId - cloudinary public ID
// returns {Object} deletion result

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new AppError('Failed to delete image', 500);
    }

    return {
      message: 'Image deleted successfully',
      result,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete image', 500);
  }
};


// delete multiple images from cloudinary
// param {Array} publicIds - array of cloudinary public IDs
// returns {Object} deletion result

export const deleteMultipleImages = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) {
    return { message: 'No images to delete' };
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);

    return {
      message: 'Images deleted successfully',
      deleted: result.deleted,
    };
  } catch (error) {
    throw new AppError('Failed to delete images', 500);
  }
};


// extract public ID from Cloudinary URL
// param {string} url - Cloudinary URL
// returns {string} Public ID

export const extractPublicId = (url) => {
  if (!url) return null;

  try {
    // example URL: https://res.cloudinary.com/cloud-name/image/upload/v123456/folder/image.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) return null;

    // get everything after 'upload/v123456/'
    const pathParts = parts.slice(uploadIndex + 2);
    const publicIdWithExt = pathParts.join('/');

    // remove file extension
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    return publicId;
  } catch (error) {
    return null;
  }
};


// upload profile picture
// param {Buffer} fileBuffer
// param {string} userId - user id
// returns {Object} upload result

export const uploadProfilePicture = async (fileBuffer, userId) => {
  return uploadImage(fileBuffer, {
    folder: 'animomart/profiles',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
};


// upload product images
// param {Array} files - array of files
// param {string} sellerId - Seller ID
// returns {Array} upload results

export const uploadProductImages = async (files, sellerId) => {
  return uploadMultipleImages(files, {
    folder: `animomart/products/${sellerId}`,
  });
};


// delete product images
// param {Array} imageUrls - array of image URLs
// returns {Object} Deletion result

export const deleteProductImages = async (imageUrls) => {
  const publicIds = imageUrls
    .map(url => extractPublicId(url))
    .filter(id => id !== null);

  if (publicIds.length === 0) {
    return { message: 'No valid images to delete' };
  }

  return deleteMultipleImages(publicIds);
};


// replace product images
// param {Array} oldImageUrls - array of old image URLs to delete
// param {Array} newFiles - array of new files to upload
// param {string} sellerId - seller ID
// returns {Array} new image URLs

export const replaceProductImages = async (oldImageUrls, newFiles, sellerId) => {
  // delete old images
  if (oldImageUrls && oldImageUrls.length > 0) {
    await deleteProductImages(oldImageUrls);
  }

  // upload new images
  const uploadResults = await uploadProductImages(newFiles, sellerId);

  return uploadResults.map(result => result.url);
};


// get image details from cloudinary
// param {string} publicId - cloudinary public ID
// returns {Object} image details

export const getImageDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);

    return {
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      createdAt: result.created_at,
    };
  } catch (error) {
    throw new AppError('Failed to get image details', 500);
  }
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  extractPublicId,
  uploadProfilePicture,
  uploadProductImages,
  deleteProductImages,
  replaceProductImages,
  getImageDetails,
};