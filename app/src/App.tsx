import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DataView from './components/DataView';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'data'>('dashboard');
  const [currentField, setCurrentField] = useState<string>('Kearney');

  // Field data could be loaded from an API in a real app
  const fields = ['Kearney', 'Olive', 'West Barn'];

  return (
    <Layout 
      currentView={currentView}
      setCurrentView={setCurrentView}
      currentField={currentField}
      setCurrentField={setCurrentField}
      fields={fields}
    >
      {currentView === 'dashboard' ? <Dashboard fieldName={currentField} /> : <DataView />}
    </Layout>
  );
}

export default App;