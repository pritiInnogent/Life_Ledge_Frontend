import React, { useState, useEffect } from "react";
import {Camera,User,Mail,Phone,Save,X,CreditCard,Banknote} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/ProfilePage.css";

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  // User Profile State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    profilePicUrl: "",
    createdAt: null,
  });

  // Bank Accounts 
  const [accounts, setAccounts] = useState([]);

  // New Account Form State
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load User + Accounts on mount
  useEffect(() => {
    loadProfile();
    loadBankAccounts();
  }, []);

  // -----------------------------
  // Load Profile
  // -----------------------------
  const loadProfile = async () => {
    try {
      const data = await apiService.get("/user/profile");
      setProfile(data);
    } catch (err) {
      setError("Failed to load profile");
    }
  };

  // -----------------------------
  // Load Bank Accounts
  // -----------------------------
  const loadBankAccounts = async () => {
    try {
      const list = await apiService.getAccounts();
      setAccounts(list);
    } catch (err) {
      setError("Failed to load bank accounts");
    }
  };

  // -----------------------------
  // Save Profile
  // -----------------------------
  const handleSave = async () => {
    try {
      await apiService.put("/user/update", {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  // -----------------------------
  // Upload Profile Picture
  // -----------------------------
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await apiService.post("/user/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile((prev) => ({ ...prev, profilePicUrl: response.url }));
      setSuccess("Profile picture updated!");
    } catch (err) {
      setError("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------
  // Add New Bank Account
  // -----------------------------
  const handleAddBankAccount = async () => {
    if (!newBankName || !newAccountNumber) {
      setError("Please fill all fields");
      return;
    }

    try {
      await apiService.createAccount({
        bankName: newBankName,
        accountNumber: newAccountNumber,
      });

      setSuccess("Bank account added!");
      setNewBankName("");
      setNewAccountNumber("");
      loadBankAccounts();
    } catch (err) {
      setError(err.message);
    }
  };

  // -----------------------------
  // UI START
  // -----------------------------
  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-50 to-cyan-50 min-h-screen p-6">
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-purple-900 to-cyan-900 rounded-3xl p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-8">

          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 backdrop-blur-md border-4 border-white/30">
              {profile.profilePicUrl ? (
                <img
                  src={profile.profilePicUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-white/70" />
                </div>
              )}
            </div>

            <label className="absolute bottom-0 right-0 bg-yellow-400 p-3 rounded-full cursor-pointer shadow-lg hover:bg-yellow-500 transition">
              <Camera className="w-5 h-5 text-purple-900" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-white mb-2">
              {profile.name || "User"}
            </h1>
            <p className="text-white/80 text-lg mb-4">{profile.email}</p>
          </div>

          {/* Buttons */}
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition backdrop-blur-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    loadProfile()
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>}
      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-xl">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 mt-8">
        <h2 className="text-2xl font-black mb-6">Profile Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-3 border rounded-xl"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl">
                {profile.name || "Not provided"}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" /> Email Address
            </label>
            <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
              {profile.email} (Cannot be changed)
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" /> Phone Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                className="w-full p-3 border rounded-xl"
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
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 mt-8">
        <h2 className="text-2xl font-black mb-6 flex items-center">
          <Banknote className="w-6 h-6 mr-2" />
          Linked Bank Accounts
        </h2>

        {accounts.length === 0 ? (
          <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
            No accounts added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 bg-gray-50 rounded-xl border">
                <div className="font-bold">{acc.bankName}</div>
                <div className="text-gray-600">•••• {acc.last4Digits}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bank Account */}
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 mt-8">
        <h2 className="text-2xl font-black mb-6">Add Bank Account</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Bank Name
            </label>
            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              className="w-full p-3 border rounded-xl"
              placeholder="Enter bank name"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.target.value)}
              className="w-full p-3 border rounded-xl"
              placeholder="Enter account number"
            />
          </div>
        </div>

        <button
          onClick={handleAddBankAccount}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Bank Account
        </button>
      </div>
    </div>
  );
}
