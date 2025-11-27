import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/ImportPage.css";

export default function ImportPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("pdf");
  const [pdfFile, setPdfFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manual entry fields
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [manualTransaction, setManualTransaction] = useState({
    date: "",
    merchant: "",
    amount: "",
    notes: "",
  });

  // --------------------------
  // LOAD BANK ACCOUNTS
  // --------------------------
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await apiService.getAccounts(); // GET /api/accounts
      setAccounts(res);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  };

  // --------------------------
  // PROCESS PDF (Single API)
  // --------------------------
  const handleExtractPdf = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file.");
      return;
    }

    let accountNumber = prompt("Enter your bank account number:");
    if (!accountNumber) {
      alert("Account number is required");
      return;
    }

    let password = prompt("Enter PDF password (leave blank if none):") || "";

    try {
      setLoading(true);

      const result = await apiService.processPdf(
        pdfFile,
        accountNumber,
        password
      );

      alert("PDF processed successfully!");
      console.log("PDF Result:", result);

    } catch (err) {
      console.error(err);
      alert(err.message || "Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // CSV Upload
  // --------------------------
  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await apiService.post(
        "/transactions/import/csv",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("CSV uploaded successfully!");
      console.log("CSV Response:", response);

    } catch (err) {
      console.error(err);
      alert(err.message || "CSV upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Manual Transaction Submit
  // --------------------------
  const handleManualSubmit = async () => {
    if (
      !manualTransaction.date ||
      !manualTransaction.merchant ||
      !manualTransaction.amount ||
      !selectedAccountId
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await apiService.post("/transactions", {
        ...manualTransaction,
        amount: parseFloat(manualTransaction.amount),
        bankAccountId: selectedAccountId,
      });

      alert("Transaction added successfully!");
      console.log("Manual Transaction Response:", response);

      setManualTransaction({
        date: "",
        merchant: "",
        amount: "",
        notes: "",
      });

    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add transaction.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // UI RENDER
  // --------------------------
  return (
    <div className="import-container">
      <h1 className="header-title">Import</h1>
      <p className="header-subtitle">
        Upload CSV, extract PDF data, or enter transactions manually
      </p>

      <div className="import-box">

        {/* TABS */}
        <div className="tabs">
          <button
            className={activeTab === "csv" ? "tab-active" : "tab"}
            onClick={() => setActiveTab("csv")}
          >
            CSV Upload
          </button>

          <button
            className={activeTab === "pdf" ? "tab-active" : "tab"}
            onClick={() => setActiveTab("pdf")}
          >
            PDF Extract
          </button>

          <button
            className={activeTab === "manual" ? "tab-active" : "tab"}
            onClick={() => setActiveTab("manual")}
          >
            Manual Entry
          </button>
        </div>

        {/* CSV Upload */}
        {activeTab === "csv" && (
          <div className="content-section">
            <h2 className="section-title">Upload CSV File</h2>
            <p className="section-description">
              Upload a CSV file with transaction data
            </p>

            <label className="input-label">Select CSV File</label>

            <div className="input-row">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />

              <button
                onClick={handleCsvUpload}
                className="extract-btn"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload CSV"}
              </button>
            </div>
          </div>
        )}

        {/* PDF Extract */}
        {activeTab === "pdf" && (
          <div className="content-section">
            <h2 className="section-title">Extract Transactions from PDF</h2>
            <p className="section-description">
              Upload a PDF bank statement to extract transactions
            </p>

            <label className="input-label">Upload PDF Statement</label>

            <div className="input-row">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
              />

              <button
                onClick={handleExtractPdf}
                className="extract-btn"
                disabled={loading}
              >
                {loading ? "Processing..." : "Extract PDF"}
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {activeTab === "manual" && (
          <div className="content-section">
            <h2 className="section-title">Add Transaction Manually</h2>

            <label className="input-label">Select Bank Account *</label>
            <select
              className="form-input"
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

            <div className="manual-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="input-label">Date *</label>
                  <input
                    type="date"
                    value={manualTransaction.date}
                    onChange={(e) =>
                      setManualTransaction({
                        ...manualTransaction,
                        date: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Amount *</label>
                  <input
                    type="number"
                    value={manualTransaction.amount}
                    onChange={(e) =>
                      setManualTransaction({
                        ...manualTransaction,
                        amount: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Merchant *</label>
                <input
                  type="text"
                  value={manualTransaction.merchant}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      merchant: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Notes</label>
                <textarea
                  value={manualTransaction.notes}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      notes: e.target.value,
                    })
                  }
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <button
                onClick={handleManualSubmit}
                className="extract-btn"
                disabled={loading}
              >
                {loading ? "Adding…" : "Add Transaction"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
