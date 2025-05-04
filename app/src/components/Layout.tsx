import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  currentView: 'dashboard' | 'data';
  setCurrentView: (view: 'dashboard' | 'data') => void;
  currentField: string;
  setCurrentField: (field: string) => void;
  fields: string[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setCurrentView,
  currentField,
  setCurrentField,
  fields
}) => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentField={currentField}
        setCurrentField={setCurrentField}
        fields={fields}
      />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;