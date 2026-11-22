import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private _client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  get client(): AxiosInstance {
    return this._client;
  }

  constructor() {
    this._client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this._client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = getAccessToken();
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this._client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        interface ExtendedRequestConfig extends InternalAxiosRequestConfig {
          _retryCount?: number;
          _skipRefresh?: boolean;
        }
        interface ErrorResponse {
          error?: {
            message?: string;
          };
        }
        const originalRequest = error.config as ExtendedRequestConfig;
        const retryCount = originalRequest._retryCount ?? 0;

        if (
          error.response?.status === 401 &&
          !originalRequest._skipRefresh &&
          retryCount < 2
        ) {
          originalRequest._retryCount = retryCount + 1;

          const doRefresh = async (): Promise<string> => {
            try {
              const response = await axios.post(
                `${API_URL}/api/auth/refresh`,
                {},
                { withCredentials: true }
              );

              const { accessToken } = response.data.data;
              setAccessToken(accessToken);
              return accessToken;
            } catch (refreshError) {
              const err = refreshError as AxiosError<ErrorResponse>;
              const errorMessage = err.response?.data?.error?.message || '';
              if (errorMessage.includes('concurrent request')) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                throw refreshError;
              }
              clearTokens();
              window.location.href = '/login';
              throw refreshError;
            }
          };

          if (!this.refreshPromise) {
            this.refreshPromise = doRefresh().finally(() => {
              this.refreshPromise = null;
            });
          }

          try {
            const accessToken = await this.refreshPromise;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this._client(originalRequest);
          } catch (refreshError) {
            const err = refreshError as AxiosError<ErrorResponse>;
            const errorMessage = err.response?.data?.error?.message || '';
            if (errorMessage.includes('concurrent request') && retryCount < 1) {
              originalRequest._skipRefresh = true;
              return this._client(originalRequest);
            }
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async signup(data: { name: string; email: string; password: string; confirmPassword: string }) {
    const response = await this._client.post('/auth/signup', data);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this._client.post('/auth/login', data);
    return response.data;
  }

  async logout() {
    const response = await this._client.post('/auth/logout');
    return response.data;
  }

  async me() {
    const response = await this._client.get('/auth/me');
    return response.data;
  }

  async refresh() {
    const response = await this._client.post('/auth/refresh');
    return response.data;
  }
}

export const api = new ApiClient();