import React from 'react';
import { Calendar, Leaf, AlertCircle, MapPin } from 'lucide-react';

interface FieldOverviewProps {
  fieldName: string;
  lastCollectionDate: string;
  grassCoverage: number; // percentage
  broadleafCoverage: number; // percentage
  severity: 'low' | 'medium' | 'high';
  latitude: string;
  longitude: string;
}

const FieldOverview: React.FC<FieldOverviewProps> = ({
  fieldName,
  lastCollectionDate,
  grassCoverage,
  broadleafCoverage,
  severity,
  latitude,
  longitude,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-600 text-green-100';
      case 'medium':
        return 'bg-yellow-600 text-yellow-100';
      case 'high':
        return 'bg-red-600 text-red-100';
      default:
        return 'bg-zinc-600 text-zinc-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'Low Severity';
      case 'medium':
        return 'Medium Severity';
      case 'high':
        return 'High Severity';
      default:
        return 'Unknown Severity';
    }
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Field Name, Date and Location */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-medium mb-1">{fieldName} Field</h2>
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-zinc-400 text-sm">
              <Calendar size={16} className="mr-1" />
              Last updated: {lastCollectionDate}
            </div>
            <div className="flex items-center text-zinc-400 text-sm">
              <MapPin size={16} className="mr-1" />
              Location: {latitude}, {longitude}
            </div>
          </div>
        </div>

        {/* Weed Coverage */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Grass Coverage */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
              <div
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center"
                style={{ opacity: grassCoverage / 100 }}
              >
                <Leaf size={18} className="text-green-100" />
              </div>
            </div>
            <div>
              <h3 className="font-medium">Grass Coverage</h3>
              <div className="text-xl font-semibold">{grassCoverage}%</div>
            </div>
          </div>

          {/* Broadleaf Coverage */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
              <div
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center"
                style={{ opacity: broadleafCoverage / 100 }}
              >
                <Leaf size={18} className="text-blue-100" />
              </div>
            </div>
            <div>
              <h3 className="font-medium">Broadleaf Coverage</h3>
              <div className="text-xl font-semibold">{broadleafCoverage}%</div>
            </div>
          </div>

          {/* Severity Tag */}
          <div className="flex items-center">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${getSeverityColor(severity)}`}>
              <AlertCircle size={16} />
              {getSeverityText(severity)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldOverview;