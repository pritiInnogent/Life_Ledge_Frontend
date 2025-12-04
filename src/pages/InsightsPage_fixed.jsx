import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, Target, DollarSign, Calendar, Repeat, Eye, CheckCircle, AlertCircle, Info } from 'lucide-react'
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

  const handleSectionClick = (sectionType) => {
    if (activeSection === sectionType) {
      setActiveSection(null)
    } else {
      setActiveSection(sectionType)
    }
  }

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
          {/* Summary Card */}
          <div 
            className={`rounded-2xl p-6 border-2 cursor-pointer hover:shadow-lg transition-shadow ${
              activeSection === 'overall' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
            }`}
            onClick={() => handleSectionClick('overall')}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{parsedData?.overall_health?.emoji || '💡'}</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Overall Financial Health</h3>
                <p className="text-lg text-blue-800">
                  {parsedData?.overall_health?.summary || insight?.summary || insight?.aiText || 'Analysis in progress...'}
                </p>
              </div>
            </div>
            
            {activeSection === 'overall' && parsedData?.overall_health && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold mb-3 text-gray-700">Detailed Analysis</h4>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-gray-700">{parsedData.overall_health.analysis || parsedData.overall_health.details}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleSectionClick('categories')}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold">Spending Breakdown</h3>
                </div>
                <div className="text-purple-600">
                  <span className="text-sm">{activeSection === 'categories' ? '▼' : '▶'}</span>
                </div>
              </div>
              <div className="space-y-3">
                {(parsedData?.spending_breakdown?.length > 0 ? parsedData.spending_breakdown : 
                  insight?.categoryBreakdown?.length > 0 ? insight.categoryBreakdown : []
                ).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-purple-400"></div>
                      <span className="font-medium">{category.category || category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{(category.amount || category.value || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{category.percentage || '0'}%</div>
                    </div>
                  </div>
                ))}
                {(!parsedData?.spending_breakdown?.length && !insight?.categoryBreakdown?.length) && (
                  <div className="text-gray-500 text-center py-4">No category data available</div>
                )}
              </div>
              
              {activeSection === 'categories' && parsedData?.spending_breakdown && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">Detailed Category Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{parsedData.spending_breakdown_analysis || 'Detailed breakdown of your spending patterns across different categories.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Patterns */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleSectionClick('patterns')}
              >
                <div className="flex items-center gap-3">
                  <Repeat className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold">Recurring Patterns</h3>
                </div>
                <div className="text-blue-600">
                  <span className="text-sm">{activeSection === 'patterns' ? '▼' : '▶'}</span>
                </div>
              </div>
              <div className="space-y-3">
                {(parsedData?.recurring_patterns?.length > 0 ? parsedData.recurring_patterns : 
                  insight?.recurringPatterns?.length > 0 ? insight.recurringPatterns : []
                ).map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{pattern.merchant}</div>
                        <div className="text-sm text-gray-600">{pattern.frequency}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{pattern.amount}</div>
                        <div className="text-xs text-gray-500">{pattern.type}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Next: {pattern.nextDate}
                    </div>
                  </div>
                ))}
                {(!parsedData?.recurring_patterns?.length && !insight?.recurringPatterns?.length) && (
                  <div className="text-gray-500 text-center py-4">No recurring patterns found</div>
                )}
              </div>
              
              {activeSection === 'patterns' && parsedData?.recurring_patterns && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-700">Detailed Pattern Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{parsedData.recurring_patterns_analysis || 'Analysis of your recurring spending patterns and subscriptions.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomalies */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
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