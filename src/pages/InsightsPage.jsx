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

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountFilter, setAccountFilter] = useState('all');
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [statusPolling, setStatusPolling] = useState(false);
  const [analysisController, setAnalysisController] = useState(null);

  useEffect(() => {
    if (user?.userId) {
      loadAccountsAndCheckInsights();
    }
  }, [user]);
  
  const loadAccountsAndCheckInsights = async () => {
    const accountsArray = await loadAccounts();
    if (accountsArray.length > 0) {
      await checkExistingInsights(accountsArray);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      const accountsArray = Array.isArray(data) ? data : [];
      setAccounts(accountsArray);
      
      // Auto-select first account if available
      if (accountsArray.length > 0 && accountFilter === 'all') {
        setAccountFilter(accountsArray[0].id.toString());
      }
      
      return accountsArray;
    } catch (err) {
      console.error('Error fetching accounts:', err);
      return [];
    }
  };

  // Set default active section on data load
  useEffect(() => {
    if (data && !activeSection) {
      setActiveSection('overall')
    }
  }, [data, activeSection])

  const checkExistingInsights = async (accountsArray) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load existing insights from the first available account
      if (accountsArray.length > 0) {
        const accountId = accountsArray[0].id;
        setAccountFilter(accountId.toString());
        
        // Try to fetch existing data
        const [summaryResponse, recurringResponse, anomaliesResponse, insightsResponse] = await Promise.allSettled([
          apiService.getSummary(accountId),
          apiService.getRecurringPatterns(accountId),
          apiService.getAnomalies(accountId),
          apiService.generateInsights()
        ]);
        
        // Check if we have any valid data
        const hasData = [
          summaryResponse.status === 'fulfilled' && summaryResponse.value,
          recurringResponse.status === 'fulfilled' && recurringResponse.value?.length > 0,
          anomaliesResponse.status === 'fulfilled' && anomaliesResponse.value?.length > 0,
          insightsResponse.status === 'fulfilled' && insightsResponse.value?.length > 0
        ].some(Boolean);
        
        if (hasData) {
          // We have existing data, populate it
          setData({
            overall_health: {
              summary: summaryResponse.status === 'fulfilled' ? summaryResponse.value?.summary || 'Previous analysis available' : 'Analysis available',
              emoji: '📊',
              analysis: summaryResponse.status === 'fulfilled' ? summaryResponse.value?.analysis || 'Your spending patterns have been analyzed' : 'Previous insights available'
            },
            spending_breakdown: summaryResponse.status === 'fulfilled' ? summaryResponse.value?.categories || summaryResponse.value?.breakdown || [] : [],
            recurring_patterns: recurringResponse.status === 'fulfilled' ? recurringResponse.value || [] : [],
            anomalies: anomaliesResponse.status === 'fulfilled' ? anomaliesResponse.value || [] : [],
            nudges: insightsResponse.status === 'fulfilled' ? insightsResponse.value?.recommendations || insightsResponse.value || [] : []
          });
          setActiveSection('overall');
        }
      }
    } catch (err) {
      console.error("Error loading existing insights:", err);
      // Don't set error, just continue without existing data
    } finally {
      setLoading(false);
    }
  };

  const analyzeInsights = async () => {
    if (accountFilter === 'all' || !accountFilter) {
      setError('Please select a bank account first');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysisStatus('Starting AI analysis...');
      
      // Call POST /ai/summary to start Gemini analysis
      await apiService.startSummaryAnalysis();
      
      // Poll status and get summary
      setAnalysisStatus('AI is analyzing your data...');
      const pollForSummary = async () => {
        try {
          const statusResponse = await apiService.getAnalysisStatus();
          console.log('Status response:', statusResponse);
          
          if (statusResponse?.summary) {
            // Analysis complete, show summary
            setData({
              overall_health: {
                summary: statusResponse.summary,
                emoji: '📊',
                analysis: 'AI analysis completed'
              },
              spending_breakdown: [],
              recurring_patterns: [],
              anomalies: [],
              nudges: []
            });
            setActiveSection('overall');
            setAnalyzing(false);
            setAnalysisStatus(null);
          } else {
            // Still processing, poll again
            setTimeout(pollForSummary, 2000);
          }
        } catch (err) {
          console.error('Error polling status:', err);
          setError('Failed to get analysis status');
          setAnalyzing(false);
          setAnalysisStatus(null);
        }
      };
      
      // Start polling after 3 seconds
      setTimeout(pollForSummary, 3000);
      
    } catch (err) {
      console.error('Error starting analysis:', err);
      setError('Failed to start analysis: ' + err.message);
      setAnalyzing(false);
      setAnalysisStatus(null);
    }
  };

  const stopAnalysis = () => {
    setAnalyzing(false);
    setAnalysisStatus(null);
    setAnalysisController(null);
    setError('Analysis stopped by user');
  };



  const fetchRecurringPatterns = async () => {
    if (accountFilter === 'all' || !accountFilter) return;
    
    try {
      // First call POST /ai/recurring to start analysis
      await apiService.startRecurringAnalysis();
      
      // Then call GET /recurring/account/{id} to get results
      const accountId = parseInt(accountFilter);
      const response = await apiService.getRecurringPatterns(accountId);
      console.log("Recurring patterns:", response);
      
      setData(prev => ({
        ...prev,
        recurring_patterns: response || []
      }));
    } catch (err) {
      console.error("Error fetching recurring patterns:", err);
      setError(err.message);
    }
  };

  const fetchAnomalies = async () => {
    if (accountFilter === 'all' || !accountFilter) return;
    
    try {
      const accountId = parseInt(accountFilter);
      const response = await apiService.getAnomalies(accountId);
      console.log("Anomalies:", response);
      
      setData(prev => ({
        ...prev,
        anomalies: response || []
      }));
    } catch (err) {
      console.error("Error fetching anomalies:", err);
      setError(err.message);
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
        <div className="flex gap-3">
          <button
            onClick={analyzeInsights}
            disabled={analyzing || accountFilter === 'all' || !accountFilter}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {analysisStatus || 'Analyzing...'}
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                {accountFilter === 'all' || !accountFilter ? 'Select Account First' : 'Get AI Insights'}
              </>
            )}
          </button>
          
          {analyzing && (
            <button
              onClick={stopAnalysis}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Select Bank Account Message */}
      {!data && !analyzing && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Select Bank Account</h3>
          <p className="text-gray-600 mb-8 text-lg">Choose a bank account to get AI-powered financial insights</p>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <p className="text-sm font-semibold text-gray-700 mb-4">Select an account above to analyze:</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Spending summary & insights
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Recurring payment patterns
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Anomaly detection
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Smart recommendations
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {analyzing && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AI Analysis in Progress</h3>
              <p className="text-gray-600 font-medium">{analysisStatus || 'Processing your financial data...'}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Live Results During Analysis */}
      {data && analyzing && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
            <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Live Analysis Results</h3>
            <p className="text-gray-600">Results appear as analysis progresses</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Summary Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
              <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Summary Analysis
              </h4>
              <p className="text-gray-700">
                {data.overall_health.summary || 'Analyzing spending patterns...'}
              </p>
              {data.spending_breakdown.length > 0 && (
                <div className="mt-4 space-y-2">
                  {data.spending_breakdown.slice(0, 3).map((category, index) => (
                    <div key={index} className="flex justify-between items-center bg-white/70 rounded-lg p-3">
                      <span className="font-medium">{category.category || category.name}</span>
                      <span className="font-bold text-purple-600">₹{(category.amount || category.total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Other sections show as they complete */}
            {data.recurring_patterns.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Recurring Patterns ({data.recurring_patterns.length})
                </h4>
                <div className="space-y-2">
                  {data.recurring_patterns.slice(0, 2).map((pattern, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-3">
                      <div className="font-medium">{pattern.merchant}</div>
                      <div className="text-sm text-gray-600">{pattern.frequency}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.anomalies.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <h4 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Anomalies Detected ({data.anomalies.length})
                </h4>
                <div className="space-y-2">
                  {data.anomalies.slice(0, 2).map((anomaly, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-3">
                      <div className="font-medium">{anomaly.reason}</div>
                      <div className="text-sm text-gray-600">₹{anomaly.amount} • {anomaly.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.nudges.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommendations ({data.nudges.length})
                </h4>
                <div className="space-y-2">
                  {data.nudges.slice(0, 2).map((nudge, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-3">
                      <div className="font-medium">{nudge.message}</div>
                      <div className="text-sm text-gray-600">{nudge.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Available */}
      {data && !analyzing && (
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
                        {data.overall_health.summary || 'Analysis in progress...'}
                      </p>
                      {data.overall_health.analysis && (
                        <p className="text-gray-700 mt-4">
                          {data.overall_health.analysis}
                        </p>
                      )}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                        <Repeat className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900">Recurring Patterns</h3>
                        <p className="text-gray-600 mt-1">Identified spending patterns and subscriptions</p>
                      </div>
                    </div>
                    <button
                      onClick={fetchRecurringPatterns}
                      disabled={accountFilter === 'all' || !accountFilter}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {accountFilter === 'all' || !accountFilter ? 'Select Account' : 'Load Patterns'}
                    </button>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900">Anomalies & Alerts</h3>
                        <p className="text-gray-600 mt-1">Unusual patterns and potential issues detected</p>
                      </div>
                    </div>
                    <button
                      onClick={fetchAnomalies}
                      disabled={accountFilter === 'all' || !accountFilter}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {accountFilter === 'all' || !accountFilter ? 'Select Account' : 'Load Anomalies'}
                    </button>
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


