import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; 
// example: http://localhost:9090/api

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true
    });

    // Add token automatically
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Global error handler
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response:', response);
        console.log('Response Data:', response.data);
        return response.data;
      },
      (error) => {
        console.error("API Error:", error.response?.data || error.message);

        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "API request failed";

        throw new Error(msg);
      }
    );
  }


  // AUTH

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
    } catch (error) {
      console.error("Signout API error:", error);
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // USER

  getUserProfile() {
    return this.api.get("/user/profile");
  }

  updateUserProfile(userData) {
    return this.api.put("/user/update", userData);
  }

  uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.api.post("/user/profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  }

  // BANK ACCOUNTS
  async createAccount(accountData) {
    return await this.api.post("/accounts", accountData);
  }

  async getAccounts() {
    return await this.api.get("/accounts");
  }

  async deleteAccount(accountId) {
    return await this.api.delete(`/accounts/${accountId}`);
  }
  // TRANSACTIONS
  async getTransactions() {
    try {
      return await this.api.get("/transactions");
    } catch (error) {
      // If backend is not available, return mock data from localStorage
      console.log("Backend not available, using mock transactions");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      return transactions;
    }
  }
  getTotalSpent() {
    return this.api.get("/transactions/total-spent");
  }

  getTransactionCount() {
    return this.api.get("/transactions/count");
  }

  getRecentTransactions() {
  return this.api.get("/transactions/recent");
  }
   
  getFilteredTransactions(startDate, endDate, type) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (type && type !== 'all') params.type = type;
    
    return this.api.get("/transactions", { params });
  }

  addTransaction(data) {
    return this.api.post("/transactions", data);
  }

  deleteTransaction(id) {
    return this.api.delete(`/transactions/${id}`);
  }

  deleteAllTransactions() {
    return this.api.delete("/transactions/delete-all");
  }

  // PDF IMPORT
  async processPdf(file, accountNumber, password = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountNumber", accountNumber);
    formData.append("password", password);

    const result = await this.api.post("/pdf/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // If a new account was created, sync it to profile
    if (result.newAccount && result.accountNumber) {
      await this.syncBankAccountToProfile(result.accountNumber, result.bankName || "HDFC");
    }

    return result;
  }

  // Sync extracted bank account to profile (no longer needed as backend handles this automatically)
  async syncBankAccountToProfile(accountNumber, bankName) {
    // Backend automatically creates accounts during PDF processing
    // This method is kept for compatibility but does nothing
    console.log('Bank account automatically created by backend:', { accountNumber, bankName });
  }

  async processCsv(file, accountNumber) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountNumber", accountNumber);

    const result = await this.api.post("/pdf/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // If a new account was created, sync it to profile
    if (result.newAccount && result.accountNumber) {
      await this.syncBankAccountToProfile(result.accountNumber, result.bankName || "Unknown Bank");
    }

    return result;
  }

  // GOALS
  async getUserGoals() {
    return await this.api.get('/goals');
  }

  async createGoal(goalData) {
    return await this.api.post("/goals", goalData);
  }

  async updateGoal(goalId, goalData) {
    return await this.api.put(`/goals/${goalId}`, goalData);
  }

  async deleteGoal(goalId) {
    return await this.api.delete(`/goals/${goalId}`);
  }

  async contributeToGoal(goalId, amount) {
    return await this.api.post(`/goals/${goalId}/contribute`, { amount });
  }

  async getGoalNudge(goalId) {
    return await this.api.get(`/goals/${goalId}/nudge`);
  }

  // RECURRING PAYMENTS
  async getRecurringPayments() {
    return await this.api.get('/recurring');
  }

  async createRecurringPayment(recurringData) {
    return await this.api.post("/recurring", recurringData);
  }

  async updateRecurringPayment(recurringId, recurringData) {
    return await this.api.put(`/recurring/${recurringId}`, recurringData);
  }

  async deleteRecurringPayment(recurringId) {
    return await this.api.delete(`/recurring/${recurringId}`);
  }

  // SETTINGS
  async changePassword(currentPassword, newPassword) {
    return await this.api.put("/user/change-password", {
      currentPassword,
      newPassword
    });
  }

  async updateSecuritySettings(settings) {
    return await this.api.put("/user/security-settings", settings);
  }

  async setupTwoFactorAuth() {
    return await this.api.post("/user/setup-2fa");
  }

  async verifyTwoFactorAuth(code) {
    return await this.api.post("/user/verify-2fa", { code });
  }

  // AI INSIGHTS - New endpoints
  async startSummaryAnalysis() {
    return await this.api.post('/ai/summary');
  }

  async getAnalysisStatus() {
    return await this.api.get('/ai/status');
  }

  async startRecurringAnalysis() {
    return await this.api.post('/ai/recurring');
  }

  async getRecurringPatterns(accountId) {
    return await this.api.get(`/recurring/account/${accountId}`);
  }

  // ANALYTICS
  async getLatestAnalytics(accountId) {
    try {
      const url = accountId ? `/analytics/latest?accountId=${accountId}` : "/analytics/latest";
      return await this.api.get(url);
    } catch (error) {
      console.log('Analytics API not available, using mock data');
      // Import mock data for testing
      const { mockAnalyticsResponse } = await import('../utils/analyticsTestData.js');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return mockAnalyticsResponse;
    }
  }

  // CATEGORIES
  async getCategories() {
    return await this.api.get("/categories");
  }

  async createCategory(categoryData) {
    return await this.api.post("/categories", categoryData);
  }

  async getCategoryById(categoryId) {
    return await this.api.get(`/categories/${categoryId}`);
  }

  async updateCategory(categoryId, categoryData) {
    return await this.api.put(`/categories/${categoryId}`, categoryData);
  }

  async deleteCategory(categoryId) {
    return await this.api.delete(`/categories/${categoryId}`);
  }
  
}

export default new ApiService();
