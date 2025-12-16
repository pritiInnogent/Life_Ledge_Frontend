import React, { useState, useEffect } from "react";
import {
  Camera,
  User,
  Save,
  X,
  Banknote,
  ShieldCheck,
  Palette
} from "lucide-react";

import apiService from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import "../styles/ProfilePage.css";

export default function ProfilePage() {
  // ----------------------------
  // STATES
  // ----------------------------
  const { darkMode, toggleDarkMode } = useTheme();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    profilePicUrl: "",
    createdAt: null,
  });

  const [accounts, setAccounts] = useState([]);
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  // ----------------------------
  // LOAD DATA
  // ----------------------------
  useEffect(() => {
    if (!deleteMode) {
      loadProfile();
      loadBankAccounts();
    }
  }, [deleteMode]);

  const handleDeleteAccount = async () => {
    // Enter delete mode: disable all UI and auto-fetching
    setDeleteMode(true);
    setDeletingAccount(true);
    setError('');
    
    try {
      // Make ONE request to DELETE /api/accounts/me
      await apiService.api.delete('/accounts/me');
      
      // On success: instantly clear auth and redirect (no refetches, no UI updates)
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('accountDeletedMessage', 'Account deleted successfully');
      
      // Force redirect without triggering any React updates
      window.location.href = '/login';
      
    } catch (err) {
      // On failure: show error and re-enable UI
      console.error('Account deletion failed:', err);
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
      setShowDeleteModal(false);
      setDeleteMode(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await apiService.getUserProfile();
      setProfile(res);
    } catch (err) {
      setError("Failed to load profile");
    }
  };

  const loadBankAccounts = async () => {
    try {
      const res = await apiService.getAccounts(); // ✔ Now exists in apiService.js
      setAccounts(res);
    } catch (err) {
      setError("Failed to load accounts");
    }
  };

  // ----------------------------
  // SAVE PROFILE (NAME + PHONE ONLY)
  // ----------------------------
  const handleSave = async () => {
    if (deleteMode) return;
    setLoadingSave(true);
    try {
      await apiService.updateUserProfile({
        name: profile.name,
        phoneNumber: profile.phoneNumber,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      if (!deleteMode) loadProfile();
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoadingSave(false);
    }
  };

  // ----------------------------
  // UPLOAD PROFILE PIC
  // ----------------------------
  const handleImageUpload = async (event) => {
    if (deleteMode) return;
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');

      const formData = new FormData();
      formData.append("file", file);

      const response = await apiService.uploadProfilePicture(file);

      // Update profile with Cloudinary URL
      const profilePicUrl = response.profilePicUrl || response.url;
      setProfile((prev) => ({ ...prev, profilePicUrl }));
      
      // Update user context with new profile picture
      updateUser({ profilePicture: profilePicUrl, profilePicUrl: profilePicUrl });
      
      setSuccess("Profile picture updated!");
    } catch (err) {
      console.error('Upload error:', err);
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // ----------------------------
  // ADD NEW BANK ACCOUNT
  // ----------------------------
  const handleAddBankAccount = async () => {
    if (deleteMode) return;
    if (!newBankName || !newAccountNumber) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.createAccount({
        bankName: newBankName,
        accountNumber: newAccountNumber,
      });
      
      console.log('Account created:', result);
      setSuccess("Bank account added!");
      setError("");
      setNewBankName("");
      setNewAccountNumber("");
      await loadBankAccounts();
    } catch (err) {
      console.error('Error adding account:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // REMOVE BANK ACCOUNT
  // ----------------------------
  const [removingAccountId, setRemovingAccountId] = useState(null);

  const handleRemoveAccount = async (accountId, bankName) => {
    if (deleteMode) return;
    try {
      setRemovingAccountId(accountId);
      await apiService.deleteAccount(accountId);
      setSuccess("Bank account removed!");
      setError("");
      await loadBankAccounts();
      
      // Notify other components that account was deleted
      window.dispatchEvent(new CustomEvent('accountDeleted'))
    } catch (err) {
      console.error('Error removing account:', err);
      setError(err.message);
    } finally {
      setRemovingAccountId(null);
    }
  };

  // ----------------------------
  // UI STARTS
  // ----------------------------
  return (
    <div className={`max-w-4xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 min-h-screen profile-fade ${deleteMode ? 'pointer-events-none opacity-60' : ''}`}>
      {deleteMode && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Deleting account...</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Profile Header */}
      <div className="bg-gradient-to-br from-purple-900 to-cyan-900 rounded-3xl p-8 shadow-2xl profile-card mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">

          {/* Profile Pic */}
          <div className="relative">
            <div className="profile-picture-container w-32 h-32 rounded-full bg-white/20 border-4 border-white/30 overflow-hidden backdrop-blur-md flex items-center justify-center">
              {profile.profilePicUrl ? (
                <img
                  src={profile.profilePicUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white/70" />
              )}
            </div>

            {/* Upload Button */}
            <label className={`absolute bottom-0 right-0 bg-yellow-400 p-3 rounded-full shadow-lg hover:bg-yellow-500 transition ${deleteMode ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
              <Camera className="w-5 h-5 text-purple-900" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={deleteMode}
              />
            </label>

            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-sm">
                Uploading…
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-white mb-2">{profile.name}</h1>
            <p className="text-white/80">{profile.email}</p>
          </div>

          {/* Buttons */}
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={deleteMode}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-black shadow transition backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loadingSave || deleteMode}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold shadow flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loadingSave ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={deleteMode}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-2xl font-bold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6">{error}</div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-xl mb-6">{success}</div>}

      {/* Profile Info Section */}
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 profile-card">
        <h2 className="text-2xl font-black mb-6 dark:text-gray-100">Profile Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-bold dark:text-gray-200">Full Name</label>
            {isEditing ? (
              <input
                className="w-full p-3 border dark:border-gray-600 rounded-xl profile-input dark:bg-gray-700 dark:text-gray-100"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-gray-200">{profile.name}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold dark:text-gray-200">Email Address</label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400">
              {profile.email} (Cannot be changed)
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold dark:text-gray-200">Phone Number</label>
            {isEditing ? (
              <input
                className="w-full p-3 border dark:border-gray-600 rounded-xl profile-input dark:bg-gray-700 dark:text-gray-100"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile({ ...profile, phoneNumber: e.target.value })
                }
              />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl dark:text-gray-200">
                {profile.phoneNumber || "Not provided"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked Bank Accounts */}
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 profile-card mt-8">
        <h2 className="text-2xl font-black mb-6 flex items-center dark:text-gray-100">
          <Banknote className="w-5 h-5 mr-2" /> Linked Bank Accounts
        </h2>

        {accounts.length === 0 ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400">
            No bank accounts added yet.
          </div>
        ) : (
          <div className="bank-scroll space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bank-account-item p-4 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold dark:text-gray-100">{acc.bankName}</div>
                  <div className="text-gray-600 dark:text-gray-400">•••• {acc.last4Digits}</div>
                </div>
                <button
                  onClick={() => handleRemoveAccount(acc.id, acc.bankName)}
                  disabled={removingAccountId === acc.id}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removingAccountId === acc.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bank Account */}
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 profile-card mt-8">
        <h2 className="text-2xl font-black mb-6 dark:text-gray-100">Add Bank Account</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bank Name */}
          <div>
            <label className="block font-bold text-sm dark:text-gray-200">Bank Name</label>
            <input
              className="w-full p-3 border dark:border-gray-600 rounded-xl profile-input dark:bg-gray-700 dark:text-gray-100"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="Enter bank name"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block font-bold text-sm dark:text-gray-200">Account Number</label>
            <input
              className="w-full p-3 border dark:border-gray-600 rounded-xl profile-input no-spinner dark:bg-gray-700 dark:text-gray-100"
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.target.value)}
              placeholder="Enter account number"
            />
          </div>
        </div>

        <button
          onClick={handleAddBankAccount}
          disabled={loading}
          className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-black shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Bank Account'}
        </button>
      </div>

      {/* Settings Section */}
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 profile-card mt-8">
        <h2 className="text-2xl font-black mb-6 dark:text-gray-100">Settings</h2>
        
        <div className="space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between py-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Palette className="text-purple-600 w-6 h-6" />
              <div>
                <h3 className="font-bold dark:text-gray-100">Dark Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enable dark theme</p>
              </div>
            </div>
            <SwitchToggle value={darkMode} onChange={toggleDarkMode} />
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <X className="text-red-600 w-6 h-6" />
              <div>
                <h3 className="font-bold dark:text-gray-100">Delete Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border-2 border-red-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-black mb-2 text-red-600 dark:text-red-400">Delete Account Permanently?</h3>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
                ⚠️ This action is IRREVERSIBLE
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>All your transactions will be permanently deleted</li>
                <li>All bank accounts will be removed</li>
                <li>All goals and insights will be lost</li>
                <li>You cannot recover this data</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? 'Deleting Account...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel, Keep My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SwitchToggle({ value, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all"></div>
    </label>
  );
}
