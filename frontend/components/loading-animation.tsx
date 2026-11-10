"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Brain,
  FileSearch,
  Scale,
  Gauge,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VERIFICATION_STEPS, STEP_LABELS, VerificationStep } from "@/types";

const STEP_ICONS: Record<VerificationStep, React.ElementType> = {
  extract_claims: FileSearch,
  search_sources: Search,
  analyze_evidence: Brain,
  reason: Scale,
  score_confidence: Gauge,
  generate_report: FileText,
};

interface LoadingAnimationProps {
  currentStep?: VerificationStep;
}

export function LoadingAnimation({ currentStep = "extract_claims" }: LoadingAnimationProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const stepIndex = VERIFICATION_STEPS.indexOf(currentStep);
    if (stepIndex >= 0) {
      setActiveIndex(stepIndex);
    }
  }, [currentStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev < VERIFICATION_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-12 animate-in fade-in duration-500">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-600" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldPulse />
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        {VERIFICATION_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[step];
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-500",
                isActive && "bg-indigo-50 dark:bg-indigo-950/50 scale-105",
                isComplete && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-indigo-600 text-white",
                  isComplete && "bg-emerald-500 text-white",
                  !isActive && !isComplete && "bg-gray-200 text-gray-500 dark:bg-gray-800"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive && "text-indigo-700 dark:text-indigo-300",
                  isComplete && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShieldPulse() {
  return (
    <svg
      className="h-10 w-10 text-indigo-600 animate-pulse"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
