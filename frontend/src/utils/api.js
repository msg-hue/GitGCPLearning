import { API_BASE_URL } from '../config';

/**
 * fetchJson
 * Purpose: Perform a JSON HTTP request to the backend API with optional auth.
 * Inputs:
 *  - path: string API path like "/api/Customers"
 *  - options: fetch options (method, headers, body)
 * Outputs:
 *  - Resolves to parsed JSON response or throws error with context
 */
export async function fetchJson(path, options = {}) {
  // Normalize baseUrl: remove trailing slash
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Debug: Log the full URL being called
  const fullUrl = `${baseUrl}${normalizedPath}`;
  console.log('[API] Calling:', fullUrl, 'Base URL:', baseUrl);

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach JWT from localStorage if present, except for auth endpoints
  const token = localStorage.getItem('jwt');
  const lowerPath = String(path || '').toLowerCase();
  const isAuthEndpoint = lowerPath.includes('/api/auth/login') || lowerPath.includes('/api/auth/register');
  if (token && !headers.Authorization && !isAuthEndpoint) {
    headers.Authorization = `Bearer ${token}`;
  }

  let resp;
  try {
    resp = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      mode: 'cors', // Explicitly request CORS
    });
  } catch (networkError) {
    // Network error (CORS, connection refused, etc.)
    console.error('[API] Network error:', networkError);
    const errorMsg = networkError.message || String(networkError);
    if (errorMsg.includes('CORS') || errorMsg.includes('cors') || errorMsg.includes('Failed to fetch')) {
      throw new Error(`CORS error: The backend at ${baseUrl} is blocking requests from ${window.location.origin}. Please ensure CORS is configured to allow ${window.location.origin}`);
    }
    throw new Error(`Cannot connect to server at ${baseUrl}. Error: ${errorMsg}`);
  }

  // Check for CORS/network failure (status 0 or no response)
  if (!resp || resp.status === 0) {
    console.error('[API] Response status is 0 - likely CORS or network issue');
    throw new Error(`CORS or network error: Cannot reach ${baseUrl}. The server may be blocking requests from ${window.location.origin}. Please check CORS configuration on the backend.`);
  }

  const contentType = resp.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let data;
  try {
    data = isJson ? await resp.json() : await resp.text();
  } catch (parseError) {
    console.error('[API] Failed to parse response:', parseError);
    data = resp.statusText || 'Unknown error';
  }

  // Handle authentication errors (401 Unauthorized)
  if (resp.status === 401) {
    // For login endpoint, return the actual error message from backend
    if (isJson && data && data.message) {
      throw new Error(data.message); // e.g., "Invalid email or password"
    }
    // For other endpoints, clear token and redirect
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwt_expires');
    localStorage.removeItem('user');
    // Redirect to login page (only if not already on login page)
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Authentication required. Please login again.');
  }

  if (!resp.ok) {
    let message;
    if (isJson) {
      const base = data.message || '';
      const extra = data.error || data.errors || '';
      const inner = data.innerException || '';
      // Include all error details for debugging
      const errorDetails = [base, extra, inner].filter(Boolean);
      message = errorDetails.length > 0 
        ? errorDetails.join(' - ') 
        : JSON.stringify(data, null, 2);
      console.error('[API] Error response:', data);
    } else {
      message = data || `HTTP ${resp.status} ${resp.statusText}`;
    }
    
    // Provide more helpful error messages
    if (resp.status === 404) {
      message = `API endpoint not found: ${baseUrl}${path}. Please check if the backend is running and the endpoint exists.`;
    } else if (resp.status === 401) {
      message = message || 'Invalid email or password';
    } else if (resp.status === 403) {
      message = message || 'Access forbidden. Please check CORS configuration.';
    } else if (resp.status >= 500) {
      message = message || `Server error (${resp.status}). Please check if the backend is running properly.`;
    }
    
    throw new Error(message || `API error ${resp.status}: ${resp.statusText}`);
  }

  return data;
}

/**
 * getCustomers
 * Purpose: Fetch customers list from the backend, optionally filtered.
 * Inputs:
 *  - params: object of query params (e.g., { page, pageSize, status })
 * Outputs:
 *  - Returns customers array or paginated object depending on API
 */
