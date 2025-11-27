import React, { useState, useEffect } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      await login(formData.email, formData.password)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl mb-4 shadow-xl">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black">Welcome Back!</h2>
          <p className="text-gray-600">Continue your financial journey</p>
        </div>
        
        {error && (
          <div className={`mb-4 p-3 rounded ${
            error.includes('successful') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold mb-2">Email Address *</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="w-full p-3 rounded-xl border" 
              placeholder="you@example.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password *</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="w-full p-3 rounded-xl border" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-3 rounded-xl font-black hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/register" className="text-sm text-purple-700 hover:text-purple-800 font-bold transition-colors">
            Don't have an account? Create one
          </Link>
        </div>
      </div>
    </div>
  )
}