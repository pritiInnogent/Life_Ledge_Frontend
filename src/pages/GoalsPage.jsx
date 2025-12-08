import React, { useState, useEffect } from 'react'
import { Target, Plus, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const GoalCard = ({ goal, onDelete }) => {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const daysLeft = Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0
  const isCompleted = progress >= 100
  
  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600'
    if (isOverdue) return 'text-red-600'
    if (progress > 70) return 'text-yellow-600'
    return 'text-blue-600'
  }
  
  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-600" />
    if (isOverdue) return <AlertCircle className="w-5 h-5 text-red-600" />
    return <Clock className="w-5 h-5 text-blue-600" />
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{goal.emoji}</div>
          <div>
            <h3 className="font-semibold text-lg">{goal.name}</h3>
            <p className="text-sm text-gray-600">{goal.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <button 
            onClick={() => onDelete(goal.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className={`text-sm font-semibold ${getStatusColor()}`}>
            ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : 
              isOverdue ? 'bg-red-500' : 
              progress > 70 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">{progress.toFixed(1)}% complete</span>
          <span className="text-xs text-gray-500">
            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : 
             isCompleted ? 'Completed!' : 
             `${daysLeft} days left`}
          </span>
        </div>
      </div>
      
      {goal.nudge && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-purple-800">💡 {goal.nudge}</p>
        </div>
      )}
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
    type: goal?.type || 'budget',
    emoji: goal?.emoji || '🎯'
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
                <option value="budget">Budget</option>
                <option value="savings">Savings</option>
                <option value="spending">Spending Cap</option>
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
    return goal.type === filter
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
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Financial Goals</h1>
          <p className="text-gray-600 font-semibold">Track your budgets, savings, and spending targets</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-gray-600">Total Goals</span>
          </div>
          <div className="text-2xl font-black">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="font-bold text-gray-600">Completed</span>
          </div>
          <div className="text-2xl font-black text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-600">On Track</span>
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.onTrack}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <span className="font-bold text-gray-600">Overdue</span>
          </div>
          <div className="text-2xl font-black text-red-600">{stats.overdue}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        {['all', 'budget', 'savings', 'spending'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-bold capitalize transition-colors ${
              filter === type 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All Goals' : `${type} Goals`}
          </button>
        ))}
      </div>
      
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-black text-xl text-gray-600 mb-2">No Goals Yet</h3>
          <p className="text-gray-500 mb-6">Create your first financial goal to start tracking your progress</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            Create Your First Goal
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