export async function getCustomers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/Customers?${query.toString()}`
    : '/api/Customers';

  return fetchJson(path);
}

/**
 * getCustomer
 * Purpose: Fetch a single customer by ID for detail view.
 * Inputs:
 *  - id: string customer identifier (e.g., 'C0001234')
 * Outputs:
 *  - Returns a customer object with related entities when available
 */
export async function getCustomer(id) {
  if (!id) throw new Error('Customer id is required');
  return fetchJson(`/api/Customers/${encodeURIComponent(id)}`);
}

/**
 * createCustomer
 * Purpose: Create a new customer via POST to backend API.
 * Inputs:
 *  - payload: object with customer fields (CustomerId is optional, will be auto-generated if not provided)
 * Outputs:
 *  - Returns the created customer object from the API
 */
export async function createCustomer(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson('/api/Customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * updateCustomer
 * Purpose: Update an existing customer via PUT to backend API.
 * Inputs:
 *  - id: string customer identifier
 *  - payload: object with updated customer fields (must include CustomerId matching id)
 * Outputs:
 *  - Returns the updated customer object from the API
 */
export async function updateCustomer(id, payload) {
  if (!id) throw new Error('Customer id is required');
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson(`/api/Customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * deleteCustomer
 * Purpose: Delete a customer via DELETE to backend API (soft delete - sets status to "Deleted").
 * Inputs:
 *  - id: string customer identifier
 * Outputs:
 *  - Returns success message
 */
export async function deleteCustomer(id) {
  if (!id) throw new Error('Customer id is required');
  return fetchJson(`/api/Customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * login
 * Purpose: Authenticate a user using email (password optional), then store JWT.
 * Inputs:
 *  - email: string user email (required)
 *  - password: string user password (optional; included if provided)
 * Outputs:
 *  - Returns the login response { token, expiresAt, user }
 *  - Side effect: stores `jwt`, `jwt_expires`, and `user` in localStorage
 */
export async function login(email, password) {
  if (!email) throw new Error('Email is required');
  const trimmedEmail = String(email).trim();
  const trimmedPassword = typeof password === 'string' ? String(password).trim() : '';
  const payload = trimmedPassword ? { email: trimmedEmail, password: trimmedPassword } : { email: trimmedEmail };

  const res = await fetchJson('/api/Auth/login', {
    method: 'POST',
    // Normalize to avoid whitespace/casing mismatch with backend
    body: JSON.stringify(payload),
  });

  // Persist auth (robust to different JSON casing)
  const token = res.token ?? res.Token;
  const expiresAt = res.expiresAt ?? res.ExpiresAt;
  const user = res.user ?? res.User;

  if (!token) {
    throw new Error('Login succeeded but no token returned');
  }

  // Convert expiresAt to timestamp if it's a Date string
  let expiresAtTimestamp;
  if (expiresAt) {
    if (typeof expiresAt === 'string') {
      // Try to parse as Date and convert to timestamp
      const date = new Date(expiresAt);
      expiresAtTimestamp = isNaN(date.getTime()) ? expiresAt : date.getTime().toString();
    } else if (typeof expiresAt === 'number') {
      expiresAtTimestamp = expiresAt.toString();
    } else {
      expiresAtTimestamp = String(expiresAt);
    }
  } else {
    // Default to 24 hours from now if not provided
    expiresAtTimestamp = (Date.now() + 24 * 60 * 60 * 1000).toString();
  }

  localStorage.setItem('jwt', token);
  localStorage.setItem('jwt_expires', expiresAtTimestamp);
  localStorage.setItem('user', JSON.stringify(user));
  
  console.log('[API] Auth data saved:', {
    hasToken: !!token,
    expiresAt: expiresAtTimestamp,
    expiresAtDate: new Date(parseInt(expiresAtTimestamp)).toISOString()
  });
  
  return { token, expiresAt: expiresAtTimestamp, user };
}

/**
 * Properties API
 * Purpose: CRUD operations for properties.
 * Inputs:
 *  - getProperties: params object with { page, pageSize, search, status, projectName, size }
 *  - getProperty: id string
 *  - createProperty: payload object with property fields
 *  - updateProperty: id string and payload object
 *  - deleteProperty: id string
 * Outputs:
 *  - JSON responses from backend endpoints.
 */
export async function getProperties(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/Properties?${query.toString()}`
    : '/api/Properties';

  return fetchJson(path);
}

export async function getProperty(id) {
  if (!id) throw new Error('Property id is required');
  return fetchJson(`/api/Properties/${encodeURIComponent(id)}`);
}

export async function createProperty(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson('/api/Properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProperty(id, payload) {
  if (!id) throw new Error('Property id is required');
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson(`/api/Properties/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProperty(id) {
  if (!id) throw new Error('Property id is required');
  return fetchJson(`/api/Properties/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function getPropertyStatistics() {
  return fetchJson('/api/Properties/statistics');
}

export async function getInventoryStatus() {
  return fetchJson('/api/Properties/inventory-status');
}

/**
 * Projects API
 * Purpose: CRUD operations for projects.
 * Inputs:
 *  - getProjects: params object with { page, pageSize, search, type, location }
 *  - getProject: id string
 *  - createProject: payload object with project fields
 *  - updateProject: id string and payload object
 *  - deleteProject: id string
 * Outputs:
 *  - JSON responses from backend endpoints.
 */
export async function getProjects(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/Projects?${query.toString()}`
    : '/api/Projects';

  return fetchJson(path);
}

export async function getProject(id) {
  if (!id) throw new Error('Project id is required');
  return fetchJson(`/api/Projects/${encodeURIComponent(id)}`);
}

export async function createProject(payload) {
  return fetchJson('/api/Projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(id, payload) {
  if (!id) throw new Error('Project id is required');
  return fetchJson(`/api/Projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, projectId: id }),
  });
}

