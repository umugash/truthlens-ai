"use client";

import {
  ArrowLeft,
  Copy,
  Download,
  FileJson,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClaimCard } from "@/components/claim-card";
import {
  copyReportToClipboard,
  downloadJSON,
  exportReportToPDF,
} from "@/lib/export";
import { VerificationReport } from "@/types";

interface ResultsPageProps {
  report: VerificationReport;
  onBack: () => void;
}

export function ResultsPage({ report, onBack }: ResultsPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyReportToClipboard(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          New Verification
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Report"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReportToPDF(report)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadJSON(report)}
            className="gap-2"
          >
            <FileJson className="h-4 w-4" />
            Download JSON
          </Button>
        </div>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <p className="mb-2 text-sm font-medium opacity-80">Overall Trust Score</p>
          <div className="flex items-end gap-4">
            <span className="text-6xl font-bold text-white">
              {report.overall_trust_score}
            </span>
            <span className="mb-2 text-2xl opacity-60">/100</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-1000"
              style={{ width: `${report.overall_trust_score}%` }}
            />
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {report.summary}
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Verified {report.claims.length} claim{report.claims.length !== 1 ? "s" : ""} ·{" "}
            {new Date(report.generated_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-xl font-semibold">
        Claims Analysis ({report.claims.length})
      </h2>
      <div className="space-y-4">
        {report.claims.map((result, index) => (
          <ClaimCard key={result.claim.id} result={result} index={index} />
        ))}
      </div>
    </div>
  );
}
