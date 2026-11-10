import { VerificationReport } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function verifyText(text: string): Promise<VerificationReport> {
  const url = API_BASE ? `${API_BASE}/api/verify` : "/api/verify";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(error.detail || "Verification failed");
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const url = API_BASE ? `${API_BASE}/api/health` : "/api/health";
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
