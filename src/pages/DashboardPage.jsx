import React from 'react'
import { Zap, DollarSign, Calendar, Receipt, BarChart3, Target, Activity } from 'lucide-react'

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
  const stats = [
    { emoji: '💸', value: '₹45,280', label: 'Total Spent', change: '+12%' },
    { emoji: '📅', value: '12', label: 'Subscriptions', change: '2 new' },
    { emoji: '💰', value: '₹24,720', label: 'Budget Left', change: '55%' },
    { emoji: '🧾', value: '143', label: 'Transactions', change: '+8%' },
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
            <button className="text-sm text-purple-600 font-bold">View All →</button>
          </div>
          <div className="divide-y">
            {['Swiggy','Spotify','Uber','Amazon'].map((n,i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">{['🍕','🎵','🚗','🛒'][i]}</div>
                  <div>
                    <div className="font-black">{n}</div>
                    <div className="text-sm text-gray-600">Category</div>
                  </div>
                </div>
                <div className="text-right font-black text-red-600">-₹{[450,119,240,1580][i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-black mb-2">AI Insight Alert! 🤖</h3>
          <p className="text-gray-700 font-semibold">You saved ₹5,200 this month! Keep it up! 🎉</p>
        </div>
      </div>
    </div>
  )
}
