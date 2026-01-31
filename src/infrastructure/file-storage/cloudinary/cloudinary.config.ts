export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export const getCloudinaryConfig = (): CloudinaryConfig => {
  const config = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };

  // Validação crítica no startup
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      'Cloudinary credentials are missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
    );
  }

  return config;
};
