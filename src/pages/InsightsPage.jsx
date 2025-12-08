import React, { useState, useEffect } from "react";
import {
  Brain,
  DollarSign,
  Repeat,
  Eye,
  Target,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const InsightsPage = () => {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (user?.userId) {
      // Only fetch existing insights on load, don't auto-analyze
      fetchExistingInsights();
    }
  }, [user]);

  // Set default active section on data load
  useEffect(() => {
    if (data && !activeSection) {
      setActiveSection('overall')
    }
  }, [data, activeSection])

  const fetchExistingInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only fetch existing insights, don't trigger new analysis
      const response = await apiService.getLatestInsights();
      console.log("Raw API:", response);

      if (!response?.insight?.aiText) {
        setData(null);
        return;
      }

      const raw = JSON.parse(response.insight.aiText);

      console.log("Parsed AI text:", raw);

      // 🔥 FINAL FIX — MAP BACKEND → FRONTEND STRUCTURE
      const mapped = {
        overall_health: {
          summary:
            raw.analysis?.overall_summary ||
            raw.analysis?.overallSummary ||
            "Analysis completed",

          emoji: raw.analysis?.emoji || "💡",

          analysis:
            raw.analysis?.overall_details ||
            raw.analysis?.overallDetails ||
            "",
        },

        spending_breakdown:
          raw.analysis?.categorized ||
          raw.analysis?.spendingBreakdown ||
          [],

        recurring_patterns:
          raw.analysis?.recurring ||
          raw.analysis?.recurringPatterns ||
          [],

        anomalies:
          raw.analysis?.anomalies ||
          raw.analysis?.detectedAnomalies ||
          [],

        nudges:
          raw.analysis?.nudges ||
          raw.analysis?.smartNudges ||
          [],
      };

      console.log("Mapped Final Data:", mapped);
      setData(mapped);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeInsights = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      // Trigger analysis
      await apiService.analyzeFinancialData();

      // Fetch latest insights
      const response = await apiService.getLatestInsights();
      console.log("New analysis results:", response);

      if (!response?.insight?.aiText) {
        setData(null);
        return;
      }

      const raw = JSON.parse(response.insight.aiText);
      console.log("Parsed AI text:", raw);

      const mapped = {
        overall_health: {
          summary: raw.analysis?.overall_summary || raw.analysis?.overallSummary || "Analysis completed",
          emoji: raw.analysis?.emoji || "💡",
          analysis: raw.analysis?.overall_details || raw.analysis?.overallDetails || "",
        },
        spending_breakdown: raw.analysis?.categorized || raw.analysis?.spendingBreakdown || [],
        recurring_patterns: raw.analysis?.recurring || raw.analysis?.recurringPatterns || [],
        anomalies: raw.analysis?.anomalies || raw.analysis?.detectedAnomalies || [],
        nudges: raw.analysis?.nudges || raw.analysis?.smartNudges || [],
      };

      console.log("Mapped Final Data:", mapped);
      setData(mapped);
    } catch (err) {
      console.error("Error analyzing insights:", err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // UI helpers
  const getToneStyle = (tone) => {
    const styles = {
      positive: "bg-green-50 border-green-300",
      warning: "bg-yellow-50 border-yellow-300",
      neutral: "bg-blue-50 border-blue-300",
    };
    return styles[tone] || "bg-gray-50 border-gray-300";
  };

  const getToneIcon = (tone) => {
    const icons = {
      positive: <CheckCircle className="w-5 h-5 text-green-600" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      neutral: <Info className="w-5 h-5 text-blue-600" />,
    };
    return icons[tone] || <Info className="w-5 h-5 text-gray-600" />;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      high: <AlertTriangle className="w-5 h-5 text-red-600" />,
      medium: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      low: <Info className="w-5 h-5 text-blue-600" />,
    };
    return icons[severity] || <Info className="w-5 h-5 text-gray-600" />;
  };

  // Loader
  if (loading)
    return (
      <div className="flex justify-center py-20 text-lg">Analyzing...</div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={analyzeInsights}
          disabled={analyzing}
          className="bg-purple-600 text-white px-6 py-2 rounded-xl shadow hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              {data ? 'Re-analyze' : 'Analyze'}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Default Layout */}
      {!data && !analyzing && !loading && (
        <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
          <Brain className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">AI Financial Insights</h3>
          <p className="text-gray-600 mb-6">Get personalized insights about your spending patterns, anomalies, and smart recommendations</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">Our AI will analyze your transactions to provide:</p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Spending breakdown by category</li>
              <li>• Recurring payment patterns</li>
              <li>• Unusual transaction detection</li>
              <li>• Personalized financial nudges</li>
            </ul>
          </div>
        </div>
      )}

      {/* Professional Analyzing State */}
      {analyzing && (
        <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <Brain className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-purple-600">Analyzing Your Financial Data</h3>
          <p className="text-gray-600 mb-4">Our AI is processing your transactions and generating personalized insights...</p>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-sm text-purple-700 mt-2">This may take a few moments...</p>
          </div>
        </div>
      )}

      {/* Data Available */}
      {data && (
        <>
          {/* Professional Tab Navigation */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-1 py-1">
              <div className="flex gap-1">
                {[
                  { id: 'overall', label: 'Overview', icon: Brain },
                  { id: 'categories', label: 'Spending', icon: DollarSign },
                  { id: 'recurring', label: 'Patterns', icon: Repeat },
                  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
                  { id: 'nudges', label: 'Recommendations', icon: Target }
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
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Financial Health Overview</h3>
                      <p className="text-gray-600 mt-1">AI-powered analysis of your financial status</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-800 leading-relaxed text-lg font-medium">
                        {data.overall_health.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'categories' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Spending Analysis</h3>
                      <p className="text-gray-600 mt-1">Breakdown of your expenses by category</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {data.spending_breakdown.map((category, index) => (
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
                      {data.spending_breakdown.length === 0 && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No spending data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'recurring' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <Repeat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Recurring Patterns</h3>
                      <p className="text-gray-600 mt-1">Identified spending patterns and subscriptions</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {data.recurring_patterns.map((pattern, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <div>
                                <div className="font-medium text-gray-900">{pattern.merchant}</div>
                                <div className="text-sm text-gray-500">{pattern.frequency}</div>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Active</span>
                          </div>
                        </div>
                      ))}
                      {data.recurring_patterns.length === 0 && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No patterns identified</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'anomalies' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Anomalies & Alerts</h3>
                      <p className="text-gray-600 mt-1">Unusual patterns and potential issues detected</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {data.anomalies.map((anomaly, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <div>
                                <div className="font-medium text-gray-900">{anomaly.reason}</div>
                                <div className="text-sm text-gray-500">₹{anomaly.amount} • {anomaly.category}</div>
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
                      {data.anomalies.length === 0 && (
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
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">Smart Recommendations</h3>
                      <p className="text-gray-600 mt-1">AI-powered insights to improve your finances</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {data.nudges.map((nudge, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                              <div>
                                <div className="font-medium text-gray-900">{nudge.message}</div>
                                <div className="text-sm text-gray-500">{nudge.type}</div>
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
                      {data.nudges.length === 0 && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No recommendations available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsPage;


