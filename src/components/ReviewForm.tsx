"use client";

import { useState, useRef } from 'react';

interface ReviewFormProps {
  barId: string;
  barName: string;
  existingReview?: {
    id: string;
    diveScore: number;
    pricePerMl: number | null;
    relativePrice: number | null;
    murkiness: string | null;
    comment: string | null;
    photoUrl: string | null;
  } | null;
  onClose: () => void;
  onReviewSubmitted: (review: any) => void;
}

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
  const [showDetailed, setShowDetailed] = useState<boolean>(
    !!(existingReview?.pricePerMl || existingReview?.relativePrice || existingReview?.murkiness || existingReview?.comment || existingReview?.photoUrl)
  );

  // Optional states
  const [pricePerMl, setPricePerMl] = useState<string>(existingReview?.pricePerMl?.toString() || '');
  const [relativePrice, setRelativePrice] = useState<number>(existingReview?.relativePrice || 3);
  const [murkiness, setMurkiness] = useState<string>(existingReview?.murkiness || '');
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [photoUrl, setPhotoUrl] = useState<string>(existingReview?.photoUrl || '');

  // Upload states
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    const formData = new FormData();
    formData.append('file', file);

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
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
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

    const payload = {
      barId,
      diveScore,
      pricePerMl: pricePerMl ? parseFloat(pricePerMl) : null,
      relativePrice: showDetailed ? relativePrice : null,
      murkiness: showDetailed ? (murkiness || null) : null,
      comment: showDetailed ? (comment.trim() || null) : null,
      photoUrl: showDetailed ? (photoUrl || null) : null
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
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/80 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 text-white overflow-y-auto custom-scrollbar shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            {isEditMode ? 'Edit Existing Review' : 'Anonymous Rating'}
          </span>
          <h3 className="text-lg font-bold tracking-tight text-white font-sans truncate max-w-[240px]">
            {barName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-5">
        {/* MANDATORY: Diveyness Score */}
        <div className="space-y-2 text-center py-2 bg-neutral-900/40 border border-neutral-800/40 rounded-2xl">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Rate Overall Diveyness (Mandatory)
          </label>
          <div className="flex items-center justify-center gap-1.5 my-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverScore || diveScore);
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setDiveScore(star)}
                  onMouseEnter={() => setHoverScore(star)}
                  onMouseLeave={() => setHoverScore(0)}
                  className="p-1 transition-transform active:scale-95 duration-100 focus:outline-none"
                >
                  <svg
                    className={`w-9 h-9 transition-colors duration-150 ${
                      active
                        ? 'text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
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
          <span className="text-[11px] font-medium text-neutral-400">
            {diveScore === 5 && '👑 Ultimate Dive Legend'}
            {diveScore === 4 && '🪵 Cozy Worn-in Taproom'}
            {diveScore === 3 && '🍻 Solid Basic Pub'}
            {diveScore === 2 && '🧼 A bit too clean'}
            {diveScore === 1 && '💼 Luxury Cocktail Bar (Not a Dive)'}
            {diveScore === 0 && 'Select a score'}
          </span>
        </div>

        {/* Accordion Toggle for optional specs */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowDetailed(!showDetailed)}
            className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl transition-all text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            <span>✨ Optional Details (Atmosphere & Prices)</span>
            <span>{showDetailed ? '▼' : '▶'}</span>
          </button>
        </div>

        {/* OPTIONAL: Detailed ratings drawer */}
        {showDetailed && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Murkiness Segment Buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Murkiness Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'MURKY', label: '🟢 Murky', desc: 'Worn & dim' },
                  { value: 'AVERAGE', label: '🟡 Average', desc: 'Standard pub' },
                  { value: 'ACTUALLY_NICE', label: '🔵 Nice', desc: 'Too clean?' }
                ].map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setMurkiness(murkiness === item.value ? '' : item.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-[0.98]
                      ${
                        murkiness === item.value
                          ? 'border-amber-500 bg-amber-500/10 text-white font-medium'
                          : 'border-neutral-800 bg-neutral-900/20 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                  >
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Relative Price Slider */}
            <div className="space-y-1.5 p-3.5 bg-neutral-900/30 border border-neutral-800/40 rounded-xl">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-neutral-400 uppercase tracking-wider">Relative Prices</span>
                <span className="text-amber-500 font-bold">
                  {relativePrice === 1 && '$ (Dirt Cheap)'}
                  {relativePrice === 2 && '$$ (Below Average)'}
                  {relativePrice === 3 && '$$$ (Average)'}
                  {relativePrice === 4 && '$$$$ (Pricier)'}
                  {relativePrice === 5 && '$$$$$ (Extortionate)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={relativePrice}
                onChange={(e) => setRelativePrice(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
            </div>

            {/* Absolute price per ml */}
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Value Index (Price per ml / Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm text-neutral-500">€</span>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 0.008 (3.00 euro / 330ml)"
                    value={pricePerMl}
                    onChange={(e) => setPricePerMl(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600"
                  />
                </div>
              </div>
            </div>

            {/* Custom Review Comment */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Review Comment
              </label>
              <textarea
                placeholder="Share your experience (sticky floors, cheap beer, authentic music...)"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 resize-none"
              />
            </div>

            {/* Photo Upload Zone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Add a Photo
              </label>
              
              {photoUrl ? (
                // Loaded Photo Preview
                <div className="relative rounded-xl border border-neutral-800 overflow-hidden bg-neutral-900/40 h-32 flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Upload Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-2 right-2 bg-neutral-950/80 hover:bg-neutral-900 text-red-500 p-1.5 rounded-lg border border-neutral-800/80 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                // File Upload Trigger Area
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-neutral-800 hover:border-neutral-600 rounded-xl p-4 flex flex-col items-center justify-center bg-neutral-905/30 cursor-pointer transition-all py-6 text-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent my-1" />
                  ) : (
                    <>
                      <span className="text-xl">📷</span>
                      <span className="text-xs text-neutral-400 font-medium mt-1">Tap to select or capture photo</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">JPEG, PNG, WebP (Max 8MB)</span>
                    </>
                  )}
                </div>
              )}
              {uploadError && (
                <span className="text-[11px] text-red-500 mt-1 block">⚠️ {uploadError}</span>
              )}
            </div>
          </div>
        )}

        {/* Submit Button & Errors */}
        {submitError && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-xl">
            ⚠️ {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center mt-auto"
        >
          {submitting ? (
            <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
          ) : isEditMode ? (
            'Update Review'
          ) : (
            'Publish Anonymous Review'
          )}
        </button>
      </form>
    </div>
  );
}
