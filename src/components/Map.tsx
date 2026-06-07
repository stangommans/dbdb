"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Glowing Pin Icon creator utilizing CSS neon classes
const createNeonPin = (diveScore: number = 0) => {
  // Amber beer-glow classes based on rating
  let glowClass = 'neon-glow-med';
  if (diveScore >= 4) {
    glowClass = 'neon-glow-high';
  } else if (diveScore > 0 && diveScore < 2.5) {
    glowClass = 'neon-glow-low';
  }
  
  return L.divIcon({
    className: 'custom-neon-pin',
    html: `<div class="neon-pin-wrapper"><span class="neon-pin-core ${glowClass}"></span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Custom User Location Pin Icon creator
const createUserLocationPin = () => {
  return L.divIcon({
    className: 'user-location-pin',
    html: `<div class="user-pin-wrapper"><span class="user-pin-pulse"></span><span class="user-pin-core"></span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

interface Bar {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  averageDiveScore: number;
  reviewCount: number;
}

interface MapProps {
  bars: Bar[];
  selectedBarId: string | null;
  onBarSelect: (barId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  newPinCoords?: { latitude: number; longitude: number } | null;
  userCoords?: { latitude: number; longitude: number } | null;
  onUserCoordsUpdate?: (coords: { latitude: number; longitude: number }) => void;
}

export default function Map({ 
  bars, 
  selectedBarId, 
  onBarSelect, 
  onMapClick, 
  newPinCoords,
  userCoords,
  onUserCoordsUpdate
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const newPinMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initial map shell load
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    // Centered on Amsterdam by default
    const map = L.map(mapContainerRef.current, {
      center: [52.3676, 4.9041],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Zoom controls on top-right for a cleaner mobile layout
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Premium Dark Matter Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    // Click on map to capture custom coordinate locations
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    // Try to automatically center around the user's location on mount
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 14, { animate: true });
          
          // Add user pin
          const marker = L.marker([latitude, longitude], {
            icon: createUserLocationPin()
          }).addTo(map);
          userLocationMarkerRef.current = marker;
          setHasCenteredOnUser(true);

          // Propagate back to parent
          onUserCoordsUpdate?.({ latitude, longitude });
        },
        (error) => {
          console.warn("Could not retrieve user location on mount:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => {
      isMounted = false;
      map.remove();
      mapRef.current = null;
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
    };
  }, [onUserCoordsUpdate]);

  // Sync database bar pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean out old markers
    Object.keys(markersRef.current).forEach((id) => {
      markersRef.current[id].remove();
    });
    markersRef.current = {};

    if (bars.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    bars.forEach((bar) => {
      const marker = L.marker([bar.latitude, bar.longitude], {
        icon: createNeonPin(bar.averageDiveScore)
      }).addTo(map);

      // Glowing dark-theme HTML detail popup card
      const popupContent = `
        <div class="map-popup-card">
          <h4 class="popup-title">${bar.name}</h4>
          <p class="popup-address">${bar.address}</p>
          <div class="popup-stats">
            <span class="popup-rating">★ ${bar.averageDiveScore.toFixed(1)}</span>
            <span class="popup-reviews">${bar.reviewCount} review${bar.reviewCount === 1 ? '' : 's'}</span>
          </div>
        </div>
      `;

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      if (!isMobile) {
        marker.bindPopup(popupContent, {
          className: 'custom-leaflet-popup',
          closeButton: false
        });
      }

      marker.on('click', () => {
        onBarSelect(bar.id);
      });

      markersRef.current[bar.id] = marker;
      bounds.push([bar.latitude, bar.longitude]);
    });

    // Automatically zoom and fit to encapsulate all active pins when no bar is focused
    if (bounds.length > 0 && !selectedBarId && !newPinCoords && !hasCenteredOnUser) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bars, onBarSelect, selectedBarId, newPinCoords, hasCenteredOnUser]);

  // React to selected bar zooms
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBarId) return;

    const marker = markersRef.current[selectedBarId];
    if (marker) {
      const latLng = marker.getLatLng();
      map.setView(latLng, 16, { animate: true });
      
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (!isMobile) {
        marker.openPopup();
      }
    }
  }, [selectedBarId]);

  // React to temporary custom pin placement
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (newPinMarkerRef.current) {
      newPinMarkerRef.current.remove();
      newPinMarkerRef.current = null;
    }

    if (newPinCoords) {
      const customNewPin = L.divIcon({
        className: 'custom-neon-pin new-placement-pin',
        html: `<div class="neon-pin-wrapper pulsate"><span class="neon-pin-core" style="background-color: #ef4444; box-shadow: 0 0 10px #ef4444, 0 0 20px rgba(239, 68, 68, 0.4)"></span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([newPinCoords.latitude, newPinCoords.longitude], {
        icon: customNewPin
      }).addTo(map);

      map.setView([newPinCoords.latitude, newPinCoords.longitude], 16, { animate: true });
      newPinMarkerRef.current = marker;
    }
  }, [newPinCoords]);

  // Sync parent user coordinates changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userCoords) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLatLng([userCoords.latitude, userCoords.longitude]);
      } else {
        const marker = L.marker([userCoords.latitude, userCoords.longitude], {
          icon: createUserLocationPin()
        }).addTo(map);
        userLocationMarkerRef.current = marker;
      }

      if (!hasCenteredOnUser) {
        map.setView([userCoords.latitude, userCoords.longitude], 14, { animate: true });
        setHasCenteredOnUser(true);
      }
    }
  }, [userCoords, hasCenteredOnUser]);

  // Locate the user manually via the GPS button
  const handleLocate = () => {
    const map = mapRef.current;
    if (!map) return;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 15, { animate: true });
          
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const marker = L.marker([latitude, longitude], {
              icon: createUserLocationPin()
            }).addTo(map);
            userLocationMarkerRef.current = marker;
          }
          setHasCenteredOnUser(true);

          onUserCoordsUpdate?.({ latitude, longitude });
        },
        (error) => {
          alert("Could not retrieve your location. Please check your browser permissions.");
          console.warn("Could not retrieve user location manually:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full bg-neutral-950" />
      
      {/* GPS Locate Button */}
      <button
        onClick={handleLocate}
        className="absolute top-[86px] right-[10px] z-[400] h-[30px] w-[30px] rounded-[4px] bg-[#1c1b1b]/95 border border-white/10 text-neutral-300 hover:text-white active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-md shadow-black/80"
        title="Show my location"
      >
        <span className="material-symbols-outlined text-[16px]">my_location</span>
      </button>
    </div>
  );
}
