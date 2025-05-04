import React, { useState } from 'react';
import { Maximize, RotateCcw, Info } from 'lucide-react';

const WeedHeatmap: React.FC = () => {
  // Generate a 12x12 heatmap grid with mostly low values,
  // some medium values, and a few high values
  const [heatmapData] = useState(() => {
    const grid = Array(12).fill(0).map(() => Array(12).fill(0));
    
    // Fill with mostly low values (1)
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        grid[i][j] = 1; // low concentration (green)
      }
    }
    
    // Add some medium values (2)
    grid[5][8] = 2; // medium concentration (yellow)
    grid[9][5] = 2; // medium concentration (yellow)
    
    // Add one high value (3)
    grid[3][10] = 3; // high concentration (red)
    
    return grid;
  });

  const getColorClass = (value: number) => {
    switch (value) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case.3: return 'bg-red-500';
      default: return 'bg-gray-900';
    }
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
      
      <div className="relative">
        <div className="flex items-center justify-center">
          <div className="mr-2 -rotate-90 text-xs text-zinc-400">Field Length (m)</div>
          
          <div className="grid grid-cols-12 gap-1">
            {heatmapData.map((row, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}`}>
                {row.map((value, colIndex) => (
                  <div
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 ${getColorClass(value)} rounded-sm transition-colors hover:opacity-80`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center mt-2">
          <div className="text-xs text-zinc-400">Field Width (m)</div>
        </div>
      </div>
    </div>
  );
};

export default WeedHeatmap;