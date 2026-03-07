const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token');
}

function clearToken() {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth-change'));
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }
  return res;
}

export async function apiJson(path, options = {}) {
  const res = await api(path, options);
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = JSON.parse(text);
      if (data.error) msg = data.error;
    } catch (_) {}
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}

export { getToken, clearToken };
