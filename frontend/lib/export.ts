import { jsPDF } from "jspdf";
import { VerificationReport, Verdict } from "@/types";

const VERDICT_LABELS: Record<Verdict, string> = {
  TRUE: "True",
  FALSE: "False",
  PARTIALLY_TRUE: "Partially True",
  MISLEADING: "Misleading",
  UNSUPPORTED: "Unsupported",
};

export function downloadJSON(report: VerificationReport, filename = "truthlens-report.json"): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyReportToClipboard(report: VerificationReport): Promise<void> {
  const lines = [
    "TruthLens AI — Verification Report",
    `Generated: ${new Date(report.generated_at).toLocaleString()}`,
    `Overall Trust Score: ${report.overall_trust_score}/100`,
    "",
    report.summary,
    "",
    "--- Claims ---",
  ];

  for (const claim of report.claims) {
    lines.push(
      "",
      `Claim: ${claim.claim.text}`,
      `Verdict: ${VERDICT_LABELS[claim.verdict]} (${claim.confidence}% confidence)`,
      `Reasoning: ${claim.reasoning}`,
      "Sources:",
      ...claim.sources.map((s) => `  - ${s.title}: ${s.url}`)
    );
  }

  return navigator.clipboard.writeText(lines.join("\n"));
}

export function exportReportToPDF(report: VerificationReport): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const addText = (text: string, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += fontSize * 0.5;
    }
    y += 4;
  };

  addText("TruthLens AI — Verification Report", 18, true);
  addText(`Overall Trust Score: ${report.overall_trust_score}/100`, 14, true);
  addText(`Generated: ${new Date(report.generated_at).toLocaleString()}`, 9);
  addText(report.summary, 10);

  for (const claim of report.claims) {
    y += 6;
    addText(`Claim: ${claim.claim.text}`, 11, true);
    addText(
      `Verdict: ${VERDICT_LABELS[claim.verdict]} | Confidence: ${claim.confidence}%`,
      10
    );
    addText(claim.reasoning, 9);
    if (claim.sources.length > 0) {
      addText("Sources:", 9, true);
      for (const source of claim.sources.slice(0, 3)) {
        addText(`• ${source.title}`, 8);
      }
    }
  }

  doc.save("truthlens-report.pdf");
}

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case "TRUE":
      return "text-emerald-600 dark:text-emerald-400";
    case "FALSE":
      return "text-red-600 dark:text-red-400";
    case "PARTIALLY_TRUE":
      return "text-blue-600 dark:text-blue-400";
    case "MISLEADING":
      return "text-amber-600 dark:text-amber-400";
    case "UNSUPPORTED":
      return "text-gray-500 dark:text-gray-400";
    default:
      return "text-gray-600";
  }
}

export function getVerdictBg(verdict: Verdict): string {
  switch (verdict) {
    case "TRUE":
      return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800";
    case "FALSE":
      return "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";
    case "PARTIALLY_TRUE":
      return "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800";
    case "MISLEADING":
      return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
    case "UNSUPPORTED":
      return "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

export function getVerdictLabel(verdict: Verdict): string {
  return VERDICT_LABELS[verdict];
}

export function getTrustScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
