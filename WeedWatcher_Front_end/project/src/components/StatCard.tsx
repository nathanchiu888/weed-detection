import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit }) => {
  return (
    <div className="p-5 bg-zinc-900 rounded-lg border border-zinc-800 transition-transform hover:transform hover:scale-[1.01]">
      <h3 className="text-sm text-zinc-400 mb-1">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-4xl font-medium mr-2">{value}</span>
        <span className="text-sm text-zinc-400">{unit}</span>
      </div>
    </div>
  );
};

export default StatCard;