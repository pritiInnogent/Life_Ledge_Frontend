import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api";

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" }
    });

    // Attach JWT
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Global error handler
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);

        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Server error occurred";

        throw new Error(message);
      }
    );
  }

  // -----------------------------------------
  // BASIC HTTP METHODS
  // -----------------------------------------
  async get(url, config = {}) {
    return this.api.get(url, config);
  }

  async post(url, data, config = {}) {
    return this.api.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return this.api.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.api.delete(url, config);
  }

  // -----------------------------------------
  // AUTH
  // -----------------------------------------
  async login(email, password) {
    return this.api.post("/auth/login", { email, password });
  }

  async register(fullName, email, password, phoneNumber) {
    return this.api.post("/auth/signup", {
      name: fullName,
      email,
      password,
      phoneNumber
    });
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  }

  async getUserProfile() {
    return this.api.get("/user/profile");
  }

  async updateUserProfile(profileData) {
    return this.api.put("/user/update", profileData);
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("file", file);

    return this.api.post("/user/profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  }

  // -----------------------------------------
  // ACCOUNTS + TRANSACTIONS
  // -----------------------------------------
  async createAccount(accountData) {
    return this.api.post("/accounts", accountData);
  }

  async getAccounts() {
    return this.api.get("/accounts");
  }

  async getTransactions(params = {}) {
    return this.api.get("/transactions", { params });
  }

  async addTransaction(data) {
    return this.api.post("/transactions", data);
  }

  // -----------------------------------------
  // 📌 FINAL PDF IMPORT METHOD (single endpoint)
  // -----------------------------------------
  async processPdf(file, accountNumber, password = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountNumber", accountNumber);
    formData.append("password", password);

    return this.api.post("/pdf/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  }
}

export default new ApiService();
