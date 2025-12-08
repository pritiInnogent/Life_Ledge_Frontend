import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Upload, Plus } from "lucide-react";

export default function ImportPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
  const [backendResponse, setBackendResponse] = useState(null);
  const [manualTransaction, setManualTransaction] = useState({
    date: "",
    merchant: "",
    amount: "",
    notes: "",
  });

  // -------------------------------------------
  // LOAD ACCOUNTS
  // -------------------------------------------
  useEffect(() => {
    loadAccounts();
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

  // -------------------------------------------
  // NOTIFICATION
  // -------------------------------------------
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification({ message: "", type: "", show: false });
    }, 5000);
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

      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        result = await apiService.processPdf(selectedFile, "auto-detected", "");
      } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        result = await apiService.processCsv(selectedFile, "auto-detected");
      } else if (fileType.startsWith('image/')) {
        showNotification("Image processing coming soon!", "info");
        setSelectedFile(null);
        return;
      } else {
        showNotification("Unsupported file type. Please upload PDF, CSV, or image files.", "error");
        return;
      }

      if (result) {
        setBackendResponse(result);
      }
      setSelectedFile(null);
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

      showNotification(
        `File processed successfully! ${result.transactionsExtracted || result.saved || 0} transactions extracted.`,
        "success"
      );

      setSelectedFile(null);
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
      !selectedAccountId
    ) {
      showNotification("Please fill all required fields", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await apiService.addTransaction({
        ...manualTransaction,
        amount: parseFloat(manualTransaction.amount),
        bankAccountId: selectedAccountId,
      });

      showNotification("Transaction added successfully!", "success");

      setManualTransaction({ date: "", merchant: "", amount: "", notes: "" });
      setSelectedAccountId("");
    } catch (err) {
      console.error(err);
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
                ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/40"
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
                ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/40"
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
              <p className="text-gray-600">Support for PDF bank statements only</p>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors">
              <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Choose File to Upload</h3>
              <p className="text-gray-600 mb-4">PDF files supported</p>
              
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-purple-100 file:to-purple-200 file:text-purple-700 hover:file:from-purple-200 hover:file:to-purple-300 file:font-bold file:transition-all file:shadow-lg file:shadow-purple-500/30"
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
              disabled={loading || !selectedFile}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing…" : "Process File"}
            </button>

            {/* Backend Response Display */}
            {backendResponse && (
              <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Processing Results
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {backendResponse?.added?.length || backendResponse?.transactionsImported || 0}
                    </div>
                    <div className="text-sm text-gray-600">Transactions Added</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {backendResponse?.skipped?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Transactions Skipped</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {backendResponse?.newAccount === false ? 'Existing' : 'New'}
                    </div>
                    <div className="text-sm text-gray-600">Account Status</div>
                  </div>
                </div>
                
                {backendResponse?.message && (
                  <div className="bg-white rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">{String(backendResponse.message)}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setBackendResponse(null)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear Results
                  </button>
                  <button
                    onClick={() => console.log('Full Response:', backendResponse)}
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    View Full Response (Console)
                  </button>
                </div>
              </div>
            )}
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

            {/* Date + Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Date *</label>
                <input
                  type="date"
                  value={manualTransaction.date}
                  onChange={(e) =>
                    setManualTransaction({ ...manualTransaction, date: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualTransaction.amount}
                  onChange={(e) =>
                    setManualTransaction({ ...manualTransaction, amount: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl"
                />
              </div>
            </div>

            {/* Merchant */}
            <div>
              <label className="block text-sm font-bold mb-2">Merchant *</label>
              <input
                type="text"
                value={manualTransaction.merchant}
                onChange={(e) =>
                  setManualTransaction({ ...manualTransaction, merchant: e.target.value })
                }
                className="w-full p-3 border rounded-xl"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold mb-2">Notes</label>
              <textarea
                value={manualTransaction.notes}
                onChange={(e) =>
                  setManualTransaction({ ...manualTransaction, notes: e.target.value })
                }
                className="w-full p-3 border rounded-xl"
                rows="3"
              />
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding…" : "Add Transaction"}
            </button>
          </div>
        )}
      </div>


    </div>
  );
}
