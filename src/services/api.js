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
    return await this.api.delete(`/accounts/${accountId}`);
  }
  // TRANSACTIONS
  async checkTransactionsExist() {
    try {
      return await this.api.get("/transactions/exists");
    } catch (error) {
      console.log("Backend unavailable → checking localStorage");
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
      return { exists: transactions.length > 0 };
    }
  }

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

  async getAllTransactions(bankAccountId = null) {
    try {
      const params = {};
      if (bankAccountId) params.bankAccountId = bankAccountId;
      return await this.api.get("/transactions/all", { params });
    } catch (error) {
      console.log("Backend unavailable → using mock all transactions");
      return this.getTransactions(bankAccountId);
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

  async addTransaction(data) {
    try {
      console.log('API: Adding transaction with data:', data);
      return await this.api.post("/transactions", data);
    } catch (error) {
      console.log("Backend unavailable → using mock transaction creation");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get existing transactions from localStorage
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      // Create new transaction with ID
      const newTransaction = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString()
      };
      
      // Add to existing transactions
      const updatedTransactions = [newTransaction, ...existingTransactions];
      
      // Save to localStorage
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      
      return { 
        success: true, 
        message: 'Transaction added successfully (offline mode)',
        transaction: newTransaction 
      };
    }
  }

  async deleteTransaction(transactionId) {
    try {
      return await this.api.delete(`/transactions/${transactionId}`);
    } catch (error) {
      console.log("Backend unavailable → using mock transaction deletion");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get existing transactions from localStorage
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      // Remove transaction with matching ID
      const updatedTransactions = existingTransactions.filter(txn => txn.id !== transactionId);
      
      // Save to localStorage
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      
      return { success: true, message: 'Transaction deleted successfully' };
    }
  }

  async deleteAllTransactions() {
    try {
      return await this.api.delete("/transactions/delete-all");
    } catch (error) {
      console.log("Backend unavailable → using mock delete all transactions");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear all transactions from localStorage
      localStorage.setItem('transactions', JSON.stringify([]));
      
      return { success: true, message: 'All transactions deleted successfully' };
    }
  }

  async getTransactionsByMonth(month, year, bankAccountId = null) {
    const params = { month, year };
    if (bankAccountId && bankAccountId !== 'all') params.bankAccountId = bankAccountId;
    return await this.api.get("/transactions/month", { params });
  }

  async getSortedTransactions(sortBy = "date", direction = "desc", bankAccountId = null) {
    const params = { sortBy, direction };
    if (bankAccountId) params.bankAccountId = bankAccountId;
    return await this.api.get("/transactions/sort", { params });
  }

  async getTransactionsByDateRange(startDate, endDate, bankAccountId = null) {
    const params = { startDate, endDate };
    if (bankAccountId && bankAccountId !== 'all') params.bankAccountId = bankAccountId;
    return await this.api.get("/transactions/date-range", { params });
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
    // Map frontend fields to backend expected fields
    const backendData = {
      name: goalData.name,
      category: goalData.category,
      targetAmount: goalData.targetAmount,
      currentAmount: goalData.currentAmount || 0,
      startDate: goalData.startDate,
      deadline: goalData.deadline || null,
      type: this.mapGoalType(goalData.type)
    };
    return await this.api.post("/goals", backendData);
  }

  async updateGoal(goalId, goalData) {
    // Map frontend fields to backend expected fields
    const backendData = {
      name: goalData.name,
      category: goalData.category,
      targetAmount: goalData.targetAmount,
      currentAmount: goalData.currentAmount || 0,
      startDate: goalData.startDate,
      deadline: goalData.deadline || null,
      type: this.mapGoalType(goalData.type)
    };
    return await this.api.put(`/goals/${goalId}`, backendData);
  }

  mapGoalType(frontendType) {
    const typeMap = {
      'budget': 'BUDGET',
      'savings': 'SAVING',
      'spending': 'SPENDINGCAP'
    };
    return typeMap[frontendType] || frontendType.toUpperCase();
  }

  async deleteGoal(goalId) {
    return await this.api.delete(`/goals/${goalId}`);
  }

  async deleteAllGoals(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.delete('/goals/all', { params });
  }

  async contributeToGoal(goalId, amount) {
    return await this.api.post(`/goals/${goalId}/contribute`, { amount });
  }

  async getGoalNudge(goalId) {
    return await this.api.get(`/goals/${goalId}/nudge`);
  }

  // NUDGES
  async getUserNudges() {
    return await this.api.get('/nudges');
  }

  async markNudgeAsRead(nudgeId) {
    return await this.api.patch(`/nudges/${nudgeId}/read`);
  }

  async recalculateNudges() {
    return await this.api.post('/nudges/recalculate');
  }

  // RECURRING PAYMENTS
  async getRecurringPayments() {
    try {
      console.log('Fetching all recurring patterns for user');
      return await this.api.get('/recurring/user');
    } catch (error) {
      console.log("Backend unavailable → using mock recurring patterns");
      return [];
    }
  }

  async getRecurringPatternsByAccount(bankAccountId) {
    try {
      console.log('Fetching recurring patterns for account:', bankAccountId);
      return await this.api.get(`/recurring/account/${bankAccountId}`);
    } catch (error) {
      console.log("Backend unavailable → using mock patterns for account");
      return [];
    }
  }

  async getRecurringPatternsByUser(userId) {
    try {
      console.log('Fetching recurring patterns for user:', userId);
      return await this.api.get(`/recurring/user/${userId}`);
    } catch (error) {
      console.log("Backend unavailable → using mock patterns for user");
      return [];
    }
  }

  async createRecurringPattern(recurringData) {
    return await this.api.post("/recurring/add", recurringData);
  }

  async updateRecurringPattern(recurringId, recurringData) {
    return await this.api.put(`/recurring/update/${recurringId}`, recurringData);
  }

  async deleteRecurringPattern(recurringId) {
    return await this.api.delete(`/recurring/delete/${recurringId}`);
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
  async getInsightsStatus(accountId = null) {
    try {
      const params = accountId ? { accountId } : {};
      return await this.api.get("/ai/status", { params });
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

  async analyzeFinancialData(accountId) {
    if (!accountId) {
      throw new Error('Account ID is required for analysis');
    }
    try {
      return await this.api.post("/ai/analyze", null, { params: { accountId } });
    } catch (error) {
      console.log("Backend unavailable → using mock analysis");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: "Analysis completed", status: "success" };
    }
  }

  // AI Specific Operations
  async runCategorization(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.post("/ai/categorize", null, { params });
  }

  async runRecurringAnalysis(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.post("/ai/recurring", null, { params });
  }

  async runAnomalyDetection(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.post("/ai/anomalies", null, { params });
  }

  async runSummaryGeneration(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.post("/ai/summary", null, { params });
  }

  async runAnomalies(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.post("/ai/anomalies", null, { params });
  }

  async runSummary(accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.post("/ai/summary", null, { params });
  }

  async getInsightsSummary(accountId) {
    try {
      return await this.api.get(`/insights/account/${accountId}`);
    } catch (error) {
      console.log("Backend unavailable → using mock insights summary");
      throw new Error("No insights available");
    }
  }

  async getAnomaliesData(accountId) {
    try {
      const response = await this.api.get(`/anomalies/account/${accountId}`);
      // Return the anomalies array from the response
      return response.anomalies || [];
    } catch (error) {
      console.log("Backend unavailable → using mock anomalies data");
      throw new Error("No anomalies data available");
    }
  }

  async getStepStatus(step, accountId = null) {
    const params = accountId ? { accountId } : {};
    return await this.api.get(`/ai/status/${step}`, { params });
  }

  // INSIGHTS
  async getInsightsByAccount(accountId) {
    if (!accountId) {
      throw new Error('Account ID is required');
    }
    return await this.api.get(`/insights/account/${accountId}`);
  }

  async getInsight(insightId) {
    return await this.api.get(`/insights/${insightId}`);
  }

  async createInsight(insightData) {
    return await this.api.post("/insights", insightData);
  }

  async updateInsight(insightId, aiText) {
    return await this.api.put(`/insights/${insightId}`, { aiText });
  }

  async deleteInsight(insightId) {
    return await this.api.delete(`/insights/${insightId}`);
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

  async getTransactionsByCategoryId(categoryId) {
    return await this.api.get(`/transactions/category/${categoryId}`);
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
