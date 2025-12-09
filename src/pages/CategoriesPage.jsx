import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, X, Edit, Trash2 } from 'lucide-react'
import apiService from '../services/api'

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
  const [activeFilter, setActiveFilter] = useState('monthly')
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', type: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryTransactions, setCategoryTransactions] = useState({})
  const [loadingTransactions, setLoadingTransactions] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

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


  const toggleCategory = async (index) => {
    const category = categories[index]
    
    if (expandedCategory === index) {
      setExpandedCategory(null)
      return
    }
    
    setExpandedCategory(index)
    
    // Load transactions for this category if not already loaded
    if (!categoryTransactions[category.id]) {
      try {
        setLoadingTransactions(category.id)
        const transactions = await apiService.getTransactionsByCategory(category.id)
        setCategoryTransactions(prev => ({
          ...prev,
          [category.id]: transactions
        }))
      } catch (error) {
        console.error('Failed to load transactions:', error)
        setCategoryTransactions(prev => ({
          ...prev,
          [category.id]: []
        }))
      } finally {
        setLoadingTransactions(null)
      }
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

  return (
    <div className="min-h-screen bg-white p-6 space-y-6">
      <div className="flex justify-between items-center">
        {/* Filter Buttons */}
        <div className="flex gap-2">
        {['weekly', 'monthly', 'yearly'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg capitalize transition-all shadow-lg ${
              activeFilter === filter
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-purple-500/30'
                : 'bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 shadow-purple-400/20'
            }`}
          >
            {filter}
          </button>
        ))}
        </div>

        {/* Add Category Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Category Cards Grid */}
      <div className="bg-white rounded-lg p-6 space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No categories found</div>
        ) : categories.map((category, index) => (
          <div key={index} className="bg-gradient-to-r from-purple-100 to-lavender-100 rounded-lg shadow-md border border-purple-200 overflow-hidden" style={{background: 'linear-gradient(to right, #f3e8ff, #e9d5ff)'}}>
            {/* Main Category Card */}
            <div
              className="p-6 cursor-pointer hover:bg-purple-50 transition-colors"
              onClick={() => toggleCategory(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-2xl bg-white shadow-lg border border-purple-200"
                  >
                    {category.icon ? (
                      <span className="text-2xl">{category.icon}</span>
                    ) : (
                      <span className="text-purple-600">{category.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.type || 'Category'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCategory(category)
                      }}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCategory(category.id)
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {expandedCategory === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Category Details Dropdown */}
            {expandedCategory === index && (
              <div className="border-t bg-white bg-opacity-50">
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 capitalize">{category.type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Icon:</span>
                      <span className="ml-2 text-lg">{category.icon || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Transactions Section */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Transactions</h4>
                    
                    {loadingTransactions === category.id ? (
                      <div className="text-center py-4 text-gray-500">Loading transactions...</div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(categoryTransactions[category.id] || []).length === 0 ? (
                          <div className="text-center py-4 text-gray-500">No transactions found</div>
                        ) : (
                          (categoryTransactions[category.id] || []).slice(0, 5).map((txn, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-800">{txn.merchant || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">{txn.date}</div>
                              </div>
                              <div className={`font-semibold ${
                                txn.typeTransaction === 'debit' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                ₹{Number(txn.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                        
                        {(categoryTransactions[category.id] || []).length > 5 && (
                          <div className="text-center py-2 text-sm text-gray-500">
                            +{(categoryTransactions[category.id] || []).length - 5} more transactions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 w-96 border border-purple-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => {
                setShowAddModal(false)
                setEditingCategory(null)
                setNewCategory({ name: '', icon: '', type: '' })
              }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
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
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Or enter custom icon"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select type</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingCategory(null)
                  setNewCategory({ name: '', icon: '', type: '' })
                }}
                className="flex-1 px-4 py-2 border border-purple-900 rounded-lg hover:bg-purple-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}