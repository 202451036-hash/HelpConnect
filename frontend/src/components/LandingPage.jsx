import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../api/client';
import { 
  AlertTriangle, 
  HeartHandshake, 
  ShieldCheck, 
  Radio, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Flame,
  Droplets,
  HeartPulse,
  Tent,
  Users
} from 'lucide-react';

export default function LandingPage({ onOpenAuth, onNavigateTab }) {
  const { user, isAuthenticated } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await alertApi.getActive();
        if (Array.isArray(data)) {
          setActiveAlerts(data);
        }
      } catch (err) {
        // Silently ignore if unauthenticated or network empty
      }
    };
    fetchAlerts();
  }, []);

  const handleRequestAidClick = () => {
    if (!isAuthenticated) {
      onOpenAuth('register');
    } else if (user?.role === 'affected_person') {
      onNavigateTab('new_request');
    } else {
      onNavigateTab('admin_requests');
    }
  };

  const handleVolunteerClick = () => {
    if (!isAuthenticated) {
      onOpenAuth('register');
    } else if (user?.role === 'volunteer') {
      onNavigateTab('volunteer_tasks');
    } else {
      onNavigateTab('admin_dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '3.5rem 2rem',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
        border: '1px solid var(--border-medium)',
        overflow: 'hidden',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '1.25rem'
        }}>
          <Radio size={14} className="animate-pulse" />
          Rapid Emergency & Disaster Relief Network
        </div>

        <h1 style={{ maxWidth: '850px', margin: '0 auto 1.25rem' }}>
          Connecting Disaster Survivors with <span style={{ color: '#38bdf8' }}>Immediate Volunteer Assistance</span>
        </h1>

        <p style={{ maxWidth: '680px', margin: '0 auto 2.25rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          HelpConnect provides real-time geospatial emergency dispatch, active disaster warning broadcasts, and coordinated community response during humanitarian crises.
        </p>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-danger"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            onClick={handleRequestAidClick}
          >
            <AlertTriangle size={20} />
            Request Emergency Aid
          </button>

          <button 
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            onClick={handleVolunteerClick}
          >
            <HeartHandshake size={20} />
            Respond as Volunteer
          </button>

          {isAuthenticated && user?.role === 'admin' && (
            <button 
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              onClick={() => onNavigateTab('admin_dashboard')}
            >
              <ShieldCheck size={20} />
              Open Command Center
            </button>
          )}
        </div>
      </section>

      {/* Active Disaster Alerts Bar / Cards */}
      {activeAlerts.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h2 style={{ fontSize: '1.4rem' }}>Active Emergency Broadcasts</h2>
            <span className="badge badge-critical" style={{ marginLeft: '0.5rem' }}>
              {activeAlerts.length} Critical Event{activeAlerts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid-3">
            {activeAlerts.map((alert) => (
              <div 
                key={alert._id} 
                className="glass-card" 
                style={{
                  borderLeft: `4px solid ${
                    alert.severity === 'Critical' ? '#ef4444' : 
                    alert.severity === 'High' ? '#f97316' : 
                    alert.severity === 'Medium' ? '#f59e0b' : '#10b981'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className={`badge badge-${alert.severity?.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: '#fff' }}>
                  {alert.title}
                </h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  {alert.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <MapPin size={14} style={{ color: '#38bdf8' }} />
                  <span>{alert.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Emergency Assistance Categories */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Supported Emergency Categories</h2>
          <p>Direct assistance requests dispatched according to urgency and location.</p>
        </div>

        <div className="grid-3">
          {[
            { icon: Droplets, title: 'Clean Water & Supplies', color: '#38bdf8', desc: 'Potable water packs, water purification kits, and essential emergency supplies.' },
            { icon: HeartPulse, title: 'Medical Aid & First Aid', color: '#ef4444', desc: 'Critical medical treatment, prescription refills, bandage kits, and trauma aid.' },
            { icon: Tent, title: 'Temporary Shelter', color: '#f59e0b', desc: 'Safe shelter evacuation, blankets, tarps, and emergency temporary housing.' },
            { icon: Flame, title: 'Food Rations & Nutrition', color: '#f97316', desc: 'Emergency food baskets, ready-to-eat dry rations, infant formula and nutrition.' },
            { icon: Navigation, title: 'Search & Rapid Rescue', color: '#c084fc', desc: 'High-urgency rescue dispatch for stranded individuals and trapped victims.' },
            { icon: Users, title: 'Clothing & Comfort Kits', color: '#34d399', desc: 'Weather-appropriate warm clothing, footwear, and hygiene kits for displaced families.' },
          ].map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: `rgba(${cat.color === '#ef4444' ? '239, 68, 68' : '56, 189, 248'}, 0.15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: cat.color
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.1rem' }}>{cat.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Operational Workflow Steps */}
      <section style={{
        background: 'var(--bg-secondary)',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>How HelpConnect Operates</h2>
          <p>Transparent lifecycle from emergency submission to verified resolution.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', title: 'Submit Request', desc: 'Affected individuals report needs with address and auto-detected GPS coordinates.' },
            { step: '02', title: 'Triage & Verification', desc: 'Admins verify information, assess urgency levels (Low to Critical), and assign teams.' },
            { step: '03', title: 'Volunteer Dispatch', desc: 'Nearby volunteers locate emergencies via radar (1–100 km) and accept missions.' },
            { step: '04', title: 'Verified Resolution', desc: 'Volunteers execute delivery, advance status, and log timestamped proof of completion.' }
          ].map((item, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'rgba(56, 189, 248, 0.2)',
                lineHeight: 1,
                marginBottom: '0.5rem'
              }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: '#fff' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
