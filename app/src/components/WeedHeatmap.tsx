import React, { useState } from 'react';
import { Maximize, RotateCcw, Info, ChevronDown } from 'lucide-react';

interface HeatmapCell {
  value: number;
  lat: string;
  long: string;
  confidence: number;
}

interface HeatmapProps {
  fieldName: string;
}

const WeedHeatmap: React.FC<HeatmapProps> = ({ fieldName }) => {
  const [weedType, setWeedType] = useState<'grass' | 'broadleaf'>('grass');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  // Generate mock data for different field names and weed types
  const getMockData = (field: string, type: 'grass' | 'broadleaf') => {
    // Base coordinates for each field (these would be different for each real field)
    const baseCoords = {
      'Kearney': { lat: 40.4213, long: -86.9143 },
      'Olive': { lat: 40.3856, long: -86.8723 },
      'West Barn': { lat: 40.4052, long: -86.9367 },
    };
    
    const baseCoord = baseCoords[field as keyof typeof baseCoords] || baseCoords.Kearney;
    
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
  React.useEffect(() => {
    setHeatmapData(getMockData(fieldName, weedType));
  }, [fieldName, weedType]);

  const getColorClass = (confidence: number) => {
    if (confidence < 50) return 'bg-green-500';
    if (confidence < 85) return 'bg-yellow-500';
    return 'bg-red-500';
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
        {/* Left side - Heatmap - Larger size */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center">
            {/* <div className="mr-2 -rotate-90 text-xs text-zinc-400">Field Length (m)</div> */}
            
            {/* Increased cell size from w-6/h-6 to w-8/h-8 */}
            <div className="grid grid-cols-12 gap-1">
              {heatmapData.map((row, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={`w-8 h-8 ${getColorClass(cell.confidence)} rounded-sm transition-colors hover:opacity-80 cursor-pointer`}
                      onClick={() => setSelectedCell(cell)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* <div className="flex justify-center mt-2">
            <div className="text-xs text-zinc-400">Field Width (m)</div>
          </div> */}
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
    </div>
  );
};

export default WeedHeatmap;