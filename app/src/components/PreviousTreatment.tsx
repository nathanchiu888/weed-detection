import React from 'react';
import { Calendar, MapPin, Droplet } from 'lucide-react';

export interface Treatment {
  id: string;
  chemical: string;
  class: 'A' | 'B' | 'C';
  date: string;
  amount: string;
  lat: string;
  long: string;
}

interface PreviousTreatmentProps {
  treatment: Treatment;
}

const PreviousTreatment: React.FC<PreviousTreatmentProps> = ({ treatment }) => {
  // Get class color based on chemical class
  const getClassColor = (chemicalClass: 'A' | 'B' | 'C') => {
    switch (chemicalClass) {
      case 'A': return 'bg-blue-600 border-blue-500';
      case 'B': return 'bg-purple-600 border-purple-500';
      case 'C': return 'bg-amber-600 border-amber-500';
      default: return 'bg-zinc-600 border-zinc-500';
    }
  };

  return (
    <div className="p-3 mb-3 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{treatment.chemical}</h3>
        <div className={`px-2 py-0.5 text-xs rounded-full ${getClassColor(treatment.class)}`}>
          Class {treatment.class}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Calendar size={14} />
          <span>{treatment.date}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Droplet size={14} />
          <span>{treatment.amount}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-zinc-400 col-span-2">
          <MapPin size={14} />
          <span className="truncate">{treatment.lat}, {treatment.long}</span>
        </div>
      </div>
    </div>
  );
};

export default PreviousTreatment;