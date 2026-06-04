"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { CURRENCIES, convertToBase } from '@/lib/currency';
import { resizeImage } from '@/lib/image';

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

interface ReviewFormProps {
  barId: string;
  barName: string;
  existingReview?: {
    id: string;
    diveScore: number;
    pricePerMl: number | null;
    comment: string | null;
    photoUrl: string | null;
    amenities?: string | null;
    vessel?: string | null;
    vesselSize?: string | null;
    vesselSizeMl?: number | null;
    purchasePrice?: number | null;
    purchaseCurrency?: string | null;
  } | null;
  onClose: () => void;
  onReviewSubmitted: (review: Review) => void;
}

const AMENITIES_OPTIONS = [
  { key: "CASH_ONLY", label: "💵 Cash Only" },
  { key: "POOL_TABLE", label: "🎱 Pool Table" },
  { key: "LIVE_MUSIC", label: "🎸 Live Music" },
  { key: "CRAFT_BEER", label: "🍺 Craft Beer" },
  { key: "SMOKING_AREA", label: "🚬 Smoking Area" },
  { key: "JUKEBOX", label: "🎵 Jukebox" },
  { key: "DARTBOARD", label: "🎯 Dartboard" },
];

const VESSEL_SIZES = [
  { label: "180 ml (Small Dutch Pour)", value: "180ml", ml: 180 },
  { label: "250 ml (Standard European Small)", value: "250ml", ml: 250 },
  { label: "330 ml (Standard European)", value: "330ml", ml: 330 },
  { label: "355 ml (Standard US / 12 oz)", value: "355ml", ml: 355 },
  { label: "440 ml (Standard UK)", value: "440ml", ml: 440 },
  { label: "473 ml (US Tallboy / 16 oz)", value: "473ml", ml: 473 },
  { label: "500 ml (European Half-Liter)", value: "500ml", ml: 500 },
  { label: "568 ml (UK Imperial Pint)", value: "568ml", ml: 568 },
  { label: "Other", value: "other", ml: 0 }
];

