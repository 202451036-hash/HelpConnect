import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestApi } from '../api/client';
import { 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Phone, 
  User, 
  FileText, 
  CheckCircle2, 
  Droplets, 
  HeartPulse, 
  Tent, 
  Flame, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const ASSISTANCE_TYPES = [
  { id: 'Food', label: 'Food Rations', icon: Flame, color: '#f97316' },
  { id: 'Water', label: 'Clean Water', icon: Droplets, color: '#38bdf8' },
  { id: 'Medical', label: 'Medical & First Aid', icon: HeartPulse, color: '#ef4444' },
  { id: 'Shelter', label: 'Temporary Shelter', icon: Tent, color: '#f59e0b' },
  { id: 'Rescue', label: 'Search & Rescue', icon: Navigation, color: '#c084fc' },
  { id: 'Clothing', label: 'Warm Clothing', icon: Sparkles, color: '#34d399' },
  { id: 'Other', label: 'Other Emergency', icon: AlertTriangle, color: '#94a3b8' },
];

const URGENCY_LEVELS = [
  { id: 'Low', label: 'Low', badgeClass: 'badge-low', desc: 'Can wait 24-48 hours' },
  { id: 'Medium', label: 'Medium', badgeClass: 'badge-medium', desc: 'Needed within 12-24 hours' },
  { id: 'High', label: 'High', badgeClass: 'badge-high', desc: 'Urgent need within 4-12 hours' },
  { id: 'Critical', label: 'Critical', badgeClass: 'badge-critical', desc: 'Immediate life-safety threat' },
];

export default function NewRequestForm({ onSuccess, onCancel }) {
  const { user } = useAuth();

  const [requesterName, setRequesterName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState('');
  const [assistanceType, setAssistanceType] = useState('Food');
  const [urgency, setUrgency] = useState('Medium');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(23.2156);
  const [longitude, setLongitude] = useState(72.6369);
  const [description, setDescription] = useState('');

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // GPS Coordinates detection using browser HTML5 Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(6)));
        setLongitude(Number(position.coords.longitude.toFixed(6)));
        setDetectingLocation(false);
        setLocationSuccess(true);
        if (!address) {
          setAddress(`GPS Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setDetectingLocation(false);
        setError('Could not automatically determine location. Please enter coordinates or address manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!requesterName.trim()) throw new Error('Requester name is required');
      if (!contactNumber.trim()) throw new Error('Contact number is required');
      if (!address.trim()) throw new Error('Address is required');
      if (!description.trim()) throw new Error('Detailed description is required');

      const payload = {
        requesterName: requesterName.trim(),
        contactNumber: contactNumber.trim(),
        assistanceType,
        urgency,
        description: description.trim(),
        location: {
          address: address.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude)
        }
      };

      const res = await requestApi.create(payload);
      setSuccess('Assistance request submitted successfully! Help is being mobilized.');
      
      setTimeout(() => {
        if (onSuccess) onSuccess(res.request);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to submit assistance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={onCancel}
            style={{ marginBottom: '0.75rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2>Request Emergency Assistance</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Submit an immediate relief request. Our dispatch team and nearby volunteer responders will be notified.
          </p>
        </div>
      </div>

      <div className="glass-card">
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            background: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            background: 'var(--low-bg)',
            border: '1px solid var(--low-border)',
            borderRadius: 'var(--radius-md)',
            color: '#86efac',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Contact Details */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#38bdf8' }}>
              1. Requester & Contact Information
            </h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name of Person / Family</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe or Doe Family"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                  />
                  <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Active Emergency Phone / WhatsApp</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Category & Urgency */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#38bdf8' }}>
              2. Assistance Category & Urgency
            </h3>
            
            <div className="form-group">
              <label className="form-label">Select Type of Assistance Needed</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem'
              }}>
                {ASSISTANCE_TYPES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = assistanceType === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setAssistanceType(cat.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                        border: `1.5px solid ${isSelected ? '#38bdf8' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={20} style={{ color: cat.color, margin: '0 auto 0.35rem' }} />
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                        {cat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency Level</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem'
              }}>
                {URGENCY_LEVELS.map((u) => {
                  const isSelected = urgency === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                        border: `1.5px solid ${isSelected ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span className={`badge ${u.badgeClass}`}>{u.label}</span>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                        {u.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Location Details */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#38bdf8' }}>
                3. Incident Location & Geolocation
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
              >
                <Navigation size={14} className={detectingLocation ? 'animate-spin' : ''} />
                {detectingLocation ? 'Detecting GPS...' : locationSuccess ? 'GPS Coordinates Locked' : 'Detect My GPS Location'}
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Street / Village / Landmark Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 45, Near Primary School, Riverside Colony"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Longitude (-180 to 180)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  className="form-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Situation Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#38bdf8' }}>
              4. Situation Description & Details
            </h3>
            <div className="form-group">
              <label className="form-label">Detailed Needs (number of people, medical conditions, special care)</label>
              <textarea
                required
                rows={4}
                placeholder="Describe current situation: e.g., 4 adults and 1 infant stranded on second floor due to floodwaters. Need clean drinking water, infant formula, and power bank."
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ minWidth: '180px' }}
              disabled={loading}
            >
              <AlertTriangle size={18} />
              {loading ? 'Submitting...' : 'Dispatch Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
