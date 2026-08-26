import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request — reads from localStorage (client-side only)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token: string | null = parsed?.state?.token ?? null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // invalid JSON — ignore
      }
    }
  }
  // Si el body es FormData, dejar que el navegador establezca el Content-Type
  // con el boundary correcto (multipart/form-data; boundary=...)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Redirect to /login on 401 — except on the login endpoint itself
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
