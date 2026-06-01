"use client";

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

interface AddBarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onBarAdded: (newBar: any) => void;
  newPinCoords: { latitude: number; longitude: number } | null;
  onCancelNewPin: () => void;
}

export default function AddBarSheet({
  isOpen,
  onClose,
  onBarAdded,
  newPinCoords,
  onCancelNewPin
}: AddBarSheetProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'manual'>('google');
  
  // Google Import states
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Manual Form states
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  // Fetch the active Google Maps API key at runtime
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.googleMapsApiKey) {
          setApiKey(data.googleMapsApiKey);
        }
      })
      .catch((err) => console.error('Failed to load Google Maps config at runtime:', err));
  }, []);

  // Synchronize manual coordinates when a user drops a custom pin on the Leaflet map
  useEffect(() => {
    if (newPinCoords) {
      setActiveTab('manual');
      setManualLat(newPinCoords.latitude.toFixed(6));
      setManualLng(newPinCoords.longitude.toFixed(6));
    }
  }, [newPinCoords]);

  // Reset states and cleanup autocomplete on drawer close
  useEffect(() => {
    if (!isOpen) {
      setGoogleSearchQuery('');
      setGoogleError(null);
      setManualName('');
      setManualAddress('');
      setManualLat('');
      setManualLng('');
      setManualError(null);

      // Clean up autocomplete listeners and references
      if (autocompleteRef.current && (window as any).google) {
        try {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          console.error('Error cleaning up autocomplete listeners:', e);
        }
      }
      autocompleteRef.current = null;
    }
  }, [isOpen]);

  // Initializing Google Places Autocomplete once the script loads
  const initAutocomplete = () => {
    if (!autocompleteInputRef.current || !(window as any).google) return;

    try {
      // Ensure any legacy instances are fully cleared before attaching to the new input ref
      if (autocompleteRef.current && (window as any).google) {
        try {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          console.error(e);
        }
      }

      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          types: ['establishment'],
          fields: ['name', 'formatted_address', 'geometry', 'place_id']
        }
      );

      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          setGoogleError('Failed to capture coordinates for this place. Try manual entry.');
          return;
        }

        const barData = {
          name: place.name || '',
          address: place.formatted_address || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          googlePlaceId: place.place_id || null
        };

        await importGoogleBar(barData);
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
    }
  };

  // Re-initialize autocomplete if sheet opens and the Google SDK script is already cached
  useEffect(() => {
    if (isOpen && (window as any).google) {
      const timer = setTimeout(() => {
        initAutocomplete();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Import bar into SQLite via api
  const importGoogleBar = async (barData: any) => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const res = await fetch('/api/bars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import bar.');
      }

      onBarAdded(data);
      onClose();
    } catch (err: any) {
      setGoogleError(err.message || 'An error occurred during import.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Manual Bar Form submit handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualName.trim() || !manualAddress.trim() || !manualLat || !manualLng) {
      setManualError('All fields are required.');
      return;
    }

    const latFloat = parseFloat(manualLat);
    const lngFloat = parseFloat(manualLng);

    if (isNaN(latFloat) || latFloat < -90 || latFloat > 90) {
      setManualError('Latitude must be a valid number between -90 and 90.');
      return;
    }

    if (isNaN(lngFloat) || lngFloat < -180 || lngFloat > 180) {
      setManualError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setManualLoading(true);
    try {
      const res = await fetch('/api/bars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName,
          address: manualAddress,
          latitude: latFloat,
          longitude: lngFloat,
          googlePlaceId: null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create bar.');
      }

      onBarAdded(data);
      onClose();
      onCancelNewPin(); // Remove manual map pin
    } catch (err: any) {
      setManualError(err.message || 'An error occurred.');
    } finally {
      setManualLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          onLoad={initAutocomplete}
          strategy="afterInteractive"
        />
      )}

      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 z-[990] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:bg-black/40"
        onClick={() => {
          onClose();
          onCancelNewPin();
        }}
      />

      {/* Responsive Slide-Over Drawer */}
      <div
        className={`fixed z-[1000] transition-all duration-300 ease-out border-neutral-800/80 bg-neutral-900/90 backdrop-blur-xl shadow-2xl flex flex-col
          bottom-0 left-0 w-full h-[85vh] rounded-t-2xl border-t border-x
          md:top-0 md:right-0 md:left-auto md:w-[460px] md:h-full md:rounded-none md:border-l md:border-t-0`}
      >
        {/* Drag handle indicator on mobile layout */}
        <div className="w-12 h-1 bg-neutral-800 rounded-full mx-auto my-3 md:hidden" />

        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-white font-sans">Add a Dive Bar</h2>
            <p className="text-[18px] text-neutral-400 mt-1">Plot a new local watering hole on the map.</p>
          </div>
          <button
            onClick={() => {
              onClose();
              onCancelNewPin();
            }}
            className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-800 rounded-lg transition-colors text-[20px]"
          >
            ✕
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex px-8 pt-4 border-b border-neutral-800/40 text-[18px]">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 pb-4 text-center font-bold border-b-2 transition-all duration-150
              ${activeTab === 'google'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            Google Maps Import
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 pb-4 text-center font-bold border-b-2 transition-all duration-150
              ${activeTab === 'manual'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            Manual Pin
          </button>
        </div>

        {/* Sheet Content Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'google' ? (
            <div className="space-y-6">
              {!apiKey ? (
                // Setup alert when API Key is missing in development
                <div className="p-5 bg-amber-950/40 border border-amber-900/60 rounded-xl space-y-3 text-[18px] leading-relaxed text-amber-200">
                  <h4 className="font-bold text-amber-400 text-[18px] uppercase tracking-wider">Google Places API key missing</h4>
                  <p>To enable location searching & instant imports, add your key to `.env`:</p>
                  <pre className="bg-neutral-950 p-3 rounded border border-neutral-800 text-[15px] select-all overflow-x-auto text-amber-300">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-key-here"
                  </pre>
                  <p>In the meantime, you can switch to the <strong>Manual Pin</strong> tab above to add bars without a key!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                    Search Dive Bar Name
                  </label>
                  <div className="relative">
                    <input
                      ref={autocompleteInputRef}
                      type="text"
                      placeholder="e.g. Cafe 't Mandje..."
                      value={googleSearchQuery}
                      onChange={(e) => setGoogleSearchQuery(e.target.value)}
                      disabled={googleLoading}
                      className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3.5 text-[18px] focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 disabled:opacity-50 min-h-[52px]"
                    />
                    {googleLoading && (
                      <span className="absolute right-4 top-4 flex h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    )}
                  </div>
                  <p className="text-[18px] text-neutral-500 leading-relaxed mt-2">
                    Start typing the bar's name. Selecting a bar from the list will instantly fetch its official coordinates and details, and pin it to the map.
                  </p>
                </div>
              )}

              {googleError && (
                <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-[18px] font-bold rounded-xl">
                  ⚠️ {googleError}
                </div>
              )}
            </div>
          ) : (
            // Manual Entry Form
            <form onSubmit={handleManualSubmit} className="space-y-6">
              {newPinCoords ? (
                <div className="p-4 bg-neutral-950 border border-amber-500/30 rounded-xl flex items-center justify-between text-[18px] text-amber-200 font-bold">
                  <span>📍 Coordinates captured from map tap!</span>
                  <button
                    type="button"
                    onClick={onCancelNewPin}
                    className="text-amber-500 hover:text-amber-400 font-bold ml-2 text-[18px]"
                  >
                    Reset Pin
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-[18px] text-neutral-400 leading-relaxed font-medium">
                  💡 <strong>Tip:</strong> Tap/click anywhere directly on the map background to place a red marker and capture coordinates automatically!
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
                  Dive Bar Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hill Street Blues"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  disabled={manualLoading}
                  className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3.5 text-[18px] focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 disabled:opacity-50 min-h-[52px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
                  Address / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warmoesstraat 96, Amsterdam"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  disabled={manualLoading}
                  className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3.5 text-[18px] focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 disabled:opacity-50 min-h-[52px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 52.3739"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    disabled={manualLoading}
                    className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3.5 text-[18px] focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 disabled:opacity-50 min-h-[52px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[18px] font-bold uppercase tracking-widest text-neutral-400">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 4.8986"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    disabled={manualLoading}
                    className="w-full bg-neutral-950/80 border border-neutral-800 text-white rounded-xl px-4 py-3.5 text-[18px] focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder-neutral-600 disabled:opacity-50 min-h-[52px]"
                    required
                  />
                </div>
              </div>

              {manualError && (
                <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-[18px] font-bold rounded-xl">
                  ⚠️ {manualError}
                </div>
              )}

              <button
                type="submit"
                disabled={manualLoading}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center text-[18px] min-h-[56px]"
              >
                {manualLoading ? (
                  <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                ) : (
                  'Plot Custom Pin'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
