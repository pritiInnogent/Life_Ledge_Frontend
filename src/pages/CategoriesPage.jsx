import React, { useEffect, useState } from "react"
import {
  Layers,
  TrendingUp,
  Calendar,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ChevronRight,
  Tag,
  Filter,
  MoreVertical,
  Eye,
  Target,
  Zap
} from "lucide-react"
import apiService from "../services/api"
import { useAuth } from "../contexts/AuthContext"

// --- Helper: format currency ---
const formatCurrency = (v) =>
  typeof v === "number" ? `₹${v.toLocaleString()}` : "₹0"

// --- Colors for categories (fallback) ---
const CATEGORY_COLORS = [
  "#2563EB", // blue
  "#06B6D4", // teal
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#6B7280" // gray
]

const getCategoryColor = (name, idx = 0) =>
  // try to derive color by name, fallback to palette
  ({
    Food: "#2563EB",
    Travel: "#06B6D4",
    Utilities: "#10B981",
    Entertainment: "#F59E0B",
    Shopping: "#EF4444",
    Healthcare: "#8B5CF6",
  }[name] || CATEGORY_COLORS[idx % CATEGORY_COLORS.length])

// --- Main component ---
export default function CategoriesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [accountFilter, setAccountFilter] = useState('all')

  useEffect(() => {
    if (user?.userId) {
      loadCategoryData()
      loadAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  async function loadCategoryData() {
    try {
      setLoading(true)
      const [catsRes, txRes] = await Promise.all([
        apiService.getCategories(), // returns [{id, name, ...}]
        apiService.getTransactions() // returns transactions with categoryName, merchant, amount, date, ...
      ])

      const cats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || [])
      const txs = Array.isArray(txRes) ? txRes : (txRes?.data || [])

      // Build category map keyed by name
      const categoryMap = {}
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      // init categories present in backend
      cats.forEach((c, i) => {
        categoryMap[c.name] = {
          id: c.id,
          name: c.name,
          color: getCategoryColor(c.name, i),
          totalAmount: 0,
          monthlyAmount: 0,
          transactionCount: 0,
          merchants: {},
          weeklyData: [0, 0, 0, 0],
        }
      })

      // Normalize transactions and aggregate
      const normalizedTx = (txs || []).map((t) => ({
        ...t,
        category: t.categoryName || "Uncategorized",
        merchant: t.merchant || t.notes || "Unknown",
        amount: typeof t.amount === "number" ? t.amount : Number(t.amount || 0),
        date: t.date || t.transactionDate || t.createdAt,
      }))

      normalizedTx.forEach((t) => {
        const catName = t.category || "Uncategorized"
        if (!categoryMap[catName]) {
          // create bucket for categories missing in backend list
          categoryMap[catName] = {
            id: null,
            name: catName,
            color: getCategoryColor(catName, Object.keys(categoryMap).length),
            totalAmount: 0,
            monthlyAmount: 0,
            transactionCount: 0,
            merchants: {},
            weeklyData: [0, 0, 0, 0],
          }
        }

        const bucket = categoryMap[catName]
        const amt = Math.abs(Number(t.amount || 0))
        const date = t.date ? new Date(t.date) : new Date()
        const isCurrentMonth =
          date.getMonth() === currentMonth && date.getFullYear() === currentYear

        bucket.totalAmount += amt
        bucket.transactionCount += 1
        if (isCurrentMonth) bucket.monthlyAmount += amt

        // merchant tracking (safe split)
        const merchantKey = (t.merchant || "Unknown").split(/[|\-\/@ ]/)[0] || "Unknown"
        if (!bucket.merchants[merchantKey]) bucket.merchants[merchantKey] = { count: 0, amount: 0 }
        bucket.merchants[merchantKey].count += 1
        bucket.merchants[merchantKey].amount += amt

        // weekly bucket (0..3)
        const weekIdx = Math.min(3, Math.floor((date.getDate() - 1) / 7)) // 0..3
        if (isCurrentMonth) bucket.weeklyData[weekIdx] += amt
      })

      // convert map to array and compute derived fields
      const processed = Object.values(categoryMap)
        .map((c) => {
          const topMerchants = Object.entries(c.merchants)
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)

          const dailyAvg = c.monthlyAmount / Math.max(1, new Date().getDate())
          const projectedMonthEnd = Math.round(dailyAvg * 30)

          return {
            ...c,
            topMerchants,
            dailyAverage: dailyAvg,
            projectedMonthEnd,
            growthRate: (Math.random() * 20 - 10).toFixed(1), // placeholder
          }
        })
        .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

      setCategories(processed)
      setTransactions(normalizedTx)
    } catch (err) {
      console.error("loadCategoryData error:", err)
    } finally {
      setLoading(false)
    }
  }

  // aggregates
  const totalMonthly = categories.reduce((s, c) => s + (c.monthlyAmount || 0), 0)
  const totalCategories = categories.length
  const totalActiveMerchants = categories.reduce((s, c) => s + (c.topMerchants?.length || 0), 0)
  const dailyAverageAll = Math.round(totalMonthly / Math.max(1, new Date().getDate()))

  if (loading) {
    return <div className="py-20 text-center text-lg">Loading categories...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Spending Categories</h1>
              <p className="text-gray-600 font-medium">Track and analyze your spending patterns</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm font-medium"
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} ••••{account.last4Digits}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
              <p className="text-sm text-gray-600 font-medium">Categories</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">This Month</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthly)}</p>
              <p className="text-sm text-gray-600 font-medium">Total Spent</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Avg</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dailyAverageAll)}</p>
              <p className="text-sm text-gray-600 font-medium">Daily Average</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-violet-50 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalActiveMerchants}</p>
              <p className="text-sm text-gray-600 font-medium">Merchants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Category Spotlight */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          {categories[0] ? (
            <>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${categories[0].color}, ${categories[0].color}dd)` }}
                  >
                    {categories[0].name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{categories[0].name}</h3>
                    <p className="text-gray-600 font-medium">Your top spending category</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">+{categories[0].growthRate}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(categories[0].monthlyAmount)}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">This Month</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">{categories[0].transactionCount}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Transactions</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(Math.round(categories[0].dailyAverage))}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">Daily Avg</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Monthly Progress</h4>
                  <span className="text-sm text-gray-600">{Math.round((categories[0].monthlyAmount / Math.max(1, totalMonthly)) * 100)}% of total</span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div 
                    style={{ 
                      width: `${Math.min(100, (categories[0].monthlyAmount / Math.max(1, totalMonthly)) * 100)}%`,
                      background: categories[0].color
                    }} 
                    className="h-3 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Top Merchants</h4>
                <div className="space-y-3">
                  {categories[0].topMerchants.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-semibold text-gray-700 shadow-sm">
                          {m.name?.charAt(0) || "M"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{m.name}</p>
                          <p className="text-sm text-gray-600">{m.count} transactions</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900">{formatCurrency(m.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No category data available</p>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-gray-900">Distribution</h4>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="flex justify-center mb-6">
            <Donut categories={categories.slice(0, 6)} total={totalMonthly} />
          </div>
          
          <div className="space-y-3">
            {categories.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{c.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{Math.round(((c.monthlyAmount || 0) / Math.max(1, totalMonthly)) * 100)}%</p>
                  <p className="text-xs text-gray-500">{formatCurrency(c.monthlyAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((c, idx) => (
          <div key={c.name + idx} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900">{c.name}</h5>
                  <p className="text-sm text-gray-600">{c.transactionCount} transactions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  Number(c.growthRate) > 0 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-red-700 bg-red-50'
                }`}>
                  {Number(c.growthRate) > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(Number(c.growthRate))}%
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(c.monthlyAmount)}</p>
              <p className="text-sm text-gray-600">Spent this month • {formatCurrency(Math.round(c.dailyAverage))}/day avg</p>
            </div>

            {/* Weekly Trend */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Weekly Trend</span>
                <Zap className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-end gap-1 h-12">
                {c.weeklyData.map((w, i) => {
                  const max = Math.max(...c.weeklyData, 1)
                  const height = Math.max(8, Math.round((w / max) * 100))
                  return (
                    <div 
                      key={i} 
                      className="flex-1 rounded-t-lg transition-all duration-300 hover:opacity-80" 
                      style={{ 
                        height: `${height}%`, 
                        backgroundColor: c.color + '40',
                        border: `2px solid ${c.color}60`
                      }} 
                    />
                  )
                })}
              </div>
            </div>

            {/* Top Merchants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Top Merchants</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <div className="space-y-2">
                {c.topMerchants.slice(0, 2).map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-semibold text-gray-700 shadow-sm">
                        {m.name?.charAt(0) || "M"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-600">{m.count} transactions</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(m.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Donut component ---------- */
function Donut({ categories = [], total = 0 }) {
  const size = 120
  const stroke = 18
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let offsetPct = 0

  return (
    <div className="relative w-36 h-36">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#f3f4f6" strokeWidth={stroke} fill="transparent" />
        {categories.map((c, idx) => {
          const pct = total > 0 ? (c.monthlyAmount / total) : 0
          const dash = pct * circ
          const dashArray = `${dash} ${circ}`
          const dashOffset = -offsetPct * circ
          offsetPct += pct
          return (
            <circle key={idx} cx={size / 2} cy={size / 2} r={r}
              stroke={c.color} strokeWidth={stroke} fill="transparent"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold">{Math.round(total > 0 ? (categories[0]?.monthlyAmount / total) * 100 : 0)}%</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
    </div>
  )
}


