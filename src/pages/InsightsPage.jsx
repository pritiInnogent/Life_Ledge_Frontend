import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import {
  Brain,
  DollarSign,
  Repeat,
  Target,
  AlertTriangle,
} from "lucide-react";
import '../styles/animations.css';

const InsightsPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [accountFilter, setAccountFilter] = useState('all');
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

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (accountFilter && accountFilter !== 'all') {
      checkExistingInsights();
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

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      setAccounts(data || []);
      if (data?.length > 0) {
        setAccountFilter(data[0].id.toString());
      }
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



  const handleGetInsights = async () => {
    if (accountFilter === 'all') {
      alert('Please select a bank account first');
      return;
    }
    
    try {
      setLoading(true);
      setShowInsights(true);
      
      // Call POST /ai/summary with accountId
      await apiService.startSummaryGeneration(accountFilter);
      
      // Simulate processing time
      setTimeout(() => {
        setLoading(false);
        setAnalysisComplete(true);
      }, 3000);
      
    } catch (error) {
      console.error('Error starting analysis:', error);
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await apiService.getInsightsSummary(accountFilter);
      const insights = parseInsightsData(data);
      setInsightsData(insights);
      setActiveSection('overview');
    } catch (error) {
      console.error('Error fetching summary:', error);
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
    if (!anomaliesData) {
      try {
        setAnomaliesLoading(true);
        await apiService.startAnomalyDetection(accountFilter);
        setTimeout(() => {
          setAnomaliesLoading(false);
          setAnomaliesComplete(true);
        }, 3000);
      } catch (error) {
        console.error('Error starting anomaly detection:', error);
        setAnomaliesLoading(false);
      }
    }
  };

  const fetchAnomaliesData = async () => {
    try {
      const data = await apiService.getAnomaliesData(accountFilter);
      setAnomaliesData(data);
      setAnomaliesComplete(false);
    } catch (error) {
      console.error('Error fetching anomalies data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Filter by Bank Account</label>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="all">Select Bank Account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName} ••••{acc.last4Digits}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGetInsights}
          disabled={accountFilter === "all"}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
        >
          <Brain className="w-4 h-4" />
          Get AI Insights
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        {showInsights ? (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Processing AI Analysis</h3>
                <p className="text-gray-500">Please wait while we analyze your financial data...</p>
              </div>
            ) : analysisComplete && !insightsData ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Analysis Complete!</h3>
                <p className="text-gray-500 mb-6">Your financial insights are ready to view</p>
                <button
                  onClick={fetchSummary}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
                >
                  Fetch Summary
                </button>
              </div>
            ) : insightsData ? (
              <>
                {/* Tab Buttons */}
                <div className="flex gap-2 mb-6">
                  {[
                    { id: "overview", label: "Overview", icon: Brain },
                    { id: "spending", label: "Spending", icon: DollarSign },
                    { id: "recurring", label: "Patterns", icon: Repeat },
                    { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
                    { id: "recommendations", label: "Recommendations", icon: Target },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'spending') handleSpendingClick();
                        else if (tab.id === 'recurring') handleRecurringClick();
                        else if (tab.id === 'anomalies') handleAnomaliesClick();
                        else setActiveSection(tab.id);
                      }}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        activeSection === tab.id
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeSection === "overview" && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Financial Overview</h2>
                    <p className="text-gray-700">{insightsData?.summary?.text || 'No summary available'}</p>
                    <p className="text-gray-600 mt-2">{insightsData?.analysis || 'No analysis available'}</p>
                  </div>
                )}

                {activeSection === "spending" && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Spending Breakdown</h2>
                    {spendingLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Loading categories...</p>
                      </div>
                    ) : spendingData?.length > 0 ? (
                      spendingData.map((item, i) => (
                        <div key={i} className="p-3 border-b flex justify-between">
                          <span className="font-medium">{item.name}</span>
                          <div className="text-right">
                            <div className="font-bold">₹{item.totalAmount?.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{item.transactionCount} transactions</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No spending data available</p>
                    )}
                  </div>
                )}

                {activeSection === "recurring" && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Recurring Patterns</h2>
                    {recurringLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Analyzing recurring patterns...</p>
                      </div>
                    ) : recurringComplete ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Repeat className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Analysis Complete!</h3>
                        <button
                          onClick={fetchRecurringData}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                        >
                          Fetch Patterns
                        </button>
                      </div>
                    ) : recurringData?.length > 0 ? (
                      recurringData.map((p, i) => (
                        <div key={i} className="p-3 border-b flex justify-between">
                          <div>
                            <div className="font-medium">{p.merchant}</div>
                            <div className="text-sm text-gray-500">{p.frequency}</div>
                          </div>
                          <div className="font-bold">₹{p.amount}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No recurring patterns found</p>
                    )}
                  </div>
                )}

                {activeSection === "anomalies" && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Anomalies</h2>
                    {anomaliesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Detecting anomalies...</p>
                      </div>
                    ) : anomaliesComplete ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Analysis Complete!</h3>
                        <button
                          onClick={fetchAnomaliesData}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                        >
                          Get Anomalies
                        </button>
                      </div>
                    ) : anomaliesData?.length > 0 ? (
                      anomaliesData.map((a, i) => (
                        <div key={i} className="p-3 border-b flex justify-between">
                          <div>
                            <div className="font-medium">{a.reason}</div>
                            <div className="text-sm text-gray-600">₹{a.amount?.toLocaleString()} • {a.category}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            a.severity === 'high' ? 'bg-red-100 text-red-700' :
                            a.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {a.severity?.toUpperCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No anomalies detected</p>
                    )}
                  </div>
                )}

                {activeSection === "recommendations" && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Recommendations</h2>
                    {insightsData?.nudges?.length > 0 ? (
                      insightsData.nudges.map((r, i) => (
                        <div key={i} className="p-3 border-b flex justify-between">
                          <div>
                            <div className="font-medium">{r.text}</div>
                            <div className="text-sm text-gray-500">{r.type}</div>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {r.type?.toUpperCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No recommendations available</p>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">AI Insights</h3>
            <p className="text-gray-500">Select a bank account and click "Get AI Insights" to analyze your financial data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;