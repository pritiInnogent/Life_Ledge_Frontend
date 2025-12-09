import React, { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // Load accounts first
  // --------------------------
  useEffect(() => {
    if (!user?.userId) return;

    apiService.getBankAccountsLast4()
.then((res) => {
      setAccounts(res);
      if (res.length > 0) setAccountId(res[0].id);
    });
  }, [user]);

  // --------------------------
  // Load analytics after account selected
  // --------------------------
  useEffect(() => {
  if (!accountId) return;

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAnalyticsDashboard(accountId);
      console.log("Dashboard Response =", res);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  load();
}, [accountId]);


  console.log("Dashboard Response = ", data);

  if (!accounts.length)
    return (
      <div className="p-6 text-center text-gray-500">
        No bank accounts found.
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center py-20 text-lg">
        Loading dashboard...
      </div>
    );

  if (!data)
    return (
      <div className="p-6 text-center text-gray-500">
        Unable to load analytics.
      </div>
    );

  const { monthlyTimeline, categories, merchants, recurringVsOneTime, burnRate, yearOverYear } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Insights for your financial health
            </p>
          </div>
        </div>

        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white shadow-sm"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.bankName} • ****{acc.last4Digits}
            </option>
          ))}
        </select>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Spending Timeline">
          <LineChart data={monthlyTimeline} />
        </Card>

        <Card title="Burn Rate Projection">
          <BurnRateChart burnRate={burnRate} />
        </Card>

        <Card title="Top Categories">
          <DonutChart categories={categories} />
        </Card>

        <Card title="Top Merchants">
          <HorizontalBarChart merchants={merchants} />
        </Card>

        <Card title="Recurring vs One-Time">
  <StackedBarChart
    data={[
      { label: "Recurring", amount: recurringVsOneTime.recurringTotal, color: "#10B981" },
      { label: "One-Time", amount: recurringVsOneTime.oneTimeTotal, color: "#F43F5E" }
    ]}
  />
</Card>


        <Card title="Avg Cost Per Category">
          <CategoryAverageChart categories={categories} />
        </Card>
      </div>

      <Card title="Year-over-Year Comparison">
        <YearOverYearChart data={yearOverYear} />
      </Card>
    </div>
  );
};

// ------------------------------
// Card Wrapper
// ------------------------------
const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

// ------------------------------
// Charts (same as your old ones)
// ------------------------------
const LineChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="h-48">
      <svg viewBox="0 0 400 150" className="w-full h-full">
        {/* Line Path */}
        <path
          d={`M ${data
            .map(
              (d, i) =>
                `${(i / (data.length - 1)) * 400} ${
                  150 - (d.amount / max) * 120
                }`
            )
            .join(" L ")}`}
          stroke="#3B82F6"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

const DonutChart = ({ categories }) => {
  const total = categories.reduce((a, b) => a + b.amount, 0);
  const size = 160;
  const radius = size / 2 - 20;

  let offset = 0;

  return (
    <svg width={size} height={size}>
      {categories.map((cat, i) => {
        const pct = cat.amount / total;
        const circumference = 2 * Math.PI * radius;
        const dash = circumference * pct;

        const circle = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={cat.color}
            strokeWidth="20"
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={-offset}
          />
        );

        offset += dash;
        return circle;
      })}
    </svg>
  );
};

const HorizontalBarChart = ({ merchants }) => {
  const max = Math.max(...merchants.map((m) => m.amount), 1);
  return (
    <div className="space-y-3">
      {merchants.map((m, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-20">{m.name}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="h-4 bg-blue-500 rounded-full"
              style={{ width: `${(m.amount / max) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StackedBarChart = ({ data }) => {
  const total = data.reduce((a, b) => a + b.amount, 0);
  return (
    <div className="flex h-8 rounded overflow-hidden">
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            width: `${(d.amount / total) * 100}%`,
            background: d.color,
          }}
          className="flex justify-center items-center text-white text-xs"
        >
          {Math.round((d.amount / total) * 100)}%
        </div>
      ))}
    </div>
  );
};

const CategoryAverageChart = ({ categories }) => {
  const averages = categories.map((c) => ({
    ...c,
    avg: c.amount / c.count,
  }));
  const max = Math.max(...averages.map((a) => a.avg), 1);

  return (
    <div className="space-y-2">
      {averages.map((a, i) => (
        <div key={i} className="flex justify-between items-center">
          <span>{a.name}</span>
          <div className="w-32 bg-gray-200 rounded h-2">
            <div
              className="h-2 rounded"
              style={{
                width: `${(a.avg / max) * 100}%`,
                backgroundColor: a.color,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const BurnRateChart = ({ burnRate }) => (
  <div className="text-center space-y-3">
    <div className="text-xl font-bold">₹{Math.round(burnRate.daily)}</div>
    <div className="text-gray-500">Daily Burn</div>
    <div className="text-xl font-bold text-green-600">
      ₹{Math.round(burnRate.projected)}
    </div>
    <div className="text-gray-500">Projected Month End</div>
  </div>
);

const YearOverYearChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="h-52">
      <svg viewBox="0 0 800 200" className="w-full h-full">
        {data.map((d, i) => (
          <rect
            key={i}
            x={(i / data.length) * 800 + 10}
            width={800 / data.length - 20}
            y={200 - (d.amount / max) * 180}
            height={(d.amount / max) * 180}
            fill="#3B82F6"
          />
        ))}
      </svg>
    </div>
  );
};

export default AnalyticsPage;
