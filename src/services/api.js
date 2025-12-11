import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9090/api";

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // Attach token automatically
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Global error handler
    this.api.interceptors.response.use(
      (response) => response.data,
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

  /* ============================================================
     AUTH
     ============================================================ */

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
    localStorage.removeItem("lifeledger_user");
  }

  /* ============================================================
     USER
     ============================================================ */

  getUserProfile() {
    return this.api.get("/user/profile");
  }

  updateUserProfile(userData) {
    return this.api.put("/user/update", userData);
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    const response = await axios.post(`${API_BASE_URL}/user/profile-pic`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  /* ============================================================
     BANK ACCOUNTS (UPDATED – CONNECTED TO BACKEND)
     ============================================================ */

  async createAccount(accountData) {
    return await this.api.post("/accounts", accountData);
  }

  async getAccounts() {
    return await this.api.get("/accounts");
  }

  async deleteAccount(accountId) {
    return await this.api.delete(`/accounts/${accountId}`);
  }

  /* ============================================================
     TRANSACTIONS
     ============================================================ */

  async getTransactions(bankAccountId = null, categoryId = null) {
    const params = {};
    if (bankAccountId) params.bankAccountId = bankAccountId;
    if (categoryId) params.categoryId = categoryId;

    return await this.api.get("/transactions", { params });
  }

  async getTransaction(id) {
    return await this.api.get(`/transactions/${id}`);
  }

  async addTransaction(data) {
    return await this.api.post("/transactions", data);
  }

  async updateTransaction(id, data) {
    return await this.api.put(`/transactions/${id}`, data);
  }

  async deleteTransaction(id) {
    return await this.api.delete(`/transactions/${id}`);
  }

  async getRecurringTransactions() {
    return await this.api.get("/transactions/recurring");
  }

  async getAnomalyTransactions() {
    return await this.api.get("/transactions/anomalies");
  }

  async addTransactionCorrection(id, correctionData) {
    return await this.api.post(`/transactions/${id}/correction`, correctionData);
  }

  async getTransactionCorrection(id) {
    return await this.api.get(`/transactions/${id}/correction`);
  }

  /* ============================================================
     IMPORT (PDF / CSV)
     ============================================================ */

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

  /* ============================================================
     GOALS
     ============================================================ */

  async getUserGoals() {
    return await this.api.get("/goals");
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

  /* ============================================================
     RECURRING PAYMENTS
     ============================================================ */

  async getRecurringPayments() {
    return await this.api.get("/recurring");
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

  /* ============================================================
     SETTINGS
     ============================================================ */

  async changePassword(currentPassword, newPassword) {
    return await this.api.put("/user/change-password", {
      currentPassword,
      newPassword,
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

  /* ============================================================
     INSIGHTS
     ============================================================ */

  async getInsightsByAccount(accountId) {
    return await this.api.get(`/insights/account/${accountId}`);
  }

  async createInsight(insightData) {
    return await this.api.post("/insights", insightData);
  }

  async getInsight(id) {
    return await this.api.get(`/insights/${id}`);
  }

  async updateInsight(id, insightData) {
    return await this.api.put(`/insights/${id}`, insightData);
  }

  async deleteInsight(id) {
    return await this.api.delete(`/insights/${id}`);
  }

  /* ============================================================
   CATEGORIES
   ============================================================ */

  // ...existing code...

  // GET all categories
  async getAllCategories() {
    return await this.api.get("/categories");
  }

  // GET single category by id
  async getCategory(id) {
    return await this.api.get(`/categories/${id}`);
  }

  // CREATE category
  async createCategory(categoryData) {
    return await this.api.post("/categories", categoryData);
  }

  // UPDATE category
  async updateCategory(id, categoryData) {
    return await this.api.put(`/categories/${id}`, categoryData);
  }

  // DELETE category
  async deleteCategory(id) {
    return await this.api.delete(`/categories/${id}`);
  }

  /* ============================================================
     AI CATEGORIZATION
     ============================================================ */

  async triggerAiCategorization(userId) {
    return await this.api.post("/ai/analyze", { userId });
  }

  /* ============================================================
     ANALYTICS
     ============================================================ */

  async getLatestAnalytics() {
    return await this.api.get("/analytics");
  }
}

export default new ApiService();
