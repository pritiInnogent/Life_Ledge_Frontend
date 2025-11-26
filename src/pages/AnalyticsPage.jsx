import React, { useState, useEffect } from 'react'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import apiService from '../services/api'
import AnalyticsService from '../services/analyticsService'

export default function AnalyticsPage() {
  const [expenseData, setExpenseData] = useState([])
  const [earningsData, setEarningsData] = useState([])
  const [loading, setLoading] = useState(true)
  const analyticsService = new AnalyticsService(apiService)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const data = await analyticsService.getCategoryAnalytics()
      setExpenseData(data.expenses?.map(cat => ({ value: cat.amount, name: cat.name })) || [])
      setEarningsData(data.earnings?.map(cat => ({ value: cat.amount, name: cat.name })) || [])
    } catch (error) {
      console.error('Analytics fetch error:', error)
    } finally {
      setLoading(false)
    }
  }



  if (loading) return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Loading Analytics...</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="font-black mb-6">Category Analytics</h3>
        <div className="space-y-8">
          <CategoryPieChart data={expenseData} title="💸 Expense Distribution" />
          <CategoryPieChart data={earningsData} title="💰 Earnings Distribution" />
        </div>
      </div>
    </div>
  )
}
