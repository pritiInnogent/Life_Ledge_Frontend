import React, { useState, useEffect } from 'react'
import { Target, Plus, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Trash2, Lightbulb, Edit3 } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const GoalCard = ({ goal, onDelete, onEdit }) => {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const daysLeft = Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0
  const isCompleted = progress >= 100
  
  const getGradient = () => {
    if (isCompleted) return 'from-green-500 to-emerald-600'
    if (isOverdue) return 'from-red-500 to-rose-600'
    if (progress > 70) return 'from-yellow-500 to-orange-500'
    return 'from-blue-500 to-indigo-600'
  }
  
  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-white" />
    if (isOverdue) return <AlertCircle className="w-5 h-5 text-white" />
    return <Clock className="w-5 h-5 text-white" />
  }
  
  return (
    <div className="group relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-3xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-gradient-to-br ${getGradient()} rounded-2xl flex items-center justify-center shadow-lg`}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-900 mb-1">{goal.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">{goal.category}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide">
                  {goal.type?.replace('_', ' ') || 'Budget'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={() => onEdit(goal)}
              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(goal.id)}
              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-700">Progress</span>
            <div className="text-right">
              <div className="text-lg font-black text-gray-900">
                ₹{goal.currentAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                of ₹{goal.targetAmount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Modern Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div 
                className={`h-4 bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="absolute -top-8 left-0 right-0 flex justify-between">
              <span className="text-xs font-bold text-gray-600">{progress.toFixed(1)}%</span>
              <span className="text-xs font-medium text-gray-500">
                {isOverdue ? `${Math.abs(daysLeft)} days overdue` : 
                 isCompleted ? '🎉 Completed!' : 
                 `${daysLeft} days left`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
            <div className="text-2xl font-black text-gray-900">₹{Math.round((goal.targetAmount - goal.currentAmount) / Math.max(daysLeft, 1)).toLocaleString()}</div>
            <div className="text-xs font-medium text-gray-600">Daily Target</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
            <div className="text-2xl font-black text-gray-900">{Math.round(progress)}%</div>
            <div className="text-xs font-medium text-gray-600">Complete</div>
          </div>
        </div>
        
        {goal.nudge && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-purple-800">{goal.nudge}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const GoalForm = ({ goal, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    category: goal?.category || '',
    targetAmount: goal?.targetAmount || '',
    currentAmount: goal?.currentAmount || 0,
    endDate: goal?.endDate || '',
    type: goal?.type || 'BUDGET',
    emoji: goal?.emoji || 'target'
  })
  const [errors, setErrors] = useState({})
  
  const validateForm = () => {
    const newErrors = {}
    
    // Goal name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Goal name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s]+/.test(formData.name.trim())) {
      newErrors.name = 'Goal name should start with letters and be meaningful'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Goal name must be less than 50 characters'
    }
    
    // Category validation
    if (formData.category && !/^[a-zA-Z\s]+$/.test(formData.category.trim())) {
      newErrors.category = 'Category should only contain letters'
    }
    
    // Target amount validation
    const targetAmount = parseFloat(formData.targetAmount)
    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required'
    } else if (isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = 'Please enter a valid amount greater than 0'
    } else if (targetAmount > 10000000) {
      newErrors.targetAmount = 'Target amount seems too high. Please enter a realistic amount'
    }
    
    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    } else {
      const selectedDate = new Date(formData.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        newErrors.endDate = 'End date must be in the future'
      }
      
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 10)
      if (selectedDate > maxDate) {
        newErrors.endDate = 'End date cannot be more than 10 years from now'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...goal,
        ...formData,
        name: formData.name.trim(),
        category: formData.category.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount)
      })
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="font-black text-xl mb-4">{goal ? 'Edit Goal' : 'Create New Goal'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Goal Name</label>
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
              placeholder="e.g., Monthly Food Budget"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg font-semibold"
              >
                <option value="BUDGET">Budget</option>
                <option value="SAVING">Savings</option>
                <option value="SPENDING_CAP">Spending Cap</option>
              </select>
            </div>
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
                placeholder="e.g., Food"
              />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Target Amount (₹)</label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => {
                setFormData({...formData, targetAmount: e.target.value})
                if (errors.targetAmount) setErrors({...errors, targetAmount: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold ${
                errors.targetAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="5000"
              min="1"
              max="10000000"
              required
            />
            {errors.targetAmount && <p className="text-red-500 text-sm mt-1">{errors.targetAmount}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => {
                setFormData({...formData, endDate: e.target.value})
                if (errors.endDate) setErrors({...errors, endDate: ''})
              }}
              className={`w-full p-3 border rounded-lg font-semibold ${
                errors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
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
              {goal ? 'Update' : 'Create'} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    if (user?.userId) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getUserGoals()
      setGoals(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading goals:', err)
      setError(err.message)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }
  
  const saveGoal = async (goalData) => {
    try {
      setError(null)
      let savedGoal
      
      if (goalData.id) {
        savedGoal = await ApiService.updateGoal(goalData.id, goalData)
        setGoals(goals.map(g => g.id === goalData.id ? savedGoal : g))
      } else {
        savedGoal = await ApiService.createGoal(goalData)
        setGoals([...goals, savedGoal])
      }
      
      setShowForm(false)
      setEditingGoal(null)
    } catch (err) {
      console.error('Error saving goal:', err)
      setError(err.message)
    }
  }
  
  const deleteGoal = async (goalId) => {
    try {
      await ApiService.deleteGoal(goalId)
      setGoals(goals.filter(g => g.id !== goalId))
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(err.message)
    }
  }
  
  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true
    
    // Handle case sensitivity and missing type field
    const goalType = (goal.type || 'BUDGET').toUpperCase()
    
    if (filter === 'budget') return goalType === 'BUDGET'
    if (filter === 'savings') return goalType === 'SAVING' 
    if (filter === 'spending') return goalType === 'SPENDING_CAP'
    return true
  })
  
  const stats = {
    total: goals.length,
    completed: goals.filter(g => (g.currentAmount / g.targetAmount) >= 1).length,
    onTrack: goals.filter(g => {
      const progress = g.currentAmount / g.targetAmount
      const timeProgress = (new Date() - new Date(g.endDate)) / (1000 * 60 * 60 * 24)
      return progress >= 0.5 && progress < 1 && timeProgress <= 0
    }).length,
    overdue: goals.filter(g => {
      const daysLeft = Math.ceil((new Date(g.endDate) - new Date()) / (1000 * 60 * 60 * 24))
      return daysLeft < 0 && (g.currentAmount / g.targetAmount) < 1
    }).length
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-600">Loading goals...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-6 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-pulse">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-end animate-fade-in">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Total Goals</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Completed</span>
          </div>
          <div className="text-3xl font-black text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">On Track</span>
          </div>
          <div className="text-3xl font-black text-blue-600">{stats.onTrack}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-700">Overdue</span>
          </div>
          <div className="text-3xl font-black text-red-600">{stats.overdue}</div>
        </div>
      </div>
      
      <div className="flex gap-4 flex-wrap animate-fade-in" style={{animationDelay: '0.5s'}}>
        {[
          { key: 'all', label: 'All Goals', count: goals.length, gradient: 'from-gray-500 to-gray-600' },
          { key: 'budget', label: 'Budget Goals', count: goals.filter(g => (g.type || 'BUDGET').toUpperCase() === 'BUDGET').length, gradient: 'from-purple-500 to-indigo-600' },
          { key: 'savings', label: 'Savings Goals', count: goals.filter(g => (g.type || 'BUDGET').toUpperCase() === 'SAVING').length, gradient: 'from-green-500 to-emerald-600' },
          { key: 'spending', label: 'Spending Caps', count: goals.filter(g => (g.type || 'BUDGET').toUpperCase() === 'SPENDING_CAP').length, gradient: 'from-red-500 to-rose-600' }
        ].map(({ key, label, count, gradient }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 transform hover:scale-105 ${
              filter === key 
                ? `bg-gradient-to-r ${gradient} text-white shadow-xl` 
                : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-lg border border-white/50'
            }`}
          >
            <span>{label}</span>
            <span className={`text-xs px-3 py-1 rounded-full font-black ${
              filter === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>
      
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredGoals.map((goal, index) => (
            <div key={goal.id} className="animate-slide-up" style={{animationDelay: `${0.6 + index * 0.1}s`}}>
              <GoalCard 
                goal={goal} 
                onDelete={deleteGoal}
                onEdit={(goal) => {
                  setEditingGoal(goal)
                  setShowForm(true)
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 shadow-2xl text-center border border-white/50 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Target className="w-12 h-12 text-white" />
          </div>
          <h3 className="font-black text-2xl text-gray-800 mb-4">
            {filter === 'all' ? 'No Goals Yet' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Goals`}
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            {filter === 'all' 
              ? 'Create your first financial goal to start tracking your progress'
              : `You haven't created any ${filter} goals yet. Click below to create one.`
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            {filter === 'all' ? 'Create Your First Goal' : `Create ${filter.charAt(0).toUpperCase() + filter.slice(1)} Goal`}
          </button>
        </div>
      )}
      
      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSave={saveGoal}
          onCancel={() => {
            setShowForm(false)
            setEditingGoal(null)
          }}
        />
      )}
    </div>
  )
}
