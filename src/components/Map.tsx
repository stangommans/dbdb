"use client";

import { useEffect, useRef } from 'react';
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
}

export default function Map({ bars, selectedBarId, onBarSelect, onMapClick, newPinCoords }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const newPinMarkerRef = useRef<L.Marker | null>(null);

  // Initial map shell load
  useEffect(() => {
    if (!mapContainerRef.current) return;

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
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapClick]);

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

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: false
      });

      marker.on('click', () => {
        onBarSelect(bar.id);
      });

      markersRef.current[bar.id] = marker;
      bounds.push([bar.latitude, bar.longitude]);
    });

    // Automatically zoom and fit to encapsulate all active pins when no bar is focused
    if (bounds.length > 0 && !selectedBarId && !newPinCoords) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bars, onBarSelect, selectedBarId, newPinCoords]);

  // React to selected bar zooms
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBarId) return;

    const marker = markersRef.current[selectedBarId];
    if (marker) {
      const latLng = marker.getLatLng();
      map.setView(latLng, 16, { animate: true });
      marker.openPopup();
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full bg-neutral-950" />
    </div>
  );
}
