import React, { useEffect, useState } from "react"
import { Layers, Tag, Plus } from "lucide-react"
import apiService from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import DownloadButton from "../components/DownloadButton"

const formatCurrency = (v) => typeof v === "number" ? `₹${v.toLocaleString()}` : "₹0"

const CATEGORY_COLORS = ["#2563EB", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function CategoriesPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      
      const enrichedCategories = categoriesArray.map((cat, idx) => ({
        ...cat,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        amount: Math.random() * 50000 + 10000,
        transactionCount: Math.floor(Math.random() * 50) + 5
      }))
      
      setCategories(enrichedCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
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
            <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(categories.reduce((sum, c) => sum + (c.amount || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Transactions</h3>
            <p className="text-3xl font-bold text-purple-600">
              {categories.reduce((sum, c) => sum + (c.transactionCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, idx) => (
              <div key={category.id || idx} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow">
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
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(category.amount)}</p>
                  <p className="text-sm text-gray-600">Total spent</p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, (category.amount / 50000) * 100)}%`,
                      backgroundColor: category.color 
                    }}
                  />
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
    </div>
  )
}