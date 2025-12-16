import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { Brain, Sparkles, AlertTriangle, Lightbulb, CheckCircle, Loader2 } from "lucide-react";
import '../styles/animations.css';

const InsightsPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [accountFilter, setAccountFilter] = useState(() => {
    return sessionStorage.getItem('selectedAccount') || 'all'
  });
  const [showInsights, setShowInsights] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [spendingData, setSpendingData] = useState(null);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringComplete, setRecurringComplete] = useState(false);
  const [recurringData, setRecurringData] = useState(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);
  const [anomaliesComplete, setAnomaliesComplete] = useState(false);
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const handleAccountChange = (event) => {
      setAccountFilter(event.detail)
    }
    
    window.addEventListener('accountChanged', handleAccountChange)
    loadAccounts();
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange)
    }
  }, []);

  useEffect(() => {
    if (accountFilter && accountFilter !== 'all') {
      checkExistingInsights();
      checkExistingAnomalies();
    }
  }, [accountFilter]);

  // Add missing dependency for checkExistingInsights
  const checkExistingInsights = React.useCallback(async () => {
    try {
      const data = await apiService.getInsightsSummary(accountFilter);
      if (data && (data.insights?.length > 0 || data.aiText)) {
        const insights = parseInsightsData(data);
        if (insights) {
          setInsightsData(insights);
          setShowInsights(true);
          setAnalysisComplete(true);
          setActiveSection('overview');
        }
      }
    } catch (error) {
      console.log('No existing insights found');
    }
  }, [accountFilter]);

  const checkExistingAnomalies = React.useCallback(async () => {
    try {
      const response = await apiService.api.get(`/anomalies/account/${accountFilter}`);
      const data = response?.data?.anomalies || response?.anomalies || response?.data || response;
      if (data && Array.isArray(data)) {
        setAnomaliesData(data);
      }
    } catch (error) {
      // No existing anomalies
    }
  }, [accountFilter]);

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const parseInsightsData = (data) => {
    let parsed = null;
    try {
      // Handle response structure with insights array
      const aiText = data.insights?.[0]?.aiText || data.aiText;
      if (aiText) {
        parsed = JSON.parse(aiText);
      }
    } catch (e) {
      console.error('Failed parsing aiText:', e);
    }
    return parsed;
  };



  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000)
  }

  const handleGetInsights = async () => {
    if (accountFilter === 'all') {
      showToast('Please select a bank account first', 'error');
      return;
    }
    
    try {
      setLoading(true);
      setShowInsights(true);
      setAnalysisComplete(false);
      setInsightsData(null);
      
      // Call POST /ai/summary with accountId
      await apiService.runSummary(accountFilter);
      
      // Poll for insights data
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const data = await apiService.getInsightsSummary(accountFilter);
          const insights = parseInsightsData(data);
          if (insights) {
            setInsightsData(insights);
            setLoading(false);
            setAnalysisComplete(true);
            showToast('AI insights generated successfully!', 'success');
            return;
          }
        } catch (e) {
          console.log('Waiting for insights...');
        }
        attempts++;
      }
      
      setLoading(false);
      setAnalysisComplete(true);
      
    } catch (error) {
      console.error('Error starting analysis:', error);
      showToast('Failed to start AI analysis', 'error');
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      showToast('Fetching AI insights...', 'success');
      const data = await apiService.getInsightsSummary(accountFilter);
      const insights = parseInsightsData(data);
      if (insights) {
        setInsightsData(insights);
        setActiveSection('overview');
        showToast('AI insights loaded successfully!', 'success');
      } else {
        showToast('No insights data available yet. Please wait for processing to complete.', 'error');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      showToast('Failed to fetch insights. Please try again later.', 'error');
    }
  };

  const handleSpendingClick = async () => {
    setActiveSection('spending');
    if (!spendingData) {
      try {
        setSpendingLoading(true);
        await apiService.startCategorization(accountFilter);
        const data = await apiService.getCategories();
        setSpendingData(data);
      } catch (error) {
        console.error('Error fetching spending data:', error);
      } finally {
        setSpendingLoading(false);
      }
    }
  };

  const handleRecurringClick = async () => {
    setActiveSection('recurring');
    if (!recurringData) {
      try {
        setRecurringLoading(true);
        await apiService.startRecurringAnalysis(accountFilter);
        setTimeout(() => {
          setRecurringLoading(false);
          setRecurringComplete(true);
        }, 3000);
      } catch (error) {
        console.error('Error starting recurring analysis:', error);
        setRecurringLoading(false);
      }
    }
  };

  const fetchRecurringData = async () => {
    try {
      const data = await apiService.getRecurringPatterns(accountFilter);
      setRecurringData(data);
      setRecurringComplete(false);
    } catch (error) {
      console.error('Error fetching recurring data:', error);
    }
  };

  const handleAnomaliesClick = async () => {
    setActiveSection('anomalies');
    
    if (anomaliesData) return;
    
    // Try to fetch existing data first
    try {
      const response = await apiService.api.get(`/anomalies/account/${accountFilter}`);
      const data = response?.data?.anomalies || response?.anomalies || response?.data || response;
      if (data && Array.isArray(data) && data.length > 0) {
        setAnomaliesData(data);
        return;
      }
    } catch (error) {
      // No existing anomalies, run analysis
    }
    
    // Run new analysis
    try {
      setAnomaliesLoading(true);
      showToast('🔄 Analyzing anomalies...', 'success');
      await apiService.runAnomalies(accountFilter);
      
      // Poll for saved data
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const response = await apiService.api.get(`/anomalies/account/${accountFilter}`);
          const data = response?.data?.anomalies || response?.anomalies || response?.data || response;
          if (data && Array.isArray(data)) {
            setAnomaliesData(data);
            setAnomaliesLoading(false);
            showToast(data.length > 0 ? '✨ Anomalies detected successfully!' : 'No anomalies detected', 'success');
            return;
          }
        } catch (e) {
          // Waiting for anomalies
        }
        attempts++;
      }
      
      setAnomaliesLoading(false);
      setAnomaliesData([]);
      showToast('No anomalies detected', 'success');
    } catch (error) {
      console.error('Error starting anomaly detection:', error);
      showToast('Failed to start anomaly detection', 'error');
      setAnomaliesLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-white border-purple-200 text-gray-800' 
              : 'bg-white border-red-200 text-gray-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${
                toast.type === 'success' ? 'bg-purple-600' : 'bg-red-600'
              }`}></div>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-end items-center mb-3 animate-slide-down">
        <button
          onClick={handleGetInsights}
          disabled={accountFilter === "all"}
          className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          <Brain className="w-5 h-5 animate-pulse" />
          <span className="font-bold relative z-10">Get AI Insights</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-purple-100 dark:border-gray-700 animate-scale-in max-h-[calc(100vh-120px)] overflow-y-auto">
        {accountFilter === 'all' ? (
          <div className="text-center py-12 animate-bounce-in">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">Select Bank Account</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">Choose an account to unlock AI insights</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <div className="px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-purple-600 text-sm font-semibold">💡 Analysis</span>
              </div>
              <div className="px-4 py-2 bg-pink-50 rounded-lg border border-pink-200">
                <span className="text-pink-600 text-sm font-semibold">🎯 Tips</span>
              </div>
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-600 text-sm font-semibold">🚨 Anomalies</span>
              </div>
            </div>
          </div>
        ) : showInsights ? (
          <>
            {loading ? (
              <div className="text-center py-12 animate-pulse-slow">
                <div className="relative inline-block mb-4">
                  <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">AI Processing...</h3>
                <p className="text-gray-600 dark:text-gray-300">Analyzing your financial data</p>
              </div>
            ) : insightsData ? (
              <>
                {/* Tab Buttons */}
                <div className="flex gap-2 mb-4 animate-slide-up">
                  {[
                    { id: "overview", label: "Overview", gradient: "from-blue-500 to-cyan-500" },
                    { id: "anomalies", label: "Anomalies", gradient: "from-red-500 to-orange-500" },
                    { id: "recommendations", label: "Tips", gradient: "from-green-500 to-emerald-500" },
                  ].map((tab, idx) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'anomalies') handleAnomaliesClick();
                        else setActiveSection(tab.id);
                      }}
                      className={`group relative flex-1 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300 overflow-hidden ${
                        activeSection === tab.id
                          ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeSection === "overview" && (
                  <div className="animate-fade-in-up">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">Overview</h2>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{insightsData?.summary?.text || 'No summary available'}</p>
                    </div>
                  </div>
                )}

                {activeSection === "anomalies" && (
                  <div className="animate-fade-in-up">
                    {anomaliesLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-2" />
                        <p className="text-gray-700 dark:text-gray-300 font-semibold">Scanning...</p>
                      </div>
                    ) : !anomaliesLoading && anomaliesData && anomaliesData.length > 0 ? (
                      <div className="space-y-3">
                        {anomaliesData.map((a, i) => (
                          <div key={i} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">ID: {a.transactionId}</h4>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                a.confidence >= 0.8 ? 'bg-red-100 text-red-700' :
                                a.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {Math.round(a.confidence * 100)}% Confidence
                              </span>
                            </div>
                            <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-2">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-500">Merchant:</span>
                                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={a.merchant}>{a.merchant}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Amount:</span>
                                  <p className="font-bold text-red-600">₹{a.amount?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Date:</span>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(a.transactionDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Type:</span>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{a.anomalyType}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 p-2 rounded">
                              <p className="text-xs text-gray-700 dark:text-gray-300">{a.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !anomaliesLoading && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">All Clear!</h3>
                        <p className="text-gray-600 dark:text-gray-300">No suspicious activity</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "recommendations" && (
                  <div className="animate-fade-in-up">

                    {insightsData?.nudges?.length > 0 ? (
                      <div className="space-y-3">
                        {insightsData.nudges.map((r, i) => {
                          const getRecommendationIcon = (type) => {
                            switch(type?.toLowerCase()) {
                              case 'saving': return '💰';
                              case 'budget': return '📊';
                              case 'spending': return '💳';
                              case 'investment': return '📈';
                              default: return '💡';
                            }
                          };
                          
                          const getRecommendationColor = (type) => {
                            switch(type?.toLowerCase()) {
                              case 'saving': return 'bg-green-50 border-green-200 text-green-800';
                              case 'budget': return 'bg-blue-50 border-blue-200 text-blue-800';
                              case 'spending': return 'bg-orange-50 border-orange-200 text-orange-800';
                              case 'investment': return 'bg-purple-50 border-purple-200 text-purple-800';
                              default: return 'bg-gray-50 border-gray-200 text-gray-800';
                            }
                          };
                          
                          return (
                            <div key={i} className={`border rounded-xl p-4 ${getRecommendationColor(r.type)} dark:bg-opacity-20 hover:shadow-lg transition-all`}>
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm mb-1 dark:text-gray-200">{r.type?.charAt(0).toUpperCase() + r.type?.slice(1)}</h4>
                                  <p className="text-xs leading-relaxed dark:text-gray-300">{r.text}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">No Tips Yet</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">AI will generate tips based on your patterns</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Ready for AI?</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">Click above to unlock insights</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;