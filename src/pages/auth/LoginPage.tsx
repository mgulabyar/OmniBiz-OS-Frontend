import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { authService } from "../../services/auth/authService";
import { Mail, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.login({ email, password });

      if (result.status === "success") {
        auth?.loginUser(result.token, result.data.user);
        navigate("/");
      } else {
        setError(result.message || "Invalid system credentials.");
      }
    } catch (err) {
      setError(
        "Backend server connection failed. Please check if your Node.js is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full justify-center px-4 pt-10 pb-8 font-sans selection:bg-[#173C82]/15 sm:pt-14">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-6 py-7 shadow-[0_12px_30px_rgba(23,60,130,0.09),0_3px_8px_rgba(15,23,42,0.04)] sm:px-7 sm:py-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center">
            <img
              className="h-auto w-14"
              src="/logo-omnibiz.png"
              alt="OmniBiz"
            />
          </div>

          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">
            <span className="text-[#173C82]">Sign in to </span>
            <span className="text-[#F45A2A]">OmniBiz</span>
          </h2>

          <p className="mt-1.5 max-w-65 text-xs leading-5 text-slate-500">
            Access your multi-business workspace console
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#173C82]">
              Business Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

              <input
                type="email"
                placeholder="manager@omnibiz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#173C82]">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#173C82]/60" />

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#173C82] focus:ring-2 focus:ring-[#173C82]/10"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-slate-200" />

            <span className="whitespace-nowrap font-sans text-[10px] font-semibold tracking-[0.16em] text-[#173C82]/65">
              SECURE ACCESS
            </span>

            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#173C82] py-3 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(23,60,130,0.20)] transition-all duration-200 hover:bg-[#102D63] hover:shadow-[0_8px_18px_rgba(23,60,130,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-[#F45A2A]" />
            ) : null}

            <span>
              {loading ? (
                <>
                  <span className="text-white">Verifying </span>
                  <span className="text-[#F45A2A]">session...</span>
                </>
              ) : (
                <>
                  <span className="text-white">Sign </span>
                  <span className="text-[#F45A2A]">in</span>
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};