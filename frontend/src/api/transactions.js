import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const transactionApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
transactionApi.interceptors.request.use(
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

// Categories API
export const getCategories = async (categoryType = null) => {
  try {
    const params = categoryType ? { category_type: categoryType } : {};
    const response = await transactionApi.get("/categories/", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await transactionApi.post("/categories/", categoryData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Accounts API
export const getAccounts = async () => {
  try {
    const response = await transactionApi.get("/accounts/");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createAccount = async (accountData) => {
  try {
    const response = await transactionApi.post("/accounts/", accountData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateAccount = async (accountId, accountData) => {
  try {
    const response = await transactionApi.put(`/accounts/${accountId}/`, accountData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateAccountBalance = async (accountId, balance) => {
  try {
    const response = await transactionApi.post(`/accounts/${accountId}/update_balance/`, { balance });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Transactions API
export const getTransactions = async (params = {}) => {
  try {
    const response = await transactionApi.get("/transactions/", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const response = await transactionApi.post("/transactions/", transactionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const response = await transactionApi.put(`/transactions/${transactionId}/`, transactionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    const response = await transactionApi.delete(`/transactions/${transactionId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTransactionAnalytics = async (params = {}) => {
  try {
    const response = await transactionApi.get("/transactions/analytics/", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Budgets API
export const getBudgets = async (month = null) => {
  try {
    const params = month ? { month } : {};
    const response = await transactionApi.get("/budgets/", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createBudget = async (budgetData) => {
  try {
    const response = await transactionApi.post("/budgets/", budgetData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBudget = async (budgetId, budgetData) => {
  try {
    const response = await transactionApi.put(`/budgets/${budgetId}/`, budgetData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Recurring Transactions API
export const getRecurringTransactions = async () => {
  try {
    const response = await transactionApi.get("/recurring-transactions/");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createRecurringTransaction = async (recurringData) => {
  try {
    const response = await transactionApi.post("/recurring-transactions/", recurringData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateRecurringTransaction = async (recurringId, recurringData) => {
  try {
    const response = await transactionApi.put(`/recurring-transactions/${recurringId}/`, recurringData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
