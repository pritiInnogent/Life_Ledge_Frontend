import React, { createContext, useContext, useEffect, useState } from 'react'
import apiService from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const loginTime = localStorage.getItem('loginTime')
    
    if (token && storedUser && loginTime) {
      const currentTime = Date.now()
      const dayInMs = 24 * 60 * 60 * 1000 // 24 hours
      
      if (currentTime - parseInt(loginTime) > dayInMs) {
        // Auto logout after 24 hours
        clearAuthData()
      } else {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          // Load fresh profile data to get profile picture
          loadUserProfile(userData)
        } catch (error) {
          clearAuthData()
        }
      }
    }
    setLoading(false)
  }, [])

  const loadUserProfile = async (currentUser) => {
    try {
      const profile = await apiService.getUserProfile()
      const updatedUser = {
        ...currentUser,
        name: profile.name || currentUser.name,
        email: profile.email || currentUser.email,
        profilePicUrl: profile.profilePicUrl,
        phoneNumber: profile.phoneNumber
      }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (error) {
      console.log('Failed to load profile:', error)
      // Keep existing user data if profile load fails
    }
  }

  const clearAuthData = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('loginTime')
    setUser(null)
  }

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('loginTime', Date.now().toString())
      
      // Create user object from login response
      const user = {
        userId: response.userId,
        email: response.email || email,
        name: response.name || email.split('@')[0]
      }
      
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      
      // Load complete profile data including profile picture
      loadUserProfile(user)
      
      return user
    } catch (error) {
      throw error
    }
  }

  const signup = async (name, email, password, phoneNumber) => {
    try {
      const response = await apiService.register(name, email, password, phoneNumber)
      if (response.userId) {
        return response // Just return registration response, don't auto-login
      }
      throw new Error('Registration failed')
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.signout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      clearAuthData()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
