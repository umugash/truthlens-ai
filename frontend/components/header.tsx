"use client";

import { Shield, History } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onHistoryClick?: () => void;
  showHistory?: boolean;
}

export function Header({ onHistoryClick, showHistory = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TruthLens AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Autonomous Fact Verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showHistory && onHistoryClick && (
            <Button variant="ghost" size="icon" onClick={onHistoryClick} aria-label="History">
              <History className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
