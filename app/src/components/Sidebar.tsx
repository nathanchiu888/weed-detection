import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import ActionItem from './ActionItem';

const Sidebar: React.FC = () => {
  const actionItems = [
    {
      id: 1,
      title: 'Switch to Group 14 Herbicides',
      description: 'Based on resistance patterns, rotate to PP inhibitors',
      effectiveness: 86,
      urgency: 'Immediate',
    },
    {
      id: 2,
      title: 'Increase Application Rate',
      description: 'Current application rate insufficient for density',
      effectiveness: 78,
      urgency: 'Immediate',
    },
    {
      id: 3,
      title: 'Cover Crop Implementation',
      description: 'Plant cereal rye cover crop in South Field to suppress weeds',
      effectiveness: 72,
      urgency: 'Next season',
    },
    {
      id: 4,
      title: 'Precision Spot Treatment',
      description: 'Use targeted spot treatment in high-infestation areas',
      effectiveness: 92,
      urgency: '2-3 days',
    },
  ];

  return (
     <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col font-inter">
      <div className="p-6">
        <h1 className="text-2xl font-medium">
          <span className="font-bold text-green-500">Weed</span>Watcher
        </h1>
      </div>
      <div className="flex items-center gap-2 p-4 text-amber-500 mx-2 mb-4">
        <AlertTriangle size={20} />
        <h2 className="font-medium">Action Items</h2>
      </div>
      <div className="flex-1 overflow-auto px-2">
        {actionItems.map((item) => (
          <ActionItem key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;