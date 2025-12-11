import React, { useState, useEffect } from 'react'
import { Calendar, Plus, DollarSign, Clock, AlertCircle, CheckCircle2, Repeat, CreditCard, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const RecurringCard = ({ recurring, onDelete, onEdit }) => {
  const nextPayment = new Date(recurring.nextPayment)
  const daysUntilNext = Math.ceil((nextPayment - new Date()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysUntilNext < 0
  const isDueSoon = daysUntilNext <= 3 && daysUntilNext >= 0
  
  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600'
    if (isDueSoon) return 'text-yellow-600'
    return 'text-green-600'
  }
  
  const getStatusIcon = () => {
    if (isOverdue) return <AlertCircle className="w-5 h-5 text-red-600" />
    if (isDueSoon) return <Clock className="w-5 h-5 text-yellow-600" />
    return <CheckCircle2 className="w-5 h-5 text-green-600" />
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-black text-lg">{recurring.merchant || recurring.name || 'Unnamed Subscription'}</h3>
            <p className="text-sm text-gray-600">{recurring.category || 'No Category'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <button 
            onClick={() => onEdit(recurring)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(recurring.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600">Amount</span>
          <span className="text-lg font-black text-gray-900">
            ₹{(recurring.amount || 0).toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600">Frequency</span>
          <span className="text-sm font-semibold capitalize">{recurring.frequency || 'monthly'}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600">Next Payment</span>
          <span className={`text-sm font-semibold ${getStatusColor()}`}>
            {nextPayment.toLocaleDateString()}
          </span>
        </div>
        
        <div className="pt-2 border-t">
          <span className={`text-xs font-bold ${getStatusColor()}`}>
            {isOverdue ? `Overdue by ${Math.abs(daysUntilNext)} days` :
             isDueSoon ? `Due in ${daysUntilNext} days` :
             `${daysUntilNext} days remaining`}
          </span>
        </div>
      </div>
    </div>
  )
}

const RecurringForm = ({ recurring, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: recurring?.name || '',
    category: recurring?.category || '',
    amount: recurring?.amount || '',
    frequency: recurring?.frequency || 'monthly',
    nextPayment: recurring?.nextPayment || ''
  })
  const [errors, setErrors] = useState({})
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Subscription name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (formData.category && !/^[a-zA-Z\s]+$/.test(formData.category.trim())) {
      newErrors.category = 'Category should only contain letters'
    }
    
    const amount = parseFloat(formData.amount)
    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }
    
    if (!formData.nextPayment) {
      newErrors.nextPayment = 'Next payment date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...recurring,
        ...formData,
        name: formData.name.trim(),
        category: formData.category.trim(),
        amount: parseFloat(formData.amount)
      })
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="font-black text-xl mb-4">{recurring ? 'Edit Subscription' : 'Add New Subscription'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subscription Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value})
                if (errors.name) setErrors({...errors, name: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., Netflix, Spotify"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => {
                  setFormData({...formData, category: e.target.value})
                  if (errors.category) setErrors({...errors, category: ''})
                }}
                className={`w-full p-3 border rounded-lg font-semibold ${
                  errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Entertainment"
              />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg font-semibold"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                setFormData({...formData, amount: e.target.value})
                if (errors.amount) setErrors({...errors, amount: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold ${
                errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="299"
              min="1"
              required
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Next Payment Date</label>
            <input
              type="date"
              value={formData.nextPayment}
              onChange={(e) => {
                setFormData({...formData, nextPayment: e.target.value})
                if (errors.nextPayment) setErrors({...errors, nextPayment: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold ${
                errors.nextPayment ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            {errors.nextPayment && <p className="text-red-500 text-sm mt-1">{errors.nextPayment}</p>}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              {recurring ? 'Update' : 'Add'} Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CalendarView = ({ subscriptions }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const getPaymentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return subscriptions.filter(sub => sub.nextPayment === dateStr)
  }
  
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }
  
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Payment Calendar</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-3 hover:bg-purple-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="w-5 h-5 text-purple-600" />
          </button>
          <span className="font-black text-xl text-gray-800 px-4">{monthYear}</span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-3 hover:bg-purple-100 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ChevronRight className="w-5 h-5 text-purple-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-black text-gray-700 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="p-3 h-24"></div>
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
          const payments = getPaymentsForDate(date)
          const isToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={day}
              className={`p-2 h-20 border rounded-lg transition-colors ${
                isToday ? 'bg-purple-100 border-purple-300' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-purple-700' : 'text-gray-700'
              }`}>
                {day}
              </div>
              <div className="space-y-1">
                {payments.slice(0, 2).map(payment => (
                  <div
                    key={payment.id}
                    className="text-xs bg-purple-600 text-white px-1 py-0.5 rounded truncate"
                    title={`${payment.name} - ₹${payment.amount}`}
                  >
                    {payment.name}
                  </div>
                ))}
                {payments.length > 2 && (
                  <div className="text-xs text-gray-500">+{payments.length - 2} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RecurringPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [filter, setFilter] = useState('all')
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')

  
  useEffect(() => {
    loadSubscriptions()
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await ApiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }
  
  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get from localStorage or use demo data
      const saved = localStorage.getItem('recurringPayments')
      if (saved) {
        setSubscriptions(JSON.parse(saved))
      } else {
        const demoData = [
          {
            id: 1,
            name: 'Netflix',
            category: 'Entertainment',
            amount: 649,
            frequency: 'monthly',
            nextPayment: '2024-12-15'
          },
          {
            id: 2,
            name: 'Spotify Premium',
            category: 'Music',
            amount: 119,
            frequency: 'monthly',
            nextPayment: '2024-12-20'
          },
          {
            id: 3,
            name: 'Amazon Prime',
            category: 'Shopping',
            amount: 1499,
            frequency: 'yearly',
            nextPayment: '2025-03-15'
          }
        ]
        setSubscriptions(demoData)
        localStorage.setItem('recurringPayments', JSON.stringify(demoData))
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err)
      setError(err.message || 'Failed to load recurring payments')
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }
  
  const saveSubscription = async (subData) => {
    try {
      setError(null)
      
      let updatedSubs
      if (subData.id) {
        // Update existing
        updatedSubs = subscriptions.map(sub => 
          sub.id === subData.id ? subData : sub
        )
      } else {
        // Add new
        const newSub = { ...subData, id: Date.now() }
        updatedSubs = [...subscriptions, newSub]
      }
      
      setSubscriptions(updatedSubs)
      localStorage.setItem('recurringPayments', JSON.stringify(updatedSubs))
      setShowForm(false)
      setEditingSubscription(null)
    } catch (err) {
      console.error('Error saving subscription:', err)
      setError(err.message || 'Failed to save subscription')
    }
  }
  
  const deleteSubscription = async (subId) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return
    
    try {
      const updatedSubs = subscriptions.filter(sub => sub.id !== subId)
      setSubscriptions(updatedSubs)
      localStorage.setItem('recurringPayments', JSON.stringify(updatedSubs))
    } catch (err) {
      console.error('Error deleting subscription:', err)
      setError(err.message || 'Failed to delete subscription')
    }
  }
  
  const filteredSubscriptions = (subscriptions || []).filter(sub => {
    if (!sub) return false
    if (filter === 'all') return true
    if (filter === 'due-soon') {
      const nextPayment = sub.nextPayment ? new Date(sub.nextPayment) : null
      if (!nextPayment) return false
      const daysUntil = Math.ceil((nextPayment - new Date()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7 && daysUntil >= 0
    }
    if (filter === 'overdue') {
      const nextPayment = sub.nextPayment ? new Date(sub.nextPayment) : null
      return nextPayment && nextPayment < new Date()
    }
    return sub.frequency === filter
  })
  
  const totalMonthly = (subscriptions || []).reduce((sum, sub) => {
    if (!sub || !sub.amount || !sub.frequency) return sum
    const multiplier = { weekly: 4.33, monthly: 1, quarterly: 0.33, yearly: 0.083 }
    return sum + (Number(sub.amount) * (multiplier[sub.frequency] || 1))
  }, 0)
  
  const dueSoon = (subscriptions || []).filter(s => {
    if (!s || !s.nextPayment) return false
    const nextPayment = new Date(s.nextPayment)
    const days = Math.ceil((nextPayment - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days >= 0
  }).length
  
  const overdue = (subscriptions || []).filter(s => {
    if (!s || !s.nextPayment) return false
    return new Date(s.nextPayment) < new Date()
  }).length
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-600">Loading subscriptions...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 space-y-8">
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-lg animate-slide-up">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Bank Account</label>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} ••••{account.last4Digits}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Add Subscription
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Repeat className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Total Subscriptions</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{subscriptions.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Monthly Cost</span>
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₹{totalMonthly.toLocaleString()}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Due Soon</span>
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{dueSoon}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Overdue</span>
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{overdue}</div>
        </div>
      </div>
      

      
      <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
        <CalendarView subscriptions={subscriptions} />
      </div>
      
      {showForm && (
        <RecurringForm
          recurring={editingSubscription}
          onSave={saveSubscription}
          onCancel={() => {
            setShowForm(false)
            setEditingSubscription(null)
          }}
        />
      )}
    </div>
  )
}