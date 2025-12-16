import React, { useState, useEffect } from 'react'
import { TrendingUp, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'


const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState(() => {
    return sessionStorage.getItem('selectedAccount') || 'all'
  })

  useEffect(() => {
    if (user?.userId) {
      loadAccounts()
    }
  }, [user])

  useEffect(() => {
    const handleAccountChange = (event) => {
      setAccountFilter(event.detail)
    }
    
    window.addEventListener('accountChanged', handleAccountChange)
    
    if (accountFilter !== 'all' && accountFilter) {
      loadAnalyticsData(accountFilter)
    } else {
      setData(null)
      setError(null)
      setLoading(false)
    }
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 space-y-6">
        {/* Select Account Message */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 dark:border-gray-700/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">Select Bank Account</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">Choose a specific bank account to view detailed analytics and insights</p>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border border-blue-100 dark:border-gray-600">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Analytics will show:</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 space-y-6">
        {/* No Data Message */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 dark:border-gray-700/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">No Transaction Data</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            {error ? `${error}. Add transactions to this account to see analytics.` : 'Add transactions to this account to see detailed analytics and insights'}
          </p>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-orange-200 dark:border-gray-600">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">To see analytics, you need to:</p>
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Upload bank statements or CSV files
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
      {/* Header */}
      {error && (
        <div className="mb-8 animate-fade-in">
          <p className="text-sm text-red-600 animate-pulse">Error: {error}</p>
        </div>
      )}

      {/* Top Row - Monthly Timeline & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Spending Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Monthly Spending Timeline
          </h3>
          <LineChart data={data.monthlyTimeline} />
        </div>

        {/* Top Categories Donut */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Categories
            </h3>
            <button 
              onClick={() => navigate('/app/categories')}
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <DonutChart categories={data.categories} />
        </div>
      </div>

      {/* Top Merchants - Full Width List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Top Merchants
        </h3>
        <HorizontalBarChart merchants={data.merchants} />
      </div>

      {/* Bottom Grid - Other Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burn Rate Projection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Burn Rate
          </h3>
          <BurnRateChart burnRate={data.burnRate} />
        </div>

        {/* Recurring vs One-time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Spending Types
          </h3>
          <StackedBarChart data={data.recurringVsOneTime} />
        </div>

        {/* Average Cost per Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Category Averages
          </h3>
          <CategoryAverageChart categories={data.categories} />
        </div>
      </div>

      {/* Bottom Full-width Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Year-over-Year Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Year-over-Year
          </h3>
          <YearOverYearChart data={data.yearOverYear} monthlyData={data.monthlyTimeline} />
        </div>

        {/* Spending Averages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
  const [isLoaded, setIsLoaded] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])
  
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
  }
  
  const maxAmount = Math.max(...data.map(d => d.amount || 0), 1)
  const validData = data.filter(d => d.month && d.amount !== undefined)
  
  if (validData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No valid data</div>
  }
  
  const points = validData.map((d, i) => ({
    x: 60 + (i / (validData.length - 1)) * 320,
    y: 160 - ((d.amount || 0) / maxAmount) * 120,
    data: d
  }))
  
  const createSmoothPath = (points) => {
    if (points.length < 2) return ''
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cp1x = prev.x + (curr.x - prev.x) * 0.3
      const cp2x = curr.x - (curr.x - prev.x) * 0.3
      path += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return path
  }
  
  const smoothPath = createSmoothPath(points)
  const areaPath = smoothPath + ` L ${points[points.length - 1].x} 160 L 60 160 Z`
  
  return (
    <div className="h-64 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg p-4 relative overflow-hidden">
      <svg viewBox="0 0 440 200" className="w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[60, 100, 140].map(y => (
          <line key={y} x1="60" y1={y} x2="380" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
        ))}
        
        {/* Y-axis labels */}
        {[0, 33, 66, 100].map((percent) => {
          const y = 160 - (percent * 1.2)
          const value = Math.round((maxAmount * percent) / 100)
          return (
            <text key={percent} x="50" y={y + 4} textAnchor="end" className="text-xs fill-gray-500">
              ₹{value > 1000 ? `${Math.round(value/1000)}K` : value}
            </text>
          )
        })}
        
        {/* Area fill with animation */}
        <path 
          d={areaPath} 
          fill="url(#areaGradient)"
          className={`transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Main line with animation */}
        <path
          d={smoothPath}
          stroke="url(#lineGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isLoaded ? "none" : "1000"}
          strokeDashoffset={isLoaded ? "0" : "1000"}
          className="transition-all duration-2000 ease-out"
        />
        
        {/* Data points with staggered animation */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredPoint === i ? "6" : "4"}
            fill="#8B5CF6"
            className={`cursor-pointer transition-all duration-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
            style={{ 
              transitionDelay: `${500 + i * 100}ms`,
              transformOrigin: `${point.x}px ${point.y}px`
            }}
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div 
          className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-20 pointer-events-none"
          style={{
            left: `${Math.min(Math.max((points[hoveredPoint].x / 440) * 100, 15), 85)}%`,
            top: `${Math.max((points[hoveredPoint].y / 200) * 100 - 25, 5)}%`,
            transform: 'translate(-50%, 0)'
          }}
        >
          <div className="font-semibold">{validData[hoveredPoint].month}</div>
          <div className="text-purple-300">₹{Math.round(validData[hoveredPoint].amount / 1000)}K</div>
        </div>
      )}
      
      {/* Fixed X-axis labels */}
      <div className="flex justify-between mt-3 px-14">
        {validData.map((d, i) => (
          <div key={i} className="text-center flex-1">
            <div className="text-xs font-medium text-gray-700">
              {d.month ? (d.month.length > 3 ? d.month.substring(0, 3) : d.month) : `M${i + 1}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DonutChart = ({ categories }) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [showModal, setShowModal] = React.useState(false)
  const [hoveredCategory, setHoveredCategory] = React.useState(null)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200)
    return () => clearTimeout(timer)
  }, [])
  
  if (!categories || categories.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No category data</div>
  }
  
  const colorfulColors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5A2B', '#6366F1', '#84CC16', '#F97316']
  const enhancedCategories = categories.map((cat, i) => ({
    ...cat,
    color: colorfulColors[i % colorfulColors.length]
  }))
  
  const total = enhancedCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0)
  const size = 180
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  let cumulativePercentage = 0
  
  return (
    <>
    <div className="h-64 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg p-4 relative overflow-hidden cursor-pointer" onClick={() => setShowModal(true)}>
      <div className="flex items-center justify-center gap-8 h-full">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {enhancedCategories.slice(0, 6).map((cat, i) => {
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
                  strokeDasharray={isLoaded ? strokeDasharray : "0 1000"}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out hover:opacity-80"
                  style={{ transitionDelay: `${i * 200}ms` }}
                >
                  <title>{cat.name}: ₹{Math.round(cat.amount || 0).toLocaleString()} ({percentage.toFixed(1)}%)</title>
                </circle>
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-sm border border-gray-100 transition-all duration-500 ${
              isLoaded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}>
              <div className="text-lg font-semibold text-gray-900">₹{Math.round(total / 1000)}K</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {enhancedCategories.slice(0, 6).map((cat, i) => {
            return (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/60 transition-all ${
                  isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: cat.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{cat.name || 'Unknown'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
    
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowModal(false)}>
        <style jsx>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes drawCircle {
            from { stroke-dasharray: 0 1000; }
            to { stroke-dasharray: var(--dash-array) 1000; }
          }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
          .animate-scaleIn { animation: scaleIn 0.4s ease-out; }
          .animate-drawCircle { animation: drawCircle 1s ease-out forwards; }
        `}</style>
        <div className="bg-white dark:bg-gray-800 rounded-3xl w-[85vw] max-w-5xl h-[85vh] mx-auto overflow-hidden shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">Category Breakdown</h3>
                <p className="text-gray-600 dark:text-gray-400">Total Spending: ₹{Math.round(total / 1000)}K</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors text-gray-900 dark:text-gray-100"
              >
                ←
              </button>
            </div>
          </div>
          <div className="p-8 bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 flex items-center justify-center">
                <div className="relative">
                  <svg width={320} height={320} className="transform -rotate-90">
                    <circle cx={160} cy={160} r={140} stroke="#f1f5f9" strokeWidth={40} fill="transparent" />
                    {(() => {
                      let cumulative = 0
                      return enhancedCategories.map((cat, i) => {
                        const percentage = (cat.amount / total) * 100
                        const circumference = 140 * 2 * Math.PI
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                        const strokeDashoffset = -cumulative * circumference / 100
                        cumulative += percentage
                        return (
                          <circle
                            key={i}
                            cx={160}
                            cy={160}
                            r={140}
                            stroke={cat.color}
                            strokeWidth={40}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="animate-drawCircle cursor-pointer"
                            style={{ 
                              '--dash-array': strokeDasharray.split(' ')[0],
                              animationDelay: `${0.5 + i * 0.2}s`,
                              opacity: hoveredCategory !== null && hoveredCategory !== i ? 0.3 : 1,
                              strokeWidth: hoveredCategory === i ? 45 : 40
                            }}
                            onMouseEnter={() => setHoveredCategory(i)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCategory(i)
                            }}
                          />
                        )
                      })
                    })()} 
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-white dark:bg-gray-700 rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{Math.round(total / 1000)}K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3 space-y-1">
                {enhancedCategories.map((cat, i) => {
                  const percentage = ((cat.amount || 0) / total) * 100
                  return (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300 transform opacity-0 translate-x-8"
                      style={{ 
                        animation: `slideInRight 0.6s ease-out ${1 + i * 0.15}s forwards`
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-8 h-8 rounded-full shadow-md flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: cat.color }}
                        >
                          {(cat.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{cat.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}% of total spending</div>
                        </div>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <div className="font-bold text-xl tabular-nums" style={{ color: cat.color }}>₹{Math.round((cat.amount || 0) / 1000)}K</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">₹{(cat.amount || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
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
            className="bg-purple-600 h-3 rounded-full"
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

export default DashboardPage;