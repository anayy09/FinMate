import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/auth"; // Change this to match your backend API
const BASE_API_URL = "http://127.0.0.1:8000"; // Base URL for general API calls

const authApi = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies (JWT tokens) are sent
});

// General API instance for non-auth endpoints
const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${BASE_API_URL}/api/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Signup API call
export const signup = async (userData) => {
  try {
    const response = await authApi.post("/signup/", userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Login API call
export const login = async (userData) => {
  try {
    const response = await authApi.post("/login/", userData);
    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Logout API call
export const logout = async () => {
  try {
    const token = localStorage.getItem("refresh_token");
    if (token) {
      await authApi.post("/logout/", { refresh: token });
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return { message: "Logged out successfully" };
  } catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw error.response?.data || { message: "Logout failed" };
  }
};

// Request Password Reset API call
export const requestPasswordReset = async (email) => {
  try {
    const response = await authApi.post("/password-reset-request/", { email });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Reset Password API call
export const resetPassword = async (token, password) => {
  try {
    const response = await authApi.post(`/password-reset/${token}/`, {
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Verify Email API call
export const verifyEmail = async (token) => {
  try {
    const response = await authApi.get(`/verify-email/${token}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Export the general API instance as default
export default api;