export async function deleteProject(id) {
  if (!id) throw new Error('Project id is required');
  return fetchJson(`/api/Projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Allotments API
 * Purpose: CRUD operations for allotments.
 * Inputs:
 *  - searchCustomer: customerId string
 *  - getAvailableProperties: optional projectId string
 *  - createAllotment: payload object with allotment fields
 *  - getAllotments: params object with { page, pageSize, customerId, status }
 * Outputs:
 *  - JSON responses from backend endpoints.
 */
export async function searchCustomerForAllotment(customerId) {
  if (!customerId) throw new Error('Customer ID is required');
  return fetchJson(`/api/Allotments/search-customer/${encodeURIComponent(customerId)}`);
}

export async function getAvailableProperties(projectId = null) {
  const path = projectId
    ? `/api/Allotments/available-properties?projectId=${encodeURIComponent(projectId)}`
    : '/api/Allotments/available-properties';
  return fetchJson(path);
}

export async function createAllotment(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson('/api/Allotments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAllotments(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/Allotments?${query.toString()}`
    : '/api/Allotments';

  return fetchJson(path);
}

/**
 * Users API
 * Purpose: CRUD operations for users.
 * Inputs:
 *  - getUsers: params object with { page, pageSize, search, isActive, roleId }
 *  - getUser: id string
 *  - createUser: payload object with user fields
 *  - updateUser: id string and payload object
 *  - deleteUser: id string
 * Outputs:
 *  - JSON responses from backend endpoints.
 */
export async function getUsers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/Users?${query.toString()}`
    : '/api/Users';

  return fetchJson(path);
}

export async function getUser(id) {
  if (!id) throw new Error('User id is required');
  return fetchJson(`/api/Users/${encodeURIComponent(id)}`);
}

export async function createUser(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson('/api/Users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  if (!id) throw new Error('User id is required');
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson(`/api/Users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id) {
  if (!id) throw new Error('User id is required');
  return fetchJson(`/api/Users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Roles API
 * Purpose: Fetch roles for dropdowns.
 * Inputs:
 *  - includeInactive: boolean to include inactive roles
 * Outputs:
 *  - Returns array of role objects with RoleId and RoleName
 */
export async function getRoles(includeInactive = false) {
  const query = new URLSearchParams();
  if (includeInactive) {
    query.append('includeInactive', 'true');
  }
  
  const path = query.toString()
    ? `/api/Roles?${query.toString()}`
    : '/api/Roles';
  
  return fetchJson(path);
}

/**
 * getPaymentPlans
 * Purpose: Fetch payment plans list from the backend with optional filters/pagination.
 * Inputs:
 *  - params: object of query params (e.g., { page, pageSize, status })
 * Outputs:
 *  - Returns an object with { data, totalCount, page, pageSize, totalPages }
 */
export async function getPaymentPlans(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/PaymentPlans?${query.toString()}`
    : '/api/PaymentPlans';

  return fetchJson(path);
}

export async function createPaymentPlan(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson('/api/PaymentPlans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * getPaymentPlan
 * Purpose: Fetch a single payment plan by ID.
 * Inputs:
 *  - id: string plan identifier (e.g., 'PP0000001')
 * Outputs:
 *  - Returns a payment plan object
 */
export async function getPaymentPlan(id) {
  if (!id) throw new Error('Payment plan id is required');
  return fetchJson(`/api/PaymentPlans/${encodeURIComponent(id)}`);
}

/**
 * getPaymentSchedules
 * Purpose: Fetch payment schedule rows for a given plan (child records).
 * Inputs:
 *  - params: object of query params (e.g., { planId, page, pageSize })
 * Outputs:
 *  - Returns an array or paginated object depending on backend implementation.
 * Notes:
 *  - Backend endpoint for PaymentSchedules may not exist yet. This function will
 *    throw if the API returns 404; callers should handle and show a friendly message.
 */
export async function getPaymentSchedules(params = {}) {
  const query = new URLSearchParams();
  const sanitized = { ...params };
  if (sanitized.planId !== undefined && sanitized.planId !== null) {
    sanitized.planId = String(sanitized.planId).trim();
  }
  Object.entries(sanitized).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/PaymentSchedules?${query.toString()}`
    : '/api/PaymentSchedules';

  return fetchJson(path);
}

/**
 * getPaymentSchedule
 * Purpose: Fetch a single payment schedule row by schedule ID.
 * Inputs:
 *  - id: string schedule identifier (e.g., 'PS0000001')
 * Outputs:
 *  - Returns a payment schedule object
 */
export async function getPaymentSchedule(id) {
  if (!id) throw new Error('Payment schedule id is required');
  return fetchJson(`/api/PaymentSchedules/${encodeURIComponent(id)}`);
}

/**
 * createPaymentSchedule
 * Purpose: Create a new child payment schedule under a plan.
 * Inputs:
 *  - payload: object containing schedule fields (e.g., { planId, paymentDescription, installmentNo, dueDate, amount, surchargeApplied, surchargeRate, description })
 * Outputs:
 *  - Returns the created schedule object
 */
export async function createPaymentSchedule(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  if (!payload.planId && !payload.PlanId) throw new Error('PlanId is required');
  const body = JSON.stringify(payload);
  return fetchJson('/api/PaymentSchedules', { method: 'POST', body });
}

/**
 * updatePaymentSchedule
 * Purpose: Update an existing payment schedule.
 * Inputs:
 *  - id: string schedule identifier
 *  - payload: object with updated fields
 * Outputs:
 *  - Returns the updated schedule object
 */
export async function updatePaymentSchedule(id, payload) {
  if (!id) throw new Error('Payment schedule id is required');
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson(`/api/PaymentSchedules/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * deletePaymentSchedule
 * Purpose: Delete a payment schedule row by ID.
 * Inputs:
 *  - id: string schedule identifier
 * Outputs:
 *  - Returns nothing (204 expected)
 */
export async function deletePaymentSchedule(id) {
  if (!id) throw new Error('Payment schedule id is required');
  return fetchJson(`/api/PaymentSchedules/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * getPayments
 * Purpose: Fetch payments list with optional filters (customerId, status, date range, pagination).
 * Inputs:
 *  - params: object of query params (e.g., { page, pageSize, customerId, status, fromDate, toDate })
 * Outputs:
 *  - Returns an array or paginated object depending on backend implementation.
 */
export async function getPayments(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });

  const path = query.toString()
    ? `/api/Payments?${query.toString()}`
    : '/api/Payments';

  return fetchJson(path);
}

/**
 * getPayment
 * Purpose: Fetch a single payment by ID.
 * Inputs:
 *  - id: string payment identifier
 * Outputs:
 *  - Returns a payment object
 */
export async function getPayment(id) {
  if (!id) throw new Error('Payment id is required');
  return fetchJson(`/api/Payments/${encodeURIComponent(id)}`);
}

export async function createPayment(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson('/api/Payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * updatePayment
 * Purpose: Update an existing payment via PUT to backend API.
 * Inputs:
 *  - id: string payment identifier
 *  - payload: object with updated payment fields
 * Outputs:
 *  - Returns the updated payment object from the API
 */
export async function updatePayment(id, payload) {
  if (!id) throw new Error('Payment id is required');
  if (!payload || typeof payload !== 'object') throw new Error('Payload is required');
  return fetchJson(`/api/Payments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePayment(id) {
  if (!id) throw new Error('Payment id is required');
  return fetchJson(`/api/Payments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
