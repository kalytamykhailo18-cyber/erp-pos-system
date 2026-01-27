const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name
 * @param {string} options.publicId - Custom public ID for the image
 * @param {string} options.transformation - Transformation options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadBase64Image = async (base64Data, options = {}) => {
  try {
    const { folder = 'user-avatars', publicId, transformation } = options;

    // Ensure base64 data has proper prefix
    let uploadData = base64Data;
    if (!base64Data.startsWith('data:')) {
      uploadData = `data:image/jpeg;base64,${base64Data}`;
    }

    const uploadOptions = {
      folder,
      resource_type: 'image',
      overwrite: true,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Apply transformation for avatars (resize, crop to square)
    if (transformation) {
      uploadOptions.transformation = transformation;
    } else {
      // Default avatar transformation: 200x200 square, face-centered crop
      uploadOptions.transformation = [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }

    const result = await cloudinary.uploader.upload(uploadData, uploadOptions);

    logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null
 */
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Match pattern: /v{version}/{folder}/{filename}
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadBase64Image,
  deleteImage,
  extractPublicIdFromUrl,
};
