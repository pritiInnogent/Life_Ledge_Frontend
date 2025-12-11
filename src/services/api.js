// src/services/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {},   // IMPORTANT: allow axios to auto-handle Content-Type
      withCredentials: true,
    });

    // Inject JWT token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Global error handling
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Request failed";

        throw new Error(msg);
      }
    );
  }

  /* ==============================
              AUTH
  =============================== */
  async login(email, password) {
    const res = await this.api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.token);
    return res;
  }

  async register(name, email, password, phoneNumber) {
    return this.api.post("/auth/signup", {
      name,
      email,
      password,
      phoneNumber,
    });
  }

  async signout() {
    try {
      await this.api.post("/auth/signout");
    } catch {}
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  /* ==============================
          USER
  =============================== */
  getUserProfile() {
    return this.api.get("/user/profile");
  }

  updateUserProfile(data) {
    return this.api.put("/user/update", data);
  }

  uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("file", file);

    return this.api.post("/user/profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /* ==============================
         BANK ACCOUNTS
  =============================== */
  getAccounts() {
    return this.api.get("/accounts");
  }

  createAccount(data) {
    return this.api.post("/accounts", data);
  }

  deleteAccount(id) {
    return this.api.delete(`/accounts/${id}`);
  }

  /* ==============================
       TRANSACTIONS
  =============================== */
  getTransactions() {
    return this.api.get("/transactions");
  }

  /* ==============================
          AI INSIGHTS
  =============================== */

  // POST endpoints - trigger AI processing
  startAIAnalysis(accountId) {
    const formData = new FormData();
    formData.append('accountId', accountId);
    return this.api.post('/ai/analyze', formData);
  }

  startCategorization(accountId) {
    const formData = new FormData();
    formData.append('accountId', accountId);
    return this.api.post('/ai/categorize', formData);
  }

  startRecurringAnalysis(accountId) {
    const formData = new FormData();
    formData.append('accountId', accountId);
    return this.api.post('/ai/recurring', formData);
  }

  startAnomalyDetection(accountId) {
    const formData = new FormData();
    formData.append('accountId', accountId);
    return this.api.post('/ai/anomalies', formData);
  }

  startSummaryGeneration(accountId) {
    const formData = new FormData();
    formData.append('accountId', accountId);
    return this.api.post('/ai/summary', formData);
  }

  // GET endpoints - check status
  getAIStatus() {
    return this.api.get('/ai/status');
  }

  getAIStepStatus(step) {
    return this.api.get(`/ai/status/${step}`);
  }

  // GET endpoints - retrieve stored insights
  async getInsightsSummary(accountId) {
    const response = await this.api.get(`/insights/account/${accountId}`);
    
    // Parse aiText if it's a JSON string
    if (response.aiText && typeof response.aiText === 'string') {
      try {
        response.parsedInsights = JSON.parse(response.aiText);
      } catch (error) {
        console.error('Failed to parse aiText:', error);
        response.parsedInsights = null;
      }
    }
    
    return response;
  }

  getCategories() {
    return this.api.get('/categories');
  }

  getRecurringPatterns(accountId) {
    return this.api.get(`/recurring/account/${accountId}`);
  }

  getRecurringPayments(accountId) {
    return this.api.get(`/recurring/account/${accountId}`);
  }

  getAnomaliesData(accountId) {
    return this.api.get(`/anomalies/account/${accountId}`);
  }

  /* ==============================
       FILE PROCESSING
  =============================== */
  processPdf(file, accountNumber, password = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountNumber', accountNumber);
    if (password) {
      formData.append('password', password);
    }
    
    return this.api.post('/pdf/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  processCsv(file, accountNumber) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountNumber', accountNumber);
    
    return this.api.post('/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  addTransaction(transactionData) {
    return this.api.post('/transactions', transactionData);
  }

  /* ==============================
         ANALYTICS
  =============================== */
  getLatestAnalytics(accountId) {
    return this.api.get(`/analytics/latest?accountId=${accountId}`);
  }

  // Dashboard related methods
  getRecentTransactions() {
    return this.api.get('/transactions/recent');
  }

  getTotalSpent() {
    return this.api.get('/transactions/total-spent');
  }

  getTransactionCount() {
    return this.api.get('/transactions/count');
  }

  getLatestInsights() {
    return this.api.get('/insights/latest');
  }

  getUserGoals() {
    return this.api.get('/goals');
  }
}

export default new ApiService();
