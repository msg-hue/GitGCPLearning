/**
 * Frontend Configuration
 * Purpose: Central configuration for the frontend application.
 * API_BASE_URL: Backend API base URL
 * Uses REACT_APP_API_URL from .env.local or defaults to http://localhost:5296
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5296';

// Log the API URL being used (for debugging)
console.log('[Config] API_BASE_URL:', API_BASE_URL);
console.log('[Config] REACT_APP_API_URL env var:', process.env.REACT_APP_API_URL);
