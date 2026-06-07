"use client";

import { useState, useEffect, useMemo } from "react";

interface FeedbackItem {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  adminComment?: string | null;
}

interface FeedbackSectionProps {
  adminPasscode: string | null;
}

export default function FeedbackSection({ adminPasscode }: FeedbackSectionProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [activeDragOverColumn, setActiveDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      const timer = setTimeout(() => {
        if (active) {
          setViewMode("kanban");
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, []);

  const feedbackByStatus = useMemo(() => {
    const groups: Record<string, FeedbackItem[]> = {
      "Pending": [],
      "Under Review": [],
      "Planned": [],
      "Completed": [],
    };
    feedbackList.forEach((item) => {
      const status = item.status || "Pending";
      if (groups[status]) {
        groups[status].push(item);
      } else {
        groups["Pending"].push(item);
      }
    });
    return groups;
  }, [feedbackList]);

  // Load feedback on mount
  useEffect(() => {
    let active = true;

    async function loadFeedback() {
      try {
        const res = await fetch("/api/feedback");
        if (res.ok && active) {
          const data = await res.json();
          setFeedbackList(data);
        }
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadFeedback();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newFeedback }),
      });

      if (res.ok) {
        const created = await res.json();
        setFeedbackList((prev) => [created, ...prev]);
        setNewFeedback("");
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        const errData = await res.json();
        setSubmitError(errData.error || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error("Submit feedback error:", err);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: FeedbackItem) => {
    setEditingId(item.id);
    setEditingContent(item.content);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingContent.trim()) return;

    setIsSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
        setEditingId(null);
        setEditingContent("");
      } else {
        const errData = await res.json();
        setEditError(errData.error || "Failed to save edits.");
      }
    } catch (err) {
      console.error("Edit feedback error:", err);
      setEditError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminStatusChange = async (id: string, newStatus: string) => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (adminPasscode) {
        headers["x-admin-passcode"] = adminPasscode;
      }

      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update feedback status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status due to network error.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) return;

    try {
      const headers: HeadersInit = {};
      if (adminPasscode) {
        headers["x-admin-passcode"] = adminPasscode;
      }

      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete feedback.");
      }
    } catch (err) {
      console.error("Delete feedback error:", err);
      alert("Failed to delete due to network error.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.trim().toLowerCase()) {
      case "completed":
        return "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400";
      case "planned":
        return "bg-amber-950/40 border border-amber-900/60 text-amber-400";
      case "under review":
        return "bg-blue-950/40 border border-blue-900/60 text-blue-400";
      default:
        return "bg-neutral-800 border border-neutral-700 text-neutral-400";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold text-white tracking-tight">
          Feature Requests & Feedback
        </h3>
        <p className="text-on-surface-variant text-[14px] mt-1 font-light">
          Share your ideas, suggest improvements, or report bugs. Your input helps make this database better.
        </p>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            placeholder="Type your feature request or feedback here..."
            value={newFeedback}
            onChange={(e) => {
              setNewFeedback(e.target.value);
              setSubmitError(null);
            }}
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full bg-surface-container-lowest border border-white/5 focus:border-primary/45 px-4 py-3.5 rounded-xl text-[16px] text-white placeholder-neutral-500 focus:outline-none transition-colors min-h-[100px] resize-none"
          />
          {submitError && (
            <p className="text-red-500 text-[14px] font-semibold mt-1">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-emerald-500 text-[14px] font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Feedback submitted successfully!
            </p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-500 text-[13px] font-mono">
            {newFeedback.length}/1000 characters
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !newFeedback.trim()}
            className="px-5 py-3.5 bg-primary hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-display text-[14px] font-bold text-on-primary tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>

      {/* Feedback List */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h4 className="font-display text-[16px] font-bold text-white uppercase tracking-wider">
            Community Suggestions ({feedbackList.length})
          </h4>
          
          {/* View Switcher Toggle */}
          <div className="flex items-center gap-1 bg-surface-container-lowest border border-white/5 rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "list"
                  ? "bg-primary text-black"
                  : "text-neutral-400 hover:text-white"
                }`}
              title="Switch to List View"
            >
              <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "kanban"
                  ? "bg-primary text-black"
                  : "text-neutral-400 hover:text-white"
                }`}
              title="Switch to Kanban View"
            >
              <span className="material-symbols-outlined text-[14px]">view_week</span>
              Kanban
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-on-surface-variant font-light text-[15px] gap-2 animate-pulse">
            <span className="material-symbols-outlined animate-spin">sync</span>
            Retrieving feedback...
          </div>
        ) : feedbackList.length === 0 ? (
          <p className="text-center py-8 text-neutral-500 font-light text-[15px]">
            No feedback submitted yet. Be the first to suggest a feature!
          </p>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-low border border-white/5 p-5 rounded-xl space-y-3 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded text-[12px] font-bold uppercase tracking-wider font-mono ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-neutral-500 text-[13px] font-light font-mono">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Owner Actions */}
                  {!editingId || editingId !== item.id ? (
                    <div className="flex items-center gap-2">
                      {item.isOwner && (
                        <>
                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Edit Suggestion"
                            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete Suggestion"
                            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </>
                      )}

                      {/* Admin-only options */}
                      {adminPasscode && (
                        <div className="flex items-center gap-2 border-l border-white/10 pl-2 ml-1">
                          <select
                            value={item.status}
                            onChange={(e) => handleAdminStatusChange(item.id, e.target.value)}
                            className="bg-surface-container-lowest border border-white/10 px-2 py-1 rounded-lg text-[13px] text-white focus:outline-none focus:border-primary/45 cursor-pointer font-sans"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Planned">Planned</option>
                            <option value="Completed">Completed</option>
                          </select>
                          
                          {!item.isOwner && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Admin Delete"
                              className="p-2 hover:bg-neutral-800 rounded-lg text-red-500/70 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Content section */}
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      maxLength={1000}
                      disabled={isSaving}
                      className="w-full bg-surface-container-lowest border border-white/5 focus:border-primary/45 px-3 py-2 rounded-lg text-[15px] text-white focus:outline-none transition-colors min-h-[80px] resize-none"
                    />
                    {editError && (
                      <p className="text-red-500 text-[13px] font-semibold">
                        {editError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={isSaving || !editingContent.trim()}
                        className="px-4 py-2 bg-primary hover:brightness-110 text-on-primary font-bold text-[13px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-white text-[15px] font-light leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                    {item.adminComment && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold uppercase tracking-widest">
                          <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                          Developer Response
                        </div>
                        <p className="text-[13px] font-light leading-relaxed text-neutral-300 whitespace-pre-wrap font-sans">
                          {item.adminComment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full align-top animate-in fade-in duration-200">
            {["Pending", "Under Review", "Planned", "Completed"].map((colName) => {
              const items = feedbackByStatus[colName] || [];
              const isDragOver = activeDragOverColumn === colName && !!adminPasscode;

              // Status specific styling
              const borderColors: Record<string, string> = {
                "Pending": "border-neutral-500/20",
                "Under Review": "border-blue-500/20",
                "Planned": "border-amber-500/20",
                "Completed": "border-emerald-500/20",
              };

              const dotColors: Record<string, string> = {
                "Pending": "bg-neutral-500",
                "Under Review": "bg-blue-500",
                "Planned": "bg-amber-500",
                "Completed": "bg-emerald-500",
              };

              const bgColors: Record<string, string> = {
                "Pending": "bg-neutral-500/5",
                "Under Review": "bg-blue-500/5",
                "Planned": "bg-amber-500/5",
                "Completed": "bg-emerald-500/5",
              };

              return (
                <div
                  key={colName}
                  onDragOver={(e) => {
                    if (!adminPasscode) return;
                    e.preventDefault();
                    if (activeDragOverColumn !== colName) {
                      setActiveDragOverColumn(colName);
                    }
                  }}
                  onDragLeave={() => {
                    if (!adminPasscode) return;
                    setActiveDragOverColumn(null);
                  }}
                  onDrop={(e) => {
                    if (!adminPasscode) return;
                    e.preventDefault();
                    setActiveDragOverColumn(null);
                    const feedbackId = e.dataTransfer.getData("text/plain");
                    if (feedbackId) {
                      handleAdminStatusChange(feedbackId, colName);
                    }
                  }}
                  className={`flex flex-col rounded-2xl border bg-black/20 p-4 min-h-[400px] transition-all duration-200 ${isDragOver
                      ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(245,197,24,0.1)]"
                      : `${borderColors[colName]} ${bgColors[colName]}`
                    }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColors[colName]}`} />
                      <h4 className="font-display font-bold text-white text-[14px] uppercase tracking-wider">{colName}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-neutral-400 font-mono">
                      {items.length}
                    </span>
                  </div>

                  {/* Column Content */}
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                    {items.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-xl p-6 text-center text-[12px] text-neutral-600 italic">
                        No items
                      </div>
                    ) : (
                      items.map((item) => {
                        const isEditing = editingId === item.id;
                        return (
                          <div
                            key={item.id}
                            draggable={!!adminPasscode && !isEditing}
                            onDragStart={(e) => {
                              if (!adminPasscode) return;
                              e.dataTransfer.setData("text/plain", item.id);
                            }}
                            className={`bg-surface-container-low border border-white/5 p-4 rounded-xl space-y-3 transition-all ${
                              isEditing
                                ? "ring-1 ring-primary/40 border-primary/20"
                                : adminPasscode
                                  ? "cursor-grab active:cursor-grabbing hover:border-white/10"
                                  : ""
                            }`}
                          >
                            {/* Header info */}
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-neutral-500 text-[11px] font-light font-mono block">
                                {formatDate(item.createdAt)}
                              </span>

                              {/* Card Actions */}
                              {!isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  {item.isOwner && (
                                    <>
                                      <button
                                        onClick={() => handleStartEdit(item)}
                                        title="Edit Suggestion"
                                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id)}
                                        title="Delete Suggestion"
                                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                      </button>
                                    </>
                                  )}

                                  {/* Admin-only options */}
                                  {adminPasscode && (
                                    <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10">
                                      <select
                                        value={item.status}
                                        onChange={(e) => handleAdminStatusChange(item.id, e.target.value)}
                                        className="bg-surface-container-lowest border border-white/10 px-1 py-0.5 rounded text-[11px] text-white focus:outline-none focus:border-primary/45 cursor-pointer font-sans"
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Planned">Planned</option>
                                        <option value="Completed">Completed</option>
                                      </select>
                                      
                                      {!item.isOwner && (
                                        <button
                                          onClick={() => handleDelete(item.id)}
                                          title="Admin Delete"
                                          className="p-1 hover:bg-neutral-800 rounded text-red-500/70 hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>

                            {/* Content section */}
                            {isEditing ? (
                              <div className="space-y-2 pt-1">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    maxLength={1000}
                                    disabled={isSaving}
                                    className="w-full bg-surface-container-lowest border border-white/5 focus:border-primary/45 px-3 py-2 rounded-lg text-[13px] text-white focus:outline-none transition-colors min-h-[70px] resize-none"
                                  />
                                  {editError && (
                                    <p className="text-red-500 text-[11px] font-semibold">
                                      {editError}
                                    </p>
                                  )}
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[11px] rounded-lg transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(item.id)}
                                      disabled={isSaving || !editingContent.trim()}
                                      className="px-2.5 py-1 bg-primary hover:brightness-110 text-on-primary font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                    >
                                      {isSaving ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                            ) : (
                              <div className="space-y-2 pt-1">
                                <p className="text-white text-[13.5px] font-light leading-relaxed whitespace-pre-wrap font-sans">
                                  {item.content}
                                </p>
                                {item.adminComment && (
                                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 mt-2 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-wider">
                                      <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                                      Response
                                    </div>
                                    <p className="text-[12px] font-light leading-normal text-neutral-300 whitespace-pre-wrap font-sans">
                                      {item.adminComment}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
