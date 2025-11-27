// Purpose: Route guard component that restricts access to authenticated users only.
// Inputs: None directly; reads `jwt` from `localStorage` and current location via React Router.
// Outputs: Renders protected child routes when authenticated, otherwise redirects to `/login`.
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * RequireAuth ensures only authenticated users can access protected routes.
 * - Checks for a JWT token in `localStorage` under the key `jwt`.
 * - Validates token expiry if available.
 * - If no token or expired token, redirects to `/login` and preserves the intended path in state.
 * - If authenticated, renders an `<Outlet/>` to display nested protected routes.
 *
 * Returns:
 * - `<Navigate to="/login" />` when unauthenticated or token expired
 * - `<Outlet />` when authenticated
 */
function RequireAuth() {
  const location = useLocation();
  
  // Check for token
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('jwt') : null;
  
  // Check token expiry if available
  const expiresAt = typeof window !== 'undefined' ? window.localStorage.getItem('jwt_expires') : null;
  let isTokenValid = true;
  
  if (token && expiresAt) {
    try {
      const expiryTime = parseInt(expiresAt, 10);
      if (!isNaN(expiryTime) && Date.now() >= expiryTime) {
        // Token expired - clear it
        localStorage.removeItem('jwt');
        localStorage.removeItem('jwt_expires');
        localStorage.removeItem('user');
        isTokenValid = false;
      }
    } catch (e) {
      // Invalid expiry format - treat as expired
      localStorage.removeItem('jwt');
      localStorage.removeItem('jwt_expires');
      localStorage.removeItem('user');
      isTokenValid = false;
    }
  }

  if (!token || !isTokenValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;