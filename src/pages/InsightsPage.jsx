import React, { useState, useEffect } from "react"
import { Brain, DollarSign, Repeat, Target, AlertTriangle, TrendingUp } from "lucide-react"
import apiService from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import DownloadButton from "../components/DownloadButton"

const formatCurrency = (v) => typeof v === "number" ? `₹${v.toLocaleString()}` : "₹0"

export default function InsightsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [insights, setInsights] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')

  useEffect(() => {
    if (user?.userId) {
      loadAccounts()
      loadInsights()
    }
  }, [user])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading accounts:', err)
    }
  }

  const loadInsights = async () => {
    try {
      setLoading(true)
      const response = await apiService.getLatestInsights()
      
      if (response?.insight?.aiText) {
        const parsed = JSON.parse(response.insight.aiText)
        setInsights(parsed)
      } else {
        setInsights(null)
      }
    } catch (err) {
      console.error('Error loading insights:', err)
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const analyzeInsights = async () => {
    try {
      setAnalyzing(true)
      setError(null)
      
      await apiService.analyzeFinancialData(accountFilter !== 'all' ? accountFilter : null)
      await loadInsights()
    } catch (err) {
      console.error('Error analyzing insights:', err)
      setError('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Mock data for demonstration
  const mockInsights = {
    summary: "Your spending is well-balanced across categories with some room for optimization.",
    categories: [
      { name: "Food & Dining", amount: 15000, percentage: 35 },
      { name: "Transportation", amount: 8000, percentage: 20 },
      { name: "Shopping", amount: 6000, percentage: 15 },
      { name: "Entertainment", amount: 4000, percentage: 10 }
    ],
    patterns: [
      { merchant: "Netflix", frequency: "Monthly", amount: 199 },
      { merchant: "Spotify", frequency: "Monthly", amount: 119 },
      { merchant: "Swiggy", frequency: "Weekly", amount: 450 }
    ],
    anomalies: [
      { description: "Unusual high spending on shopping", amount: 12000, severity: "medium" },
      { description: "New merchant detected", merchant: "Unknown Store", severity: "low" }
    ],
    recommendations: [
      { message: "Consider reducing food delivery expenses", type: "savings" },
      { message: "Set up a budget for entertainment", type: "budgeting" },
      { message: "Review subscription services", type: "optimization" }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-gray-600">Loading insights...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-600">Personalized financial analysis</p>
          </div>
        </div>
        <div className="flex gap-3">
          <DownloadButton targetId="insights-content" filename="insights-report" />
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} ••••{account.last4Digits}
              </option>
            ))}
          </select>
          <button
            onClick={analyzeInsights}
            disabled={analyzing}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div id="insights-content">
        {analyzing ? (
          <div className="bg-white rounded-2xl p-12 shadow text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Financial Data</h3>
            <p className="text-gray-600 mb-6">Our AI is processing your transactions...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        ) : insights || mockInsights ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overview */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold">Financial Overview</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {insights?.analysis?.overall_summary || mockInsights.summary}
              </p>
            </div>

            {/* Spending Categories */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold">Top Categories</h3>
              </div>
              <div className="space-y-3">
                {(insights?.analysis?.categorized || mockInsights.categories).slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-700">{cat.name || cat.category}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(cat.amount || cat.total)}</div>
                      <div className="text-sm text-gray-500">{cat.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Patterns */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3 mb-4">
                <Repeat className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold">Recurring Payments</h3>
              </div>
              <div className="space-y-3">
                {(insights?.analysis?.recurring || mockInsights.patterns).slice(0, 3).map((pattern, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{pattern.merchant}</div>
                      <div className="text-sm text-gray-500">{pattern.frequency}</div>
                    </div>
                    <div className="font-semibold">{formatCurrency(pattern.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold">Recommendations</h3>
              </div>
              <div className="space-y-3">
                {(insights?.analysis?.nudges || mockInsights.recommendations).slice(0, 3).map((rec, i) => (
                  <div key={i} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="font-medium text-orange-800">{rec.message}</div>
                    <div className="text-sm text-orange-600 capitalize">{rec.type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomalies */}
            {(insights?.analysis?.anomalies || mockInsights.anomalies).length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold">Detected Anomalies</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(insights?.analysis?.anomalies || mockInsights.anomalies).map((anomaly, i) => (
                    <div key={i} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-medium text-red-800">
                        {anomaly.description || anomaly.reason}
                      </div>
                      <div className="text-sm text-red-600">
                        {anomaly.amount && formatCurrency(anomaly.amount)} • {anomaly.severity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Financial Insights</h3>
            <p className="text-gray-600 mb-8">Get personalized insights about your spending patterns and recommendations</p>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
              <p className="text-sm font-semibold text-gray-700 mb-4">Our AI will analyze:</p>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Spending breakdown
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Recurring patterns
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Unusual transactions
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Smart recommendations
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}