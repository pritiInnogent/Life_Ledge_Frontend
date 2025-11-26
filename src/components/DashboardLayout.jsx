import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet, Menu, X, LogOut, Bell,
  Home, Receipt, BarChart3, PieChart,
  Calendar, Target, TrendingUp, Upload, Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// NAVIGATION LINK DATA
const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', emoji: '🏠' },
  { path: '/app/transactions', label: 'Transactions', emoji: '💳' },
  { path: '/app/analytics', label: 'Analytics', emoji: '📊' },
  { path: '/app/categories', label: 'Categories', emoji: '🎨' },
  { path: '/app/recurring', label: 'Recurring', emoji: '🔄' },
  { path: '/app/goals', label: 'Goals', emoji: '🎯' },
  { path: '/app/insights', label: 'AI Insights', emoji: '🤖' },
  { path: '/app/import', label: 'Import', emoji: '📤' },
  { path: '/app/settings', label: 'Settings', emoji: '⚙️' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* MOBILE HAMBURGER BUTTON */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-xl shadow-lg"
      >
        <Menu size={26} />
      </button>

      {/* MOBILE OVERLAY BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        ></div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full 
          bg-gradient-to-br from-purple-900 to-cyan-900 text-white 
          w-72 shadow-xl border-r border-purple-400/40
          transition-transform duration-300 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >

        {/* Close Button - Mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 bg-white/10 rounded-lg"
        >
          <X size={24} className="text-white" />
        </button>

        <div className="p-6">
          
          {/* Branding */}
          <div className="flex items-center gap-3 mb-10 mt-3">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
           <h1
                 onClick={() => navigate('/')}
                     className="text-3xl font-extrabold text-white cursor-pointer"
                      >
                LifeLedger
               </h1>

          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-2">
            {navItems.map(item => {
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setSidebarOpen(false) // mobile auto-close
                  }}
                  className={`
                    w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition-all
                    ${isActive
                      ? 'bg-white/20 shadow-lg text-white scale-105'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-lg">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* LOGOUT BUTTON */}
          <div className="mt-10">
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-lg">Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto">

        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur p-6 border-b shadow-sm flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-black">
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
          </div>

          {/* Right-side icons */}
          <div className="flex items-center gap-4">
            
            {/* User Info */}
            <button 
              onClick={() => navigate('/app/profile')}
              className="flex items-center gap-3 bg-gradient-to-r from-purple-200 to-cyan-200 px-4 py-2 rounded-xl shadow hover:from-purple-300 hover:to-cyan-300 transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-black">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-black text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-600">{user?.email}</div>
              </div>
            </button>
          </div>

        </header>

        <div className="p-8">
          <Outlet />
        </div>

      </main>
    </div>
  )
}
