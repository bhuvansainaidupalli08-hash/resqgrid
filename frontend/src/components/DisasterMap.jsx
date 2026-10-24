import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function DisasterMap({ requests = [], shelters = [], resources = [], onSelectRequest, selectedRequestId }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered around the Bay area demo coordinates
      const map = L.map(mapContainerRef.current, {
        center: [37.770, -122.420],
        zoom: 12,
        zoomControl: true,
      });

      // CartoDB Dark Matter tiles for military/emergency operations command visual styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Synthetic Disaster Hazard Zones
      // Riverdale Flash Flood Inundation Zone
      const floodZone = L.polygon([
        [37.772, -122.445],
        [37.758, -122.448],
        [37.755, -122.430],
        [37.768, -122.428]
      ], {
        color: '#3b82f6',
        fillColor: '#1d4ed8',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map);
      floodZone.bindTooltip('<b>Riverdale Inundation Zone</b><br/>High Risk Flash Flood Hazard Area (Synthetic)', { sticky: true });

      // Causeway Bridge Structural Inspection Zone
      const bridgeLine = L.polyline([
        [37.760, -122.435],
        [37.750, -122.415]
      ], {
        color: '#f59e0b',
        weight: 4,
        dashArray: '6, 6'
      }).addTo(map);
      bridgeLine.bindTooltip('<b>Riverdale-Southpoint Causeway Bridge</b><br/>Conflicting Status: Closed to Civilian / Open for Emergency Only', { sticky: true });

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Refresh markers
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (layer) {
      layer.clearLayers();

      // 1. Render Shelters
      shelters.forEach((s) => {
        const isNearOrFull = s.status === 'FULL' || s.status === 'NEAR_CAPACITY';
        const color = isNearOrFull ? '#f59e0b' : '#10b981';
        const shelterHtml = `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.4); font-size: 14px; font-weight: bold; color: white;">
            S
          </div>
        `;
        const icon = L.divIcon({
          html: shelterHtml,
          className: 'shelter-marker-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([s.latitude, s.longitude], { icon });
        const pct = Math.round((s.current_occupancy / s.capacity) * 100);
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Evacuation Shelter</div>
            <div style="font-weight: 700; font-size: 14px; margin-top: 2px; color: #f8fafc;">${s.name}</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${s.address}</div>
            <div style="margin-top: 8px; background: #1e293b; padding: 6px 8px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Occupancy:</span>
                <span style="font-weight: bold; color: ${color};">${s.current_occupancy} / ${s.capacity} (${pct}%)</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
                <span>Supplies:</span>
                <span style="font-weight: bold;">${s.supplies_status}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px; color: #94a3b8;">
                <span>Contact:</span>
                <span>${s.contact_info}</span>
              </div>
            </div>
          </div>
        `);
        layer.addLayer(marker);
      });

      // 2. Render Requests
      requests.forEach((req) => {
        const isCritical = req.urgency_level === 'CRITICAL';
        const isHigh = req.urgency_level === 'HIGH';
        const isSelected = req.id === selectedRequestId;
        const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
        const pulseClass = isCritical ? 'radar-pulse-critical' : isHigh ? 'radar-pulse-amber' : '';

        const markerHtml = `
          <div class="${pulseClass}" style="background-color: ${color}; width: ${isSelected ? 32 : 26}px; height: ${isSelected ? 32 : 26}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid ${isSelected ? '#38bdf8' : '#ffffff'}; box-shadow: 0 0 10px ${color}; font-size: 12px; font-weight: 800; color: white; cursor: pointer;">
            !
          </div>
        `;
        const icon = L.divIcon({
          html: markerHtml,
          className: 'req-marker-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([req.latitude, req.longitude], { icon });
        marker.on('click', () => {
          if (onSelectRequest) onSelectRequest(req);
        });

        marker.bindPopup(`
          <div style="min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="background: ${color}; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 3px;">
                ${req.urgency_level}
              </span>
              <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">${req.request_code}</span>
            </div>
            <div style="font-weight: 700; font-size: 14px; margin-top: 6px; color: #f8fafc;">${req.citizen_name}</div>
            <div style="font-size: 12px; color: #cbd5e1;">${req.location_address} (${req.district})</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 6px; border-left: 2px solid ${color}; padding-left: 6px;">
              ${req.details}
            </div>
            ${req.special_needs ? `<div style="font-size: 11px; color: #f87171; font-weight: 600; margin-top: 6px;">Special Needs: ${req.special_needs}</div>` : ''}
            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 6px; font-size: 11px;">
              <span>Status: <b>${req.status}</b></span>
              <span>Credibility: <b>${req.credibility}</b></span>
            </div>
          </div>
        `);
        layer.addLayer(marker);
      });
    }
  }, [requests, shelters, resources, selectedRequestId]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '520px' }} />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3.5 py-2.5 rounded-lg text-xs space-y-1.5 shadow-xl text-slate-200 pointer-events-auto">
        <div className="font-semibold text-slate-400 text-[11px] tracking-wider uppercase">Map Overlays</div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block animate-ping opacity-75"></span>
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block -ml-5"></span>
          <span>Critical Emergency</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span>High Urgency Request</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block text-[9px] text-center font-bold text-white leading-3">S</span>
          <span>Shelter Station (Active)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-4 h-1 bg-blue-500 inline-block border-dashed border-b"></span>
          <span>Flood Inundation Polygon</span>
        </div>
      </div>
    </div>
  );
}
