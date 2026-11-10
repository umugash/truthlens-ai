"use client";

import { X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTrustScoreColor, getVerdictLabel } from "@/lib/export";
import { cn } from "@/lib/utils";
import { HistoryEntry } from "@/types";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HistoryPanel({
  entries,
  onSelect,
  onDelete,
  onClear,
  onClose,
}: HistoryPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-950 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Verification History</h2>
          <div className="flex gap-2">
            {entries.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear} className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No verification history yet.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => onSelect(entry)}
                >
                  <CardContent className="p-4">
                    <p className="mb-2 line-clamp-2 text-sm">{entry.text}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            getTrustScoreColor(entry.report.overall_trust_score)
                          )}
                        >
                          {entry.report.overall_trust_score}/100
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.report.claims.slice(0, 3).map((c) => (
                        <span
                          key={c.claim.id}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800"
                        >
                          {getVerdictLabel(c.verdict)}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
