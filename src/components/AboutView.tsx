"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";

interface AboutViewProps {
  totalBars: number;
  totalReviews: number;
  uniqueUsersCount: number;
  activeGlobalAvg330ml: number | null;
  activeCurrency: string;
  adminPasscode: string | null;
  onAdminUnlock: (passcode: string | null) => void;
}

export default function AboutView({
  totalBars,
  totalReviews,
  uniqueUsersCount,
  activeGlobalAvg330ml,
  activeCurrency,
  adminPasscode,
  onAdminUnlock,
}: AboutViewProps) {
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

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-36 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Intro section */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          About & Administration
        </h2>
        <p className="text-on-surface-variant text-[18px] mt-1.5 max-w-2xl font-light">
          Overview of the Divebar Database statistics, system administration access, and general application context.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Stats and Admin controls */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Mobile-Friendly Stats (Useful on mobile since the header hides them) */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-display text-xl font-bold text-white tracking-tight">
              Global Platform Metrics
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Bars Stat */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl flex flex-col justify-between min-h-[110px]">
                <span className="text-[14px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500/70" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                  Spots
                </span>
                <div className="mt-2">
                  <span className="font-display text-3xl font-extrabold text-white">
                    {totalBars}
                  </span>
                  <p className="text-[12px] text-on-surface-variant mt-0.5 font-light leading-none">Total Divebars</p>
                </div>
              </div>

              {/* Reviews Stat */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl flex flex-col justify-between min-h-[110px]">
                <span className="text-[14px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500/70" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                  Reviews
                </span>
                <div className="mt-2">
                  <span className="font-display text-3xl font-extrabold text-white">
                    {totalReviews}
                  </span>
                  <p className="text-[12px] text-on-surface-variant mt-0.5 font-light leading-none">Total ratings</p>
                </div>
              </div>

              {/* Reviewers Stat */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl flex flex-col justify-between min-h-[110px]">
                <span className="text-[14px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500/70" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  Users
                </span>
                <div className="mt-2">
                  <span className="font-display text-3xl font-extrabold text-white">
                    {uniqueUsersCount}
                  </span>
                  <p className="text-[12px] text-on-surface-variant mt-0.5 font-light leading-none">Contributors</p>
                </div>
              </div>

              {/* Avg Price Stat */}
              <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl flex flex-col justify-between min-h-[110px]">
                <span className="text-[14px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500/70" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  Avg 330ml
                </span>
                <div className="mt-2">
                  <span className="font-display text-2xl font-extrabold text-amber-500 truncate block">
                    {activeGlobalAvg330ml !== null
                      ? formatCurrency(activeGlobalAvg330ml, activeCurrency)
                      : "N/A"}
                  </span>
                  <p className="text-[12px] text-on-surface-variant mt-0.5 font-light leading-none">Beverage cost</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Administration Override Gate */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-tight">
                System Administration
              </h3>
              <p className="text-[18px] font-bold text-primary tracking-widest uppercase mt-1">
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
                      <h4 className="text-[18px] font-bold text-white font-display uppercase tracking-wider">
                        Admin overrides active
                      </h4>
                      <p className="text-[18px] text-on-surface-variant font-light mt-0.5">
                        Passcode verified. Global delete overrides are now visible in detailed drawers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onAdminUnlock(null)}
                    className="px-5 py-3.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-display text-[18px] font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 min-h-[48px]"
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
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
                    className={`w-full bg-surface-container-lowest border ${adminError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-primary/45'} px-4 py-3.5 rounded-xl text-[18px] font-sans text-white placeholder-neutral-500 focus:outline-none transition-colors min-h-[48px]`}
                  />
                  {adminError && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-red-500 font-bold uppercase tracking-wider">
                      Incorrect passcode
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-5 py-3.5 bg-primary hover:brightness-110 active:scale-95 disabled:opacity-50 font-display text-[18px] font-bold text-on-primary tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer shrink-0 flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isValidating ? "sync" : "lock_open"}
                  </span>
                  {isValidating ? "VERIFYING..." : "UNLOCK SYSTEM"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Info Panel (About DBDB Section) */}
        <div className="md:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-2xl space-y-5 bg-surface-container-low/40">
            <p className="font-display text-[18px] font-bold text-primary tracking-widest uppercase border-b border-white/5 pb-2">
              About DBDB
            </p>
            <div className="space-y-4">
              <div>
                <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[12px]">Author</span>
                <span className="text-white font-semibold text-[18px]">stan.gommans</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[12px]">Version</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[14px] rounded">
                    v{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.8"}
                  </span>
                  <span className="text-on-surface-variant font-light text-[14px]">Release Line 1.x</span>
                </div>
              </div>
              <div>
                <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[12px]">Source Code</span>
                <a
                  href="https://github.com/stangommans/dbdb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-white font-bold transition-colors mt-1 text-[16px] group"
                >
                  <svg className="w-5 h-5 fill-current text-primary group-hover:text-white transition-colors" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="underline decoration-dashed decoration-primary/50 group-hover:decoration-white transition-all">github.com/stangommans/dbdb</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
