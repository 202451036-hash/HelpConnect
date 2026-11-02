import React, { useState, useEffect } from 'react';
import { requestApi, authApi } from '../api/client';
import RequestDetailModal from './RequestDetailModal';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  UserPlus, 
  Edit3, 
  Eye, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  X,
  Radio,
  ExternalLink,
  Flame,
  Droplets,
  Globe,
  MessageSquare,
  Smartphone,
  Send,
  Check
} from 'lucide-react';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSosFilter, setIsSosFilter] = useState(false);

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignModalReq, setAssignModalReq] = useState(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [statusModalReq, setStatusModalReq] = useState(null);
  const [newStatus, setNewStatus] = useState('Verified');
  const [actionLoading, setActionLoading] = useState(false);

  // Offline SMS Ingestion Modal State
  const [smsIngestModal, setSmsIngestModal] = useState(false);
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [parsedSms, setParsedSms] = useState(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState('');

  // Live Decoder for Offline SMS
  const decodeSmsPreview = (text) => {
    if (!text || !text.trim()) return null;
    const raw = text.trim();

    let sosType = 'water';
    let latitude = null;
    let longitude = null;
    let requesterName = 'Survivor (SMS)';
    let contactNumber = 'Unknown Contact (SMS)';
    let notes = '';

    // 1. Compact format: HC#SOS#[TYPE]#[LAT],[LNG]#[NAME]#[PHONE]#[NOTES]
    const compactMatch = raw.match(/HC#SOS#([A-Za-z]+)#([-+]?[0-9]*\.?[0-9]+)[,\s]+([-+]?[0-9]*\.?[0-9]+)(?:#([^#\n]+))?(?:#([^#\n]+))?(?:#([^#\n]+))?/i);
    if (compactMatch) {
      const rawType = compactMatch[1].toLowerCase();
      if (rawType.includes('water') || rawType.includes('flood')) sosType = 'water';
      else if (rawType.includes('earth') || rawType.includes('quake') || rawType.includes('collapse')) sosType = 'earth';
      else if (rawType.includes('fire') || rawType.includes('blaze')) sosType = 'fire';

      latitude = parseFloat(compactMatch[2]);
      longitude = parseFloat(compactMatch[3]);
      if (compactMatch[4]) requesterName = compactMatch[4].trim();
      if (compactMatch[5]) contactNumber = compactMatch[5].trim();
      if (compactMatch[6]) notes = compactMatch[6].trim();

      return { sosType, latitude, longitude, requesterName, contactNumber, notes, isCompact: true };
    }

    // 2. Unstructured or text format
    const lower = raw.toLowerCase();
    if (lower.includes('fire') || lower.includes('blaze')) sosType = 'fire';
    else if (lower.includes('earth') || lower.includes('quake') || lower.includes('collapse')) sosType = 'earth';
    else if (lower.includes('water') || lower.includes('flood') || lower.includes('drown')) sosType = 'water';

    const coordRegex = /(?:maps\.google\.com\/\?q=|gps[:\s]*|loc[:\s]*|coordinates[:\s]*)?([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/i;
    const match = raw.match(coordRegex);
    if (match) {
      latitude = parseFloat(match[1]);
      longitude = parseFloat(match[2]);
    }

    const nameMatch = raw.match(/(?:name|victim|from)[:\s]+([^\n,]+)/i);
    if (nameMatch) requesterName = nameMatch[1].trim();

    const phoneMatch = raw.match(/(?:phone|contact|tel|mobile)[:\s]+([0-9+\s\-()]{7,20})/i);
    if (phoneMatch) contactNumber = phoneMatch[1].trim();

    return { sosType, latitude: latitude || 23.2156, longitude: longitude || 72.6369, requesterName, contactNumber, notes: raw, isCompact: false };
  };

  useEffect(() => {
    setParsedSms(decodeSmsPreview(rawSmsInput));
  }, [rawSmsInput]);

  const handleIngestSms = async (e) => {
    e.preventDefault();
    if (!rawSmsInput.trim()) return;

    setIngestLoading(true);
    setIngestError('');
    try {
      const res = await requestApi.ingestSms({
        rawSmsText: rawSmsInput,
        ...(parsedSms || {})
      });

      if (res && res.success) {
        setNotification('Offline SMS Beacon successfully decoded and imported as Critical SOS ticket!');
        setSmsIngestModal(false);
        setRawSmsInput('');
        setParsedSms(null);
        await fetchRequests(1);
      }
    } catch (err) {
      setIngestError(err.message || 'Failed to ingest offline SMS beacon');
    } finally {
      setIngestLoading(false);
    }
  };

  const fetchRequests = async (page = 1, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const data = await requestApi.getAll({
        page,
        limit: pagination.limit,
        status: statusFilter,
        assistanceType: categoryFilter,
        search: searchQuery,
        isSos: isSosFilter ? true : undefined
      });

      if (data && data.requests) {
        setRequests(data.requests);
        setPagination(data.pagination || { page, limit: 10, totalPages: 1, totalRequests: data.requests.length });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assistance requests');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await authApi.getVolunteers();
      if (res && res.volunteers) {
        setVolunteers(res.volunteers);
        if (res.volunteers.length > 0) {
          setSelectedVolunteerId(res.volunteers[0]._id);
        }
      }
    } catch (err) {
      console.warn('Failed to load volunteers for assignment dropdown:', err.message);
    }
  };

  useEffect(() => {
    fetchRequests(1);
    fetchVolunteers();
  }, [statusFilter, categoryFilter, isSosFilter]);

  // Periodic polling for incoming SOS requests
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRequests(pagination.page, false);
    }, 7000);
    return () => clearInterval(timer);
  }, [statusFilter, categoryFilter, isSosFilter, searchQuery, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests(1);
  };

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    if (!assignModalReq || !selectedVolunteerId) return;

    setActionLoading(true);
    setError('');
    setNotification('');
    try {
      await requestApi.assignVolunteer(assignModalReq._id, selectedVolunteerId);
      setNotification('Volunteer assigned successfully! Request status set to "Assigned".');
      setAssignModalReq(null);
      await fetchRequests(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to assign volunteer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalReq || !newStatus) return;

    setActionLoading(true);
    setError('');
    setNotification('');
    try {
      await requestApi.updateStatus(statusModalReq._id, newStatus);
      setNotification(`Status updated to "${newStatus}" successfully.`);
      setStatusModalReq(null);
      await fetchRequests(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Assistance Dispatch Center</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Review, verify, and dispatch assistance requests to registered volunteer responders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline btn-sm"
            style={{ 
              borderColor: 'rgba(249, 115, 22, 0.6)', 
              color: '#fb923c', 
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              fontWeight: 600
            }}
            onClick={() => {
              setIngestError('');
              setSmsIngestModal(true);
            }}
          >
            <MessageSquare size={14} /> Ingest Inbound SMS Beacon
          </button>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => fetchRequests(pagination.page)}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
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

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search description, requester, contact..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Food">Food Rations</option>
              <option value="Water">Clean Water</option>
              <option value="Medical">Medical Aid</option>
              <option value="Shelter">Shelter</option>
              <option value="Rescue">Search & Rescue</option>
              <option value="Clothing">Clothing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">
            Filter
          </button>

          <button 
            type="button" 
            className={isSosFilter ? "btn btn-danger btn-sm" : "btn btn-outline btn-sm"}
            onClick={() => setIsSosFilter(!isSosFilter)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
          >
            <Radio size={14} className={isSosFilter ? "animate-pulse" : ""} />
            {isSosFilter ? "🚨 Showing SOS Only" : "🚨 Filter SOS Only"}
          </button>
        </form>
      </div>

      {/* Requests Master Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading dispatch requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3>No Assistance Requests Found</h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem', color: 'var(--text-secondary)' }}>
            No records matched your search query or filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((req) => (
            <div 
              key={req._id} 
              className="glass-card" 
              style={{ 
                padding: '1.25rem',
                border: req.isSos ? '2px solid rgba(239, 68, 68, 0.7)' : undefined,
                boxShadow: req.isSos ? '0 0 25px rgba(239, 68, 68, 0.25)' : undefined,
                background: req.isSos ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(22, 30, 49, 0.85) 100%)' : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {req.isSos && (
                      <span 
                        className="badge badge-critical"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          fontWeight: 800,
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                          letterSpacing: '0.02em'
                        }}
                      >
                        <Radio size={12} className="animate-pulse" />
                        SOS BEACON: {req.sosSymbol || (req.sosType ? req.sosType.toUpperCase() : 'DISTRESS')}
                      </span>
                    )}
                    {req.source === 'SMS_Beacon' && (
                      <span 
                        className="badge" 
                        style={{ 
                          background: 'rgba(249, 115, 22, 0.22)', 
                          color: '#fb923c', 
                          border: '1px solid rgba(249, 115, 22, 0.45)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700
                        }}
                      >
                        <Smartphone size={12} />
                        OFFLINE SMS BEACON
                      </span>
                    )}
                    <span className={`status-badge ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                    <span className={`badge ${getUrgencyBadge(req.urgency)}`}>
                      {req.urgency} Urgency
                    </span>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                      {req.assistanceType}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                    {req.requesterName} &bull; {req.isSos ? `${req.sosSymbol || 'Emergency SOS'} Beacon` : `${req.assistanceType} Request`}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Created: {new Date(req.createdAt).toLocaleString()}
                  </span>
                  <div style={{ fontSize: '0.8rem', color: req.assignedTo ? '#38bdf8' : '#fbbf24', marginTop: '0.2rem', fontWeight: 600 }}>
                    {req.assignedTo ? `Assigned to: ${req.assignedTo.name || 'Volunteer'}` : 'Unassigned'}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {req.description}
              </p>

              <div className="grid-2" style={{ marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <MapPin size={15} style={{ color: '#f87171', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.location?.address} ({req.location?.latitude?.toFixed(4)}, {req.location?.longitude?.toFixed(4)})
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${req.location?.latitude},${req.location?.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'underline', fontSize: '0.8rem', marginLeft: '0.5rem', whiteSpace: 'nowrap' }}
                  >
                    Open Map <ExternalLink size={12} />
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Phone size={15} style={{ color: '#34d399', flexShrink: 0 }} />
                  <a href={`tel:${req.contactNumber}`} style={{ color: '#34d399', fontWeight: 600 }}>
                    {req.contactNumber}
                  </a>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedRequest(req)}
                >
                  <Eye size={14} /> View Audit Timeline
                </button>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setAssignModalReq(req);
                      if (volunteers.length > 0 && !selectedVolunteerId) {
                        setSelectedVolunteerId(volunteers[0]._id);
                      }
                    }}
                  >
                    <UserPlus size={14} /> Assign Volunteer
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setStatusModalReq(req);
                      setNewStatus(req.status);
                    }}
                  >
                    <Edit3 size={14} /> Update Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchRequests(pagination.page - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalRequests} total requests)
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchRequests(pagination.page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Assign Volunteer Modal */}
      {assignModalReq && (
        <div className="modal-overlay" onClick={() => setAssignModalReq(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Assign Volunteer Responder</h3>
              <button
                onClick={() => setAssignModalReq(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              Assigning request for <strong>{assignModalReq.requesterName}</strong> ({assignModalReq.assistanceType}). Status will automatically transition to <code>Assigned</code>.
            </p>

            <form onSubmit={handleAssignVolunteer}>
              <div className="form-group">
                <label className="form-label">Select Registered Volunteer</label>
                {volunteers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--critical)' }}>
                    No registered volunteers available in database. Create a volunteer account first.
                  </p>
                ) : (
                  <select
                    className="form-select"
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                  >
                    {volunteers.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAssignModalReq(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading || volunteers.length === 0}
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalReq && (
        <div className="modal-overlay" onClick={() => setStatusModalReq(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Update Request Status</h3>
              <button
                onClick={() => setStatusModalReq(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setStatusModalReq(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating...' : 'Save Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offline SMS Beacon Ingest Modal */}
      {smsIngestModal && (
        <div className="modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget && !ingestLoading) setSmsIngestModal(false);
        }}>
          <div className="modal-content" style={{ maxWidth: '600px', border: '2px solid rgba(249, 115, 22, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(249, 115, 22, 0.2)', 
                  border: '1px solid #f97316', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#fb923c' 
                }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                    Ingest Offline SMS Beacon
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#fed7aa' }}>
                    Decode incoming cellular emergency SMS received during telecom blackouts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSmsIngestModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {ingestError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {ingestError}
              </div>
            )}

            <form onSubmit={handleIngestSms} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Quick Sample Fill Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Quick Fill Test Samples:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setRawSmsInput('HC#SOS#WATER#23.21560,72.63690#Rahul Sharma#+919876543210#Trapped on roof, water 5ft rising')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.4rem',
                      border: '1px solid #0284c7',
                      background: 'rgba(2, 132, 199, 0.15)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    💧 Sample Flood SMS
                  </button>

                  <button
                    type="button"
                    onClick={() => setRawSmsInput('HC#SOS#EARTH#23.22010,72.64120#Anita Patel#+919823456789#Collapsed stairwell, 2 elderly injured')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.4rem',
                      border: '1px solid #d97706',
                      background: 'rgba(217, 119, 6, 0.15)',
                      color: '#fbbf24',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🌍 Sample Earthquake SMS
                  </button>

                  <button
                    type="button"
                    onClick={() => setRawSmsInput('HC#SOS#FIRE#23.21850,72.63910#Vikram Desai#+919812345678#Heavy smoke cut off exit route')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.4rem',
                      border: '1px solid #dc2626',
                      background: 'rgba(220, 38, 38, 0.15)',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔥 Sample Fire SMS
                  </button>
                </div>
              </div>

              {/* Textarea for SMS Payload */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Raw SMS Payload / Received Text <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.4 }}
                  placeholder="Paste SMS string e.g. HC#SOS#WATER#23.21560,72.63690#Rahul Sharma#+919876543210 or plain text with GPS..."
                  value={rawSmsInput}
                  onChange={(e) => setRawSmsInput(e.target.value)}
                  required
                />
              </div>

              {/* Real-time Decoder Preview */}
              {parsedSms && (
                <div 
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    borderRadius: '0.65rem',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fb923c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Check size={14} /> LIVE DECODER TELEMETRY
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Format: {parsedSms.isCompact ? 'Compact Payload Code' : 'Text Template'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div><strong>Category:</strong> {parsedSms.sosType.toUpperCase()}</div>
                    <div><strong>Victim:</strong> {parsedSms.requesterName}</div>
                    <div><strong>Phone:</strong> {parsedSms.contactNumber}</div>
                    <div><strong>GPS:</strong> {parsedSms.latitude.toFixed(5)}°, {parsedSms.longitude.toFixed(5)}°</div>
                  </div>

                  <div style={{ marginTop: '0.25rem' }}>
                    <a
                      href={`https://www.google.com/maps?q=${parsedSms.latitude},${parsedSms.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38bdf8', fontSize: '0.78rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <MapPin size={13} /> Verify Coordinates on Google Maps <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSmsIngestModal(false)}
                  disabled={ingestLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    backgroundColor: '#ea580c',
                    borderColor: '#f97316',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700
                  }}
                  disabled={ingestLoading || !rawSmsInput.trim()}
                >
                  <Send size={14} />
                  {ingestLoading ? 'Decoding & Ingesting...' : 'Decode & Import SOS Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
