"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { LandingPage } from "@/components/landing-page";
import { LoadingAnimation } from "@/components/loading-animation";
import { ResultsPage } from "@/components/results-page";
import { HistoryPanel } from "@/components/history-panel";
import { verifyText } from "@/lib/api";
import {
  getHistory,
  saveToHistory,
  deleteHistoryEntry,
  clearHistory,
} from "@/lib/history";
import { HistoryEntry, VerificationReport } from "@/types";

type AppState = "landing" | "loading" | "results";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [text, setText] = useState("");
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleVerify = useCallback(async () => {
    if (text.trim().length < 10) return;

    setError(null);
    setAppState("loading");

    try {
      const result = await verifyText(text.trim());
      setReport(result);
      saveToHistory(text.trim(), result);
      setHistory(getHistory());
      setAppState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setAppState("landing");
    }
  }, [text]);

  const handleBack = () => {
    setAppState("landing");
    setReport(null);
    setError(null);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setReport(entry.report);
    setText(entry.text);
    setShowHistory(false);
    setAppState("results");
  };

  const handleHistoryDelete = (id: string) => {
    deleteHistoryEntry(id);
    setHistory(getHistory());
  };

  const handleHistoryClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header onHistoryClick={() => setShowHistory(true)} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {appState === "landing" && (
          <LandingPage
            text={text}
            onTextChange={setText}
            onVerify={handleVerify}
            isLoading={false}
            error={error}
          />
        )}

        {appState === "loading" && <LoadingAnimation />}

        {appState === "results" && report && (
          <ResultsPage report={report} onBack={handleBack} />
        )}
      </main>

      {showHistory && (
        <HistoryPanel
          entries={history}
          onSelect={handleHistorySelect}
          onDelete={handleHistoryDelete}
          onClear={handleHistoryClear}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
