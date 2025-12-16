import React, { useEffect, useState } from "react"
import { Layers, Tag, Plus, ArrowLeft, Calendar, DollarSign, Edit } from "lucide-react"
import apiService from "../services/api"
import { useAuth } from "../contexts/AuthContext"


const formatCurrency = (v) => typeof v === "number" ? `₹${v.toLocaleString()}` : "₹0"
const fmtAmount = (amt) => Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 })

const CATEGORY_COLORS = ["#2563EB", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function CategoriesPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return sessionStorage.getItem('selectedAccount') || 'all'
  })
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  useEffect(() => {
    const handleAccountChange = (event) => {
      setSelectedAccountId(event.detail)
    }
    
    window.addEventListener('accountChanged', handleAccountChange)
    
    if (user?.userId) {
      loadAccounts()
      loadCategories()
    }
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange)
    }
  }, [user])

  useEffect(() => {
    if (user?.userId) {
      loadCategories()
    }
  }, [selectedAccountId, user])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiService.getCategories()
      const categoriesArray = Array.isArray(data) ? data : []
      
      // Load transactions for each category to calculate amounts
      const enrichedCategories = await Promise.all(
        categoriesArray.map(async (cat, idx) => {
          try {
            const txns = await apiService.getTransactionsByCategoryId(cat.id)
            const transactions = Array.isArray(txns) ? txns : []
            
            const debitAmount = transactions
              .filter(t => t.typeTransaction?.toLowerCase() === 'debit')
              .reduce((sum, t) => sum + Number(t.amount || 0), 0)
            
            const creditAmount = transactions
              .filter(t => t.typeTransaction?.toLowerCase() === 'credit')
              .reduce((sum, t) => sum + Number(t.amount || 0), 0)
            
            return {
              ...cat,
              color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
              debitAmount,
              creditAmount,
              transactionCount: transactions.length
            }
          } catch (err) {
            return {
              ...cat,
              color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
              debitAmount: 0,
              creditAmount: 0,
              transactionCount: 0
            }
          }
        })
      )
      
      setCategories(enrichedCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactionsByCategory = async (categoryId) => {
    try {
      setLoadingTransactions(true)
      const data = await apiService.getTransactionsByCategoryId(categoryId)
      setTransactions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      setError('Failed to load transactions for this category')
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    setShowTransactionsDialog(true)
    loadTransactionsByCategory(category.id)
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const closeTransactionsDialog = () => {
    setShowTransactionsDialog(false)
    setSelectedCategory(null)
    setTransactions([])
    setError('')
  }

  const handleEditCategory = (e, category) => {
    e.stopPropagation()
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setShowEditDialog(true)
  }

  const updateCategory = async () => {
    if (!editCategoryName.trim()) {
      showToast('Category name cannot be empty', 'error')
      return
    }
    
    try {
      await apiService.updateCategory(editingCategory.id, { name: editCategoryName.trim() })
      showToast('Category updated successfully!', 'success')
      setShowEditDialog(false)
      setEditingCategory(null)
      setEditCategoryName('')
      await loadCategories()
    } catch (error) {
      showToast('Failed to update category', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-600">Loading categories...</div>
      </div>
    )
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button 
          onClick={async () => {
            try {
              setLoading(true)
              const accountId = selectedAccountId === 'all' ? null : selectedAccountId
              await apiService.runCategorization(accountId)
              showToast('AI categorization started successfully!', 'success')
              await loadCategories()
            } catch (error) {
              showToast('Failed to start AI categorization', 'error')
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 shadow-lg"
        >
          <Layers className="w-4 h-4" />
          <span>{loading ? 'Processing...' : 'AI Categorize'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg border bg-white ${
            toast.type === 'success' 
              ? 'border-l-4 border-l-purple-600' 
              : 'border-l-4 border-l-red-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${
                toast.type === 'success' ? 'bg-purple-600' : 'bg-red-600'
              }`}></div>
              <span className="text-sm font-medium text-gray-800">{toast.message}</span>
            </div>
          </div>
        </div>
      )}



      <div id="categories-content" className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Total Categories</h3>
            <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Total Debited</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(categories.reduce((sum, c) => sum + (c.debitAmount || 0), 0))}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Total Credited</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(categories.reduce((sum, c) => sum + (c.creditAmount || 0), 0))}
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, idx) => (
              <div 
                key={category.id || idx} 
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold dark:text-gray-100">{category.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{category.transactionCount} transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditCategory(e, category)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{formatCurrency(category.debitAmount)}</p>
                    <p className="text-xs text-gray-600">Debited</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(category.creditAmount)}</p>
                    <p className="text-xs text-gray-600">Credited</p>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">Click to view transactions</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No Categories</h3>
            <p className="text-gray-500 dark:text-gray-400">Categories will appear here once you have transactions</p>
          </div>
        )}
      </div>
      
      {/* Transactions Dialog */}
      {showTransactionsDialog && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    {selectedCategory.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCategory.name} Transactions</h3>
                    <p className="text-sm text-gray-600">{transactions.length} transactions</p>
                  </div>
                </div>
                <button
                  onClick={closeTransactionsDialog}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {loadingTransactions && <p className="text-center py-8">Loading transactions...</p>}
              
              {!loadingTransactions && transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No transactions found for this category.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr className="text-left text-gray-700">
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Merchant</th>
                        <th className="p-3 font-semibold">Notes</th>
                        <th className="p-3 font-semibold text-center">Type</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => {
                        const type = txn.typeTransaction?.toLowerCase();
                        const amt = Number(txn.amount);
                        return (
                          <tr key={txn.id} className="hover:bg-gray-50 transition">
                            <td className="p-3">{txn.date}</td>
                            <td className="p-3 font-medium">{txn.merchant}</td>
                            <td className="p-3 text-gray-600">{txn.notes}</td>
                            <td className="p-3 text-center">
                              {type === "credit" ? (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                                  Credit
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                                  Debit
                                </span>
                              )}
                            </td>
                            <td className={`p-3 text-right font-semibold ${
                              type === "debit" ? "text-red-600" : "text-green-600"
                            }`}>
                              ₹ {fmtAmount(amt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Category Dialog */}
      {showEditDialog && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-xl mb-4 dark:text-gray-100">Edit Category</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Category Name</label>
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter category name"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingCategory(null)
                  setEditCategoryName('')
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={updateCategory}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
      

    </div>
  )
}