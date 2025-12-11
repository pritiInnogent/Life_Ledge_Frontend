import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const errors = {};

    if (!isLogin) {
      if (!formData.name.trim()) {
        errors.name = "Name is required";
      }
      
      if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
        errors.phoneNumber = "Invalid phone number format";
      }
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        // 🔥 REAL BACKEND LOGIN
        await login(formData.email, formData.password);
        navigate("/app/dashboard");
      } else {
        // 🔥 REAL BACKEND SIGNUP
        await signup(
          formData.name,
          formData.email,
          formData.password,
          formData.phoneNumber
        );
        setError("Registration successful! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT SECTION */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">LifeLedger</h1>
              <p className="text-lg text-white/80 font-semibold">
                Track Smart. Spend Smarter.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {["⚡ AI-Powered Insights", "🔒 Secure & Private", "🎯 Smart Budgeting", "📈 Real-time Analytics"].map(
              (item) => (
                <div
                  key={item}
                  className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm text-white"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* RIGHT SECTION - FORM */}
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl mb-4 shadow-xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black">
              {isLogin ? "Welcome Back!" : "Join Now!"}
            </h2>
            <p className="text-gray-600">
              {isLogin ? "Continue your financial journey" : "Start your wealth journey today"}
            </p>
          </div>

          {error && (
            <div
              className={`mb-4 p-3 rounded ${
                error.includes("successful")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2">Full Name *</label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="John Doe"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    Phone Number
                  </label>
                  <input
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phoneNumber: e.target.value,
                      })
                    }
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.phoneNumber ? 'border-red-500' : ''
                    }`}
                    placeholder="+91 9876543210"
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full p-3 rounded-xl border ${
                  validationErrors.email ? 'border-red-500' : ''
                }`}
                placeholder="you@example.com"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full p-3 rounded-xl border ${
                  validationErrors.password ? 'border-red-500' : ''
                }`}
                placeholder="••••••••"
              />
              {validationErrors.password && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-3 rounded-xl font-black shadow-lg hover:opacity-90"
            >
              {isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin((prev) => !prev)}
              className="text-sm text-purple-700 hover:text-purple-900 font-bold"
            >
              {isLogin ? "Create account" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
