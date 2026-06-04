"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, convertFromBase } from "@/lib/currency";
import VesselIcon from "@/components/VesselIcon";

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
}

interface ProfileViewProps {
  bars: Bar[];
  reviewerToken: string | null;
  savedBarCount: number;
  activeCurrency?: string;
  onBarSelect?: (barId: string) => void;
  onReviewDeleted?: () => void;
}

export default function ProfileView({ 
  bars, 
  reviewerToken, 
  savedBarCount,
  activeCurrency = 'EUR',
  onBarSelect,
  onReviewDeleted,
}: ProfileViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract and enrich user's reviews with bar details
  const userReviews = bars.flatMap((bar) =>
    (bar.reviews || [])
      .filter((review) => review.reviewerToken === reviewerToken)
      .map((review) => ({
        ...review,
        barId: bar.id,
        barName: bar.name,
        barAddress: bar.address,
      }))
  );

  // Sort by newest first
  userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const reviewsCount = userReviews.length;
  const photosCount = userReviews.filter((r) => r.photoUrl).length;

  const copyToken = () => {
    if (!reviewerToken) return;
    navigator.clipboard.writeText(reviewerToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onReviewDeleted) {
          onReviewDeleted();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete review.");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("An unexpected error occurred while deleting the review.");
    } finally {
      setDeletingId(null);
    }
  };

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(reviewsCount / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const paginatedReviews = userReviews.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-36 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Intro section */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          Anonymous Profile
        </h2>
        <p className="text-on-surface-variant text-[18px] mt-1.5 max-w-2xl font-light">
          Your dashboard is backed by a secure, cryptographic anonymous token. No emails, no passwords, no tracker scripts. Pure privacy.
        </p>
      </div>

      {/* 1. Contribution Stats Row (Top Full-width Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/5 bg-surface-container-low/30">
          <span className="text-[14px] font-bold text-primary tracking-widest uppercase">
            Reviewed
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-4xl font-black text-white">
              {reviewsCount}
            </span>
            <span className="text-[14px] text-on-surface-variant font-light">Dives rated</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/5 bg-surface-container-low/30">
          <span className="text-[14px] font-bold text-primary tracking-widest uppercase">
            Photos
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-4xl font-black text-white">
              {photosCount}
            </span>
            <span className="text-[14px] text-on-surface-variant font-light">Images shared</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/5 bg-surface-container-low/30">
          <span className="text-[14px] font-bold text-[#a3a3a3] tracking-widest uppercase">
            Stashed
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-4xl font-black text-white">
              {savedBarCount}
            </span>
            <span className="text-[14px] text-on-surface-variant font-light">Saved retreats</span>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Your Submitted Reviews Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-display text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">rate_review</span>
                Your Submitted Reviews
              </h3>
              <span className="text-[14px] text-on-surface-variant font-bold bg-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                {reviewsCount} Review{reviewsCount === 1 ? '' : 's'}
              </span>
            </div>

            {reviewsCount === 0 ? (
              <div className="py-12 px-4 text-center space-y-3.5 bg-surface-container-low/20 border border-dashed border-white/5 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[26px]">chat_bubble_outline</span>
                </div>
                <div>
                  <h4 className="font-display text-[18px] font-bold text-white">No reviews found</h4>
                  <p className="text-[18px] text-on-surface-variant font-light max-w-sm mx-auto mt-1">
                    Explore the map, click on a spot, and share your first dive review to see it listed here!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedReviews.map((review) => {
                  const reviewDate = new Date(review.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  const activeCurr = activeCurrency;
                  const currencySymbol = CURRENCIES.find(c => c.code === activeCurr)?.symbol || '€';
                  
                  let formattedPrice = '';
                  if (review.purchasePrice !== null && review.purchasePrice !== undefined) {
                    formattedPrice = `${currencySymbol}${review.purchasePrice.toFixed(2)}`;
                  }

                  return (
                    <div 
                      key={review.id} 
                      className="bg-surface-container-low/40 border border-white/5 p-4 rounded-xl space-y-3 hover:border-white/10 transition-colors"
                    >
                      {/* Review Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h4 
                            onClick={() => onBarSelect && onBarSelect(review.barId)}
                            className="font-display text-lg font-bold text-white hover:text-primary transition-colors cursor-pointer inline-block"
                          >
                            {review.barName}
                          </h4>
                          <p className="text-[14px] text-on-surface-variant mt-0.5 font-light">
                            {review.barAddress}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {/* Rating Badge */}
                          <div className="bg-black/60 px-2.5 py-1 rounded-lg text-[14px] font-bold font-display border border-white/5 flex items-center gap-1 shrink-0">
                            <span className="text-primary text-[14px]">★</span>
                            <span className="text-white">{review.diveScore.toFixed(1)}</span>
                          </div>
                          
                          {/* Date Label */}
                          <span className="text-[12px] text-on-surface-variant font-light bg-white/5 px-2 py-1 rounded shrink-0">
                            {reviewDate}
                          </span>
                        </div>
                      </div>

                      {/* Drink Specifications (if present) */}
                      {(review.vessel || review.vesselSize || formattedPrice) && (
                        <div className="inline-flex flex-wrap items-center gap-2 text-[14px] font-bold tracking-wide text-primary-container bg-primary-container/10 px-3 py-1.5 rounded-lg">
                          <VesselIcon vessel={review.vessel} className="w-3.5 h-3.5" />
                          <span className="capitalize">{review.vessel || 'Drink'}</span>
                          {review.vesselSize && <span className="opacity-60">({review.vesselSize})</span>}
                          {formattedPrice && (
                            <>
                              <span className="opacity-40">•</span>
                              <span>{formattedPrice}</span>
                            </>
                          )}
                          {review.pricePerMl !== null && review.pricePerMl !== undefined && (() => {
                            const rate = convertFromBase(review.pricePerMl, activeCurr);
                            return (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-[13px] opacity-75">{(rate * 100).toFixed(1)}c/ml</span>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Review Comment text & optional photo preview */}
                      <div className="flex gap-4 items-start justify-between">
                        {review.comment && (
                          <blockquote className="flex-grow text-[16px] text-on-surface-variant font-light leading-relaxed border-l-2 border-primary/20 pl-3 italic">
                            &ldquo;{review.comment}&rdquo;
                          </blockquote>
                        )}
                        
                        {review.photoUrl && (
                          <a 
                            href={review.photoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="shrink-0 w-16 h-16 relative rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-colors"
                            title="Open photo in new tab"
                          >
                            <img
                              src={review.photoUrl}
                              alt="Review upload preview"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        )}
                      </div>

                      {/* Action buttons (Go to bar, Edit, Delete) */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => onBarSelect && onBarSelect(review.barId)}
                          className="px-3 py-1.5 bg-surface-container-low border border-white/5 hover:border-white/20 active:scale-95 text-[13px] font-bold tracking-wider uppercase text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Go to Bar
                        </button>
                        
                        <button
                          onClick={() => router.push(`/bar/${review.barId}/review/${review.id}`)}
                          className="px-3 py-1.5 bg-surface-container-low border border-white/5 hover:border-white/20 active:scale-95 text-[13px] font-bold tracking-wider uppercase text-primary rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingId === review.id}
                          className="px-3 py-1.5 bg-red-955/20 border border-red-900/30 hover:bg-red-950/40 hover:border-red-900/50 active:scale-95 text-[13px] font-bold tracking-wider uppercase text-red-400 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {deletingId === review.id ? "hourglass_empty" : "delete"}
                          </span>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/5">
                <span className="text-[14px] text-on-surface-variant font-light">
                  Showing {Math.min((activePage - 1) * itemsPerPage + 1, reviewsCount)}–
                  {Math.min(activePage * itemsPerPage, reviewsCount)} of {reviewsCount} reviews
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    className="px-3 py-2 bg-surface-container-low border border-white/5 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[13px] font-bold tracking-widest uppercase rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    Prev
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 font-display text-[14px] font-bold rounded-lg transition-all cursor-pointer border flex items-center justify-center
                          ${activePage === pageNum 
                            ? 'bg-primary border-primary text-black shadow-lg shadow-amber-500/10' 
                            : 'bg-surface-container-low border-white/5 hover:border-white/15 text-white'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="px-3 py-2 bg-surface-container-low border border-white/5 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[13px] font-bold tracking-widest uppercase rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    Next
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Token Credentials Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-tight">
                Cryptographic Key
              </h3>
              <p className="text-[18px] font-bold text-primary tracking-widest uppercase mt-1">
                Your Unique Anonymous Signature
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <code className="bg-surface-container-lowest border border-white/5 px-4 py-3.5 rounded-xl text-[18px] font-mono text-primary font-bold overflow-x-auto select-all flex items-center whitespace-nowrap min-h-[48px]">
                {reviewerToken || "Retrieving cryptographic signature..."}
              </code>
              <button
                onClick={copyToken}
                disabled={!reviewerToken}
                className="w-full px-5 py-3.5 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-[18px] font-bold tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "COPIED" : "COPY KEY"}
              </button>
            </div>

            <div className="bg-surface-container-low/50 border border-white/5 p-4 rounded-xl space-y-2">
              <h4 className="text-[18px] font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#84cc16] text-[18px]">verified_user</span>
                Privacy Guard Guarantee
              </h4>
              <p className="text-[18px] text-on-surface-variant font-light leading-relaxed">
                This token is stored as a secure HTTP-Only cookie. It binds your local reviews and uploads to your browser anonymously, enabling you to add and edit them freely without exposing your identity.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
