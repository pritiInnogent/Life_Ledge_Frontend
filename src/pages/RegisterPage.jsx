import React, { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phoneNumber: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      await register(formData.name, formData.email, formData.password, formData.phoneNumber)
      navigate('/login', { state: { message: 'Registration successful! Please login with your credentials.' } })
    } catch (err) {
      setError(err.message || 'Registration failed')
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
          <h2 className="text-2xl font-black">Join LifeLedger</h2>
          <p className="text-gray-600">Start your financial journey today</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold mb-2">Full Name *</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full p-3 rounded-xl border" 
              placeholder="John Doe" 
              required 
            />
          </div>
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
            <label className="block text-sm font-bold mb-2">Password * (min 6 characters)</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="w-full p-3 rounded-xl border" 
              placeholder="••••••••" 
              minLength={6}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Phone Number</label>
            <input 
              value={formData.phoneNumber} 
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
              className="w-full p-3 rounded-xl border" 
              placeholder="+1 (555) 123-4567" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-3 rounded-xl font-black hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-purple-700 hover:text-purple-800 font-bold transition-colors">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  )
}