import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';

import NewRequestForm from './components/NewRequestForm';
import MyRequests from './components/MyRequests';
import VolunteerTasks from './components/VolunteerTasks';
import NearbyRadar from './components/NearbyRadar';
import AdminDashboard from './components/AdminDashboard';
import AdminRequests from './components/AdminRequests';
import AdminAlerts from './components/AdminAlerts';
import SosButton from './components/SosButton';

function MainApp() {
  const { user, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const openAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    // When a user logs in, guide them to their respective primary dashboard
    if (user?.role === 'affected_person') {
      setCurrentTab('my_requests');
    } else if (user?.role === 'volunteer') {
      setCurrentTab('volunteer_tasks');
    } else if (user?.role === 'admin') {
      setCurrentTab('admin_dashboard');
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        onOpenAuth={openAuth} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />

      <main className="main-content">
        {currentTab === 'home' && (
          <LandingPage 
            onOpenAuth={openAuth} 
            onNavigateTab={(tab) => setCurrentTab(tab)} 
          />
        )}

        {/* Affected Person Views */}
        {currentTab === 'my_requests' && (
          <MyRequests onNewRequest={() => setCurrentTab('new_request')} />
        )}

        {currentTab === 'new_request' && (
          <NewRequestForm 
            onSuccess={() => setCurrentTab('my_requests')} 
            onCancel={() => setCurrentTab('my_requests')} 
          />
        )}

        {/* Volunteer Views */}
        {currentTab === 'volunteer_tasks' && (
          <VolunteerTasks />
        )}

        {currentTab === 'nearby_radar' && (
          <NearbyRadar />
        )}

        {/* Admin Views */}
        {currentTab === 'admin_dashboard' && (
          <AdminDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'admin_requests' && (
          <AdminRequests />
        )}

        {currentTab === 'admin_alerts' && (
          <AdminAlerts />
        )}
      </main>

      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>HelpConnect</strong> — Open Emergency Assistance & Disaster Relief Platform
          </div>
          <div>
            Real-Time Coordination &bull; Geospatial Search &bull; Verified Dispatch
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <SosButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
