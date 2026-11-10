"use client";

import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface LandingPageProps {
  text: string;
  onTextChange: (text: string) => void;
  onVerify: () => void;
  isLoading: boolean;
  error: string | null;
}

const EXAMPLE_TEXT = `Breaking: Apple has acquired OpenAI in a landmark $50 billion deal. The acquisition was announced yesterday and will integrate ChatGPT into all Apple devices starting next month. CEO Tim Cook confirmed the deal at a press conference in Cupertino.`;

export function LandingPage({
  text,
  onTextChange,
  onVerify,
  isLoading,
  error,
}: LandingPageProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Sparkles className="h-4 w-4" />
          Multi-Agent Fact Verification
        </div>
        <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Verify Any Claim with AI Agents
        </h2>
        <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
          Paste a news article, social media post, or WhatsApp forward. Our autonomous
          agents will extract claims, search the web, analyze evidence, and produce a
          structured verification report.
        </p>
      </div>

      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-6">
          <Textarea
            placeholder="Paste the text you want to verify here..."
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={8}
            disabled={isLoading}
            className="mb-4 resize-none text-base"
          />

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {text.length}/10,000 characters · Min 10 characters
            </p>
            <Button
              size="lg"
              onClick={onVerify}
              disabled={isLoading || text.trim().length < 10}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mx-auto mt-8 max-w-3xl">
        <p className="mb-3 text-center text-sm text-gray-500">Try an example</p>
        <button
          onClick={() => onTextChange(EXAMPLE_TEXT)}
          disabled={isLoading}
          className="w-full rounded-lg border border-dashed border-gray-300 p-4 text-left text-sm text-gray-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/30"
        >
          {EXAMPLE_TEXT}
        </button>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[
          {
            title: "Extract Claims",
            desc: "AI identifies verifiable factual statements",
          },
          {
            title: "Search & Analyze",
            desc: "Agents search the web and evaluate evidence",
          },
          {
            title: "Structured Report",
            desc: "Verdicts, confidence scores, and sources",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800"
          >
            <h3 className="mb-1 font-semibold">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
