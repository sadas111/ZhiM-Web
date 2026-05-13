"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  History,
  Clock,
  ChevronRight,
  Calculator,
  FileText,
  Microscope,
  MessageCircle,
  Filter,
  Search,
  Calendar,
  X,
  MessageSquare,
  Loader2,
  Eye,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { formatDate } from "@/lib/datetime";
import { useGlobal } from "@/context/GlobalContext";
import ActivityDetail from "@/components/ActivityDetail";
import ChatSessionDetail from "@/components/ChatSessionDetail";
import SolverSessionDetail from "@/components/SolverSessionDetail";

interface HistoryEntry {
  id: string;
  type: "solve" | "question" | "research" | "chat";
  title: string;
  summary: string;
  timestamp: number;
  content: any;
}

const TYPE_CONFIG = {
  solve: {
    icon: Calculator,
    color: "blue",
    bgColor: "bg-accent/70",
    textColor: "text-primary",
  },
  question: {
    icon: FileText,
    color: "blue",
    bgColor: "bg-accent/70",
    textColor: "text-primary",
  },
  research: {
    icon: Microscope,
    color: "blue",
    bgColor: "bg-accent/70",
    textColor: "text-primary",
  },
  chat: {
    icon: MessageCircle,
    color: "blue",
    bgColor: "bg-accent/70",
    textColor: "text-primary",
  },
};

// Chat session interface
interface ChatSession {
  session_id: string;
  title: string;
  message_count: number;
  last_message: string;
  created_at: number;
  updated_at: number;
}

// Solver session interface
interface SolverSession {
  session_id: string;
  title: string;
  message_count: number;
  kb_name: string;
  last_message: string;
  token_stats?: {
    model: string;
    calls: number;
    tokens: number;
    cost: number;
  };
  created_at: number;
  updated_at: number;
}

