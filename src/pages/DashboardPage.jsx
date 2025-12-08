import React, { useState, useEffect } from 'react'
import { Zap, DollarSign, Calendar, Receipt, BarChart3, Target, Activity, CreditCard, Bot, PartyPopper } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/api'

const StatCard = ({ icon: Icon, value, label, change, color = 'text-blue-600' }) => (
  <div className="bg-white rounded-2xl p-6 shadow">
    <div className="flex items-start justify-between mb-3">
      <Icon className={`w-8 h-8 ${color}`} />
      <div className="text-sm text-green-600 font-black">{change}</div>
    </div>
    <div className="text-2xl font-black mb-1">{value}</div>
    <div className="text-sm font-bold text-gray-600">{label}</div>
  </div>
)

export default function DashboardPage() {
  const navigate = useNavigate()
  const [totalSpent, setTotalSpent] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [aiInsight, setAiInsight] = useState('')
  const [loading, setLoading] = useState(true)
  const [insightLoading, setInsightLoading] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all transactions and get recent 5
        const allTransactions = await ApiService.getTransactions()
        const recent5 = Array.isArray(allTransactions) ? allTransactions.slice(0, 5) : []
        setRecentTransactions(recent5)
        
        // Calculate total spent from transactions
        const totalSpentCalc = Array.isArray(allTransactions) ? 
          allTransactions
            .filter(t => t.typeTransaction === 'DEBIT')
            .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0) : 0
        setTotalSpent(totalSpentCalc)
        
        setTransactionCount(Array.isArray(allTransactions) ? allTransactions.length : 0)
        
        // Load AI insights
        await loadAiInsights()
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const loadAiInsights = async () => {
    try {
      setInsightLoading(true)
      const accounts = await ApiService.getAccounts()
      if (accounts.length > 0) {
        const insights = await ApiService.getInsightsByAccount(accounts[0].id)
        if (insights.insights && insights.insights.length > 0) {
          setAiInsight(insights.insights[0].aiText)
        } else {
          setAiInsight('You saved ₹5,200 this month! Keep it up!')
        }
      } else {
        setAiInsight('Add a bank account to get personalized insights!')
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
      setAiInsight('You saved ₹5,200 this month! Keep it up!')
    } finally {
      setInsightLoading(false)
    }
  }

  const stats = [
    { 
      icon: DollarSign, 
      value: loading ? '...' : `₹${totalSpent.toLocaleString()}`, 
      label: 'Total Spent', 
      change: '+12%',
      color: 'text-red-600'
    },
    { icon: Calendar, value: '12', label: 'Subscriptions', change: '2 new', color: 'text-blue-600' },
    { icon: Target, value: '₹24,720', label: 'Budget Left', change: '55%', color: 'text-green-600' },
    { 
      icon: Receipt, 
      value: loading ? '...' : transactionCount.toString(), 
      label: 'Transactions', 
      change: '+8%',
      color: 'text-purple-600'
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3"><Activity className="w-6 h-6" /><h3 className="font-black">Recent Transactions</h3></div>
            <button 
              onClick={() => navigate('/app/transactions')}
              className="text-sm text-purple-600 font-bold hover:text-purple-800"
            >
              View All →
            </button>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : recentTransactions.length > 0 ? (
              recentTransactions.map((tx, i) => (
                <div key={tx.id || i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      tx.typeTransaction === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <CreditCard className={`w-6 h-6 ${
                        tx.typeTransaction === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-black">{tx.merchant || 'Transaction'}</div>
                      <div className="text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{tx.typeTransaction}</div>
                    </div>
                  </div>
                  <div className={`text-right font-black ${
                    tx.typeTransaction === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.typeTransaction === 'CREDIT' ? '+' : '-'}₹{Math.abs(Number(tx.amount || 0)).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">No recent transactions</div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="font-black">AI Insight Alert!</h3>
          </div>
          {insightLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">Loading insights...</p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <PartyPopper className="w-4 h-4 text-green-600 mt-1" />
              <p className="text-gray-700 font-semibold">{aiInsight}</p>
            </div>
          )}
          <button 
            onClick={loadAiInsights}
            disabled={insightLoading}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            Refresh Insights
          </button>
        </div>
      </div>
    </div>
  )
}
