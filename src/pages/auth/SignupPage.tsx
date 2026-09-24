import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { authService } from "../../services/auth/authService";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export const SignupPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Customer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.signup({ name, email, password, role });

      if (result.status === "success") {
        auth?.loginUser(result.token, result.data.user);
        navigate("/");
      } else {
        setError(result.message || "Signup registration rejected.");
      }
    } catch (err) {
      setError(
        "Backend connection error. Please make sure node server is online.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans selection:bg-[#23545B]/10">
      <div className="w-full max-w-sm bg-white rounded-md border border-slate-200/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex flex-col items-center text-center mb-6">
          <h2 className="text-xl font-semibold text-slate-700 tracking-tight">
            Create account
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-60">
            Access your multi-business workspace console
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-2.5 rounded-md text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g., Ayesha Khan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#23545B] focus:ring-[#23545B] transition-all text-xs text-slate-700 placeholder-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                placeholder="ayesha@omnibiz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#23545B] focus:ring-[#23545B] transition-all text-xs text-slate-700 placeholder-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#23545B] focus:ring-[#23545B] transition-all text-xs text-slate-700 placeholder-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Target Platform Role
            </label>
            <div className="relative flex items-center">
              <ShieldCheck className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-[#23545B] focus:ring-[#23545B] transition-all text-xs text-slate-700 appearance-none cursor-pointer"
              >
                <option value="SalonAdmin">Salon Admin Portal</option>
                <option value="TransportAdmin">
                  Transport Fleet Management
                </option>
                <option value="HajjUmrahAdmin">Hajj & Umrah Operator</option>
                <option value="Customer">Standard Customer Account</option>
              </select>

              <div className="absolute right-3 pointer-events-none text-slate-400">
                <svg
                  xmlns="http://w3.org"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#23545B] hover:bg-[#1a3f44] text-white font-medium py-2.5 rounded-md transition-all duration-150 text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            <span>{loading ? "Registering account..." : "Create account"}</span>
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 font-normal">
          <span>Already registered? </span>
          <Link
            to="/login"
            className="text-[#23545B] font-medium hover:underline ml-0.5"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
