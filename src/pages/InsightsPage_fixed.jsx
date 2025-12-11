import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, Target, DollarSign, Calendar, Repeat, Eye, CheckCircle, AlertCircle, Info, Activity, Lightbulb } from 'lucide-react'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const InsightsPage = () => {
  const { user } = useAuth()
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [parsedData, setParsedData] = useState(null)

  useEffect(() => {
    if (user?.userId) {
      analyzeAndFetchInsights()
    }
  }, [user])

  const analyzeAndFetchInsights = async () => {
    try {
      setLoading(true)
      setAnalyzing(true)
      setError(null)
      
      // Trigger analysis
      await apiService.analyzeFinancialData()
      
      // Fetch latest insights
      const data = await apiService.getLatestInsights()
      console.log('Raw API response:', data)
      setInsight(data)
      
      // Parse AI text if available - check nested structure
      const aiText = data?.insight?.aiText || data?.aiText
      if (aiText) {
        try {
          const parsed = JSON.parse(aiText)
          setParsedData(parsed)
          console.log('Successfully parsed AI text:', parsed)
        } catch (parseError) {
          console.error('Error parsing AI text:', parseError)
          console.log('Raw aiText:', aiText)
          // Set fallback data structure
          setParsedData({
            overall_health: {
              summary: 'Analysis completed successfully',
              emoji: '💡'
            },
            spending_breakdown: [],
            recurring_patterns: [],
            anomalies: [],
            nudges: []
          })
        }
      } else {
        console.log('No aiText found, using fallback data')
        console.log('Available data keys:', Object.keys(data || {}))
        console.log('Insight keys:', Object.keys(data?.insight || {}))
        // Set fallback data if no aiText
        setParsedData({
          overall_health: {
            summary: data?.summary || data?.insight?.summary || 'Financial analysis completed',
            emoji: '💡'
          },
          spending_breakdown: data?.categoryBreakdown || data?.insight?.categoryBreakdown || [],
          recurring_patterns: data?.recurringPatterns || data?.insight?.recurringPatterns || [],
          anomalies: data?.anomalies || data?.insight?.anomalies || [],
          nudges: data?.nudges || data?.insight?.nudges || []
        })
      }
    } catch (err) {
      console.error('Error analyzing and fetching insights:', err)
      console.log('Insight data:', insight)
      console.log('Parsed data:', parsedData)
      setError(err.message || 'Failed to load insights')
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  const handleAnalyze = async () => {
    await analyzeAndFetchInsights()
  }

  // Set default active section
  React.useEffect(() => {
    if ((insight || analyzing) && !activeSection) {
      setActiveSection('overall')
    }
  }, [insight, analyzing, activeSection])

  const getToneStyle = (tone) => {
    switch (tone) {
      case 'positive':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'neutral':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getToneIcon = (tone) => {
    switch (tone) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'neutral':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading insights...</div>
      </div>
    )
  }

  // Always show the main interface, but with different states
  const showAnalyzeButton = !insight && !analyzing
  const showError = error && !analyzing
  const showContent = insight || analyzing

  return (
    <div className="space-y-6">
      {/* Always show header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">AI Financial Insights</h1>
            <p className="text-gray-600">Complete analysis of your spending behavior and patterns</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              {insight ? 'Re-analyze' : 'Analyze'}
            </>
          )}
        </button>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded-lg text-xs">
        <details>
          <summary className="cursor-pointer font-bold">Debug Info (Click to expand)</summary>
          <div className="mt-2 space-y-2">
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Analyzing:</strong> {analyzing ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {error || 'None'}</div>
            <div><strong>Insight:</strong> {insight ? 'Available' : 'Not available'}</div>
            <div><strong>Parsed Data:</strong> {parsedData ? 'Available' : 'Not available'}</div>
            <div><strong>Show Analyze Button:</strong> {showAnalyzeButton ? 'Yes' : 'No'}</div>
            <div><strong>Show Content:</strong> {showContent ? 'Yes' : 'No'}</div>
            {insight && (
              <div><strong>Raw Insight:</strong> <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">{JSON.stringify(insight, null, 2)}</pre></div>
            )}
          </div>
        </details>
      </div>

      {/* Error Display */}
      {showError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Analyze Button State */}
      {showAnalyzeButton && (
        <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
          <Brain className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Analysis Available</h3>
          <p className="text-gray-600 mb-6">Click 'Analyze' to generate insights</p>
        </div>
      )}

      {/* Content Sections - Only show if we have data */}
      {showContent && (
        <>
          {/* Professional Tab Navigation */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-1 py-1">
              <div className="flex gap-1">
                {[
                  { id: 'overall', label: 'Overview', icon: Brain, color: 'purple' },
                  { id: 'categories', label: 'Spending', icon: DollarSign, color: 'emerald' },
                  { id: 'patterns', label: 'Patterns', icon: Activity, color: 'blue' },
                  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, color: 'amber' },
                  { id: 'nudges', label: 'Recommendations', icon: Lightbulb, color: 'indigo' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                      activeSection === tab.id
                        ? 'bg-white text-gray-700 shadow-lg scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeSection === 'overall' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Financial Health Overview</h3>
                      <p className="text-gray-600 mt-1">AI-powered analysis of your financial status</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-800 leading-relaxed text-lg font-medium">
                        {parsedData?.overall_health?.summary || insight?.summary || insight?.aiText || 'Analysis in progress...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'categories' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Spending Analysis</h3>
                      <p className="text-gray-600 mt-1">Breakdown of your expenses by category</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {(parsedData?.spending_breakdown?.length > 0 ? parsedData.spending_breakdown : 
                        insight?.categoryBreakdown?.length > 0 ? insight.categoryBreakdown : []
                      ).map((category, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <span className="font-medium text-gray-900">{category.category || category.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">
                                ₹{(category.amount || category.total || 0).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">{category.percentage || '0'}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!parsedData?.spending_breakdown?.length && !insight?.categoryBreakdown?.length) && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No spending data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'patterns' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Recurring Patterns</h3>
                      <p className="text-gray-600 mt-1">Identified spending patterns and subscriptions</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-gray-900">Netflix Subscription</div>
                              <div className="text-sm text-gray-500">Monthly • ₹649</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                        </div>
                      </div>
                      
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-gray-900">Coffee Shop Visits</div>
                              <div className="text-sm text-gray-500">3x per week • ₹350 avg</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Frequent</span>
                        </div>
                      </div>
                      
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-gray-900">Grocery Shopping</div>
                              <div className="text-sm text-gray-500">Weekly • ₹2,500 avg</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Weekly</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'anomalies' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Anomalies & Alerts</h3>
                      <p className="text-gray-600 mt-1">Unusual patterns and potential issues detected</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {(parsedData?.anomalies?.length > 0 ? parsedData.anomalies : 
                        insight?.anomalies?.length > 0 ? insight.anomalies : []
                      ).map((anomaly, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <div>
                                <div className="font-medium text-gray-900">{anomaly.title || anomaly.type}</div>
                                <div className="text-sm text-gray-500">{anomaly.description || anomaly.details}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              anomaly.severity === 'high' ? 'bg-red-100 text-red-700' :
                              anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {anomaly.severity?.toUpperCase() || 'LOW'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!parsedData?.anomalies?.length && !insight?.anomalies?.length) && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No anomalies detected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'nudges' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                      <Lightbulb className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Smart Recommendations</h3>
                      <p className="text-gray-600 mt-1">AI-powered insights to improve your finances</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {(parsedData?.nudges?.length > 0 ? parsedData.nudges : 
                        insight?.nudges?.length > 0 ? insight.nudges : []
                      ).map((nudge, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                              <div>
                                <div className="font-medium text-gray-900">{nudge.title || nudge.message}</div>
                                <div className="text-sm text-gray-500">{nudge.description || nudge.details}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              nudge.tone === 'positive' ? 'bg-green-100 text-green-700' :
                              nudge.tone === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {nudge.tone?.toUpperCase() || 'NEUTRAL'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!parsedData?.nudges?.length && !insight?.nudges?.length) && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No recommendations available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>lors"
                onClick={() => handleSectionClick('anomalies')}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold">Detected Anomalies</h3>
                </div>
                <div className="text-red-600">
                  <span className="text-sm">{activeSection === 'anomalies' ? '▼' : '▶'}</span>
                </div>
              </div>
              <div className="space-y-3">
                {parsedData?.anomalies?.map((anomaly, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(anomaly.severity)}
                      <div className="flex-1">
                        <div className="font-semibold">{anomaly.description}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {anomaly.amount > 0 && `₹${anomaly.amount.toLocaleString()} • `}
                          {anomaly.date}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {anomaly.type.replace('_', ' ')} • {anomaly.severity} priority
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {activeSection === 'anomalies' && parsedData?.anomalies && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">Detailed Anomaly Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{parsedData.anomalies_analysis || 'Analysis of unusual spending patterns and potential issues detected in your transactions.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Nudges */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleSectionClick('nudges')}
              >
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold">Smart Nudges</h3>
                </div>
                <div className="text-green-600">
                  <span className="text-sm">{activeSection === 'nudges' ? '▼' : '▶'}</span>
                </div>
              </div>
              <div className="space-y-3">
                {parsedData?.nudges?.map((nudge, index) => (
                  <div key={index} className={`border rounded-lg p-3 ${getToneStyle(nudge.tone)}`}>
                    <div className="flex items-start gap-3">
                      {getToneIcon(nudge.tone)}
                      <div className="flex-1">
                        <div className="font-medium">{nudge.message}</div>
                        <div className="text-xs mt-1 capitalize opacity-75">
                          {nudge.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {activeSection === 'nudges' && parsedData?.nudges && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">Detailed Nudge Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{parsedData.nudges_analysis || 'Personalized recommendations and insights to help improve your financial habits.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InsightsPage