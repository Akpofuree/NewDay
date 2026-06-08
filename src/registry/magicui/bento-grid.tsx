"use client";

import { cn } from "../../lib/utils";
import { ComponentType, ReactNode } from "react";

interface BentoCardProps {
  Icon?: ComponentType<{ className?: string }>;
  name: string;
  description: string;
  className?: string;
  background?: ReactNode;
  href?: string;
  cta?: string;
}

function BentoCard({
  Icon,
  name,
  description,
  className,
  background,
  href,
  cta,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group hover:border-[#5C27FE]/30 transition-all duration-300",
        className,
      )}
    >
      {background && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {background}
        </div>
      )}
      <div className="relative z-10 p-6 space-y-3">
        {Icon && (
          <div className="inline-flex p-2 rounded-lg bg-[#5C27FE]/10 text-[#5C27FE]">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="font-extrabold text-lg text-slate-950 dark:text-white leading-tight">
            {name}
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
            {description}
          </p>
        </div>
        {cta && (
          <a
            href={href}
            className="inline-flex items-center text-xs font-bold text-[#5C27FE] dark:text-[#a085ff] hover:underline"
          >
            {cta} →
          </a>
        )}
      </div>
    </div>
  );
}

interface BentoGridProps {
  className?: string;
  children?: ReactNode;
}

function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 lg:gap-8 max-w-7xl mx-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { BentoCard, BentoGrid };
