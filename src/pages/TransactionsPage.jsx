import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
  { key: "CREDIT", label: "Credit (+)" },
  { key: "DEBIT", label: "Debit (-)" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [dateFilter, setDateFilter] = useState("10_days");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");

  useEffect(() => {
    loadTransactions();
    loadAccounts();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [selectedAccount]);

  async function loadAccounts() {
    try {
      const accountData = await apiService.getAccounts();
      setAccounts(accountData);
    } catch (err) {
      console.error("Error loading accounts:", err);
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);
      setError(null);

      const bankAccountId = selectedAccount !== "all" ? selectedAccount : null;
      const data = await apiService.getTransactions(bankAccountId);
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
      // Better date parsing - handle multiple formats
      let txDate = null;
      if (t.date) {
        txDate = new Date(t.date);
        if (isNaN(txDate.getTime())) {
          const parts = t.date.split('-');
          if (parts.length === 3) {
            txDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
      }

      // Date filter
      if (cutoff && txDate && !isNaN(txDate.getTime())) {
        const txDateStart = new Date(txDate);
        txDateStart.setHours(0, 0, 0, 0);
        if (txDateStart < cutoff) return false;
      }

      // Type filter - use backend enum values
      if (typeFilter === "CREDIT" && t.typeTransaction !== "CREDIT") return false;
      if (typeFilter === "DEBIT" && t.typeTransaction !== "DEBIT") return false;

      return true;
    });
  }, [transactions, dateFilter, typeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filtered.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const fmtAmount = (amt) =>
    Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const getTransactionIcon = (type) => {
    return type === "CREDIT" ? 
      <ArrowUpCircle className="w-5 h-5 text-green-600" /> : 
      <ArrowDownCircle className="w-5 h-5 text-red-600" />;
  };

  const getAmountColor = (type) => {
    return type === "CREDIT" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Transactions</h1>
        <p className="text-gray-600">View and manage all your financial transactions</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing <span className="font-medium text-blue-600">{paginatedTransactions.length}</span> of{" "}
                <span className="font-medium text-blue-600">{filtered.length}</span> transactions
                {typeFilter !== 'all' && (
                  <span> • <span className="font-medium">{TYPE_FILTERS.find(t => t.key === typeFilter)?.label}</span></span>
                )}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <select
                value={selectedAccount}
                onChange={(e) => { setSelectedAccount(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} - ****{account.last4Digits}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DATE_FILTERS.map((x) => (
                  <option key={x.key} value={x.key}>{x.label}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TYPE_FILTERS.map((x) => (
                  <option key={x.key} value={x.key}>{x.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading transactions...</span>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
            </div>
          )}

          {!loading && filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-3 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-4 px-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-3 font-semibold text-gray-700">Merchant</th>
                      <th className="text-left py-4 px-3 font-semibold text-gray-700">Notes</th>
                      <th className="text-right py-4 px-3 font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(txn.typeTransaction)}
                            <span className={`text-sm font-medium ${
                              txn.typeTransaction === "CREDIT" ? "text-green-600" : "text-red-600"
                            }`}>
                              {txn.typeTransaction}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-gray-700">
                          {new Date(txn.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-4 px-3">
                          <div className="font-medium text-gray-800">{txn.merchant}</div>
                          {txn.reference && (
                            <div className="text-xs text-gray-500 mt-1">Ref: {txn.reference}</div>
                          )}
                        </td>
                        <td className="py-4 px-3 text-gray-600 max-w-xs truncate">
                          {txn.notes || '-'}
                        </td>
                        <td className={`py-4 px-3 text-right font-semibold ${
                          getAmountColor(txn.typeTransaction)
                        }`}>
                          ₹ {fmtAmount(txn.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
