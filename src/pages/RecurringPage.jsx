import React, { useState, useEffect } from 'react'
import { Plus, DollarSign, Clock, AlertCircle, CheckCircle2, Repeat, CreditCard, Trash2, Edit } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'


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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Repeat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{recurring.name || 'Recurring Payment'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{recurring.category || 'General'}</p>
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
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            ₹{(recurring.amount || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {recurring.frequency || 'monthly'} payment
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment</span>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {nextPayment.toLocaleDateString('en-GB')}
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

const RecurringForm = ({ recurring, accounts, categories, loadCategories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    merchant: recurring?.merchant || recurring?.name || '',
    reason: recurring?.reason || '',
    amount: recurring?.amount || '',
    frequency: recurring?.frequency || 'MONTHLY',
    nextDueDate: recurring?.nextDueDate || recurring?.nextPayment || '',
    bankAccountId: recurring?.bankAccountId || ''
  })
  const [errors, setErrors] = useState({})
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.merchant.trim()) {
      newErrors.merchant = 'Merchant name is required'
    } else if (formData.merchant.trim().length < 2) {
      newErrors.merchant = 'Merchant name must be at least 2 characters'
    }
    
    if (!formData.bankAccountId) {
      newErrors.bankAccountId = 'Bank account is required'
    }
    
    const amount = parseFloat(formData.amount)
    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }
    
    if (!formData.nextDueDate) {
      newErrors.nextDueDate = 'Next due date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...recurring,
        ...formData,
        merchant: formData.merchant.trim(),
        reason: formData.reason.trim(),
        amount: parseFloat(formData.amount),
        bankAccountId: parseInt(formData.bankAccountId)
      })
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="font-black text-xl mb-4 dark:text-gray-100">{recurring ? 'Edit Subscription' : 'Add New Subscription'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Merchant Name</label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => {
                setFormData({...formData, merchant: e.target.value})
                if (errors.merchant) setErrors({...errors, merchant: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold dark:bg-gray-700 dark:text-gray-100 ${
                errors.merchant ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="e.g., Netflix, Spotify"
              required
            />
            {errors.merchant && <p className="text-red-500 text-sm mt-1">{errors.merchant}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Bank Account</label>
            <select
              value={formData.bankAccountId}
              onChange={(e) => {
                setFormData({...formData, bankAccountId: e.target.value})
                if (errors.bankAccountId) setErrors({...errors, bankAccountId: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold dark:bg-gray-700 dark:text-gray-100 ${
                errors.bankAccountId ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} ••••{account.last4Digits}
                </option>
              ))}
            </select>
            {errors.bankAccountId && <p className="text-red-500 text-sm mt-1">{errors.bankAccountId}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Category</label>
              <select
                value={formData.reason}
                onChange={(e) => {
                  if (e.target.value === 'CREATE_NEW') {
                    setShowCategoryDialog(true);
                  } else {
                    setFormData({...formData, reason: e.target.value});
                  }
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg font-semibold"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value="CREATE_NEW">+ Create New Category</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg font-semibold"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                setFormData({...formData, amount: e.target.value})
                if (errors.amount) setErrors({...errors, amount: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold dark:bg-gray-700 dark:text-gray-100 ${
                errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="299"
              min="1"
              required
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Next Due Date</label>
            <input
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => {
                setFormData({...formData, nextDueDate: e.target.value})
                if (errors.nextDueDate) setErrors({...errors, nextDueDate: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold dark:bg-gray-700 dark:text-gray-100 ${
                errors.nextDueDate ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            {errors.nextDueDate && <p className="text-red-500 text-sm mt-1">{errors.nextDueDate}</p>}
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
      
      {/* Create Category Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg mb-4">Create New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              placeholder="Enter category name"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCategoryDialog(false)
                  setNewCategoryName('')
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newCategoryName.trim()) {
                    try {
                      await ApiService.createCategory({ name: newCategoryName.trim() })
                      await loadCategories()
                      setFormData({...formData, reason: newCategoryName.trim()})
                      setShowCategoryDialog(false)
                      setNewCategoryName('')
                      showToast('Category created successfully!', 'success')
                    } catch (error) {
                      console.error('Error creating category:', error)
                      showToast(error.message || 'Failed to create category', 'error')
                    }
                  }
                }}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`bg-white rounded-xl shadow-2xl border-l-4 ${
            toast.type === 'success' ? 'border-purple-600' : 'border-red-600'
          } p-4 min-w-[320px]`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                toast.type === 'success' ? 'bg-purple-100' : 'bg-red-100'
              }`}>
                <span className={toast.type === 'success' ? 'text-purple-600' : 'text-red-600'}>
                  {toast.type === 'success' ? '✓' : '✕'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
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
  const [categories, setCategories] = useState([])
  const [accountFilter, setAccountFilter] = useState(() => {
    return sessionStorage.getItem('selectedAccount') || 'all'
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  
  useEffect(() => {
    const handleAccountChange = (event) => {
      setAccountFilter(event.detail)
    }
    
    window.addEventListener('accountChanged', handleAccountChange)
    loadSubscriptions()
    loadAccounts()
    loadCategories()
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange)
    }
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

  const loadCategories = async () => {
    try {
      const data = await ApiService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }
  
  const loadSubscriptions = async () => {
    if (!accountFilter || accountFilter === 'all') {
      setSubscriptions([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const data = await ApiService.getRecurringPatternsByAccount(accountFilter)
      const recurringArray = Array.isArray(data) ? data : []
      
      // Map backend data to frontend format
      const mappedData = recurringArray.map(item => ({
        id: item.id,
        merchant: item.merchant,
        name: item.merchant || item.description || 'Recurring Payment',
        category: item.category || 'General',
        amount: item.amount || 0,
        frequency: item.frequency?.toLowerCase() || 'monthly',
        nextPayment: item.nextDueDate || item.nextPaymentDate || item.nextPayment,
        nextDueDate: item.nextDueDate,
        reason: item.reason,
        bankAccountId: item.bankAccount?.id
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
        merchant: subData.merchant,
        reason: subData.reason,
        amount: subData.amount,
        frequency: subData.frequency,
        nextDueDate: subData.nextDueDate,
        bankAccount: { id: subData.bankAccountId }
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
  
  const deleteSubscription = (subId) => {
    const subscription = subscriptions.find(s => s.id === subId)
    setDeleteConfirm({ id: subId, name: subscription?.merchant || 'this subscription' })
  }

  const confirmDelete = async () => {
    try {
      await ApiService.deleteRecurringPattern(deleteConfirm.id)
      await loadSubscriptions()
      setDeleteConfirm(null)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (!accountFilter || accountFilter === 'all') {
                showToast('⚠️ Please select a bank account first', 'error')
                return
              }
              
              try {
                setLoading(true)
                showToast('🔄 Analyzing recurring patterns...', 'success')
                
                // Call AI recurring analysis
                await ApiService.runRecurringAnalysis(accountFilter)
                
                // Poll for data to be saved
                let attempts = 0
                const maxAttempts = 10
                
                while (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 2000))
                  try {
                    const data = await ApiService.api.get(`/recurring/account/${accountFilter}`)
                    if (data.data && data.data.length > 0) {
                      showToast('✨ Recurring patterns fetched successfully!', 'success')
                      await loadSubscriptions()
                      setLoading(false)
                      return
                    }
                  } catch (e) {
                    console.log('Waiting for patterns to be saved...')
                  }
                  attempts++
                }
                
                // If no data after polling, still reload
                showToast('✨ Analysis complete!', 'success')
                await loadSubscriptions()
                
              } catch (error) {
                console.error('Recurring analysis error:', error)
                showToast('❌ Failed to analyze recurring patterns', 'error')
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <Repeat className="w-4 h-4" />
            <span>{loading ? 'Analyzing...' : 'AI Recurring'}</span>
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}

      {(!accountFilter || accountFilter === 'all') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <p className="text-blue-800 dark:text-blue-300 font-semibold text-lg">Please select a bank account first</p>
          <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">Choose an account from the filter to view recurring patterns</p>
        </div>
      )}

      {accountFilter && accountFilter !== 'all' && (
      <div id="recurring-content" className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <Repeat className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-gray-700 dark:text-gray-300">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{subscriptions.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-700 dark:text-gray-300">Monthly Cost</span>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{totalMonthly.toLocaleString()}</div>
          </div>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilter('due-soon')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              <span className="font-bold text-gray-700 dark:text-gray-300">Due Soon</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{dueSoon}</div>
          </div>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilter('overdue')}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="font-bold text-gray-700 dark:text-gray-300">Overdue</span>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow text-center">
            <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No Recurring Payments</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first recurring payment to start tracking</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
        )}
      </div>
      )}
      
      {showForm && (
        <RecurringForm
          recurring={editingSubscription}
          accounts={accounts}
          categories={categories}
          loadCategories={loadCategories}
          onSave={saveSubscription}
          onCancel={() => {
            setShowForm(false)
            setEditingSubscription(null)
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-xl mb-4 text-red-600">Delete Subscription</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`bg-white rounded-xl shadow-2xl border-l-4 ${
            toast.type === 'success' ? 'border-purple-600' : 'border-red-600'
          } p-4 min-w-[320px]`}>
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                toast.type === 'success' ? 'bg-purple-100' : 'bg-red-100'
              }`}>
                <span className={toast.type === 'success' ? 'text-purple-600' : 'text-red-600'}>
                  {toast.type === 'success' ? '✓' : '✕'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}