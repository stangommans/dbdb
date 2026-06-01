"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currency";

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  selectedAmenities: string[];
  setSelectedAmenities: (amenities: string[]) => void;
  barCount: number;
  activeCurrency: string;
  setActiveCurrency: (currency: string) => void;
}

const AMENITIES_OPTIONS = [
  { key: "CASH_ONLY", label: "Cash Only" },
  { key: "POOL_TABLE", label: "Pool Table" },
  { key: "LIVE_MUSIC", label: "Live Music" },
  { key: "CRAFT_BEER", label: "Craft Beer" },
  { key: "SMOKING_AREA", label: "Smoking Area" },
  { key: "JUKEBOX", label: "Jukebox" },
  { key: "DARTBOARD", label: "Dartboard" },
];

export default function FilterOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  minRating,
  setMinRating,
  selectedAmenities,
  setSelectedAmenities,
  barCount,
  activeCurrency,
  setActiveCurrency,
}: FilterOverlayProps) {
  const toggleAmenity = (key: string) => {
    if (selectedAmenities.includes(key)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== key));
    } else {
      setSelectedAmenities([...selectedAmenities, key]);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinRating(0);
    setSelectedAmenities([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      {/* Sliding Sheet */}
      <div 
        className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/10 flex flex-col max-h-[calc(100dvh-32px)]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-display text-[24px] font-bold text-white tracking-tight">
              Filter discovery
            </h3>
            <p className="text-[18px] font-bold text-primary tracking-widest uppercase mt-1">
              Refining {barCount} hidden gems
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors active:scale-90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Filters Scrollable Content */}
        <div className="p-6 space-y-6 md:p-8 md:space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Search bar segment */}
          <div className="space-y-2">
            <label className="block font-display text-[18px] font-bold text-primary tracking-widest uppercase mb-1">
              Keywords
            </label>
            <div className="flex items-center gap-3 bg-surface-container-lowest border border-white/10 px-5 py-3 rounded-xl min-h-[52px]">
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">search</span>
              <input
                type="text"
                placeholder="Search by name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[18px] text-white w-full focus:ring-0 focus:outline-none placeholder-on-surface-variant/30 py-1"
              />
            </div>
          </div>

          {/* Currency Preference Selection */}
          <div className="space-y-3">
            <label className="block font-display text-[18px] font-bold text-primary tracking-widest uppercase mb-1">
              Display Currency
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {CURRENCIES.map((c) => {
                const active = activeCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => {
                      setActiveCurrency(c.code);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("dbdb_currency", c.code);
                      }
                    }}
                    className={`px-3 py-3 rounded-xl border text-[18px] font-bold font-display transition-all cursor-pointer select-none active:scale-95 min-h-[48px] flex items-center justify-center gap-1.5
                      ${
                        active
                          ? "bg-primary-container text-on-primary-container border-primary-container shadow-md shadow-primary-container/10"
                          : "bg-surface-container-low text-on-surface-variant border-white/5 hover:border-white/10 hover:bg-surface-container"
                      }`}
                  >
                    <span className="opacity-70">{c.symbol}</span>
                    <span>{c.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating filter slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-display text-[18px] font-bold text-primary tracking-widest uppercase">
                Minimum Dive Score
              </label>
              <span className="font-display text-[20px] font-bold text-white flex items-center gap-1.5">
                <span className="text-primary">★</span> {minRating.toFixed(1)}
              </span>
            </div>
            <div className="py-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full accent-primary-container bg-surface-container-high h-2 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[18px] text-on-surface-variant font-bold tracking-tight uppercase px-1">
              <span>Any Score</span>
              <span>Legendary (5.0)</span>
            </div>
          </div>

          {/* Tag multi-filters */}
          <div className="space-y-3">
            <label className="block font-display text-[18px] font-bold text-primary tracking-widest uppercase mb-1">
              Vibes & Amenities
            </label>
            <div className="flex flex-wrap gap-2.5">
              {AMENITIES_OPTIONS.map((option) => {
                const active = selectedAmenities.includes(option.key);
                return (
                  <button
                    key={option.key}
                    onClick={() => toggleAmenity(option.key)}
                    className={`px-5 py-3 rounded-xl border text-[18px] font-bold font-display transition-all cursor-pointer select-none active:scale-95 min-h-[48px] flex items-center justify-center
                      ${
                        active
                          ? "bg-primary-container text-on-primary-container border-primary-container shadow-md shadow-primary-container/10"
                          : "bg-surface-container-low text-on-surface-variant border-white/5 hover:border-white/10 hover:bg-surface-container"
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-8 py-6 border-t border-white/10 bg-surface-container-lowest flex items-center justify-between gap-6">
          <button
            onClick={clearFilters}
            className="text-on-surface-variant hover:text-white font-display text-[18px] font-bold tracking-widest uppercase hover:underline cursor-pointer min-h-[48px] px-3 flex items-center justify-center"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-[18px] font-bold tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer min-h-[52px] flex items-center justify-center"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
