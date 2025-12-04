import React, { useState, useEffect } from 'react'
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.userId) {
      loadAnalyticsData()
    }
  }, [user])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const [transactions, categories] = await Promise.all([
        apiService.getTransactions(),
        apiService.getCategories().catch(() => [])
      ])
      
      const processedData = processTransactionData(transactions, categories)
      setData(processedData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processTransactionData = (transactions, categories) => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    // Monthly timeline (last 12 months)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentYear, currentMonth - 11 + i)
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === month.getMonth() && tDate.getFullYear() === month.getFullYear()
      })
      return {
        month: month.toLocaleDateString('en', { month: 'short' }),
        amount: monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      }
    })

    // Category breakdown
    const categoryMap = {}
    transactions.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { name: t.category, amount: 0, count: 0 }
      }
      categoryMap[t.category].amount += Math.abs(t.amount)
      categoryMap[t.category].count += 1
    })
    
    const categoryData = Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
      .map((cat, i) => ({
        ...cat,
        color: getCategoryColor(cat.name, i)
      }))

    // Merchant analysis
    const merchantMap = {}
    transactions.forEach(t => {
      const merchant = t.description?.split(' ')[0] || 'Unknown'
      if (!merchantMap[merchant]) {
        merchantMap[merchant] = { name: merchant, amount: 0, count: 0 }
      }
      merchantMap[merchant].amount += Math.abs(t.amount)
      merchantMap[merchant].count += 1
    })
    
    const merchantData = Object.values(merchantMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

    // Recurring vs One-time
    const recurringMerchants = merchantData.filter(m => m.count > 3)
    const recurringAmount = recurringMerchants.reduce((sum, m) => sum + m.amount, 0)
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const oneTimeAmount = totalAmount - recurringAmount

    // Burn rate projection
    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    })
    const currentMonthSpend = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const daysInMonth = new Date().getDate()
    const dailyBurn = currentMonthSpend / daysInMonth
    const projectedMonthEnd = dailyBurn * 30

    return {
      monthlyTimeline: monthlyData,
      categories: categoryData,
      merchants: merchantData,
      recurringVsOneTime: [
        { name: 'Recurring', amount: recurringAmount, color: '#8B5CF6' },
        { name: 'One-time', amount: oneTimeAmount, color: '#06B6D4' }
      ],
      burnRate: {
        daily: dailyBurn,
        projected: projectedMonthEnd,
        current: currentMonthSpend,
        daysLeft: 30 - daysInMonth
      },
      yearOverYear: monthlyData // Simplified for demo
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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive financial insights and trends</p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Spending Timeline */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Spending Timeline</h3>
          <LineChart data={data.monthlyTimeline} />
        </div>

        {/* Burn Rate Projection */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Burn Rate Projection</h3>
          <BurnRateChart burnRate={data.burnRate} />
        </div>

        {/* Top Categories Donut */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Categories</h3>
          <DonutChart categories={data.categories} />
        </div>

        {/* Top Merchants */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Merchants</h3>
          <HorizontalBarChart merchants={data.merchants} />
        </div>

        {/* Recurring vs One-time */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Recurring vs One-time</h3>
          <StackedBarChart data={data.recurringVsOneTime} />
        </div>

        {/* Average Cost per Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Average Cost per Category</h3>
          <CategoryAverageChart categories={data.categories} />
        </div>
      </div>

      {/* Full-width Year-over-Year */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Year-over-Year Comparison</h3>
        <YearOverYearChart data={data.yearOverYear} />
      </div>
    </div>
  )
}

// Chart Components
const LineChart = ({ data }) => {
  const maxAmount = Math.max(...data.map(d => d.amount), 1)
  
  return (
    <div className="h-48">
      <svg viewBox="0 0 400 150" className="w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area */}
        <path
          d={`M 0 150 ${data.map((d, i) => 
            `L ${(i / (data.length - 1)) * 400} ${150 - (d.amount / maxAmount) * 120}`
          ).join(' ')} L 400 150 Z`}
          fill="url(#lineGrad)"
        />
        
        {/* Line */}
        <path
          d={`M ${data.map((d, i) => 
            `${(i / (data.length - 1)) * 400} ${150 - (d.amount / maxAmount) * 120}`
          ).join(' L ')}`}
          stroke="#3B82F6"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * 400}
            cy={150 - (d.amount / maxAmount) * 120}
            r="3"
            fill="#3B82F6"
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

const DonutChart = ({ categories }) => {
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0)
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
  const maxAmount = Math.max(...merchants.map(m => m.amount), 1)
  
  return (
    <div className="space-y-3">
      {merchants.map((merchant, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-sm font-medium truncate">{merchant.name}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
            <div
              className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${(merchant.amount / maxAmount) * 100}%` }}
            >
              <span className="text-xs text-white font-medium">
                ₹{Math.round(merchant.amount / 1000)}K
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const StackedBarChart = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.amount, 0)
  
  return (
    <div className="space-y-4">
      <div className="flex h-12 rounded-lg overflow-hidden">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-white text-sm font-medium"
            style={{
              width: `${(item.amount / total) * 100}%`,
              backgroundColor: item.color
            }}
          >
            {Math.round((item.amount / total) * 100)}%
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        {data.map((item, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <div className="text-lg font-bold">₹{Math.round(item.amount / 1000)}K</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const CategoryAverageChart = ({ categories }) => {
  const averages = categories.map(cat => ({
    ...cat,
    average: cat.amount / cat.count
  }))
  const maxAvg = Math.max(...averages.map(a => a.average), 1)
  
  return (
    <div className="space-y-3">
      {averages.map((cat, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
            <span className="text-sm font-medium">{cat.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${(cat.average / maxAvg) * 100}%`,
                  backgroundColor: cat.color
                }}
              ></div>
            </div>
            <span className="text-sm font-bold w-16 text-right">₹{Math.round(cat.average)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const BurnRateChart = ({ burnRate }) => {
  const daysInMonth = 30
  const progress = ((daysInMonth - burnRate.daysLeft) / daysInMonth) * 100
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">₹{Math.round(burnRate.daily)}</div>
          <div className="text-sm text-gray-600">Daily Burn</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">₹{Math.round(burnRate.projected / 1000)}K</div>
          <div className="text-sm text-gray-600">Projected</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Month Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 text-center">
          {burnRate.daysLeft} days remaining
        </div>
      </div>
    </div>
  )
}

const YearOverYearChart = ({ data }) => {
  const maxAmount = Math.max(...data.map(d => d.amount), 1)
  
  return (
    <div className="h-64">
      <svg viewBox="0 0 800 200" className="w-full h-full">
        {/* Grid lines */}
        {[0, 50, 100, 150, 200].map(y => (
          <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f3f4f6" strokeWidth="1" />
        ))}
        
        {/* Bars */}
        {data.map((d, i) => (
          <rect
            key={i}
            x={(i / data.length) * 800 + 10}
            y={200 - (d.amount / maxAmount) * 180}
            width={800 / data.length - 20}
            height={(d.amount / maxAmount) * 180}
            fill="#3B82F6"
            rx="4"
          />
        ))}
      </svg>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

export default AnalyticsPage