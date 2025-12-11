import React, { useState, useEffect } from 'react'
import { Plus, DollarSign, Clock, AlertCircle, CheckCircle2, Repeat, CreditCard, Trash2, Edit } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import DownloadButton from '../components/DownloadButton'

const RecurringCard = ({ recurring, onDelete, onEdit }) => {
  const nextPayment = new Date(recurring.nextPayment)
  const daysUntilNext = Math.ceil((nextPayment - new Date()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysUntilNext < 0
  const isDueSoon = daysUntilNext <= 7 && daysUntilNext >= 0
  
  const getStatusColor = () => {
    if (isOverdue) return 'bg-red-100 text-red-700'
    if (isDueSoon) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }
  
  const getStatusText = () => {
    if (isOverdue) return `Overdue ${Math.abs(daysUntilNext)}d`
    if (isDueSoon) return `Due in ${daysUntilNext}d`
    return `${daysUntilNext}d left`
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Repeat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{recurring.name || 'Recurring Payment'}</h3>
            <p className="text-sm text-gray-600">{recurring.category || 'General'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(recurring)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(recurring.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ₹{(recurring.amount || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 capitalize">
            {recurring.frequency || 'monthly'} payment
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Next Payment</span>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {nextPayment.toLocaleDateString()}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
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
  
  useEffect(() => {
    if (user?.userId) {
      loadSubscriptions()
    }
  }, [accountFilter, user])

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
      
      let data
      if (accountFilter === 'all') {
        data = await ApiService.getRecurringPayments()
      } else {
        data = await ApiService.getRecurringPatternsByAccount(accountFilter)
      }
      
      const recurringArray = Array.isArray(data) ? data : []
      
      // Map backend data to frontend format
      const mappedData = recurringArray.map(item => ({
        id: item.id,
        name: item.merchant || item.description || 'Recurring Payment',
        category: item.category || 'General',
        amount: item.amount || 0,
        frequency: item.frequency?.toLowerCase() || 'monthly',
        nextPayment: item.nextPaymentDate || item.nextPayment
      }))
      
      setSubscriptions(mappedData)
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
      
      const recurringData = {
        merchant: subData.name,
        category: subData.category,
        amount: subData.amount,
        frequency: subData.frequency.toUpperCase(),
        nextPaymentDate: subData.nextPayment
      }
      
      if (subData.id) {
        await ApiService.updateRecurringPattern(subData.id, recurringData)
      } else {
        await ApiService.createRecurringPattern(recurringData)
      }
      
      await loadSubscriptions()
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
      await ApiService.deleteRecurringPattern(subId)
      await loadSubscriptions()
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Payments</h1>
          <p className="text-gray-600">Manage your subscription and recurring transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <DownloadButton targetId="recurring-content" filename="recurring-payments" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} ••••{account.last4Digits}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">All Payments</option>
              <option value="due-soon">Due Soon</option>
              <option value="overdue">Overdue</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      <div id="recurring-content" className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <Repeat className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-gray-700">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{subscriptions.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-700">Monthly Cost</span>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{totalMonthly.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              <span className="font-bold text-gray-700">Due Soon</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{dueSoon}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="font-bold text-gray-700">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{overdue}</div>
          </div>
        </div>

        {/* Recurring Payments Grid */}
        {filteredSubscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map(subscription => (
              <RecurringCard 
                key={subscription.id} 
                recurring={subscription} 
                onDelete={deleteSubscription}
                onEdit={(sub) => {
                  setEditingSubscription(sub)
                  setShowForm(true)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow text-center">
            <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Recurring Payments</h3>
            <p className="text-gray-500 mb-6">Add your first recurring payment to start tracking</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
        )}
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