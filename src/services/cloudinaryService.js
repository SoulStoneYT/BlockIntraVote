/**
 * Cloudinary image upload and optimization service
 */

const DEFAULT_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const DEFAULT_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset
 *
 * @param {File} file - Image file from file input or drag-and-drop
 * @param {Object} options - Optional config overrides
 * @param {string} [options.cloudName] - Optional cloud name override
 * @param {string} [options.uploadPreset] - Optional upload preset override
 * @param {Function} [options.onProgress] - Optional progress callback (percent: number)
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  const cloudName = options.cloudName || DEFAULT_CLOUD_NAME;
  const uploadPreset = options.uploadPreset || DEFAULT_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary credentials missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env or configure them in the admin form."
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "intravote_candidates");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    if (options.onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height
          });
        } catch (err) {
          reject(new Error("Failed to parse Cloudinary response: " + err.message));
        }
      } else {
        try {
          const errorResp = JSON.parse(xhr.responseText);
          reject(new Error(errorResp?.error?.message || "Cloudinary upload failed"));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Cloudinary upload"));
    };

    xhr.send(formData);
  });
};

/**
 * Automatically applies Cloudinary transformations (face detection, square fill, auto quality, auto format)
 *
 * @param {string} url - Original image URL
 * @param {number} size - Desired width and height (default: 400px)
 * @returns {string} Transformed URL or original URL if not Cloudinary
 */
export const getOptimizedCloudinaryUrl = (url, size = 400) => {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  // Insert transformations right after /upload/
  const transform = `c_fill,g_face,w_${size},h_${size},q_auto,f_auto`;
  return url.replace("/upload/", `/upload/${transform}/`);
};

export const hasCloudinaryConfig = () => {
  return Boolean(DEFAULT_CLOUD_NAME && DEFAULT_UPLOAD_PRESET);
};
