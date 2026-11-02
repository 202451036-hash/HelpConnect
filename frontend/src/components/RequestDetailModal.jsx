import React from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  Flame,
  Droplets,
  HeartPulse,
  Tent,
  Navigation,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function RequestDetailModal({ request, onClose }) {
  if (!request) return null;

  const getStatusClass = (status) => {
    return status ? status.replace(' ', '_') : 'Submitted';
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  const mapUrl = `https://www.google.com/maps?q=${request.location?.latitude},${request.location?.longitude}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`status-badge ${getStatusClass(request.status)}`}>
                {request.status}
              </span>
              <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
                {request.urgency} Urgency
              </span>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                {request.assistanceType}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem' }}>Request Details</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ID: {request._id}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Situation Description */}
          <div style={{
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Situation Summary
            </h4>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {request.description}
            </p>
          </div>

          {/* Requester & Location Information */}
          <div className="grid-2">
            <div style={{
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Contact Information
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <User size={16} style={{ color: '#38bdf8' }} />
                <span style={{ fontWeight: 600 }}>{request.requesterName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: '#34d399' }} />
                <a href={`tel:${request.contactNumber}`} style={{ color: '#34d399', fontWeight: 600 }}>
                  {request.contactNumber}
                </a>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Location Coordinates
              </h4>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPin size={16} style={{ color: '#f87171', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem' }}>{request.location?.address}</span>
              </div>
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
                <span>View on Map ({request.location?.latitude}, {request.location?.longitude})</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Assigned Volunteer */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Assigned Responder:
            </span>
            <span style={{ fontWeight: 600, color: request.assignedTo ? '#38bdf8' : 'var(--text-muted)' }}>
              {request.assignedTo ? (request.assignedTo.name || 'Volunteer Assigned') : 'Awaiting Volunteer Assignment'}
            </span>
          </div>

          {/* Status History Timeline */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} style={{ color: '#38bdf8' }} />
              Status Tracking Timeline
            </h4>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingLeft: '1.25rem',
              borderLeft: '2px solid rgba(56, 189, 248, 0.25)',
              position: 'relative'
            }}>
              {Array.isArray(request.statusHistory) && request.statusHistory.length > 0 ? (
                request.statusHistory.map((item, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    {/* Dot on timeline */}
                    <div style={{
                      position: 'absolute',
                      left: '-1.625rem',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span className={`status-badge ${getStatusClass(item.status)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}>
                        {item.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.changedAt).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Updated by user ID: {typeof item.changedBy === 'object' ? item.changedBy?.name || item.changedBy?._id : item.changedBy}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Initial submission registered on {new Date(request.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
