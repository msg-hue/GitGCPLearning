/**
 * Frontend Configuration
 * Purpose: Central configuration for the frontend application.
 * API_BASE_URL: Backend API base URL
 * 
 * Strategy:
 * - If REACT_APP_API_URL is set, use it (highest priority)
 * - If running on localhost, prefer localhost backend to avoid CORS issues
 * - Otherwise, fall back to hosted backend
 */
const HOSTED_API_URL = 'http://34.10.136.234:5009';
const LOCAL_API_URL = 'http://localhost:5000'; // Local backend port

// Determine which backend to use
let apiUrl;

if (process.env.REACT_APP_API_URL) {
  // Environment variable takes highest priority
  apiUrl = process.env.REACT_APP_API_URL;
  console.log('[Config] Using REACT_APP_API_URL from environment:', apiUrl);
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Running locally - use localhost backend to avoid CORS issues
  apiUrl = LOCAL_API_URL;
  console.log('[Config] Running locally - using localhost backend:', apiUrl);
} else {
  // Running on server - use hosted backend
  apiUrl = HOSTED_API_URL;
  console.log('[Config] Running on server - using hosted backend:', apiUrl);
}

// Validate that we're not using port 5005 - force correction if detected
if (apiUrl.includes(':5005')) {
  console.error('[Config] ERROR: Port 5005 detected! Correcting...');
  if (apiUrl.includes('localhost')) {
    apiUrl = LOCAL_API_URL;
  } else {
    apiUrl = HOSTED_API_URL;
  }
}

export const API_BASE_URL = apiUrl;

// Log the final API URL being used
console.log('[Config] ✅ Final API_BASE_URL:', API_BASE_URL);

// Test backend connectivity on page load (only in development)
if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
  console.log('[Config] Testing backend connectivity...');
  fetch(`${API_BASE_URL}/health`)
    .then(r => {
      if (r.ok) {
        console.log('[Config] ✅ Backend is reachable at', API_BASE_URL);
      } else {
        console.warn('[Config] ⚠️ Backend responded with status:', r.status);
      }
    })
    .catch(err => {
      console.error('[Config] ❌ Cannot reach backend at', API_BASE_URL, '- Error:', err.message);
      console.error('[Config] This is likely a CORS or network issue. Check:');
      if (API_BASE_URL.includes('localhost')) {
        console.error('[Config] 1. Is the local backend running? Start it with: cd backend/PMS_APIs && dotnet run');
        console.error('[Config] 2. The backend should be running on http://localhost:5000');
      } else {
        console.error('[Config] 1. Is the backend running on port 5009?');
        console.error('[Config] 2. Is CORS configured to allow', window.location.origin, '?');
      }
    });
}
