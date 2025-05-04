import React, { useState, useEffect } from 'react';
// Update imports to include additional icons for new buttons
import { Maximize, RotateCcw, Info, ChevronDown, MapPin, X, Download, FileSpreadsheet, Settings } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with webpack/vite
// This is needed because the default markers reference image files that aren't properly bundled
// Creating a simple div-based marker icon instead
const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; opacity: 0.7;" class="marker-pin"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Component to handle map view updates when field changes
const MapUpdater = ({ center, zoom, disableInteraction }: { center: [number, number], zoom: number, disableInteraction: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    // Set view to the specified center and zoom
    map.setView(center, zoom);
    
    // DISABLE INTERACTION: This section disables map dragging and zooming
    // To re-enable map interaction, set disableInteraction to false or remove this section
    if (disableInteraction) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      //if (map.tap) map.tap.disable();
    } else {
      // This code re-enables all interactions if disableInteraction is false
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      //if (map.tap) map.tap.enable();
    }
  }, [map, center, zoom, disableInteraction]);
  
  return null;
};

// New component for placing pins on the map
const PinPlacer = ({ 
  addPin
}: { 
  pins: [number, number][]; 
  addPin: (latlng: [number, number]) => void; 
  center: [number, number];
}) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: any) => {
      // Add a new pin when the map is clicked
      const { lat, lng } = e.latlng;
      addPin([lat, lng]);
    };

    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, addPin]);
  
  return null;
};

interface HeatmapCell {
  value: number;
  lat: string;
  long: string;
  confidence: number;
}

interface HeatmapProps {
  fieldName: string;
}

interface FieldInfo {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
}

