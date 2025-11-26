import axios from 'axios'

const API_BASE_URL = '/api'

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'API request failed'
        throw new Error(message)
      }
    )
  }

  // Auth endpoints
  async login(email, password) {
    // Mock login for development
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      token: 'mock-jwt-token-' + Date.now(),
      userId: 1,
      email: email,
      name: email.split('@')[0]
    }
  }

  async register(name, email, password, phoneNumber) {
    // Mock registration for development
    if (!name || !email || !password) {
      throw new Error('Name, email and password are required')
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      userId: Math.floor(Math.random() * 1000),
      message: 'Registration successful'
    }
  }

  // Logout is handled client-side only since backend doesn't have logout endpoint
  logout() {
    // No backend call needed - just clear client-side data
    return Promise.resolve()
  }

  // User endpoints
  async getUserProfile(userId) {
    return this.api.get(`/users/${userId}`)
  }

  async updateUserProfile(userId, userData) {
    return this.api.put(`/users/${userId}`, userData)
  }

  async uploadProfilePicture(userId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.api.post(`/users/${userId}/profile-pic`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // Account endpoints
  async createAccount(accountData) {
    return this.api.post('/accounts', accountData)
  }

  async getAccounts(userId) {
    return this.api.get(`/accounts?userId=${userId}`)
  }

  // Category endpoints
  async getAllCategories() {
    return this.api.get('/categories')
  }

  // Transaction endpoints
  async getAllTransactions() {
    return this.api.get('/transactions')
  }


}

export default new ApiService()