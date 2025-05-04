import React from 'react';
import WeedHeatmap from './WeedHeatmap';
import SpraySystem from './SpraySystem';
import PreviousTreatments from './PreviousTreatments';
import { Treatment } from './PreviousTreatment';
import FieldOverview from './FieldOverview';
import WeedCoverageGraph from './WeedCoverageGraph';

interface DashboardProps {
  fieldName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ fieldName }) => {
  // Generate field-specific mock data
  const getFieldSpecificData = (field: string) => {
    // Current date is May 3, 2025
    const fieldStats = {
      'Kearney': {
        lastCollectionDate: 'May 1, 2025',
        grassCoverage: 18,
        broadleafCoverage: 24,
        severity: 'medium' as const,
        latitude: '40.4213°N',
        longitude: '86.9143°W',
        sprayRate: 2.4,
        treatments: [
          {
            id: 'k1',
            chemical: 'Roundup PowerMax',
            class: 'A' as const,
            date: 'Apr 15, 2025',
            amount: '16 oz/acre',
            lat: '40.4213°N',
            long: '86.9151°W'
          },
          {
            id: 'k2',
            chemical: 'Dicamba',
            class: 'B' as const,
            date: 'Mar 22, 2025',
            amount: '8 oz/acre',
            lat: '40.4221°N',
            long: '86.9143°W'
          },
          {
            id: 'k3',
            chemical: 'Atrazine',
            class: 'C' as const,
            date: 'Feb 05, 2025',
            amount: '1.5 qt/acre',
            lat: '40.4209°N',
            long: '86.9138°W'
          }
        ],
        coverageHistory: [
          { date: 'Jan 15, 2025', timestamp: 1737028800000, grassCoverage: 6, broadleafCoverage: 8 },
          { date: 'Feb 12, 2025', timestamp: 1739793600000, grassCoverage: 8, broadleafCoverage: 12 },
          { date: 'Mar 5, 2025', timestamp: 1741867200000, grassCoverage: 10, broadleafCoverage: 15 },
          { date: 'Mar 25, 2025', timestamp: 1743589200000, grassCoverage: 14, broadleafCoverage: 18 },
          { date: 'Apr 12, 2025', timestamp: 1744971600000, grassCoverage: 16, broadleafCoverage: 22 },
          { date: 'May 1, 2025', timestamp: 1746612000000, grassCoverage: 18, broadleafCoverage: 24 }
        ]
      },
      'Olive': {
        lastCollectionDate: 'Apr 29, 2025',
        grassCoverage: 12,
        broadleafCoverage: 36,
        severity: 'high' as const,
        latitude: '40.3856°N',
        longitude: '86.8723°W',
        sprayRate: 3.1,
        treatments: [
          {
            id: 'o1',
            chemical: 'Liberty',
            class: 'C' as const,
            date: 'Apr 27, 2025',
            amount: '32 oz/acre',
            lat: '40.3852°N',
            long: '86.8726°W'
          },
          {
            id: 'o2',
            chemical: '2,4-D Amine',
            class: 'B' as const,
            date: 'Mar 08, 2025',
            amount: '1 pt/acre',
            lat: '40.3859°N',
            long: '86.8720°W'
          },
          {
            id: 'o3',
            chemical: 'Prowl H2O',
            class: 'A' as const,
            date: 'Feb 18, 2025',
            amount: '2 pt/acre',
            lat: '40.3847°N',
            long: '86.8731°W'
          },
          {
            id: 'o4',
            chemical: 'Callisto',
            class: 'B' as const,
            date: 'Jan 12, 2025',
            amount: '3 oz/acre',
            lat: '40.3862°N',
            long: '86.8712°W'
          }
        ],
        coverageHistory: [
          { date: 'Jan 10, 2025', timestamp: 1736597600000, grassCoverage: 4, broadleafCoverage: 15 },
          { date: 'Feb 8, 2025', timestamp: 1739448000000, grassCoverage: 5, broadleafCoverage: 18 },
          { date: 'Mar 2, 2025', timestamp: 1741608000000, grassCoverage: 7, broadleafCoverage: 24 },
          { date: 'Mar 20, 2025', timestamp: 1743156000000, grassCoverage: 8, broadleafCoverage: 27 },
          { date: 'Apr 10, 2025', timestamp: 1744798800000, grassCoverage: 10, broadleafCoverage: 32 },
          { date: 'Apr 29, 2025', timestamp: 1746439200000, grassCoverage: 12, broadleafCoverage: 36 }
        ]
      },
      'West Barn': {
        lastCollectionDate: 'Apr 25, 2025',
        grassCoverage: 25,
        broadleafCoverage: 9,
        severity: 'low' as const,
        latitude: '40.4052°N',
        longitude: '86.9367°W',
        sprayRate: 1.8,
        treatments: [
          {
            id: 'w1',
            chemical: 'Outlook',
            class: 'A' as const,
            date: 'Apr 22, 2025',
            amount: '14 oz/acre',
            lat: '40.4048°N',
            long: '86.9362°W'
          },
          {
            id: 'w2',
            chemical: 'Dual II Magnum',
            class: 'A' as const,
            date: 'Mar 14, 2025',
            amount: '1.5 pt/acre',
            lat: '40.4057°N',
            long: '86.9372°W'
          }
        ],
        coverageHistory: [
          { date: 'Jan 20, 2025', timestamp: 1737460800000, grassCoverage: 10, broadleafCoverage: 3 },
          { date: 'Feb 17, 2025', timestamp: 1740225600000, grassCoverage: 14, broadleafCoverage: 4 },
          { date: 'Mar 12, 2025', timestamp: 1742472000000, grassCoverage: 18, broadleafCoverage: 5 },
          { date: 'Mar 30, 2025', timestamp: 1744021200000, grassCoverage: 21, broadleafCoverage: 7 },
          { date: 'Apr 15, 2025', timestamp: 1745230800000, grassCoverage: 23, broadleafCoverage: 8 },
          { date: 'Apr 25, 2025', timestamp: 1746094800000, grassCoverage: 25, broadleafCoverage: 9 }
        ]
      }
    };

    return fieldStats[field as keyof typeof fieldStats] || fieldStats.Kearney;
  };

  const fieldData = getFieldSpecificData(fieldName);

  return (
    <div className="flex flex-col gap-6">
      <FieldOverview 
        fieldName={fieldName}
        lastCollectionDate={fieldData.lastCollectionDate}
        grassCoverage={fieldData.grassCoverage}
        broadleafCoverage={fieldData.broadleafCoverage}
        severity={fieldData.severity}
        latitude={fieldData.latitude}
        longitude={fieldData.longitude}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeedHeatmap fieldName={fieldName} />
        </div>
        <div className="lg:col-span-1">
          <PreviousTreatments treatments={fieldData.treatments as Treatment[]} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeedCoverageGraph 
            fieldName={fieldName}
            data={fieldData.coverageHistory}
          />
        </div>
        <div className="lg:col-span-1">
          <SpraySystem active={true} rate={fieldData.sprayRate} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;