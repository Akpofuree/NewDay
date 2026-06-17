import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Zap,
  Award,
  MessageSquare,
  Plus,
  Play,
  Check,
  ArrowRight,
  Lock,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
  ChevronRight,
  Layers,
  Target,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Command,
  Activity,
  Heart,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Twitter,
  Linkedin,
  Shield,
} from "lucide-react";
import LogoLoader from "./animations/LogoLoader";
import BorderGlow from "./BorderGlow";
import Hero from "./landing/Hero";
const FocusAnalyticsSection = lazy(() => import("./landing/FocusAnalyticsSection"));
const TestimonialsSection = lazy(() => import("./landing/TestimonialsSection"));
import { AnimatedList } from "../registry/magicui/animated-list";
import useDarkMode from "../hooks/useDarkMode";
import ChromaGrid from "./ChromaGrid";
import { User } from "../types";
const logoImage = new URL("../images/logo.png", import.meta.url).href;
import { apiFetch } from "../lib/api";
import PasswordStrengthIndicator, { isPasswordStrong } from "./PasswordStrengthIndicator";

interface LandingPageProps {
  onAuthSuccess: (user: User) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser?: User | null;
  onEnterDashboard?: () => void;
}

export default function LandingPage({
  onAuthSuccess,
  darkMode,
  setDarkMode,
  currentUser,
  onEnterDashboard,
}: LandingPageProps) {
  // Auth Drawer States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset" | "reset-confirm">("login");
  const [resetConfirmToken, setResetConfirmToken] = useState("");

  // Auth Form State Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [isPermanentLock, setIsPermanentLock] = useState(false);

  // Interactive Live Mockup Panel States
  const [demoSelectedPriority, setDemoSelectedPriority] = useState<"high" | "medium" | "low">(
    "high"
  );
  const [demoCompletedSteps, setDemoCompletedSteps] = useState<boolean[]>([true, false, false]);
  const [activeTab, setActiveTab] = useState<"preview" | "schema" | "terminal">("preview");
  const [simulatedLayout, setSimulatedLayout] = useState<"desktop" | "mobile">("desktop");
  const [mockCollaboratorCount, setMockCollaboratorCount] = useState(3);
  const [typedMessage, setTypedMessage] = useState("");
  const [faqActiveIndex, setFaqActiveIndex] = useState<number | null>(null);
  const [focusSelectedPeriod, setFocusSelectedPeriod] = useState<number>(25);
  const [focusStatusActive, setFocusStatusActive] = useState<boolean>(true);
  const [focusCounterSeconds, setFocusCounterSeconds] = useState<number>(1489); // 24:49 remaining
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [demoChatMessages, setDemoChatMessages] = useState([
    {
      id: 1,
      user: "Sarah K.",
      text: "Is the new campaign task assigned yet? 🚀",
    },
    {
      id: 2,
      user: "Marcus Lin (AI)",
      text: "Yes, just synced to Firebase server rules!",
    },
  ]);

  const [founderTab, setFounderTab] = useState<"vision" | "journey" | "manifest">("vision");
  const founderImage = new URL("../images/IMG_3063 (1).jpg", import.meta.url).href;
  const [imgErr, setImgErr] = useState(false);

  // theme detection hook (SSR-safe)
  const isDarkHook = useDarkMode();

  const borderGlowDarkProps = {
    glowColor: "40 80 80",
    backgroundColor: "#120F17",
    colors: ["#c084fc", "#f472b6", "#38bdf8"],
    borderRadius: 28,
    glowRadius: 40,
    glowIntensity: 1,
    coneSpread: 25,
    edgeSensitivity: 30,
    animated: false,
  } as const;

  const borderGlowLightProps = {
    glowColor: "120 60 220",
    backgroundColor: "rgba(255,255,255,0.72)",
    colors: ["#7C3AED", "#a855f7", "#818cf8"],
    borderRadius: 28,
    glowRadius: 50,
    glowIntensity: 0.85,
    coneSpread: 25,
    edgeSensitivity: 30,
    animated: false,
  } as const;

  // Periodic random interactive simulation effect
  useEffect(() => {
    const interVal = setInterval(() => {
      // Simulate random peer syncing count fluctuations
      setMockCollaboratorCount((prev) => {
        const next = prev + (Math.random() > 0.5 ? 1 : -1);
        return Math.max(2, Math.min(6, next));
      });
    }, 8000);
    return () => clearInterval(interVal);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const isResetPath = window.location.pathname.includes("reset-password");
    const isVerifyPath = window.location.pathname.includes("verify-email");

    if (token && isResetPath) {
      setResetConfirmToken(token);
      setAuthMode("reset-confirm");
      setIsAuthOpen(true);
      window.history.replaceState({}, "", "/");
    } else if (token && isVerifyPath) {
      setIsAuthOpen(true);
      setLoading(true);
      apiFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Verification failed.");
          }
          onAuthSuccess(data.user || data);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
      window.history.replaceState({}, "", "/");
    }
  }, [onAuthSuccess]);

  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Isolate Focus timer simulation tick
  useEffect(() => {
    if (!focusStatusActive) {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
      return;
    }

    focusIntervalRef.current = setInterval(() => {
      setFocusCounterSeconds((prev) => (prev > 0 ? prev - 1 : focusSelectedPeriod * 60));
    }, 1000);

    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
    };
  }, [focusStatusActive, focusSelectedPeriod]);

  const toggleFocusStatus = () => {
    if (focusStatusActive && focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }
    setFocusStatusActive((active) => !active);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    setDemoChatMessages((prev) => [
      ...prev,
      { id: Date.now(), user: "You (Guest)", text: typedMessage },
    ]);
    setTypedMessage("");
  };

  const formatLockoutMessage = (seconds: number) => {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return `Account locked — try again in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");
    setIsPermanentLock(false);
    setLockoutSeconds(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("No internet connection");
      return;
    }

    setLoading(true);

    try {
      if (authMode === "reset-confirm") {
        if (!resetConfirmToken || !password.trim()) {
          throw new Error("Please enter your new password.");
        }
        if (!isPasswordStrong(password)) {
          throw new Error("Password does not meet all security requirements.");
        }

        const response = await apiFetch("/api/auth/reset-password/confirm", {
          method: "POST",
          body: JSON.stringify({ token: resetConfirmToken, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.errors?.join(" ") || data.error || "Failed to reset password.");
        }
        setResetSuccess("Password updated. You can now sign in.");
        setAuthMode("login");
        setPassword("");
        setResetConfirmToken("");
      } else if (authMode === "reset") {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }

        const response = await apiFetch("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("text/html")) {
            const text = await response.text();
            throw new Error(
              "Server returned HTML instead of JSON. Is the backend running? " + text.slice(0, 200)
            );
          }
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to reset password.");
        }
        setResetSuccess(data.message || "If that email exists, a reset link will be sent.");
        setAuthMode("login");
        setPassword("");
      } else if (authMode === "signup") {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error("Please fill out all signup fields.");
        }
        if (!isPasswordStrong(password)) {
          throw new Error("Password does not meet all security requirements.");
        }

        const response = await apiFetch("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("text/html")) {
            const text = await response.text();
            throw new Error(
              "Server returned HTML instead of JSON. Is the backend running? " + text.slice(0, 200)
            );
          }
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.errors?.join(" ") || data.error || "Failed to establish workspace account."
          );
        }
        if (data.requiresVerification) {
          setResetSuccess(data.message || "Check your email to verify your account.");
          setAuthMode("login");
        } else {
          onAuthSuccess(data.user || data);
        }
      } else {
        // Login flow
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter your email and password.");
        }

        let response: Response;
        try {
          response = await apiFetch(
            "/api/auth/login",
            {
              method: "POST",
              body: JSON.stringify({ email, password }),
            },
            { retryOn429: false }
          );
        } catch {
          throw new Error("Server unavailable — please try again later");
        }

        const ct = response.headers.get("content-type") || "";
        if (ct.includes("text/html")) {
          const text = await response.text();
          throw new Error(
            "Server returned HTML instead of JSON. Is the backend running? " + text.slice(0, 200)
          );
        }

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 429 && data.retryAfterSeconds) {
            setLockoutSeconds(data.retryAfterSeconds);
            setError(formatLockoutMessage(data.retryAfterSeconds));
            return;
          }
          if (response.status === 403 && data.code === "ACCOUNT_PERMANENTLY_LOCKED") {
            setIsPermanentLock(true);
            setError(data.error || "Account permanently locked — contact support");
            return;
          }
          throw new Error(data.error || "Invalid email or password");
        }
        onAuthSuccess(data.user || data);
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch")) {
        setError("Server unavailable — please try again later");
      } else {
        setError(err.message || "Connecting to database failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const completedCount = demoCompletedSteps.filter(Boolean).length;
  const percentComplete = Math.round((completedCount / demoCompletedSteps.length) * 100);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden font-sans selection:bg-[#5C27FE]/20 ${darkMode ? "dark bg-[#0a0a14] text-gray-100" : "bg-[#FAFBFD] text-gray-900"} scroll-smooth`}
    >
      {/* Sleek Mesh Aura Gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#5C27FE]/15 to-[#0EA5E9]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#FF4D4D]/10 to-[#FFB020]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#5C27FE]/10 to-[#FF4D4D]/5 blur-[130px] pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-gray-200/40 dark:border-white/5 bg-white/60 dark:bg-slate-950/60 transition-all duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo element */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#5C27FE]/60 rounded-full"
            aria-label="Scroll to top"
          >
            <img
              src={logoImage}
              alt="NewDay logo"
              className="h-24 w-24 object-contain cursor-pointer"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-600 dark:text-gray-400">
            <a
              href="#features"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("features");
              }}
              className="hover:text-[#5C27FE] dark:hover:text-[#a085ff] transition-colors"
            >
              Features
            </a>
            <a
              href="#simulator"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("simulator");
              }}
              className="hover:text-[#5C27FE] dark:hover:text-[#a085ff] transition-colors"
            >
              Interactive Demo
            </a>
            <a
              href="#capabilities"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection("capabilities");
              }}
              className="hover:text-[#5C27FE] dark:hover:text-[#a085ff] transition-colors"
            >
              Bento Specs
            </a>
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 py-0.5 px-2 rounded-full border border-gray-200/40 dark:border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                Production Live
              </span>
            </div>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-250/50 dark:border-white/5 hover:border-[#5C27FE]/40 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer transition-all"
              title={darkMode ? "Switch to Light" : "Switch to Dark"}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {currentUser ? (
              <>
                <span className="hidden lg:inline-flex text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Welcome,{" "}
                  <strong className="text-gray-900 dark:text-white ml-1">{currentUser.name}</strong>
                </span>
                <button
                  onClick={onEnterDashboard}
                  className="text-xs font-bold px-4.5 py-2 rounded-xl bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] text-white hover:opacity-95 shadow-md shadow-[#5C27FE]/20 hover:scale-[1.02] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Desk</span>
                  <ChevronRight size={13} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthOpen(true);
                  }}
                  className="hidden sm:inline-flex text-xs font-bold px-4 py-2 rounded-xl text-gray-750 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setIsAuthOpen(true);
                  }}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-tr from-[#5C27FE] to-[#a085ff] text-white hover:opacity-95 shadow-md shadow-[#5C27FE]/20 hover:shadow-lg hover:shadow-[#5C27FE]/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION (moved to landing/Hero) */}
      <Hero
        isDarkHook={isDarkHook}
        currentUser={currentUser}
        onEnterDashboard={onEnterDashboard}
        setAuthMode={setAuthMode}
        setIsAuthOpen={setIsAuthOpen}
      />

      {/* INTERACTIVE WORKSPACE SIMULATOR */}
      <section
        id="simulator"
        className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-12 lg:py-16 relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold text-[#5C27FE] dark:text-[#a085ff] uppercase tracking-widest mb-1.5 font-mono">
            Interactive Workspace Canvas
          </h2>
          <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            Experience NewDay directly in your browser
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-200 max-w-lg mx-auto mt-2">
            No credentials required to test. Use this sandbox simulation to experience our microtask
            interactions, custom statuses, and interactive layouts.
          </p>
        </div>

        {/* SIMULATOR BOARD BODY (Dense layout for small tablet/iPad, expanded on desktop/iPad Pro workspace displays) */}
        <BorderGlow
          className="rounded-[32px]"
          {...(isDarkHook
            ? {
                glowColor: "40 80 80",
                backgroundColor: "#120F17",
                colors: ["#c084fc", "#f472b6", "#38bdf8"],
                glowRadius: 40,
                glowIntensity: 1,
              }
            : {
                glowColor: "120 60 220",
                backgroundColor: "rgba(255,255,255,0.72)",
                colors: ["#7C3AED", "#a855f7", "#818cf8"],
                glowRadius: 50,
                glowIntensity: 0.85,
              })}
          borderRadius={32}
          coneSpread={34}
          animated={true}
        >
          <div className="rounded-3xl border border-gray-250/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Simulator Sidebar (4 cols) */}
            <div className="md:col-span-4 p-4.5 md:p-5 lg:p-8 border-b md:border-b-0 md:border-r border-gray-200/60 dark:border-white/5 bg-gray-50/50 dark:bg-black/10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    Sandbox Controls
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-[#5C27FE] dark:text-[#a085ff] font-bold">
                    Simulator v1.4
                  </span>
                </div>

                {/* simulated options */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedLayout(simulatedLayout === "desktop" ? "mobile" : "desktop")
                    }
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left bg-white dark:bg-slate-950/60 border border-gray-200/50 dark:border-white/5 hover:border-[#5C27FE]/30 transition-all shadow-xs cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {simulatedLayout === "desktop" ? (
                        <Monitor size={14} className="text-[#5C27FE]" />
                      ) : (
                        <Smartphone size={14} className="text-[#0EA5E9]" />
                      )}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        Device Render Mode
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                      {simulatedLayout}
                    </span>
                  </button>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/40 border border-gray-200/40 dark:border-white/5 space-y-2">
                    <span className="block text-[10px] font-bold text-gray-400">
                      Collaborator Halo Counter
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Simulate Peer Cursors
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMockCollaboratorCount((prev) => Math.max(1, prev - 1))}
                          className="w-6 h-6 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-[13px] text-gray-500 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-gray-800 dark:text-white">
                          {mockCollaboratorCount}
                        </span>
                        <button
                          onClick={() => setMockCollaboratorCount((prev) => Math.min(8, prev + 1))}
                          className="w-6 h-6 rounded bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-[13px] text-gray-500 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card visual configuration */}
                <div className="space-y-2 pt-3 border-t border-gray-200/40 dark:border-white/5">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Card Properties
                  </span>

                  {/* priority select */}
                  <div className="flex gap-1.5 bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setDemoSelectedPriority(p)}
                        className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md capitalize transition-all cursor-pointer ${
                          demoSelectedPriority === p
                            ? p === "high"
                              ? "bg-[#FF4D4D] text-white shadow-sm"
                              : p === "medium"
                                ? "bg-[#FFB020] text-white shadow-sm"
                                : "bg-emerald-500 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sandbox details */}
              <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Activity size={12} className="text-[#0EA5E9]" />
                  <span className="font-mono text-[10px]">Sync Status: 24ms latency</span>
                </div>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthOpen(true);
                  }}
                  className="w-full text-xs font-bold py-2.5 rounded-xl bg-gradient-to-tr from-[#5C27FE]/10 to-[#5C27FE]/20 text-[#5C27FE] dark:text-[#a085ff] border border-[#5C27FE]/20 hover:bg-[#5C27FE] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Access Production Workspace</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Simulated Device Sandbox Display (8 cols) */}
            <div className="md:col-span-8 p-4.5 md:p-6 lg:p-10 flex flex-col justify-between bg-white dark:bg-slate-950/30">
              <div>
                {/* Header inside device */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFB020]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-gray-400 ml-2">
                      https://newday.desk/sandbox-canvas
                    </span>
                  </div>

                  {/* Device mock dynamic peers */}
                  <div className="flex items-center -space-x-1.5">
                    {Array.from({ length: mockCollaboratorCount }).map((_, i) => {
                      const colors = [
                        "bg-[#5C27FE]",
                        "bg-[#0EA5E9]",
                        "bg-[#FF4D4D]",
                        "bg-[#FFB020]",
                        "bg-emerald-500",
                        "bg-pink-500",
                      ];
                      const chosenColor = colors[i % colors.length];
                      return (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-full ${chosenColor} flex items-center justify-center text-[7px] font-bold text-white border-2 border-white dark:border-slate-900 ring-1 ring-offset-1 ring-indigo-500/20`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      );
                    })}
                    <div className="text-[8px] font-bold pl-2 text-indigo-500 animate-pulse">
                      Live peers
                    </div>
                  </div>
                </div>

                {/* LIVING NOTECARD SIMULATION COMPONENT */}
                <div className="max-w-md mx-auto space-y-4">
                  {/* Active simulating mockup notecard */}
                  <div
                    className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                      demoSelectedPriority === "high"
                        ? "border-[#FF4D4D]/25 bg-[#FF4D4D]/[0.02] shadow-md shadow-[#FF4D4D]/5"
                        : demoSelectedPriority === "medium"
                          ? "border-[#FFB020]/25 bg-[#FFB020]/[0.02] shadow-md shadow-[#FFB020]/5"
                          : "border-emerald-500/25 bg-emerald-500/[0.02] shadow-md shadow-emerald-500/5"
                    }`}
                  >
                    {/* tag + indicators */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold font-mono uppercase bg-[#5C27FE]/15 text-[#5C27FE] dark:text-[#a085ff] px-2 py-0.5 rounded-md">
                          #marketing-launch
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-pulse" />
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          demoSelectedPriority === "high"
                            ? "bg-[#FF4D4D]/10 text-[#FF4D4D]"
                            : demoSelectedPriority === "medium"
                              ? "bg-[#FFB020]/10 text-[#FFB020]"
                              : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {demoSelectedPriority.toUpperCase()} PRIORITY
                      </span>
                    </div>

                    {/* title inside card */}
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2 leading-tight flex items-center gap-2">
                      <span>Construct interactive desktop sandbox mockup</span>
                      <span className="text-[10px] font-mono text-gray-400 font-normal hover:underline cursor-pointer">
                        ⌘+E
                      </span>
                    </h3>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                      Coordinate dynamic microtask checkboxes. Check off the steps below to watch
                      the custom live progress metrics update in synchronized speed.
                    </p>

                    {/* interactive checkboxes */}
                    <AnimatedList className="space-y-2" delay={1500}>
                      {demoCompletedSteps.map((completed, index) => {
                        const labels = [
                          "Construct responsive glass structures",
                          "Mount Firestore server-side security logic",
                          "Add keyboard triggers reference drawer",
                        ];
                        return (
                          <div
                            key={index}
                            onClick={() => {
                              const copy = [...demoCompletedSteps];
                              copy[index] = !copy[index];
                              setDemoCompletedSteps(copy);
                            }}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border border-transparent hover:bg-gray-100/60 dark:hover:bg-white/5 cursor-pointer transition-all ${
                              completed ? "opacity-70" : ""
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                completed
                                  ? "bg-[#5C27FE] border-[#5C27FE] text-white"
                                  : "border-gray-300 dark:border-white/20 bg-transparent"
                              }`}
                            >
                              {completed && <Check size={11} />}
                            </div>
                            <span
                              className={`text-xs font-medium text-gray-700 dark:text-gray-300 leading-none select-none ${
                                completed ? "line-through text-gray-400" : ""
                              }`}
                            >
                              {labels[index]}
                            </span>
                          </div>
                        );
                      })}
                    </AnimatedList>

                    {/* Progress bar metrics indicator */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-gray-400">
                          PROGRESS METRICS:
                        </span>
                        <span className="text-xs font-mono font-bold text-[#5C27FE] dark:text-[#a085ff]">
                          {percentComplete}%
                        </span>
                      </div>

                      <div className="w-24 h-1.5 bg-gray-150 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5C27FE] to-[#0EA5E9] transition-all duration-300"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    </div>

                    {/* Simulated Dynamic Halo cursor pointing at box */}
                    <div className="absolute top-[80%] right-[30%] pointer-events-none animate-bounce">
                      <div className="flex items-center gap-1.5 bg-[#FF4D4D] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg ring-1 ring-white/20">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        <span>Sarah editing...</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Peer Active Live Chat widget */}
                  <div className="p-4 rounded-xl border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <MessageSquare size={12} className="text-[#0EA5E9]" />
                      <span className="text-[10px] font-extrabold text-gray-400">
                        COORDINATION CHAT CHANNEL (#desk-synergy)
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-24 overflow-y-auto no-scrollbar text-[11px] mb-2">
                      {demoChatMessages.map((m) => (
                        <div key={m.id} className="flex gap-1.5 items-baseline">
                          <span className="font-bold text-gray-700 dark:text-gray-300 shrink-0">
                            {m.user}:
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">{m.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mini input */}
                    <form onSubmit={handleSendMessage} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Type simulated peer message..."
                        value={typedMessage}
                        onChange={function (e) {
                          setTypedMessage(e.target.value);
                        }}
                        className="flex-1 text-[11px] bg-white dark:bg-black/20 text-gray-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 focus:outline-none focus:border-[#5C27FE]"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#5C27FE] text-white cursor-pointer hover:bg-[#451ccf]"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Simulated Keyboard command overlays */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-gray-400 font-semibold font-mono">
                <span className="flex items-center gap-1">
                  <Command size={10} /> ⌘+N (New)
                </span>
                <span className="flex items-center gap-1">
                  <Command size={10} /> ⌘+P (Command Console)
                </span>
                <span className="flex items-center gap-1">
                  <Command size={10} /> ⌘+K (Search Desk)
                </span>
                <span className="text-[9px] font-bold bg-[#FFB020]/10 text-[#FFB020] px-2 py-0.5 rounded uppercase">
                  Full Interactive Sandbox
                </span>
              </div>
            </div>
          </div>
        </BorderGlow>
      </section>

      {/* DETAILED BENTO GRID CAPABILITIES */}
      <section
        id="capabilities"
        className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold text-[#5C27FE] dark:text-[#a085ff] uppercase tracking-widest mb-1.5 font-mono">
            Bento Framework Attributes
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
            Why developers coordinate on NewDay
          </p>
          <p className="text-xs text-slate-650 dark:text-slate-200 max-w-lg mx-auto mt-2">
            Durable collaborative architecture designed prioritizing rendering metrics, real
            interaction state, and zero empty simulated screens.
          </p>
        </div>

        {/* Bento Board Layout (Grid spacing is densified on small tablets/iPads, expanded on large workspace monitors) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Bento Card: Real-time Multi-user Persistence (7 cols) */}
          <div className="md:col-span-7 p-5 md:p-6 lg:p-10 rounded-3xl border border-gray-250/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#5C27FE]/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5C27FE]/5 via-transparent to-[#0EA5E9]/5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-[#5C27FE]/5 blur-3xl group-hover:bg-[#5C27FE]/10 transition-colors pointer-events-none" />

            <div className="space-y-3 lg:space-y-5 pb-6 lg:pb-10">
              <div className="p-2 w-max rounded-lg bg-[#5C27FE]/15 text-[#5C27FE]">
                <Zap size={15} />
              </div>
              <h3 className="font-extrabold text-lg lg:text-xl text-slate-950 dark:text-white leading-tight">
                No Mockups. Secure Server-Side Firebase Synchronization.
              </h3>
              <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-100 leading-relaxed font-normal">
                Most task templates use mock database states that reset on page reload. NewDay
                builds an actual server-side SQLite/Firestore bridging sync pipeline, allowing team
                actions to persist, synchronize, and update dynamically in under 30ms latency.
              </p>
            </div>

            {/* Visual preview */}
            <div className="pt-4 border-t border-gray-150/40 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono">
              <span className="font-bold flex items-center gap-1.5 text-[#5C27FE] dark:text-[#a085ff]">
                <CheckCircle2 size={12} /> SECURE CLIENT ADAPTER
              </span>
              <span>Merge-Patch Set Writing</span>
            </div>
          </div>

          {/* Bento Card: Responsive Dual Layout Architecture (5 cols) */}
          <div className="md:col-span-5 p-5 md:p-6 lg:p-10 rounded-3xl border border-gray-250/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#0EA5E9]/30 transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-36 h-36 rounded-full bg-[#0EA5E9]/5 blur-3xl pointer-events-none" />

            <div className="space-y-3 lg:space-y-5 pb-5 lg:pb-8">
              <div className="p-2 w-max rounded-lg bg-[#0EA5E9]/15 text-[#0EA5E9]">
                <Layers size={15} />
              </div>
              <h3 className="font-extrabold text-lg lg:text-xl text-slate-950 dark:text-white leading-tight">
                Responsive Layout Tuning
              </h3>
              <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-100 leading-relaxed font-normal">
                Choose how your screen organizes itself. Switch natively between an iOS-inspired
                bottom floating system-dock or a fluid top horizontal navigation array. Perfect for
                tablets, phones, and full desktop monitors.
              </p>
            </div>

            {/* Dynamic toggler preview */}
            <div className="flex gap-2 p-1.5 rounded-lg bg-gray-100 dark:bg-black/40 text-[10px] lg:text-xs font-bold w-full">
              <span className="flex-1 py-1 px-2.5 rounded text-center bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs">
                Bottom Dock
              </span>
              <span className="flex-1 py-1 px-2.5 rounded text-center text-slate-500 dark:text-slate-400">
                Top Navigation
              </span>
            </div>
          </div>

          {/* Bento Card: Gemini AI Curriculum Roadmap (5 cols) */}
          <div className="md:col-span-5 p-5 md:p-6 lg:p-10 rounded-3xl border border-gray-250/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#FF4D4D]/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-[#FF4D4D]/5 blur-3xl pointer-events-none" />

            <div className="space-y-3 lg:space-y-5 pb-5 lg:pb-8">
              <div className="p-2 w-max rounded-lg bg-[#FF4D4D]/15 text-[#FF4D4D]">
                <Award size={15} />
              </div>
              <h3 className="font-extrabold text-lg lg:text-xl text-slate-950 dark:text-white leading-tight">
                AI Mentor Roadmap Generator
              </h3>
              <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-100 leading-relaxed font-normal">
                Connect directly with our server-hosted Gemini AI models. Prompt any target learning
                concept (e.g., "Full-Stack React", "Data Structures") and receive custom modular
                roadmap guides, with checklists, priority badges, and description breakdowns.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-[#FF4D4D] font-mono mt-2">
              <span>gemini-3.5-flash standard</span>
              <span>100% Client-Safe Keys</span>
            </div>
          </div>

          {/* Bento Card: Comprehensive Team Analytics & Synergy Goals (7 cols) */}
          <div className="md:col-span-7 p-5 md:p-6 lg:p-10 rounded-3xl border border-gray-250/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#FFB020]/30 transition-all duration-300">
            <div className="absolute right-0 bottom-0 w-44 h-44 rounded-full bg-[#FFB020]/5 blur-3xl pointer-events-none" />

            <div className="space-y-3 lg:space-y-5 pb-6 lg:pb-10">
              <div className="p-2 w-max rounded-lg bg-[#FFB020]/15 text-[#FFB020]">
                <Target size={15} />
              </div>
              <h3 className="font-extrabold text-lg lg:text-xl text-slate-950 dark:text-white leading-tight">
                Comprehensive Team Analytics & Collaborative Synergy
              </h3>
              <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-100 leading-relaxed font-normal">
                Never lose track of strategic priorities. Access live stats on completed daily
                streaks, overdue task limits, and active peer participation tracks. Complete
                milestone targets alongside peers inside a sleek collaborative matrix.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-150/40 dark:border-white/5 flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Check size={12} className="text-[#FFB020]" /> Streaks Tracker
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={12} className="text-[#FFB020]" /> Overdue Protection
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC ADDITIONAL FEATURE: COLLABORATIVE CHAT CHANNEL & VISUAL INSIGHTS */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 lg:py-24 relative z-10 border-t border-gray-200/30 dark:border-white/5 bg-[#5C27FE]/[0.01]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-10 items-center">
          {/* Animated description on left */}
          <div className="md:col-span-5 space-y-4 md:space-y-5 lg:space-y-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0EA5E9]/15 text-[#0EA5E9] text-[10px] font-bold font-mono uppercase">
              <MessageSquare size={10} />
              <span>Real-Time Team Synergy</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
              Integrated Communication & Global Status Mapping
            </h2>

            <p className="text-xs lg:text-sm text-slate-805 dark:text-slate-50 leading-relaxed font-normal">
              NewDay combines actual discussion channels and customizable action slates on one
              single page. No more switching tools to ask a status. Map tasks directly to chat
              context channels so everyone stays synced in double-digit latency metrics.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-100 font-medium">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#5C27FE] rounded-full shrink-0" />
                <span>Synchronized sidebar notifications on mentions</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0EA5E9] rounded-full shrink-0" />
                <span>Custom priorities synchronized with Firestore</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                <span>Instant status tags highlighting overdue safety indicators</span>
              </li>
            </ul>
          </div>

          {/* Interactive UI card preview on right */}
          <div className="md:col-span-7 p-5 md:p-6 lg:p-10 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-gray-200/50 dark:border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#0EA5E9]/5 blur-3xl pointer-events-none" />

            <div className="space-y-3.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 font-mono">
                Live Synergy Channel Channel (#campaign-outreach)
              </span>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-gray-150/40 dark:border-white/5 hover:scale-[1.01] transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                      Alex R.{" "}
                      <span className="text-[9px] font-normal text-gray-400">10 mins ago</span>
                    </span>
                    <span className="text-[8px] font-mono bg-indigo-500/10 text-[#5C27FE] dark:text-[#a085ff] px-1.5 py-0.5 rounded font-bold">
                      Marketing Team Lead
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    Is the campaign task synced to other tablets yet? The layout fits perfectly fine
                    on standard monitors.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-gray-150/40 dark:border-white/5 hover:scale-[1.01] transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                      Sarah K.{" "}
                      <span className="text-[9px] font-normal text-gray-400">8 mins ago</span>
                    </span>
                    <span className="text-[8px] font-mono bg-[#FFB020]/10 text-[#FFB020] px-1.5 py-0.5 rounded font-bold">
                      Workspace Creator
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Yes! Dual responsive docking maps are fully responsive now. iPad views scale
                    down perfectly to stack navigation columns beautifully.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#5C27FE]/10 dark:bg-[#5C27FE]/15 border border-[#5C27FE]/20 text-[10px] text-indigo-500 dark:text-[#c4b5fd] font-mono font-bold flex items-center justify-between">
                  <span>🚀 SYSTEM METRIC SUMMARY:</span>
                  <span>Active Live Sync Channels: 3 Standard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <FocusAnalyticsSection
          focusCounterSeconds={focusCounterSeconds}
          focusSelectedPeriod={focusSelectedPeriod}
          focusStatusActive={focusStatusActive}
          percentComplete={percentComplete}
          onToggleFocusStatus={toggleFocusStatus}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>

      {/* FREQUENTLY ASKED QUESTIONS SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 border-t border-gray-250/30 dark:border-white/5">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-[#5C27FE] dark:text-[#a085ff] uppercase tracking-widest font-mono bg-[#5C27FE]/10 px-2.5 py-1 rounded-full border border-[#5C27FE]/20">
            Got Queries? FAQs Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white mt-3 select-none">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
            Everything you need to know about the NewDay secure full-stack collaborative tasks desk.
          </p>
        </div>

        {/* Dynamic FAQ Accordion Map list block */}
        <div className="space-y-3.5 max-w-3xl mx-auto">
          {[
            {
              q: "How does the synchronized backend database stream function?",
              a: "NewDay operates with direct server-side sync adapters mapped to standard Firebase/Firestore client routes. Whenever a task, priority element, or chat message is updated, it propagates database changes to registered peers within 24 milliseconds, bypassing mock restrictions or stale caches.",
            },
            {
              q: "Are my workspace credentials and API tokens protected?",
              a: "Security is non-negotiable. All sensitive operations, third-party connections, and the Gemini Roadmaps generation occur via server-side proxies. Your database connections are safe, as sensitive environment variables are kept hidden from client inspection protocols.",
            },
            {
              q: "Can I use the Workspace on my iPad or small Android Tablet?",
              a: "Absolutely! NewDay includes beautiful dual responsive layouts which are custom-coded to adapt seamlessly to smaller tablets. You can toggle between a floating bottom navigation dock (best for split screen) or standard top nav panels instantly.",
            },
            {
              q: "How does the AI Mentor generate modular curriculums?",
              a: "Under the hood, we query server-hosted Google Gemini models. When you supply a topic (like 'Node.js Performance Tuning'), it replies with customized sub-tasks, priority counts, description lists, and real-time guidance directly loaded as interactive cards!",
            },
            {
              q: "Is there local backup in case of connection loss?",
              a: "Yes! NewDay employs local key-value state backups. It records active tasks, channels, and preferences in your browser's persistent database block so that you never lose an item, even during server migration audits.",
            },
          ].map((item, idx) => {
            const isOpen = faqActiveIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/50 hover:border-[#5C27FE]/30 transition-all font-sans overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setFaqActiveIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4.5 sm:p-5 flex items-center justify-between gap-4 font-extrabold text-sm text-gray-900 dark:text-white cursor-pointer select-none"
                >
                  <span className="leading-tight">{item.q}</span>
                  <div
                    className={`w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-transform duration-200 shrink-0 ${isOpen ? "rotate-45 text-[#5C27FE] bg-indigo-500/10" : ""}`}
                  >
                    <Plus size={14} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ willChange: "height, opacity" }}
                    >
                      <div className="p-4.5 sm:p-5 pt-0 border-t border-gray-150/40 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-black/10">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* MEET THE FOUNDER SECTION: AKPOFURE DIEGBE */}
      <section
        id="founder"
        className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 lg:py-24 relative z-10 border-t border-gray-200/30 dark:border-white/5 bg-slate-500/[0.01]"
      >
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold text-[#5C27FE] dark:text-[#a085ff] uppercase tracking-widest font-mono bg-[#5C27FE]/10 px-2.5 py-1 rounded-full border border-[#5C27FE]/20">
            Human-Centered Design
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-3 select-none">
            Meet the Founder
          </h2>
          <p className="text-xs text-slate-650 dark:text-slate-300 max-w-lg mx-auto mt-2">
            The engineering philosophy and craft dedication behind the NewDay collaboration canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* Left Column: Founder Photo & Bio Card (5 cols) */}
          <div className="lg:col-span-12 xl:col-span-5 md:col-span-12 flex flex-col items-center">
            <BorderGlow
              className="max-w-[340px]"
              {...(isDarkHook
                ? {
                    glowColor: "40 80 80",
                    backgroundColor: "#120F17",
                    colors: ["#c084fc", "#f472b6", "#38bdf8"],
                    glowRadius: 40,
                    glowIntensity: 1,
                  }
                : {
                    glowColor: "120 60 220",
                    backgroundColor: "rgba(255,255,255,0.72)",
                    colors: ["#7C3AED", "#a855f7", "#818cf8"],
                    glowRadius: 50,
                    glowIntensity: 0.85,
                  })}
              borderRadius={28}
            >
              <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900 flex items-center justify-center group">
                {/* Image with fallback error handling */}
                {!imgErr ? (
                  <img
                    src={founderImage}
                    alt="Portrait of Akpofure Diegbe"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-[#0c0c14] text-white relative select-none">
                    {/* Ultra-premium Executive Monochrome Vector Fallback */}
                    {/* Glowing background circles */}
                    <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-[#5C27FE]/20 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-[#0EA5E9]/15 blur-2xl pointer-events-none" />

                    {/* Decorative Archway Grid Representation to match Image 1's composition */}
                    <div
                      className="absolute inset-x-8 top-12 bottom-20 rounded-t-full border border-white/[0.04] bg-white/[0.01] flex items-end justify-center pointer-events-none"
                      id="arch-frame"
                    >
                      {/* Car Silhouette Grid representation centered at the bottom */}
                      <div className="w-24 h-12 border-t border-x border-white/[0.08] rounded-t-xl bg-white/[0.02] flex flex-col justify-end p-1.5 opacity-60">
                        <div className="flex justify-between text-[6px] font-mono text-white/20 select-none">
                          <span>L-350</span>
                          <span>● ●</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between font-mono text-[9px] text-white/40 border-b border-white/5 pb-2 relative z-10"
                      id="header-spec"
                    >
                      <span>PORTRAIT GRAPHIC</span>
                      <span>AD.MONOCHROME.F1</span>
                    </div>

                    {/* Silhouette Portrait & Initials in premium type */}
                    <div
                      className="my-auto flex flex-col items-center justify-center relative z-10 space-y-3"
                      id="fallback-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5C27FE]/30 to-[#0EA5E9]/20 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-350">
                        <span className="font-extrabold text-2xl tracking-tight text-white font-sans bg-clip-text">
                          AD
                        </span>
                      </div>
                      <span className="text-[10px] font-medium tracking-widest text-[#a085ff] dark:text-[#a085ff] uppercase font-mono">
                        Akpofure Diegbe
                      </span>
                      <span className="text-[8px] text-gray-400 font-mono italic text-center max-w-xs">
                        Ready to render portrait: place "founder.png" in your project files to
                        display.
                      </span>
                    </div>

                    <div
                      className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40 relative z-10"
                      id="footer-spec"
                    >
                      <span>LEXUS INSIDE BLUE ARCH</span>
                      <span>100% HI-FIDELITY</span>
                    </div>
                  </div>
                )}
              </div>
            </BorderGlow>

            <div className="text-center mt-3" id="profile-tag">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-slate-400 font-mono block">
                Chief Architect & Engineer
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                Akpofure Diegbe
              </span>
            </div>
          </div>

          {/* Right Column: Founder Interactive Core Narratives (7 cols) */}
          <div className="lg:col-span-12 xl:col-span-7 md:col-span-12 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5C27FE]/10 dark:bg-[#5C27FE]/15 text-[#5C27FE] dark:text-[#a085ff] text-[10px] font-bold font-mono uppercase">
                <Sparkles size={10} />
                <span>Philosophical Alignment</span>
              </div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-950 dark:text-white leading-tight">
                High-Craft Engineering
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Tap each card tab to see how Akpofure's core goals shape NewDay's visual and
                performance boundaries.
              </p>
            </div>

            {/* Selector Tab Dock */}
            <div
              className="flex gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-gray-200/50 dark:border-white/5 text-[11px] font-bold w-full select-none"
              id="selector-dock"
            >
              <button
                type="button"
                id="btn-tab-vision"
                onClick={() => setFounderTab("vision")}
                className={`flex-1 py-2 px-3 rounded-xl text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${founderTab === "vision" ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-gray-200/40 dark:border-white/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                <span>Vision</span>
              </button>
              <button
                type="button"
                id="btn-tab-journey"
                onClick={() => setFounderTab("journey")}
                className={`flex-1 py-2 px-3 rounded-xl text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${founderTab === "journey" ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-gray-200/40 dark:border-white/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                <span>The Craft Journey</span>
              </button>
              <button
                type="button"
                id="btn-tab-manifest"
                onClick={() => setFounderTab("manifest")}
                className={`flex-1 py-2 px-3 rounded-xl text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${founderTab === "manifest" ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-gray-200/40 dark:border-white/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                <span>The Manifesto</span>
              </button>
            </div>

            {/* Interactive Dynamic Text Body with Motion */}
            <div
              className="min-h-[220px] rounded-3xl p-5 md:p-6 lg:p-7 border border-gray-200/60 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md relative overflow-hidden"
              id="tab-panels"
            >
              <AnimatePresence mode="wait">
                {founderTab === "vision" && (
                  <motion.div
                    key="vision"
                    id="panel-vision"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-950 dark:text-white leading-snug">
                      "We didn't build another task list. We built a workspace that respects your
                      attention."
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-705 dark:text-slate-150 leading-relaxed font-normal">
                      NewDay was born out of a simple frustration: modern team tools are noisy,
                      cluttered with unnecessary simulated states, and prioritize visual busywork
                      over deep work. Akpofure set out to construct a durable, zero-mock
                      collaboration desktop. A workspace that binds discussion channels to task
                      states under 30ms, letting you mute outer workspace distractions and execute
                      in perfect mental flow.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2" id="badges-vision">
                      <span className="px-2 py-1 rounded bg-[#5C27FE]/10 dark:bg-[#5C27FE]/15 text-[#5C27FE] dark:text-[#a085ff] text-[10px] font-bold font-mono">
                        [Latency-Focused]
                      </span>
                      <span className="px-2 py-1 rounded bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/15 text-[#0EA5E9] dark:text-[#38BDF8] text-[10px] font-bold font-mono">
                        [30ms Sync Loops]
                      </span>
                      <span className="px-2 py-1 rounded bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                        [Zero Mockups]
                      </span>
                    </div>
                  </motion.div>
                )}

                {founderTab === "journey" && (
                  <motion.div
                    key="journey"
                    id="panel-journey"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-950 dark:text-white leading-snug">
                      "An obsession with human-computer interaction, visual typography, and tactile
                      feedback."
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-705 dark:text-slate-150 leading-relaxed font-normal">
                      Digital tools should feel as tactile and responsive as premium physical
                      furniture. NewDay is a deep study in structural ergonomics and visual balance:
                      pairing robust server-side synchronization with high-contrast UI layouts,
                      generous negative space, and responsive bento-grids tuned precisely for large
                      tablets and desktop monitors.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2" id="badges-journey">
                      <span className="px-2 py-1 rounded bg-[#5C27FE]/10 dark:bg-[#5C27FE]/15 text-[#5C27FE] dark:text-[#a085ff] text-[10px] font-bold font-mono">
                        [Design Ergonomics]
                      </span>
                      <span className="px-2 py-1 rounded bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[10px] font-bold font-mono">
                        [Tactile Transitions]
                      </span>
                      <span className="px-2 py-1 rounded bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/15 text-[#0EA5E9] dark:text-[#38BDF8] text-[10px] font-bold font-mono">
                        [Slate UI Theme]
                      </span>
                    </div>
                  </motion.div>
                )}

                {founderTab === "manifest" && (
                  <motion.div
                    key="manifest"
                    id="panel-manifest"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-950 dark:text-white leading-snug">
                      "Software must be fast. It must be honest. It must be beautiful."
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-705 dark:text-slate-150 leading-relaxed font-normal">
                      The modern web has become full of slow loading indicators and speculative
                      success states. NewDay operates on two hard truths: first, latency matters
                      more than features—low-latency sync cycles are a requirement, not a bonus; and
                      second, architectural honesty builds trust—never fake database successes; let
                      the structural code speak for itself.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2" id="badges-manifest">
                      <span className="px-2 py-1 rounded bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-bold font-mono">
                        [TypeScript Strictness]
                      </span>
                      <span className="px-2 py-1 rounded bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-bold font-mono">
                        [Secure Firestore Schemas]
                      </span>
                      <span className="px-2 py-1 rounded bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/15 text-[#0EA5E9] dark:text-[#38BDF8] text-[10px] font-bold font-mono">
                        [Absolute Dev Honesty]
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Connect block with Founder */}
            <div
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4.5 rounded-2xl bg-slate-50 dark:bg-black/10 border border-gray-150/40 dark:border-white/5 text-xs text-slate-650 dark:text-slate-350"
              id="founders-connect-bar"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5C27FE] animate-pulse" />
                <span className="font-semibold text-slate-800 dark:text-white">
                  Active hotline support:
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-900 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded text-slate-950 dark:text-white font-bold select-all">
                  09059003049
                </span>
              </div>
              <div className="flex gap-2">
                <a
                  type="button"
                  id="link-twitter"
                  href="https://x.com/akpofureziter?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="px-3 py-1.5 rounded-lg border border-gray-250 dark:border-white/10 hover:border-[#5C27FE] hover:text-[#5C27FE] transition-colors flex items-center gap-1 cursor-pointer bg-white/40 dark:bg-transparent font-medium"
                >
                  <Twitter size={11} />
                  <span>Twitter</span>
                </a>
                <a
                  type="button"
                  id="link-linkedin"
                  href="https://www.linkedin.com/in/akpofure-diegbe-9760b8303/"
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="px-3 py-1.5 rounded-lg border border-gray-250 dark:border-white/10 hover:border-[#5C27FE] hover:text-[#5C27FE] transition-colors flex items-center gap-1 cursor-pointer bg-white/40 dark:bg-transparent font-medium"
                >
                  <Linkedin size={11} />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Grid Play section removed per user request */}

      {/* INTERACTIVE COMPREHENSIVE ROADMAP FOOTER CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
        <BorderGlow
          className="rounded-[32px]"
          {...(isDarkHook
            ? {
                glowColor: "40 80 80",
                backgroundColor: "#120F17",
                colors: ["#c084fc", "#f472b6", "#38bdf8"],
                glowRadius: 40,
                glowIntensity: 1,
              }
            : {
                glowColor: "120 60 220",
                backgroundColor: "rgba(255,255,255,0.72)",
                colors: ["#7C3AED", "#a855f7", "#818cf8"],
                glowRadius: 50,
                glowIntensity: 0.85,
              })}
          borderRadius={32}
        >
          <div className="p-8 sm:p-12 rounded-3xl border border-[#5C27FE]/35 bg-white/40 dark:bg-slate-900/60 bg-gradient-to-tr from-[#5C27FE]/5 via-[#0EA5E9]/5 to-transparent relative overflow-hidden">
            {/* Decorative blur elements */}
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-[#5C27FE]/15 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-[#0EA5E9]/10 blur-3xl pointer-events-none animate-pulse" />

            {/* Main content */}
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                Unlock your modular collaborative task workspace
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-lg mx-auto mt-3 leading-relaxed">
                Configure secure credentials. Create a team desk, add priorities, trigger your
                immediate AI roadmaps, and chat with peers in real-time latency.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                {currentUser ? (
                  <>
                    <button
                      onClick={onEnterDashboard}
                      className="w-full sm:w-auto text-xs font-bold px-7 py-3 rounded-2xl bg-[#5C27FE] hover:bg-[#451ccf] text-white shadow-lg shadow-[#5C27FE]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Launch Workspace Desk</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("reset");
                        setIsAuthOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs font-bold px-7 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-gray-200 border border-gray-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-850 transition-all cursor-pointer"
                    >
                      Reset Security Keys
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode("signup");
                        setIsAuthOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs font-bold px-7 py-3 rounded-2xl bg-[#5C27FE] hover:bg-[#451ccf] text-white shadow-lg shadow-[#5C27FE]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Construct Account</span>
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setIsAuthOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs font-bold px-7 py-3 rounded-2xl bg-slate-150 dark:bg-slate-950 text-slate-800 dark:text-gray-200 border border-gray-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-850 transition-all cursor-pointer"
                    >
                      Verify Credentials
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </BorderGlow>
      </section>

      {/* FOOTER METRIC BRANDING */}
      <footer className="border-t border-gray-200/40 dark:border-white/5 bg-white/30 dark:bg-slate-950/20 py-12 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 text-slate-800 dark:text-slate-200 font-medium mb-8">
          {/* Logo descriptor col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-extrabold">
                N
              </div>
              <span className="font-extrabold text-slate-950 dark:text-white text-sm">
                NewDay Desk Workspace Inc.
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-100 leading-relaxed font-normal">
              Durable collaborative task ecosystem. Syncing tasks, live feedback streams, and AI
              Roadmaps on high-fidelity visual cards.
            </p>
          </div>

          {/* Social connections links cols */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5C27FE] dark:text-[#a085ff] font-mono">
              Connect With Creator
            </h4>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://x.com/akpofureziter?s=21"
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#5C27FE]/20 dark:bg-slate-900 dark:hover:bg-[#5C27FE]/30 text-slate-800 dark:text-white hover:text-[#5C27FE] dark:hover:text-[#a085ff] border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all duration-200"
                title="Twitter / X Profile : @akpofureziter"
              >
                <Twitter size={15} />
              </a>
              <a
                href="https://www.linkedin.com/in/akpofure-diegbe-9760b8303/"
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#5C27FE]/20 dark:bg-slate-900 dark:hover:bg-[#5C27FE]/30 text-slate-800 dark:text-white hover:text-[#5C27FE] dark:hover:text-[#a085ff] border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all duration-200"
                title="LinkedIn Connection : Akpofure Diegbe"
              >
                <Linkedin size={15} />
              </a>
              <a
                href="https://akpofure-s-portfolio.vercel.app/"
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#5C27FE]/20 dark:bg-slate-900 dark:hover:bg-[#5C27FE]/30 text-slate-800 dark:text-white hover:text-[#5C27FE] dark:hover:text-[#a085ff] border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all duration-200"
                title="Live Portfolio Showcase"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          {/* Direct Support hotline desk col */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5C27FE] dark:text-[#a085ff] font-mono">
              Owner Direct Communications
            </h4>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-700 dark:text-slate-100 block font-bold">
                Immediate Telephone Endpoint:
              </span>
              <span className="text-xs font-mono font-bold text-slate-950 dark:text-white bg-slate-150 dark:bg-slate-900/90 py-1 px-2.5 rounded-lg border border-gray-350 dark:border-white/20 block w-max">
                +234 (704) 936-3914
              </span>
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-200 font-semibold">
              Assistance line monitored in real-time latency cycles.
            </div>
          </div>
        </div>

        {/* Global Bottom Credits line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-gray-200/45 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 dark:text-gray-400 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span>
              © {new Date().getFullYear()} NewDay Core Desk. Built with true full-stack rules.
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[10px]">
            <span>UTC Clock: {new Date().toISOString().slice(11, 19)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.history.pushState({}, "", "/terms");
                    window.location.reload();
                  }
                }}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] transition-all hover:scale-105 cursor-pointer"
              >
                Terms
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.history.pushState({}, "", "/privacy");
                    window.location.reload();
                  }
                }}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] transition-all hover:scale-105 cursor-pointer"
              >
                Privacy
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE SMOOTH AUTH SHEETS (SLIDEOUT DRAWER / DRAWER OVERLAY USING ANiMATEPRESENCE) */}
      <AnimatePresence>
        {isAuthOpen && (
          <>
            {/* Dark Blur Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
              style={{ willChange: "opacity" }}
            />

            {/* Auth Drawer Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0c0c16] border-l border-gray-200/50 dark:border-white/10 shadow-2xl z-50 flex flex-col justify-between p-6 overflow-y-auto"
              style={{ willChange: "transform" }}
            >
              {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm px-6 py-8">
                  <div className="w-full max-w-xs rounded-3xl bg-slate-900/95 p-6 shadow-xl shadow-black/40 border border-white/10">
                    <LogoLoader />
                    <p className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-slate-300">
                      Contacting workspace server...
                    </p>
                  </div>
                </div>
              )}
              <div>
                {/* Header Close array */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5 mb-6">
                  <div className="flex items-center gap-2">
                    <img src={logoImage} alt="NewDay logo" className="h-16 w-16 object-contain" />
                    <span className="font-extrabold text-xs tracking-tight text-gray-900 dark:text-white">
                      Workspace Gate
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAuthOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer text-xs font-mono select-none"
                  >
                    [ Close ESC ]
                  </button>
                </div>

                {/* Subtext info tabs */}
                <div className="mb-6">
                  <h2 className="font-extrabold text-xl text-gray-950 dark:text-white leading-none">
                    {authMode === "reset-confirm"
                      ? "Set New Password"
                      : authMode === "reset"
                        ? "Reset Workspace Access"
                        : authMode === "signup"
                          ? "Establish Workspace Account"
                          : "Authenticate Into Desk"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {authMode === "reset-confirm"
                      ? "Choose a strong password for your workspace account."
                      : authMode === "reset"
                        ? "Type your email and receive a secure reset link."
                        : authMode === "signup"
                          ? "Create a verified profile to get started."
                          : "Verify credentials to load your persistent project boards."}
                  </p>
                </div>

                {/* AUTH MAIN FORM */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-xs rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-500/20 flex gap-2 items-start shrink-0">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span>
                          {lockoutSeconds && lockoutSeconds > 0
                            ? formatLockoutMessage(lockoutSeconds)
                            : error}
                        </span>
                        {isPermanentLock && (
                          <a
                            href="mailto:support@newday.app"
                            className="block font-bold text-[#5C27FE] dark:text-[#a085ff] hover:underline"
                          >
                            Contact Support
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="p-3 text-xs rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C48C] border border-[#00C48C]/20 flex gap-2 items-start shrink-0">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <span>{resetSuccess}</span>
                    </div>
                  )}

                  {authMode === "signup" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
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
                          onChange={function (e) {
                            setName(e.target.value);
                          }}
                          className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-white pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] focus:ring-1 focus:ring-[#5C27FE]/30 transition-all font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {authMode !== "reset-confirm" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
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
                          onChange={function (e) {
                            setEmail(e.target.value);
                          }}
                          className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-white pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] focus:ring-1 focus:ring-[#5C27FE]/30 transition-all font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {authMode !== "reset" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                          {authMode === "reset-confirm"
                            ? "New Security Password"
                            : "Security Password"}
                        </label>
                        {authMode === "login" && (
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setResetSuccess("");
                              setAuthMode("reset");
                            }}
                            className="text-[10px] font-bold text-[#5C27FE] dark:text-[#a085ff] hover:underline cursor-pointer"
                          >
                            Forgot Password?
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
                          onChange={function (e) {
                            setPassword(e.target.value);
                          }}
                          className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-white pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] focus:ring-1 focus:ring-[#5C27FE]/30 transition-all font-sans"
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
                      {(authMode === "signup" || authMode === "reset-confirm") && (
                        <div className="mt-2">
                          <PasswordStrengthIndicator password={password} />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      ((authMode === "signup" || authMode === "reset-confirm") &&
                        !isPasswordStrong(password))
                    }
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 text-xs font-bold py-3.5 rounded-xl bg-[#5C27FE] hover:bg-[#4a1ee3] text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-[#5C27FE]/20 hover:shadow-lg hover:shadow-[#5C27FE]/30 cursor-pointer text-center select-none"
                  >
                    <span>
                      {loading
                        ? "Processing Workspace Server..."
                        : authMode === "reset"
                          ? "Send Reset Link"
                          : authMode === "reset-confirm"
                            ? "Update Password"
                            : authMode === "signup"
                              ? "Create Account & Load App"
                              : "Authenticate Into Workspace"}
                    </span>
                    <Sparkles size={13} />
                  </button>
                </form>
              </div>

              {/* Toggles underneath form */}
              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {authMode === "reset" || authMode === "reset-confirm"
                    ? "Remembered security keys?"
                    : authMode === "signup"
                      ? "Joined workspace already?"
                      : "Looking to start fresh?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setResetSuccess("");
                    if (authMode === "reset" || authMode === "reset-confirm") {
                      setAuthMode("login");
                    } else {
                      setAuthMode(authMode === "signup" ? "login" : "signup");
                    }
                  }}
                  className="font-bold text-[#5C27FE] dark:text-[#a085ff] hover:underline cursor-pointer"
                >
                  {authMode === "reset" || authMode === "reset-confirm"
                    ? "Sign in instead"
                    : authMode === "signup"
                      ? "Sign in instead"
                      : "Create new account"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
