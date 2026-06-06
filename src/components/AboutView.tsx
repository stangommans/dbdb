"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import FeedbackSection from "./FeedbackSection";

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


  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-36 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Intro section */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          About & Feedback
        </h2>
        <p className="text-on-surface-variant text-[18px] mt-1.5 max-w-2xl font-light">
          Overview of the Divebar Database statistics, general application context, and community feature requests.
        </p>
      </div>

      {/* About Section: Why DBDB? & What is a Dive Bar? (Full-Width on Top) */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl bg-surface-container-low/40 mb-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Why DBDB? */}
          <div className="space-y-3">
            <h3 className="font-display text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500/70 text-[22px]">map</span>
              Why DBDB?
            </h3>
            <p className="text-on-surface-variant text-[16px] leading-relaxed font-light">
              The idea for <strong className="text-white font-semibold">DBDB (Divebar Database)</strong> was born in a divy spot in Barcelona, where two friends and former digital agency interns realized that the best way to experience a new city is through its local dive bars. Fed up with polished tourist guides, they spent trips doing extensive research on Reddit (scouring <code className="text-amber-500 bg-white/5 px-1.5 py-0.5 rounded text-[14px]">r/wateringhole</code> or subreddits of their travel destinations) to uncover real watering holes. 
            </p>
            <p className="text-on-surface-variant text-[16px] leading-relaxed font-light">
              With a shared love for alliteration and down-to-earth culture, Divebar Database was created to map these gems. DBDB empowers dive enthusiasts to share authentic spots—from classic neighborhood watering holes to cozy brown cafés—and compare draft beer values (via our custom value-per-ml index) and track real amenities (like smoking sections, cash-only bars, and pool tables) without trackers or commercial clutter.
            </p>
          </div>

          {/* Section 2: What is a Dive Bar? & About DBDB */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-display text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500/70 text-[22px]">sports_bar</span>
                What is a Dive Bar?
              </h3>
              <p className="text-on-surface-variant text-[16px] leading-relaxed font-light">
                A <strong className="text-white font-semibold">dive bar</strong> is more than just a place to get a cheap drink—it's a sanctuary of authenticity. Characterized by dim lighting, cozy worn-in decor, pocket-friendly prices, and unpretentious crowds, these spots represent the heartbeat of local neighborhood culture. Whether it's a cash-only counter, a jukebox spinning old classics, or a pool table with history, dives are places where everyone is welcome.
              </p>
            </div>

            {/* Integrated Info Block */}
            <div className="border-t border-white/5 pt-5 space-y-4">
              <h3 className="font-display text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500/70 text-[22px]">info</span>
                About DBDB
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[11px]">Author</span>
                  <span className="text-white font-semibold text-[15px]">stan.gommans</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[11px]">Version</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[12px] rounded">
                      v{process.env.NEXT_PUBLIC_APP_VERSION || "1.5.0"}
                    </span>
                    <span className="text-on-surface-variant font-light text-[12px]">Line 1.x</span>
                  </div>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[11px]">Source Code</span>
                  <a
                    href="https://github.com/stangommans/dbdb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:text-white font-bold transition-colors mt-0.5 text-[14px] group"
                  >
                    <svg className="w-4 h-4 fill-current text-primary group-hover:text-white transition-colors" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="underline decoration-dashed decoration-primary/50 group-hover:decoration-white transition-all">GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Platform Metrics (Full Width) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 mb-8">
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

      {/* Feedback & Feature Requests */}
      <div className="mt-8">
        <FeedbackSection adminPasscode={adminPasscode} />
      </div>
    </div>
  );
}
