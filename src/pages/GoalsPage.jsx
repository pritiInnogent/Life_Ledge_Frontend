import React, { useState, useEffect } from 'react'
import { Target, Plus, CheckCircle2, Clock, AlertCircle, X, Bell } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import DownloadButton from '../components/DownloadButton'

const formatCurrency = (v) => typeof v === "number" ? `₹${v.toLocaleString()}` : "₹0"

const GoalCard = ({ goal, onDelete, onEdit, onContribute }) => {
  const currentAmount = Number(goal.currentAmount) || 0
  const targetAmount = Number(goal.targetAmount) || 1
  const progress = Math.min((currentAmount / targetAmount) * 100, 100)
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{goal.name || 'Unnamed Goal'}</h3>
            <p className="text-sm text-gray-600">{goal.category || 'General'}</p>
          </div>
        </div>
        <button 
          onClick={() => onDelete && onDelete(goal.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{formatCurrency(currentAmount)}</div>
            <div className="text-xs text-gray-600">Current Amount</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{formatCurrency(targetAmount)}</div>
            <div className="text-xs text-gray-600">Target Amount</div>
          </div>
        </div>
        <div className="text-center mt-3">
          <span className="text-sm font-semibold text-gray-600">
            {progress >= 100 ? 'Goal Completed!' : `${progress.toFixed(1)}% Complete`}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onContribute && onContribute(goal.id)}
          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Add Money
        </button>
        <button
          onClick={() => onEdit && onEdit(goal)}
          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Edit Goal
        </button>
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
    type: goal?.type || 'budget'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.targetAmount) {
      alert('Please fill in required fields')
      return
    }
    
    onSave({
      ...goal,
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="font-bold text-xl mb-4">{goal ? 'Edit Goal' : 'Create New Goal'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Goal Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-lg"
              placeholder="e.g., Emergency Fund"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 border rounded-lg"
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
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 border rounded-lg"
                placeholder="e.g., Food"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Target Amount (₹) *</label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
              className="w-full p-3 border rounded-lg"
              placeholder="50000"
              min="1"
              required
            />
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
  const [nudges, setNudges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  useEffect(() => {
    if (user?.userId) {
      loadGoals()
      loadNudges()
    }
  }, [user])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getUserGoals()
      setGoals(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading goals:', err)
      setError('Failed to load goals')
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  const loadNudges = async () => {
    try {
      const data = await ApiService.getUserNudges()
      setNudges(Array.isArray(data) ? data.slice(0, 3) : []) // Limit to 3
    } catch (err) {
      console.error('Error loading nudges:', err)
      setNudges([])
    }
  }

  const markNudgeAsRead = async (nudgeId) => {
    try {
      await ApiService.markNudgeAsRead(nudgeId)
      setNudges(nudges.filter(n => n.id !== nudgeId))
    } catch (err) {
      console.error('Error marking nudge as read:', err)
      setNudges(nudges.filter(n => n.id !== nudgeId))
    }
  }

  const saveGoal = async (goalData) => {
    try {
      if (goalData.id) {
        await ApiService.updateGoal(goalData.id, goalData)
        setGoals(goals.map(g => g.id === goalData.id ? goalData : g))
      } else {
        const savedGoal = await ApiService.createGoal(goalData)
        setGoals([...goals, savedGoal])
      }
      setShowForm(false)
      setEditingGoal(null)
    } catch (err) {
      console.error('Error saving goal:', err)
      alert('Failed to save goal')
    }
  }

  const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    try {
      await ApiService.deleteGoal(goalId)
      setGoals(goals.filter(g => g.id !== goalId))
    } catch (err) {
      console.error('Error deleting goal:', err)
      alert('Failed to delete goal')
    }
  }

  const editGoal = (goal) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  const contributeToGoal = async (goalId) => {
    const amount = prompt('Enter amount to add:')
    if (!amount || isNaN(amount) || Number(amount) <= 0) return
    
    try {
      await ApiService.contributeToGoal(goalId, Number(amount))
      await loadGoals()
    } catch (err) {
      console.error('Error contributing to goal:', err)
      alert('Failed to add contribution')
    }
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
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-gray-600 font-semibold">Track your budgets, savings, and spending targets</p>
        </div>
        <div className="flex gap-3">
          <DownloadButton targetId="goals-content" filename="goals-report" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Goal
          </button>
        </div>
      </div>

      <div id="goals-content" className="space-y-8">
        {/* Nudges Section */}
        {nudges.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-orange-800">Budget Alerts</h3>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{nudges.length}</span>
              </div>
              <button
                onClick={() => setNudges([])}
                className="text-sm text-orange-600 hover:text-orange-800 font-semibold"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-3">
              {nudges.map((nudge) => (
                <div key={nudge.id} className="bg-white rounded-lg p-4 flex items-start justify-between shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-red-600">{nudge.title || 'Alert'}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{nudge.goalName || 'Goal'}</span>
                    </div>
                    <p className="text-sm text-gray-700">{nudge.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(nudge.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => markNudgeAsRead(nudge.id)}
                    className="text-gray-400 hover:text-red-600 ml-3 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-gray-600">Total Goals</span>
            </div>
            <div className="text-2xl font-bold">{goals.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-600">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {goals.filter(g => (g.currentAmount / g.targetAmount) >= 1).length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-600">In Progress</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {goals.filter(g => (g.currentAmount / g.targetAmount) < 1).length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-gray-600">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0))}
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onDelete={deleteGoal}
                onEdit={editGoal}
                onContribute={contributeToGoal}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-xl text-gray-600 mb-2">No Goals Yet</h3>
            <p className="text-gray-500 mb-6">Create your first financial goal to start tracking your progress</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        )}
      </div>
      
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