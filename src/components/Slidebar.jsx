import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Wallet, BarChart3, Receipt, Calendar, PieChart, Target, Upload, Settings, TrendingUp } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = useLocation().pathname;

  const navItems = [

    { path: "/app/dashboard", label: "Dashboard", icon: Home, emoji: "🏠" },
    { path: "/app/import", label: "Import", icon: Upload, emoji: "📤" },
    { path: "/app/transactions", label: "Transactions", icon: Receipt, emoji: "💳" },
    { path: "/app/categories", label: "Categories", icon: PieChart, emoji: "🎨" },
    { path: "/app/recurring", label: "Recurring", icon: Calendar, emoji: "🔄" },
    { path: "/app/goals", label: "Goals", icon: Target, emoji: "🎯" },
    { path: "/app/insights", label: "Insights", icon: TrendingUp, emoji: "🤖" },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-xl shadow-lg"
      >
        <Menu size={26} />
      </button>

      {/* Overlay (Mobile) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        ></div>
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 text-white shadow-xl border-r border-purple-400/40 overflow-hidden
          transition-transform duration-300 z-50
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-6">

          {/* Close Button (Mobile Only) */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 bg-white/10 rounded-lg"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Branding */}
          <div className="flex items-center gap-3 mb-10 mt-3">
            <div className="bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              LifeLedger
            </h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)} // auto close in mobile
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition-all 
                    ${isActive 
                      ? "bg-white/20 shadow-lg text-white scale-105" 
                      : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-lg">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition-all text-gray-300 hover:bg-red-500/20 hover:text-red-300 mt-4"
            >
              <span className="text-2xl">🚪</span>
              <span className="text-lg">Logout</span>
            </button>
          </nav>

        </div>
      </aside>
    </>
  );
}
