"use client";

import type React from "react";
import { cn } from "../../lib/utils";

interface PulsatingButtonProps {
  children: React.ReactNode;
  className?: string;
  pulseColor?: string;
  buttonClassName?: string;
  [key: string]: any;
}

export default function PulsatingButton({
  children,
  className,
  pulseColor = "rgba(92, 39, 254, 0.5)",
  buttonClassName,
  ...props
}: PulsatingButtonProps) {
  return (
    <>
      <button
        className={cn(
          "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none",
          className,
        )}
        {...props}
      >
        <span
          className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0 340deg, ${pulseColor} 360deg)`,
          }}
        />
        <span
          className={cn(
            "inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-1 text-sm font-medium backdrop-blur-3xl transition-colors",
            buttonClassName,
          )}
        >
          {children}
        </span>
      </button>
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
