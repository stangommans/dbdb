"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AddBarSheet from '@/components/AddBarSheet';
import ReviewForm from '@/components/ReviewForm';
import FilterOverlay from '@/components/FilterOverlay';
import ExploreView from '@/components/ExploreView';
import StashView from '@/components/StashView';
import ProfileView from '@/components/ProfileView';

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
  relativePrice: number | null;
  murkiness: string | null;
  comment: string | null;
  photoUrl: string | null;
  reviewerToken: string;
  createdAt: string;
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
  averageRelativePrice: number | null;
  murkinessStats: {
    MURKY: number;
    AVERAGE: number;
    ACTUALLY_NICE: number;
  };
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
  
  // Real-time Filters Overlay states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(5);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Map coordination states
  const [newPinCoords, setNewPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null); // Image lightbox controller
  const [adminPasscode, setAdminPasscode] = useState<string | null>(null);

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

  // Real-time Filters & Sort logic
  const filteredAndSortedBars = bars
    .filter((bar) => {
      // 1. Search Query Matcher
      const matchQuery = searchQuery.toLowerCase();
      const matchesSearch =
        bar.name.toLowerCase().includes(matchQuery) ||
        bar.address.toLowerCase().includes(matchQuery);

      if (!matchesSearch) return false;

      // 2. Relative Price Limit ($)
      if (bar.averageRelativePrice !== null && bar.averageRelativePrice > priceRange) {
        return false;
      }

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
  if (priceRange < 5) activeFilterCount++;
  if (minRating > 0) activeFilterCount++;
  if (selectedAmenities.length > 0) activeFilterCount += selectedAmenities.length;

  // Calculate human-friendly price indicators
  const renderRelativePriceTag = (score: number | null) => {
    if (score === null || score === undefined) return 'N/A';
    const rounded = Math.round(score);
    return '$'.repeat(rounded);
  };

  return (
    <main className="relative w-screen h-screen bg-[#131313] text-[#e5e2e1] flex flex-col overflow-hidden font-sans">
      
      {/* 1. TOP APP BAR GLASS HEADER */}
      <header className="w-full shrink-0 h-16 glass-panel border-x-0 border-t-0 px-6 flex items-center justify-between z-30">
        {/* Brand details */}
        <div className="flex items-center gap-3 select-none">
          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] font-sans animate-pulse">🍺</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-lg font-bold text-white tracking-widest leading-none">DBDB</h1>
              {adminPasscode && (
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" title="Admin Mode Active" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {adminPasscode ? "Admin Console" : "Divebar Database"}
            </span>
          </div>
        </div>

        {/* Global actions bar */}
        <div className="flex items-center gap-3">
          {/* Quick Filters toggle */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="relative p-2.5 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 font-display text-xs font-bold text-on-surface-variant hover:text-white uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full flex items-center justify-center border border-[#131313] shadow-md">
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
            className="px-4 py-2.5 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_location</span>
            <span className="hidden sm:inline">Add Spot</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT PANEL VIEWS ROUTER */}
      <div className="flex-1 w-full relative overflow-hidden">
        
        {/* MAP VIEW TAB */}
        <div className={`absolute inset-0 z-10 w-full h-full transition-opacity duration-300 
          ${activeTab === 'MAP' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          <Map
            bars={filteredAndSortedBars}
            selectedBarId={selectedBarId}
            onBarSelect={(id) => setSelectedBarId(id)}
            onMapClick={handleMapClick}
            newPinCoords={newPinCoords}
          />

          {/* Floating Sidebar overlays (Desktop/Tablet list overlay) */}
          <div className="absolute left-6 top-6 bottom-6 z-[450] w-[380px] glass-panel rounded-2xl flex flex-col shadow-2xl transition-all duration-300 max-md:hidden transform translate-z-0">
            {/* Quick stats and sort dropdown */}
            <div className="p-4 border-b border-white/5 bg-surface-container-lowest/20 flex items-center justify-between flex-shrink-0">
              <span className="font-display text-[10px] font-bold text-primary tracking-widest uppercase">
                Discover dives ({filteredAndSortedBars.length})
              </span>
              <div className="flex bg-surface-container-lowest border border-white/5 rounded-xl p-0.5">
                {[
                  { key: 'rating', label: 'Score' },
                  { key: 'reviews', label: 'Reviews' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSortBy(item.key as any)}
                    className={`px-2.5 py-1.5 rounded-lg font-display text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer
                      ${sortBy === item.key
                        ? 'bg-primary-container text-on-primary-container shadow-md shadow-amber-500/10'
                        : 'text-on-surface-variant hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list items */}
            <div className="flex-grow overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
                  <span className="flex h-4 w-4 animate-spin rounded-full border-2 border-primary-container border-t-transparent mr-2" />
                  Loading listings...
                </div>
              ) : filteredAndSortedBars.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-on-surface-variant/75 space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 animate-pulse">
                    local_bar
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-white">No spots found</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-normal max-w-[200px]">
                      Search elsewhere, adjust filters, or drop a pin on the map to add one.
                    </p>
                  </div>
                </div>
              ) : (
                filteredAndSortedBars.map((bar) => {
                  const active = bar.id === selectedBarId;
                  const priceTag = bar.averageRelativePrice 
                    ? "$".repeat(Math.round(bar.averageRelativePrice)) 
                    : null;

                  return (
                    <div
                      key={bar.id}
                      onClick={() => setSelectedBarId(bar.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none group relative overflow-hidden
                        ${active
                          ? 'border-primary-container bg-primary-container/5 shadow-lg'
                          : 'border-white/5 bg-surface-container-low/40 hover:border-white/10 hover:bg-surface-container-low'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display font-bold text-sm text-white group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {bar.name}
                        </h3>
                        <div className="flex items-center gap-1 text-primary font-bold text-[10px] flex-shrink-0 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10">
                          <span>★</span>
                          <span>{bar.averageDiveScore ? bar.averageDiveScore.toFixed(1) : '0.0'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant font-light mt-1.5 line-clamp-1">{bar.address}</p>
                      
                      <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/5 text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
                        <span>{bar.reviewCount} Review{bar.reviewCount === 1 ? '' : 's'}</span>
                        {priceTag && (
                          <>
                            <span>•</span>
                            <span className="text-primary">{priceTag}</span>
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
          <div className="absolute inset-0 z-20 w-full h-full bg-[#131313] overflow-y-auto custom-scrollbar">
            <ExploreView
              bars={filteredAndSortedBars}
              onBarSelect={(id) => {
                setSelectedBarId(id);
                setActiveTab('MAP');
              }}
              selectedBarId={selectedBarId}
            />
          </div>
        )}

        {/* STASH FAVORITES TAB */}
        {activeTab === 'STASH' && (
          <div className="absolute inset-0 z-20 w-full h-full bg-[#131313] overflow-y-auto custom-scrollbar">
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
          <div className="absolute inset-0 z-20 w-full h-full bg-[#131313] overflow-y-auto custom-scrollbar">
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
            className="absolute right-6 top-6 bottom-6 z-[460] w-[420px] glass-panel rounded-2xl flex flex-col shadow-2xl transition-all duration-300
              max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:w-full max-md:h-[65vh] max-md:rounded-t-2xl max-md:border-x-0 max-md:border-b-0 max-md:border-t transform translate-z-0"
          >
            {/* Drawer Header detail */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-surface-container-lowest/20">
              <div className="truncate pr-4">
                <h2 className="font-display text-base font-bold text-white truncate">{selectedBar.name}</h2>
                <p className="text-xs text-on-surface-variant font-light truncate mt-0.5">{selectedBar.address}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Admin Delete Bar Button */}
                {adminPasscode && (
                  <button
                    onClick={() => handleDeleteBar(selectedBar.id)}
                    className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                    title="Delete spot (Permanently purges bar & all ratings)"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
                {/* Heart Quick Favorite icon */}
                <button
                  onClick={() => toggleSaveBar(selectedBar.id)}
                  className="text-on-surface-variant hover:text-primary active:scale-90 transition-all p-2 hover:bg-white/5 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: ` 'FILL' ${savedBarIds.includes(selectedBar.id) ? '1' : '0'} ` }}
                  >
                    favorite
                  </span>
                </button>
                {/* Close Drawer button */}
                <button
                  onClick={() => setSelectedBarId(null)}
                  className="text-on-surface-variant hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable details panel */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Aggregated widgets grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Star rating panel */}
                <div className="p-4 bg-surface-container-low border border-white/5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Dive Score</span>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <span className="font-display text-2xl font-bold text-white">
                      {selectedBar.averageDiveScore ? selectedBar.averageDiveScore.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">/ 5.0</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant mt-1.5 font-bold uppercase tracking-wider">Based on {selectedBar.reviewCount} rating{selectedBar.reviewCount === 1 ? '' : 's'}</div>
                </div>

                {/* Relative price panel */}
                <div className="p-4 bg-surface-container-low border border-white/5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Price Index</span>
                  <div className="mt-2.5 text-xl font-bold text-white tracking-widest font-display">
                    {selectedBar.averageRelativePrice !== null ? renderRelativePriceTag(selectedBar.averageRelativePrice) : 'N/A'}
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5 font-bold uppercase tracking-wider">
                    {selectedBar.averageRelativePrice !== null 
                      ? selectedBar.averageRelativePrice <= 2 
                        ? '🟢 Inexpensive' 
                        : selectedBar.averageRelativePrice >= 4 
                          ? '🔴 Pricier Pub' 
                          : '🟡 Average Pricing'
                      : 'No price ratings'}
                  </span>
                </div>

                {/* Atmospheric murkiness metrics */}
                <div className="col-span-2 p-4 bg-surface-container-low border border-white/5 rounded-2xl space-y-3">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-primary">Atmospheric Murkiness</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider">
                    <div className="bg-surface-container-lowest border border-white/5 p-2 rounded-xl">
                      <span className="text-on-surface-variant block mb-1 font-semibold">🟢 Murky</span>
                      <span className="text-white text-xs font-display">{selectedBar.murkinessStats.MURKY}</span>
                    </div>
                    <div className="bg-surface-container-lowest border border-white/5 p-2 rounded-xl">
                      <span className="text-on-surface-variant block mb-1 font-semibold">🟡 Average</span>
                      <span className="text-white text-xs font-display">{selectedBar.murkinessStats.AVERAGE}</span>
                    </div>
                    <div className="bg-surface-container-lowest border border-white/5 p-2 rounded-xl">
                      <span className="text-on-surface-variant block mb-1 font-semibold">🔵 Nice</span>
                      <span className="text-white text-xs font-display">{selectedBar.murkinessStats.ACTUALLY_NICE}</span>
                    </div>
                  </div>
                </div>

                {/* Standard drink ML pricing details */}
                {selectedBar.averagePricePerMl !== null && (
                  <div className="col-span-2 p-4 bg-surface-container-low border border-white/5 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Absolute Drink Pricing</span>
                      <p className="text-[11px] text-on-surface-variant font-light mt-0.5 leading-tight">Est. price of a standard 33cl cold draft beer</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-white font-display block">
                        €{(selectedBar.averagePricePerMl * 330).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-on-surface-variant font-bold tracking-wider">({(selectedBar.averagePricePerMl * 100).toFixed(1)}c/ML)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action items triggers */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingReview(userReviewForSelectedBar || null);
                    setIsReviewOpen(true);
                  }}
                  className="flex-1 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-xs font-bold tracking-widest uppercase py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  {userReviewForSelectedBar ? 'Edit My Review' : 'Write Review'}
                </button>
                
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBar.name + ' ' + selectedBar.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-surface-container border border-white/5 hover:border-white/10 hover:bg-surface-container-high rounded-xl transition-all text-xs font-display font-bold tracking-widest text-white uppercase flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">directions</span>
                  Maps
                </a>
              </div>

              {/* Reviews timeline timeline */}
              <div className="space-y-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-primary border-b border-white/5 pb-2">Reviews ({selectedBar.reviews.length})</span>
                
                {selectedBar.reviews.length === 0 ? (
                  <div className="text-center py-8 bg-surface-container-low/30 border border-white/5 rounded-2xl text-xs text-on-surface-variant font-light">
                    No ratings yet. Be the first to leave a mark!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedBar.reviews.map((review) => {
                      const isOwnReview = review.reviewerToken === userUuid;
                      return (
                        <div
                          key={review.id}
                          className={`p-4 bg-surface-container border rounded-2xl relative
                            ${isOwnReview ? 'border-primary-container/40 bg-primary-container/5' : 'border-white/5'}`}
                        >
                          {/* Top review header */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-bold bg-primary/10 border border-primary/10 px-2 py-0.5 rounded text-[10px] font-display">★ {review.diveScore.toFixed(1)}</span>
                              <span className="text-[10px] text-on-surface-variant font-medium">
                                {new Date(review.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                              <div className="flex items-center gap-2.5">
                              {isOwnReview && (
                                <button
                                  onClick={() => {
                                    setEditingReview(review);
                                    setIsReviewOpen(true);
                                  }}
                                  className="text-primary hover:text-white font-display text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                              {adminPasscode && (
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="text-red-500 hover:text-red-400 font-display text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-0.5"
                                  title="Delete Review Override"
                                >
                                  <span className="material-symbols-outlined text-[12px]">delete</span>
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dynamic metadata filters tags */}
                          {(review.murkiness || review.relativePrice) && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {review.murkiness && (
                                <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-surface-container-lowest border border-white/5 text-on-surface-variant">
                                  {review.murkiness === 'MURKY' && '🟢 Murky'}
                                  {review.murkiness === 'AVERAGE' && '🟡 Average'}
                                  {review.murkiness === 'ACTUALLY_NICE' && '🔵 Nice'}
                                </span>
                              )}
                              {review.relativePrice && (
                                <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-surface-container-lowest border border-white/5 text-primary">
                                  {renderRelativePriceTag(review.relativePrice)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Comment line */}
                          {review.comment && (
                            <p className="text-xs text-on-surface-variant leading-relaxed font-light mt-3 break-words">
                              "{review.comment}"
                            </p>
                          )}

                          {/* Lightbox thumbnail image */}
                          {review.photoUrl && (
                            <div
                              onClick={() => setActivePhotoUrl(review.photoUrl)}
                              className="mt-3.5 h-28 rounded-xl border border-white/5 overflow-hidden bg-surface-container-lowest cursor-zoom-in group relative"
                            >
                              <img
                                src={review.photoUrl}
                                alt="Uploaded bar capture"
                                className="w-full h-full object-cover grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold font-display uppercase tracking-widest text-white transition-opacity">
                                <span className="material-symbols-outlined text-[16px] mr-1">zoom_in</span> Enlarge
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

      {/* 3. MOBILE APP SYSTEM BOTTOM NAVIGATION BAR */}
      <nav className="w-full shrink-0 h-16 glass-panel border-x-0 border-b-0 px-6 flex items-center justify-around z-30 bg-[#1c1b1b]/95">
        {[
          { id: 'MAP', label: 'Map', icon: 'map' },
          { id: 'EXPLORE', label: 'Explore', icon: 'explore' },
          { id: 'STASH', label: 'Stash', icon: 'favorite' },
          { id: 'PROFILE', label: 'Profile', icon: 'person' }
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab);
                // Retain active selection states
              }}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 px-4 py-1 rounded-xl
                ${active 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-white'}`}
            >
              <span 
                className="material-symbols-outlined text-[22px] transition-transform duration-200"
                style={{ 
                  fontVariationSettings: ` 'FILL' ${active ? '1' : '0'} `,
                  transform: active ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {tab.icon}
              </span>
              <span className="font-display text-[9px] font-extrabold tracking-widest uppercase leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 4. MODAL REAL-TIME FILTERS OVERLAY */}
      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        minRating={minRating}
        setMinRating={setMinRating}
        selectedAmenities={selectedAmenities}
        setSelectedAmenities={setSelectedAmenities}
        barCount={filteredAndSortedBars.length}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[440px] h-[90vh] md:h-auto md:max-h-[85vh]">
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
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-white/5">
            <img
              src={activePhotoUrl}
              alt="Fullscreen Bar Visual Preview"
              className="max-w-full max-h-[85vh] object-contain select-none"
            />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-on-surface-variant mt-5 uppercase bg-surface-container-low border border-white/5 px-4 py-2 rounded-full select-none flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">close</span> Tap anywhere to return
          </span>
        </div>
      )}

    </main>
  );
}
