import { v2 as cloudinary } from 'cloudinary';
import config from './config.js';

// configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// test cloudinary connection
export const testCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log('Cloudinary connected successfully');
    return true;
  } catch (error) {
    console.error('Cloudinary connection failed:', error.message);
    return false;
  }
};

export default cloudinary;