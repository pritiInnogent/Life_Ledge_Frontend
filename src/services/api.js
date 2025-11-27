import axios from "axios";

const API_BASE_URL = "http://localhost:9090/api";

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      withCredentials: false,
      timeout: 10000
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
        console.error("API Error:", error);
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          throw new Error('Backend server is not running. Please start the backend server on port 9090.');
        }
        
        if (error.response?.status === 403) {
          throw new Error('CORS error. Please configure CORS in backend to allow http://localhost:5173');
        }
        
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
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
    try {
      const response = await this.api.post("/auth/login", { email, password });
      return response;
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  }

  async register(fullName, email, password, phoneNumber) {
    try {
      const response = await this.api.post("/auth/signup", {
        name: fullName,
        email,
        password,
        phoneNumber
      });
      return response;
    } catch (error) {
      console.error('Register API Error:', error);
      throw error;
    }
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

// import axios from 'axios'

// const API_BASE_URL = '/api'

// class ApiService {
//   constructor() {
//     this.api = axios.create({
//       baseURL: API_BASE_URL,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     })

//     // Request interceptor to add auth token
//     this.api.interceptors.request.use((config) => {
//       const token = localStorage.getItem('token')
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`
//       }
//       return config
//     })

//     // Response interceptor for error handling
//     this.api.interceptors.response.use(
//       (response) => response.data,
//       (error) => {
//         console.error('API Error:', error.response?.data || error.message)
//         const message = error.response?.data?.message || error.response?.data?.error || error.message || 'API request failed'
//         throw new Error(message)
//       }
//     )
//   }

//   // Auth endpoints
//   async login(email, password) {
//     // Mock login for development
//     if (!email || !password) {
//       throw new Error('Email and password are required')
//     }
    
//     await new Promise(resolve => setTimeout(resolve, 500))
    
//     return {
//       token: 'mock-jwt-token-' + Date.now(),
//       userId: 1,
//       email: email,
//       name: email.split('@')[0]
//     }
//   }

//   async register(name, email, password, phoneNumber) {
//     // Mock registration for development
//     if (!name || !email || !password) {
//       throw new Error('Name, email and password are required')
//     }
    
//     await new Promise(resolve => setTimeout(resolve, 500))
    
//     return {
//       userId: Math.floor(Math.random() * 1000),
//       message: 'Registration successful'
//     }
//   }

//   // Logout is handled client-side only since backend doesn't have logout endpoint
//   logout() {
//     // No backend call needed - just clear client-side data
//     return Promise.resolve()
//   }

//   // User endpoints
//   async getUserProfile(userId) {
//     return this.api.get(`/users/${userId}`)
//   }

//   async updateUserProfile(userId, userData) {
//     return this.api.put(`/users/${userId}`, userData)
//   }

//   async uploadProfilePicture(userId, file) {
//     const formData = new FormData()
//     formData.append('file', file)
//     return this.api.post(`/users/${userId}/profile-pic`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     })
//   }

//   // Account endpoints
//   async createAccount(accountData) {
//     return this.api.post('/accounts', accountData)
//   }

//   async getAccounts(userId) {
//     return this.api.get(`/accounts?userId=${userId}`)
//   }

//   // Category endpoints
//   async getAllCategories() {
//     return this.api.get('/categories')
//   }

//   // Transaction endpoints
//   async getAllTransactions() {
//     return this.api.get('/transactions')
//   }


// }

// export default new ApiService()