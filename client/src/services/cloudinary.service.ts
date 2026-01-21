/**
 * Cloudinary Upload Service
 * Handles direct file uploads to Cloudinary from the browser
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env');
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  original_filename: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload file to Cloudinary
 * @param file - File to upload
 * @param onProgress - Optional callback for upload progress
 * @returns Cloudinary upload response with secure_url
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'price-imports');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded * 100) / event.total),
          });
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    // Send request
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
    );
    xhr.send(formData);
  });
};

/**
 * Delete file from Cloudinary
 * Note: This requires server-side implementation with API secret
 * @param publicId - Cloudinary public_id of the file to delete
 */
export const deleteFromCloudinary = async (_publicId: string): Promise<void> => {
  // This must be done server-side as it requires the API secret
  // We'll send a request to our backend to handle deletion
  throw new Error('Cloudinary deletion must be implemented server-side');
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
};
