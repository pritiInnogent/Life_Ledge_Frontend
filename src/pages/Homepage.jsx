import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, Shield, Zap, Target, BarChart3, ArrowRight, Sparkles } from 'lucide-react'
import './Homepage.css'

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
)

const StatCard = ({ label, value, trend, isPositive }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-label">{label}</span>
      <span className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
        {trend}
      </span>
    </div>
    <div className="stat-value">{value}</div>
  </div>
)

export default function Homepage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) navigate('/app/analytics')
    else navigate('/register')
  }

  const features = [
    {
      icon: Zap,
      title: 'Smart Categorization',
      description: 'AI automatically categorizes your transactions from UPI, bank statements, and receipts'
    },
    {
      icon: Target,
      title: 'Goal-Based Budgets',
      description: 'Set realistic budgets and track progress with intelligent spending insights'
    },
    {
      icon: BarChart3,
      title: 'Visual Analytics',
      description: 'Beautiful charts and reports that make your financial data easy to understand'
    }
  ]

  return (
    <div className="homepage">
      <div className="bg-blur-1"></div>
      <div className="bg-blur-2"></div>
      
      <main className="main-content">
        <div className="hero-section">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 sm:mb-8">
                <img src="/logo.png" alt="LifeLedger" className="w-12 h-12 sm:w-16 sm:h-16" />
                <div className="text-center sm:text-left">
                  <div className="relative">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">LifeLedger</h1>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 animate-pulse" style={{animation: 'expandWidth 2s ease-in-out infinite'}}></div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs sm:text-sm text-purple-600 font-medium">Financial clarity at your fingertips</span>
                  </div>
                </div>
              </div>

              <div className="hero-heading text-center sm:text-left">
                <h2 className="main-title text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
                 Your personal 
                  <span className="gradient-text"> finance </span>
                 intelligence system.
                </h2>
              </div>

              <div className="cta-buttons flex justify-center sm:justify-start">
                <button onClick={handleGetStarted} className="primary-btn w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 arrow-icon" />
                </button>
              </div>

              <div className="trust-indicators flex-col sm:flex-row items-center justify-center sm:justify-start">
                <div className="trust-item">
                  <Shield className="w-4 h-4" />
                  <span className="trust-text text-xs sm:text-sm">Bank-level Security</span>
                </div>
                <div className="trust-item">
                  <Sparkles className="w-4 h-4" />
                  <span className="trust-text text-xs sm:text-sm">AI-Powered Insights</span>
                </div>
              </div>
            </div>

            <div className="dashboard-preview">
              <div className="dashboard-card">
                <div className="dashboard-content">
                  <div className="dashboard-header">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="LifeLedger" className="w-5 h-5" />
                      <h3 className="dashboard-title">Financial Overview</h3>
                    </div>
                    <div className="live-badge">Live</div>
                  </div>

                  <div className="balance-display">
                    <div className="balance-label">Total Balance</div>
                    <div className="balance-amount">₹1,24,567</div>
                    <div className="balance-breakdown">
                      <span className="income-text">Income: ₹85,000</span>
                      <span className="expense-text">Expenses: ₹39,433</span>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <StatCard label="Savings" value="₹45,567" trend="+12%" isPositive={true} />
                    <StatCard label="This Month" value="₹39,433" trend="-8%" isPositive={false} />
                  </div>
                </div>
              </div>

              <div className="floating-card floating-card-1">
                <div className="floating-content">
                  <div className="floating-icon">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="floating-title">Smart Tip</div>
                    <div className="floating-subtitle">Save ₹5,000 more this month</div>
                  </div>
                </div>
              </div>

              <div className="floating-card floating-card-2">
                <div className="floating-title">Auto-categorized</div>
                <div className="floating-subtitle">247 transactions this month</div>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <div className="features-header">
            <h2 className="features-title">
              Key
              <span className="gradient-text"> Features</span>
            </h2>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}