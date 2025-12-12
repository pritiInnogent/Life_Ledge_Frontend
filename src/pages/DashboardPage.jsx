import React, { useState, useEffect } from 'react'
import { Zap, DollarSign, Calendar, Receipt, BarChart3, Target, Activity, CreditCard, PieChart, Repeat, Brain, ArrowRight, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/api'
import InsightsDownloadService from '../services/insightsDownloadService'

const StatCard = ({ icon: Icon, value, label, change }) => (
  <div className="bg-white rounded-2xl p-6 shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-purple-600" />
      </div>
      <div className="text-sm text-green-600 font-black">{change}</div>
    </div>
    <div className="text-2xl font-black mb-1">{value}</div>
    <div className="text-sm font-bold text-gray-600">{label}</div>
  </div>
)

const SpendingChart = ({ transactions }) => {
  // Generate last 7 days spending data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      amount: 0
    }
  })

  // Aggregate spending by day
  transactions.forEach(tx => {
    if (tx.amount < 0) { // Only expenses
      const txDate = new Date(tx.date)
      const dayIndex = last7Days.findIndex(day => {
        const checkDate = new Date()
        checkDate.setDate(checkDate.getDate() - (6 - last7Days.indexOf(day)))
        return txDate.toDateString() === checkDate.toDateString()
      })
      if (dayIndex !== -1) {
        last7Days[dayIndex].amount += Math.abs(tx.amount)
      }
    }
  })

  const maxAmount = Math.max(...last7Days.map(d => d.amount), 1)

  return (
    <div className="h-full flex items-end justify-between gap-2 px-4">
      {last7Days.map((day, i) => {
        const height = (day.amount / maxAmount) * 100
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="text-xs font-medium mb-2 text-gray-600">
              ₹{day.amount > 0 ? Math.round(day.amount / 1000) + 'k' : '0'}
            </div>
            <div 
              className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg min-h-[4px] transition-all duration-300"
              style={{ height: `${Math.max(height, 4)}%` }}
            />
            <div className="text-xs font-medium mt-2 text-gray-500">{day.date}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [totalSpent, setTotalSpent] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [topCategory, setTopCategory] = useState(null)
  const [recurringPatterns, setRecurringPatterns] = useState([])

  const [userBudget, setUserBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (accountFilter !== 'all') {
      fetchDashboardData()
    } else {
      // Reset data when no account selected
      setTotalSpent(0)
      setTransactionCount(0)
      setRecentTransactions([])
      setTopCategory(null)
      setRecurringPatterns([])
      setUserBudget(0)
      setLoading(false)
    }
  }, [accountFilter])

  const loadAccounts = async () => {
    try {
      const data = await ApiService.getAccounts()
      setAccounts(data || [])
      if (data?.length > 0) {
        setAccountFilter(data[0].id.toString())
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    if (accountFilter === 'all') return
    
    try {
      setLoading(true)
      // Fetch recent transactions
      const recentResponse = await ApiService.getRecentTransactions()
      setRecentTransactions(recentResponse || [])
        
      // Fetch total spent
      try {
        const spentResponse = await ApiService.getTotalSpent()
        const totalSpentValue = typeof spentResponse === 'number' ? spentResponse : 
                               spentResponse?.totalSpent || spentResponse?.data || 0
        setTotalSpent(totalSpentValue)
      } catch (spentError) {
        console.error('Total spent API failed:', spentError)
      }
      
      // Fetch transaction count
      try {
        const countResponse = await ApiService.getTransactionCount()
        const countValue = typeof countResponse === 'number' ? countResponse : 
                          countResponse?.count || countResponse?.transactionCount || countResponse?.data || 0
        setTransactionCount(countValue)
      } catch (countError) {
        console.error('Transaction count API failed:', countError)
      }

      // Fetch top spending category
      try {
        const transactions = await ApiService.getTransactions()
        const categoryMap = {}
        transactions.forEach(tx => {
          const category = tx.category || 'Other'
          categoryMap[category] = (categoryMap[category] || 0) + Math.abs(tx.amount)
        })
        const topCat = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]
        setTopCategory(topCat ? { name: topCat[0], amount: topCat[1] } : null)
      } catch (error) {
        console.error('Error fetching top category:', error)
      }

      // Fetch recurring patterns
      try {
        const recurringResponse = await ApiService.getRecurringPayments()
        setRecurringPatterns(recurringResponse?.slice(0, 3) || [])
      } catch (error) {
        console.error('Error fetching recurring patterns:', error)
      }

      // Fetch user's budget goals
      try {
        const goalsResponse = await ApiService.getUserGoals()
        const budgetGoals = goalsResponse?.filter(goal => 
          (goal.type || '').toUpperCase() === 'BUDGET'
        ) || []
        const totalBudget = budgetGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0)
        setUserBudget(totalBudget)
      } catch (error) {
        console.error('Error fetching budget goals:', error)
        setUserBudget(0)
      }


    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    setDownloading(true)
    const reportData = await InsightsDownloadService.generateUserInsightsReport()
    InsightsDownloadService.downloadReport(reportData)
    setDownloading(false)
  }

  // Calculate monthly budget vs spending
  const currentMonth = new Date().getMonth()
  const monthlySpent = totalSpent || 0 // Handle null/undefined values
  const monthlyBudget = userBudget || 0 // Use user's actual budget goals
  const budgetUsed = monthlyBudget > 0 && monthlySpent > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : 0
  
  // Calculate daily average
  const currentDate = new Date().getDate()
  const dailyAverage = currentDate > 0 && monthlySpent > 0 ? Math.round(monthlySpent / currentDate) : 0
  
  const stats = [
    { 
      icon: DollarSign, 
      value: loading ? '...' : `₹${monthlySpent.toLocaleString()}`, 
      label: 'This Month Spent', 
      change: monthlySpent === 0 ? 'No spending yet' : budgetUsed > 100 ? `${budgetUsed}% over budget` : `${budgetUsed}% of budget` 
    },
    { 
      icon: Calendar, 
      value: loading ? '...' : `₹${dailyAverage.toLocaleString()}`, 
      label: 'Daily Average', 
      change: monthlySpent === 0 ? 'No data yet' : `${currentDate} days this month` 
    },
    { 
      icon: PieChart, 
      value: loading ? 'Loading...' : topCategory ? topCategory.name : 'No categories', 
      label: 'Top Spending Category', 
      change: topCategory ? `₹${topCategory.amount.toLocaleString()}` : 'No spending yet' 
    },
    { 
      icon: Target, 
      value: loading ? '...' : monthlyBudget === 0 ? 'No budget set' : `₹${Math.max(0, monthlyBudget - monthlySpent).toLocaleString()}`, 
      label: 'Budget Remaining', 
      change: monthlyBudget === 0 ? 'Set budget goals' : monthlySpent === 0 ? 'Full budget available' : monthlySpent > monthlyBudget ? 'Over budget!' : 'On track' 
    },
  ]

  if (accountFilter === 'all' || accounts.length === 0) {
    return (
      <div className="space-y-8">
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
        
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Select Bank Account</h3>
          <p className="text-gray-600 mb-8 text-lg">Choose a bank account to view your financial dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
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
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating...' : 'Report'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="font-black">Spending Trend</h3>
            </div>
            <button 
              onClick={() => navigate('/app/analytics')}
              className="text-sm text-purple-600 font-bold hover:text-purple-800"
            >
              View Analytics →
            </button>
          </div>
          <div className="h-48">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">Loading chart...</div>
            ) : recentTransactions.length > 0 ? (
              <SpendingChart transactions={recentTransactions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-lg font-medium mb-2">No Transaction Data</div>
                <div className="text-sm">Import your bank statements to see spending trends</div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Repeat className="w-6 h-6 text-blue-600" />
              <h3 className="font-black">Upcoming Payments</h3>
            </div>
            <button 
              onClick={() => navigate('/app/recurring')}
              className="text-sm text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1"
            >
              Manage <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recurringPatterns.length > 0 ? (
              recurringPatterns.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">{payment.name || payment.merchant}</div>
                    <div className="text-sm text-gray-600">
                      Due: {new Date(payment.nextPaymentDate || payment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">₹{payment.amount?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{payment.frequency || 'Monthly'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">No recurring payments set up.</p>
                <button 
                  onClick={() => navigate('/app/recurring')}
                  className="text-sm text-purple-600 font-medium mt-2"
                >
                  Add recurring payment →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="font-black mb-4 flex items-center gap-3">
          <Zap className="w-6 h-6 text-yellow-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/app/transactions')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center"
          >
            <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-medium text-sm">Add Transaction</div>
          </button>
          <button 
            onClick={() => navigate('/app/goals')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center"
          >
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-medium text-sm">Set Budget Goal</div>
          </button>
          <button 
            onClick={() => navigate('/app/insights')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center"
          >
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-sm">AI Analysis</div>
          </button>
          <button 
            onClick={() => navigate('/app/analytics')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-center"
          >
            <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="font-medium text-sm">View Reports</div>
          </button>
        </div>
      </div>
    </div>
  )
}
