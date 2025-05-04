import React from 'react';

const DataView: React.FC = () => {
  // Dummy GPS data
  const gpsData = {
    latitude: "40°25'13.3\"N",
    longitude: "86°54'22.1\"W",
    altitude: "285 ft",
    speed: "4.2 mph",
    heading: "Northeast"
  };

  // Dummy classification results
  const classificationItems = [
    { id: 1, timestamp: "10:45:32", species: "Palmer Amaranth", confidence: 96.5 },
    { id: 2, timestamp: "10:45:28", species: "Waterhemp", confidence: 88.2 },
    { id: 3, timestamp: "10:45:15", species: "Giant Ragweed", confidence: 92.7 },
    { id: 4, timestamp: "10:45:04", species: "Horseweed", confidence: 85.9 },
    { id: 5, timestamp: "10:44:57", species: "Palmer Amaranth", confidence: 91.3 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-medium">Live Data Feed</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GPS Data Card */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">GPS Location</h3>
          <div className="space-y-2">
            {Object.entries(gpsData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-zinc-400 capitalize">{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Live Classification Feed */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-medium mb-4">Classification Feed</h3>
          <div className="space-y-2">
            {classificationItems.map((item) => (
              <div key={item.id} className="flex items-center bg-zinc-950 p-3 rounded-md border border-zinc-800">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{item.species}</span>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">{item.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-green-500">{item.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataView;