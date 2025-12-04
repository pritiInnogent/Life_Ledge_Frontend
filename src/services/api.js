import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; 
// example: http://localhost:9090/api

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
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
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newAccount = {
      id: Date.now(),
      ...accountData,
      last4Digits: accountData.accountNumber.slice(-4),
      createdAt: new Date().toISOString()
    };
    
    // Get existing accounts from localStorage
    const existingAccounts = JSON.parse(localStorage.getItem('bankAccounts') || '[]');
    
    // Add new account
    const updatedAccounts = [...existingAccounts, newAccount];
    
    // Save to localStorage
    localStorage.setItem('bankAccounts', JSON.stringify(updatedAccounts));
    
    return newAccount;
  }

  async getAccounts() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get accounts from localStorage
    const accounts = JSON.parse(localStorage.getItem('bankAccounts') || '[]');
    return accounts;
  }

  async deleteAccount(accountId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get existing accounts from localStorage
    const existingAccounts = JSON.parse(localStorage.getItem('bankAccounts') || '[]');
    
    // Remove account with matching ID
    const updatedAccounts = existingAccounts.filter(acc => acc.id !== accountId);
    
    // Save to localStorage
    localStorage.setItem('bankAccounts', JSON.stringify(updatedAccounts));
    
    return { success: true, message: 'Account deleted successfully' };
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

  // PDF IMPORT
  async processPdf(file, accountNumber, password = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountNumber", accountNumber);
    formData.append("password", password);

    return await this.api.post("/pdf/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  processCsv(file, accountNumber) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountNumber", accountNumber);

    return this.api.post("/pdf/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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

  // AI INSIGHTS
  async getInsightsStatus() {
    return await this.api.get("/ai/insights/status");
  }

  async getLatestInsights() {
    return await this.api.get("/ai/latest");
  }

  async analyzeFinancialData() {
    return await this.api.post("/ai/analyze");
  }

  async getCategoryBreakdown() {
    return await this.api.get("/ai/category-breakdown");
  }

  async getRecurringPatterns() {
    return await this.api.get("/ai/recurring-patterns");
  }

  async getAnomalies() {
    return await this.api.get("/ai/anomalies");
  }

  async getNudges() {
    return await this.api.get("/ai/nudges");
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
