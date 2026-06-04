"use client";

import Image from 'next/image';
import { CURRENCIES, convertFromBase } from '@/lib/currency';

interface Review {
  id: string;
  diveScore: number;
  pricePerMl: number | null;
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
  reviews: Review[];
}

interface ExploreViewProps {
  bars: Bar[];
  onBarSelect: (id: string) => void;
  selectedBarId: string | null;
  activeCurrency?: string;
}

const ATMOSPHERIC_IMGS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD378c1qOwaOCqHrgMdtmtPvU8HybnSCuAN8elj0I7a5wwQi1_dmRf_ypPQxG-ynoqr08qgyYraqvUVWQhiusqxX78lZh-fMscmMk1kLv5_80m9NPtZEijHzrWw87mlNZbDO_zCqZhgJIg7ga3sDbkc-ghChAzFQoib3hpkCPJ-eIY_sL7_RWpRICsBtgI9MshRcEjytAqSQktdAh6spKBwjXkxA7-AHUBvy2QZE_yBAQNPrurW_x1IzY5gRIVh_F8s1RQKvudRt9o",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDdNrbU9J_uexIYmoF0sRAd54U6-sS_zh2Y7ghsoO5GJT6swwJVv1Ij8m_DCOwc56GVAy_I1xbcErNC8A6bxy58oF15890f73vcPWavFud_SUAPs4TdASh40tJCMFHgIIEWoBVqdknLsH13pRAT0REQafEiT1ktcDH8EqC-rl66chi3YRjrmBwy1_xvV4NrnMITFbD-Jl8dEgEpPXBLuut4lygqmu0p0YgHyv_aA513gb1-fLwLJMZ2d0Hv6hC78wKNNFXFT9eiSms",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOVAFzTqyK4-rsaDKhMvBe6ISB153-FNyZeoVFxKP316T4gSz_D4Mr4_CBUek87w6mDRTwEGteAg3r9BUNiwhjNzKu7kDs5l45rbtH5S3JaM5DmBiBlDQNVDjxBBDBsHhtjgQqJolZkh-CsDnmlG9fRuZuIZuXdRO58nJ9it6Ga3GvkAGOOTKBhDdiaITc_Sk_Asf5Pn_9wCdK5h1qzwGnAoHDK709Sl3oE1BJ69kbq75QJHwqDKUphk29_naSTxwxJvsJA_k4gc8"
];

// Clean label mapping for amenities tags
const TAG_LABELS: Record<string, string> = {
  CASH_ONLY: "Cash Only",
  POOL_TABLE: "Pool Table",
  LIVE_MUSIC: "Live Music",
  CRAFT_BEER: "Craft Beer",
  SMOKING_AREA: "Smoker Room",
  JUKEBOX: "Jukebox",
  DARTBOARD: "Dartboard"
};

export default function ExploreView({ bars, onBarSelect, selectedBarId, activeCurrency = 'EUR' }: ExploreViewProps) {
  // Deterministic fallback image selection based on bar ID characters
  const getAtmosphericImg = (id: string, index: number) => {
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ATMOSPHERIC_IMGS[(charCodeSum + index) % ATMOSPHERIC_IMGS.length];
  };

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-36 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Intro section */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          Discover the Underground
        </h2>
        <p className="text-on-surface-variant text-[18px] mt-1.5 max-w-2xl font-light">
          A handpicked bento collection of shadowy corners, neon highlights, and vintage pours. Sorted for the true urban explorer.
        </p>
      </div>

      {bars.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-white/5 bg-surface-container-low rounded-2xl space-y-4">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 animate-pulse">
            explore_off
          </span>
          <div>
            <h4 className="font-display font-bold text-[22px] text-white">No dive bars match filters</h4>
            <p className="text-[18px] text-on-surface-variant max-w-xs mt-1.5">
              Try adjusting your sliders or tags to search wider neighborhoods and deeper vibes.
            </p>
          </div>
        </div>
      ) : (
        /* Bento Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bars.map((bar, barIdx) => {
            // Check if any review has an uploaded photo
            const uploadedPhoto = bar.reviews.find((r) => r.photoUrl)?.photoUrl;
            const heroImage = uploadedPhoto || getAtmosphericImg(bar.id, barIdx);

            // Render top 2 amenities tags
            const amenitiesList = bar.amenities 
              ? bar.amenities.split(",").filter((tag) => TAG_LABELS[tag]) 
              : [];

            return (
              <div
                key={bar.id}
                onClick={() => onBarSelect(bar.id)}
                className={`glass-panel rounded-2xl overflow-hidden group cursor-pointer hover:border-primary-container/30 transition-all duration-300 shadow-lg hover:shadow-black/50 select-none
                  ${selectedBarId === bar.id ? "border-primary-container ring-1 ring-primary-container/20" : ""}`}
              >
                {/* Visual Header */}
                <div className="h-44 w-full relative overflow-hidden bg-surface-container-lowest">
                  <Image
                    src={heroImage}
                    alt={bar.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                    className="object-cover grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[18px] font-bold font-display border border-white/10 flex items-center gap-1">
                    <span className="text-primary text-[18px]">★</span>
                    <span className="text-white">
                      {bar.averageDiveScore ? bar.averageDiveScore.toFixed(1) : "0.0"}
                    </span>
                  </div>

                  {/* Absolute Price per ml index (if reviews present) */}
                  {bar.averagePricePerMl !== null && (() => {
                    const activeCurr = activeCurrency || 'EUR';
                    const rate = convertFromBase(bar.averagePricePerMl, activeCurr);
                    const symbol = CURRENCIES.find(c => c.code === activeCurr)?.symbol || '€';
                    return (
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded text-[18px] font-bold text-primary font-display border border-white/5 uppercase tracking-wider">
                        {symbol}{(rate * 100).toFixed(1)}c / ML
                      </div>
                    );
                  })()}
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {bar.name}
                    </h3>
                    <p className="text-[18px] text-on-surface-variant font-normal line-clamp-1 mt-1.5 leading-snug">
                      {bar.address}
                    </p>
                  </div>

                  {/* Badges container */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {amenitiesList.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-surface-container-high border border-white/5 text-on-surface-variant rounded text-[18px] font-bold uppercase tracking-wider"
                      >
                        {TAG_LABELS[tag]}
                      </span>
                    ))}
                  </div>

                  {/* Footer details */}
                  <div className="pt-3.5 border-t border-white/5 flex justify-between items-center text-[18px] font-bold text-on-surface-variant tracking-widest uppercase">
                    <span>{bar.reviewCount} Review{bar.reviewCount === 1 ? "" : "s"}</span>
                    <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      EXPLORE <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
