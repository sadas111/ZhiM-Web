"use client";

import { CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useTranslation } from "react-i18next";
import { processLatexContent } from "@/lib/latex";

interface CompletionSummaryProps {
  summary: string;
}

export default function CompletionSummary({ summary }: CompletionSummaryProps) {
  const { t } = useTranslation();
  // Table components for ReactMarkdown
  const tableComponents = {
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm ring-1 ring-sky-500/10">
        <table
          className="min-w-full divide-y divide-border text-sm"
          {...props}
        />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead className="bg-background/40" {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th
        className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap border-b border-border"
        {...props}
      />
    ),
    tbody: ({ node, ...props }: any) => (
      <tbody className="divide-y divide-border bg-card/50" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td
        className="px-4 py-3 text-foreground/80 border-b border-border"
        {...props}
      />
    ),
    tr: ({ node, ...props }: any) => (
      <tr className="hover:bg-accent/30 transition-colors" {...props} />
    ),
  };

  return (
    <div className="flex-1 bg-card/80 rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden relative ring-1 ring-sky-500/10">
      {/* Summary Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-sky-50/70 to-cyan-50/70 dark:from-sky-950/30 dark:to-cyan-950/20 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          {t("Learning Summary")}
        </h2>
      </div>
      {/* Summary Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-background/10">
        <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={tableComponents}
          >
            {processLatexContent(summary || "")}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
