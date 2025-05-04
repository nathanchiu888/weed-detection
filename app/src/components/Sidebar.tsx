import React, { useState } from 'react';
import { AlertTriangle, Zap, ChevronDown, Plus, Settings, User, LogOut, Bell, HelpCircle } from 'lucide-react';
import ActionItem from './ActionItem';

interface SidebarProps {
  currentView: 'dashboard' | 'data';
  setCurrentView: (view: 'dashboard' | 'data') => void;
  currentField: string;
  setCurrentField: (field: string) => void;
  fields: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  currentField, 
  setCurrentField, 
  fields 
}) => {
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [showNewFieldInput, setShowNewFieldInput] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    // {
    //   id: 4,
    //   title: 'Precision Spot Treatment',
    //   description: 'Use targeted spot treatment in high-infestation areas',
    //   effectiveness: 92,
    //   urgency: '2-3 days',
    // },
  ];

  const handleViewChange = (view: 'dashboard' | 'data') => {
    setCurrentView(view);
    setViewDropdownOpen(false);
  };

  const handleFieldChange = (field: string) => {
    setCurrentField(field);
    setFieldDropdownOpen(false);
  };

  const handleAddField = () => {
    if (newFieldName.trim()) {
      // In a real app, this would be persisted to a database
      // fields.push(newFieldName.trim());
      setCurrentField(newFieldName.trim());
      setNewFieldName('');
      setShowNewFieldInput(false);
    }
  };

  return (
     <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col font-inter h-full min-h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-medium">
          <span className="font-bold text-green-500">Weed</span>Watcher
        </h1>
      </div>

      {/* Dropdown Menus */}
      <div className="px-4 flex flex-col gap-4 mb-6">
        {/* View Dropdown */}
        <div className="relative">
          <button 
            className="w-full p-3 bg-zinc-950 rounded-md border border-zinc-800 flex justify-between items-center"
            onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
          >
            <span>View: {currentView === 'dashboard' ? 'Dashboard' : 'Data View'}</span>
            <ChevronDown size={16} className={`transition-transform ${viewDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {viewDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden z-10">
              <button 
                className={`w-full p-3 text-left hover:bg-zinc-800 transition-colors ${currentView === 'dashboard' ? 'bg-zinc-800' : ''}`}
                onClick={() => handleViewChange('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`w-full p-3 text-left hover:bg-zinc-800 transition-colors ${currentView === 'data' ? 'bg-zinc-800' : ''}`}
                onClick={() => handleViewChange('data')}
              >
                Data View
              </button>
            </div>
          )}
        </div>
        
        {/* Field Dropdown */}
        <div className="relative">
          <button 
            className="w-full p-3 bg-zinc-950 rounded-md border border-zinc-800 flex justify-between items-center"
            onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
          >
            <span>Field: {currentField}</span>
            <ChevronDown size={16} className={`transition-transform ${fieldDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {fieldDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden z-10">
              {fields.map((field) => (
                <button 
                  key={field}
                  className={`w-full p-3 text-left hover:bg-zinc-800 transition-colors ${currentField === field ? 'bg-zinc-800' : ''}`}
                  onClick={() => handleFieldChange(field)}
                >
                  {field}
                </button>
              ))}
              {showNewFieldInput ? (
                <div className="p-2 flex">
                  <input
                    type="text"
                    className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-l-md focus:outline-none text-sm"
                    placeholder="New field name..."
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                  />
                  <button
                    className="p-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors"
                    onClick={handleAddField}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full p-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-2 text-green-500"
                  onClick={() => setShowNewFieldInput(true)}
                >
                  <Plus size={16} />
                  <span>Add Field</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Items Header - now directly after dropdowns */}
      <div className="flex items-center gap-2 p-4 text-amber-500 mx-2 mb-2">
        <AlertTriangle size={20} />
        <h2 className="font-medium">Action Items</h2>
      </div>
      
      {/* Action Items List - fills remaining space with minimum height to ensure bg extends */}
      <div className="overflow-auto px-2 pb-4 flex-1 min-h-[200px]">
        {actionItems.map((item) => (
          <ActionItem key={item.id} {...item} />
        ))}
      </div>

      {/* Settings and Profile Options */}
      <div className="border-t border-zinc-800 mt-auto">
        {/* Quick Settings Buttons */}
        <div className="flex justify-between p-3">
          <button className="p-2 rounded-md hover:bg-zinc-800 transition-colors" title="Notifications">
            <Bell size={18} className="text-zinc-400 hover:text-white transition-colors" />
          </button>
          <button className="p-2 rounded-md hover:bg-zinc-800 transition-colors" title="Settings">
            <Settings size={18} className="text-zinc-400 hover:text-white transition-colors" />
          </button>
          <button className="p-2 rounded-md hover:bg-zinc-800 transition-colors" title="Help">
            <HelpCircle size={18} className="text-zinc-400 hover:text-white transition-colors" />
          </button>
        </div>
        
        {/* User Profile */}
        <div className="relative">
          <button 
            className="flex items-center gap-3 w-full p-3 hover:bg-zinc-800 transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
              CB
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Charlie Brown</div>
              <div className="text-xs text-zinc-400">Field Technician</div>
            </div>
            <ChevronDown 
              size={16} 
              className={`ml-auto transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden z-10">
              <button className="w-full p-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-3">
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button className="w-full p-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-3 text-red-400">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;