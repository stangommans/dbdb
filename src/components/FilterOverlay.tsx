"use client";

import { useState } from "react";

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priceRange: number;
  setPriceRange: (price: number) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  selectedAmenities: string[];
  setSelectedAmenities: (amenities: string[]) => void;
  barCount: number;
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
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  selectedAmenities,
  setSelectedAmenities,
  barCount,
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
    setPriceRange(5);
    setMinRating(0);
    setSelectedAmenities([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Sliding Sheet */}
      <div 
        className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-white tracking-tight">
              Filter discovery
            </h3>
            <p className="text-[11px] font-bold text-primary tracking-widest uppercase mt-0.5">
              Refining {barCount} hidden gems
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Filters Scrollable Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Search bar segment */}
          <div className="space-y-2">
            <label className="block font-display text-xs font-bold text-primary tracking-widest uppercase">
              Keywords
            </label>
            <div className="flex items-center gap-2 bg-surface-container-lowest border border-white/10 px-4 py-2.5 rounded-xl">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full focus:ring-0 focus:outline-none placeholder-on-surface-variant/30"
              />
            </div>
          </div>

          {/* Price index slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-display text-xs font-bold text-primary tracking-widest uppercase">
                Maximum Price Index
              </label>
              <span className="font-display text-sm font-bold text-white">
                {"$".repeat(priceRange) || "N/A"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full accent-primary-container bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-bold tracking-tight uppercase px-1">
              <span>Dirt Cheap</span>
              <span>Ultra Premium</span>
            </div>
          </div>

          {/* Rating filter slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-display text-xs font-bold text-primary tracking-widest uppercase">
                Minimum Dive Score
              </label>
              <span className="font-display text-sm font-bold text-white flex items-center gap-1">
                <span className="text-primary">★</span> {minRating.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full accent-primary-container bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-bold tracking-tight uppercase px-1">
              <span>Any Murkiness</span>
              <span>Legendary (5.0)</span>
            </div>
          </div>

          {/* Tag multi-filters */}
          <div className="space-y-3">
            <label className="block font-display text-xs font-bold text-primary tracking-widest uppercase">
              Vibes & Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((option) => {
                const active = selectedAmenities.includes(option.key);
                return (
                  <button
                    key={option.key}
                    onClick={() => toggleAmenity(option.key)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold font-display transition-all cursor-pointer select-none active:scale-95
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
        <div className="px-6 py-4 border-t border-white/10 bg-surface-container-lowest flex items-center justify-between gap-4">
          <button
            onClick={clearFilters}
            className="text-on-surface-variant hover:text-white font-display text-xs font-bold tracking-widest uppercase hover:underline cursor-pointer"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
