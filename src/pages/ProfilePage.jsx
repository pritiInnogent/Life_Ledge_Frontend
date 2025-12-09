import React, { useState, useEffect } from "react";
import {
  Camera,
  User,
  Mail,
  Phone,
  Save,
  X,
  Banknote
} from "lucide-react";

import apiService from "../services/api";
import "../styles/ProfilePage.css";

export default function ProfilePage() {
  // ----------------------------
  // STATES
  // ----------------------------
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

  // ----------------------------
  // LOAD DATA
  // ----------------------------
  useEffect(() => {
    loadProfile();
    loadBankAccounts();
  }, []);

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
    setLoadingSave(true);
    try {
      await apiService.updateUserProfile({
        name: profile.name,
        phoneNumber: profile.phoneNumber,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      loadProfile();
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
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);

      const response = await apiService.uploadProfilePicture(file);

      setProfile((prev) => ({ ...prev, profilePicUrl: response.url }));
      setSuccess("Profile picture updated!");
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // ----------------------------
  // ADD NEW BANK ACCOUNT
  // ----------------------------
  const handleAddBankAccount = async () => {
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
    if (!confirm(`Are you sure you want to remove ${bankName}?`)) {
      return;
    }

    try {
      setRemovingAccountId(accountId);
      await apiService.deleteAccount(accountId);
      setSuccess("Bank account removed!");
      setError("");
      await loadBankAccounts();
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
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-cyan-50 min-h-screen profile-fade">

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
            <label className="absolute bottom-0 right-0 bg-yellow-400 p-3 rounded-full cursor-pointer shadow-lg hover:bg-yellow-500 transition">
              <Camera className="w-5 h-5 text-purple-900" />
              <input type="file" className="hidden" onChange={handleImageUpload} />
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
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-black shadow transition backdrop-blur-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={loadingSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-black shadow flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loadingSave ? "Saving..." : "Save"}
                </button>

                {/* Cancel Button */}
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl font-black shadow transition"
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
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 profile-card">
        <h2 className="text-2xl font-black mb-6">Profile Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-bold">Full Name</label>
            {isEditing ? (
              <input
                className="w-full p-3 border rounded-xl profile-input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl">{profile.name}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold">Email Address</label>
            <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
              {profile.email} (Cannot be changed)
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold">Phone Number</label>
            {isEditing ? (
              <input
                className="w-full p-3 border rounded-xl profile-input"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile({ ...profile, phoneNumber: e.target.value })
                }
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl">
                {profile.phoneNumber || "Not provided"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked Bank Accounts */}
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 profile-card mt-8">
        <h2 className="text-2xl font-black mb-6 flex items-center">
          <Banknote className="w-5 h-5 mr-2" /> Linked Bank Accounts
        </h2>

        {accounts.length === 0 ? (
          <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
            No bank accounts added yet.
          </div>
        ) : (
          <div className="bank-scroll space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bank-account-item p-4 bg-gray-50 border rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold">{acc.bankName}</div>
                  <div className="text-gray-600">•••• {acc.last4Digits}</div>
                </div>
                <button
                  onClick={() => handleRemoveAccount(acc.id, acc.bankName)}
                  disabled={removingAccountId === acc.id}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-2xl font-black shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removingAccountId === acc.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bank Account */}
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 profile-card mt-8">
        <h2 className="text-2xl font-black mb-6">Add Bank Account</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bank Name */}
          <div>
            <label className="block font-bold text-sm">Bank Name</label>
            <input
              className="w-full p-3 border rounded-xl profile-input"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="Enter bank name"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block font-bold text-sm">Account Number</label>
            <input
              className="w-full p-3 border rounded-xl profile-input no-spinner"
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
    </div>
  );
}
