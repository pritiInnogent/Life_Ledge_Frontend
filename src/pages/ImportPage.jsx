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

      <div>
        <h1 className="text-3xl font-bold mb-1">Import</h1>
        <p className="text-gray-600">
          Upload CSV, extract PDF data, or enter transactions manually
        </p>
      </div>

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
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding…" : "Add Transaction"}
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
  