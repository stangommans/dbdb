"use client";

import { useState } from "react";

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
  reviews: Review[];
}

interface ProfileViewProps {
  bars: Bar[];
  reviewerToken: string | null;
  savedBarCount: number;
  adminPasscode: string | null;
  onAdminUnlock: (passcode: string | null) => void;
}

export default function ProfileView({ 
  bars, 
  reviewerToken, 
  savedBarCount,
  adminPasscode,
  onAdminUnlock
}: ProfileViewProps) {
  const [copied, setCopied] = useState(false);
  const [inputPasscode, setInputPasscode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [adminError, setAdminError] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPasscode.trim()) return;

    setIsValidating(true);
    setAdminError(false);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: inputPasscode }),
      });

      if (res.ok) {
        onAdminUnlock(inputPasscode);
        setInputPasscode("");
      } else {
        setAdminError(true);
      }
    } catch (err) {
      console.error("Admin verification error:", err);
      setAdminError(true);
    } finally {
      setIsValidating(false);
    }
  };

  // Calculate user contributions
  const userReviews = bars.flatMap((bar) =>
    (bar.reviews || []).filter((review) => review.reviewerToken === reviewerToken)
  );

  const reviewsCount = userReviews.length;
  const photosCount = userReviews.filter((r) => r.photoUrl).length;

  const copyToken = () => {
    if (!reviewerToken) return;
    navigator.clipboard.writeText(reviewerToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Intro section */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          Anonymous Profile
        </h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-2xl font-light">
          Your dashboard is backed by a secure, cryptographic anonymous token. No emails, no passwords, no tracker scripts. Pure privacy.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Token Credentials Card */}
        <div className="md:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Cryptographic Key
              </h3>
              <p className="text-[11px] font-bold text-primary tracking-widest uppercase mt-0.5">
                Your Unique Anonymous Signature
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <code className="flex-grow bg-surface-container-lowest border border-white/5 px-4 py-3 rounded-xl text-xs font-mono text-primary font-bold overflow-x-auto select-all flex items-center whitespace-nowrap min-h-[44px]">
                {reviewerToken || "Retrieving cryptographic signature..."}
              </code>
              <button
                onClick={copyToken}
                disabled={!reviewerToken}
                className="px-5 py-3 bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 font-display text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "COPIED" : "COPY KEY"}
              </button>
            </div>

            <div className="bg-surface-container-low/50 border border-white/5 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#84cc16] text-[16px]">verified_user</span>
                Privacy Guard Guarantee
              </h4>
              <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                This token is stored as a secure HTTP-Only cookie. It binds your local reviews and uploads to your browser anonymously, enabling you to add and edit them freely without exposing your identity.
              </p>
            </div>
          </div>

          {/* System Administration Override Gate */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                System Administration
              </h3>
              <p className="text-[11px] font-bold text-primary tracking-widest uppercase mt-0.5">
                Stateless Passcode Override Gate
              </p>
            </div>

            {adminPasscode ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-surface-container-low border border-primary/20 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">
                      security
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">
                        Admin overrides active
                      </h4>
                      <p className="text-[11px] text-on-surface-variant font-light mt-0.5">
                        Passcode verified. Global delete overrides are now visible in detailed drawers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onAdminUnlock(null)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-display text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    LOCK ACCESS
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="flex-grow relative">
                  <input
                    type="password"
                    placeholder="Enter administrative passcode..."
                    value={inputPasscode}
                    disabled={isValidating}
                    onChange={(e) => {
                      setInputPasscode(e.target.value);
                      setAdminError(false);
                    }}
                    className={`w-full bg-surface-container-lowest border ${adminError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-primary/45'} px-4 py-3 rounded-xl text-xs font-sans text-white placeholder-neutral-500 focus:outline-none transition-colors min-h-[44px]`}
                  />
                  {adminError && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                      Incorrect passcode
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-5 py-3 bg-primary hover:brightness-110 active:scale-95 disabled:opacity-50 font-display text-xs font-bold text-on-primary tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isValidating ? "sync" : "lock_open"}
                  </span>
                  {isValidating ? "VERIFYING..." : "UNLOCK SYSTEM"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Contribution Stats Panel */}
        <div className="md:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <p className="font-display text-xs font-bold text-primary tracking-widest uppercase border-b border-white/5 pb-2">
              Contribution Stats
            </p>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
              {/* Stat 1 */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl text-center md:text-left flex flex-col justify-between">
                <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                  Reviewed
                </span>
                <span className="font-display text-2xl font-bold text-white mt-1">
                  {reviewsCount}
                </span>
                <span className="text-[9px] text-on-surface-variant mt-0.5">Dives rated</span>
              </div>

              {/* Stat 2 */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl text-center md:text-left flex flex-col justify-between">
                <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                  Photos
                </span>
                <span className="font-display text-2xl font-bold text-white mt-1">
                  {photosCount}
                </span>
                <span className="text-[9px] text-on-surface-variant mt-0.5">Images shared</span>
              </div>

              {/* Stat 3 */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl text-center md:text-left flex flex-col justify-between">
                <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                  Stashed
                </span>
                <span className="font-display text-2xl font-bold text-white mt-1">
                  {savedBarCount}
                </span>
                <span className="text-[9px] text-on-surface-variant mt-0.5">Saved retreats</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
