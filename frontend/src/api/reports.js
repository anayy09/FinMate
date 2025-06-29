import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
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
            `http://127.0.0.1:8000/api/auth/token/refresh/`,
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

// Financial Reports API
export const getReportTypes = async () => {
  try {
    const response = await api.get('/reports/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generateReport = async (reportData) => {
  try {
    const response = await api.post('/reports/', reportData, {
      responseType: reportData.format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const downloadReport = async (reportData) => {
  try {
    const response = await api.post('/reports/', reportData, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const fileExtension = reportData.format === 'pdf' ? 'pdf' : 'csv';
    const fileName = `financial_report_${reportData.period}.${fileExtension}`;
    link.setAttribute('download', fileName);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, fileName };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const emailReport = async (emailData) => {
  try {
    const response = await api.post('/reports/email/', emailData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Enhanced Plaid Sync API
export const getPlaidSyncStatus = async () => {
  try {
    const response = await api.get('/plaid/sync/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const triggerPlaidSync = async (accountId = null, forceSync = false) => {
  try {
    const response = await api.post('/plaid/sync/', {
      account_id: accountId,
      force_sync: forceSync
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Bank Account Management API
export const getBankAccounts = async () => {
  try {
    const response = await api.get('/bank-accounts/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBankAccountSettings = async (accountId, settings) => {
  try {
    const response = await api.patch(`/bank-accounts/${accountId}/`, settings);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const disconnectBankAccount = async (accountId) => {
  try {
    const response = await api.delete(`/bank-accounts/${accountId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// User Profile Settings API
export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.patch('/user/profile/', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateReportSettings = async (settings) => {
  try {
    const response = await api.patch('/user/profile/', {
      report_email_frequency: settings.frequency,
      auto_sync_enabled: settings.autoSync
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Report History API (if implemented)
export const getReportHistory = async () => {
  try {
    const response = await api.get('/reports/history/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteReportFromHistory = async (reportId) => {
  try {
    const response = await api.delete(`/reports/history/${reportId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  // Reports
  getReportTypes,
  generateReport,
  downloadReport,
  emailReport,
  getReportHistory,
  deleteReportFromHistory,
  
  // Plaid Sync
  getPlaidSyncStatus,
  triggerPlaidSync,
  
  // Bank Accounts
  getBankAccounts,
  updateBankAccountSettings,
  disconnectBankAccount,
  
  // User Profile
  getUserProfile,
  updateUserProfile,
  updateReportSettings
};
