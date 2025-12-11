import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Upload, Plus } from "lucide-react";
import AccountCropDialog from "../components/AccountCropDialog";
import SelectAccountDialog from "../components/SelectAccountDialog";



export default function ImportPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawImageFile, setRawImageFile] = useState(null);     // original image
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showAccountSelect, setShowAccountSelect] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // Force re-render of file input



  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [pdfPassword, setPdfPassword] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [manualTransaction, setManualTransaction] = useState({
    date: "",
    merchant: "",
    amount: "",
    typeTransaction: "debit",
    categoryId: "",
    notes: "",
    recurring: false,
    anomaly: false,
  });
  const [categories, setCategories] = useState([]);

  // -------------------------------------------
  // LOAD ACCOUNTS
  // -------------------------------------------
  useEffect(() => {
    loadAccounts();
    loadCategories();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await apiService.getAccounts();
      setAccounts(res);
      console.log("Loaded accounts:", res);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      showNotification("Failed to load bank accounts", "error");
    }
  };

  const loadCategories = async () => {
    try {
      const res = await apiService.getCategories();
      setCategories(res);
      console.log("Loaded categories:", res);
    } catch (err) {
      console.error("Failed to load categories:", err);
      showNotification("Failed to load categories", "error");
    }
  };

  // Reset upload form completely
  const resetUploadForm = () => {
    setSelectedFile(null);
    setSelectedAccountId("");
    setRawImageFile(null);
    setShowCropDialog(false);
    setShowAccountSelect(false);
    setFileInputKey(prev => prev + 1); // Force file input to re-render
  };

  // -------------------------------------------
  // NOTIFICATION
  // -------------------------------------------
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification({ message: "", type: "", show: false });
    }, 5000);
  };

  const formatSuccessMessage = (result) => {
  if (result.transactions) {
    return `${result.transactions.length} transactions imported successfully`;
  }

  // existing PDF / CSV logic
  const parts = [];
  if (result.message) parts.push(result.message);
  if (result.transactionsImported !== undefined)
    parts.push(`${result.transactionsImported} transactions imported`);
  if (result.added?.length)
    parts.push(`${result.added.length} added`);
  if (result.skipped?.length)
    parts.push(`${result.skipped.length} skipped`);

  return parts.join(" • ");
};

  // -------------------------------------------
  // FILE PROCESSING
  // -------------------------------------------
  const handleFileUpload = async () => {
  if (!selectedFile) {
    showNotification("Please select a file", "error");
    return;
  }

  const fileType = selectedFile.type;
  const fileName = selectedFile.name.toLowerCase();

  try {
    setLoading(true);
    let result;

    if (fileType.startsWith("image/")) {
      if (!selectedAccountId) {
        showNotification("Please select an account", "error");
        return;
      }

      result = await apiService.processImage(selectedFile, selectedAccountId);

    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      result = await apiService.processPdf(selectedFile, "auto-detected", "");

    } else if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      result = await apiService.processCsv(selectedFile, "auto-detected");

    } else {
      showNotification("Unsupported file type", "error");
      return;
    }

    showNotification(formatSuccessMessage(result), "success");
    // Reset all form state to allow new uploads
    resetUploadForm();

  } catch (err) {
    console.error(err);
    showNotification(err.message || "File processing failed", "error");
  } finally {
    setLoading(false);
  }
};

  const processFileWithAccount = async () => {
    if (!accountNumber.trim()) {
      showNotification("Account number is required", "error");
      return;
    }

    try {
      setLoading(true);
      setShowAccountDialog(false);

      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();
      let result;

      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        result = await apiService.processPdf(selectedFile, accountNumber, pdfPassword);
      } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        result = await apiService.processCsv(selectedFile, accountNumber);
      } else {
        throw new Error("Unsupported file type");
      }

      showNotification(formatSuccessMessage(result), "success");
      
      // Reset all form state
      resetUploadForm();
      setAccountNumber('');
      setPdfPassword('');
    } catch (err) {
      console.error(err);
      showNotification(err.message || "File processing failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------
  // MANUAL TRANSACTION SUBMIT
  // -------------------------------------------
  const handleManualSubmit = async () => {
    if (
      !manualTransaction.date ||
      !manualTransaction.merchant ||
      !manualTransaction.amount ||
      !manualTransaction.categoryId ||
      !selectedAccountId
    ) {
      showNotification("Please fill all required fields", "error");
      return;
    }

    const amount = parseFloat(manualTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }

    try {
      setLoading(true);

      const transactionData = {
        date: manualTransaction.date,
        merchant: manualTransaction.merchant,
        amount: amount,
        typeTransaction: manualTransaction.typeTransaction.toUpperCase(),
        categoryId: parseInt(manualTransaction.categoryId),
        bankAccountId: selectedAccountId,
        notes: manualTransaction.notes || "",
        recurring: manualTransaction.recurring,
        anomaly: manualTransaction.anomaly,
      };

      console.log('Form state before submit:', manualTransaction);
      console.log('Submitting transaction:', transactionData);
      const response = await apiService.addTransaction(transactionData);
      console.log('Transaction response:', response);

      showNotification("Transaction added successfully!", "success");

      setManualTransaction({ 
        date: "", 
        merchant: "", 
        amount: "", 
        typeTransaction: "debit",
        categoryId: "",
        notes: "",
        recurring: false,
        anomaly: false,
      });
      setSelectedAccountId("");
    } catch (err) {
      console.error('Transaction submission error:', err);
      showNotification(err.message || "Failed to add transaction.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------
  // RENDER UI
  // -------------------------------------------
  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div
          className={`p-4 rounded-xl ${
            notification.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {notification.message}
        </div>
      )}



      <div className="bg-white rounded-2xl shadow p-6">
        {/* TABS */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          <button
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
              activeTab === "upload"
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload Files
          </button>

          <button
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
              activeTab === "manual"
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("manual")}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Manual Entry
          </button>
        </div>

        {/* ---------------- UPLOAD TAB ---------------- */}
        {activeTab === "upload" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2">Upload Transaction Files</h2>
              <p className="text-gray-600">Support for PDF bank statements, CSV files, and transaction screenshots</p>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors">
              <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Choose File to Upload</h3>
              <p className="text-gray-600 mb-4">PDF, CSV, JPG, PNG files supported</p>
              {/* Masked preview after crop */}
              <input
  key={fileInputKey}
  type="file"
  accept=".pdf,.csv,.jpg,.jpeg,.png"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      // ✅ image → open crop dialog
      setRawImageFile(file);
      setSelectedFile(null);      // wait for masked version
      setShowCropDialog(true);    // 🔥 THIS opens the crop UI
    } else {
      // ✅ pdf / csv → same behavior as before
      setRawImageFile(null);
      setSelectedFile(file);
    }
  }}
  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-purple-50 file:to-cyan-50 file:text-purple-700 hover:file:from-purple-100 hover:file:to-cyan-100 file:font-bold file:transition-all"
/>

            </div>

            {selectedFile && (
              <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl p-4">
                <p className="font-bold text-purple-800">Selected: {selectedFile.name}</p>
                <p className="text-sm text-purple-600">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <button
              onClick={handleFileUpload}
              disabled={
                loading ||
                !selectedFile ||
                (selectedFile.type.startsWith("image/") && !selectedAccountId)
              }
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing…" : "Process File"}
            </button>
          </div>
        )}

        {/* ---------------- MANUAL ENTRY TAB ---------------- */}
        {activeTab === "manual" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2">Add Transaction Manually</h2>
              <p className="text-gray-600">Enter transaction details manually</p>
            </div>

            {/* Account Dropdown */}
            <div>
              <label className="block text-sm font-bold mb-2">Select Bank Account *</label>
              <select
                className="w-full p-3 border rounded-xl"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">-- Select Account --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} ••••{acc.last4Digits}
                  </option>
                ))}
              </select>
            </div>

            {/* Date + Amount + Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Date *</label>
                <input
                  type="date"
                  value={manualTransaction.date}
                  onChange={(e) =>
                    setManualTransaction({ ...manualTransaction, date: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={manualTransaction.amount}
                    onChange={(e) =>
                      setManualTransaction({ ...manualTransaction, amount: e.target.value })
                    }
                    className="w-full p-3 pl-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Transaction Type *</label>
                <select
                  value={manualTransaction.typeTransaction}
                  onChange={(e) =>
                    setManualTransaction({ ...manualTransaction, typeTransaction: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="debit">💸 Debit (Expense)</option>
                  <option value="credit">💰 Credit (Income)</option>
                </select>
              </div>
            </div>

            {/* Merchant + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Merchant *</label>
                <input
                  type="text"
                  placeholder="e.g., Swiggy, Amazon, Netflix"
                  value={manualTransaction.merchant}
                  onChange={(e) =>
                    setManualTransaction({ ...manualTransaction, merchant: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">Category *</label>
                <select
                  value={manualTransaction.categoryId}
                  onChange={(e) =>
                    setManualTransaction({ ...manualTransaction, categoryId: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-3">Additional Options</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualTransaction.recurring}
                    onChange={(e) =>
                      setManualTransaction({ ...manualTransaction, recurring: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">🔄 Recurring Transaction</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualTransaction.anomaly}
                    onChange={(e) =>
                      setManualTransaction({ ...manualTransaction, anomaly: e.target.checked })
                    }
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">⚠️ Mark as Anomaly</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Notes</label>
              <textarea
                placeholder="Add any additional notes (optional)"
                value={manualTransaction.notes}
                onChange={(e) =>
                  setManualTransaction({ ...manualTransaction, notes: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                rows="3"
              />
            </div>

            {/* Transaction Preview */}
            {(manualTransaction.amount || manualTransaction.merchant) && (
              <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  👁️ Transaction Preview
                </h3>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{manualTransaction.merchant || "Merchant Name"}</p>
                    <p className="text-sm text-gray-600">{manualTransaction.date || "Date"}</p>
                    {manualTransaction.categoryId && (
                      <p className="text-sm text-purple-600">
                        {categories.find(c => c.id == manualTransaction.categoryId)?.name || "Category"}
                      </p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {manualTransaction.recurring && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">🔄 Recurring</span>
                      )}
                      {manualTransaction.anomaly && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">⚠️ Anomaly</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-xl ${
                      manualTransaction.typeTransaction === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {manualTransaction.typeTransaction === 'credit' ? '+' : '-'}₹{manualTransaction.amount || '0.00'}
                    </p>
                    <p className={`text-sm capitalize font-medium ${
                      manualTransaction.typeTransaction === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {manualTransaction.typeTransaction === 'credit' ? '💰 Income' : '💸 Expense'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleManualSubmit}
              disabled={loading || !manualTransaction.date || !manualTransaction.merchant || !manualTransaction.amount || !manualTransaction.categoryId || !selectedAccountId}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding Transaction…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✨ Add Transaction
                </span>
              )}
            </button>
          </div>
        )}
      </div>

{/* Crop dialog overlay (images only) */}
{showCropDialog && rawImageFile && (
  <AccountCropDialog
    imageFile={rawImageFile}
      onConfirm={(croppedFile) => {
  setSelectedFile(croppedFile);
  setShowCropDialog(false);
  setShowAccountSelect(true); // ✅ NEW
}}
    onCancel={() => {
      resetUploadForm();
    }}
  />
)}

{showAccountSelect && (
  <SelectAccountDialog
    onSelect={(accountId) => {
      setSelectedAccountId(accountId);
      setShowAccountSelect(false);
    }}
    onCancel={() => {
      resetUploadForm();
    }}
  />
)}


    </div>
  );
}
  