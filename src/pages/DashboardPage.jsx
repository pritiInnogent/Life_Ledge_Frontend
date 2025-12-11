import React, { useState, useEffect } from 'react'
import { Zap, DollarSign, Calendar, Receipt, BarChart3, Target, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/api'
import DownloadButton from '../components/DownloadButton'

const StatCard = ({ emoji, value, label, change }) => (
  <div className="bg-white rounded-2xl p-6 shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="text-4xl">{emoji}</div>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent transactions first (this works)
        const recentResponse = await ApiService.getRecentTransactions()
        setRecentTransactions(recentResponse || [])
        
        // Try other endpoints individually with error handling
        try {
          const spentResponse = await ApiService.getTotalSpent()
          const totalSpentValue = typeof spentResponse === 'number' ? spentResponse : 
                                 spentResponse?.totalSpent || spentResponse?.data || 0
          setTotalSpent(totalSpentValue)
        } catch (spentError) {
          console.error('Total spent API failed:', spentError)
        }
        
        try {
          const countResponse = await ApiService.getTransactionCount()
          const countValue = typeof countResponse === 'number' ? countResponse : 
                            countResponse?.count || countResponse?.transactionCount || countResponse?.data || 0
          setTransactionCount(countValue)
        } catch (countError) {
          console.error('Transaction count API failed:', countError)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const stats = [
    { 
      emoji: '💸', 
      value: loading ? '...' : `₹${totalSpent.toLocaleString()}`, 
      label: 'Total Spent', 
      change: '+12%' 
    },
    { emoji: '📅', value: '12', label: 'Subscriptions', change: '2 new' },
    { emoji: '💰', value: '₹24,720', label: 'Budget Left', change: '55%' },
    { 
      emoji: '🧾', 
      value: loading ? '...' : transactionCount.toString(), 
      label: 'Transactions', 
      change: '+8%' 
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Your financial overview</p>
        </div>
        <DownloadButton targetId="dashboard-content" filename="dashboard-report" />
      </div>
      <div id="dashboard-content" className="space-y-8">
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
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">💳</div>
                    <div>
                      <div className="font-black">{tx.merchant || tx.description || 'Transaction'}</div>
                      <div className="text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`text-right font-black ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">No recent transactions</div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-black mb-2">AI Insight Alert! 🤖</h3>
          <p className="text-gray-700 font-semibold">You saved ₹5,200 this month! Keep it up! 🎉</p>
        </div>
        </div>
      </div>
    </div>
  )
}
