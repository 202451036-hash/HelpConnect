import React, { useState, useEffect } from 'react';
import { requestApi } from '../api/client';
import RequestDetailModal from './RequestDetailModal';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Phone, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Eye, 
  ExternalLink,
  Radar
} from 'lucide-react';

export default function NearbyRadar() {
  const [latitude, setLatitude] = useState(23.2156);
  const [longitude, setLongitude] = useState(72.6369);
  const [radius, setRadius] = useState(25); // km

  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchNearby = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await requestApi.getNearby({ latitude, longitude, radius });
      if (data && data.requests) {
        setNearbyRequests(data.requests);
      } else {
        setNearbyRequests([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to scan nearby emergencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [radius]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this browser');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(4)));
        setLongitude(Number(pos.coords.longitude.toFixed(4)));
        setDetecting(false);
        fetchNearby();
      },
      (err) => {
        setDetecting(false);
        setError('Could not detect GPS location. Using configured coordinates.');
      },
      { timeout: 8000 }
    );
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Nearby Emergency Radar</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Real-time geospatial scanner detecting unassigned emergencies within your operational radius.
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleDetectGPS}
          disabled={detecting}
        >
          <Navigation size={14} className={detecting ? 'animate-spin' : ''} />
          {detecting ? 'Locking GPS...' : 'Use My Live GPS Position'}
        </button>
      </div>

      {/* Radar Control Console */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', color: '#38bdf8' }}>
          <Compass size={20} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Geospatial Scan Parameters</h3>
        </div>

        <div className="grid-3" style={{ alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Center Latitude</label>
            <input
              type="number"
              step="0.0001"
              className="form-input"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Center Longitude</label>
            <input
              type="number"
              step="0.0001"
              className="form-input"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
            />
          </div>

          <div>
            <button 
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={fetchNearby}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Scanning...' : 'Scan Radar Area'}
            </button>
          </div>
        </div>

        {/* Radius Slider with Quick Presets */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Search Radius: <strong style={{ color: '#38bdf8' }}>{radius} km</strong>
            </label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[5, 15, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn btn-sm ${radius === preset ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={() => setRadius(preset)}
                >
                  {preset}km
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Error notification */}
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

      {/* Nearby Results */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Unassigned Emergencies in Range</span>
            <span className="badge badge-high">{nearbyRequests.length} Detected</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sorted by shortest distance from radar origin
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p>Scanning radius for unassigned distress signals...</p>
          </div>
        ) : nearbyRequests.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Compass size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3>No Unassigned Emergencies in Radius</h3>
            <p style={{ maxWidth: '440px', margin: '0.5rem auto 1.5rem', color: 'var(--text-secondary)' }}>
              No open requests found within {radius} km of ({latitude}, {longitude}). Try increasing the radius slider to 50 km or 100 km.
            </p>
            <button className="btn btn-secondary" onClick={() => setRadius(50)}>
              Expand Radius to 50 km
            </button>
          </div>
        ) : (
          <div className="grid-2">
            {nearbyRequests.map((req) => {
              const mapUrl = `https://www.google.com/maps?q=${req.location?.latitude},${req.location?.longitude}`;
              return (
                <div key={req._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Top Row: Distance and Urgency */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.35)',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        <Navigation size={12} />
                        {req.distanceKm} km away
                      </span>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span className={`badge ${getUrgencyBadge(req.urgency)}`}>
                          {req.urgency}
                        </span>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                          {req.assistanceType}
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: '#fff' }}>
                      {req.requesterName} &bull; {req.assistanceType}
                    </h3>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {req.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <MapPin size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.location?.address}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Phone size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                        <span>{req.contactNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8rem',
                        color: '#38bdf8'
                      }}
                    >
                      <MapPin size={14} /> Open Map <ExternalLink size={12} />
                    </a>

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <Eye size={14} /> Inspect Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
