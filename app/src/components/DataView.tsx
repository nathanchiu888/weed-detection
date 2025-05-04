import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertCircle, Pause, Radio } from 'lucide-react';
// Import the sample live image for the video feed
import sampleLiveImage from '../assets/sample_live.png';

// MapUpdater component to handle map centering
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const DataView: React.FC = () => {
  // Field selection state
  const [selectedField, setSelectedField] = useState<string>("Kearney");
  
  // Define field locations for the map
  const fieldLocations: Record<string, { center: [number, number], zoom: number }> = {
    'Kearney': { 
      center: [38.519965, -121.782626],
      zoom: 18
    },
    'Olive': { 
      center: [38.512927, -121.855225],
      zoom: 17
    },
    'West Barn': { 
      center: [38.505609, -121.878474],
      zoom: 19
    }
  };
  
  // Get selected field location
  const fieldInfo = fieldLocations[selectedField] || fieldLocations.Kearney;
  
  // Mock rover path data - array of [lat, lng] coordinates
  const [roverPath, setRoverPath] = useState<[number, number][]>([
    [fieldInfo.center[0] - 0.0008, fieldInfo.center[1] - 0.0005],
    [fieldInfo.center[0] - 0.0005, fieldInfo.center[1]],
    [fieldInfo.center[0] - 0.0002, fieldInfo.center[1] + 0.0003],
    [fieldInfo.center[0], fieldInfo.center[1] + 0.0005],
    [fieldInfo.center[0] + 0.0001, fieldInfo.center[1] + 0.0004]
  ]);
  
  // Current rover position (last point in path)
  const currentPosition = roverPath[roverPath.length - 1];
  
  // Terminal log data
  const [logEntries, setLogEntries] = useState<{ timestamp: string, lat: string, lng: string, classification: string }[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Classification types for log and image
  const classificationTypes = ["Broadleaf", "Grass", "Soil"];
  const [currentClassification, setCurrentClassification] = useState<string>("Soil");
  const [confidenceValue, setConfidenceValue] = useState<number>(95.7);
  
  // Device status
  const [deviceStatus, setDeviceStatus] = useState<'live' | 'off' | 'pending'>('live');
  
  // Mock GPS data
  const [gpsData, setGpsData] = useState({
    latitude: currentPosition[0].toFixed(6),
    longitude: currentPosition[1].toFixed(6),
    altitude: "285 ft",
    speed: "4.2 mph",
    heading: "Northeast"
  });

  // Function to generate a log entry
  const generateLogEntry = () => {
    const now = new Date();
    const timestamp = now.toTimeString().substring(0, 8);
    const classification = classificationTypes[Math.floor(Math.random() * classificationTypes.length)];
    
    // Update current classification occasionally for the image
    if (Math.random() > 0.7) {
      setCurrentClassification(classification);
      setConfidenceValue(80 + Math.random() * 19.9); // 80-99.9%
    }
    
    return {
      timestamp,
      lat: (fieldInfo.center[0] + (Math.random() * 0.0004 - 0.0002)).toFixed(6),
      lng: (fieldInfo.center[1] + (Math.random() * 0.0004 - 0.0002)).toFixed(6),
      classification
    };
  };
  
  // Update log entries periodically
  useEffect(() => {
    if (deviceStatus !== 'live') return;
    
    const addLogEntry = () => {
      const newEntry = generateLogEntry();
      setLogEntries(prev => {
        const updated = [...prev, newEntry].slice(-50); // Keep only the last 50 entries
        return updated;
      });
    };
    
    // Add initial entries
    if (logEntries.length === 0) {
      const initialEntries = Array(8).fill(null).map(() => generateLogEntry());
      setLogEntries(initialEntries);
    }
    
    const interval = setInterval(addLogEntry, 1500);
    return () => clearInterval(interval);
  }, [deviceStatus, fieldInfo.center]);
  
  // Auto-scroll log to bottom when new entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries]);
  
  // Vehicle type options
  const vehicleTypes = ["Rover", "Tractor Attachment", "Human Operated"];
  const [vehicleType, setVehicleType] = useState(vehicleTypes[0]);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Live Data Feed</h2>
        
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="field-select" className="text-sm text-zinc-400 mr-2">Field:</label>
            <select 
              id="field-select"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 text-sm"
            >
              {Object.keys(fieldLocations).map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status-select" className="text-sm text-zinc-400 mr-2">Status:</label>
            <select 
              id="status-select"
              value={deviceStatus}
              onChange={(e) => setDeviceStatus(e.target.value as 'live' | 'off' | 'pending')}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 text-sm"
            >
              <option value="live">Live</option>
              <option value="off">Off</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOP LEFT: Live Map with Rover Location */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Rover Location</h3>
          <div className="h-[280px] relative rounded-md overflow-hidden">
            <MapContainer 
              center={fieldInfo.center} 
              zoom={fieldInfo.zoom} 
              style={{ height: '100%', width: '100%', borderRadius: '0.25rem' }}
              zoomControl={true}
            >
              <MapUpdater center={fieldInfo.center} zoom={fieldInfo.zoom} />
              
              {/* ESRI World Imagery satellite layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              
              {/* Rover path */}
              <Polyline 
                positions={roverPath} 
                color="#3b82f6" 
                weight={3}
                opacity={0.7}
              />
              
              {/* Current rover position */}
              <Marker
                position={currentPosition}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div style="
                      background-color: #3b82f6; 
                      width: 18px; 
                      height: 18px; 
                      border-radius: 9px; 
                      border: 3px solid white;
                      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
                    "></div>
                  `,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9]
                })}
              />
            </MapContainer>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{gpsData.latitude}, {gpsData.longitude}</span>
              </div>
            </div>
            <div className={`px-2 py-1 text-xs font-medium rounded-full ${
              deviceStatus === 'live' 
                ? 'bg-green-900 text-green-300' 
                : deviceStatus === 'off' 
                  ? 'bg-red-900 text-red-300' 
                  : 'bg-yellow-900 text-yellow-300'
            }`}>
              {deviceStatus.toUpperCase()}
            </div>
          </div>
        </div>
        
        {/* TOP RIGHT: Terminal Log */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Terminal Log</h3>
          <div 
            ref={logContainerRef}
            className="h-[280px] bg-zinc-950 rounded-md border border-zinc-800 p-3 font-mono text-sm overflow-y-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            {logEntries.map((entry, index) => (
              <div key={index} className="mb-1 leading-tight">
                <span className="text-zinc-500">[{entry.timestamp}]</span>
                <span className="text-zinc-300"> Latitude: </span>
                <span className="text-blue-400">{entry.lat}</span>
                <span className="text-zinc-300"> Longitude: </span>
                <span className="text-blue-400">{entry.lng}</span>
                <span className="text-zinc-300"> Class: </span>
                <span className={
                  entry.classification === 'Broadleaf' 
                    ? 'text-green-400' 
                    : entry.classification === 'Grass' 
                      ? 'text-yellow-400' 
                      : 'text-gray-400'
                }>
                  {entry.classification}
                </span>
              </div>
            ))}
            {deviceStatus === 'live' ? (
              <div className="animate-pulse text-green-500">●</div>
            ) : deviceStatus === 'pending' ? (
              <div className="animate-pulse text-yellow-500">●</div>
            ) : null}
          </div>
        </div>
        
        {/* BOTTOM LEFT: Live Video Feed Placeholder */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Live Video Feed</h3>
          <div className="h-[280px] bg-zinc-950 rounded-md border border-zinc-800 flex items-center justify-center relative">
            {/* Image placeholder with actual image */}
            <div className="w-full h-full overflow-hidden relative">
              {deviceStatus === 'live' ? (
                /* Use the imported sample live image */
                <div 
                  className="w-full h-full"
                  style={{ 
                    backgroundImage: `url(${sampleLiveImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Classification tag */}
                  <div className="absolute top-4 right-4">
                    <div className={`
                      px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 shadow-lg bg-yellow-900 text-yellow-100`}>
                      {/* ${currentClassification === 'Broadleaf' ? 'bg-green-900 text-green-100' :
                        currentClassification === 'Grass' ? 'bg-yellow-900 text-yellow-100' :
                        'bg-zinc-800 text-zinc-300'} */}
                    
                      <span>Grass</span>
                      <span className="text-xs px-1.5 py-0.5 bg-black bg-opacity-30 rounded">
                        {confidenceValue.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Camera overlay elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Recording indicator */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-xs text-white font-mono">REC</span>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="absolute bottom-3 right-4 text-xs text-white font-mono opacity-70">
                      {new Date().toLocaleTimeString()} | {selectedField}
                    </div>
                    
                    {/* Focus corners */}
                    <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white opacity-40"></div>
                    <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white opacity-40"></div>
                    <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white opacity-40"></div>
                    <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white opacity-40"></div>
                  </div>
                </div>
              ) : deviceStatus === 'pending' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-yellow-500 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
                    <span className="mt-2">Connecting...</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-zinc-500 flex flex-col items-center">
                    <Pause size={40} />
                    <span className="mt-2">Feed Offline</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* BOTTOM RIGHT: Device Characteristics/Status */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Device Status</h3>
          <div className="space-y-5">
            {/* Vehicle Type */}
            <div>
              <h4 className="text-sm text-zinc-400 mb-2">Vehicle Type</h4>
              <div className="flex gap-2">
                {vehicleTypes.map(type => (
                  <button 
                    key={type}
                    className={`px-3 py-2 text-sm rounded-md flex items-center gap-1.5
                      ${vehicleType === type ? 'bg-blue-900 text-blue-100' : 'bg-zinc-800 text-zinc-300'}
                    `}
                    onClick={() => setVehicleType(type)}
                  >
                    <Radio size={14} className={vehicleType === type ? 'text-blue-200' : 'text-zinc-400'} />
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* GPS Information */}
            <div>
              <h4 className="text-sm text-zinc-400 mb-2">GPS Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800 rounded-md p-3">
                  <div className="text-xs text-zinc-400 mb-1">Latitude</div>
                  <div className="font-medium">{gpsData.latitude}</div>
                </div>
                
                <div className="bg-zinc-800 rounded-md p-3">
                  <div className="text-xs text-zinc-400 mb-1">Longitude</div>
                  <div className="font-medium">{gpsData.longitude}</div>
                </div>
                
                <div className="bg-zinc-800 rounded-md p-3">
                  <div className="text-xs text-zinc-400 mb-1">Altitude</div>
                  <div className="font-medium">{gpsData.altitude}</div>
                </div>
                
                <div className="bg-zinc-800 rounded-md p-3">
                  <div className="text-xs text-zinc-400 mb-1">Speed</div>
                  <div className="font-medium">{gpsData.speed}</div>
                </div>
                
                <div className="bg-zinc-800 rounded-md p-3">
                  <div className="text-xs text-zinc-400 mb-1">Heading</div>
                  <div className="font-medium">{gpsData.heading}</div>
                </div>
                
                <div className="bg-zinc-800 rounded-md p-3">
                  <div className="text-xs text-zinc-400 mb-1">Signal</div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-1 bg-green-500 rounded-sm"></div>
                    <div className="h-3 w-1 bg-green-500 rounded-sm"></div>
                    <div className="h-4 w-1 bg-green-500 rounded-sm"></div>
                    <div className="h-5 w-1 bg-green-500 rounded-sm"></div>
                    <div className="h-6 w-1 bg-zinc-600 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Status */}
            <div>
              <h4 className="text-sm text-zinc-400 mb-2">System Status</h4>
              <div className="flex items-center justify-between bg-zinc-800 rounded-md p-3">
                <div>
                  <div className="font-medium mb-1">Detection System</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      deviceStatus === 'live' ? 'bg-green-500' : 
                      deviceStatus === 'pending' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                    }`}></span>
                    <span className={
                      deviceStatus === 'live' ? 'text-green-500' : 
                      deviceStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'
                    }>
                      {deviceStatus === 'live' ? 'Online' : 
                       deviceStatus === 'pending' ? 'Connecting...' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 text-sm font-medium rounded flex items-center gap-1 ${
                  deviceStatus === 'live' 
                    ? 'bg-green-900 text-green-100' 
                    : deviceStatus === 'off' 
                      ? 'bg-red-900 text-red-100' 
                      : 'bg-yellow-900 text-yellow-100'
                }`}>
                  <AlertCircle size={14} />
                  {deviceStatus === 'live' ? 'ACTIVE' : 
                   deviceStatus === 'pending' ? 'STANDBY' : 'INACTIVE'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add leaflet CSS and marker icon fix */}
      <style>{`
        .custom-div-icon {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default DataView;