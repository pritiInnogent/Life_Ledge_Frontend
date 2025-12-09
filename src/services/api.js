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

  async getUserProfile() {
    try {
      return await this.api.get("/user/profile");
    } catch (error) {
      console.log("Backend unavailable → using mock profile");
      // Return mock profile data
      const mockProfile = {
        name: "John Doe",
        email: "john.doe@example.com",
        phoneNumber: "+1234567890",
        profilePicUrl: "",
        createdAt: new Date().toISOString()
      };
      return mockProfile;
    }
  }

  updateUserProfile(userData) {
    return this.api.put("/user/update", userData);
  }

  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      return await this.api.post("/user/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } catch (error) {
      console.log("Backend unavailable → using mock upload");
      // Mock successful upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        url: URL.createObjectURL(file),
        message: "Profile picture uploaded successfully (mock)"
      };
    }
  }

  // BANK ACCOUNTS
  async createAccount(accountData) {
    console.log('Creating account with data:', accountData);
    return await this.api.post("/accounts", accountData);
  }

  async getAccounts() {
    try {
      return await this.api.get("/accounts");
    } catch (error) {
      console.log("Backend unavailable → using mock accounts");
      // Return mock accounts for fallback
      const mockAccounts = [
        { id: 1, bankName: "HDFC Bank", last4Digits: "1234" },
        { id: 2, bankName: "ICICI Bank", last4Digits: "5678" }
      ];
      return mockAccounts;
    }
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
  // TRANSACTIONS
async getTransactions(bankAccountId = null) {
  try {
    const params = {};
    if (bankAccountId) params.bankAccountId = bankAccountId;

    return await this.api.get("/transactions", { params });
  } catch (error) {
    console.log("Backend unavailable → using mock transactions");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if we have stored transactions, otherwise create mock data
    let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    
    if (transactions.length === 0) {
      // Create mock transactions with categories
      const mockTransactions = [
        { id: 1, merchant: "Swiggy", amount: 450, categoryName: "Food & Dining", date: "2024-01-15", typeTransaction: "debit" },
        { id: 2, merchant: "Uber", amount: 280, categoryName: "Transportation", date: "2024-01-14", typeTransaction: "debit" },
        { id: 3, merchant: "Amazon", amount: 1200, categoryName: "Shopping", date: "2024-01-13", typeTransaction: "debit" },
        { id: 4, merchant: "Netflix", amount: 199, categoryName: "Entertainment", date: "2024-01-12", typeTransaction: "debit" },
        { id: 5, merchant: "BSES", amount: 850, categoryName: "Utilities", date: "2024-01-11", typeTransaction: "debit" },
        { id: 6, merchant: "Apollo Pharmacy", amount: 320, categoryName: "Healthcare", date: "2024-01-10", typeTransaction: "debit" },
        { id: 7, merchant: "Zomato", amount: 380, categoryName: "Food & Dining", date: "2024-01-09", typeTransaction: "debit" },
        { id: 8, merchant: "Ola", amount: 150, categoryName: "Transportation", date: "2024-01-08", typeTransaction: "debit" },
        { id: 9, merchant: "Flipkart", amount: 890, categoryName: "Shopping", date: "2024-01-07", typeTransaction: "debit" },
        { id: 10, merchant: "Spotify", amount: 119, categoryName: "Entertainment", date: "2024-01-06", typeTransaction: "debit" }
      ];
      localStorage.setItem("transactions", JSON.stringify(mockTransactions));
      transactions = mockTransactions;
    }
    
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

  async deleteTransaction(transactionId) {
    return await this.api.delete(`/transactions/${transactionId}`);
  }

  async deleteAllTransactions() {
    return await this.api.delete("/transactions/delete-all");
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
    try {
      // Since there's no GET /api/recurring endpoint, we'll need to get by account
      // First get user accounts, then get patterns for each account
      const accounts = await this.getAccounts();
      if (accounts.length === 0) return [];
      
      // Get patterns for the first account (or all accounts)
      const patterns = await this.getRecurringPatternsByAccount(accounts[0].id);
      return patterns;
    } catch (error) {
      console.log("Backend unavailable → using mock recurring patterns");
      return [];
    }
  }

  async getRecurringPatternsByAccount(bankAccountId) {
    try {
      return await this.api.get(`/recurring/account/${bankAccountId}`);
    } catch (error) {
      console.log("Backend unavailable → using mock patterns for account");
      return [];
    }
  }

  async getRecurringPatternsByUser(userId) {
    return await this.api.get(`/recurring/user/${userId}`);
  }

  async createRecurringPattern(recurringData) {
    return await this.api.post("/recurring", recurringData);
  }

  async updateRecurringPattern(recurringId, recurringData) {
    return await this.api.put(`/recurring/${recurringId}`, recurringData);
  }

  async deleteRecurringPattern(recurringId) {
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
    try {
      return await this.api.get("/ai/insights/status");
    } catch (error) {
      console.log("Backend unavailable → using mock insights status");
      return { status: "completed", lastAnalysis: new Date().toISOString() };
    }
  }

  async getLatestInsights() {
    try {
      return await this.api.get("/ai/latest");
    } catch (error) {
      console.log("Backend unavailable → using mock latest insights");
      throw new Error("No insights available");
    }
  }

  async analyzeFinancialData() {
    try {
      return await this.api.post("/ai/analyze");
    } catch (error) {
      console.log("Backend unavailable → using mock analysis");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: "Analysis completed", status: "success" };
    }
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
    try {
      return await this.api.get("/categories");
    } catch (error) {
      console.log("Backend unavailable → using mock categories");
      // Return mock categories data
      const mockCategories = [
        { id: 1, name: "Food & Dining", description: "Restaurants, groceries, food delivery" },
        { id: 2, name: "Transportation", description: "Fuel, public transport, ride sharing" },
        { id: 3, name: "Shopping", description: "Clothing, electronics, general shopping" },
        { id: 4, name: "Entertainment", description: "Movies, games, subscriptions" },
        { id: 5, name: "Utilities", description: "Electricity, water, internet, phone" },
        { id: 6, name: "Healthcare", description: "Medical expenses, pharmacy, insurance" },
        { id: 7, name: "Travel", description: "Hotels, flights, vacation expenses" },
        { id: 8, name: "Education", description: "Books, courses, tuition fees" }
      ];
      return mockCategories;
    }
  }

  async createCategory(categoryData) {
    try {
      return await this.api.post("/categories", categoryData);
    } catch (error) {
      console.log("Backend unavailable → using mock create");
      // Simulate successful creation
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: Date.now(), ...categoryData, message: "Category created successfully" };
    }
  }

  async getCategoryById(categoryId) {
    return await this.api.get(`/categories/${categoryId}`);
  }

  async updateCategory(categoryId, categoryData) {
    console.log(`Calling PUT /api/categories/${categoryId}`, categoryData);
    return await this.api.put(`/categories/${categoryId}`, {
      name: categoryData.name,
      icon: categoryData.icon,
      type: categoryData.type
    });
  }

  async deleteCategory(categoryId) {
    console.log(`Calling DELETE /api/categories/${categoryId}`);
    return await this.api.delete(`/categories/${categoryId}`);
  }

  async getTransactionsByCategory(categoryId) {
    return await this.api.get(`/categories/by-category/${categoryId}`);
  }

  async getBankAccountsLast4() {
  return await this.api.get("/accounts/last4");
}

async getAnalyticsDashboard(accountId) {
  try {
    return await this.api.get(`/analytics/dashboard`, {
      params: { accountId }
    });
  } catch (error) {
    console.log("Backend unavailable → using mock analytics");
    return {
      totalSpent: 45000,
      totalIncome: 75000,
      transactionCount: 156,
      categories: []
    };
  }
}
// IMAGE OCR (masked screenshot upload)
// IMAGE OCR (cropped screenshot upload)
async processImage(file, bankAccountId) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("bankAccountId", bankAccountId);

  return await this.api.post("/ocr/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}


};
export default new ApiService();
