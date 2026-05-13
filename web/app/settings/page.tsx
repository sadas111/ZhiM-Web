"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Brain,
  Database,
  Volume2,
  Search,
  Loader2,
  Sun,
  Moon,
  Globe,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { useGlobal } from "@/context/GlobalContext";
import { useTranslation } from "react-i18next";
import { OverviewTab, ConfigTab } from "./components";
import { FullStatus, PortsInfo, TabType } from "./types";
import { LANGUAGE_OPTIONS } from "./constants";
import { getStorageStats } from "@/lib/persistence";

export default function SettingsPage() {
  const { uiSettings, updateTheme, updateLanguage, clearAllPersistence } =
    useGlobal();
  const { t } = useTranslation();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [storageStats, setStorageStats] = useState<{
    totalSize: number;
    items: { key: string; size: number }[];
  } | null>(null);

  // Load storage stats
  useEffect(() => {
    setStorageStats(getStorageStats());
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [status, setStatus] = useState<FullStatus | null>(null);
  const [ports, setPorts] = useState<PortsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadStatus();
    loadPorts();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/config/status"));
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to load config status:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadPorts = async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/config/ports"));
      if (res.ok) {
        const data = await res.json();
        setPorts(data);
      }
    } catch (e) {
      console.error("Failed to load ports:", e);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: t("Overview"),
      icon: <SettingsIcon className="w-4 h-4" />,
    },
    { id: "llm", label: t("LLM"), icon: <Brain className="w-4 h-4" /> },
    {
      id: "embedding",
      label: t("Embedding"),
      icon: <Database className="w-4 h-4" />,
    },
    { id: "tts", label: t("TTS"), icon: <Volume2 className="w-4 h-4" /> },
    { id: "search", label: t("Search"), icon: <Search className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/70 rounded-xl ring-1 ring-sky-500/10 border border-border">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("Settings")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("Configure your AI services and preferences")}
            </p>
          </div>
        </div>

        {/* General Settings - Theme & Language */}
        <div className="bg-card/80 rounded-2xl border border-border p-4 mb-6 ring-1 ring-sky-500/10">
          <div className="flex flex-wrap items-center gap-6">
            {/* Theme Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {uiSettings.theme === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                <span>{t("Theme")}</span>
              </div>
              <div className="flex p-1 bg-secondary rounded-lg border border-border">
                <button
                  onClick={() => updateTheme("light")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    uiSettings.theme === "light"
                      ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  {t("Light")}
                </button>
                <button
                  onClick={() => updateTheme("dark")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    uiSettings.theme === "dark"
                      ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  {t("Dark")}
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Language Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>{t("Language")}</span>
              </div>
              <div className="flex p-1 bg-secondary rounded-lg border border-border">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => updateLanguage(lang.value)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      uiSettings.language === lang.value
                        ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Clear Data */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trash2 className="w-4 h-4" />
                <span>{t("Local Data")}</span>
                {storageStats && (
                  <span className="text-xs text-muted-foreground">
                    ({(storageStats.totalSize / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 rounded-md text-sm bg-accent/60 text-primary hover:bg-accent transition-all border border-border ring-1 ring-sky-500/10"
              >
                {t("Clear Cache")}
              </button>
            </div>
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card/85 text-card-foreground backdrop-blur-md rounded-2xl border border-border p-6 max-w-md mx-4 shadow-2xl ring-1 ring-sky-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-accent/60 rounded-xl border border-border ring-1 ring-sky-500/10">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("Confirm Clear")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("This will clear all locally cached data")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {t(
                  "Including: chat history, solver history, question results, research reports, idea generation, guided learning progress, Co-Writer content, etc. This action cannot be undone.",
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-all"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={() => {
                    clearAllPersistence();
                    setShowClearConfirm(false);
                    setStorageStats(getStorageStats());
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all ring-1 ring-sky-500/10"
                >
                  {t("Clear All")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card/80 rounded-2xl border border-border overflow-hidden ring-1 ring-sky-500/10">
          {activeTab === "overview" && (
            <OverviewTab
              status={status}
              ports={ports}
              onRefresh={loadStatus}
              t={t}
            />
          )}
          {activeTab === "llm" && (
            <ConfigTab
              configType="llm"
              title={t("LLM Configuration")}
              description={t("Configure language model providers")}
              onUpdate={loadStatus}
              t={t}
            />
          )}
          {activeTab === "embedding" && (
            <ConfigTab
              configType="embedding"
              title={t("Embedding Configuration")}
              description={t("Configure embedding model providers")}
              onUpdate={loadStatus}
              showDimensions
              t={t}
            />
          )}
          {activeTab === "tts" && (
            <ConfigTab
              configType="tts"
              title={t("TTS Configuration")}
              description={t("Configure text-to-speech providers")}
              onUpdate={loadStatus}
              showVoice
              t={t}
            />
          )}
          {activeTab === "search" && (
            <ConfigTab
              configType="search"
              title={t("Search Configuration")}
              description={t("Configure web search providers")}
              onUpdate={loadStatus}
              isSearchConfig
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}
