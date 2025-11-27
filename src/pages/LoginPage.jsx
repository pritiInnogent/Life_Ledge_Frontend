import React, { useState } from 'react'
import { Wallet, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phoneNumber: '' })
  const [error, setError] = useState('')
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setError('Please fill in all required fields')
      return
    }
    if (!isLogin && formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        navigate('/app/dashboard')
      } else {
        await signup(formData.name, formData.email, formData.password, formData.phoneNumber)
        setError('')
        setFormData({ name: '', email: '', password: '', phoneNumber: '' })
        setIsLogin(true) // Switch to login mode
        // Show success message
        setError('Registration successful! Please login with your credentials.')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">LifeLedger</h1>
              <p className="text-lg text-white/80 font-semibold">Track Smart. Spend Smarter.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm text-white">⚡ AI-Powered Insights</div>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm text-white">🔒 Secure & Private</div>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm text-white">🎯 Smart Budgeting</div>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm text-white">📈 Real-time Analytics</div>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl mb-4 shadow-xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black">{isLogin ? 'Welcome Back!' : 'Join Now!'}</h2>
            <p className="text-gray-600">{isLogin ? 'Continue your financial journey' : 'Start your wealth journey today'}</p>
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
            {!isLogin && (
              <>
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
                  <label className="block text-sm font-bold mb-2">Phone Number</label>
                  <input 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                    className="w-full p-3 rounded-xl border" 
                    placeholder="+91" 
                  />
                </div>
              </>
            )}
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
              <label className="block text-sm font-bold mb-2">Password * {!isLogin && '(min 6 characters)'}</label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className="w-full p-3 rounded-xl border" 
                placeholder="••••••••" 
                minLength={!isLogin ? 6 : undefined}
                required 
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-3 rounded-xl font-black hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg">{isLogin ? 'Login' : 'Create Account'}</button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsLogin(s => !s)} className="text-sm text-purple-700 hover:text-purple-800 font-bold transition-colors">{isLogin ? 'Create account' : 'Have an account? Login'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
