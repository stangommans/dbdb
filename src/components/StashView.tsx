"use client";

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

interface StashViewProps {
  bars: Bar[];
  savedBarIds: string[];
  onBarSelect: (id: string) => void;
  onRemoveBar: (id: string) => void;
}

const ATMOSPHERIC_IMGS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD378c1qOwaOCqHrgMdtmtPvU8HybnSCuAN8elj0I7a5wwQi1_dmRf_ypPQxG-ynoqr08qgyYraqvUVWQhiusqxX78lZh-fMscmMk1kLv5_80m9NPtZEijHzrWw87mlNZbDO_zCqZhgJIg7ga3sDbkc-ghChAzFQoib3hpkCPJ-eIY_sL7_RWpRICsBtgI9MshRcEjytAqSQktdAh6spKBwjXkxA7-AHUBvy2QZE_yBAQNPrurW_x1IzY5gRIVh_F8s1RQKvudRt9o",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDdNrbU9J_uexIYmoF0sRAd54U6-sS_zh2Y7ghsoO5GJT6swwJVv1Ij8m_DCOwc56GVAy_I1xbcErNC8A6bxy58oF15890f73vcPWavFud_SUAPs4TdASh40tJCMFHgIIEWoBVqdknLsH13pRAT0REQafEiT1ktcDH8EqC-rl66chi3YRjrmBwy1_xvV4NrnMITFbD-Jl8dEgEpPXBLuut4lygqmu0p0YgHyv_aA513gb1-fLwLJMZ2d0Hv6hC78wKNNFXFT9eiSms",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOVAFzTqyK4-rsaDKhMvBe6ISB153-FNyZeoVFxKP316T4gSz_D4Mr4_CBUek87w6mDRTwEGteAg3r9BUNiwhjNzKu7kDs5l45rbtH5S3JaM5DmBiBlDQNVDjxBBDBsHhtjgQqJolZkh-CsDnmlG9fRuZuIZuXdRO58nJ9it6Ga3GvkAGOOTKBhDdiaITc_Sk_Asf5Pn_9wCdK5h1qzwGnAoHDK709Sl3oE1BJ69kbq75QJHwqDKUphk29_naSTxwxJvsJA_k4gc8"
];

const TAG_LABELS: Record<string, string> = {
  CASH_ONLY: "Cash Only",
  POOL_TABLE: "Pool Table",
  LIVE_MUSIC: "Live Music",
  CRAFT_BEER: "Craft Beer",
  SMOKING_AREA: "Smoker Room",
  JUKEBOX: "Jukebox",
  DARTBOARD: "Dartboard"
};

export default function StashView({ bars, savedBarIds, onBarSelect, onRemoveBar }: StashViewProps) {
  const savedBars = bars.filter((bar) => savedBarIds.includes(bar.id));

  const getAtmosphericImg = (id: string, index: number) => {
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ATMOSPHERIC_IMGS[(charCodeSum + index) % ATMOSPHERIC_IMGS.length];
  };

  const uniqueNeighborhoods = Array.from(
    new Set(
      savedBars.map((b) => {
        const parts = b.address.split(",");
        return parts[1]?.trim() || parts[0]?.trim() || "Unknown";
      })
    )
  ).length;

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-36 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          My Stash
        </h2>
        <p className="text-on-surface-variant text-[18px] mt-1.5 max-w-2xl font-light">
          Your personal collection of dimly lit retreats and legendary pours. Persistent, client-private, and curated for the late nights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <p className="font-display text-[18px] font-bold text-primary tracking-widest uppercase">
              Collection Info
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
                <span className="text-[18px] text-on-surface-variant font-light">Saved Bars</span>
                <span className="font-display text-2xl font-bold text-primary leading-none">
                  {savedBars.length}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[18px] text-on-surface-variant font-light">Neighborhoods</span>
                <span className="font-display text-2xl font-bold text-primary leading-none">
                  {uniqueNeighborhoods}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-4">
          {savedBars.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 border border-white/5 bg-surface-container-low rounded-2xl space-y-4">
              <span className="material-symbols-outlined text-[48px] text-primary/45 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              <div>
                <h4 className="font-display font-bold text-[22px] text-white">Your stash is dry!</h4>
                <p className="text-[18px] text-on-surface-variant max-w-xs mt-1.5">
                  Explore the Leaflet map or discovery lists, click on a bar, and bookmark it to create your private collection.
                </p>
              </div>
            </div>
          ) : (
            savedBars.map((bar, barIdx) => {
              const uploadedPhoto = bar.reviews.find((r) => r.photoUrl)?.photoUrl;
              const heroImage = uploadedPhoto || getAtmosphericImg(bar.id, barIdx);

              const amenitiesList = bar.amenities
                ? bar.amenities.split(",").filter((tag) => TAG_LABELS[tag])
                : [];

              return (
                <div
                  key={bar.id}
                  className="glass-panel group flex items-center p-3 md:p-4 rounded-2xl transition-all duration-300 hover:bg-surface-container-high/90 hover:border-white/10"
                >
                  <div
                    onClick={() => onBarSelect(bar.id)}
                    className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-xl overflow-hidden border border-white/10 cursor-pointer"
                  >
                    <img
                      src={heroImage}
                      alt={bar.name}
                      className="h-full w-full object-cover grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>

                  <div className="ml-4 md:ml-6 flex-grow">
                    <div className="flex justify-between items-start">
                      <div onClick={() => onBarSelect(bar.id)} className="cursor-pointer">
                        <h3 className="font-display text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                          {bar.name}
                        </h3>
                        <p className="text-[18px] text-on-surface-variant font-normal mt-1.5 line-clamp-1 leading-snug">
                          {bar.address}
                        </p>
                        <div className="flex items-center gap-2.5 mt-2.5 text-[18px] text-on-surface-variant font-bold uppercase tracking-wider">
                          <span className="text-primary flex items-center gap-0.5">
                            ★ {bar.averageDiveScore ? bar.averageDiveScore.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBar(bar.id);
                        }}
                        className="text-primary drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] hover:text-on-surface-variant/40 active:scale-95 transition-all w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-full cursor-pointer border border-white/5"
                      >
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>

                    <div className="mt-3.5 hidden md:flex flex-wrap gap-2">
                      {amenitiesList.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[18px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-white/5 border border-white/5 text-on-surface-variant"
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
