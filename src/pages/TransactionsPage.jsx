import { useEffect, useMemo, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import apiService from "../services/api";

const DATE_FILTERS = [
  { key: "10_days", label: "10 Days", days: 10 },
  { key: "1_month", label: "1 Month", days: 30 },
  { key: "3_months", label: "3 Months", days: 90 },
  { key: "6_months", label: "6 Months", days: 182 },
  { key: "1_year", label: "1 Year", days: 365 },
  { key: "all", label: "All Time", days: null },
];

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "credit", label: "Credit (+)" },
  { key: "debit", label: "Debit (-)" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [accountFilter, setAccountFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("10_days");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadTransactions();
    loadAccounts();
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

  async function loadAccounts() {
    try {
      const data = await apiService.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  }

  // Compute cutoff date
  const computeCutoff = (key) => {
    const f = DATE_FILTERS.find((d) => d.key === key);
    if (!f || !f.days) return null;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - f.days);
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  };

  // Filter transactions
  const filtered = useMemo(() => {
    if (!transactions.length) return [];

    const cutoff = computeCutoff(dateFilter);

    return transactions.filter((t) => {
      const amount = Number(t.amount || 0);

      // ---- ACCOUNT FILTER ----
      if (accountFilter !== "all" && t.bankAccountId !== accountFilter) {
        return false;
      }

      // ---- DATE FILTER ----
      if (cutoff) {
        let txDate = null;

        if (t.date) {
          txDate = new Date(t.date);

          // Fix for yyyy-mm-dd strings that sometimes fail
          if (isNaN(txDate.getTime())) {
            const p = t.date.split("-");
            if (p.length === 3) {
              txDate = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
            }
          }
        }

        if (txDate && !isNaN(txDate.getTime())) {
          const startDay = new Date(txDate);
          startDay.setHours(0, 0, 0, 0);
          if (startDay < cutoff) return false;
        }
      }

      // ---- TYPE FILTER (actual fix) ----
      const type = t.typeTransaction?.toUpperCase(); // CREDIT / DEBIT

      if (typeFilter === "credit" && type !== "CREDIT") return false;
      if (typeFilter === "debit" && type !== "DEBIT") return false;

      return true;
    });
  }, [transactions, accountFilter, dateFilter, typeFilter]);

  const fmtAmount = (amt) =>
    Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filtered.length}</span> transactions from{" "}
              <strong>{DATE_FILTERS.find(d => d.key === dateFilter)?.label}</strong>
              {typeFilter !== "all" && (
                <span> • <strong>{TYPE_FILTERS.find(t => t.key === typeFilter)?.label}</strong></span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account</label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} ••••{account.last4Digits}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time Period</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {DATE_FILTERS.map((x) => (
                  <option key={x.key} value={x.key}>{x.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {TYPE_FILTERS.map((x) => (
                  <option key={x.key} value={x.key}>{x.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((txn) => {
              const amt = Number(txn.amount);
              const type = txn.typeTransaction?.toUpperCase();
              const isDebit = type === "DEBIT";

              return (
                <div key={txn.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDebit ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {isDebit ? (
                          <ArrowDownCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{txn.merchant}</div>
                        <div className="text-sm text-gray-500">{txn.notes}</div>
                        <div className="text-xs text-gray-400">{txn.date}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        isDebit ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isDebit ? "-" : "+"}₹{fmtAmount(Math.abs(amt))}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isDebit ? 'Debit' : 'Credit'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
