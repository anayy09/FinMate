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
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Logout API call
export const logout = async () => {
  try {
    await authApi.post("/logout/");
    return { message: "Logged out successfully" };
  } catch (error) {
    throw error.response.data;
  }
};

// Request Password Reset API call
export const requestPasswordReset = async (email) => {
  try {
    const response = await authApi.post("/password-reset/", { email });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Verify Email API call
export const verifyEmail = async (token) => {
  try {
    const response = await authApi.post("/verify-email/", { token });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
