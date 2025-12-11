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
import { useTheme } from "../contexts/ThemeContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    language: "en",
    twoFactorAuth: false,
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'hi', name: 'हिन्दी' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    setSettings({
      language: savedSettings.language || "en",
      twoFactorAuth: savedSettings.twoFactorAuth || false,
    });
  };

  const handleSettingChange = (key, value) => {
    if (key === "darkMode") {
      toggleDarkMode(value);
    } else {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      const savedSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
      localStorage.setItem("userSettings", JSON.stringify({ ...savedSettings, [key]: value }));
    }
  };
  
  const handleLanguageChange = (langCode) => {
    handleSettingChange('language', langCode);
    setShowLanguageModal(false);
  };

  return (
    <div className={`p-6 space-y-8 min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Page Title */}
      <div>
        <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
        <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your preferences</p>
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
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dark Mode</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Enable dark theme</p>
            </div>

            <SwitchToggle
              value={darkMode}
              onChange={(v) => handleSettingChange("darkMode", v)}
            />
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Globe className="text-purple-600 w-8 h-8" />
              <div>
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Language</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Current: {languages.find(l => l.code === settings.language)?.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLanguageModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Change
            </button>
          </div>
        </SettingsCard>

        {/* =============== SECURITY CARD =============== */}
        <SettingsCard title="Security">
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Two-factor authentication</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Secure your account with 2FA</p>
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
      
      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 w-96 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select Language</h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    settings.language === lang.code
                      ? 'bg-purple-600 text-white'
                      : darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className={`mt-4 w-full py-2 rounded-lg transition ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================= REUSABLE COMPONENTS ========================= */

function SettingsCard({ title, children }) {
  const { darkMode } = useTheme();
  
  return (
    <div className={`rounded-2xl p-6 shadow space-y-2 transition-colors ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`text-xl font-black mb-4 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>{title}</h2>
      {children}
    </div>
  );
}

function SettingsItem({ icon, label, desc, onClick }) {
  const { darkMode } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-4 w-full text-left py-3 px-2 rounded-lg transition ${
        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>

      <div>
        <h3 className={`font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{label}</h3>
        <p className={`text-sm ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>{desc}</p>
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
