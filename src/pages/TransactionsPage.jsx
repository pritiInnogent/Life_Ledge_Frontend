import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import apiService from "../services/api";

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
  const [selectedAccount, setSelectedAccount] = useState(() => {
    return sessionStorage.getItem('selectedAccount') || 'all'
  });
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

  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Listen for global account changes
  useEffect(() => {
    const handleAccountChange = (event) => {
      setSelectedAccount(event.detail)
    }
    
    window.addEventListener('accountChanged', handleAccountChange)
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange)
    }
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedAccount, monthFilter, sortFilter, customMonth, customYear]);

  // Load initial accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  // Reload transactions on filter change
  useEffect(() => {
    loadTransactions();
  }, [selectedAccount, monthFilter, sortFilter, customMonth, customYear]);

  async function loadAccounts() {
    try {
      const res = await apiService.getAccounts();
      setAccounts(Array.isArray(res) ? res : []);
    } catch (err) {
      setAccounts([]);
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);
      setError(null);

      const finalAccountId = selectedAccount === "all" ? null : selectedAccount;
      const [sortBy, direction] = sortFilter.split("_");

      let data;

      if (monthFilter === "current") {
        const now = new Date();
        data = await apiService.getTransactionsByMonth(
          now.getMonth() + 1,
          now.getFullYear(),
          finalAccountId
        );
      } else if (monthFilter === "last") {
        const last = new Date();
        last.setMonth(last.getMonth() - 1);
        data = await apiService.getTransactionsByMonth(
          last.getMonth() + 1,
          last.getFullYear(),
          finalAccountId
        );
      } else if (monthFilter === "custom") {
        data = await apiService.getTransactionsByMonth(
          customMonth,
          customYear,
          finalAccountId
        );
      } else {
        data = await apiService.getSortedTransactions(
          sortBy,
          direction,
          finalAccountId
        );
      }

      if (Array.isArray(data)) {
        data.sort((a, b) => {
          if (sortBy === "date") {
            return direction === "desc"
              ? new Date(b.date) - new Date(a.date)
              : new Date(a.date) - new Date(b.date);
          }
          if (sortBy === "amount") {
            return direction === "desc"
              ? Number(b.amount) - Number(a.amount)
              : Number(a.amount) - Number(b.amount);
          }
          return 0;
        });
      }

      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const fmtAmount = (amt) =>
    Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const confirmDeleteTransaction = async () => {
    try {
      setDeleting(showDeleteConfirm);
      await apiService.deleteTransaction(showDeleteConfirm);
      await loadTransactions();
      showToast("Transaction deleted successfully");
    } catch {
      showToast("Failed to delete transaction", "error");
    } finally {
      setDeleting(null);
      setShowDeleteConfirm(null);
    }
  };

  const confirmDeleteAllTransactions = async () => {
    try {
      setDeletingAll(true);
      await apiService.deleteAllTransactions();
      await loadTransactions();
      showToast("All transactions deleted");
    } catch {
      showToast("Failed to delete all transactions", "error");
    } finally {
      setDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="p-6">


      {/* MAIN CARD */}
      <div
        id="transactions-content"
        className="transactions-card p-6 shadow-lg rounded-2xl bg-white dark:bg-gray-800"
      >
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold dark:text-gray-100">Transaction History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Showing <strong>{filtered.length}</strong> transactions
            </p>
          </div>

          <div className="flex gap-3">
            {filtered.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={deletingAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deletingAll ? "Deleting..." : "Delete All"}
              </button>
            )}



            {/* Month Filter */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {MONTH_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>

            {/* Custom Month Controls */}
            {monthFilter === "custom" && (
              <>
                <select
                  value={customMonth}
                  onChange={(e) => setCustomMonth(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={customYear}
                  onChange={(e) => setCustomYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-200 w-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  min="2020"
                  max="2030"
                />
              </>
            )}

            {/* Sort Filter */}
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {SORT_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && <p className="text-center">Loading...</p>}

        {/* Error messages */}
        {error && (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">{error}</p>
        )}

        {/* No transactions */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            {selectedAccount === 'all' ? (
              accounts.length > 0 ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">
                    Select a bank account
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Please select a bank account from the filter above to view transactions
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">
                    No transactions found
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Add bank statements or manual entries to view transactions
                  </p>
                  <button
                    onClick={() => window.location.href = '/app/import'}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    Go to Import
                  </button>
                </div>
              )
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">
                  No transactions found
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  No transactions available for the selected account
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transaction Table */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full transactions-table">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left font-semibold dark:text-gray-200">Date</th>
                    <th className="p-3 text-left font-semibold dark:text-gray-200">Merchant</th>
                    <th className="p-3 text-left font-semibold dark:text-gray-200">Notes</th>
                    <th className="p-3 text-center font-semibold dark:text-gray-200">Type</th>
                    <th className="p-3 text-right font-semibold dark:text-gray-200">Amount</th>
                    <th className="p-3 text-center font-semibold dark:text-gray-200">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pageData.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 dark:text-gray-300">{txn.date}</td>
                      <td className="p-3 font-medium dark:text-gray-200">{txn.merchant}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{txn.notes}</td>

                      <td className="p-3 text-center">
                        {txn.typeTransaction?.toLowerCase() === "credit" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            Credit
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            Debit
                          </span>
                        )}
                      </td>

                      <td
                        className={`p-3 text-right font-semibold ${
                          txn.typeTransaction?.toLowerCase() === "debit"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        ₹ {fmtAmount(txn.amount)}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setShowDeleteConfirm(txn.id)}
                          disabled={deleting === txn.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-full border dark:border-gray-600 ${
                  page === 1
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                ← Prev
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pg) => (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        page === pg
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-white dark:bg-gray-800 border dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pg}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-full border dark:border-gray-600 ${
                  page === totalPages
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg border bg-white ${
            toast.type === "success" 
              ? "border-l-4 border-l-purple-600" 
              : "border-l-4 border-l-red-600"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${
                toast.type === "success" ? "bg-purple-600" : "bg-red-600"
              }`}></div>
              <span className="text-sm font-medium text-gray-800">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Delete Transaction
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteTransaction}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Delete All Transactions
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <strong>ALL transactions</strong>? This action is permanent.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteAllTransactions}
                disabled={deletingAll}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAll ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
