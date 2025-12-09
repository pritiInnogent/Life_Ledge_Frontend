import React, { useState, useEffect } from 'react'
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import '../styles/animations.css'

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')

  useEffect(() => {
    if (user?.userId) {
      loadAnalyticsData()
      loadAccounts()
    }
  }, [user])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getLatestAnalytics()
      console.log('Analytics API Response:', response)
      const analyticsData = response.analytics || response
      setData(transformAnalyticsData(analyticsData))
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError(error.message)
      setData(getFallbackData())
    } finally {
      setLoading(false)
    }
  }

  const transformAnalyticsData = (analyticsData) => {
    console.log('Transforming analytics data:', analyticsData)
    return {
      monthlyTimeline: (analyticsData?.monthlyTimeline || []).map(item => ({
        month: item.month,
        amount: item.expenses || 0
      })),
      categories: (analyticsData?.topCategories || []).map((cat, i) => ({
        name: cat.category,
        amount: cat.amount,
        count: Math.round(cat.amount / 100),
        color: getCategoryColor(cat.category, i)
      })),
      merchants: (analyticsData?.topMerchants || []).map(merchant => ({
        name: merchant.merchant,
        amount: merchant.amount,
        count: merchant.transactions
      })),
      recurringVsOneTime: [
        { name: 'Recurring', amount: analyticsData?.spendingTypes?.recurring || 0, color: '#8B5CF6' },
        { name: 'One-time', amount: analyticsData?.spendingTypes?.oneTime || 0, color: '#06B6D4' }
      ],
      burnRate: {
        daily: analyticsData?.averages?.dailySpending || 0,
        projected: analyticsData?.averages?.monthlySpending || 0,
        current: analyticsData?.burnRate?.currentRate || 0,
        daysLeft: analyticsData?.burnRate?.daysToZero || 0,
        trend: analyticsData?.burnRate?.trend || 'stable'
      },
      yearOverYear: {
        current: analyticsData?.yearOverYear?.currentYearTotal || 0,
        previous: analyticsData?.yearOverYear?.previousYearTotal || 0,
        change: analyticsData?.yearOverYear?.changePercentage || 0,
        trend: analyticsData?.yearOverYear?.trend || 'stable'
      },
      averages: analyticsData?.averages || {}
    }
  }

  const getFallbackData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      monthlyTimeline: months.map(month => ({ month, amount: Math.random() * 50000 + 20000 })),
      categories: [
        { name: 'Food', amount: 35000, count: 45, color: '#8B5CF6' },
        { name: 'Transport', amount: 25000, count: 30, color: '#06B6D4' },
        { name: 'Entertainment', amount: 20000, count: 25, color: '#10B981' }
      ],
      merchants: [
        { name: 'Swiggy', amount: 15000, count: 25 },
        { name: 'Uber', amount: 12000, count: 20 }
      ],
      recurringVsOneTime: [
        { name: 'Recurring', amount: 40000, color: '#8B5CF6' },
        { name: 'One-time', amount: 30000, color: '#06B6D4' }
      ],
      burnRate: { daily: 2000, projected: 60000, current: 45000, daysLeft: 15 },
      yearOverYear: { current: 500000, previous: 450000, change: 11.1, trend: 'increasing' }
    }
  }

  const getCategoryColor = (name, index) => {
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6B7280', '#84CC16']
    return colors[index % colors.length]
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-lg">Loading analytics...</div>
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-500">No data available</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Filter by Bank Account</label>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} ••••{account.last4Digits}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          {error && <p className="text-sm text-orange-600 animate-pulse">Using fallback data - Backend unavailable</p>}
          <button
          onClick={loadAnalyticsData}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Refresh
            </>
          )}
        </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Spending Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Monthly Spending Timeline
          </h3>
          <LineChart data={data.monthlyTimeline} />
        </div>

        {/* Burn Rate Projection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Burn Rate Projection
          </h3>
          {error && <div className="text-sm text-red-600 mb-2 animate-bounce">Using fallback data</div>}
          <BurnRateChart burnRate={data.burnRate} />
        </div>

        {/* Top Categories Donut */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Top Categories
          </h3>
          <DonutChart categories={data.categories} />
        </div>

        {/* Top Merchants */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            Top Merchants
          </h3>
          <HorizontalBarChart merchants={data.merchants} />
        </div>

        {/* Recurring vs One-time */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.5s'}}>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            Recurring vs One-time
          </h3>
          <StackedBarChart data={data.recurringVsOneTime} />
        </div>

        {/* Average Cost per Category */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.6s'}}>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            Average Cost per Category
          </h3>
          <CategoryAverageChart categories={data.categories} />
        </div>
      </div>

      {/* Full-width Year-over-Year */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.7s'}}>
        <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
          Year-over-Year Comparison
        </h3>
        <YearOverYearChart data={data.yearOverYear} monthlyData={data.monthlyTimeline} />
      </div>

      {/* Averages Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.8s'}}>
        <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
          Spending Averages
        </h3>
        <AveragesChart averages={data.averages} />
      </div>
    </div>
  )
}

// Chart Components
const LineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse">No data available</div>
  }
  
  const maxAmount = Math.max(...data.map(d => d.amount || 0), 1)
  const validData = data.filter(d => d.month && d.amount !== undefined)
  
  if (validData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse">No valid data</div>
  }
  
  return (
    <div className="h-48 animate-fade-in">
      <svg viewBox="0 0 400 150" className="w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Area */}
        <path
          d={`M 0 150 ${validData.map((d, i) => 
            `L ${(i / (validData.length - 1)) * 400} ${150 - ((d.amount || 0) / maxAmount) * 120}`
          ).join(' ')} L 400 150 Z`}
          fill="url(#lineGrad)"
          className="animate-draw-area"
        />
        
        {/* Line */}
        <path
          d={`M ${validData.map((d, i) => 
            `${(i / (validData.length - 1)) * 400} ${150 - ((d.amount || 0) / maxAmount) * 120}`
          ).join(' L ')}`}
          stroke="#3B82F6"
          strokeWidth="3"
          fill="none"
          filter="url(#glow)"
          className="animate-draw-line"
        />
        
        {/* Points */}
        {validData.map((d, i) => (
          <circle
            key={i}
            cx={(i / (validData.length - 1)) * 400}
            cy={150 - ((d.amount || 0) / maxAmount) * 120}
            r="4"
            fill="#3B82F6"
            className="animate-bounce-in hover:r-6 transition-all cursor-pointer"
            style={{animationDelay: `${i * 0.1}s`}}
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {validData.map((d, i) => (
          <span key={i} className="animate-fade-in" style={{animationDelay: `${i * 0.1}s`}}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

const DonutChart = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return <div className="h-40 flex items-center justify-center text-gray-500">No category data</div>
  }
  
  const total = categories.reduce((sum, cat) => sum + (cat.amount || 0), 0)
  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  let cumulativePercentage = 0
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {categories.map((cat, i) => {
            const percentage = (cat.amount / total) * 100
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -cumulativePercentage * circumference / 100
            cumulativePercentage += percentage
            
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold">₹{Math.round(total / 1000)}K</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
            <div className="text-sm">
              <div className="font-medium">{cat.name}</div>
              <div className="text-gray-500">₹{Math.round(cat.amount).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const HorizontalBarChart = ({ merchants }) => {
  if (!merchants || merchants.length === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-500 animate-pulse">No merchant data</div>
  }
  
  const maxAmount = Math.max(...merchants.map(m => m.amount || 0), 1)
  
  return (
    <div className="space-y-3">
      {merchants.map((merchant, i) => (
        <div key={i} className="flex items-center gap-3 animate-slide-right" style={{animationDelay: `${i * 0.1}s`}}>
          <div className="w-20 text-sm font-medium truncate">{merchant.name || 'Unknown'}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2 animate-expand-bar transition-all duration-1000 hover:from-blue-600 hover:to-purple-600"
              style={{ 
                width: `${((merchant.amount || 0) / maxAmount) * 100}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              <span className="text-xs text-white font-medium animate-fade-in" style={{animationDelay: `${i * 0.3}s`}}>
                ₹{Math.round((merchant.amount || 0) / 1000)}K
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const StackedBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-24 flex items-center justify-center text-gray-500">No spending type data</div>
  }
  
  const total = data.reduce((sum, d) => sum + (d.amount || 0), 0)
  
  if (total === 0) {
    return <div className="h-24 flex items-center justify-center text-gray-500">No spending data</div>
  }
  
  return (
    <div className="space-y-4">
      <div className="flex h-12 rounded-lg overflow-hidden">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-white text-sm font-medium"
            style={{
              width: `${((item.amount || 0) / total) * 100}%`,
              backgroundColor: item.color
            }}
          >
            {Math.round(((item.amount || 0) / total) * 100)}%
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        {data.map((item, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm font-medium">{item.name || 'Unknown'}</span>
            </div>
            <div className="text-lg font-bold">₹{Math.round((item.amount || 0) / 1000)}K</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const CategoryAverageChart = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-500">No category data</div>
  }
  
  const averages = categories.map(cat => ({
    ...cat,
    average: (cat.amount || 0) / Math.max(cat.count || 1, 1)
  }))
  const maxAvg = Math.max(...averages.map(a => a.average || 0), 1)
  
  return (
    <div className="space-y-3">
      {averages.map((cat, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || '#gray' }}></div>
            <span className="text-sm font-medium">{cat.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${((cat.average || 0) / maxAvg) * 100}%`,
                  backgroundColor: cat.color || '#gray'
                }}
              ></div>
            </div>
            <span className="text-sm font-bold w-16 text-right">₹{Math.round(cat.average || 0)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const BurnRateChart = ({ burnRate }) => {
  const daysInMonth = 30
  const progress = burnRate.daysLeft ? ((daysInMonth - burnRate.daysLeft) / daysInMonth) * 100 : 50
  const trendColor = burnRate.trend === 'increasing' ? 'text-red-600' : burnRate.trend === 'decreasing' ? 'text-green-600' : 'text-blue-600'
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">₹{Math.round(burnRate.daily || 0)}</div>
          <div className="text-sm text-gray-600">Daily Burn</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">₹{Math.round((burnRate.projected || 0) / 1000)}K</div>
          <div className="text-sm text-gray-600">Projected</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Current Rate</span>
          <span className={trendColor}>₹{Math.round(burnRate.current || 0)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 text-center">
          {burnRate.daysLeft || 0} days to zero • Trend: {burnRate.trend || 'stable'}
        </div>
      </div>
    </div>
  )
}

const YearOverYearChart = ({ data, monthlyData }) => {
  if (data && typeof data === 'object' && data.current !== undefined) {
    // New API format
    const changeColor = data.change > 0 ? 'text-green-600' : data.change < 0 ? 'text-red-600' : 'text-gray-600'
    const changeIcon = data.change > 0 ? '↗' : data.change < 0 ? '↘' : '→'
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">₹{Math.round((data.current || 0) / 1000)}K</div>
          <div className="text-sm text-gray-600">Current Year</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">₹{Math.round((data.previous || 0) / 1000)}K</div>
          <div className="text-sm text-gray-600">Previous Year</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${changeColor}`}>
            {changeIcon} {Math.abs(data.change || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Change</div>
        </div>
      </div>
    )
  }
  
  // Fallback to monthly timeline chart
  const maxAmount = Math.max(...(monthlyData?.map(d => d.amount) || [1]), 1)
  
  return (
    <div className="h-64">
      <svg viewBox="0 0 800 200" className="w-full h-full">
        {[0, 50, 100, 150, 200].map(y => (
          <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f3f4f6" strokeWidth="1" />
        ))}
        {(monthlyData || []).map((d, i) => (
          <rect
            key={i}
            x={(i / monthlyData.length) * 800 + 10}
            y={200 - (d.amount / maxAmount) * 180}
            width={800 / monthlyData.length - 20}
            height={(d.amount / maxAmount) * 180}
            fill="#3B82F6"
            rx="4"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {(monthlyData || []).map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

const AveragesChart = ({ averages }) => {
  const avgData = [
    { label: 'Daily', amount: averages?.dailySpending || 0, color: '#3B82F6' },
    { label: 'Weekly', amount: averages?.weeklySpending || 0, color: '#10B981' },
    { label: 'Monthly', amount: averages?.monthlySpending || 0, color: '#8B5CF6' }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {avgData.map((item, i) => (
        <div key={i} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
          <div className="text-2xl font-bold" style={{ color: item.color }}>
            ₹{Math.round(item.amount).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{item.label} Average</div>
        </div>
      ))}
    </div>
  )
}

export default AnalyticsPage