// Thin fetch wrapper around the IMS backend (Express + JWT access/refresh tokens).
// Response envelope from the API is always: { success, message, data?, meta?, errors? }

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let accessToken = localStorage.getItem('ims_access_token') || null;
let refreshToken = localStorage.getItem('ims_refresh_token') || null;

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function setTokens(tokens) {
  accessToken = tokens?.accessToken || null;
  refreshToken = tokens?.refreshToken || null;
  if (accessToken) localStorage.setItem('ims_access_token', accessToken);
  else localStorage.removeItem('ims_access_token');
  if (refreshToken) localStorage.setItem('ims_refresh_token', refreshToken);
  else localStorage.removeItem('ims_refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

export function clearTokens() {
  setTokens({});
}

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let refreshPromise = null;

async function doRefresh() {
  if (!refreshToken) throw new ApiError('No refresh token', 401);
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new ApiError(json.message || 'Session expired', res.status);
        setTokens(json.data);
        return json.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, params, isForm = false, retry = true } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.status === 401 && retry && refreshToken && path !== '/auth/refresh') {
    try {
      await doRefresh();
      return request(path, { method, body, params, isForm, retry: false });
    } catch {
      clearTokens();
      onUnauthorized();
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  if (res.status === 401 && path !== '/auth/login') {
    onUnauthorized();
  }

  if (!json || !json.success) {
    const message = json?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json?.errors);
  }

  return json;
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
  BASE_URL,
};

export { ApiError };
