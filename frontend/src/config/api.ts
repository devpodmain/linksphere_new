// API configuration for different environments

const getApiBaseUrl = () => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // Local development with XAMPP Apache server
    return 'http://localhost/linksphere/backend/public';
  } else {
    // Production environment - qr.dzyte.com
    return 'https://qr.dzyte.com/backend';
  }
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  UPLOAD_ENDPOINT: '/upload/profile-image',
  TIMEOUT: 30000, // 30 seconds timeout for uploads
};

export default API_CONFIG;

