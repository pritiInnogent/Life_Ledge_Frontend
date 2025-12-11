import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import apiService from "../services/api";
import DownloadButton from "../components/DownloadButton";
import "../styles/TransactionsPage.css";

const MONTH_OPTIONS = [
  { value: "current", label: "Current Month" },
  { value: "last", label: "Last Month" },
  { value: "custom", label: "Custom Month" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Date (Newest)" },
  { value: "date_asc", label: "Date (Oldest)" },
  { value: "amount_desc", label: "Amount (High to Low)" },
  { value: "amount_asc", label: "Amount (Low to High)" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthFilter, setMonthFilter] = useState("current");
  const [sortFilter, setSortFilter] = useState("date_desc");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page when filters change
  useEffect(() => setPage(1), [selectedAccount, monthFilter, sortFilter, customMonth, customYear]);

  // Load accounts on first render
  useEffect(() => {
    loadAccounts();
  }, []);

  // Reload transactions when filters change
  useEffect(() => {
    loadTransactions();
  }, [selectedAccount, monthFilter, sortFilter, customMonth, customYear]);

  async function loadAccounts() {
    try {
      const res = await apiService.getAccounts();
      setAccounts(Array.isArray(res) ? res : []);
      console.log('Loaded accounts:', res);
    } catch (e) {
      console.error("Error loading accounts:", e);
      setAccounts([]);
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);
      setError(null);
      
      // Check if accounts are available
      if (accounts.length === 0) {
        setError('Please add a bank account first to view transactions');
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      // Convert selectedAccount to proper format
      const accountId = selectedAccount !== "all" ? parseInt(selectedAccount) : null;
      const [sortBy, direction] = sortFilter.split("_");
      
      console.log('Loading transactions with:', { selectedAccount, accountId, monthFilter, sortFilter });
      
      let data;
      
      const finalAccountId = selectedAccount === 'all' ? null : selectedAccount;
      console.log('Loading transactions with accountId:', finalAccountId);
      
      if (monthFilter === "current") {
        const now = new Date();
        data = await apiService.getTransactionsByMonth(now.getMonth() + 1, now.getFullYear(), finalAccountId);
      } else if (monthFilter === "last") {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        data = await apiService.getTransactionsByMonth(lastMonth.getMonth() + 1, lastMonth.getFullYear(), finalAccountId);
      } else if (monthFilter === "custom") {
        data = await apiService.getTransactionsByMonth(customMonth, customYear, finalAccountId);
      } else {
        data = await apiService.getSortedTransactions(sortBy, direction, finalAccountId);
      }

      // Apply sorting to month-filtered data on frontend if needed
      if (data && Array.isArray(data)) {
        data.sort((a, b) => {
          if (sortBy === "date") {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return direction === "desc" ? dateB - dateA : dateA - dateB;
          } else if (sortBy === "amount") {
            const amountA = Number(a.amount);
            const amountB = Number(b.amount);
            return direction === "desc" ? amountB - amountA : amountA - amountB;
          }
          return 0;
        });
      }

      setTransactions(Array.isArray(data) ? data : []);
      console.log('Loaded transactions:', Array.isArray(data) ? data.length : 0, 'items');
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions;
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-gray-600">View all your recent transactions</p>
        </div>
        <DownloadButton targetId="transactions-content" filename="transactions-report" />
      </div>

      <div id="transactions-content" className="transactions-card p-6 shadow-lg rounded-2xl bg-white">
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
              onChange={(e) => {
                console.log('Account changed to:', e.target.value);
                setSelectedAccount(e.target.value);
              }}
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
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="filter-dropdown"
            >
              {MONTH_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>

            {monthFilter === "custom" && (
              <>
                <select
                  value={customMonth}
                  onChange={(e) => setCustomMonth(parseInt(e.target.value))}
                  className="filter-dropdown"
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={customYear}
                  onChange={(e) => setCustomYear(parseInt(e.target.value))}
                  className="filter-dropdown w-20"
                  min="2020"
                  max="2030"
                />
              </>
            )}

            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="filter-dropdown"
            >
              {SORT_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>
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

            {/* Pagination */}
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={goPrev}
                disabled={page === 1}
                className={`px-4 py-2 rounded-full border transition-all ${
                  page === 1 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                ← Prev
              </button>

              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        page === pg
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goNext}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-full border transition-all ${
                  page === totalPages
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