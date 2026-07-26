import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg?react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard");
  }, [isLoggedIn]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 text-white flex flex-col px-6 pt-12 pb-8"
      style={{
        background: "#0B0810",
        backgroundImage: `
    radial-gradient(140% 80% at 100% 0%, color-mix(in oklab, #E8E1D3 22%, transparent), transparent 55%),
    radial-gradient(80% 50% at -10% 100%, color-mix(in oklab, #E8E1D3 16%, transparent), transparent 60%)
  `,
      }}
    >
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        <div className="sm:my-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Logo width={24} height={24} fill="#E8E1D3" />
            </div>
            <span
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: "#E8E1D3" }}
            >
              SpotMe
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back.</h1>
          <p
            className="text-sm mb-10"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Log in to keep your streak alive.
          </p>

          {error && <p className="text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 mb-5">
              <label
                className="text-[11px] font-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-2xl text-base text-white placeholder-[#555] focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>

            <div className="flex flex-col gap-2 mb-2">
              <label
                className="text-[11px] font-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-4 rounded-2xl text-base text-white focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              <button
                type="button"
                className="text-sm font-bold cursor-pointer"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold cursor-pointer text-sm"
              style={{ background: "#E8E1D3", color: "#0B0810" }}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
        <div className="mt-auto sm:mt-0 text-center">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold"
              style={{ color: "#E8E1D3" }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
