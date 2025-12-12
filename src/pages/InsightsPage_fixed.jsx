// import React, { useState, useEffect } from 'react'
// import { Brain, TrendingUp, AlertTriangle, Target, DollarSign, Activity, Lightbulb, CheckCircle, AlertCircle, Info } from 'lucide-react'
// import apiService from '../services/api'
// import { useAuth } from '../contexts/AuthContext'
// import DownloadButton from '../components/DownloadButton'

// const InsightsPage = () => {
//   const { user } = useAuth()
//   const [insight, setInsight] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [analyzing, setAnalyzing] = useState(false)
//   const [error, setError] = useState(null)
//   const [activeSection, setActiveSection] = useState('overall')
//   const [parsedData, setParsedData] = useState(null)

//   useEffect(() => {
//     if (user?.userId) {
//       fetchExistingInsights()
//     }
//   }, [user])

//   const fetchExistingInsights = async () => {
//     try {
//       setLoading(true)
//       const data = await apiService.getLatestInsights()
//       setInsight(data)
      
//       if (data?.insight?.aiText) {
//         try {
//           const parsed = JSON.parse(data.insight.aiText)
//           setParsedData(parsed)
//         } catch (parseError) {
//           console.error('Error parsing AI text:', parseError)
//           setParsedData(null)
//         }
//       }
//     } catch (err) {
//       console.error('Error fetching insights:', err)
//       setError('Failed to load insights')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const analyzeInsights = async () => {
//     try {
//       setAnalyzing(true)
//       setError(null)
      
//       await apiService.analyzeFinancialData()
//       await fetchExistingInsights()
//     } catch (err) {
//       console.error('Error analyzing insights:', err)
//       setError('Analysis failed. Please try again.')
//     } finally {
//       setAnalyzing(false)
//     }
//   }

//   const getToneStyle = (tone) => {
//     switch (tone) {
//       case 'positive': return 'bg-green-50 border-green-200 text-green-800'
//       case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
//       case 'neutral': return 'bg-blue-50 border-blue-200 text-blue-800'
//       default: return 'bg-gray-50 border-gray-200 text-gray-800'
//     }
//   }

//   const getSeverityIcon = (severity) => {
//     switch (severity) {
//       case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />
//       case 'medium': return <AlertCircle className="w-5 h-5 text-yellow-600" />
//       case 'low': return <Info className="w-5 h-5 text-blue-600" />
//       default: return <Info className="w-5 h-5 text-gray-600" />
//     }
//   }

//   // Mock data for demonstration
//   const mockData = {
//     overall_health: {
//       summary: "Your spending is well-balanced with good saving habits. Consider optimizing subscription services.",
//       emoji: "💡"
//     },
//     spending_breakdown: [
//       { category: "Food & Dining", amount: 15000, percentage: 35 },
//       { category: "Transportation", amount: 8000, percentage: 20 },
//       { category: "Shopping", amount: 6000, percentage: 15 },
//       { category: "Entertainment", amount: 4000, percentage: 10 }
//     ],
//     recurring_patterns: [
//       { merchant: "Netflix", frequency: "Monthly", amount: 199 },
//       { merchant: "Spotify", frequency: "Monthly", amount: 119 },
//       { merchant: "Swiggy", frequency: "Weekly", amount: 450 }
//     ],
//     anomalies: [
//       { reason: "Unusual high spending", amount: 12000, severity: "medium", category: "Shopping" },
//       { reason: "New merchant detected", amount: 5000, severity: "low", category: "Entertainment" }
//     ],
//     nudges: [
//       { message: "Consider reducing food delivery expenses", type: "savings", tone: "warning" },
//       { message: "Great job staying within budget!", type: "encouragement", tone: "positive" },
//       { message: "Review subscription services", type: "optimization", tone: "neutral" }
//     ]
//   }

//   const displayData = parsedData?.analysis || parsedData || mockData

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-lg font-semibold text-gray-600">Loading insights...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl">
//             <Brain className="w-8 h-8 text-white" />
//           </div>
//           <div>
//             <h1 className="text-3xl font-bold">AI Financial Insights</h1>
//             <p className="text-gray-600">Complete analysis of your spending behavior</p>
//           </div>
//         </div>
//         <div className="flex gap-3">
//           <DownloadButton targetId="insights-content" filename="insights-report" />
//           <button
//             onClick={analyzeInsights}
//             disabled={analyzing}
//             className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
//           >
//             {analyzing ? (
//               <>
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                 Analyzing...
//               </>
//             ) : (
//               <>
//                 <Brain className="w-4 h-4" />
//                 {insight ? 'Re-analyze' : 'Analyze'}
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <p className="text-red-600">Error: {error}</p>
//         </div>
//       )}

