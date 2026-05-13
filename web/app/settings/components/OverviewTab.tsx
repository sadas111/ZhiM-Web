"use client";

import {
  Brain,
  Database,
  Volume2,
  Search,
  Check,
  AlertCircle,
  Server,
  RefreshCw,
} from "lucide-react";
import { FullStatus, PortsInfo, ConfigType } from "../types";

interface OverviewTabProps {
  status: FullStatus | null;
  ports: PortsInfo | null;
  onRefresh: () => void;
  t: (key: string) => string;
}

const services: {
  key: ConfigType;
  label: string;
  icon: typeof Brain;
  color: string;
}[] = [
  { key: "llm", label: "LLM", icon: Brain, color: "blue" },
  { key: "embedding", label: "Embedding", icon: Database, color: "blue" },
  { key: "tts", label: "TTS", icon: Volume2, color: "blue" },
  { key: "search", label: "Search", icon: Search, color: "blue" },
];

export default function OverviewTab({
  status,
  ports,
  onRefresh,
  t,
}: OverviewTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t("Refresh")}
        </button>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const s = status?.[service.key];
          const Icon = service.icon;
          const isConfigured = s?.configured;

          return (
            <div
              key={service.key}
              className={`p-4 rounded-xl border ${
                isConfigured
                  ? "border-sky-300/60 bg-accent/40 ring-1 ring-sky-500/10"
                  : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isConfigured
                        ? "bg-accent/70 ring-1 ring-sky-500/10"
                        : "bg-secondary"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isConfigured
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {service.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {s?.active_config_name || t("Not configured")}
                    </p>
                  </div>
                </div>
                {isConfigured ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              {s?.model && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {t("Model")}:
                    </span>
                    <span className="font-mono text-foreground/90">
                      {s.model}
                    </span>
                  </div>
                  {s.provider && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="text-muted-foreground">
                        {t("Provider")}:
                      </span>
                      <span className="text-foreground/90">
                        {s.provider}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Port Information */}
      {ports && (
        <div className="p-4 rounded-xl border border-border bg-card/50 ring-1 ring-sky-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              {t("Port Configuration")}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">
                {t("Backend Port")}
              </span>
              <p className="font-mono text-lg text-foreground/90">
                {ports.backend_port}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                {t("Frontend Port")}
              </span>
              <p className="font-mono text-lg text-foreground/90">
                {ports.frontend_port}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
