import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet, Menu, X, LogOut, Bell,
  Home, Receipt, BarChart3, PieChart,
  Calendar, Target, TrendingUp, Upload
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'

// NAVIGATION LINK DATA
const navItems = [
  { path: '/app/transactions', label: 'Transactions', icon: Receipt },
  { path: '/app/analytics', label: 'Dashboard', icon: BarChart3 },
  { path: '/app/categories', label: 'Categories', icon: PieChart },
  { path: '/app/recurring', label: 'Recurring', icon: Calendar },
  { path: '/app/goals', label: 'Goals', icon: Target },
  { path: '/app/insights', label: 'AI Insights', icon: TrendingUp },
  { path: '/app/import', label: 'Import', icon: Upload },
  { path: 'logout', label: 'Logout', icon: LogOut, isLogout: true },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { darkMode } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen flex transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>

      {/* MOBILE HAMBURGER BUTTON */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl shadow-lg transition-colors ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
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
          fixed top-0 left-0 h-screen 
          bg-gradient-to-br from-purple-900 to-cyan-900 text-white 
          w-72 shadow-xl border-r border-purple-400/40 overflow-y-auto
          transition-transform duration-300 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >

        {/* Close Button - Mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 bg-white/10 rounded-lg z-10"
        >
          <X size={24} className="text-white" />
        </button>

        <div className="p-4 min-h-full flex flex-col">
          
          {/* Branding */}
          <div className="flex items-center gap-2 mb-6 mt-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-xl flex items-center justify-center shadow-xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
           <h1
                 onClick={() => navigate('/')}
                     className="text-xl font-extrabold text-white cursor-pointer"
                      >
                LifeLedger
               </h1>

          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.isLogout) {
                      logout()
                    } else {
                      navigate(item.path)
                    }
                    setSidebarOpen(false) // mobile auto-close
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm
                    ${item.isLogout 
                      ? 'text-red-300 hover:bg-red-500/10 border-t border-white/10 mt-2 pt-4'
                      : isActive
                      ? 'bg-white/20 shadow-lg text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto ml-0 md:ml-72">

        {/* HEADER */}
        <header className={`backdrop-blur-md p-8 border-b shadow-lg flex items-center justify-between transition-all duration-300 ${
          darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
        }`}>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              {(() => {
                const currentItem = navItems.find(n => n.path === location.pathname)
                const IconComponent = currentItem?.icon || Upload
                return <IconComponent className="w-6 h-6 text-white" />
              })()}
            </div>
            <div>
              <h1 className={`text-4xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent`}>
                {navItems.find(n => n.path === location.pathname)?.label || 'Import'}
              </h1>
              <p className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Right-side icons */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Info */}
            <button 
              onClick={() => navigate('/app/profile')}
              className="flex items-center gap-3 bg-gradient-to-r from-purple-200 to-cyan-200 px-4 py-2 rounded-xl shadow hover:from-purple-300 hover:to-cyan-300 transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-black overflow-hidden">
                {user?.profilePicUrl ? (
                  <img 
                    src={user.profilePicUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div>
                <div className={`font-black transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{user?.name}</div>
                <div className={`text-xs transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{user?.email}</div>
              </div>
            </button>
          </div>

        </header>

        <div className={`p-8 transition-colors ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <Outlet />
        </div>

      </main>
    </div>
  )
}
