import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  KeyRound,
  Mail,
  Link2,
  Palette,
  Globe,
  ShieldCheck,
} from "lucide-react";
import ApiService from "../services/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    darkMode: false,
    language: "en",
    twoFactorAuth: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    setSettings({
      darkMode: savedSettings.darkMode || false,
      language: savedSettings.language || "en",
      twoFactorAuth: savedSettings.twoFactorAuth || false,
    });

    document.documentElement.classList.toggle("dark", savedSettings.darkMode);
  };

  const handleSettingChange = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("userSettings", JSON.stringify(updated));

    if (key === "darkMode") {
      document.documentElement.classList.toggle("dark", value);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-gray-600 font-semibold">Manage your preferences</p>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =============== PROFILE CARD =============== */}
        <SettingsCard title="Profile">
          <SettingsItem
            icon={<User className="text-purple-600" />}
            label="Edit profile"
            desc="Update your profile information"
            onClick={() => navigate('/app/profile')}
          />

          <SettingsItem
            icon={<KeyRound className="text-purple-600" />}
            label="Change password"
            desc="Change your account password"
            onClick={() => console.log("Open Change Password Modal")}
          />
        </SettingsCard>

        {/* =============== ACCOUNT CARD =============== */}
        <SettingsCard title="Account">
          <SettingsItem
            icon={<Mail className="text-purple-600" />}
            label="Email addresses"
            desc="Manage your connected email accounts"
            onClick={() => console.log("Manage Email Accounts")}
          />

          <SettingsItem
            icon={<Link2 className="text-purple-600" />}
            label="Connected accounts"
            desc="Manage your linked social accounts"
            onClick={() => console.log("Manage Linked Accounts")}
          />
        </SettingsCard>

        {/* =============== APPEARANCE CARD =============== */}
        <SettingsCard title="Appearance">
          {/* Dark mode */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="font-bold text-gray-900">Dark Mode</h3>
              <p className="text-sm text-gray-600">Enable dark theme</p>
            </div>

            <SwitchToggle
              value={settings.darkMode}
              onChange={(v) => handleSettingChange("darkMode", v)}
            />
          </div>

          {/* Language */}
          <SettingsItem
            icon={<Globe className="text-purple-600" />}
            label="Language"
            desc="Select your display language"
            onClick={() => console.log("Open Language Selector")}
          />
        </SettingsCard>

        {/* =============== SECURITY CARD =============== */}
        <SettingsCard title="Security">
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="font-bold text-gray-900">Two-factor authentication</h3>
              <p className="text-sm text-gray-600">Secure your account with 2FA</p>
            </div>

            <SwitchToggle
              value={settings.twoFactorAuth}
              onChange={(v) => handleSettingChange("twoFactorAuth", v)}
            />
          </div>

          <SettingsItem
            icon={<ShieldCheck className="text-purple-600" />}
            label="Authenticator App"
            desc="Use Google Authenticator or similar apps"
            onClick={() => console.log("Open 2FA Setup")}
          />
        </SettingsCard>
      </div>
    </div>
  );
}

/* ========================= REUSABLE COMPONENTS ========================= */

function SettingsCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-2">
      <h2 className="text-xl font-black mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SettingsItem({ icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 w-full text-left py-3 px-2 rounded-lg hover:bg-gray-100 transition"
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>

      <div>
        <h3 className="font-bold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </button>
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
