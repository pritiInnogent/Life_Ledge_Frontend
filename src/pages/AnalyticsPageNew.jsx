import React, { useState, useEffect } from 'react'
import { BarChart3, PieChart, TrendingUp, DollarSign, Calendar, Target } from 'lucide-react'
import ApiService from '../services/api'

// Line Chart Component
const LineChart = ({ data, title }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>

  const maxValue = Math.max(...data.map(d => d.amount), 1)
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      <h3 className="text-xl font-bold mb-6 text-gray-800">{title}</h3>
      <div className="h-64 flex items-end justify-between gap-2 overflow-hidden">
        {data.map((item, i) => {
          const height = (item.amount / maxValue) * 100
          return (
            <div key={i} className="flex flex-col items-center flex-1 group">
              <div className="text-xs font-medium mb-2 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{item.amount.toLocaleString()}
              </div>
              <div 
                className="w-full bg-gradient-to-t from-purple-500 to-cyan-400 rounded-t-lg min-h-[8px] transition-all duration-500 hover:from-purple-600 hover:to-cyan-500 cursor-pointer"
                style={{ height: `${Math.max(height, 8)}%` }}
              />
              <div className="text-xs font-medium mt-2 text-gray-500">{item.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Donut Chart Component
const DonutChart = ({ data, title }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>

  const total = data.reduce((sum, item) => sum + item.amount, 0)
  const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1']
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      <h3 className="text-xl font-bold mb-6 text-gray-800">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, i) => {
              const percentage = (item.amount / total) * 100
              const strokeDasharray = `${percentage} ${100 - percentage}`
              const strokeDashoffset = data.slice(0, i).reduce((sum, prev) => sum + (prev.amount / total) * 100, 0)
              
              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="15.915"
                  fill="transparent"
                  stroke={colors[i % colors.length]}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  className="transition-all duration-500 hover:stroke-width-10 cursor-pointer"
                />
              )
            })}
          </svg>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">₹{item.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (accountFilter !== 'all') {
      fetchAnalyticsData()
    } else {
      setAnalyticsData(null)
    }
  }, [accountFilter])

  const loadAccounts = async () => {
    try {
      const data = await ApiService.getAccounts()
      setAccounts(data || [])
      if (data?.length > 0) {
        setAccountFilter(data[0].id.toString())
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    if (accountFilter === 'all') return
    
    try {
      setLoading(true)
      const response = await ApiService.getAnalytics()
      setAnalyticsData(response)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate mock data for demonstration if no real data
  const generateMockData = () => {
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.floor(Math.random() * 50000) + 10000
      }
    })

    const categoryData = [
      { name: 'Food & Dining', amount: 25000 },
      { name: 'Transportation', amount: 15000 },
      { name: 'Shopping', amount: 20000 },
      { name: 'Entertainment', amount: 8000 },
      { name: 'Bills & Utilities', amount: 12000 }
    ]

    return { monthlySpending: monthlyData, categoryBreakdown: categoryData }
  }

  if (accountFilter === 'all' || accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-cyan-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Select Bank Account</label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">Select Bank Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} ••••{account.last4Digits}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl text-center border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              Analytics Dashboard
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Choose a bank account to view detailed spending analytics and insights
            </p>
          </div>
        </div>
      </div>
    )
  }

  const displayData = analyticsData || generateMockData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-cyan-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Bank Account</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} ••••{account.last4Digits}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: DollarSign, label: 'Total Spending', value: '₹80,000', change: '+12%' },
                { icon: Calendar, label: 'This Month', value: '₹25,000', change: '-5%' },
                { icon: TrendingUp, label: 'Average Daily', value: '₹2,667', change: '+8%' },
                { icon: Target, label: 'Budget Used', value: '67%', change: 'On track' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm text-green-600 font-bold">{stat.change}</div>
                  </div>
                  <div className="text-2xl font-black mb-1 text-gray-900">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LineChart 
                data={displayData.monthlySpending} 
                title="Monthly Spending Timeline" 
              />
              <DonutChart 
                data={displayData.categoryBreakdown} 
                title="Spending by Category" 
              />
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Top Merchants</h3>
                <div className="space-y-3">
                  {['Amazon', 'Swiggy', 'Uber', 'Netflix', 'Zomato'].map((merchant, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{merchant}</span>
                      <span className="font-bold text-gray-900">₹{(Math.random() * 5000 + 1000).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Spending Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Weekday Average</span>
                    <span className="font-bold text-gray-900">₹2,400</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Weekend Average</span>
                    <span className="font-bold text-gray-900">₹3,200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Peak Hour</span>
                    <span className="font-bold text-gray-900">2-4 PM</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Budget Status</h3>
                <div className="space-y-4">
                  {['Food', 'Transport', 'Entertainment'].map((category, i) => {
                    const percentage = Math.floor(Math.random() * 40) + 40
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{category}</span>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}