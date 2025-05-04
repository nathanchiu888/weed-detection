import React from 'react';
import { Zap } from 'lucide-react';

interface ActionItemProps {
  title: string;
  description: string;
  effectiveness: number;
  urgency: string;
}

const ActionItem: React.FC<ActionItemProps> = ({ 
  title, 
  description, 
  effectiveness, 
  urgency 
}) => {
  const getEffectivenessColor = (value: number) => {
    if (value >= 85) return 'text-green-500';
    if (value >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="p-4 mb-3 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={16} className="text-green-500" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{description}</p>
      <div className="flex justify-between items-center">
        <div className={`text-sm ${getEffectivenessColor(effectiveness)}`}>
          <span className="font-medium">{effectiveness}%</span>
          <span className="text-xs ml-1">effective</span>
        </div>
        <div className="text-xs px-2 py-1 bg-zinc-800 rounded-full flex items-center">
          {urgency}
        </div>
      </div>
    </div>
  );
};

export default ActionItem;