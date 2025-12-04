import React, { useState, useEffect } from 'react'
import { Calendar, Plus, DollarSign, Clock, AlertCircle, CheckCircle2, Repeat, CreditCard, Trash2 } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const RecurringCard = ({ recurring, onDelete }) => {
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
            <h3 className="font-black text-lg">{recurring.name}</h3>
            <p className="text-sm text-gray-600">{recurring.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <button 
            onClick={() => onDelete(recurring.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600">Amount</span>
          <span className="text-lg font-black text-gray-900">
            ₹{recurring.amount.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-600">Frequency</span>
          <span className="text-sm font-semibold capitalize">{recurring.frequency}</span>
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

export default function RecurringPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    loadSubscriptions()
  }, [])
  
  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getRecurringPayments()
      setSubscriptions(data || [])
    } catch (err) {
      console.error('Error loading subscriptions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const saveSubscription = async (subData) => {
    try {
      setError(null)
      
      if (subData.id) {
        await ApiService.updateRecurringPayment(subData.id, subData)
      } else {
        await ApiService.createRecurringPayment(subData)
      }
      
      await loadSubscriptions()
      setShowForm(false)
      setEditingSubscription(null)
    } catch (err) {
      console.error('Error saving subscription:', err)
      setError(err.message)
    }
  }
  
  const deleteSubscription = async (subId) => {
    try {
      await ApiService.deleteRecurringPayment(subId)
      await loadSubscriptions()
    } catch (err) {
      console.error('Error deleting subscription:', err)
      setError(err.message)
    }
  }
  
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true
    if (filter === 'due-soon') {
      const daysUntil = Math.ceil((new Date(sub.nextPayment) - new Date()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7 && daysUntil >= 0
    }
    if (filter === 'overdue') {
      return new Date(sub.nextPayment) < new Date()
    }
    return sub.frequency === filter
  })
  
  const totalMonthly = subscriptions.reduce((sum, sub) => {
    const multiplier = { weekly: 4.33, monthly: 1, quarterly: 0.33, yearly: 0.083 }
    return sum + (sub.amount * (multiplier[sub.frequency] || 1))
  }, 0)
  
  const dueSoon = subscriptions.filter(s => {
    const days = Math.ceil((new Date(s.nextPayment) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days >= 0
  }).length
  
  const overdue = subscriptions.filter(s => new Date(s.nextPayment) < new Date()).length
  
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Recurring Payments</h1>
          <p className="text-gray-600 font-semibold">Manage your subscriptions and recurring expenses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Subscription
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <Repeat className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-gray-600">Total Subscriptions</span>
          </div>
          <div className="text-2xl font-black">{subscriptions.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span className="font-bold text-gray-600">Monthly Cost</span>
          </div>
          <div className="text-2xl font-black text-green-600">₹{totalMonthly.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span className="font-bold text-gray-600">Due Soon</span>
          </div>
          <div className="text-2xl font-black text-yellow-600">{dueSoon}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <span className="font-bold text-gray-600">Overdue</span>
          </div>
          <div className="text-2xl font-black text-red-600">{overdue}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        {['all', 'due-soon', 'overdue', 'monthly', 'yearly'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-bold capitalize transition-colors ${
              filter === type 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.replace('-', ' ')}
          </button>
        ))}
      </div>
      
      {filteredSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map(subscription => (
            <RecurringCard
              key={subscription.id}
              recurring={subscription}
              onDelete={deleteSubscription}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow text-center">
          <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-black text-xl text-gray-600 mb-2">No Subscriptions Yet</h3>
          <p className="text-gray-500 mb-6">Add your first subscription to start tracking recurring payments</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            Add Your First Subscription
          </button>
        </div>
      )}
      
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