const WeedHeatmap: React.FC<HeatmapProps> = ({ fieldName }) => {
  const [weedType, setWeedType] = useState<'grass' | 'broadleaf'>('grass');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  
  // New state for route planning dialog
  const [routePlanningOpen, setRoutePlanningOpen] = useState(false);
  const [routePins, setRoutePins] = useState<[number, number][]>([]);
  
  // Define specific locations and zoom levels for each field
  const fieldLocations: Record<string, FieldInfo> = {
    'Kearney': { 
      center: [38.519965, -121.782626],
      zoom: 35 
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
  
  // Set default location
  const defaultLocation: FieldInfo = { 
    center: [40.4213, -86.9143],
    zoom: 18
  };
  
  // Get field info or use default if not found
  const fieldInfo = fieldLocations[fieldName] || defaultLocation;
  
  const [mapCenter, setMapCenter] = useState<[number, number]>(fieldInfo.center);
  const [mapZoom, setMapZoom] = useState<number>(fieldInfo.zoom);

  // DISABLE MAP INTERACTION FLAG
  // Set this to false if you want to allow users to pan and zoom the map
  // Set to true to lock the map to the initial field location view
  const disableMapInteraction = true;

  // Generate mock data for different field names and weed types
  const getMockData = (field: string, type: 'grass' | 'broadleaf') => {
    // Base coordinates for each field (these would be different for each real field)
    const baseCoords = {
      'Kearney': { lat: fieldLocations['Kearney'].center[0], long: fieldLocations['Kearney'].center[1] },
      'Olive': { lat: fieldLocations['Olive'].center[0], long: fieldLocations['Olive'].center[1] },
      'West Barn': { lat: fieldLocations['West Barn'].center[0], long: fieldLocations['West Barn'].center[1] },
    };
    
    const baseCoord = baseCoords[field as keyof typeof baseCoords] || baseCoords.Kearney;
    
    // Update map center and zoom when field changes
    setMapCenter([baseCoord.lat, baseCoord.long]);
    setMapZoom(fieldLocations[field]?.zoom || defaultLocation.zoom);
    
    // Generate a 12x12 grid with different patterns for each field and weed type
    const grid: HeatmapCell[][] = Array(12).fill(0).map((_, rowIndex) => 
      Array(12).fill(0).map((_, colIndex) => {
        let value = 1; // Default low concentration
        let confidence = 30 + Math.floor(Math.random() * 20); // 30-50% confidence for low concentration
        
        // Different weed concentration patterns for different fields and types
        if (field === 'Kearney') {
          if (type === 'grass') {
            if ((rowIndex > 3 && rowIndex < 8) && (colIndex > 5 && colIndex < 9)) {
              value = 2; // Medium concentration cluster in middle-right
              confidence = 60 + Math.floor(Math.random() * 15); // 60-75% confidence
            }
            if ((rowIndex === 6 && colIndex === 7) || (rowIndex === 5 && colIndex === 6)) {
              value = 3; // High concentration points
              confidence = 85 + Math.floor(Math.random() * 15); // 85-100% confidence
            }
          } else { // broadleaf
            if ((rowIndex > 7 && rowIndex < 11) && (colIndex > 2 && colIndex < 6)) {
              value = 2;
              confidence = 50 + Math.floor(Math.random() * 25); // 50-75% confidence
            }
            if (rowIndex === 9 && colIndex === 4) {
              value = 3;
              confidence = 90 + Math.floor(Math.random() * 10); // 90-100% confidence
            }
          }
        } else if (field === 'Olive') {
          if (type === 'grass') {
            if (rowIndex < 3 && colIndex < 4) {
              value = 2; // Medium concentration in top left
              confidence = 55 + Math.floor(Math.random() * 20); // 55-75% confidence
            }
            if (rowIndex === 1 && colIndex === 2) {
              value = 3;
              confidence = 88 + Math.floor(Math.random() * 12); // 88-100% confidence
            }
          } else { // broadleaf
            if ((rowIndex > 8) && (colIndex > 8)) {
              value = 2; // Medium concentration in bottom right
              confidence = 60 + Math.floor(Math.random() * 15); // 60-75% confidence
            }
            if (rowIndex === 10 && colIndex === 10) {
              value = 3;
              confidence = 86 + Math.floor(Math.random() * 14); // 86-100% confidence
            }
          }
        } else { // West Barn
          if (type === 'grass') {
            if ((Math.abs(rowIndex - colIndex) < 2) && rowIndex > 4) {
              value = 2; // Medium concentration along diagonal
              confidence = 65 + Math.floor(Math.random() * 15); // 65-80% confidence
            }
            if (rowIndex === 8 && colIndex === 8) {
              value = 3;
              confidence = 89 + Math.floor(Math.random() * 11); // 89-100% confidence
            }
          } else { // broadleaf
            if ((rowIndex + colIndex > 16) && (rowIndex + colIndex < 20)) {
              value = 2; // Medium concentration band
              confidence = 58 + Math.floor(Math.random() * 22); // 58-80% confidence
            }
            if (rowIndex === 6 && colIndex === 11) {
              value = 3;
              confidence = 92 + Math.floor(Math.random() * 8); // 92-100% confidence
            }
          }
        }

        // Calculate precise lat/long based on position in grid
        const latOffset = (rowIndex - 6) * 0.0002; // small offset from base coordinates
        const longOffset = (colIndex - 6) * 0.0003;
        const lat = (baseCoord.lat + latOffset).toFixed(6);
        const long = (baseCoord.long + longOffset).toFixed(6);

        return { 
          value, 
          lat: lat.toString(),
          long: long.toString(),
          confidence
        };
      })
    );
    
    return grid;
  };

  // Get data based on current field and weed type
  const [heatmapData, setHeatmapData] = useState(() => getMockData(fieldName, weedType));

  // Update data when field name or weed type changes
  useEffect(() => {
    setHeatmapData(getMockData(fieldName, weedType));
  }, [fieldName, weedType]);

  const getColorClass = (confidence: number) => {
    if (confidence < 50) return 'bg-green-500 bg-opacity-65';
    if (confidence < 85) return 'bg-yellow-500 bg-opacity-65';
    return 'bg-red-500 bg-opacity-65';
  };

  const getColorValue = (confidence: number) => {
    if (confidence < 50) return 'rgba(34, 197, 94, 0.4)'; // lighter green with transparency
    if (confidence < 85) return 'rgba(234, 179, 8, 0.4)';  // lighter yellow with transparency
    return 'rgba(239, 68, 68, 0.4)'; // lighter red with transparency
  };

  // Function to add a pin to the route
  const addRoutePin = (latlng: [number, number]) => {
    setRoutePins(prev => [...prev, latlng]);
  };
  
  // Function to remove a pin from the route
  const removeRoutePin = (index: number) => {
    setRoutePins(prev => prev.filter((_, i) => i !== index));
  };
  
  // Function to clear all route pins
  const clearRoutePins = () => {
    setRoutePins([]);
  };

  return (
    <div className="p-5 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Weed Concentration Heatmap</h2>
        <div className="flex gap-2">
          <button className="p-1.5 rounded hover:bg-zinc-800 transition-colors">
            <RotateCcw size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-zinc-800 transition-colors">
            <Maximize size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-zinc-800 transition-colors">
            <Info size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-row gap-6">
        {/* Left side - Map with Heatmap overlay */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-center w-full h-[350px] relative">
            {/* Map Container - Should be BEHIND the grid, lowest z-index */}
            <div className="absolute inset-0 z-0">
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                style={{ height: '100%', width: '100%', borderRadius: '0.25rem' }}
                zoomControl={false} /* This hides the zoom controls. Set to true to show them */
                attributionControl={false}
                /* NOTE: The dragging/zooming behavior is controlled by the MapUpdater component below */
              >
                {/* MapUpdater controls map position and interaction */}
                <MapUpdater 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  disableInteraction={disableMapInteraction} /* CONTROL FLAG for map interaction */
                />
                
                {/* ESRI World Imagery satellite layer */}
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </MapContainer>
            </div>
            
            {/* Semi-transparent overlay only in the middle */}
            <div className="absolute z-10 bg-black bg-opacity-10 pointer-events-none"
                style={{
                  width: '60%',
                  height: '90%',
                  left: '20%',
                  top: '5%'
                }}>
            </div>
            
            {/* Heatmap Grid - Now only covers 60% width and 90% height, centered */}
            <div className="absolute z-20"
                 style={{
                   width: '60%',
                   height: '90%',
                   left: '20%',
                   top: '5%'
                 }}>
              <div className="grid grid-cols-12 gap-1 w-full h-full">
                {heatmapData.map((row, rowIndex) => (
                  <React.Fragment key={`row-${rowIndex}`}>
                    {row.map((cell, colIndex) => (
                      <div
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`w-full h-full ${getColorClass(cell.confidence)} rounded-sm transition-colors hover:brightness-110 cursor-pointer`}
                        onClick={() => setSelectedCell(cell)}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Map border frame to match the component style */}
            <div className="absolute inset-0 border border-zinc-700 rounded-md pointer-events-none"></div>
          </div>
          
          {/* Enhanced button row with multiple options */}
          <div className="mt-3 flex justify-center gap-3">
            
            <button 
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              <span>Export Data</span>
            </button>
            
            <div className="group relative">
              <button 
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center gap-2 transition-colors"
              >
                <Settings size={16} />
                <span>View Options</span>
              </button>
              
              <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-zinc-800 rounded-md border border-zinc-700 shadow-lg z-10">
                <div className="py-1 min-w-[160px]">
                  <button className="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-green-500"></span>
                    <span>Show Low</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-yellow-500"></span>
                    <span>Show Medium</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-red-500"></span>
                    <span>Show High</span>
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet size={16} />
              <span>Reports</span>
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 transition-colors"
              onClick={() => setRoutePlanningOpen(true)}
            >
              <MapPin size={16} />
              <span>Plan Route</span>
            </button>
          </div>
        </div>
        
        {/* Right side - Controls and Info */}
        <div className="w-72 flex flex-col gap-6">
          {/* Weed Type Dropdown */}
          <div className="relative">
            <label className="block text-sm text-zinc-400 mb-1">Weed Type</label>
            <button 
              className="w-full px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700 flex items-center justify-between gap-1"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>{weedType === 'grass' ? 'Grasses' : 'Broadleafs'}</span>
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 rounded-md border border-zinc-700 overflow-hidden z-10">
                <button 
                  className={`w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors ${weedType === 'grass' ? 'bg-zinc-700' : ''}`}
                  onClick={() => { 
                    setWeedType('grass'); 
                    setDropdownOpen(false); 
                  }}
                >
                  Grasses
                </button>
                <button 
                  className={`w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors ${weedType === 'broadleaf' ? 'bg-zinc-700' : ''}`}
                  onClick={() => { 
                    setWeedType('broadleaf'); 
                    setDropdownOpen(false); 
                  }}
                >
                  Broadleafs
                </button>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Legend</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                <span className="text-sm">Low concentration (&lt;50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
                <span className="text-sm">Medium concentration (50-85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                <span className="text-sm">High concentration (&gt;85%)</span>
              </div>
            </div>
          </div>
          
          {/* Metadata Container */}
          <div className="mt-auto">
            <label className="block text-sm text-zinc-400 mb-1">Selected Cell Info</label>
            <div className="p-3 bg-zinc-800 rounded-md border border-zinc-700">
              {selectedCell ? (
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-zinc-400">GeoCoords:</span>
                    <span className="font-medium">{selectedCell.lat}, {selectedCell.long}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Classification:</span>
                    <span className="font-medium capitalize">{weedType}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-400">Confidence:</span>
                    <span className={`font-medium ${
                      selectedCell.confidence < 50 ? 'text-green-500' : 
                      selectedCell.confidence < 85 ? 'text-yellow-500' : 'text-red-500'
                    }`}>{selectedCell.confidence}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 italic">Click on a cell to view details</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Route Planning Dialog */}
      {routePlanningOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
          <div className="w-4/5 max-w-4xl bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
            {/* Dialog header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-medium">Plan Treatment Route</h3>
              <button 
                className="p-1.5 rounded hover:bg-zinc-800 transition-colors"
                onClick={() => {
                  setRoutePlanningOpen(false);
                  setRoutePins([]);
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Dialog content */}
            <div className="p-6 flex gap-6">
              {/* Map area */}
              <div className="flex-1 h-[500px] relative">
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%', borderRadius: '0.25rem' }}
                  zoomControl={true}
                >
                  {/* ESRI World Imagery satellite layer */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  
                  {/* Pin placement handler */}
                  <PinPlacer 
                    pins={routePins} 
                    addPin={addRoutePin} 
                    center={mapCenter} 
                  />
                  
                  {/* Display markers for each pin */}
                  {routePins.map((pin, index) => (
                    <Marker
                      key={`pin-${index}`}
                      position={pin}
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `
                          <div style="
                            background-color: #3b82f6; 
                            width: 32px; 
                            height: 32px; 
                            border-radius: 16px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 12px;
                            border: 2px solid white;
                          ">${index + 1}</div>
                        `,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                      })}
                    />
                  ))}
                  
                  {/* Polyline connecting the pins */}
                  {routePins.length > 1 && (
                    <Polyline 
                      positions={routePins} 
                      color="#3b82f6" 
                      weight={4}
                      opacity={0.7}
                    />
                  )}
                </MapContainer>
              </div>
              
              {/* Side panel with controls and pin list */}
              <div className="w-72 flex flex-col">
                <div className="mb-5">
                  <h4 className="text-md font-medium mb-2">Instructions</h4>
                  <p className="text-sm text-zinc-400">Click on the map to place pins and create a route. The pins will be connected in the order they are placed.</p>
                </div>
                
                <div className="mb-5">
                  <h4 className="text-md font-medium mb-2">Route Points</h4>
                  {routePins.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No points added yet</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto pr-2">
                      {routePins.map((pin, index) => (
                        <div 
                          key={`pin-info-${index}`}
                          className="flex items-center justify-between mb-2 p-2 bg-zinc-800 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <span className="text-sm">
                              {pin[0].toFixed(6)}, {pin[1].toFixed(6)}
                            </span>
                          </div>
                          <button
                            className="text-zinc-400 hover:text-red-500 transition-colors"
                            onClick={() => removeRoutePin(index)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-5">
                  <button
                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                    onClick={clearRoutePins}
                  >
                    Clear All
                  </button>
                  <button
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    onClick={() => setRoutePlanningOpen(false)}
                    disabled={routePins.length < 2}
                  >
                    Save Route
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add attribution in a cleaner way */}
      <div className="text-xs text-zinc-500 mt-2 text-right">
        Imagery &copy; <a href="https://www.esri.com/" className="hover:text-zinc-300">Esri</a>
      </div>
    </div>
  );
};

export default WeedHeatmap;