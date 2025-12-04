import { useEffect, useMemo, useState } from "react";
import apiService from "../services/api";
import "../styles/TransactionsPage.css";

const DATE_FILTERS = [
  { key: "10_days", label: "Last 10 Days", days: 10 },
  { key: "1_month", label: "Last 1 Month", days: 30 },
  { key: "6_months", label: "Last 6 Months", days: 182 },
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateFilter, setDateFilter] = useState("10_days");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getTransactions();
      console.log("Fetched transactions:", data);

      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  const computeCutoff = (key) => {
    const f = DATE_FILTERS.find((d) => d.key === key);
    if (!f || !f.days) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - f.days);
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  };

  const filtered = useMemo(() => {
    if (!transactions.length) return [];

    const cutoff = computeCutoff(dateFilter);

    return transactions.filter((t) => {
      const amount = Number(t.amount || 0);

      // Better date parsing - handle multiple formats
      let txDate = null;
      if (t.date) {
        // Handle ISO string, date string, or timestamp
        txDate = new Date(t.date);
        // If invalid date, try parsing as YYYY-MM-DD
        if (isNaN(txDate.getTime())) {
          const parts = t.date.split('-');
          if (parts.length === 3) {
            txDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
      }

      // Date filter - only apply if we have a valid cutoff and transaction date
      if (cutoff && txDate && !isNaN(txDate.getTime())) {
        // Set transaction date to start of day for comparison
        const txDateStart = new Date(txDate);
        txDateStart.setHours(0, 0, 0, 0);
        
        if (txDateStart < cutoff) {
          return false;
        }
      }

      // Type filter
      if (typeFilter === "credit" && amount <= 0) return false;
      if (typeFilter === "debit" && amount >= 0) return false;

      return true;
    });
  }, [transactions, dateFilter, typeFilter]);

  const fmtAmount = (amt) =>
    Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-1">Transactions</h1>
      <p className="text-gray-600 mb-6">View all your recent transactions</p>

      <div className="transactions-card p-6">
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-gray-500">
              Showing: <strong>{filtered.length}</strong> transactions from{" "}
              <strong>{DATE_FILTERS.find(d => d.key === dateFilter)?.label}</strong>
              {typeFilter !== 'all' && (
                <span> • <strong>{TYPE_FILTERS.find(t => t.key === typeFilter)?.label}</strong></span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="range-select"
            >
              {DATE_FILTERS.map((x) => (
                <option key={x.key} value={x.key}>{x.label}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="range-select"
            >
              {TYPE_FILTERS.map((x) => (
                <option key={x.key} value={x.key}>{x.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full transactions-table">
              <thead>
                <tr className="text-left text-gray-700">
                  <th className="p-3">Date</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Amount</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((txn) => {
                  const amt = Number(txn.amount);

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="p-3">{txn.date}</td>
                      <td className="p-3">{txn.merchant}</td>
                      <td className="p-3">{txn.notes}</td>
                      <td
                        className={`p-3 ${
                          amt < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        ₹ {fmtAmount(amt)}
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
