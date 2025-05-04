import React from 'react';
import { Droplet } from 'lucide-react';

interface SpraySystemProps {
  active: boolean;
  rate: number;
}

const SpraySystem: React.FC<SpraySystemProps> = ({ active, rate }) => {
  return (
    <div className="p-5 bg-zinc-900 rounded-lg border border-zinc-800 h-full flex flex-col items-center justify-center">
      <h2 className="text-lg font-medium mb-6">Active Spray System</h2>
      
      <div className="relative w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <div className="absolute w-28 h-28 rounded-full border-4 border-green-500" />
        <div className="p-6 rounded-full bg-green-500/20">
          <Droplet size={36} className="text-white" />
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium uppercase tracking-wider text-green-500">
            ACTIVELY SPRAYING
          </span>
        </div>
        <p className="text-zinc-400 text-sm">
          Current application rate: {rate} gal/acre
        </p>
      </div>
    </div>
  );
};

export default SpraySystem;