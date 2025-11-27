import { useEffect, useMemo, useState } from "react";
import apiService from "../services/api";
import "../styles/TransactionsPage.css";

/*
  Robust Transactions page:
  - fetches transactions from backend
  - computes filtered results with useMemo (date & type)
  - defensive parsing for dates/amounts
  - console logs to help debug
*/

const DATE_FILTERS = [
  { key: "10_days", label: "Last 10 Days", days: 10 },
  { key: "1_month", label: "Last 1 Month", days: 30 },
  { key: "6_months", label: "Last 6 Months", days: 182 }, // ~6 months
  { key: "1_year", label: "Last 1 Year", days: 365 },
  { key: "all", label: "All Time", days: null },
];

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "credit", label: "Credit (+)" },
  { key: "debit", label: "Debit (-)" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filters
  const [dateFilter, setDateFilter] = useState("10_days");
  const [typeFilter, setTypeFilter] = useState("all");

  // --- fetch transactions once on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    setError(null);
    try {
      // NOTE: this calls apiService.getTransactions(params) if you added that method,
      // otherwise apiService.get('/api/transactions') will also work depending on your service.
      const data = await apiService.getTransactions?.() ?? await apiService.get("/api/transactions");
      // defensive: ensure array
      const arr = Array.isArray(data) ? data : (data?.transactions ?? []);
      console.log("Fetched transactions:", arr.length, arr.slice(0,5));
      setTransactions(arr);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  // --- compute date cutoff (returns Date or null)
  const computeCutoff = (key) => {
    const f = DATE_FILTERS.find((d) => d.key === key);
    if (!f || !f.days) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - f.days);
    // zero out time so comparison day-based is consistent
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  };

  // --- filtered results (useMemo for stability)
  const filtered = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      console.log("Filtered: no transactions available");
      return [];
    }

    const cutoff = computeCutoff(dateFilter);
    console.log("Applying filters -> date:", dateFilter, "type:", typeFilter, "cutoff:", cutoff);

    const result = transactions.filter((t) => {
      // defensive parsing
      const amount = (t.amount === null || t.amount === undefined) ? 0 : Number(t.amount);
      // parse date in a robust way — accept ISO strings & plain yyyy-mm-dd
      let tDate = null;
      if (t.date) {
        // if backend returns LocalDate (yyyy-mm-dd) this works
        tDate = new Date(t.date);
        if (isNaN(tDate.getTime())) {
          // try Date.parse fallback
          const parsed = Date.parse(String(t.date));
          if (!isNaN(parsed)) tDate = new Date(parsed);
        }
      }

      // DATE FILTER
      if (cutoff) {
        if (!tDate) return false; // no date -> exclude when filtering by date
        // compare day-level by zeroing time on transaction date
        const txDay = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        if (txDay < cutoff) return false;
      }

      // TYPE FILTER
      if (typeFilter === "credit" && !(amount > 0)) return false;
      if (typeFilter === "debit" && !(amount < 0)) return false;

      return true;
    });

    console.log("Filtered result count:", result.length);
    return result;
  }, [transactions, dateFilter, typeFilter]);

  // --- UI handlers
  const onDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };
  const onTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };

  // --- small helper to format amount
  const fmtAmount = (amt) => {
    const n = Number(amt || 0);
    if (isNaN(n)) return amt;
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-1">Transactions</h1>
      <p className="text-gray-600 mb-6">View all your recent transactions</p>

      <div className="transactions-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-gray-500">
              Showing: <span className="font-medium">{DATE_FILTERS.find(d=>d.key===dateFilter)?.label}</span>
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <select value={dateFilter} onChange={onDateFilterChange} className="range-select">
              {DATE_FILTERS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>

            <select value={typeFilter} onChange={onTypeFilterChange} className="range-select">
              {TYPE_FILTERS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {(!loading && filtered.length === 0) ? (
          <div className="py-10 text-center text-gray-500">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full transactions-table">
              <thead>
                <tr className="text-left text-sm text-gray-700">
                  <th className="p-3">Date</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Amount</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(txn => {
                  const amount = Number(txn.amount || 0);
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="p-3">{txn.date}</td>
                      <td className="p-3">{txn.merchant || "-"}</td>
                      <td className="p-3">{txn.notes || "-"}</td>
                      <td className={`p-3 font-semibold ${amount < 0 ? "text-red-600" : "text-green-600"}`}>
                        ₹ {fmtAmount(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
