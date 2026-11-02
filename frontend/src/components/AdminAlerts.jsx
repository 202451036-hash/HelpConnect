import React, { useState, useEffect } from 'react';
import { alertApi } from '../api/client';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Plus, 
  MapPin, 
  Radio, 
  CheckCircle2, 
  RefreshCw, 
  PowerOff,
  Flame,
  Droplets,
  Wind,
  Mountain
} from 'lucide-react';

const DISASTER_TYPES = ['Flood', 'Earthquake', 'Cyclone', 'Fire', 'Landslide', 'Other'];
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Create Alert Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [disasterType, setDisasterType] = useState('Flood');
  const [severity, setSeverity] = useState('High');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [deactivatingId, setDeactivatingId] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alertApi.getActive();
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch disaster alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setError('');
    setNotification('');
    setSubmitting(true);

    try {
      if (!title.trim() || !description.trim() || !location.trim()) {
        throw new Error('Title, description, and location are required');
      }

      await alertApi.create({
        title: title.trim(),
        description: description.trim(),
        disasterType,
        severity,
        location: location.trim()
      });

      setNotification(`Disaster alert "${title}" successfully broadcasted!`);
      setTitle('');
      setDescription('');
      setLocation('');
      setShowCreateForm(false);
      await fetchAlerts();
    } catch (err) {
      setError(err.message || 'Failed to broadcast disaster alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this emergency alert? It will no longer be broadcast to users.')) {
      return;
    }

    setDeactivatingId(id);
    setError('');
    setNotification('');
    try {
      await alertApi.deactivate(id);
      setNotification('Disaster alert deactivated successfully.');
      await fetchAlerts();
    } catch (err) {
      setError(err.message || 'Failed to deactivate alert');
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Disaster Alert Broadcast Center</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Broadcast real-time emergency warnings to all affected populations and volunteer responders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn ${showCreateForm ? 'btn-secondary' : 'btn-danger'}`}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={16} />
            {showCreateForm ? 'Close Form' : 'Broadcast New Alert'}
          </button>

          <button 
            className="btn btn-outline btn-sm"
            onClick={fetchAlerts}
            title="Refresh active alerts"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.85rem 1rem',
          background: 'var(--low-bg)',
          border: '1px solid var(--low-border)',
          borderRadius: 'var(--radius-md)',
          color: '#86efac'
        }}>
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

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

      {/* New Alert Form */}
      {showCreateForm && (
        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(30, 20, 25, 0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#f87171' }}>
            <Radio size={20} className="animate-pulse" />
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>New Emergency Broadcast</h3>
          </div>

          <form onSubmit={handleCreateAlert}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Flood Warning - Low-Lying River Sector"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Location / Sector</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sector 4, River Basin, Gandhinagar"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Disaster Type</label>
                <select
                  className="form-select"
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                >
                  {DISASTER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  {SEVERITY_LEVELS.map((sev) => (
                    <option key={sev} value={sev}>{sev}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Broadcast Instructions & Guidance</label>
              <textarea
                required
                rows={3}
                placeholder="Evacuation guidance, emergency numbers, and safe assembly zones..."
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={submitting}
              >
                <Radio size={16} />
                {submitting ? 'Broadcasting...' : 'Issue Live Alert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Broadcasts List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Currently Active Alerts</span>
            <span className="badge badge-critical">{alerts.length} Active</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Broadcast across the top banner to all connected users
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading active disaster alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <ShieldAlert size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3>No Active Disaster Alerts</h3>
            <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem', color: 'var(--text-secondary)' }}>
              There are currently no active emergency alerts in the system. When a disaster strikes, broadcast an alert above.
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {alerts.map((al) => {
              const isDeactivating = deactivatingId === al._id;
              return (
                <div 
                  key={al._id} 
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${
                      al.severity === 'Critical' ? '#ef4444' : 
                      al.severity === 'High' ? '#f97316' : 
                      al.severity === 'Medium' ? '#f59e0b' : '#10b981'
                    }`
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span className={`badge badge-${al.severity?.toLowerCase()}`}>
                          {al.severity} Severity
                        </span>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                          {al.disasterType}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(al.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', color: '#fff' }}>
                      {al.title}
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                      {al.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      <MapPin size={15} style={{ color: '#38bdf8' }} />
                      <span>{al.location}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Issued by: {al.createdBy?.name || 'Command'}
                    </span>

                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#f87171' }}
                      disabled={isDeactivating}
                      onClick={() => handleDeactivate(al._id)}
                    >
                      <PowerOff size={14} />
                      {isDeactivating ? 'Deactivating...' : 'Deactivate Alert'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
