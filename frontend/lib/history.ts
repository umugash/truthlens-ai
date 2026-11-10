import { HistoryEntry, VerificationReport } from "@/types";

const STORAGE_KEY = "truthlens_history";
const MAX_ENTRIES = 20;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(text: string, report: VerificationReport): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    text: text.slice(0, 200),
    report,
    createdAt: new Date().toISOString(),
  };

  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  return entry;
}

export function deleteHistoryEntry(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
