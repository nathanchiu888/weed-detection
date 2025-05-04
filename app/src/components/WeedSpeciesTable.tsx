import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';

interface WeedSpecies {
  name: string;
  count: number;
  success: number;
}

interface WeedSpeciesTableProps {
  species: WeedSpecies[];
}

const WeedSpeciesTable: React.FC<WeedSpeciesTableProps> = ({ species }) => {
  const getSuccessColorClass = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-5 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Detected Weed Species</h2>
        <button className="p-1.5 rounded hover:bg-zinc-800 transition-colors">
          <Filter size={16} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left">
              <th className="pb-3 font-medium text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  Species <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="pb-3 font-medium text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  Count <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="pb-3 font-medium text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  Treatment Success <ArrowUpDown size={14} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {species.map((weed, index) => (
              <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                <td className="py-3">{weed.name}</td>
                <td className="py-3">{weed.count}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getSuccessColorClass(weed.success)}`} 
                        style={{ width: `${weed.success}%` }}
                      />
                    </div>
                    <span>{weed.success}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeedSpeciesTable;