import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapView() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  const routeRef = useRef([]); // Original stop points
  const roadRouteRef = useRef([]); // Road-snapped full route
  const segIndexRef = useRef(0);
  const segStartRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const playingRef = useRef(false);
  const animRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseProgressRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState('-');
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentCoords, setCurrentCoords] = useState({ lat: '-', lng: '-' });
  const [autoFollow, setAutoFollow] = useState(true);

  const busIcon = (angle = 0) =>
    L.divIcon({
      html: `<img src="/bus.png" style="width:21px; height:40px; transform: rotate(${angle}deg);" />`,
      iconSize: [40, 40],
      className: ''
    });

  const stopIcon = new L.Icon({
    iconUrl: '/stop.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  useEffect(() => {
    fetch('/dummy-route.json')
      .then(res => res.json())
      .then(async data => {
        routeRef.current = data;
        roadRouteRef.current = await getRoadRoute(data);
        initMap(data);
      });
  }, []);

  const getRoadRoute = async (points) => {
    let fullRoute = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          if (i > 0) coords.shift();
          fullRoute = fullRoute.concat(coords);
        }
      } catch (err) {
        console.error('OSRM error:', err);
        fullRoute.push(a, b);
      }
    }
    return fullRoute;
  };

  const initMap = (points) => {
    if (!points || points.length < 2) return;
    mapRef.current = L.map('map').setView([points[0].latitude, points[0].longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    markerRef.current = L.marker([points[0].latitude, points[0].longitude], { icon: busIcon(0) }).addTo(mapRef.current);
    polylineRef.current = L.polyline([[points[0].latitude, points[0].longitude]], { color: '#2563eb', weight: 5 }).addTo(mapRef.current);

    points.forEach(p => {
      if (p.stop) L.marker([p.latitude, p.longitude], { icon: stopIcon }).addTo(mapRef.current).bindPopup("Bus Stop");
    });

    const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
    mapRef.current.fitBounds(bounds.pad(0.2));
    setCurrentCoords({ lat: points[0].latitude, lng: points[0].longitude });
  };

  const play = () => {
    if (playingRef.current || roadRouteRef.current.length < 2) return;
    playingRef.current = true;
    setIsPlaying(true);

    const now = Date.now();
    if (startTimeRef.current === 0) startTimeRef.current = now;
    segStartRef.current = now - pauseProgressRef.current;
    lastFrameTimeRef.current = now;

    animate();
  };

  const pause = () => {
    playingRef.current = false;
    setIsPlaying(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    pauseProgressRef.current = Date.now() - segStartRef.current;
  };

  const restart = () => {
    if (!playingRef.current) {
      playingRef.current = true;
      setIsPlaying(true);
      const now = Date.now();
      segStartRef.current = now - pauseProgressRef.current;
      lastFrameTimeRef.current = now;
      animate();
    }
  };

  const reset = () => {
    pause();
    segIndexRef.current = 0;
    setElapsed(0);
    setSpeed('-');
    setTotalDistance(0);
    pauseProgressRef.current = 0;
    startTimeRef.current = 0;
    if (polylineRef.current && roadRouteRef.current[0]) {
      polylineRef.current.setLatLngs([[roadRouteRef.current[0].latitude, roadRouteRef.current[0].longitude]]);
      markerRef.current.setLatLng([roadRouteRef.current[0].latitude, roadRouteRef.current[0].longitude]);
      markerRef.current.setIcon(busIcon(0));
      setCurrentCoords({ lat: roadRouteRef.current[0].latitude, lng: roadRouteRef.current[0].longitude });
    }
  };

  const animate = () => {
    if (!playingRef.current) return;
    const now = Date.now();
    const a = roadRouteRef.current[segIndexRef.current];
    const b = roadRouteRef.current[segIndexRef.current + 1];
    if (!b) {
      alert("🚍 Bus has reached the final stop!");
      reset();
      return;
    }

    const segDuration = 1000; // medium speed
    const t = Math.min(1, (now - segStartRef.current) / segDuration);
    const lat = a.latitude + (b.latitude - a.latitude) * t;
    const lng = a.longitude + (b.longitude - a.longitude) * t;

    const angle = getBearing(a, b);
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current.setIcon(busIcon(angle));
    setCurrentCoords({ lat: lat.toFixed(5), lng: lng.toFixed(5) });
    polylineRef.current.addLatLng([lat, lng]);
    if (autoFollow) mapRef.current.setView([lat, lng], mapRef.current.getZoom());

    // elapsed
    const totalElapsed = now - startTimeRef.current;
    setElapsed(totalElapsed);

    // speed
    const deltaTimeSec = (now - lastFrameTimeRef.current) / 1000;
    const distM = haversine(a, b) * t;
    if (deltaTimeSec > 0) setSpeed(`${(distM / 1000 / (deltaTimeSec / 3600)).toFixed(1)} km/h`);

    if (t >= 1) {
      const segDist = haversine(a, b);
      setTotalDistance(prev => prev + segDist);
      segIndexRef.current += 1;
      segStartRef.current = now;
      lastFrameTimeRef.current = now;
      pauseProgressRef.current = 0;
    } else {
      lastFrameTimeRef.current = now;
    }

    animRef.current = requestAnimationFrame(animate);
  };

  const getBearing = (a, b) => {
    const toRad = deg => (deg * Math.PI) / 180;
    const toDeg = rad => (rad * 180) / Math.PI;
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = Math.atan2(y, x);
    return (toDeg(brng) + 360) % 360;
  };

  const haversine = (a, b) => {
    const R = 6371000;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '15px' }}>
      <h2 style={{ marginBottom: '15px', textAlign: 'center', color: '#1e40af' }}>
        🚍 SchoolBus 2.0 – Vehicle Movement
      </h2>

      <div className="controls" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={play} disabled={isPlaying} style={btnStyle('#22c55e')}>▶ Play</button>
        <button onClick={pause} disabled={!isPlaying} style={btnStyle('#ef4444')}>⏸ Pause</button>
        <button onClick={restart} disabled={isPlaying} style={btnStyle('#3b82f6')}>⏯ Restart</button>
        <button onClick={reset} style={btnStyle('#f59e0b')}>🔄 Reset</button>
        <label style={{ marginLeft: '10px', fontWeight: 'bold' }}>
          <input type="checkbox" checked={autoFollow} onChange={() => setAutoFollow(!autoFollow)} /> Auto-Follow Bus
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div style={statCard}><strong>Elapsed</strong><br />{formatTime(elapsed)}</div>
        <div style={statCard}><strong>Speed</strong><br />{speed}</div>
        <div style={statCard}><strong>Total Distance</strong><br />{(totalDistance / 1000).toFixed(2)} km</div>
        <div style={statCard}><strong>Coords</strong><br />Lat: {currentCoords.lat}, Lng: {currentCoords.lng}</div>
      </div>

      <div id="map" style={{ height: '70vh', width: '100%', borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0,0,0,0.2)' }}></div>
    </div>
  );
}

const btnStyle = (bg) => ({
  background: bg,
  color: 'white',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none'
});

const statCard = {
  background: 'white',
  padding: '12px 20px',
  borderRadius: '10px',
  boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
  textAlign: 'center',
  minWidth: '130px'
};

export default MapView;
