import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import apiService from "../services/api";

export default function SelectAccountDialog({ onSelect, onCancel }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ bankName: "", accountNumber: "" });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleCreateAccount = async () => {
    if (!newAccount.bankName || !newAccount.accountNumber) {
      showToast("Please fill all fields", "error");
      return;
    }

    // Validate bank name (only alphabets and spaces)
    if (!/^[A-Za-z\s]+$/.test(newAccount.bankName)) {
      showToast("Bank name should contain only alphabets", "error");
      return;
    }

    // Validate account number (only numbers)
    if (!/^\d+$/.test(newAccount.accountNumber)) {
      showToast("Account number should contain only numbers", "error");
      return;
    }

    try {
      setCreating(true);
      const created = await apiService.createAccount(newAccount);
      await loadAccounts();
      setSelectedId(created.id);
      setShowCreateForm(false);
      setNewAccount({ bankName: "", accountNumber: "" });
      showToast("Account created successfully!", "success");
    } catch (error) {
      console.error("Failed to create account:", error);
      showToast("Failed to create account", "error");
    } finally {
      setCreating(false);
    }
  };

  if (showCreateForm) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-60 p-4 rounded-xl shadow-lg ${
            toast.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
            {toast.message}
          </div>
        )}
        <div className="bg-white rounded-2xl w-[90vw] max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Create New Account</h2>
            <button onClick={() => setShowCreateForm(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input
                type="text"
                value={newAccount.bankName}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                  setNewAccount({...newAccount, bankName: value});
                }}
                className="w-full p-3 border rounded-xl"
                placeholder="Enter bank name (alphabets only)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input
                type="text"
                value={newAccount.accountNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNewAccount({...newAccount, accountNumber: value});
                }}
                className="w-full p-3 border rounded-xl"
                placeholder="Enter account number (numbers only)"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex-1 border px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAccount}
              disabled={creating}
              className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-60 p-4 rounded-xl shadow-lg ${
          toast.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {toast.message}
        </div>
      )}
      <div className="bg-white rounded-2xl w-[90vw] max-w-md p-6">
        <h2 className="text-xl font-bold mb-3">Select Bank Account</h2>

        <p className="text-sm text-gray-600 mb-4">
          Choose the bank account this screenshot belongs to
        </p>

        <select
          className="w-full border rounded-xl p-3 mb-3"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">-- Select existing account --</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.bankName} ••••{acc.last4Digits}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 text-purple-600 py-3 rounded-xl mb-4 hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Account
        </button>

        <div className="flex justify-between mt-4">
          <button
            onClick={onCancel}
            className="border px-4 py-2 rounded-xl"
          >
            Cancel
          </button>

          <button
            disabled={!selectedId}
            onClick={() => onSelect(selectedId)}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
