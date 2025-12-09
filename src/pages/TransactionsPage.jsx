import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateFilter, setDateFilter] = useState("10_days");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  // -----------------------
  // Pagination State
  // -----------------------
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // reset page when filters change
  useEffect(() => setPage(1), [selectedAccount, dateFilter, typeFilter]);

  // Load accounts on first render
  useEffect(() => {
    loadAccounts();
  }, []);

  // Reload transactions when account changes
  useEffect(() => {
    loadTransactions();
  }, [selectedAccount]);

  async function loadAccounts() {
    try {
      const res = await apiService.getBankAccountsLast4();
      setAccounts(res);
    } catch (e) {
      console.error("Error loading accounts:", e);
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);

      const data = await apiService.getTransactions(
        selectedAccount !== "all" ? selectedAccount : null
      );

      setTransactions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
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

  // FILTER transactions
  const filtered = useMemo(() => {
    if (!transactions.length) return [];

    let list = [...transactions];
    const cutoff = computeCutoff(dateFilter);

    return list.filter((t) => {
      const txDate = t.date ? new Date(t.date) : null;
      if (cutoff && txDate && txDate < cutoff) return false;

      const type = t.typeTransaction?.toLowerCase();
      if (typeFilter === "credit" && type !== "credit") return false;
      if (typeFilter === "debit" && type !== "debit") return false;

      return true;
    });
  }, [transactions, dateFilter, typeFilter]);

  // -----------------------
  // PAGINATION LOGIC
  // -----------------------
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setPage((p) => Math.max(p - 1, 1));

  const fmtAmount = (amt) =>
    Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      setDeleting(transactionId);
      await apiService.deleteTransaction(transactionId);
      await loadTransactions();
    } catch (error) {
      alert("Failed to delete transaction");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (!confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) return;
    try {
      setDeletingAll(true);
      await apiService.deleteAllTransactions();
      await loadTransactions();
    } catch (error) {
      alert("Failed to delete all transactions");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Transactions</h1>
      <p className="text-gray-600 mb-6">View all your recent transactions</p>

      <div className="transactions-card p-6 shadow-lg rounded-2xl bg-white">
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing <strong>{filtered.length}</strong> transactions
            </p>
          </div>

          <div className="flex gap-3">
            {filtered.length > 0 && (
              <button
                onClick={handleDeleteAllTransactions}
                disabled={deletingAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deletingAll ? "Deleting..." : "Delete All"}
              </button>
            )}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="filter-dropdown"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} ••••{acc.last4Digits}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-dropdown"
            >
              {DATE_FILTERS.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-dropdown"
            >
              {TYPE_FILTERS.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No transactions found.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full transactions-table">
                <thead className="bg-gray-100">
                  <tr className="text-left text-gray-700">
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Merchant</th>
                    <th className="p-3 font-semibold">Notes</th>
                    <th className="p-3 font-semibold text-center">Type</th>
                    <th className="p-3 font-semibold text-right">Amount</th>
                    <th className="p-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pageData.map((txn) => {
                    const type = txn.typeTransaction?.toLowerCase();
                    const amt = Number(txn.amount);

                    return (
                      <tr key={txn.id} className="hover:bg-gray-50 transition">
                        <td className="p-3">{txn.date}</td>
                        <td className="p-3 font-medium">{txn.merchant}</td>
                        <td className="p-3 text-gray-600">{txn.notes}</td>

                        <td className="p-3 text-center">
                          {type === "credit" ? (
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                              Credit
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                              Debit
                            </span>
                          )}
                        </td>

                        <td
                          className={`p-3 text-right font-semibold ${
                            type === "debit" ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          ₹ {fmtAmount(amt)}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(txn.id)}
                            disabled={deleting === txn.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---------------- Pagination UI ---------------- */}
            {/* ---------------- Beautiful Pagination UI ---------------- */}
<div className="flex justify-center items-center mt-6 gap-2">

  {/* Prev Button */}
  <button
    onClick={goPrev}
    disabled={page === 1}
    className={`px-4 py-2 rounded-full border transition-all
      ${page === 1 
        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
        : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
      }`}
  >
    ← Prev
  </button>

  {/* Page Number Buttons */}
  <div className="flex gap-2">
    {[...Array(totalPages)].map((_, i) => {
      const pg = i + 1;
      return (
        <button
          key={pg}
          onClick={() => setPage(pg)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
            ${
              page === pg
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          {pg}
        </button>
      );
    })}
  </div>

  {/* Next Button */}
  <button
    onClick={goNext}
    disabled={page === totalPages}
    className={`px-4 py-2 rounded-full border transition-all
      ${page === totalPages
        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
        : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
      }`}
  >
    Next →
  </button>
</div>

          </>
        )}
      </div>
    </div>
  );
}
