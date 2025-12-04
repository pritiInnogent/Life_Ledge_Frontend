// CategoriesPage.jsx
import React, { useEffect, useState } from "react"
import {
  PieChart,
  TrendingUp,
  Calendar,
  Users,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ChevronRight,
  Tag
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

  useEffect(() => {
    if (user?.userId) {
      loadCategoryData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Categories</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-300 to-cyan-200 text-sm">
          Missy Dodia<br />
          <span className="text-xs text-gray-600">emax@gmail.com</span>
        </div>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-50">
              <PieChart className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Categories</p>
              <p className="text-2xl font-bold">{totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Spending</p>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Average</p>
              <p className="text-2xl font-bold">{formatCurrency(dailyAverageAll)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Merchants</p>
              <p className="text-2xl font-bold">{totalActiveMerchants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: left large card + donut + trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: overview big card (example: shows top category summary) */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          {/* Select top category if exists */}
          {categories[0] ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">{categories[0].name}</h3>
                      <p className="text-sm text-gray-500">Total spend this month</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="font-medium">12%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-lg font-semibold">{categories[0].transactionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">From month</p>
                  <p className="text-lg font-semibold">{Math.max(0, Math.round(categories[0].monthlyAmount / (categories[0].dailyAverage || 1)))}</p>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <p className="text-sm">
                  You're spending <strong>{formatCurrency(Math.round(categories[0].dailyAverage))}</strong>/day on {categories[0].name} this month.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Estimated month-end <strong>{formatCurrency(categories[0].projectedMonthEnd)}</strong>
                </p>
                <div className="w-full bg-white h-3 rounded-full mt-4 overflow-hidden">
                  <div style={{ width: `${Math.min(100, (categories[0].monthlyAmount / Math.max(1, totalMonthly)) * 100)}%` }} className="h-3 bg-teal-400"></div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">High-Frequency Merchants</h4>
                <div className="space-y-2">
                  {categories[0].topMerchants.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs">{m.name?.charAt(0) || "M"}</div>
                        <div>
                          <div className="text-sm font-medium">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.count} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(m.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">No category data available</div>
          )}
        </div>

        {/* Middle: Category Breakdown Donut */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <h4 className="text-lg font-semibold mb-2">Category Breakdown</h4>
          <div className="flex items-center gap-6">
            <Donut categories={categories.slice(0, 6)} total={totalMonthly} />
            <div>
              {categories.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <div style={{ width: 12, height: 12, background: c.color }} className="rounded-full" />
                  <div>
                    <div className="text-sm">{c.name}</div>
                    <div className="text-xs text-gray-500">{Math.round(((c.monthlyAmount || 0) / Math.max(1, totalMonthly)) * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Trendlines */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-semibold">Trendlines</h4>
              <p className="text-sm text-gray-500">Weekly</p>
            </div>
            <div>
              <button className="px-3 py-1 text-sm border rounded-full">Weekly</button>
            </div>
          </div>

          <div className="mt-4">
            <TrendChart categories={categories.slice(0, 3)} />
            <p className="text-sm text-gray-600 mt-4">Spending on trend ends between upper and lower bound</p>
          </div>
        </div>
      </div>

      {/* Bottom row: category cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((c, idx) => (
          <div key={c.name + idx} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div style={{ background: c.color }} className="w-10 h-10 rounded-md flex items-center justify-center text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-lg font-semibold">{c.name}</h5>
                  <div className="text-sm text-gray-500">{c.transactionCount} transactions</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold">{formatCurrency(c.monthlyAmount)}</div>
                <div className={`text-sm ${Number(c.growthRate) > 0 ? "text-green-500" : "text-red-500"}`}>
                  {Number(c.growthRate) > 0 ? "+" : ""}{c.growthRate}%
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">Weekly Trend</div>
              <div className="flex items-end gap-2 h-12">
                {c.weeklyData.map((w, i) => {
                  const max = Math.max(...c.weeklyData, 1)
                  const height = Math.round((w / max) * 100)
                  return <div key={i} style={{ height: `${height}%`, background: c.color + "33" }} className="flex-1 rounded-t" />
                })}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center cursor-pointer">
                <div className="text-sm font-medium">Top Merchants</div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>

              <div className="mt-3 space-y-2">
                {c.topMerchants.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm">{m.name?.charAt(0) || "M"}</div>
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.count} txns</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(m.amount)}</div>
                    </div>
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

/* ---------- Simple trendline chart ---------- */
function TrendChart({ categories = [] }) {
  // produce a small synthetic trend using first three categories weeklyData combined
  const weeks = 7
  const points = Array.from({ length: weeks }, (_, i) => {
    // sum of small weekly samples (use monthlyAmount as proxy)
    return Math.round(categories.reduce((s, c, idx) => s + ((c.weeklyData[i % 4] || 0) * (1 + idx * 0.1)), 0))
  })
  const max = Math.max(...points, 1)

  return (
    <div className="w-full h-36">
      <svg viewBox={`0 0 ${points.length} 100`} preserveAspectRatio="none" className="w-full h-36">
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* area */}
        <polyline
          fill="url(#grad)"
          stroke="none"
          points={points.map((p, i) => `${i},${100 - (p / max) * 80}`).join(" ")}
          strokeWidth="0"
        />

        {/* line */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="0.6"
          points={points.map((p, i) => `${i},${100 - (p / max) * 80}`).join(" ")}
        />
      </svg>
    </div>
  )
}
