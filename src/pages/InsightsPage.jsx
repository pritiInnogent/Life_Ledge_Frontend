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
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (user?.userId) loadInsights();
  }, [user]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get insights from backend
      try {
        await apiService.analyzeFinancialData();
        const response = await apiService.getLatestInsights();
        
        if (response?.insight?.aiText) {
          const raw = JSON.parse(response.insight.aiText);
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
          setData(mapped);
          return;
        }
      } catch (backendError) {
        console.log("Backend unavailable, using mock insights:", backendError.message);
      }

      // Fallback to mock data
      const mockData = {
        overall_health: {
          summary: "Your financial health looks good with some areas for improvement",
          emoji: "📊",
          analysis: "Based on your spending patterns, you maintain good control over most categories but could optimize entertainment and dining expenses."
        },
        spending_breakdown: [
          { category: "Food & Dining", amount: 12500 },
          { category: "Transportation", amount: 8200 },
          { category: "Shopping", amount: 15600 },
          { category: "Entertainment", amount: 4300 },
          { category: "Utilities", amount: 6800 }
        ],
        recurring_patterns: [
          { merchant: "Netflix", frequency: "Monthly", amount: 199 },
          { merchant: "Spotify", frequency: "Monthly", amount: 119 },
          { merchant: "BSES", frequency: "Monthly", amount: 850 }
        ],
        anomalies: [
          { reason: "Unusual high spending", amount: 5000, category: "Shopping", severity: "medium" },
          { reason: "Weekend splurge detected", amount: 2500, category: "Entertainment", severity: "low" }
        ],
        nudges: [
          { message: "Consider reducing dining out expenses by 20% this month", tone: "warning" },
          { message: "Great job staying within your transportation budget!", tone: "positive" },
          { message: "Your utility bills are consistent and well-managed", tone: "neutral" }
        ]
      };
      
      setData(mockData);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">AI Financial Insights</h1>
            <p className="text-gray-600">
              Complete analysis of your spending behavior and patterns
            </p>
          </div>
        </div>

        <button
          onClick={loadInsights}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-2 rounded-xl shadow hover:bg-purple-700 transition"
        >
          Re-analyze
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* No Data */}
      {!data && (
        <div className="text-center py-10 text-gray-500">
          No insights available.
        </div>
      )}

      {/* Data Available */}
      {data && (
        <>
          {/* Overall Financial Health */}
          <div
            className="rounded-2xl bg-blue-50 border-2 border-blue-200 p-6 cursor-pointer"
            onClick={() =>
              setActiveSection(activeSection === "overall" ? null : "overall")
            }
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{data.overall_health.emoji}</div>
              <div>
                <h3 className="text-xl font-bold">Overall Financial Health</h3>
                <p className="text-blue-900">{data.overall_health.summary}</p>
              </div>
            </div>

            {activeSection === "overall" && (
              <div className="mt-4 bg-white p-4 rounded-xl border">
                {data.overall_health.analysis || "No detailed summary"}
              </div>
            )}
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spending Breakdown */}
            <SectionCard
              title="Spending Breakdown"
              icon={<DollarSign className="w-6 h-6 text-purple-600" />}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              id="categories"
              items={data.spending_breakdown}
              emptyMessage="No category data available"
              renderItem={(item) => (
                <div className="flex justify-between">
                  <div>{item.category || item.name}</div>
                  <div>₹{item.amount || item.value}</div>
                </div>
              )}
            />

            {/* Recurring */}
            <SectionCard
              title="Recurring Patterns"
              icon={<Repeat className="w-6 h-6 text-blue-600" />}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              id="recurring"
              items={data.recurring_patterns}
              emptyMessage="No recurring patterns"
              renderItem={(item) => (
                <div>
                  <div className="font-bold">{item.merchant}</div>
                  <div className="text-sm text-gray-500">{item.frequency}</div>
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anomalies */}
            <SectionCard
              title="Detected Anomalies"
              icon={<Eye className="w-6 h-6 text-red-600" />}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              id="anomalies"
              items={data.anomalies}
              emptyMessage="No anomalies found"
              renderItem={(item) => (
                <div className="flex gap-2">
                  {getSeverityIcon(item.severity)}
                  <div>
                    <div className="font-semibold">{item.reason}</div>
                    <div className="text-sm text-gray-500">
                      ₹{item.amount} — {item.category}
                    </div>
                  </div>
                </div>
              )}
            />

            {/* Nudges */}
            <SectionCard
              title="Smart Nudges"
              icon={<Target className="w-6 h-6 text-green-600" />}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              id="nudges"
              items={data.nudges}
              emptyMessage="No nudges"
              renderItem={(item) => (
                <div className={`${getToneStyle(item.tone)} p-2 rounded-lg`}>
                  <div className="flex gap-2 items-start">
                    {getToneIcon(item.tone)}
                    <div>{item.message}</div>
                  </div>
                </div>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsPage;

/* ---------------------------------------------
   Reusable Section Component
--------------------------------------------- */
const SectionCard = ({
  title,
  icon,
  activeSection,
  setActiveSection,
  id,
  items,
  emptyMessage,
  renderItem,
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg">
    <div
      onClick={() => setActiveSection(activeSection === id ? null : id)}
      className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
    >
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <span>{activeSection === id ? "▼" : "▶"}</span>
    </div>

    {activeSection === id && (
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <div className="text-gray-500 text-center py-4">{emptyMessage}</div>
        ) : (
          items.map((item, i) => (
            <div key={i} className="border p-3 rounded-xl">
              {renderItem(item)}
            </div>
          ))
        )}
      </div>
    )}
  </div>
);
