import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getFrontendEnv } from '../config/env';

const envConfig = getFrontendEnv();

export const STORAGE_ACCESS_TOKEN_KEY = 'tiet_access_token';
export const STORAGE_REFRESH_TOKEN_KEY = 'tiet_refresh_token';
export const STORAGE_USER_PROFILE_KEY = 'tiet_authenticated_user';

let accessTokenMemory: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY) : null;
let refreshTokenMemory: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY) : null;
let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}[] = [];

export function setAuthTokens(accessToken: string | null, refreshToken?: string | null): void {
  accessTokenMemory = accessToken;
  if (typeof window !== 'undefined') {
    if (accessToken) {
      window.localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, accessToken);
    } else {
      window.localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
    }
  }
  if (refreshToken !== undefined) {
    refreshTokenMemory = refreshToken;
    if (typeof window !== 'undefined') {
      if (refreshToken) {
        window.localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, refreshToken);
      } else {
        window.localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
      }
    }
  }
}

export function getAccessToken(): string | null {
  if (!accessTokenMemory && typeof window !== 'undefined') {
    accessTokenMemory = window.localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
  }
  return accessTokenMemory;
}

function flushQueue(error: unknown, token: string | null = null): void {
  pendingQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingQueue = [];
}

/**
 * Production Cloud Axios Client configured exclusively via `import.meta.env.VITE_API_BASE_URL`
 * with automatic JWT Bearer token attachment and 401 refresh-token rotation.
 */
export const cloudApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || envConfig.VITE_API_BASE_URL,
  timeout: 4500,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

cloudApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessTokenMemory && config.headers) {
    config.headers.Authorization = `Bearer ${accessTokenMemory}`;
  }
  return config;
});

cloudApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return cloudApi(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || envConfig.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken: refreshTokenMemory },
          { withCredentials: true, timeout: 4000 }
        );

        const rotatedAccess: string | null = refreshRes.data?.tokens?.accessToken || null;
        const rotatedRefresh: string | null = refreshRes.data?.tokens?.refreshToken || null;
        setAuthTokens(rotatedAccess, rotatedRefresh);
        flushQueue(null, rotatedAccess);

        if (rotatedAccess && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${rotatedAccess}`;
        }
        return cloudApi(originalRequest);
      } catch (refreshErr) {
        setAuthTokens(null, null);
        flushQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default cloudApi;

