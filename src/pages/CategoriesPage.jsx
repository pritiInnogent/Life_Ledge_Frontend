import React, { useEffect, useState } from "react"
import { Layers, Tag, Plus, ArrowLeft, Calendar, DollarSign } from "lucide-react"
import apiService from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import DownloadButton from "../components/DownloadButton"

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

  useEffect(() => {
    if (user?.userId) {
      loadCategories()
    }
  }, [user])

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

  const closeTransactionsDialog = () => {
    setShowTransactionsDialog(false)
    setSelectedCategory(null)
    setTransactions([])
    setError('')
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage your spending categories</p>
          </div>
        </div>
        <DownloadButton targetId="categories-content" filename="categories-report" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div id="categories-content">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Total Categories</h3>
            <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Total Debited</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(categories.reduce((sum, c) => sum + (c.debitAmount || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Total Credited</h3>
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
                className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.transactionCount} transactions</p>
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
          <div className="bg-white rounded-2xl p-12 shadow text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Categories</h3>
            <p className="text-gray-500">Categories will appear here once you have transactions</p>
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
    </div>
  )
}