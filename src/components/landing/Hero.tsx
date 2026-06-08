import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Play, Check, ArrowRight } from "lucide-react";
import Particles from "../Particles";
import Galaxy from "../Galaxy";
import { User } from "../../types";
import PulsatingButton from "../../registry/magicui/pulsating-button";

interface HeroProps {
  isDarkHook: boolean;
  currentUser?: User | null;
  onEnterDashboard?: () => void;
  setAuthMode: (m: "login" | "signup" | "reset") => void;
  setIsAuthOpen: (v: boolean) => void;
}

export default function Hero({
  isDarkHook,
  currentUser,
  onEnterDashboard,
  setAuthMode,
  setIsAuthOpen,
}: HeroProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      style={
        isDarkHook
          ? {
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(92, 39, 254, 0.07), transparent 40%)`,
            }
          : undefined
      }
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-center relative overflow-hidden z-10"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {isDarkHook ? (
          <>
            <Galaxy
              hueShift={240}
              density={1.35}
              glowIntensity={0.55}
              saturation={0.8}
              mouseRepulsion={false}
              mouseInteraction={false}
              twinkleIntensity={0.35}
              rotationSpeed={0.06}
              transparent={true}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-slate-950/34" />
          </>
        ) : (
          <>
            <Particles
              particleCount={980}
              particleSpread={28}
              speed={0.1}
              particleColors={["#312E81", "#0F766E", "#B91C1C"]}
              moveParticlesOnHover={true}
              particleHoverFactor={1}
              alphaParticles={true}
              particleBaseSize={260}
              sizeRandomness={1.4}
              cameraDistance={20}
              disableRotation={false}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#eff6ff]/35 via-white/55 to-[#f8fafc]/60" />
            <div className="absolute left-1/2 top-[-5%] h-72 w-72 -translate-x-1/2 rounded-full bg-[#c7d2fe]/25 blur-3xl" />
            <div className="absolute right-10 top-20 h-56 w-56 rounded-full bg-[#dbeafe]/30 blur-3xl" />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5C27FE]/15 dark:bg-[#5C27FE]/20 text-[#5C27FE] dark:text-[#c4b5fd] text-[11px] font-bold tracking-tight mb-6 border border-[#5C27FE]/20"
      >
        <Sparkles
          size={11}
          className="text-[#5C27FE] dark:text-indigo-300 animate-spin"
          style={{ animationDuration: "3s" }}
        />
        <span>Supernotes Inspired Dynamic Card Architecture</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-slate-950 dark:text-white max-w-4xl mx-auto select-none"
      >
        Free your thoughts.
        <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5C27FE] via-[#0EA5E9] to-[#FF4D4D] animate-gradient">
          Organize with modular efficiency.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-sm sm:text-base text-gray-700 dark:text-gray-200 max-w-2xl mx-auto mt-6 leading-relaxed"
      >
        Welcome to{" "}
        <span className="font-bold text-indigo-650 dark:text-indigo-400">
          NewDay Desk
        </span>{" "}
        — the fastest, collaborative, database-synced task workspace. Rebuilt
        with zero mockups, live synchronized boards, customized tablet/mobile
        layouts, and AI-powered learning guides.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 select-none"
      >
        {currentUser ? (
          <button
            onClick={onEnterDashboard}
            className="w-full sm:w-auto text-sm font-bold px-7 py-3.5 rounded-2xl bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] hover:opacity-95 text-white hover:scale-[1.02] shadow-lg shadow-[#5C27FE]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Enter Active Workspace Dashboard</span>
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            onClick={() => {
              setAuthMode("signup");
              setIsAuthOpen(true);
            }}
            className="w-full sm:w-auto text-sm font-bold px-7 py-3.5 rounded-2xl bg-[#5C27FE] hover:bg-[#4a1ee3] text-white hover:scale-[1.02] shadow-lg shadow-[#5C27FE]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Create Your Free Desk</span>
            <ArrowRight size={15} />
          </button>
        )}

        <PulsatingButton
          type="button"
          onClick={() =>
            document
              .getElementById("simulator")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="w-full sm:w-auto text-xs font-bold"
          buttonClassName="rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-250/50 dark:border-white/10 transition-all flex items-center justify-center gap-2 px-6 py-3.5"
          pulseColor="rgba(92, 39, 254, 0.5)"
        >
          <Play
            size={11}
            className="fill-current text-gray-600 dark:text-gray-400"
          />
          <span>Interactive Simulator</span>
        </PulsatingButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="flex items-center justify-center gap-6 mt-10 text-[11px] text-gray-400 dark:text-gray-500 font-semibold font-mono"
      >
        <span className="flex items-center gap-1.5">
          <Check size={12} className="text-[#5C27FE]" /> ZERO MOCK DATA
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={12} className="text-[#0EA5E9]" /> FIRESTORE PERMANENCY
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={12} className="text-emerald-500" /> DUAL LAYOUT DESIGN
        </span>
      </motion.div>
    </section>
  );
}
