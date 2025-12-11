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
      loadAccounts()
    }
  }, [user])

  useEffect(() => {
    if (accountFilter !== 'all' && accountFilter) {
      loadAnalyticsData(accountFilter)
    } else {
      setData(null)
      setError(null)
      setLoading(false)
    }
  }, [accountFilter])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const loadAnalyticsData = async (accountId) => {
    if (!accountId || accountId === 'all') return
    
    try {
      setLoading(true)
      setError(null)
      setData(null)
      
      const response = await apiService.getLatestAnalytics(accountId)
      const analyticsData = response.analytics || response
      
      const transformedData = transformAnalyticsData(analyticsData)
      const hasData = transformedData.monthlyTimeline?.length > 0 || 
                     transformedData.categories?.length > 0 || 
                     transformedData.merchants?.length > 0
      
      if (!hasData) {
        setError('No transaction data found for this account')
        setData(null)
      } else {
        setData(transformedData)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError(error.message)
      setData(null)
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



  const getCategoryColor = (name, index) => {
    const colors = ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE', '#06B6D4', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="flex justify-center py-20 text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (accountFilter === 'all' || !accountFilter) {
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
              <option value="all">Select Bank Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} ••••{account.last4Digits}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Select Account Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">Select Bank Account</h3>
          <p className="text-gray-600 mb-8 text-lg">Choose a specific bank account to view detailed analytics and insights</p>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <p className="text-sm font-semibold text-gray-700 mb-4">Analytics will show:</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Monthly spending timeline
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Category breakdown
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Top merchants analysis
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Spending patterns & trends
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
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
              <option value="all">Select Bank Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} ••••{account.last4Digits}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* No Data Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">No Transaction Data</h3>
          <p className="text-gray-600 mb-8 text-lg">
            {error ? `${error}. Add transactions to this account to see analytics.` : 'Add transactions to this account to see detailed analytics and insights'}
          </p>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <p className="text-sm font-semibold text-gray-700 mb-4">To see analytics, you need to:</p>
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Import bank statements or CSV files
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Add manual transactions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Have at least a few transactions to analyze
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/app/import'}
              className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Transactions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Filter by Bank Account</label>
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
        <div className="flex items-center gap-4">
          {error && <p className="text-sm text-red-600 animate-pulse">Error: {error}</p>}
          <button
          onClick={() => {
            console.log('Manual refresh clicked')
            console.log('Current accountFilter:', accountFilter)
            console.log('Current accounts:', accounts)
            if (accountFilter && accountFilter !== 'all') {
              console.log('Calling analytics API directly...')
              apiService.getLatestAnalytics(accountFilter)
                .then(response => console.log('Direct API response:', response))
                .catch(error => console.error('Direct API error:', error))
            }
            loadAnalyticsData()
          }}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Test API Call
            </>
          )}
        </button>
        </div>
      </div>

      {/* Top Row - Monthly Timeline & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Spending Timeline */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <h3 className="text-xl font-black mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
            Monthly Spending Timeline
          </h3>
          <LineChart data={data.monthlyTimeline} />
        </div>

        {/* Top Categories Donut */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h3 className="text-xl font-black mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse shadow-lg"></div>
            Top Categories
          </h3>
          <DonutChart categories={data.categories} />
        </div>
      </div>

      {/* Top Merchants - Full Width List */}
      <div className="bg-gradient-to-br from-white/95 via-indigo-50/30 to-purple-50/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-indigo-200/30 hover:shadow-indigo-200/40 hover:shadow-2xl transition-all duration-500 animate-slide-up mb-8" style={{animationDelay: '0.3s'}}>
        <h3 className="text-xl font-black mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse shadow-lg"></div>
          Top Merchants Leaderboard
        </h3>
        <HorizontalBarChart merchants={data.merchants} />
      </div>

      {/* Bottom Grid - Other Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burn Rate Projection */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <h3 className="text-lg font-black mb-4 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
            Burn Rate
          </h3>
          <BurnRateChart burnRate={data.burnRate} />
        </div>

        {/* Recurring vs One-time */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.5s'}}>
          <h3 className="text-lg font-black mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
            Spending Types
          </h3>
          <StackedBarChart data={data.recurringVsOneTime} />
        </div>

        {/* Average Cost per Category */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.6s'}}>
          <h3 className="text-lg font-black mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse shadow-lg"></div>
            Avg. Costs
          </h3>
          <CategoryAverageChart categories={data.categories} />
        </div>
      </div>

      {/* Bottom Full-width Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Year-over-Year Comparison */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.7s'}}>
          <h3 className="text-lg font-black mb-4 bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
            Year-over-Year
          </h3>
          <YearOverYearChart data={data.yearOverYear} monthlyData={data.monthlyTimeline} />
        </div>

        {/* Spending Averages */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-purple-100/50 hover:shadow-purple-200/50 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{animationDelay: '0.8s'}}>
          <h3 className="text-lg font-black mb-4 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse shadow-lg"></div>
            Spending Averages
          </h3>
          <AveragesChart averages={data.averages} />
        </div>
      </div>
    </div>
  )
}

// Chart Components
const LineChart = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = React.useState(null)
  
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse">No data available</div>
  }
  
  const maxAmount = Math.max(...data.map(d => d.amount || 0), 1)
  const validData = data.filter(d => d.month && d.amount !== undefined)
  
  if (validData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse">No valid data</div>
  }
  
  return (
    <div className="h-48 animate-fade-in relative">
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
            r={hoveredPoint === i ? "6" : "4"}
            fill="#3B82F6"
            className="animate-bounce-in transition-all cursor-pointer"
            style={{animationDelay: `${i * 0.1}s`}}
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div 
          className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10 pointer-events-none animate-fade-in"
          style={{
            left: `${(hoveredPoint / (validData.length - 1)) * 100}%`,
            top: `${((maxAmount - validData[hoveredPoint].amount) / maxAmount) * 75}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px'
          }}
        >
          <div className="text-center">
            <div className="font-bold">{validData[hoveredPoint].month}</div>
            <div className="text-blue-300">₹{Math.round(validData[hoveredPoint].amount / 1000)}K</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
      
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
                className="animate-draw-circle"
                style={{animationDelay: `${i * 0.2}s`}}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-fade-in" style={{animationDelay: '0.5s'}}>
            <div className="text-xl font-bold animate-bounce-in" style={{animationDelay: '0.8s'}}>₹{Math.round(total / 1000)}K</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-2 animate-slide-right hover:scale-105 transition-all duration-300 cursor-pointer group" style={{animationDelay: `${i * 0.1}s`}}>
            <div className="w-3 h-3 rounded-full animate-pulse group-hover:scale-125 transition-transform" style={{ backgroundColor: cat.color }}></div>
            <div className="text-sm">
              <div className="font-medium group-hover:text-purple-600 transition-colors">{cat.name}</div>
              <div className="text-gray-500 group-hover:text-gray-700 transition-colors">₹{Math.round(cat.amount).toLocaleString()}</div>
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
  
  const gradients = [
    'from-purple-500 to-indigo-500',
    'from-indigo-500 to-blue-500', 
    'from-blue-500 to-cyan-500',
    'from-cyan-500 to-teal-500',
    'from-teal-500 to-emerald-500'
  ]
  
  const getMerchantIcon = (name) => {
    if (!name) return '🏪'
    const icons = {
      'swiggy': '🍔', 'zomato': '🍕', 'uber': '🚗', 'ola': '🚕', 'amazon': '📦',
      'flipkart': '🛒', 'paytm': '💳', 'gpay': '💰', 'phonepe': '📱', 'netflix': '🎬',
      'spotify': '🎵', 'youtube': '📺', 'starbucks': '☕', 'mcdonald': '🍟', 'kfc': '🍗'
    }
    const key = name.toLowerCase()
    return icons[key] || name.charAt(0).toUpperCase()
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {merchants.slice(0, 6).map((merchant, i) => (
        <div key={i} className="group animate-slide-right hover:scale-105 transition-all duration-300" style={{animationDelay: `${i * 0.1}s`}}>
          <div className="flex items-center gap-3 p-4 bg-white/80 rounded-2xl border border-purple-100/50 shadow-md hover:shadow-lg backdrop-blur-sm">
            {/* Merchant Avatar */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform`}>
              {getMerchantIcon(merchant.name)}
            </div>
            
            {/* Merchant Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 truncate text-sm group-hover:text-purple-600 transition-colors">
                {merchant.name || 'Unknown'}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {merchant.count || 0} txns
                </span>
                <span className={`text-sm font-bold bg-gradient-to-r ${gradients[i % gradients.length]} bg-clip-text text-transparent`}>
                  ₹{Math.round((merchant.amount || 0) / 1000)}K
                </span>
              </div>
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

export default AnalyticsPage;