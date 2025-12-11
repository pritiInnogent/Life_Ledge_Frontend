import React, { useState, useEffect } from 'react'
import { DollarSign, Clock, AlertCircle, Repeat, Bell, TrendingUp } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'



export default function RecurringPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')
  const [upcomingPatterns, setUpcomingPatterns] = useState([])
  const [patternsLoading, setPatternsLoading] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (accountFilter !== 'all') {
      loadSubscriptions()
      loadUpcomingPatterns()
    } else {
      setSubscriptions([])
      setUpcomingPatterns([])
      setLoading(false)
    }
  }, [accountFilter])

  const loadAccounts = async () => {
    try {
      const data = await ApiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }
  
  const loadSubscriptions = async () => {
    if (accountFilter === 'all') return
    
    try {
      setLoading(true)
      setError(null)
      
      const data = await ApiService.getRecurringPayments(accountFilter)
      setSubscriptions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading subscriptions:', err)
      setError(err.message)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const loadUpcomingPatterns = async () => {
    if (accountFilter === 'all') return
    
    try {
      setPatternsLoading(true)
      const data = await ApiService.getRecurringPatterns(accountFilter)
      setUpcomingPatterns(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading patterns:', err)
      setUpcomingPatterns([])
    } finally {
      setPatternsLoading(false)
    }
  }

  const renderPatternsContent = () => {
    if (patternsLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Analyzing patterns...</p>
        </div>
      )
    }

    if (upcomingPatterns.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingPatterns.map((pattern) => (
            <div key={pattern.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-black text-lg text-gray-800">{pattern.merchant}</h4>
                  <p className="text-sm text-gray-600">{pattern.category}</p>
                </div>
                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-bold text-green-600">{pattern.confidence}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Amount</span>
                  <span className="font-black text-gray-800">₹{pattern.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Frequency</span>
                  <span className="font-medium text-gray-700">{pattern.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Next Expected</span>
                  <span className="font-medium text-blue-600">{new Date(pattern.nextPredicted).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">No recurring patterns detected yet</p>
        <p className="text-sm text-gray-400">Patterns will appear as we analyze your transaction history</p>
      </div>
    )
  }
  

  

  
  const calculateMetrics = () => {
    const multiplier = { weekly: 4.33, monthly: 1, quarterly: 0.33, yearly: 0.083 }
    const totalMonthly = subscriptions.reduce((sum, sub) => {
      return sum + (sub.amount * (multiplier[sub.frequency] || 1))
    }, 0)
    
    const dueSoon = subscriptions.filter(s => {
      const days = Math.ceil((new Date(s.nextPayment) - new Date()) / (1000 * 60 * 60 * 24))
      return days <= 7 && days >= 0
    }).length
    
    const overdue = subscriptions.filter(s => new Date(s.nextPayment) < new Date()).length
    
    return { totalMonthly, dueSoon, overdue }
  }
  
  const { totalMonthly, dueSoon, overdue } = calculateMetrics()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-600">Loading subscriptions...</div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-lg animate-slide-up">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Bank Account</label>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="all">Select Bank Account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} ••••{account.last4Digits}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards - Smaller */}
      {accountFilter !== 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <Repeat className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{subscriptions.length}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Monthly</span>
            </div>
            <div className="text-xl font-bold text-green-600">₹{totalMonthly.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Due Soon</span>
            </div>
            <div className="text-xl font-bold text-yellow-600">{dueSoon}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Overdue</span>
            </div>
            <div className="text-xl font-bold text-red-600">{overdue}</div>
          </div>
        </div>
      )}

      {/* Two Division Layout - Compact */}
      {accountFilter !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Subscriptions */}
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-purple-100">
                <Repeat className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Active Subscriptions</h3>
                <p className="text-xs text-gray-600">Current recurring payments</p>
              </div>
            </div>
            
            {subscriptions.length > 0 ? (
              <div className="space-y-3">
                {subscriptions.map((subscription, index) => (
                  <div key={subscription.id} className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 text-sm">{subscription.name || subscription.merchant}</h4>
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">{subscription.frequency}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {subscription.category} • <span className="font-bold text-purple-600">₹{subscription.amount?.toLocaleString()}</span>
                    </p>
                    {subscription.nextPayment && (
                      <p className="text-xs text-gray-500">
                        Next: {new Date(subscription.nextPayment).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Repeat className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No active subscriptions</p>
                <p className="text-xs text-gray-400">Payments will appear here</p>
              </div>
            )}
          </div>

          {/* Upcoming Patterns */}
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upcoming Patterns</h3>
                <p className="text-xs text-gray-600">AI-identified patterns</p>
              </div>
            </div>
            
            {patternsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                <p className="text-gray-500 text-sm">Analyzing...</p>
              </div>
            ) : upcomingPatterns.length > 0 ? (
              <div className="space-y-3">
                {upcomingPatterns.map((pattern, index) => (
                  <div key={pattern.id} className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-gray-900 text-sm">{pattern.merchant}</h4>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">{pattern.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">{pattern.frequency}</span> • <span className="font-bold text-blue-600">₹{pattern.amount.toLocaleString()}</span> • {pattern.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      Next: {new Date(pattern.nextPredicted).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No patterns detected</p>
                <p className="text-xs text-gray-400">Patterns will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {accountFilter === 'all' && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Repeat className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-700 mb-2">Select a Bank Account</h3>
          <p className="text-gray-500 font-medium">Choose a bank account to view recurring payments and patterns</p>
        </div>
      )}
    </div>
  )
}