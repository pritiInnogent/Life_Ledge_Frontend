import React, { useState, useEffect } from "react";
import {
  Brain,
  DollarSign,
  Repeat,
  Target,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import '../styles/animations.css';

const InsightsPage = () => {
  const { user } = useAuth();

  const [insights, setInsights] = useState([]);
  const [selectedInsightIndex, setSelectedInsightIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountFilter, setAccountFilter] = useState('all');

  useEffect(() => {
    if (user?.userId) {
      // Only fetch existing insights on load, don't auto-analyze
      fetchExistingInsights();
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

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
      setAiInsight('Failed to load insights. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Filter by Bank Account</label>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} ••••{account.last4Digits}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={analyzeInsights}
          disabled={analyzing}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
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
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">AI Financial Insights</h3>
          <p className="text-gray-600 mb-8 text-lg">Get personalized insights about your spending patterns, anomalies, and smart recommendations</p>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <p className="text-sm font-semibold text-gray-700 mb-4">Our AI will analyze your transactions to provide:</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Spending breakdown by category
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Recurring payment patterns
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Unusual transaction detection
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Personalized financial nudges
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Analyzing State */}
      {analyzing && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Analyzing Your Financial Data</h3>
          <p className="text-gray-600 mb-6 text-lg">Our AI is processing your transactions and generating personalized insights...</p>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-sm font-semibold text-purple-700">This may take a few moments...</p>
          </div>
        </div>
      )}

      {/* Data Available */}
      {data && (
        <>
          {/* Professional Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-1 py-1">
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
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-gray-600 mt-4 font-medium">Loading your insights...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeSection === 'overall' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Financial Health Overview</h3>
                      <p className="text-gray-600 mt-1 font-medium">AI-powered analysis of your financial status</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-8 border border-purple-100 shadow-lg">
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
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Spending Analysis</h3>
                      <p className="text-gray-600 mt-1 font-medium">Breakdown of your expenses by category</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
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


