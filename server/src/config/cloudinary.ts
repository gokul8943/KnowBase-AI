import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

export const initCloudinary = (): void => {
  const { cloudinary: cloudinaryConfig } = config;

  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
    throw new Error('Missing required Cloudinary configuration: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true,
  });
};

export const cloudinaryUpload = cloudinary.uploader;
export const cloudinaryApi = cloudinary.api;
export { cloudinary };

export const getCloudinaryFolder = (): string => config.cloudinary.folder;