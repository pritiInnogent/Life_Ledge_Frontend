import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, X, Edit, Trash2, Brain, RefreshCw } from 'lucide-react'
import apiService from '../services/api'
import CategoryTransactionsModal from '../components/CategoryTransactionsModal'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const commonIcons = [
  '🍔', '🚗', '🛒', '🎬', '🏥', '💡', '✈️', '📚', '💰', '🏠',
  '⛽', '🍕', '🚌', '👕', '🎮', '💊', '📱', '🎵', '🏋️', '🐕'
]

export default function CategoriesPage() {


  const [categories, setCategories] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', type: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryTransactions, setCategoryTransactions] = useState({})
  const [loadingTransactions, setLoadingTransactions] = useState(null)
  const [aiCategorizing, setAiCategorizing] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState(null)

  useEffect(() => {
    loadAccounts()
    fetchCategories()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      setAccounts(data || [])
      if (data && data.length > 0) {
        setSelectedAccount(data[0].id)
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
    }
  }

  const runAICategorization = async () => {
    if (!selectedAccount) {
      setError('Please select an account first')
      return
    }
    
    try {
      setAiCategorizing(true)
      setError('')
      
      console.log('Running AI categorization for account:', selectedAccount)
      await apiService.runCategorization(selectedAccount)
      
      // Wait longer and refresh everything
      setTimeout(async () => {
        console.log('Refreshing categories and transactions after AI categorization')
        await fetchCategories() // This will reload categories and their transaction counts
        setAiCategorizing(false)
      }, 5000) // Increased timeout to 5 seconds
      
    } catch (err) {
      console.error('Error running AI categorization:', err)
      setError('Failed to run AI categorization: ' + err.message)
      setAiCategorizing(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Calling ApiService.getCategories()...')
      const data = await apiService.getCategories()
      console.log('Raw API response:', data)
      console.log('Data type:', typeof data)
      console.log('Is array:', Array.isArray(data))
      
      // Handle different response formats
      let categories = []
      if (Array.isArray(data)) {
        categories = data
      } else if (data && Array.isArray(data.data)) {
        categories = data.data
      } else if (data && data.categories) {
        categories = data.categories
      }
      
      console.log('Processed categories:', categories)
      setCategories(categories)
      
      // Load transaction counts for each category
      const transactionCounts = {}
      for (const category of categories) {
        try {
          const transactions = await apiService.getTransactionsByCategory(category.id)
          transactionCounts[category.id] = transactions
        } catch (error) {
          console.error(`Failed to load transactions for category ${category.id}:`, error)
          transactionCounts[category.id] = []
        }
      }
      setCategoryTransactions(transactionCounts)
    } catch (error) {
      console.error('Error fetching categories:', error)
      console.error('Error details:', error.response || error.message)
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Session expired. Please login again.')
      } else {
        setError('Failed to load categories. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }




  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.type) {
      setError('Please fill in name and type fields')
      return
    }

    try {
      setSaving(true)
      setError('')
      
      const categoryData = {
        name: newCategory.name,
        icon: newCategory.icon || newCategory.name.charAt(0),
        type: newCategory.type
      }
      
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, categoryData)
      } else {
        await apiService.createCategory(categoryData)
      }
      
      // Refresh categories to show updated data
      await fetchCategories()
      setNewCategory({ name: '', icon: '', type: '' })
      setEditingCategory(null)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error saving category:', error)
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Session expired. Please login again.')
      } else {
        setError('Failed to save category. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setNewCategory({ name: category.name, icon: category.icon || '', type: category.type || 'expense' })
    setShowAddModal(true)
  }

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setError('')
        await apiService.deleteCategory(categoryId)
        await fetchCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setError('Session expired. Please login again.')
        } else {
          setError('Failed to delete category. Please try again.')
        }
      }
    }
  }

  const handleSeeMoreTransactions = async (category) => {
    try {
      const allTransactions = await apiService.getTransactionsByCategory(category.id)
      setSelectedCategoryForModal({ ...category, transactions: allTransactions })
      setShowTransactionsModal(true)
    } catch (error) {
      console.error('Failed to load all transactions:', error)
    }
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
          <h1 className="text-3xl font-black">Categories</h1>
          <p className="text-gray-600 font-semibold">Organize and analyze your spending patterns</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAICategorization}
            disabled={aiCategorizing}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {aiCategorizing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            {aiCategorizing ? 'Categorizing...' : 'AI Categorize'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg font-semibold text-gray-600">Loading categories...</div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow text-center">
          <h3 className="font-black text-xl text-gray-600 mb-2">No Categories Yet</h3>
          <p className="text-gray-500 mb-6">Create your first category to start organizing transactions</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            Add Your First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSeeMoreTransactions(category)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">{category.icon || category.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{category.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{category.type || 'Category'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditCategory(category)
                    }}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id)
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-600">Transactions</span>
                  <span className="text-lg font-black text-gray-900">
                    {(categoryTransactions[category.id] || []).length}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <span className="text-xs font-bold text-purple-600">
                    Click to view all transactions →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => {
                setShowAddModal(false)
                setEditingCategory(null)
                setNewCategory({ name: '', icon: '', type: '' })
              }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-semibold"
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Icon</label>
                <div className="grid grid-cols-10 gap-2 mb-3">
                  {commonIcons.map((icon, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setNewCategory({...newCategory, icon})}
                      className={`w-8 h-8 text-lg rounded border-2 hover:border-purple-500 transition-colors ${
                        newCategory.icon === icon ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-semibold"
                  placeholder="Or enter custom icon"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg font-semibold"
                >
                  <option value="">Select type</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingCategory(null)
                  setNewCategory({ name: '', icon: '', type: '' })
                }}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
              >
                {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Add')} Category
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transactions Modal */}
      {showTransactionsModal && selectedCategoryForModal && (
        <CategoryTransactionsModal
          category={selectedCategoryForModal}
          transactions={selectedCategoryForModal.transactions || []}
          onClose={() => {
            setShowTransactionsModal(false)
            setSelectedCategoryForModal(null)
          }}
        />
      )}
    </div>
  )
}