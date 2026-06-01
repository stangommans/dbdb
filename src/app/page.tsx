"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AddBarSheet from '@/components/AddBarSheet';
import ReviewForm from '@/components/ReviewForm';
import FilterOverlay from '@/components/FilterOverlay';
import ExploreView from '@/components/ExploreView';
import StashView from '@/components/StashView';
import ProfileView from '@/components/ProfileView';
import { CURRENCIES, convertFromBase, formatCurrency } from '@/lib/currency';
import VesselIcon from '@/components/VesselIcon';

// Dynamically load Map component to bypass Node SSR environment constraints
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#131313] flex flex-col items-center justify-center text-on-surface-variant space-y-3 font-sans">
      <span className="flex h-8 w-8 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
      <span className="text-sm font-semibold tracking-wide">Igniting neon map overlay...</span>
    </div>
  )
});

interface Review {
  id: string;
  diveScore: number;
  pricePerMl: number | null;
  comment: string | null;
  photoUrl: string | null;
  reviewerToken: string;
  createdAt: string;
  amenities?: string | null;
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
  reviewCount: number;
  averageDiveScore: number;
  averagePricePerMl: number | null;
  reviews: Review[];
}

type Tab = 'MAP' | 'EXPLORE' | 'STASH' | 'PROFILE';

