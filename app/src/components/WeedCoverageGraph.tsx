import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DataPoint {
  date: string;
  timestamp: number; // Unix timestamp for proper sorting
  grassCoverage: number;
  broadleafCoverage: number;
}

interface WeedCoverageGraphProps {
  fieldName: string;
  data: DataPoint[];
}

const WeedCoverageGraph: React.FC<WeedCoverageGraphProps> = ({ fieldName, data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    dataPoint: DataPoint;
    type: 'grass' | 'broadleaf';
    x: number;
    y: number;
  } | null>(null);

  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  
  // Find max value for scaling
  const maxCoverage = Math.max(
    ...data.map(d => Math.max(d.grassCoverage, d.broadleafCoverage))
  );
  const roundedMaxCoverage = Math.ceil(maxCoverage / 10) * 10; // Round up to nearest 10
  
  // Graph dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Generate tick values for y-axis (0%, 20%, 40%, etc.)
  const yTicks = Array.from({ length: 6 }, (_, i) => roundedMaxCoverage * i / 5);
  
  // Generate points for the line
  const generatePathPoints = (coverageKey: 'grassCoverage' | 'broadleafCoverage') => {
    if (sortedData.length < 2) return '';
    
    return sortedData.map((point, index) => {
      const x = padding.left + (index / (sortedData.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (point[coverageKey] / roundedMaxCoverage) * graphHeight;
      
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate points for the area under the line
  const generateAreaPoints = (coverageKey: 'grassCoverage' | 'broadleafCoverage') => {
    if (sortedData.length < 2) return '';
    
    let path = sortedData.map((point, index) => {
      const x = padding.left + (index / (sortedData.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (point[coverageKey] / roundedMaxCoverage) * graphHeight;
      
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    // Add bottom right, bottom left, and back to start
    const lastX = padding.left + graphWidth;
    const firstX = padding.left;
    const bottomY = padding.top + graphHeight;
    
    path += ` L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    
    return path;
  };

  // Handle hover events
  const handleMouseOver = (
    dataPoint: DataPoint, 
    type: 'grass' | 'broadleaf', 
    index: number,
    event: React.MouseEvent
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setHoveredPoint({
      dataPoint,
      type,
      x,
      y
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="p-5 bg-zinc-900 rounded-lg border border-zinc-800 h-full">
      <h2 className="text-lg font-medium mb-2">Weed Coverage Over Time</h2>
      <div className="flex items-center gap-4 mb-4">
        {/* Legend items */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm">Grass Weeds</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm">Broadleaf Weeds</span>
        </div>
      </div>
      
      <div className="relative">
        <svg width={width} height={height} className="mx-auto">
          {/* Y-axis line */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={padding.top + graphHeight} 
            stroke="#4B5563" 
            strokeWidth="1"
          />
          
          {/* X-axis line */}
          <line 
            x1={padding.left} 
            y1={padding.top + graphHeight} 
            x2={padding.left + graphWidth} 
            y2={padding.top + graphHeight} 
            stroke="#4B5563" 
            strokeWidth="1"
          />
          
          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, i) => (
            <React.Fragment key={`y-tick-${i}`}>
              <line 
                x1={padding.left - 5} 
                y1={padding.top + graphHeight - (tick / roundedMaxCoverage) * graphHeight} 
                x2={padding.left} 
                y2={padding.top + graphHeight - (tick / roundedMaxCoverage) * graphHeight} 
                stroke="#4B5563" 
                strokeWidth="1"
              />
              <text 
                x={padding.left - 10} 
                y={padding.top + graphHeight - (tick / roundedMaxCoverage) * graphHeight} 
                textAnchor="end" 
                dominantBaseline="middle" 
                className="text-xs fill-zinc-400"
              >
                {tick}%
              </text>
              
              {/* Horizontal grid line */}
              {i > 0 && (
                <line 
                  x1={padding.left} 
                  y1={padding.top + graphHeight - (tick / roundedMaxCoverage) * graphHeight} 
                  x2={padding.left + graphWidth} 
                  y2={padding.top + graphHeight - (tick / roundedMaxCoverage) * graphHeight} 
                  stroke="#374151" 
                  strokeWidth="1" 
                  strokeDasharray="4"
                />
              )}
            </React.Fragment>
          ))}
          
          {/* X-axis labels (dates) */}
          {sortedData.map((point, i) => (
            <React.Fragment key={`x-label-${i}`}>
              {i % Math.max(1, Math.floor(sortedData.length / 5)) === 0 && (
                <>
                  <line 
                    x1={padding.left + (i / (sortedData.length - 1)) * graphWidth} 
                    y1={padding.top + graphHeight} 
                    x2={padding.left + (i / (sortedData.length - 1)) * graphWidth} 
                    y2={padding.top + graphHeight + 5} 
                    stroke="#4B5563" 
                    strokeWidth="1"
                  />
                  <text 
                    x={padding.left + (i / (sortedData.length - 1)) * graphWidth} 
                    y={padding.top + graphHeight + 20} 
                    textAnchor="middle" 
                    className="text-xs fill-zinc-400"
                  >
                    {point.date.split(',')[0]}
                  </text>
                </>
              )}
            </React.Fragment>
          ))}
          
          {/* Area under grass line */}
          <path 
            d={generateAreaPoints('grassCoverage')} 
            fill="rgb(34, 197, 94)" 
            fillOpacity="0.2" 
          />
          
          {/* Area under broadleaf line */}
          <path 
            d={generateAreaPoints('broadleafCoverage')} 
            fill="rgb(59, 130, 246)" 
            fillOpacity="0.2" 
          />
          
          {/* Grass coverage line */}
          <path 
            d={generatePathPoints('grassCoverage')} 
            stroke="#22c55e" 
            strokeWidth="2" 
            fill="none" 
          />
          
          {/* Broadleaf coverage line */}
          <path 
            d={generatePathPoints('broadleafCoverage')} 
            stroke="#3b82f6" 
            strokeWidth="2" 
            fill="none" 
          />
          
          {/* Data points with hover targets */}
          {sortedData.map((point, index) => (
            <React.Fragment key={`data-points-${index}`}>
              {/* Grass point */}
              <circle 
                cx={padding.left + (index / (sortedData.length - 1)) * graphWidth} 
                cy={padding.top + graphHeight - (point.grassCoverage / roundedMaxCoverage) * graphHeight} 
                r="4" 
                fill="#22c55e"
              />
              <circle 
                cx={padding.left + (index / (sortedData.length - 1)) * graphWidth} 
                cy={padding.top + graphHeight - (point.grassCoverage / roundedMaxCoverage) * graphHeight} 
                r="12" 
                fill="transparent"
                onMouseOver={(e) => handleMouseOver(point, 'grass', index, e)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Broadleaf point */}
              <circle 
                cx={padding.left + (index / (sortedData.length - 1)) * graphWidth} 
                cy={padding.top + graphHeight - (point.broadleafCoverage / roundedMaxCoverage) * graphHeight} 
                r="4" 
                fill="#3b82f6"
              />
              <circle 
                cx={padding.left + (index / (sortedData.length - 1)) * graphWidth} 
                cy={padding.top + graphHeight - (point.broadleafCoverage / roundedMaxCoverage) * graphHeight} 
                r="12" 
                fill="transparent"
                onMouseOver={(e) => handleMouseOver(point, 'broadleaf', index, e)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              />
            </React.Fragment>
          ))}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bg-zinc-800 border border-zinc-700 rounded-md p-3 shadow-lg z-20"
            style={{ 
              left: `${hoveredPoint.x + 10}px`, 
              top: `${hoveredPoint.y - 60}px`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} />
              <span className="font-medium">{hoveredPoint.dataPoint.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  hoveredPoint.type === 'grass' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              ></div>
              <span>
                {hoveredPoint.type === 'grass' ? 'Grass' : 'Broadleaf'}: 
                <span className="font-medium ml-1">
                  {hoveredPoint.type === 'grass' 
                    ? hoveredPoint.dataPoint.grassCoverage 
                    : hoveredPoint.dataPoint.broadleafCoverage}%
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeedCoverageGraph;