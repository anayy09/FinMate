import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/auth"; // Change this to match your backend API

const authApi = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies (JWT tokens) are sent
});

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
