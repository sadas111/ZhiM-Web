"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTranslation } from "react-i18next";

interface MermaidProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with custom config
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
  themeVariables: {
    primaryColor: "#0ea5e9",
    primaryTextColor: "#0b1220",
    primaryBorderColor: "#7dd3fc",
    lineColor: "#7aa6c2",
    secondaryColor: "#e0f2fe",
    tertiaryColor: "#f0f9ff",
  },
});

let mermaidIdCounter = 0;

export const Mermaid: React.FC<MermaidProps> = ({ chart, className = "" }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => `mermaid-${++mermaidIdCounter}`);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || !containerRef.current) return;

      try {
        // Clean up the chart code
        const cleanedChart = chart.trim();

        // Validate and render
        const { svg: renderedSvg } = await mermaid.render(id, cleanedChart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram",
        );
      }
    };

    renderChart();
  }, [chart, id]);

  if (error) {
    return (
      <div
        className={`my-4 p-4 bg-accent/50 border border-border rounded-lg ring-1 ring-sky-500/10 ${className}`}
      >
        <p className="text-primary text-sm font-medium mb-2">
          {t("Diagram rendering error")}
        </p>
        <pre className="text-xs text-foreground/80 whitespace-pre-wrap">
          {error}
        </pre>
        <details className="mt-2">
          <summary className="text-xs text-slate-500 cursor-pointer">
            {t("Show source")}
          </summary>
          <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-6 flex justify-center overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Mermaid;
