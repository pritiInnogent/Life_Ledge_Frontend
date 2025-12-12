import React, { useState, useEffect } from 'react'
import { Target, Plus, CheckCircle2, Clock, AlertCircle, X, Bell, ChevronLeft, ChevronRight } from 'lucide-react'
import ApiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import DownloadButton from '../components/DownloadButton'

const formatCurrency = (v) => typeof v === "number" ? `₹${v.toLocaleString()}` : "₹0"

const GoalCard = ({ goal, onDelete, onEdit, onContribute }) => {
  const currentAmount = Number(goal.currentAmount) || 0
  const targetAmount = Number(goal.targetAmount) || 1
  const progress = Math.min((currentAmount / targetAmount) * 100, 100)
  
  const getTypeIcon = (type) => {
    switch(type) {
      case 'BUDGET': return '💰'
      case 'SAVING': return '🎯'
      case 'SPENDINGCAP': return '🚫'
      default: return '🎯'
    }
  }
  
  const getTypeColor = (type) => {
    switch(type) {
      case 'BUDGET': return 'bg-blue-100 text-blue-600'
      case 'SAVING': return 'bg-green-100 text-green-600'
      case 'SPENDINGCAP': return 'bg-red-100 text-red-600'
      default: return 'bg-purple-100 text-purple-600'
    }
  }
  
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(goal.type)}`}>
            <span className="text-lg">{getTypeIcon(goal.type)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{goal.name || 'Unnamed Goal'}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">{goal.category || 'General'}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getTypeColor(goal.type)}`}>
                {goal.type || 'BUDGET'}
              </span>
              {daysLeft !== null && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  daysLeft < 0 ? 'bg-red-100 text-red-600' :
                  daysLeft < 30 ? 'bg-orange-100 text-orange-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                </span>
              )}
            </div>
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
          {progress >= 100 ? (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
              Done
            </span>
          ) : daysLeft !== null && daysLeft < 0 ? (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
              Overdue
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              Running
            </span>
          )}
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
    type: goal?.type || 'BUDGET',
    startDate: goal?.startDate || new Date().toISOString().split('T')[0],
    deadline: goal?.deadline || ''
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
                <option value="BUDGET">💰 Budget</option>
                <option value="SAVING">🎯 Savings Goal</option>
                <option value="SPENDINGCAP">🚫 Spending Cap</option>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-3 border rounded-lg"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full p-3 border rounded-lg"
                min={formData.startDate}
              />
            </div>
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
  const [recalculating, setRecalculating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [currentNudgeIndex, setCurrentNudgeIndex] = useState(0)

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
      const updatedNudges = nudges.filter(n => n.id !== nudgeId)
      setNudges(updatedNudges)
      if (currentNudgeIndex >= updatedNudges.length) {
        setCurrentNudgeIndex(Math.max(0, updatedNudges.length - 1))
      }
    } catch (err) {
      console.error('Error marking nudge as read:', err)
      const updatedNudges = nudges.filter(n => n.id !== nudgeId)
      setNudges(updatedNudges)
      if (currentNudgeIndex >= updatedNudges.length) {
        setCurrentNudgeIndex(Math.max(0, updatedNudges.length - 1))
      }
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

  const deleteGoal = (goalId) => {
    const goal = goals.find(g => g.id === goalId)
    setDeleteConfirm({ goalId, goalName: goal?.name || 'this goal' })
  }

  const confirmDelete = async () => {
    try {
      await ApiService.deleteGoal(deleteConfirm.goalId)
      setGoals(goals.filter(g => g.id !== deleteConfirm.goalId))
      await loadNudges()
      setDeleteConfirm(null)
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

  const recalculateNudges = async () => {
    try {
      setRecalculating(true)
      await ApiService.recalculateNudges()
      await loadNudges()
    } catch (err) {
      console.error('Error recalculating nudges:', err)
      alert('Failed to recalculate nudges')
    } finally {
      setRecalculating(false)
    }
  }

  const deleteAllGoals = async () => {
    try {
      setDeletingAll(true)
      await ApiService.deleteAllGoals()
      setGoals([])
      await loadNudges()
      setDeleteAllConfirm(false)
    } catch (err) {
      console.error('Error deleting all goals:', err)
      alert('Failed to delete all goals')
    } finally {
      setDeletingAll(false)
    }
  }

  const nextNudge = () => {
    setCurrentNudgeIndex((prev) => (prev + 1) % nudges.length)
  }

  const prevNudge = () => {
    setCurrentNudgeIndex((prev) => (prev - 1 + nudges.length) % nudges.length)
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
          {goals.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              disabled={deletingAll}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
              Delete All
            </button>
          )}
          <button
            onClick={recalculateNudges}
            disabled={recalculating}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Target className="w-5 h-5" />
            {recalculating ? 'Tracking...' : 'Track Goals'}
          </button>
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
              <div className="flex items-center gap-2">
                {nudges.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevNudge}
                      className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-orange-600" />
                    </button>
                    <span className="text-xs text-orange-600 font-semibold px-2">
                      {currentNudgeIndex + 1} of {nudges.length}
                    </span>
                    <button
                      onClick={nextNudge}
                      className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-orange-600" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setNudges([])}
                  className="text-sm text-orange-600 hover:text-orange-800 font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>
            {(() => {
              const nudge = nudges[currentNudgeIndex];
              const progress = nudge.progressPercent || 0;
              const spentAmount = nudge.spentAmount || 0;
              const targetAmount = nudge.targetAmount || 0;
              const remainingAmount = nudge.remainingAmount || 0;
              const exceededAmount = nudge.exceededAmount || 0;
              
              return (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-bold text-red-600">{nudge.title || 'Alert'}</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">{nudge.goalName || 'Goal'}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-800 leading-relaxed">{nudge.message}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="font-semibold text-gray-800">₹{spentAmount.toLocaleString()}</div>
                          <div className="text-gray-600">Spent</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="font-semibold text-gray-800">₹{targetAmount.toLocaleString()}</div>
                          <div className="text-gray-600">Target</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className={`font-semibold ${exceededAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{exceededAmount > 0 ? exceededAmount.toLocaleString() : remainingAmount.toLocaleString()}
                          </div>
                          <div className="text-gray-600">{exceededAmount > 0 ? 'Exceeded' : 'Remaining'}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
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
                </div>
              );
            })()}
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
      
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-xl mb-4 text-red-600">Delete Goal</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.goalName}</strong>? This action cannot be undone.
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
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-xl mb-4 text-red-600">Delete All Goals</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>all {goals.length} goals</strong>? This action cannot be undone and will remove all your financial goals permanently.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAllConfirm(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllGoals}
                disabled={deletingAll}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAll ? 'Deleting...' : 'Delete All Goals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}