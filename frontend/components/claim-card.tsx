"use client";

import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getVerdictBg,
  getVerdictColor,
  getVerdictLabel,
} from "@/lib/export";
import { cn } from "@/lib/utils";
import { ClaimResult } from "@/types";

interface ClaimCardProps {
  result: ClaimResult;
  index: number;
}

export function ClaimCard({ result, index }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(false);

  const badgeVariant = {
    TRUE: "success" as const,
    FALSE: "danger" as const,
    PARTIALLY_TRUE: "default" as const,
    MISLEADING: "warning" as const,
    UNSUPPORTED: "secondary" as const,
  }[result.verdict];

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-4",
        getVerdictBg(result.verdict)
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Claim #{result.claim.id}
              </span>
              <Badge variant={badgeVariant}>{getVerdictLabel(result.verdict)}</Badge>
            </div>
            <CardTitle className="text-base leading-snug">{result.claim.text}</CardTitle>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", getVerdictColor(result.verdict))}>
              {result.confidence}%
            </div>
            <div className="text-xs text-gray-500">confidence</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {result.reasoning}
        </p>

        {result.evidence.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Hide Evidence
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Show Evidence ({result.evidence.length})
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                {result.evidence.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 bg-white/50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge
                        variant={
                          item.stance === "supports"
                            ? "success"
                            : item.stance === "contradicts"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {item.stance}
                      </Badge>
                      <span className="text-xs font-medium">{item.source_title}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result.sources.length > 0 && (
          <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-medium text-gray-500">Sources</p>
            <div className="flex flex-wrap gap-2">
              {result.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:bg-gray-900 dark:text-indigo-400 dark:hover:bg-indigo-950"
                >
                  {source.title.slice(0, 40)}
                  {source.title.length > 40 && "..."}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