export default function ReviewForm({
  barId,
  barName,
  existingReview,
  onClose,
  onReviewSubmitted
}: ReviewFormProps) {
  const isEditMode = !!existingReview;

  // Form states
  const [diveScore, setDiveScore] = useState<number>(existingReview?.diveScore || 0);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [showDetailed, setShowDetailed] = useState<boolean>(true);

  // Optional states
  const [vessel, setVessel] = useState<string>(existingReview?.vessel || 'Glass');
  const [vesselSize, setVesselSize] = useState<string>(existingReview?.vesselSize || '330ml');
  const [vesselSizeMl, setVesselSizeMl] = useState<string>(existingReview?.vesselSizeMl?.toString() || '330');
  const [purchasePrice, setPurchasePrice] = useState<string>(existingReview?.purchasePrice?.toString() || '');
  const [purchaseCurrency, setPurchaseCurrency] = useState<string>(existingReview?.purchaseCurrency || 'EUR');

  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [photoUrl, setPhotoUrl] = useState<string>(existingReview?.photoUrl || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    existingReview?.amenities ? existingReview.amenities.split(',').filter(Boolean) : []
  );

  // Upload states
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const numPrice = parseFloat(purchasePrice) || 0;
  const getMlFromSize = (sizeValue: string): number => {
    const matched = VESSEL_SIZES.find(s => s.value === sizeValue);
    return matched ? matched.ml : 0;
  };
  const numMl = vesselSize === 'other' ? (parseFloat(vesselSizeMl) || 0) : getMlFromSize(vesselSize);
  const calculatedPricePerMl = numMl > 0 ? numPrice / numMl : 0;

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size must be smaller than 8MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    // Resize client-side first
    let uploadFile: File | Blob = file;
    let uploadName = file.name;

    try {
      const resizedBlob = await resizeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85
      });
      uploadFile = resizedBlob;
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      uploadName = `${baseName}.jpg`;
    } catch (resizeErr) {
      console.warn('Client-side resizing failed, falling back to original file:', resizeErr);
    }

    const formData = new FormData();
    formData.append('file', uploadFile, uploadName);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      setPhotoUrl(data.url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during upload.';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Submit handler (creates or updates review)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (diveScore < 1 || diveScore > 5) {
      setSubmitError('Please select a star rating for Overall Diveyness.');
      return;
    }

    setSubmitting(true);

    const numPrice = parseFloat(purchasePrice);
    const getMlFromSize = (sizeValue: string): number => {
      const matched = VESSEL_SIZES.find(s => s.value === sizeValue);
      return matched ? matched.ml : 0;
    };
    const numMl = vesselSize === 'other' ? parseFloat(vesselSizeMl) : getMlFromSize(vesselSize);
    const priceInEUR = !isNaN(numPrice) ? convertToBase(numPrice, purchaseCurrency) : null;
    const pricePerMlVal = priceInEUR && numMl > 0 ? priceInEUR / numMl : null;

    const payload = {
      barId,
      diveScore,
      pricePerMl: pricePerMlVal,
      comment: showDetailed ? (comment.trim() || null) : null,
      photoUrl: showDetailed ? (photoUrl || null) : null,
      amenities: showDetailed && selectedAmenities.length > 0 ? selectedAmenities.join(',') : null,
      vessel: showDetailed && !isNaN(numPrice) ? vessel : null,
      vesselSize: showDetailed && !isNaN(numPrice) ? vesselSize : null,
      vesselSizeMl: showDetailed && !isNaN(numPrice) ? numMl : null,
      purchasePrice: showDetailed && !isNaN(numPrice) ? numPrice : null,
      purchaseCurrency: showDetailed && !isNaN(numPrice) ? purchaseCurrency : null,
    };

    try {
      const url = isEditMode ? `/api/reviews/${existingReview.id}` : '/api/reviews';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      onReviewSubmitted(data);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during submission.';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/80 backdrop-blur-xl border border-neutral-800/80 rounded-2xl text-white overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 p-6 sm:px-8 sm:py-5">
        <div>
          <span className="text-[18px] font-bold uppercase tracking-wider text-amber-500 block mb-1">
            {isEditMode ? 'Edit Existing Review' : 'Anonymous Rating'}
          </span>
          <h3 className="text-[24px] font-bold tracking-tight text-white font-sans truncate max-w-[280px]">
            {barName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white px-3 py-2 hover:bg-neutral-800 rounded-xl transition-colors text-[18px] font-medium"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable Fields */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar">
          {/* MANDATORY: Diveyness Score */}
          <div className="space-y-3 text-center py-5 px-6 bg-neutral-900/40 border border-neutral-800/40 rounded-2xl">
            <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
              Rate Overall Diveyness (Mandatory)
            </label>
            <div className="flex items-center justify-center gap-2 my-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverScore || diveScore);
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setDiveScore(star)}
                    onMouseEnter={() => setHoverScore(star)}
                    onMouseLeave={() => setHoverScore(0)}
                    className="p-1 transition-transform active:scale-90 duration-100 focus:outline-none"
                  >
                    <svg
                      className={`w-10 h-10 sm:w-11 h-11 transition-colors duration-150 ${active
                        ? 'text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,197,24,0.5)]'
                        : 'text-neutral-800 hover:text-neutral-600'
                        }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <span className="block text-[18px] font-bold text-amber-500 mt-2">
              {diveScore === 5 && 'Ultimate Dive Legend'}
              {diveScore === 4 && 'Cozy Worn-in Taproom'}
              {diveScore === 3 && 'Solid Basic Pub'}
              {diveScore === 2 && 'A bit too clean'}
              {diveScore === 1 && 'Luxury Cocktail Bar (Not a Dive)'}
              {diveScore === 0 && 'Select a score'}
            </span>
          </div>

          {/* Accordion Toggle for optional specs */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetailed(!showDetailed)}
              className="w-full flex items-center justify-between p-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl transition-all text-[18px] font-bold uppercase tracking-widest text-neutral-300"
            >
              <span>Optional Details (Amenities, Pricing & Photos)</span>
              <span className="text-[20px]">{showDetailed ? '▼' : '▶'}</span>
            </button>
          </div>

          {/* OPTIONAL: Detailed ratings drawer */}
          {showDetailed && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              {/* Amenities & Vibes toggle chips */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                  Amenities & Vibes
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {AMENITIES_OPTIONS.map((option) => {
                    const active = selectedAmenities.includes(option.key);
                    return (
                      <button
                        type="button"
                        key={option.key}
                        onClick={() => {
                          if (selectedAmenities.includes(option.key)) {
                            setSelectedAmenities(selectedAmenities.filter((a) => a !== option.key));
                          } else {
                            setSelectedAmenities([...selectedAmenities, option.key]);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-[18px] font-bold transition-all active:scale-95 cursor-pointer min-h-[48px] flex items-center justify-center
                          ${active
                            ? 'border-amber-500 bg-amber-500/10 text-white filter drop-shadow-[0_0_6px_rgba(245,197,24,0.25)]'
                            : 'border-neutral-800 bg-neutral-900/20 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drink Purchase Information */}
              <div className="space-y-4 p-4 sm:p-5 bg-neutral-900/30 border border-neutral-800/40 rounded-xl">
                <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                  Price of purchased drink
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vessel Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[18px] font-semibold text-neutral-400 uppercase tracking-widest">Vessel</label>
                    <select
                      value={vessel}
                      onChange={(e) => setVessel(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-[18px] focus:outline-none focus:border-amber-500/80 transition-all cursor-pointer min-h-[48px]"
                    >
                      <option value="Glass">Glass 🍺</option>
                      <option value="Can">Can 🥫</option>
                      <option value="Bottle">Bottle 🍾</option>
                      <option value="Pint">Pint 🍺</option>
                      <option value="Other">Other ❓</option>
                    </select>
                  </div>

                  {/* Size */}
                  <div className="space-y-1.5">
                    <label className="block text-[18px] font-semibold text-neutral-400 uppercase tracking-widest">Size</label>
                    <select
                      value={vesselSize}
                      onChange={(e) => {
                        setVesselSize(e.target.value);
                        if (e.target.value !== 'other') {
                          const matched = VESSEL_SIZES.find(s => s.value === e.target.value);
                          if (matched) setVesselSizeMl(matched.ml.toString());
                        }
                      }}
                      className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-[18px] focus:outline-none focus:border-amber-500/80 transition-all cursor-pointer min-h-[48px]"
                    >
                      {VESSEL_SIZES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Size in ML */}
                {vesselSize === 'other' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-[18px] font-semibold text-neutral-400 uppercase tracking-widest">Custom Size (ml)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 200"
                      value={vesselSizeMl}
                      onChange={(e) => setVesselSizeMl(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-[18px] focus:outline-none focus:border-amber-500/80 transition-all placeholder-neutral-600 min-h-[48px]"
                    />
                  </div>
                )}

                {/* Price & Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[18px] font-semibold text-neutral-400 uppercase tracking-widest">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 3.50"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-[18px] focus:outline-none focus:border-amber-500/80 transition-all placeholder-neutral-600 min-h-[48px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[18px] font-semibold text-neutral-400 uppercase tracking-widest">Currency</label>
                    <select
                      value={purchaseCurrency}
                      onChange={(e) => setPurchaseCurrency(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-[18px] focus:outline-none focus:border-amber-500/80 transition-all cursor-pointer min-h-[48px]"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>{curr.symbol} {curr.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Calculations */}
                {numPrice > 0 && numMl > 0 && (
                  <div className="mt-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between text-[18px] text-amber-500/90 font-bold">
                    <span>Calculated Value Index:</span>
                    <span className="font-bold">
                      {purchaseCurrency === 'EUR' ? '€' : purchaseCurrency === 'USD' ? '$' : '£'}
                      {calculatedPricePerMl.toFixed(4)}/ml
                      {purchaseCurrency !== 'EUR' && ` (approx. €${(convertToBase(numPrice, purchaseCurrency) / numMl).toFixed(4)}/ml)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Custom Review Comment */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
                  Review Comment
                </label>
                <textarea
                  placeholder="Share your experience (sticky floors, cheap beer, authentic music...)"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-[18px] focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 resize-none min-h-[120px]"
                />
              </div>

              {/* Photo Upload Zone */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
                  Add a Photo
                </label>

                {photoUrl ? (
                  // Loaded Photo Preview
                  <div className="relative rounded-xl border border-neutral-800 overflow-hidden bg-neutral-900/40 h-36 flex items-center justify-center">
                    <Image
                      src={photoUrl}
                      alt="Upload Preview"
                      fill
                      sizes="(max-width: 480px) 100vw, 480px"
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-3 right-3 bg-neutral-950/90 hover:bg-neutral-900 text-red-500 px-3 py-1.5 rounded-lg border border-neutral-850 text-[18px] font-bold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  // File Upload Trigger Area
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-neutral-850 hover:border-neutral-600 rounded-xl p-6 flex flex-col items-center justify-center bg-neutral-905/30 cursor-pointer transition-all text-center min-h-[120px]"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {uploading ? (
                      <span className="flex h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent my-2" />
                    ) : (
                      <>
                        <span className="text-3xl mb-1">📷</span>
                        <span className="text-[18px] text-neutral-400 font-bold mt-1">Tap to select or capture photo</span>
                        <span className="text-[15px] text-neutral-500 mt-1">JPEG, PNG, WebP (Max 8MB)</span>
                      </>
                    )}
                  </div>
                )}
                {uploadError && (
                  <span className="text-[18px] text-red-500 mt-1 block">⚠️ {uploadError}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-6 sm:px-8 sm:py-5 border-t border-neutral-800/60 bg-neutral-950/40 space-y-4">
          {submitError && (
            <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-[18px] font-bold rounded-xl">
              ⚠️ {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center text-[18px] min-h-[56px]"
          >
            {submitting ? (
              <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
            ) : isEditMode ? (
              'Update Review'
            ) : (
              'Publish Anonymous Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
