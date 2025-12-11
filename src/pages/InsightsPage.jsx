import React, { useState, useEffect } from "react";
import { Brain, ChevronDown, RefreshCw, Sparkles, Clock } from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const InsightsPage = () => {
  const { user } = useAuth();

  const [insights, setInsights] = useState([]);
  const [selectedInsightIndex, setSelectedInsightIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) loadInsights();
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData || []);
      if (accountsData && accountsData.length > 0) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const loadInsights = async () => {
    if (!selectedAccount?.id) {
      setError('Please select a valid account');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading insights for account ID:', selectedAccount.id);
      const response = await apiService.getInsightsByAccount(selectedAccount.id);
      
      if (response?.insights && response.insights.length > 0) {
        const processedInsights = response.insights.map(insight => {
          let insightText = insight.aiText || 'No insights available';
          let emoji = '💡';
          let tone = 'neutral';
          
          // Try to parse JSON if it's a structured response
          try {
            const parsed = JSON.parse(insightText);
            if (parsed.summary?.text) {
              insightText = parsed.summary.text;
              emoji = parsed.summary.emoji || '💡';
              tone = parsed.summary.tone || 'neutral';
              if (parsed.nudges && parsed.nudges.length > 0) {
                insightText += '\n\nKey Recommendations:\n';
                parsed.nudges.forEach((nudge, i) => {
                  insightText += `${i + 1}. ${nudge.text}\n`;
                });
              }
            }
          } catch (e) {
            // If not JSON, use as is
          }
          
          return {
            ...insight,
            processedText: insightText,
            emoji,
            tone
          };
        });
        
        setInsights(processedInsights);
        setSelectedInsightIndex(0);
      } else {
        setInsights([]);
      }
    } catch (err) {
      console.error("Error loading insights:", err);
      setError(err.message);
      setAiInsight('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // Loader
  if (loading)
    return (
      <div className="flex justify-center py-20 text-lg">Analyzing...</div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Financial Insights</h1>
              <p className="text-purple-100">
                Get personalized insights about your spending patterns and financial health
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {/* Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/30 transition"
              >
                {selectedAccount ? `${selectedAccount.bankName} ****${selectedAccount.last4Digits}` : 'Select Account'}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showAccountDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border rounded-xl shadow-lg z-10 min-w-48">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowAccountDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      {account.bankName} ****{account.last4Digits}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              data-generate-insights
              onClick={async () => {
                if (!selectedAccount?.id) {
                  setError('Please select a valid account');
                  return;
                }
                try {
                  setAnalyzing(true);
                  setError(null);
                  setAnalysisProgress(0);
                  
                  // Simulate progress
                  const progressInterval = setInterval(() => {
                    setAnalysisProgress(prev => {
                      if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                      }
                      return prev + 10;
                    });
                  }, 300);
                  
                  await apiService.runSummaryGeneration(selectedAccount.id);
                  
                  clearInterval(progressInterval);
                  setAnalysisProgress(100);
                  
                  setTimeout(() => {
                    loadInsights();
                    setAnalyzing(false);
                    setAnalysisProgress(0);
                  }, 8000);
                } catch (error) {
                  console.error('Analysis failed:', error);
                  setError(error.message);
                  setAnalyzing(false);
                  setAnalysisProgress(0);
                }
              }}
              disabled={analyzing || !selectedAccount?.id}
              className="flex items-center gap-2 bg-white text-purple-600 px-6 py-2 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Insights
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {analyzing && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-purple-100">Analyzing your financial data...</span>
              <span className="text-sm text-purple-100">{analysisProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* AI Insight */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            Your Personalized Financial Insight
          </h3>
          <p className="text-gray-600 mt-1">AI-powered analysis of your spending patterns and recommendations</p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <Clock className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-600 mt-4 font-medium">Loading your insights...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
            </div>
          ) : insights.length > 0 ? (
            <div>
              {/* Insight Navigation */}
              {insights.length > 1 && (
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setSelectedInsightIndex(Math.max(0, selectedInsightIndex - 1))}
                    disabled={selectedInsightIndex === 0}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedInsightIndex + 1} of {insights.length} insights
                  </span>
                  <button
                    onClick={() => setSelectedInsightIndex(Math.min(insights.length - 1, selectedInsightIndex + 1))}
                    disabled={selectedInsightIndex === insights.length - 1}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
                  >
                    Next →
                  </button>
                </div>
              )}
              
              {/* Current Insight */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{insights[selectedInsightIndex]?.emoji}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(insights[selectedInsightIndex]?.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                    {insights[selectedInsightIndex]?.processedText}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Insights Available</h4>
              <p className="text-gray-500 mb-6">Generate AI insights to get personalized financial recommendations</p>
              <button
                onClick={() => {
                  if (selectedAccount?.id) {
                    document.querySelector('[data-generate-insights]').click();
                  }
                }}
                className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition"
              >
                Generate Your First Insight
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