//       <div id="insights-content">
//         {analyzing ? (
//           <div className="bg-white rounded-2xl p-12 shadow text-center">
//             <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
//               <Brain className="w-8 h-8 text-white" />
//             </div>
//             <h3 className="text-2xl font-bold mb-4">Analyzing Your Financial Data</h3>
//             <p className="text-gray-600 mb-6">Our AI is processing your transactions...</p>
//             <div className="flex items-center justify-center space-x-2">
//               <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
//               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
//               <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
//             </div>
//           </div>
//         ) : (
//           <>
//             {/* Tab Navigation */}
//             <div className="bg-white rounded-2xl shadow border overflow-hidden">
//               <div className="bg-gray-50 px-1 py-1">
//                 <div className="flex gap-1">
//                   {[
//                     { id: 'overall', label: 'Overview', icon: Brain },
//                     { id: 'categories', label: 'Spending', icon: DollarSign },
//                     { id: 'patterns', label: 'Patterns', icon: Activity },
//                     { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
//                     { id: 'nudges', label: 'Tips', icon: Lightbulb }
//                   ].map((tab) => (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveSection(tab.id)}
//                       className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
//                         activeSection === tab.id
//                           ? 'bg-purple-600 text-white shadow-lg'
//                           : 'text-gray-600 hover:text-gray-800 hover:bg-white'
//                       }`}
//                     >
//                       <div className="flex items-center justify-center gap-2">
//                         <tab.icon className="w-4 h-4" />
//                         <span className="hidden sm:inline">{tab.label}</span>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Tab Content */}
//               <div className="p-6">
//                 {activeSection === 'overall' && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4">
//                       <div className="p-3 bg-purple-100 rounded-xl">
//                         <Brain className="w-6 h-6 text-purple-600" />
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold">Financial Health Overview</h3>
//                         <p className="text-gray-600">AI-powered analysis of your financial status</p>
//                       </div>
//                     </div>
//                     <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
//                       <p className="text-gray-800 leading-relaxed text-lg">
//                         {displayData.overall_health?.summary || "Your financial data has been analyzed successfully."}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {activeSection === 'categories' && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4">
//                       <div className="p-3 bg-green-100 rounded-xl">
//                         <DollarSign className="w-6 h-6 text-green-600" />
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold">Spending Analysis</h3>
//                         <p className="text-gray-600">Breakdown of expenses by category</p>
//                       </div>
//                     </div>
//                     <div className="space-y-3">
//                       {(displayData.spending_breakdown || []).map((category, index) => (
//                         <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
//                           <div className="flex items-center gap-3">
//                             <div className="w-3 h-3 rounded-full bg-green-500"></div>
//                             <span className="font-medium">{category.category || category.name}</span>
//                           </div>
//                           <div className="text-right">
//                             <div className="font-bold text-green-600">
//                               ₹{(category.amount || 0).toLocaleString()}
//                             </div>
//                             <div className="text-sm text-gray-500">{category.percentage || 0}%</div>
//                           </div>
//                         </div>
//                       ))}
//                       {(!displayData.spending_breakdown || displayData.spending_breakdown.length === 0) && (
//                         <div className="text-center py-8 text-gray-500">
//                           No spending data available
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {activeSection === 'patterns' && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4">
//                       <div className="p-3 bg-blue-100 rounded-xl">
//                         <Activity className="w-6 h-6 text-blue-600" />
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold">Recurring Patterns</h3>
//                         <p className="text-gray-600">Identified spending patterns</p>
//                       </div>
//                     </div>
//                     <div className="space-y-3">
//                       {(displayData.recurring_patterns || []).map((pattern, index) => (
//                         <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
//                           <div>
//                             <div className="font-medium">{pattern.merchant}</div>
//                             <div className="text-sm text-gray-500">{pattern.frequency}</div>
//                           </div>
//                           <div className="font-bold">₹{(pattern.amount || 0).toLocaleString()}</div>
//                         </div>
//                       ))}
//                       {(!displayData.recurring_patterns || displayData.recurring_patterns.length === 0) && (
//                         <div className="text-center py-8 text-gray-500">
//                           No patterns identified
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {activeSection === 'anomalies' && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4">
//                       <div className="p-3 bg-yellow-100 rounded-xl">
//                         <AlertTriangle className="w-6 h-6 text-yellow-600" />
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold">Detected Anomalies</h3>
//                         <p className="text-gray-600">Unusual patterns and alerts</p>
//                       </div>
//                     </div>
//                     <div className="space-y-3">
//                       {(displayData.anomalies || []).map((anomaly, index) => (
//                         <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
//                           <div className="flex items-center gap-3">
//                             {getSeverityIcon(anomaly.severity)}
//                             <div>
//                               <div className="font-medium">{anomaly.reason}</div>
//                               <div className="text-sm text-gray-500">
//                                 ₹{(anomaly.amount || 0).toLocaleString()} • {anomaly.category}
//                               </div>
//                             </div>
//                           </div>
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                             anomaly.severity === 'high' ? 'bg-red-100 text-red-700' :
//                             anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                             'bg-blue-100 text-blue-700'
//                           }`}>
//                             {(anomaly.severity || 'low').toUpperCase()}
//                           </span>
//                         </div>
//                       ))}
//                       {(!displayData.anomalies || displayData.anomalies.length === 0) && (
//                         <div className="text-center py-8 text-gray-500">
//                           No anomalies detected
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {activeSection === 'nudges' && (
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-4">
//                       <div className="p-3 bg-indigo-100 rounded-xl">
//                         <Lightbulb className="w-6 h-6 text-indigo-600" />
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold">Smart Recommendations</h3>
//                         <p className="text-gray-600">AI-powered insights to improve finances</p>
//                       </div>
//                     </div>
//                     <div className="space-y-3">
//                       {(displayData.nudges || []).map((nudge, index) => (
//                         <div key={index} className={`p-4 rounded-xl border ${getToneStyle(nudge.tone)}`}>
//                           <div className="flex items-start gap-3">
//                             <CheckCircle className="w-5 h-5 mt-0.5" />
//                             <div>
//                               <div className="font-medium">{nudge.message}</div>
//                               <div className="text-sm opacity-75 capitalize">{nudge.type}</div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                       {(!displayData.nudges || displayData.nudges.length === 0) && (
//                         <div className="text-center py-8 text-gray-500">
//                           No recommendations available
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   )
// }

// export default InsightsPage