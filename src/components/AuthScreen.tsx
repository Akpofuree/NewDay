import React, { useState } from "react";
import { User } from "../types";
import {
  KeyRound,
  Mail,
  Sparkles,
  UserCheck,
  Lock,
  ChevronRight,
  CheckCircle2,
  Award,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { apiFetch } from "../lib/api";
import LogoLoader from "./animations/LogoLoader";
const logoImage = new URL("../images/logo.png", import.meta.url).href;

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const handleGoogleLogin = async (credentialResponse: any) => {
    setLoading(true);
    setError("");
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const response = await apiFetch("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Google login failed.");
      }

      onAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");

    if (isReset) {
      if (!email || !password) {
        setError("Please enter your email and a new password.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      setLoading(true);
      try {
        const response = await apiFetch("/api/auth/reset", {
          method: "POST",
          body: JSON.stringify({ email, newPassword: password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to reset password.");
        }

        setResetSuccess(
          "Workspace password updated! You can now authenticate with your new credentials.",
        );
        setIsReset(false);
        setPassword("");
      } catch (err: any) {
        setError(err.message || "Mismatched user or wrong details key.");
      } finally {
        setLoading(false);
      }
    } else if (isSignUp) {
      if (!name || !email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      setLoading(true);
      try {
        const response = await apiFetch("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to sign up.");
        }

        onAuthSuccess(data);
      } catch (err: any) {
        setError(err.message || "Connection to databank failed.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setError("Please enter your email and password.");
        return;
      }

      setLoading(true);
      try {
        const response = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Invalid credentials.");
        }

        onAuthSuccess(data);
      } catch (err: any) {
        setError(err.message || "Mismatched user or wrong code details.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#F7F7FB] dark:bg-[#0F0F1A] p-4 font-sans selection:bg-[#5C27FE]/20">
      {/* Background Abstract Glow Spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] opacity-25 dark:opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-tr from-[#FF4D4D] to-[#FFB020] opacity-20 dark:opacity-35 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-[#5C27FE] opacity-10 dark:opacity-20 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-6 relative z-10">
        {/* Left Aspect: Brand Specs */}
        <div className="md:col-span-5 flex flex-col justify-between p-7 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#5C27FE]/10 blur-xl pointer-events-none" />

          <div>
            {/* Title logo info */}
            <div className="flex items-center gap-2 mb-8">
              <img
                src={logoImage}
                alt="NewDay logo"
                className="h-9 w-auto rounded-xl object-contain shadow-lg shadow-[#5C27FE]/30 border border-white/20"
              />
              <span className="sr-only">NewDay</span>
            </div>

            <h1 className="font-extrabold text-2xl tracking-tight leading-tight text-gray-950 dark:text-gray-100 mb-4">
              Durable Collaborative{" "}
              <span className="text-[#5C27FE] dark:text-[#a085ff]">
                Task Workspace
              </span>
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Welcome to the NewDay production environment. Experience real-time
              multi-user synchronization, secure workspace credentials database
              persistence, and AI-powered curriculum maps.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-200/50 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded-md bg-[#5C27FE]/10 text-[#5C27FE] dark:text-[#a085ff]">
                <Zap size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200">
                  Real-Time Synergized Chat
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Collaborate with peers instantly. Chat across custom project
                  channels backed by database streaming.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded-md bg-[#00C48C]/10 text-[#00C48C]">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200">
                  Zero Mock Accounts
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Only real verified users. Workspaces start clean and save
                  securely to server database structures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1 rounded-md bg-[#FF4D4D]/10 text-[#FF4D4D]">
                <Award size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200">
                  AI Mentor Roadmaps
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Unlock interactive modular learning guides natively generated
                  directly in cooperation with Gemini AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Aspect: Auth Forms */}
        <div
          id="auth-card"
          className="md:col-span-7 flex flex-col justify-center p-8 rounded-2xl bg-white dark:bg-slate-900/90 shadow-xl border border-gray-150 dark:border-white/5 relative overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm px-6 py-8">
              <div className="w-full max-w-xs rounded-3xl bg-slate-900/95 p-6 shadow-xl shadow-black/30">
                <LogoLoader />
                <p className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-slate-300">
                  Authenticating workspace...
                </p>
              </div>
            </div>
          )}
          <div className="mb-6">
            <h2 className="font-bold text-xl text-gray-900 dark:text-white">
              {isReset
                ? "Reset Workspace Security"
                : isSignUp
                  ? "Create Workspace Account"
                  : "Verify Credentials"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isReset
                ? "Type your email and set your new workspace security password."
                : isSignUp
                  ? "Establish a real account and join the server workspace."
                  : "Enter your details to access your shared collaborative board."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-xs bg-red-100 dark:bg-red-950/45 text-[#FF4D4D] border border-[#FF4D4D]/25">
                {error}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-lg text-xs bg-emerald-100 dark:bg-emerald-950/45 text-[#00C48C] border border-[#00C48C]/25">
                {resetSuccess}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserCheck size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={32}
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-medium bg-white/40 dark:bg-black/20 text-gray-900 dark:text-white pl-10 pr-3 py-2.5 rounded-xl border border-gray-200/60 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] dark:focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Workspace Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium bg-white/40 dark:bg-black/20 text-gray-900 dark:text-white pl-10 pr-3 py-2.5 rounded-xl border border-gray-200/60 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] dark:focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {isReset ? "Next Security Password" : "Security Password"}
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setResetSuccess("");
                      setIsReset(!isReset);
                    }}
                    className="text-[10px] font-bold text-[#5C27FE] dark:text-[#a085ff] hover:underline cursor-pointer"
                  >
                    {isReset ? "Back to sign in" : "Forgot Password?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-medium bg-white/40 dark:bg-black/20 text-gray-900 dark:text-white pl-10 pr-10 py-2.5 rounded-xl border border-gray-200/60 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] dark:focus:border-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#a085ff] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 text-xs font-semibold py-3 rounded-xl bg-[#5C27FE] hover:bg-[#4a1ee3] text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-[#5C27FE]/20 hover:shadow-lg hover:shadow-[#5C27FE]/30 cursor-pointer"
            >
              <span>
                {loading
                  ? "Processing..."
                  : isReset
                    ? "Reset My Password Now"
                    : isSignUp
                      ? "Register & Load App"
                      : "Authenticate Into Workspace"}
              </span>
              <Sparkles size={13} />
            </button>

            {!isReset && (
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200/50 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>
            )}

            {!isReset && (
              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setError("Google login failed")}
                  useOneTap
                />
              </div>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {isReset
                ? "Remembered security keys?"
                : isSignUp
                  ? "Joined workspace already?"
                  : "Looking to start fresh?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setError("");
                setResetSuccess("");
                if (isReset) {
                  setIsReset(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
              }}
              className="font-semibold text-[#5C27FE] dark:text-[#a085ff] hover:underline cursor-pointer"
            >
              {isReset
                ? "Sign in instead"
                : isSignUp
                  ? "Sign in instead"
                  : "Create new account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
