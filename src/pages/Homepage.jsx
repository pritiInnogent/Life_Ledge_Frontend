import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, Shield, Zap, Target, BarChart3, ArrowRight, Sparkles } from 'lucide-react'
import '../styles/Homepage.css'

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
    if (user) navigate('/app/dashboard')
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
              <div className="brand-badge">
                <div className="brand-icon">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="brand-name">LifeLedger</span>
                <div className="ai-badge">
                  <Sparkles className="w-3 h-3" />
                  <span className="ai-badge-text">AI-Powered</span>
                </div>
              </div>

              <div className="hero-heading">
                <h1 className="main-title">
                  Master Your
                  <span className="gradient-text"> Finances </span>
                  with AI
                </h1>
                <p className="hero-description">
                  Transform messy transactions into clear insights. Auto-categorize expenses, 
                  set smart budgets, and make informed financial decisions with our AI-powered platform.
                </p>
              </div>

              <div className="cta-buttons">
                <button onClick={handleGetStarted} className="primary-btn">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 arrow-icon" />
                </button>
                <button onClick={() => navigate('/app/insights')} className="secondary-btn">
                  <TrendingUp className="w-5 h-5" />
                  View Demo
                </button>
              </div>

              <div className="trust-indicators">
                <div className="trust-item">
                  <Shield className="w-4 h-4" />
                  <span className="trust-text">Bank-level Security</span>
                </div>
                <div className="trust-item">
                  <Sparkles className="w-4 h-4" />
                  <span className="trust-text">AI-Powered Insights</span>
                </div>
              </div>
            </div>

            <div className="dashboard-preview">
              <div className="dashboard-card">
                <div className="dashboard-content">
                  <div className="dashboard-header">
                    <h3 className="dashboard-title">Financial Overview</h3>
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
              Everything you need to
              <span className="gradient-text"> succeed financially</span>
            </h2>
            <p className="features-description">
              Powerful features designed to simplify your financial life and help you make smarter money decisions.
            </p>
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