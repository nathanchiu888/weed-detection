import React from 'react';
import StatCard from './StatCard';
import WeedHeatmap from './WeedHeatmap';
import WeedSpeciesTable from './WeedSpeciesTable';
import SpraySystem from './SpraySystem';

const Dashboard: React.FC = () => {
  const stats = [
    { 
      title: 'Acres Travelled', 
      value: '275', 
      unit: 'acres'
    },
    { 
      title: 'Weeds Detected', 
      value: '1842', 
      unit: 'plants'
    },
    { 
      title: 'Spray Used', 
      value: '300', 
      unit: 'ml'
    }
  ];

  const weedSpecies = [
    { name: 'Palmer Amaranth', count: 487, success: 72 },
    { name: 'Waterhemp', count: 358, success: 68 },
    { name: 'Giant Ragweed', count: 245, success: 81 },
    { name: 'Horseweed', count: 198, success: 75 }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={index} 
            title={stat.title} 
            value={stat.value} 
            unit={stat.unit} 
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeedHeatmap />
        </div>
        <div className="lg:col-span-1">
          <SpraySystem active={true} rate={2.4} />
        </div>
      </div>
      
      <WeedSpeciesTable species={weedSpecies} />
    </div>
  );
};

export default Dashboard;