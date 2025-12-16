import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const handleToast = (event) => {
      const { message, type } = event.detail;
      setToast({ show: true, message, type });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };
    
    // Check for account deletion success message
    const deletedMessage = sessionStorage.getItem('accountDeletedMessage');
    if (deletedMessage) {
      setToast({ show: true, message: deletedMessage, type: 'success' });
      sessionStorage.removeItem('accountDeletedMessage');
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
    }
    
    window.addEventListener('showToast', handleToast);
    return () => window.removeEventListener('showToast', handleToast);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    // Signup-specific validations
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters long';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
        newErrors.name = 'Name can only contain alphabets and spaces';
      }
      
      if (formData.phoneNumber && !/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        // 🔥 REAL BACKEND LOGIN
        await login(formData.email, formData.password);
        
        // Check if user has bank accounts
        try {
          const accounts = await apiService.getAccounts();
          if (accounts && accounts.length > 0) {
            navigate("/app/dashboard");
          } else {
            navigate("/app/import");
          }
        } catch {
          navigate("/app/import");
        }
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
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg border bg-white ${
            toast.type === 'success' 
              ? 'border-l-4 border-l-purple-600' 
              : 'border-l-4 border-l-red-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${
                toast.type === 'success' ? 'bg-purple-600' : 'bg-red-600'
              }`}></div>
              <span className="text-sm font-medium text-gray-800">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
      
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
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({...errors, name: ''});
                    }}
                    className={`w-full p-3 rounded-xl border ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Full Name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    Phone Number
                  </label>
                  <input
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        phoneNumber: e.target.value,
                      });
                      if (errors.phoneNumber) setErrors({...errors, phoneNumber: ''});
                    }}
                    className={`w-full p-3 rounded-xl border ${
                      errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+91 9876543210"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({...errors, email: ''});
                }}
                className={`w-full p-3 rounded-xl border ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({...errors, password: ''});
                }}
                className={`w-full p-3 rounded-xl border ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
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
