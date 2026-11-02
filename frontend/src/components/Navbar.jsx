import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../api/client';
import { 
  AlertTriangle, 
  ShieldAlert, 
  User, 
  LogOut, 
  LogIn, 
  Activity, 
  HeartHandshake, 
  Compass, 
  FileText,
  Radio
} from 'lucide-react';

export default function Navbar({ onOpenAuth, currentTab, setCurrentTab }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertIndex, setAlertIndex] = useState(0);

  useEffect(() => {
    // Fetch active alerts for banner if authenticated
    const fetchAlerts = async () => {
      if (!isAuthenticated) return;
      try {
        const alerts = await alertApi.getActive();
        if (Array.isArray(alerts) && alerts.length > 0) {
          setActiveAlerts(alerts);
        } else {
          setActiveAlerts([]);
        }
      } catch (err) {
        // Silently handle if alerts endpoint is unreachable or empty
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000); // Check for new emergency alerts every 20s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Rotate through alerts if multiple
  useEffect(() => {
    if (activeAlerts.length <= 1) return;
    const timer = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % activeAlerts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeAlerts.length]);

  const currentAlert = activeAlerts[alertIndex];

  return (
    <>
      {/* Live Disaster Alert Ticker */}
      {currentAlert && (
        <aside className="alert-banner" role="alert" aria-live="polite">
          <AlertTriangle size={18} className="animate-pulse" style={{ color: '#ef4444' }} />
          <span>
            <strong>ACTIVE ALERT [{currentAlert.severity?.toUpperCase()}]:</strong> {currentAlert.title} — {currentAlert.location} ({currentAlert.disasterType})
          </span>
          {activeAlerts.length > 1 && (
            <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '0.5rem' }}>
              ({alertIndex + 1}/{activeAlerts.length})
            </span>
          )}
        </aside>
      )}

      {/* Main Navigation Bar */}
      <header className="navbar">
        <div className="nav-container">
          <a 
            href="#home" 
            className="brand-link" 
            onClick={(e) => { e.preventDefault(); setCurrentTab('home'); }}
          >
            <div className="brand-badge">
              <Radio size={22} />
            </div>
            <div>
              <span>Help<span style={{ color: '#38bdf8' }}>Connect</span></span>
              <span style={{ 
                display: 'block', 
                fontSize: '0.65rem', 
                fontWeight: 500, 
                color: 'var(--text-muted)',
                letterSpacing: '0.05em'
              }}>
                DISASTER RESPONSE NETWORK
              </span>
            </div>
          </a>

          {/* Navigation Links according to user role */}
          <nav className="nav-links">
            <button
              className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentTab('home')}
            >
              <Activity size={16} />
              Home
            </button>

            {isAuthenticated && user?.role === 'affected_person' && (
              <>
                <button
                  className={`nav-btn ${currentTab === 'my_requests' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('my_requests')}
                >
                  <FileText size={16} />
                  My Requests
                </button>
                <button
                  className={`nav-btn ${currentTab === 'new_request' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('new_request')}
                  style={{ color: '#f87171' }}
                >
                  <AlertTriangle size={16} />
                  Request Aid
                </button>
              </>
            )}

            {isAuthenticated && user?.role === 'volunteer' && (
              <>
                <button
                  className={`nav-btn ${currentTab === 'volunteer_tasks' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('volunteer_tasks')}
                >
                  <HeartHandshake size={16} />
                  Assigned Missions
                </button>
                <button
                  className={`nav-btn ${currentTab === 'nearby_radar' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('nearby_radar')}
                >
                  <Compass size={16} />
                  Nearby Radar
                </button>
              </>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <>
                <button
                  className={`nav-btn ${currentTab === 'admin_dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('admin_dashboard')}
                >
                  <Activity size={16} />
                  Command Dashboard
                </button>
                <button
                  className={`nav-btn ${currentTab === 'admin_requests' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('admin_requests')}
                >
                  <FileText size={16} />
                  Dispatch Center
                </button>
                <button
                  className={`nav-btn ${currentTab === 'admin_alerts' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('admin_alerts')}
                >
                  <ShieldAlert size={16} />
                  Emergency Alerts
                </button>
              </>
            )}

            {/* Auth / Profile Area */}
            {isAuthenticated ? (
              <div className="user-pill">
                <User size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</span>
                <span className={`role-tag ${user?.role}`}>
                  {user?.role?.replace('_', ' ')}
                </span>
                <button
                  onClick={logout}
                  title="Sign out"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem',
                    marginLeft: '0.25rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onOpenAuth('login')}
              >
                <LogIn size={15} />
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
