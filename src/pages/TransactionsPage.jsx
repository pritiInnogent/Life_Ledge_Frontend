import React from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const itemsPerPage = 10;

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
      console.log('Loaded accounts:', data);
      const accountsArray = Array.isArray(data) ? data : [];
      setAccounts(accountsArray);
      
      // Auto-select first account if available and no account is currently selected
      if (accountsArray.length > 0 && accountFilter === "all") {
        console.log('Auto-selecting first account:', accountsArray[0].id);
        setAccountFilter(accountsArray[0].id.toString());
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  }

  async function handleDeleteTransaction(id) {
    try {
      setDeletingId(id);
      await apiService.deleteTransaction(id);
      await loadTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAll() {
    if (transactions.length === 0) {
      setError("Nothing to delete");
      return;
    }
    
    try {
      setDeletingAll(true);
      await apiService.deleteAllTransactions();
      await loadTransactions();
    } catch (err) {
      console.error("Error deleting all transactions:", err);
      setError("Failed to delete all transactions");
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleAIInsights() {
    console.log('handleAIInsights called with accountFilter:', accountFilter, typeof accountFilter);
    console.log('Available accounts:', accounts);
    
    if (accountFilter === "all" || !accountFilter || accountFilter === "undefined") {
      setError("Please select a valid bank account first");
      return;
    }
    
    // Find the selected account to validate it exists
    const selectedAccount = accounts.find(acc => acc.id.toString() === accountFilter.toString());
    if (!selectedAccount) {
      setError("Selected account not found. Please refresh and try again.");
      return;
    }
    
    try {
      setAiLoading(true);
      const accountId = parseInt(accountFilter);
      console.log('Selected account:', selectedAccount);
      console.log('Parsed accountId:', accountId, 'isNaN:', isNaN(accountId));
      
      if (isNaN(accountId) || accountId <= 0) {
        setError("Invalid account ID: " + accountFilter);
        return;
      }
      
      console.log('Calling analyzeFinancialData with accountId:', accountId);
      await apiService.analyzeFinancialData(accountId);
      window.location.href = '/app/insights';
    } catch (err) {
      console.error("Error starting AI analysis:", err);
      setError("Failed to start AI analysis: " + err.message);
    } finally {
      setAiLoading(false);
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

    console.log('Filtering transactions:', { 
      totalTransactions: transactions.length, 
      accountFilter, 
      dateFilter, 
      typeFilter,
      sampleTransaction: transactions[0]
    });

    const cutoff = computeCutoff(dateFilter);

    return transactions.filter((t) => {
      // ---- ACCOUNT FILTER ----
      // Temporarily disabled to show all transactions
      // if (accountFilter !== "all") {
      //   const transactionAccountId = t.accountId || t.account_id || t.bankAccountId || t.bank_account_id;
      //   const selectedAccountId = parseInt(accountFilter);
      //   if (transactionAccountId !== selectedAccountId) {
      //     return false;
      //   }
      // }

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

  // Debug logging
  console.log('Filtered results:', {
    originalCount: transactions.length,
    filteredCount: filtered.length,
    accountFilter,
    accounts: accounts.map(a => ({ id: a.id, name: a.bankName }))
  });

  const fmtAmount = (amt) =>
    Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [accountFilter, dateFilter, typeFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{paginatedTransactions.length}</span> of <span className="font-semibold text-purple-600">{filtered.length}</span> transactions from{" "}
              <strong>{DATE_FILTERS.find(d => d.key === dateFilter)?.label}</strong>
              {typeFilter !== "all" && (
                <span> • <strong>{TYPE_FILTERS.find(t => t.key === typeFilter)?.label}</strong></span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delete All</label>
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[42px]"
              >
                <Trash2 className="w-4 h-4" />
                {deletingAll ? "Deleting..." : "Delete All"}
              </button>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account</label>
              <select
                value={accountFilter}
                onChange={(e) => {
                  console.log('Account dropdown changed:', e.target.value, typeof e.target.value);
                  setAccountFilter(e.target.value);
                }}
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
      <div className="bg-white rounded-2xl shadow overflow-hidden">
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
              <>
                {/* Table Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-gray-700">
                    <div>Date</div>
                    <div>Merchant</div>
                    <div>Type</div>
                    <div className="text-right">Amount</div>
                    <div className="text-right">Action</div>
                  </div>
                </div>
                
                {/* Transaction Rows */}
                <div className="divide-y divide-gray-100">
                  {paginatedTransactions.map((txn) => {
                    const amt = Number(txn.amount);
                    const type = txn.typeTransaction?.toUpperCase();
                    const isDebit = type === "DEBIT";

                    return (
                      <div key={txn.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          {/* Date */}
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(txn.date).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Merchant */}
                          <div>
                            <div className="font-medium text-gray-900">{txn.merchant}</div>
                            <div className="text-sm text-gray-500">{txn.notes || 'No description'}</div>
                          </div>
                          
                          {/* Type */}
                          <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              isDebit 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isDebit ? 'Debit' : 'Credit'}
                            </span>
                          </div>
                          
                          {/* Amount */}
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              isDebit ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {isDebit ? '-' : '+'}₹{fmtAmount(Math.abs(amt))}
                            </div>
                          </div>
                          
                          {/* Delete Button */}
                          <div className="text-right">
                            <button
                              onClick={() => handleDeleteTransaction(txn.id)}
                              disabled={deletingId === txn.id}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete transaction"
                            >
                              {deletingId === txn.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Bootstrap-style Pagination */}
                {filtered.length > itemsPerPage && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <nav aria-label="Page navigation">
                      <ul className="flex items-center justify-center space-x-1">
                        <li>
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                        </li>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <li key={page}>
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium border ${
                                currentPage === page
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        
                        <li>
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
                
                {/* AI Insights Button */}
                <div className="px-6 py-6 border-t border-gray-200 text-center">
                  <h3 className="text-xl font-bold mb-4">Get AI-Powered Insights</h3>
                  <p className="text-gray-600 mb-6">Analyze your spending patterns and get personalized recommendations</p>
                  <button
                    onClick={handleAIInsights}
                    disabled={accountFilter === "all" || !accountFilter || accountFilter === "undefined"}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accountFilter === "all" || !accountFilter || accountFilter === "undefined" ? "Select Account First" : "View AI Insights"}
                  </button>
                </div>
              </>
            )}
          </div>
    </div>
  );
}
