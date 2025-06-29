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

// Notifications API
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/notifications/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.post(`/notifications/${notificationId}/mark_as_read/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.post('/notifications/mark_all_as_read/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/notifications/unread_count/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Notification Preferences API
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get('/notification-preferences/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await api.post('/notification-preferences/bulk_update/', {
      preferences
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// AI Insights API
export const getAIInsights = async (params = {}) => {
  try {
    const response = await api.get('/ai-insights/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generateAIInsights = async () => {
  try {
    const response = await api.post('/ai-insights/generate_insights/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markInsightActionTaken = async (insightId) => {
  try {
    const response = await api.post(`/ai-insights/${insightId}/mark_action_taken/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const provideInsightFeedback = async (insightId, isRelevant, feedback = '') => {
  try {
    const response = await api.post(`/ai-insights/${insightId}/provide_feedback/`, {
      is_relevant: isRelevant,
      feedback
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Savings Goals API
export const getSavingsGoals = async () => {
  try {
    const response = await api.get('/savings-goals/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createSavingsGoal = async (goalData) => {
  try {
    const response = await api.post('/savings-goals/', goalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateSavingsGoal = async (goalId, goalData) => {
  try {
    const response = await api.put(`/savings-goals/${goalId}/`, goalData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addSavingsToGoal = async (goalId, amount) => {
  try {
    const response = await api.post(`/savings-goals/${goalId}/add_savings/`, { amount });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateGoalStatus = async (goalId, status) => {
  try {
    const response = await api.post(`/savings-goals/${goalId}/update_status/`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Expense Prediction API
export const getExpensePrediction = async (category = null) => {
  try {
    const params = category ? { category } : {};
    const response = await api.get('/expense-prediction/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const trainPredictionModel = async () => {
  try {
    const response = await api.post('/expense-prediction/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Anomaly Detection API
export const getAnomalies = async (daysBack = 30) => {
  try {
    const response = await api.get('/anomaly-detection/', { 
      params: { days_back: daysBack } 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const triggerAnomalyDetection = async () => {
  try {
    const response = await api.post('/anomaly-detection/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Budget Insights API
export const getBudgetInsights = async () => {
  try {
    const response = await api.get('/budget-insights/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Weekly Summary API
export const getWeeklySummary = async () => {
  try {
    const response = await api.get('/weekly-summary/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const requestWeeklySummaryEmail = async () => {
  try {
    const response = await api.post('/weekly-summary/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  
  // Notification Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  
  // AI Insights
  getAIInsights,
  generateAIInsights,
  markInsightActionTaken,
  provideInsightFeedback,
  
  // Savings Goals
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  addSavingsToGoal,
  updateGoalStatus,
  
  // ML Features
  getExpensePrediction,
  trainPredictionModel,
  getAnomalies,
  triggerAnomalyDetection,
  
  // Analytics
  getBudgetInsights,
  getWeeklySummary,
  requestWeeklySummaryEmail
};
