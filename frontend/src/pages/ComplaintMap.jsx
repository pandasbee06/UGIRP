import { useState, useEffect } from "react";
import { apiJson } from "../lib/api";
import { ShieldAlert, Map as MapIcon, Loader2 } from "lucide-react";

// Leaflet relies on window being defined. In Vite/React it's fine, but requires specific CSS.
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet's default icon rendering issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// Custom Colored Icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = createIcon('red');
const goldIcon = createIcon('gold');
const greenIcon = createIcon('green');
const blueIcon = createIcon('blue');

// Default center: New Delhi
const defaultCenter = [28.6139, 77.2090];

// Mock Authority Locations
const authorityMarkers = [
  { id: "A1", type: "Police Station", lat: 28.62, lng: 77.21, name: "Central Civic Police Dept" },
  { id: "A2", type: "Municipal Office", lat: 28.61, lng: 77.20, name: "New Delhi Municipal Council" },
];

export default function ComplaintMap() {
  const [complaints, setComplaints] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      try {
        const res = await apiJson("/api/complaints/map-data");
        const validGeoData = res.data.filter(c => c.coordinates && c.coordinates.lat && c.coordinates.lng);
        setComplaints(validGeoData);
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  const getMarkerIcon = (status, priority) => {
    if (status === "Resolved") return greenIcon;
    if (priority === "Critical" || priority === "High") return redIcon;
    return goldIcon;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading OpenStreetMap Geospatial Data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <MapIcon className="h-8 w-8 text-indigo-500" />
            Live Civic Geospatial Map
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time visualization of community issues using OpenStreetMap architecture.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              showHeatmap 
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            {showHeatmap ? "Disable Heatmap" : "Enable Crisis Heatmap"}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-white/10 z-0">
        <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {showHeatmap && complaints.map((c, i) => (
            // Simulate Heatmap using overlapping radial translucent circles
            <Circle 
              key={`heat-${i}`} 
              center={[c.coordinates.lat, c.coordinates.lng]} 
              radius={800} // meters
              pathOptions={{
                color: c.priority === "Critical" ? "#ef4444" : "#f59e0b",
                fillColor: c.priority === "Critical" ? "#ef4444" : "#f59e0b",
                fillOpacity: 0.3,
                stroke: false
              }}
            />
          ))}

          {!showHeatmap && complaints.map((ticket) => (
            <Marker
              key={ticket.ticketId}
              position={[ticket.coordinates.lat, ticket.coordinates.lng]}
              icon={getMarkerIcon(ticket.status, ticket.priority)}
            >
              <Popup className="rounded-xl">
                <div className="p-1 max-w-[200px] text-slate-900">
                  <p className="text-xs text-slate-500 font-mono mb-1">{ticket.ticketId}</p>
                  <h3 className="font-bold text-sm mb-1">{ticket.title}</h3>
                  <p className="text-xs mb-2 text-slate-600">{ticket.category}</p>
                  <div className="flex gap-1 justify-between items-center text-xs font-semibold">
                    <span className={`px-2 py-0.5 rounded-full ${ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {!showHeatmap && authorityMarkers.map((auth) => (
            <Marker
              key={auth.id}
              position={[auth.lat, auth.lng]}
              icon={blueIcon}
            >
              <Popup>
                <div className="font-bold text-sm text-blue-900">{auth.name}</div>
                <div className="text-xs text-slate-500">{auth.type}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Map Legend Overlay */}
        <div className="absolute bottom-6 left-6 rounded-xl bg-white/90 p-4 shadow-lg backdrop-blur dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 hidden sm:block pointer-events-none z-[1000]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Map Legend</h4>
          <div className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-red-500 bg-red-100"></div> Critical/High</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-100"></div> Pending Medium</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-100"></div> Resolved Issue</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-100"></div> Authority Office</div>
          </div>
        </div>

      </div>
    </div>
  );
}
