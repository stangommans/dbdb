"use client";

import { useState, useMemo, useEffect } from "react";
import { CURRENCIES, convertFromBase } from "@/lib/currency";

interface Review {
  id: string;
  diveScore: number;
  pricePerMl: number | null;
  comment: string | null;
  photoUrl: string | null;
  reviewerToken: string;
  createdAt: string;
  vessel?: string | null;
  vesselSize?: string | null;
  vesselSizeMl?: number | null;
  purchasePrice?: number | null;
  purchaseCurrency?: string | null;
}

interface Bar {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
  amenities: string | null;
  reviews: Review[];
  reviewCount: number;
  averageDiveScore: number;
  averagePricePerMl: number | null;
}

interface AdminViewProps {
  bars: Bar[];
  adminPasscode: string | null;
  onAdminUnlock: (passcode: string | null) => void;
  onRefresh: () => void;
  onBarSelect?: (barId: string) => void;
}

export default function AdminView({
  bars,
  adminPasscode,
  onAdminUnlock,
  onRefresh,
  onBarSelect,
}: AdminViewProps) {
  const [passcodeAttempt, setPasscodeAttempt] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  
  // Selection state for bulk operations
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [deletingBarId, setDeletingBarId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Feedback management states
  const [adminSubTab, setAdminSubTab] = useState<"spots" | "feedback">("spots");
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editFeedbackContent, setEditFeedbackContent] = useState("");
  const [editAdminComment, setEditAdminComment] = useState("");
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
      }
    } catch (err) {
      console.error("Error fetching feedback in admin:", err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    if (adminSubTab === "feedback" && adminPasscode) {
      fetchFeedback();
    }
  }, [adminSubTab, adminPasscode]);

  const startEditingFeedback = (item: any) => {
    setEditingFeedbackId(item.id);
    setEditFeedbackContent(item.content);
    setEditAdminComment(item.adminComment || "");
  };

  const cancelEditingFeedback = () => {
    setEditingFeedbackId(null);
    setEditFeedbackContent("");
    setEditAdminComment("");
  };

  const handleSaveFeedback = async (id: string, currentStatus: string) => {
    if (!editFeedbackContent.trim()) {
      alert("Feedback content cannot be empty.");
      return;
    }
    setSavingFeedbackId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode || "",
        },
        body: JSON.stringify({
          content: editFeedbackContent,
          status: currentStatus,
          adminComment: editAdminComment.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
        setEditingFeedbackId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update feedback");
      }
    } catch (err) {
      console.error("Error saving feedback:", err);
      alert("Error saving feedback");
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleUpdateFeedbackStatusDirectly = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode || "",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update feedback status");
      }
    } catch (err) {
      console.error("Error updating feedback status:", err);
      alert("Error updating feedback status");
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this feedback?")) return;
    setDeletingFeedbackId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode || "",
        },
      });

      if (res.ok) {
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete feedback");
      }
    } catch (err) {
      console.error("Error deleting feedback:", err);
      alert("Error deleting feedback");
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  // Authenticate right inside the admin view lock screen
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeAttempt.trim()) return;

    setVerifying(true);
    setPasscodeError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcodeAttempt }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        onAdminUnlock(passcodeAttempt);
      } else {
        setPasscodeError(data.error || "Invalid override passcode.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setPasscodeError("An error occurred during verification.");
    } finally {
      setVerifying(false);
    }
  };

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [sortKey, setSortKey] = useState<"name" | "reviews" | "score">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Extract country from address helper
  const getCountry = (address: string) => {
    if (!address) return "Unknown";
    const parts = address.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (!last) return "Unknown";
    if (last.toLowerCase() === "usa") return "United States";
    if (last.toLowerCase() === "uk") return "United Kingdom";
    return last;
  };

  // Compute country counts based on all bars (before filters)
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bars.forEach((bar) => {
      const country = getCountry(bar.address);
      counts[country] = (counts[country] || 0) + 1;
    });
    return counts;
  }, [bars]);

  const availableCountries = useMemo(() => {
    return Object.keys(countryCounts).sort();
  }, [countryCounts]);

  // Find selected bar
  const selectedBar = useMemo(() => {
    return bars.find((b) => b.id === selectedBarId);
  }, [bars, selectedBarId]);

  // Filter and sort bars
  const processedBars = useMemo(() => {
    let result = [...bars];

    // 1. Country filter
    if (selectedCountry) {
      result = result.filter(b => getCountry(b.address) === selectedCountry);
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(lowerQuery) ||
          b.address.toLowerCase().includes(lowerQuery)
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortKey === "reviews") {
        const aCount = a.reviews?.length || 0;
        const bCount = b.reviews?.length || 0;
        return sortDirection === "asc" ? aCount - bCount : bCount - aCount;
      }
      
      if (sortKey === "score") {
        const aReviews = a.reviews || [];
        const bReviews = b.reviews || [];
        const aScore = aReviews.length > 0 
          ? aReviews.reduce((acc, r) => acc + r.diveScore, 0) / aReviews.length
          : 0;
        const bScore = bReviews.length > 0
          ? bReviews.reduce((acc, r) => acc + r.diveScore, 0) / bReviews.length
          : 0;
        return sortDirection === "asc" ? aScore - bScore : bScore - aScore;
      }

      // Default: sortKey === "name"
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    });

    return result;
  }, [bars, selectedCountry, searchQuery, sortKey, sortDirection]);

  const toggleSort = (key: "name" | "reviews" | "score") => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  // Handle single bar deletion
  const handleDeleteBar = async (barId: string, barName: string) => {
    if (
      !window.confirm(
        `WARNING: Deleting "${barName}" will permanently erase it along with all its reviews. This action cannot be undone. Proceed?`
      )
    )
      return;

    setDeletingBarId(barId);
    try {
      const res = await fetch(`/api/bars/${barId}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode || "",
        },
      });

      if (res.ok) {
        if (selectedBarId === barId) {
          setSelectedBarId(null);
        }
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete bar.");
      }
    } catch (err) {
      console.error("Error deleting bar:", err);
      alert("Error deleting bar.");
    } finally {
      setDeletingBarId(null);
    }
  };

  // Handle single review deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    setDeletingReviewId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode || "",
        },
      });

      if (res.ok) {
        // Clear selection if deleted
        setSelectedReviewIds((prev) => prev.filter((id) => id !== reviewId));
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete review.");
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Error deleting review.");
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Handle bulk review deletion
  const handleBulkDeleteReviews = async () => {
    if (selectedReviewIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete these ${selectedReviewIds.length} reviews?`
      )
    )
      return;

    setBulkDeleting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode || "",
        },
        body: JSON.stringify({ reviewIds: selectedReviewIds }),
      });

      if (res.ok) {
        setSelectedReviewIds([]);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete reviews.");
      }
    } catch (err) {
      console.error("Error bulk deleting reviews:", err);
      alert("Error deleting reviews.");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Toggle selection for all reviews in current bar
  const handleSelectAllReviews = () => {
    if (!selectedBar) return;
    const barReviews = selectedBar.reviews || [];
    const allSelected = barReviews.every((r) => selectedReviewIds.includes(r.id));

    if (allSelected) {
      // Unselect all for this bar
      const reviewIdsToRemove = barReviews.map((r) => r.id);
      setSelectedReviewIds((prev) => prev.filter((id) => !reviewIdsToRemove.includes(id)));
    } else {
      // Select all for this bar
      const reviewIdsToAdd = barReviews.map((r) => r.id);
      setSelectedReviewIds((prev) => {
        const union = new Set([...prev, ...reviewIdsToAdd]);
        return Array.from(union);
      });
    }
  };

  const handleToggleReviewSelection = (reviewId: string) => {
    setSelectedReviewIds((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  };

  // Check if admin passcode is set
  if (!adminPasscode) {
    return (
      <div className="w-full max-w-[480px] mx-auto px-6 pt-24 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/20 bg-surface-container-low/20 space-y-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-white uppercase tracking-wider">
                Admin Locked
              </h2>
              <p className="text-[15px] text-on-surface-variant font-light mt-1.5 leading-relaxed">
                DBDB Core Database control panel requires administrative override privileges. Enter passcode to authorize this device.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Core Passcode Key"
                value={passcodeAttempt}
                onChange={(e) => setPasscodeAttempt(e.target.value)}
                disabled={verifying}
                className="w-full bg-surface-container-lowest border border-white/10 focus:border-red-500/40 rounded-xl px-4 py-3.5 text-center text-white text-[16px] font-mono tracking-widest placeholder:text-neutral-600 focus:outline-none transition-all"
              />
              {passcodeError && (
                <p className="text-[13px] text-red-400 text-center font-bold tracking-wide mt-1 animate-bounce">
                  {passcodeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-4 bg-red-950/20 border border-red-900/30 hover:bg-red-500/20 active:scale-95 text-red-400 font-display text-[16px] font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {verifying ? "hourglass_empty" : "key"}
              </span>
              {verifying ? "AUTHORIZING..." : "VERIFY CRITICAL PASSCODE"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-36 md:pb-8 animate-in fade-in duration-300 space-y-8">
      {/* 1. Core Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">admin_panel_settings</span>
            Core Database Administration
          </h2>
          <p className="text-on-surface-variant text-[16px] mt-1 font-light">
            Authorized session active. Directly delete, inspect, or bulk-purge records.
          </p>
        </div>
        
        <button
          onClick={() => onAdminUnlock(null)}
          className="px-4 py-2 border border-red-900/30 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-[13px] font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer self-start sm:self-center flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Lock Session
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setAdminSubTab("spots")}
          className={`pb-3 font-display text-[14px] font-bold tracking-wider uppercase transition-all relative cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "spots" ? "text-primary font-black" : "text-on-surface-variant hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">database</span>
          Spots & Reviews
          {adminSubTab === "spots" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-in fade-in" />
          )}
        </button>
        <button
          onClick={() => setAdminSubTab("feedback")}
          className={`pb-3 font-display text-[14px] font-bold tracking-wider uppercase transition-all relative cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === "feedback" ? "text-primary font-black" : "text-on-surface-variant hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">rate_review</span>
          Feature Feedback
          {adminSubTab === "feedback" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-in fade-in" />
          )}
        </button>
      </div>

      {/* 2. Content Switching Layout */}
      {adminSubTab === "spots" ? (
        !selectedBar ? (
          /* Spots Database Table View (Full Width) */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
                <h3 className="font-display text-xl font-bold text-white">
                  Spots Database ({bars.length} records)
                </h3>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  {/* Search input */}
                  <div className="relative max-w-xs w-full">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder="Filter name / address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[14px] text-white focus:outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>

                  {/* Country filter select dropdown */}
                  <div className="relative max-w-xs w-full">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/5 rounded-xl pl-4 pr-10 py-2 text-[14px] text-white focus:outline-none focus:border-primary/40 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">All Countries ({bars.length})</option>
                      {availableCountries.map((country) => (
                        <option key={country} value={country}>
                          {country} ({countryCounts[country]})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Area */}
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-white/5">
                      <th 
                        onClick={() => toggleSort("name")}
                        className="p-3 pl-4 cursor-pointer hover:text-white transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Name
                          {sortKey === "name" && (
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort("score")}
                        className="p-3 cursor-pointer hover:text-white transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Dive Score
                          {sortKey === "score" && (
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort("reviews")}
                        className="p-3 cursor-pointer hover:text-white transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Reviews
                          {sortKey === "reviews" && (
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {processedBars.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-on-surface-variant font-light">
                          No bars matched the query.
                        </td>
                      </tr>
                    ) : (
                      processedBars.map((bar) => {
                        const calculatedReviews = bar.reviews || [];
                        const calculatedScore = calculatedReviews.length > 0 
                          ? (calculatedReviews.reduce((acc, r) => acc + r.diveScore, 0) / calculatedReviews.length).toFixed(1)
                          : "0.0";

                        return (
                          <tr
                            key={bar.id}
                            className="hover:bg-white/5 cursor-pointer transition-colors text-white"
                            onClick={() => {
                              setSelectedBarId(bar.id);
                              // Clear bulk select when bar changes
                              setSelectedReviewIds([]);
                            }}
                          >
                            <td className="p-3 pl-4 font-semibold max-w-[300px] truncate">
                              <span className="block text-[15px]">{bar.name}</span>
                              <span className="block text-[12px] text-on-surface-variant font-light mt-0.5 max-w-[300px] truncate">{bar.address}</span>
                            </td>
                            <td className="p-3 font-display font-black text-[15px]">
                              ★ {calculatedScore}
                            </td>
                            <td className="p-3 font-bold">
                              {calculatedReviews.length}
                            </td>
                            <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                {onBarSelect && (
                                  <button
                                    onClick={() => onBarSelect(bar.id)}
                                    className="p-2 bg-surface-container-low hover:bg-white/10 rounded-lg text-white transition-colors"
                                    title="View on Map"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">map</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteBar(bar.id, bar.name)}
                                  disabled={deletingBarId === bar.id}
                                  className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 hover:border-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete Spot permanently"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {deletingBarId === bar.id ? "hourglass_empty" : "delete"}
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Reviews List for Selected Bar (Full Width) */
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              
              {/* Reviews Section Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedBarId(null)}
                    className="px-3.5 py-2 bg-surface-container-low hover:bg-white/10 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[13px] font-bold uppercase"
                    title="Back to Spots List"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back to Spots
                  </button>
                  <div className="border-l border-white/10 pl-3">
                    <span className="text-[12px] font-bold text-primary uppercase tracking-widest">
                      Inspecting Reviews
                    </span>
                    <h3 className="font-display text-xl font-bold text-white line-clamp-1">
                      {selectedBar.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBarId(null)}
                  className="p-2 hover:bg-white/5 rounded-xl text-on-surface-variant hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title="Back to Spots List"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Bulk Operations Toolbar */}
              <div className="flex items-center justify-between gap-3 bg-surface-container-low/40 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(selectedBar.reviews || []).length > 0 && (selectedBar.reviews || []).every(r => selectedReviewIds.includes(r.id))}
                    onChange={handleSelectAllReviews}
                    className="w-4.5 h-4.5 rounded border-white/10 bg-surface-container-lowest text-primary accent-primary focus:ring-transparent transition-colors cursor-pointer"
                  />
                  <span className="text-[13px] text-on-surface-variant font-bold uppercase tracking-wider">
                    {selectedReviewIds.length} selected
                  </span>
                </div>

                <button
                  onClick={handleBulkDeleteReviews}
                  disabled={selectedReviewIds.length === 0 || bulkDeleting}
                  className="px-3.5 py-2 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 hover:border-red-900/50 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-[12px] font-bold tracking-widest uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {bulkDeleting ? "hourglass_empty" : "delete_sweep"}
                  </span>
                  Bulk Purge Selected
                </button>
              </div>

              {/* Reviews Table */}
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-white/5">
                      <th className="p-3 pl-4 w-10"></th>
                      <th className="p-3">User Signature</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Comment</th>
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(selectedBar.reviews || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-on-surface-variant font-light">
                          No reviews found for this spot.
                        </td>
                      </tr>
                    ) : (
                      (selectedBar.reviews || []).map((review) => {
                        const isChecked = selectedReviewIds.includes(review.id);
                        return (
                          <tr
                            key={review.id}
                            className={`hover:bg-white/5 transition-colors ${isChecked ? 'bg-primary/5' : ''}`}
                          >
                            <td className="p-3 pl-4">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleReviewSelection(review.id)}
                                className="w-4 h-4 rounded border-white/10 bg-surface-container-lowest text-primary accent-primary cursor-pointer animate-in fade-in"
                              />
                            </td>
                            <td className="p-3 font-mono text-[11px] text-neutral-400 select-all max-w-[200px] truncate">
                              {review.reviewerToken}
                            </td>
                            <td className="p-3 font-display font-black text-primary text-[15px]">
                              ★ {review.diveScore.toFixed(1)}
                            </td>
                            <td className="p-3 max-w-[300px] truncate font-light text-on-surface-variant">
                              {review.comment || (
                                <span className="italic text-neutral-600">No comment</span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4">
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                disabled={deletingReviewId === review.id}
                                className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 hover:border-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete review"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {deletingReviewId === review.id ? "hourglass_empty" : "delete"}
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )
      ) : (
        /* Feature Feedback Administration View */
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">forum</span>
                Feature Requests & Feedback ({feedbackList.length} items)
              </h3>
              <button
                onClick={fetchFeedback}
                disabled={loadingFeedback}
                className="px-3 py-2 bg-surface-container-low hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider disabled:opacity-50"
                title="Refresh Feedback"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Refresh
              </button>
            </div>

            {loadingFeedback ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant space-y-3">
                <span className="flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-semibold tracking-wide">Loading community feedback...</span>
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant font-light">
                No feedback items found in the database.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-[13px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-white/5">
                      <th className="p-4 w-1/4">User Signature</th>
                      <th className="p-4 w-1/3">Feedback Content</th>
                      <th className="p-4 w-1/6">Status</th>
                      <th className="p-4 w-1/4">Admin Comment</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {feedbackList.map((item) => {
                      const isEditing = editingFeedbackId === item.id;
                      const statusColors: Record<string, string> = {
                        "Pending": "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20",
                        "Under Review": "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                        "Planned": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                        "Completed": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                      };

                      return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors align-top text-white">
                          <td className="p-4 font-mono text-[11px] text-neutral-400 select-all truncate max-w-[150px]">
                            {item.reviewerToken}
                            <span className="block text-[10px] text-neutral-600 font-sans font-light mt-1">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <textarea
                                value={editFeedbackContent}
                                onChange={(e) => setEditFeedbackContent(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/10 rounded-xl p-3 text-[14px] text-white focus:outline-none focus:border-primary/40 transition-colors min-h-[80px]"
                                placeholder="Edit feedback content..."
                              />
                            ) : (
                              <p className="whitespace-pre-wrap font-light text-[14px] leading-relaxed text-neutral-200 font-sans">
                                {item.content}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <select
                                id={`status-select-${item.id}`}
                                defaultValue={item.status}
                                className="bg-surface-container-lowest border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Planned">Planned</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider ${statusColors[item.status] || statusColors.Pending}`}>
                                {item.status}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <textarea
                                value={editAdminComment}
                                onChange={(e) => setEditAdminComment(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/10 rounded-xl p-3 text-[14px] text-white focus:outline-none focus:border-primary/40 transition-colors min-h-[80px]"
                                placeholder="Add custom admin comment/response..."
                              />
                            ) : item.adminComment ? (
                              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Admin Response</span>
                                <p className="text-[13px] font-light leading-relaxed text-neutral-300 whitespace-pre-wrap font-sans">{item.adminComment}</p>
                              </div>
                            ) : (
                              <span className="italic text-neutral-600 font-light text-[13px]">No comment yet</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const selectEl = document.getElementById(`status-select-${item.id}`) as HTMLSelectElement;
                                      handleSaveFeedback(item.id, selectEl?.value || item.status);
                                    }}
                                    disabled={savingFeedbackId === item.id}
                                    className="px-3 py-1.5 bg-primary hover:bg-primary/80 text-black text-[12px] font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                    title="Save changes"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingFeedback}
                                    className="px-3 py-1.5 bg-surface-container-low hover:bg-white/10 text-white text-[12px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                                    title="Cancel"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditingFeedback(item)}
                                    className="p-2 bg-surface-container-low hover:bg-white/10 text-white rounded-lg transition-colors"
                                    title="Edit feedback & reply"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFeedback(item.id)}
                                    disabled={deletingFeedbackId === item.id}
                                    className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 hover:border-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete feedback"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {deletingFeedbackId === item.id ? "hourglass_empty" : "delete"}
                                    </span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