export default function Home() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');

  // Multi-tab Layout states
  const [activeTab, setActiveTab] = useState<Tab>('MAP');
  const [savedBarIds, setSavedBarIds] = useState<string[]>([]);

  // Interactive UI panel controllers
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [isAddBarOpen, setIsAddBarOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  // Real-time Filters Overlay states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Map coordination states
  const [newPinCoords, setNewPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null); // Image lightbox controller
  const [adminPasscode, setAdminPasscode] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState<string>('EUR');

  // Initial resource load
  const fetchData = async () => {
    try {
      // 1. Fetch secure user anonymous UUID token
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserUuid(meData.uuid);
      }

      // 2. Fetch bars with aggregated stats
      const barsRes = await fetch('/api/bars');
      if (barsRes.ok) {
        const barsData = await barsRes.json();
        setBars(barsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard payload:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Load saved stash on client mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dbdb_stash');
      if (stored) {
        try {
          setSavedBarIds(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stash from localStorage:', e);
        }
      }

      const adminStored = localStorage.getItem('dbdb_admin_passcode');
      if (adminStored) {
        setAdminPasscode(adminStored);
      }
      const currencyStored = localStorage.getItem('dbdb_currency');
      if (currencyStored) {
        setActiveCurrency(currencyStored);
      }
    }
  }, []);

  // Map tap handler to launch manual coordinate capture drawer
  const handleMapClick = (lat: number, lng: number) => {
    setNewPinCoords({ latitude: lat, longitude: lng });
    setIsAddBarOpen(true);
  };

  // Callback when a bar is newly created or imported
  const handleBarAdded = (newBar: any) => {
    fetchData();
    setSelectedBarId(newBar.id);
  };

  const handleAdminUnlock = (passcode: string | null) => {
    setAdminPasscode(passcode);
    if (typeof window !== 'undefined') {
      if (passcode) {
        localStorage.setItem('dbdb_admin_passcode', passcode);
      } else {
        localStorage.removeItem('dbdb_admin_passcode');
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!adminPasscode) return;
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode,
        },
      });

      if (res.ok) {
        await fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete review.");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("An unexpected error occurred while deleting the review.");
    }
  };

  const handleDeleteBar = async (barId: string) => {
    if (!adminPasscode) return;
    if (!window.confirm("WARNING: Deleting this bar will permanently erase it along with ALL its reviews. This action cannot be undone. Proceed?")) return;

    try {
      const res = await fetch(`/api/bars/${barId}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": adminPasscode,
        },
      });

      if (res.ok) {
        setSelectedBarId(null);
        await fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete bar.");
      }
    } catch (error) {
      console.error("Error deleting bar:", error);
      alert("An unexpected error occurred while deleting the bar.");
    }
  };

  // Callback when a review is created or updated
  const handleReviewSubmitted = () => {
    fetchData();
  };

  // Stash coordination utilities
  const toggleSaveBar = (id: string) => {
    let updated;
    if (savedBarIds.includes(id)) {
      updated = savedBarIds.filter((bId) => bId !== id);
    } else {
      updated = [...savedBarIds, id];
    }
    setSavedBarIds(updated);
    localStorage.setItem('dbdb_stash', JSON.stringify(updated));
  };

  const handleRemoveBar = (id: string) => {
    const updated = savedBarIds.filter((bId) => bId !== id);
    setSavedBarIds(updated);
    localStorage.setItem('dbdb_stash', JSON.stringify(updated));
  };

  // Find the currently selected bar
  const selectedBar = bars.find((bar) => bar.id === selectedBarId);

  // Determine if the current user has already reviewed the selected bar
  const userReviewForSelectedBar = selectedBar?.reviews?.find(
    (review) => review.reviewerToken === userUuid
  );

  // Get aggregated user-submitted amenity counts for the selected bar
  const votedAmenities = selectedBar
    ? (() => {
      const counts: Record<string, number> = {};
      selectedBar.reviews.forEach((r) => {
        if (r.amenities) {
          r.amenities.split(',').forEach((tag) => {
            const trimmed = tag.trim();
            if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
          });
        }
      });

      const labels: Record<string, string> = {
        CASH_ONLY: "💵 Cash Only",
        POOL_TABLE: "🎱 Pool Table",
        LIVE_MUSIC: "🎸 Live Music",
        CRAFT_BEER: "🍺 Craft Beer",
        SMOKING_AREA: "🚬 Smoking Area",
        JUKEBOX: "🎵 Jukebox",
        DARTBOARD: "🎯 Dartboard",
      };

      return Object.entries(counts)
        .map(([key, count]) => ({
          key,
          label: labels[key] || key,
          count
        }))
        .sort((a, b) => b.count - a.count);
    })()
    : [];

  // Real-time Filters & Sort logic
  const filteredAndSortedBars = bars
    .filter((bar) => {
      // 1. Search Query Matcher
      const matchQuery = searchQuery.toLowerCase();
      const matchesSearch =
        bar.name.toLowerCase().includes(matchQuery) ||
        bar.address.toLowerCase().includes(matchQuery);

      if (!matchesSearch) return false;

      // 3. Minimum Dive Rating (★)
      if (bar.averageDiveScore < minRating) {
        return false;
      }

      // 4. Vibe Tags / Amenities exact matching
      if (selectedAmenities.length > 0) {
        if (!bar.amenities) return false;
        const barAmenities = bar.amenities.split(",");
        const matchesAllAmenities = selectedAmenities.every((amenity) =>
          barAmenities.includes(amenity)
        );
        if (!matchesAllAmenities) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.averageDiveScore - a.averageDiveScore;
      }
      if (sortBy === 'reviews') {
        return b.reviewCount - a.reviewCount;
      }
      return a.name.localeCompare(b.name);
    });

  // Active filter items counter
  let activeFilterCount = 0;
  if (minRating > 0) activeFilterCount++;
  if (selectedAmenities.length > 0) activeFilterCount += selectedAmenities.length;

  // Calculate global average price per ml (EUR) across all reviews in all bars and other global stats
  const globalReviews = bars.flatMap(b => b.reviews || []);
  const totalBars = bars.length;
  const totalReviews = globalReviews.length;
  const uniqueUsersCount = new Set(globalReviews.map(r => r.reviewerToken).filter(Boolean)).size;

  const reviewsWithPrice = globalReviews.filter(r => r.pricePerMl !== null && r.pricePerMl !== undefined);
  const globalAvgPricePerMl = reviewsWithPrice.length > 0
    ? reviewsWithPrice.reduce((sum, r) => sum + (r.pricePerMl || 0), 0) / reviewsWithPrice.length
    : null;
  const activeGlobalAvg330ml = globalAvgPricePerMl !== null
    ? convertFromBase(globalAvgPricePerMl * 330, activeCurrency)
    : null;



  return (
    <main className="relative w-screen h-[100dvh] bg-[#131313] text-[#e5e2e1] flex flex-col overflow-hidden font-sans">

      {/* 1. TOP APP BAR GLASS HEADER */}
      <header className="w-full shrink-0 h-20 glass-panel border-x-0 border-t-0 px-6 flex items-center justify-between z-[600] relative">
        {/* Left section: Brand */}
        <div className="flex items-center gap-4 lg:gap-6 select-none z-10">
          {/* Brand details */}
          <div
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
            title="Refresh Page"
          >
            <div className="relative">
              <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(245,197,24,0.85)] font-sans animate-pulse">🍺</span>
              {adminPasscode && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-[#131313] animate-pulse" title="Admin Mode Active" />
              )}
            </div>
            <div>
              <h1 className="hidden sm:block font-display text-2xl font-black text-white tracking-widest leading-none mb-1">DBDB</h1>
              <span className="text-[18px] font-bold uppercase tracking-wider text-primary block leading-tight">
                {adminPasscode ? "Admin Console" : "Divebar Database"}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Global Stats Bar (Centered on Desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center gap-3 lg:gap-5 bg-[#181818]/60 border border-white/5 rounded-2xl px-4 lg:px-5 py-2.5 lg:py-3 shadow-inner z-0">
          {/* Total Bars */}
          <div className="flex items-center gap-3 border-r border-white/10 pr-5" title="Total Bars">
            <span className="material-symbols-outlined text-[26px] text-amber-500/70 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <div className="flex flex-col">
              <span className="hidden xl:inline text-[18px] font-bold uppercase tracking-wider text-neutral-400 leading-none mb-1">Bars</span>
              <span className="text-2xl font-black text-white leading-none">{totalBars}</span>
            </div>
          </div>

          {/* Total Reviews */}
          <div className="flex items-center gap-3 border-r border-white/10 pr-5" title="Total Reviews">
            <span className="material-symbols-outlined text-[26px] text-amber-500/70 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
            <div className="flex flex-col">
              <span className="hidden xl:inline text-[18px] font-bold uppercase tracking-wider text-neutral-400 leading-none mb-1">Reviews</span>
              <span className="text-2xl font-black text-white leading-none">{totalReviews}</span>
            </div>
          </div>

          {/* Unique Reviewers */}
          <div className="flex items-center gap-3 border-r border-white/10 pr-5" title="Unique Reviewers (who posted)">
            <span className="material-symbols-outlined text-[26px] text-amber-500/70 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <div className="flex flex-col">
              <span className="hidden xl:inline text-[18px] font-bold uppercase tracking-wider text-neutral-400 leading-none mb-1">Reviewers</span>
              <span className="text-2xl font-black text-white leading-none">{uniqueUsersCount}</span>
            </div>
          </div>

          {/* Global Average 330ml */}
          {activeGlobalAvg330ml !== null && (
            <div className="flex items-center gap-3" title="Global Average Price of a 330ml Drink">
              <span className="material-symbols-outlined text-[26px] text-amber-500/70 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <div className="flex flex-col">
                <span className="hidden xl:inline text-[18px] font-bold uppercase tracking-wider text-neutral-400 leading-none mb-1">Avg 330ml</span>
                <span className="text-2xl font-black text-amber-500 leading-none">
                  {formatCurrency(activeGlobalAvg330ml, activeCurrency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global actions bar */}
        <div className="flex items-center gap-3.5">
          {/* Quick Filters toggle */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="relative px-4 py-3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 font-display text-[18px] font-bold text-on-surface-variant hover:text-white uppercase tracking-wider min-h-[48px]"
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 h-6 w-6 bg-primary-container text-on-primary-container text-[14px] font-extrabold rounded-full flex items-center justify-center border border-[#131313] shadow-md">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Manual Spot added trigger */}
          <button
            onClick={() => {
              setNewPinCoords(null);
              setIsAddBarOpen(true);
            }}
            className="px-5 py-3 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-[18px] font-bold tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center gap-2 min-h-[48px]"
          >
            <span className="material-symbols-outlined text-[20px]">add_location</span>
            <span className="hidden sm:inline">Add Spot</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT PANEL VIEWS ROUTER */}
      <div className="flex-1 w-full relative overflow-hidden">

        {/* MAP VIEW TAB */}
        <div className={`absolute inset-0 z-10 w-full h-full bg-[#131313] transition-opacity duration-300 
          ${activeTab === 'MAP' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          <Map
            bars={filteredAndSortedBars}
            selectedBarId={selectedBarId}
            onBarSelect={(id) => setSelectedBarId(id)}
            onMapClick={handleMapClick}
            newPinCoords={newPinCoords}
          />

          {/* Floating Mobile List Trigger */}
          {!selectedBarId && (
            <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[400] md:hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => setIsMobileListOpen(true)}
                className="px-6 py-4 bg-[#131313]/90 backdrop-blur-md border border-white/10 text-primary hover:text-white active:scale-95 font-display text-[18px] font-bold tracking-widest uppercase rounded-full transition-all shadow-2xl shadow-black/80 flex items-center gap-2.5 min-h-[48px]"
              >
                <span className="material-symbols-outlined text-[22px]">list</span>
                <span>List View ({filteredAndSortedBars.length})</span>
              </button>
            </div>
          )}

          {/* Floating Sidebar overlays (Desktop/Tablet list overlay, slide-over drawer on mobile) */}
          <div className={`absolute left-6 top-6 bottom-6 z-[450] w-[450px] max-w-[calc(100vw-48px)] glass-panel rounded-2xl flex flex-col shadow-2xl transition-all duration-300 transform translate-z-0
            ${isMobileListOpen
              ? 'max-md:left-4 max-md:right-4 max-md:top-4 max-md:bottom-4 max-md:w-auto max-md:translate-x-0 max-md:opacity-100'
              : 'max-md:left-4 max-md:right-4 max-md:top-4 max-md:bottom-4 max-md:w-auto max-md:translate-x-[-120%] max-md:opacity-0 max-md:pointer-events-none'
            }
          `}>
            {/* Quick stats and sort dropdown */}
            <div className="p-5 border-b border-white/5 bg-surface-container-lowest/20 flex flex-col gap-4 flex-shrink-0">
              {/* Row 1: Title + Mobile Close Button */}
              <div className="flex items-center justify-between gap-3 w-full">
                <span className="font-display text-[18px] font-bold text-primary tracking-widest uppercase">
                  Discover dives ({filteredAndSortedBars.length})
                </span>
                {/* Mobile close drawer trigger */}
                <button
                  onClick={() => setIsMobileListOpen(false)}
                  className="p-3 bg-[#242424] hover:bg-[#2d2d2d] border border-white/5 rounded-xl text-neutral-400 hover:text-white md:hidden flex items-center justify-center transition-all cursor-pointer min-h-[48px] min-w-[48px]"
                  title="Close List View"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Row 2: Sort Actions */}
              <div className="flex items-center justify-between gap-3 w-full">
                <span className="text-[18px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Sort by
                </span>
                <div className="flex bg-surface-container-lowest border border-white/5 rounded-xl p-1 gap-1">
                  {[
                    { key: 'rating', label: 'Score' },
                    { key: 'reviews', label: 'Reviews' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSortBy(item.key as any)}
                      className={`px-4 py-2.5 rounded-xl font-display text-[18px] font-bold tracking-wider uppercase transition-all cursor-pointer min-h-[48px]
                        ${sortBy === item.key
                          ? 'bg-primary-container text-on-primary-container shadow-md shadow-amber-500/10'
                          : 'text-on-surface-variant hover:text-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable list items */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[18px] text-on-surface-variant">
                  <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-primary-container border-t-transparent mr-3" />
                  Loading listings...
                </div>
              ) : filteredAndSortedBars.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[18px] text-on-surface-variant/75 space-y-4">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 animate-pulse">
                    local_bar
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-white text-[20px]">No spots found</h4>
                    <p className="text-[18px] text-on-surface-variant mt-2 leading-normal max-w-[280px]">
                      Search elsewhere, adjust filters, or drop a pin on the map to add one.
                    </p>
                  </div>
                </div>
              ) : (
                filteredAndSortedBars.map((bar) => {
                  const active = bar.id === selectedBarId;
                  const priceTag = null;

                  return (
                    <div
                      key={bar.id}
                      onClick={() => {
                        setSelectedBarId(bar.id);
                        setIsMobileListOpen(false);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden
                        ${active
                          ? 'border-primary-container bg-primary-container/5 shadow-lg'
                          : 'border-white/5 bg-surface-container-low/40 hover:border-white/10 hover:bg-surface-container-low'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display font-black text-[20px] text-white group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {bar.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-primary font-bold text-[18px] flex-shrink-0 bg-primary/10 px-3 py-1 rounded-xl border border-primary/10">
                          <span>★</span>
                          <span>{bar.averageDiveScore ? bar.averageDiveScore.toFixed(1) : '0.0'}</span>
                        </div>
                      </div>
                      <p className="text-[18px] text-on-surface-variant font-normal mt-2 line-clamp-1">{bar.address}</p>

                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5 text-[18px] font-bold text-on-surface-variant tracking-wider uppercase">
                        <span>{bar.reviewCount} Review{bar.reviewCount === 1 ? '' : 's'}</span>
                        {priceTag && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-black">{priceTag}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* EXPLORE DISCOVERY TAB */}
        {activeTab === 'EXPLORE' && (
          <div className="absolute inset-0 z-20 w-full h-full bg-[#131313] overflow-y-auto custom-scrollbar pb-32">
            <ExploreView
              bars={filteredAndSortedBars}
              onBarSelect={(id) => {
                setSelectedBarId(id);
                setActiveTab('MAP');
              }}
              selectedBarId={selectedBarId}
              activeCurrency={activeCurrency}
            />
          </div>
        )}

        {/* STASH FAVORITES TAB */}
        {activeTab === 'STASH' && (
          <div className="absolute inset-0 z-20 w-full h-full bg-[#131313] overflow-y-auto custom-scrollbar pb-32">
            <StashView
              bars={bars}
              savedBarIds={savedBarIds}
              onBarSelect={(id) => {
                setSelectedBarId(id);
                setActiveTab('MAP');
              }}
              onRemoveBar={handleRemoveBar}
            />
          </div>
        )}

        {/* PROFILE ACCOUNT TAB */}
        {activeTab === 'PROFILE' && (
          <div className="absolute inset-0 z-20 w-full h-full bg-[#131313] overflow-y-auto custom-scrollbar pb-32">
            <ProfileView
              bars={bars}
              reviewerToken={userUuid}
              savedBarCount={savedBarIds.length}
              adminPasscode={adminPasscode}
              onAdminUnlock={handleAdminUnlock}
            />
          </div>
        )}

        {/* DETAILS DRAWER / SIDE-SHEET (Shared across app) */}
        {selectedBar && (
          <div
            className="absolute right-6 top-6 bottom-6 z-[550] w-[460px] max-w-[calc(100vw-32px)] glass-panel rounded-2xl flex flex-col shadow-2xl transition-all duration-300
              max-md:left-4 max-md:right-4 max-md:top-0 max-md:bottom-0 max-md:w-auto max-md:h-[100dvh] transform translate-z-0"
          >
            {/* Drawer Header detail */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-surface-container-lowest/20 gap-3">
              <div className="truncate pr-4">
                <h2 className="font-display text-[22px] font-black text-white truncate">{selectedBar.name}</h2>
                <p className="text-[18px] text-on-surface-variant font-normal truncate mt-1">{selectedBar.address}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Admin Delete Bar Button */}
                {adminPasscode && (
                  <button
                    onClick={() => handleDeleteBar(selectedBar.id)}
                    className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer min-h-[48px] min-w-[48px]"
                    title="Delete spot (Permanently purges bar & all ratings)"
                  >
                    <span className="material-symbols-outlined text-[22px]">delete</span>
                  </button>
                )}
                {/* Heart Quick Favorite icon */}
                <button
                  onClick={() => toggleSaveBar(selectedBar.id)}
                  className="text-on-surface-variant hover:text-primary active:scale-90 transition-all p-3 hover:bg-white/5 rounded-xl cursor-pointer flex items-center justify-center min-h-[48px] min-w-[48px]"
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: ` 'FILL' ${savedBarIds.includes(selectedBar.id) ? '1' : '0'} ` }}
                  >
                    favorite
                  </span>
                </button>
                {/* Close Drawer button */}
                <button
                  onClick={() => setSelectedBarId(null)}
                  className="text-on-surface-variant hover:text-white p-3 hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center cursor-pointer min-h-[48px] min-w-[48px]"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable details panel */}
            <div className="flex-grow overflow-y-auto p-6 pb-20 md:pb-6 space-y-6 custom-scrollbar">

              {/* Aggregated widgets grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Star rating panel */}
                <div className="col-span-2 p-5 bg-surface-container-low border border-white/5 rounded-2xl flex flex-col justify-between min-h-[140px]">
                  <span className="text-[18px] font-bold uppercase tracking-widest text-primary">Dive Score</span>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black text-white">
                      {selectedBar.averageDiveScore ? selectedBar.averageDiveScore.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[18px] text-on-surface-variant font-medium">/ 5.0</span>
                  </div>
                  <div className="text-[18px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider">Based on {selectedBar.reviewCount} rating{selectedBar.reviewCount === 1 ? '' : 's'}</div>
                </div>

                {/* Standard drink ML pricing details */}
                {selectedBar.averagePricePerMl !== null && (() => {
                  const activeAvgPricePerMl = convertFromBase(selectedBar.averagePricePerMl, activeCurrency);
                  const activeSymbol = CURRENCIES.find(c => c.code === activeCurrency)?.symbol || '€';
                  return (
                    <div className="col-span-2 p-5 bg-surface-container-low border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                      <div>
                        <span className="text-[18px] font-bold uppercase tracking-widest text-primary">Absolute Drink Pricing</span>
                        <p className="text-[18px] text-on-surface-variant font-light mt-1 leading-tight">Est. price of a standard 33cl cold draft beer</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[22px] font-black text-white font-display block">
                          {formatCurrency(activeAvgPricePerMl * 330, activeCurrency)}
                        </span>
                        <span className="text-[18px] text-on-surface-variant font-bold tracking-wider">({activeSymbol}{(activeAvgPricePerMl * 100).toFixed(1)}c/ML)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Reviewer Vibe & Amenities Summary */}
              <div className="p-5 bg-surface-container-low border border-white/5 rounded-2xl space-y-4">
                <span className="block text-[18px] font-bold uppercase tracking-widest text-primary">Vibe & Amenities Summary</span>
                {votedAmenities.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {votedAmenities.map((amenity) => (
                      <div
                        key={amenity.key}
                        className="px-4 py-2 rounded-xl border border-amber-500/10 bg-amber-500/5 text-[18px] text-white font-semibold flex items-center gap-2 filter drop-shadow-[0_0_4px_rgba(245,197,24,0.1)] animate-fadeIn"
                      >
                        <span>{amenity.label}</span>
                        <span className="text-[18px] font-extrabold text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-lg">
                          {amenity.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-400">
                    <p className="text-[18px]">No vibe tags submitted yet.</p>
                    <p className="text-[18px] text-neutral-500 font-bold uppercase tracking-wider mt-1.5">Be the first to rate & add tag metrics!</p>
                  </div>
                )}
              </div>

              {/* Action items triggers */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setEditingReview(userReviewForSelectedBar || null);
                    setIsReviewOpen(true);
                  }}
                  className="flex-1 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-[18px] font-bold tracking-widest uppercase py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-[22px]">edit_note</span>
                  {userReviewForSelectedBar ? 'Edit My Review' : 'Write Review'}
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBar.name + ' ' + selectedBar.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 bg-surface-container border border-white/5 hover:border-white/10 hover:bg-surface-container-high rounded-xl transition-all text-[18px] font-display font-bold tracking-widest text-white uppercase flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-[22px]">directions</span>
                  Maps
                </a>
              </div>

              {/* Reviews timeline timeline */}
              <div className="space-y-6">
                <span className="block text-[20px] font-bold uppercase tracking-widest text-primary border-b border-white/5 pb-4.5">
                  Reviews ({selectedBar.reviews.length})
                </span>

                {selectedBar.reviews.length === 0 ? (
                  <div className="text-center py-10 bg-surface-container-low/30 border border-white/5 rounded-2xl text-[18px] text-on-surface-variant font-light">
                    No ratings yet. Be the first to leave a mark!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedBar.reviews.map((review) => {
                      const isOwnReview = review.reviewerToken === userUuid;
                      return (
                        <div
                          key={review.id}
                          className={`p-6 bg-surface-container border rounded-2xl relative space-y-4
                            ${isOwnReview ? 'border-primary-container/40 bg-primary-container/5' : 'border-white/5'}`}
                        >
                          {/* Top review header */}
                          <div className="flex flex-wrap items-center justify-between gap-4 text-[18px]">
                            <div className="flex items-center gap-3.5">
                              <span className="text-primary font-bold bg-primary/10 border border-primary/10 px-3 py-1 rounded text-[18px] font-display">
                                ★ {review.diveScore.toFixed(1)}
                              </span>
                              <span className="text-on-surface-variant font-medium">
                                {new Date(review.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {isOwnReview && (
                                <button
                                  onClick={() => {
                                    setEditingReview(review);
                                    setIsReviewOpen(true);
                                  }}
                                  className="text-primary hover:text-white font-display text-[18px] font-bold tracking-wider uppercase cursor-pointer min-h-[48px] px-4 flex items-center justify-center rounded-xl bg-surface-container-high border border-white/5 hover:border-white/10 active:scale-95 transition-all"
                                >
                                  Edit
                                </button>
                              )}
                              {adminPasscode && (
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="text-red-500 hover:text-red-400 font-display text-[18px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-2 min-h-[48px] px-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/20 active:scale-95 transition-all"
                                  title="Delete Review Override"
                                >
                                  <span className="material-symbols-outlined text-[22px]">delete</span>
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dynamic metadata filters tags */}
                          {review.amenities && (
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {(() => {
                                const labels: Record<string, string> = {
                                  CASH_ONLY: "💵 Cash Only",
                                  POOL_TABLE: "🎱 Pool Table",
                                  LIVE_MUSIC: "🎸 Live Music",
                                  CRAFT_BEER: "🍺 Craft Beer",
                                  SMOKING_AREA: "🚬 Smoking Area",
                                  JUKEBOX: "🎵 Jukebox",
                                  DARTBOARD: "🎯 Dartboard",
                                };
                                return review.amenities.split(',').filter(Boolean).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[18px] font-bold tracking-wider px-3.5 py-2 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500 filter drop-shadow-[0_0_2px_rgba(245,197,24,0.05)]"
                                  >
                                    {labels[tag.trim()] || tag.trim()}
                                  </span>
                                ));
                              })()}
                            </div>
                          )}

                          {/* Purchased Drink Details Badge */}
                          {review.purchasePrice !== null && review.purchasePrice !== undefined && review.vesselSizeMl && (
                            <div className="p-4.5 bg-neutral-950/40 border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[18px]">
                              <span className="text-on-surface-variant font-medium flex items-center gap-2">
                                <VesselIcon vessel={review.vessel} className="w-6 h-6 text-amber-500/70" />
                                <span className="text-neutral-300 font-bold">
                                  {review.vesselSizeMl}ml {review.vessel || 'Drink'}
                                </span>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-white">
                                  {formatCurrency(review.purchasePrice, review.purchaseCurrency || 'EUR')}
                                </span>
                                {review.pricePerMl && (
                                  <span className="text-[18px] text-amber-500 font-bold bg-amber-500/5 px-3 py-1 rounded border border-amber-500/10">
                                    {(() => {
                                      const activePricePerMl = convertFromBase(review.pricePerMl, activeCurrency);
                                      const activeSymbol = CURRENCIES.find(c => c.code === activeCurrency)?.symbol || '€';
                                      return `${activeSymbol}${activePricePerMl.toFixed(4)}/ml`;
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Comment line */}
                          {review.comment && (
                            <p className="text-[18px] text-on-surface-variant leading-loose font-light break-words">
                              "{review.comment}"
                            </p>
                          )}

                          {/* Lightbox thumbnail image */}
                          {review.photoUrl && (
                            <div
                              onClick={() => setActivePhotoUrl(review.photoUrl)}
                              className="h-36 rounded-xl border border-white/5 overflow-hidden bg-surface-container-lowest cursor-zoom-in group relative"
                            >
                              <img
                                src={review.photoUrl}
                                alt="Uploaded bar capture"
                                className="w-full h-full object-cover grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[18px] font-bold font-display uppercase tracking-widest text-white transition-opacity">
                                <span className="material-symbols-outlined text-[22px] mr-2">zoom_in</span> Enlarge
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL REAL-TIME FILTERS OVERLAY */}
      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minRating={minRating}
        setMinRating={setMinRating}
        selectedAmenities={selectedAmenities}
        setSelectedAmenities={setSelectedAmenities}
        barCount={filteredAndSortedBars.length}
        activeCurrency={activeCurrency}
        setActiveCurrency={setActiveCurrency}
      />

      {/* 5. GOOGLE PLACES IMPORT / MANUAL SPOT ADDED SHEET */}
      <AddBarSheet
        isOpen={isAddBarOpen}
        onClose={() => setIsAddBarOpen(false)}
        onBarAdded={handleBarAdded}
        newPinCoords={newPinCoords}
        onCancelNewPin={() => setNewPinCoords(null)}
      />

      {/* 6. WRITE / EDIT DIVE REVIEW SHEET */}
      {isReviewOpen && selectedBar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[480px] max-h-[calc(100dvh-32px)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <ReviewForm
              barId={selectedBar.id}
              barName={selectedBar.name}
              existingReview={editingReview}
              onClose={() => {
                setIsReviewOpen(false);
                setEditingReview(null);
              }}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>
        </div>
      )}

      {/* 7. FULLSCREEN IMAGE LIGHTBOX MODAL OVERLAY */}
      {activePhotoUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-full max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border border-white/5">
            <img
              src={activePhotoUrl}
              alt="Fullscreen Bar Visual Preview"
              className="max-w-full max-h-[80vh] object-contain select-none"
            />
          </div>
          <span className="text-[18px] font-bold tracking-widest text-on-surface-variant mt-6 uppercase bg-surface-container-low border border-white/5 px-6 py-3.5 rounded-full select-none flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">close</span> Tap anywhere to return
          </span>
        </div>
      )}

      {/* UNIFIED FLOATING BOTTOM NAVIGATION BAR */}
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[450] flex items-center justify-around md:justify-center gap-1 md:gap-3 bg-[#181818]/90 backdrop-blur-md border border-white/10 rounded-3xl md:rounded-full p-2 md:p-1.5 shadow-2xl shadow-black/90 w-[calc(100vw-24px)] md:w-auto min-w-[320px] md:min-w-[480px] max-md:min-w-0 transition-all duration-300 transform translate-z-0
        ${(isMobileListOpen || selectedBarId) ? 'max-md:translate-y-28 max-md:opacity-0 max-md:pointer-events-none' : 'max-md:translate-y-0 max-md:opacity-100'}`}
      >
        {[
          { id: 'MAP', label: 'Map', icon: 'map' },
          { id: 'EXPLORE', label: 'Explore', icon: 'explore' },
          { id: 'STASH', label: 'My Stash', icon: 'favorite' },
          { id: 'PROFILE', label: 'Profile', icon: 'person' }
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1.5 md:px-5 py-2 md:py-2.5 rounded-2xl md:rounded-full transition-all cursor-pointer select-none active:scale-95 flex-1 md:flex-initial min-h-[52px] md:min-h-[44px]
                ${active
                  ? 'bg-primary text-neutral-950 font-black shadow-lg shadow-amber-500/10'
                  : 'text-neutral-400 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[24px] md:text-[22px]" style={{ fontVariationSettings: ` 'FILL' ${active ? '1' : '0'} ` }}>{tab.icon}</span>
              <span className="font-display text-[11px] md:text-[18px] font-bold uppercase tracking-wider leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </main>
  );
}
