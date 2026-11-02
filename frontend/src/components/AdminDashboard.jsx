import React, { useState, useEffect, useRef } from 'react';
import { dashboardApi, requestApi } from '../api/client';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Radio, 
  RefreshCw, 
  Layers, 
  TrendingUp,
  FileText,
  ShieldAlert,
  ArrowRight,
  MapPin,
  ExternalLink,
  Flame,
  Droplets,
  Globe,
  Volume2,
  VolumeX,
  Phone
} from 'lucide-react';

function playAdminAlertBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export default function AdminDashboard({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [activeSosList, setActiveSosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevSosCount = useRef(0);

  const fetchStatsAndSos = async () => {
    try {
      const [statsData, sosData] = await Promise.all([
        dashboardApi.getStats().catch(() => null),
        requestApi.getActiveSos().catch(() => null)
      ]);

      if (statsData && statsData.statistics) {
        setStats(statsData.statistics);
      }

      if (sosData && Array.isArray(sosData.sosRequests)) {
        if (soundEnabled && sosData.sosRequests.length > prevSosCount.current) {
          playAdminAlertBeep();
        }
        prevSosCount.current = sosData.sosRequests.length;
        setActiveSosList(sosData.sosRequests);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndSos();
    // 5-second polling interval for real-time SOS reception
    const interval = setInterval(fetchStatsAndSos, 5000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const totalRequests = stats?.totalRequests || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Operations Command Center</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            System-wide telemetry, emergency request triage, and volunteer mobilization metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio sirens" : "Enable audio sirens"}
          >
            {soundEnabled ? <Volume2 size={14} style={{ color: '#38bdf8' }} /> : <VolumeX size={14} />}
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onNavigateTab('admin_requests')}
          >
            <FileText size={15} /> Dispatch Center
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => onNavigateTab('admin_alerts')}
          >
            <ShieldAlert size={15} /> Disaster Alerts
          </button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={fetchStatsAndSos}
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.85rem 1rem',
          background: 'var(--critical-bg)',
          border: '1px solid var(--critical-border)',
          borderRadius: 'var(--radius-md)',
          color: '#fca5a5'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Live Emergency SOS Beacons Banner */}
      {activeSosList.length > 0 && (
        <div 
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 0 15px #ef4444'
                }}
              >
                <Radio size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                  🚨 CRITICAL DISTRESS SIGNALS: {activeSosList.length} Active SOS Beacon{activeSosList.length > 1 ? 's' : ''}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5' }}>
                  Affected individuals currently in high-risk zones requiring emergency dispatch
                </p>
              </div>
            </div>

            <button 
              className="btn btn-danger btn-sm"
              onClick={() => onNavigateTab('admin_requests')}
            >
              Open Dispatch Queue &rarr;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {activeSosList.map((sos) => {
              const isWater = sos.sosType === 'water';
              const isEarth = sos.sosType === 'earth';
              const isFire = sos.sosType === 'fire';

              return (
                <div 
                  key={sos._id}
                  style={{
                    backgroundColor: '#1f293d',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: isWater ? 'rgba(2, 132, 199, 0.25)' : isEarth ? 'rgba(217, 119, 6, 0.25)' : 'rgba(220, 38, 38, 0.25)',
                          color: isWater ? '#38bdf8' : isEarth ? '#fbbf24' : '#f87171',
                          border: `1px solid ${isWater ? '#0284c7' : isEarth ? '#d97706' : '#dc2626'}`
                        }}
                      >
                        {isWater && <Droplets size={14} />}
                        {isEarth && <Globe size={14} />}
                        {isFire && <Flame size={14} />}
                        {sos.sosSymbol || (sos.sosType ? sos.sosType.toUpperCase() : 'EMERGENCY')}
                      </span>

                      <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                        {sos.status}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {sos.requesterName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={13} /> {sos.contactNumber}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <MapPin size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      {sos.location?.address} 
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        [{sos.location?.latitude?.toFixed(5)}, {sos.location?.longitude?.toFixed(5)}]
                      </span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <a
                      href={`https://www.google.com/maps?q=${sos.location?.latitude},${sos.location?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.75rem' }}
                    >
                      <MapPin size={13} /> Open Map <ExternalLink size={11} />
                    </a>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                      onClick={() => onNavigateTab('admin_requests')}
                    >
                      Dispatch Help
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {/* Active SOS Beacons Metric */}
        <div 
          className="glass-card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            border: (activeSosList.length > 0 || (stats?.activeSosCount || 0) > 0) ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
            backgroundColor: (activeSosList.length > 0 || (stats?.activeSosCount || 0) > 0) ? 'rgba(239, 68, 68, 0.08)' : undefined
          }}
        >
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(220, 38, 38, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <ShieldAlert size={24} className={activeSosList.length > 0 ? "animate-pulse" : ""} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (activeSosList.length > 0 || (stats?.activeSosCount || 0) > 0) ? '#ef4444' : undefined }}>
              {activeSosList.length || stats?.activeSosCount || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active SOS Beacons</div>
          </div>
        </div>

        {/* Total Requests */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(37, 99, 235, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.totalRequests ?? '...'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Requests Logged</div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.pendingRequests ?? '...'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Triage / Review</div>
          </div>
        </div>

        {/* Resolved Requests */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.resolvedRequests ?? '...'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missions Resolved</div>
          </div>
        </div>

        {/* Active Volunteers */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc'
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.totalVolunteers ?? '...'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Volunteers</div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.activeAlerts ?? '...'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Broadcast Alerts</div>
          </div>
        </div>
      </div>

      {/* Breakdowns: Requests by Category and Requests by Status */}
      <div className="grid-2">
        {/* Category Distribution */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Requests by Assistance Type</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggregate counts</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.isArray(stats?.requestsByType) && stats.requestsByType.length > 0 ? (
              stats.requestsByType.map((item) => {
                const percentage = totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
                return (
                  <div key={item._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>{item._id || 'Unspecified'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count} ({percentage}%)</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categorized requests recorded yet.</p>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Requests by Lifecycle Status</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pipeline status</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.isArray(stats?.requestsByStatus) && stats.requestsByStatus.length > 0 ? (
              stats.requestsByStatus.map((item) => {
                const percentage = totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
                const statusColor = 
                  item._id === 'Resolved' ? '#10b981' :
                  item._id === 'In Progress' ? '#f97316' :
                  item._id === 'Assigned' ? '#6366f1' :
                  item._id === 'Verified' ? '#a855f7' :
                  item._id === 'Under Review' ? '#fbbf24' : '#38bdf8';

                return (
                  <div key={item._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, color: statusColor }}>{item._id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count} ({percentage}%)</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: statusColor,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No status entries recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '2rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Ready to coordinate assistance?</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Open the Dispatch Center to assign available volunteers or issue new disaster warning broadcasts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigateTab('admin_requests')}
          >
            Manage Dispatch <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
