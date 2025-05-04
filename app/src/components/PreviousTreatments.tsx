import React from 'react';
import PreviousTreatment, { Treatment } from './PreviousTreatment';

interface PreviousTreatmentsProps {
  treatments: Treatment[];
}

const PreviousTreatments: React.FC<PreviousTreatmentsProps> = ({ treatments }) => {
  return (
    <div className="p-5 bg-zinc-900 rounded-lg border border-zinc-800 h-full">
      <h2 className="text-lg font-medium mb-4">Previous Treatments</h2>
      
      {treatments.length > 0 ? (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          {treatments.map((treatment) => (
            <PreviousTreatment key={treatment.id} treatment={treatment} />
          ))}
        </div>
      ) : (
        <div className="text-zinc-500 text-sm">
          No treatment history available.
        </div>
      )}
    </div>
  );
};

export default PreviousTreatments;