export default function HistoryPage() {
  const { uiSettings, loadChatSession, loadSolverSession } = useGlobal();
  const { t } = useTranslation();
  const router = useRouter();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [solverSessions, setSolverSessions] = useState<SolverSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [loadingSolverSessionId, setLoadingSolverSessionId] = useState<
    string | null
  >(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [selectedChatSession, setSelectedChatSession] = useState<string | null>(
    null,
  );
  const [selectedSolverSession, setSelectedSolverSession] = useState<
    string | null
  >(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch regular activity history
      if (
        filterType === "all" ||
        (filterType !== "chat" && filterType !== "solve")
      ) {
        const typeParam = filterType !== "all" ? `&type=${filterType}` : "";
        const res = await fetch(
          apiUrl(`/api/v1/dashboard/recent?limit=50${typeParam}`),
        );
        const data = await res.json();
        setEntries(data);
      } else {
        setEntries([]);
      }

      // Fetch chat sessions
      if (filterType === "all" || filterType === "chat") {
        try {
          const sessionsRes = await fetch(
            apiUrl("/api/v1/chat/sessions?limit=20"),
          );
          const sessionsData = await sessionsRes.json();
          setChatSessions(sessionsData);
        } catch (err) {
          console.error("Failed to fetch chat sessions:", err);
          setChatSessions([]);
        }
      } else {
        setChatSessions([]);
      }

      // Fetch solver sessions
      if (filterType === "all" || filterType === "solve") {
        try {
          const solverRes = await fetch(
            apiUrl("/api/v1/solve/sessions?limit=20"),
          );
          const solverData = await solverRes.json();
          setSolverSessions(solverData);
        } catch (err) {
          console.error("Failed to fetch solver sessions:", err);
          setSolverSessions([]);
        }
      } else {
        setSolverSessions([]);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoadChatSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId);
    try {
      await loadChatSession(sessionId);
      router.push("/");
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleLoadSolverSession = async (sessionId: string) => {
    setLoadingSolverSessionId(sessionId);
    try {
      await loadSolverSession(sessionId);
      router.push("/solver");
    } catch (err) {
      console.error("Failed to load solver session:", err);
    } finally {
      setLoadingSolverSessionId(null);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    // Exclude chat type - they are shown in dedicated Chat History section
    if (entry.type === "chat") return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.summary?.toLowerCase().includes(query)
    );
  });

  const groupEntriesByDate = (entries: HistoryEntry[]) => {
    const groups: { [key: string]: HistoryEntry[] } = {};

    entries.forEach((entry) => {
      const date = new Date(entry.timestamp * 1000);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = t("Today");
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = t("Yesterday");
      } else {
        dateKey = formatDate(date, uiSettings.language, {
          month: "long",
          day: "numeric",
          year:
            date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return groups;
  };

  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    <div className="min-h-full flex flex-col animate-fade-in p-6">
      {/* Header - Fixed */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center justify-between ui-surface ui-gradient-border ui-soft-inset rounded-3xl px-6 py-5">
          <div>
            <h1 className="ui-h1 flex items-center gap-3">
              <History className="w-8 h-8 text-primary" />
              {t("History")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("All Activities")}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`${t("Search")}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card/80 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 text-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex bg-secondary rounded-lg p-1 border border-border">
              {[
                { value: "all", label: t("All") },
                { value: "chat", label: t("Chat") },
                { value: "solve", label: t("Solve") },
                { value: "question", label: t("Question") },
                { value: "research", label: t("Research") },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    filterType === option.value
                      ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {/* Regular Activity History */}
        <div className="bg-card/80 rounded-2xl shadow-sm border border-border overflow-hidden ring-1 ring-sky-500/10">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {t("Loading")}...
            </div>
          ) : filteredEntries.length === 0 &&
            chatSessions.length === 0 &&
            solverSessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-accent/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border ring-1 ring-sky-500/10 ui-soft-inset">
                <History className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-muted-foreground font-medium">
                {t("No history found")}
              </p>
              <p className="text-sm text-muted-foreground/80 mt-1">
                {t("Your activities will appear here")}
              </p>
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {Object.entries(groupedEntries).map(([dateKey, dateEntries]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="px-5 py-3 bg-background/40 border-b border-border">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {dateKey}
                    </div>
                  </div>

                  {/* Entries for this date */}
                  {dateEntries.map((entry) => {
                    const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.chat;
                    const IconComponent = config.icon;

                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="px-5 py-4 hover:bg-accent/40 transition-colors group cursor-pointer"
                      >
                        <div className="flex gap-4">
                          <div className="mt-0.5">
                            <div
                              className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-sky-500/10`}
                            >
                              <IconComponent
                                className={`w-5 h-5 ${config.textColor}`}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span
                                className={`text-xs font-bold uppercase tracking-wider ${config.textColor} mb-1`}
                              >
                                {entry.type}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(
                                  entry.timestamp * 1000,
                                ).toLocaleTimeString(
                                  uiSettings.language === "zh"
                                    ? "zh-CN"
                                    : "en-US",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold text-foreground truncate pr-4">
                              {entry.title}
                            </h3>
                            {entry.summary && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {entry.summary}
                              </p>
                            )}
                          </div>
                          <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Chat Sessions Section */}
        {chatSessions.length > 0 &&
          (filterType === "all" || filterType === "chat") && (
            <div className="bg-card/80 rounded-2xl shadow-sm border border-border overflow-hidden ring-1 ring-sky-500/10">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                  {t("Chat History")}
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {chatSessions.length}{" "}
                  {t(chatSessions.length === 1 ? "session" : "sessions")}
                </span>
              </div>
              <div className="divide-y divide-border">
                {chatSessions
                  .filter((session) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      session.title.toLowerCase().includes(query) ||
                      session.last_message?.toLowerCase().includes(query)
                    );
                  })
                  .map((session) => (
                    <div
                      key={session.session_id}
                      onClick={() => setSelectedChatSession(session.session_id)}
                      className="px-5 py-4 hover:bg-accent/40 transition-colors group cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="mt-0.5">
                          <div className="w-10 h-10 rounded-xl bg-accent/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-sky-500/10">
                            <MessageCircle className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                              {t("Chat")}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(
                                new Date(session.updated_at * 1000),
                                uiSettings.language,
                              )}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground truncate pr-4">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {session.message_count} {t("messages")}
                            </span>
                            {session.last_message && (
                              <p className="text-sm text-muted-foreground truncate flex-1">
                                {session.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="self-center flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChatSession(session.session_id);
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-secondary text-foreground/80 rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-1.5 border border-border"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t("View")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadChatSession(session.session_id);
                            }}
                            disabled={loadingSessionId === session.session_id}
                            className="px-3 py-1.5 text-xs font-medium bg-accent/70 text-primary rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-border ring-1 ring-sky-500/10"
                          >
                            {loadingSessionId === session.session_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5" />
                            )}
                            {t("Continue")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Solver Sessions Section */}
        {solverSessions.length > 0 &&
          (filterType === "all" || filterType === "solve") && (
            <div className="bg-card/80 rounded-2xl shadow-sm border border-border overflow-hidden ring-1 ring-sky-500/10">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                  {t("Solver History")}
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {solverSessions.length}{" "}
                  {t(solverSessions.length === 1 ? "session" : "sessions")}
                </span>
              </div>
              <div className="divide-y divide-border">
                {solverSessions
                  .filter((session) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      session.title.toLowerCase().includes(query) ||
                      session.last_message?.toLowerCase().includes(query)
                    );
                  })
                  .map((session) => (
                    <div
                      key={session.session_id}
                      onClick={() =>
                        setSelectedSolverSession(session.session_id)
                      }
                      className="px-5 py-4 hover:bg-accent/40 transition-colors group cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="mt-0.5">
                          <div className="w-10 h-10 rounded-xl bg-accent/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-sky-500/10">
                            <Calculator className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                              {t("Solve")}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(
                                new Date(session.updated_at * 1000),
                                uiSettings.language,
                              )}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground truncate pr-4">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {session.message_count} {t("messages")}
                            </span>
                            {session.kb_name && (
                              <span className="text-xs text-primary">
                                KB: {session.kb_name}
                              </span>
                            )}
                            {session.token_stats?.cost !== undefined &&
                              session.token_stats.cost > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ${session.token_stats.cost.toFixed(4)}
                                </span>
                              )}
                          </div>
                          {session.last_message && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {session.last_message}
                            </p>
                          )}
                        </div>
                        <div className="self-center flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSolverSession(session.session_id);
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-secondary text-foreground/80 rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-1.5 border border-border"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t("View")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadSolverSession(session.session_id);
                            }}
                            disabled={
                              loadingSolverSessionId === session.session_id
                            }
                            className="px-3 py-1.5 text-xs font-medium bg-accent/70 text-primary rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-border ring-1 ring-sky-500/10"
                          >
                            {loadingSolverSessionId === session.session_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Calculator className="w-3.5 h-3.5" />
                            )}
                            {t("Continue")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>

      {/* Activity Detail Modal */}
      {selectedEntry && (
        <ActivityDetail
          activity={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Chat Session Detail Modal */}
      {selectedChatSession && (
        <ChatSessionDetail
          sessionId={selectedChatSession}
          onClose={() => setSelectedChatSession(null)}
          onContinue={() => {
            handleLoadChatSession(selectedChatSession);
            setSelectedChatSession(null);
          }}
        />
      )}

      {/* Solver Session Detail Modal */}
      {selectedSolverSession && (
        <SolverSessionDetail
          sessionId={selectedSolverSession}
          onClose={() => setSelectedSolverSession(null)}
          onContinue={() => {
            handleLoadSolverSession(selectedSolverSession);
            setSelectedSolverSession(null);
          }}
        />
      )}
    </div>
  );
}
