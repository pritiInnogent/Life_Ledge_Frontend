import React, { createContext, useContext, useState, useEffect } from 'react'
import ApiService from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await ApiService.login(email, password)
      console.log('Login response:', response)
      
      if (response.token) {
        localStorage.setItem('token', response.token)
        const userData = {
          userId: response.userId,
          name: response.name,
          email: response.email
        }
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return userData
      } else {
        throw new Error('Invalid login credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (name, email, password, phoneNumber) => {
    try {
      const response = await ApiService.register(name, email, password, phoneNumber)
      return response
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    ApiService.logout()
  }

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}