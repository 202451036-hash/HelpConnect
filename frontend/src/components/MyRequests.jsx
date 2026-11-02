import React, { useState, useEffect } from 'react';
import { requestApi } from '../api/client';
import RequestDetailModal from './RequestDetailModal';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Phone, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  RefreshCw
} from 'lucide-react';

export default function MyRequests({ onNewRequest }) {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 6, totalPages: 1, totalRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected request for detail modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await requestApi.getAll({
        page,
        limit: pagination.limit,
        status: statusFilter,
        assistanceType: categoryFilter,
        search: searchQuery
      });

      if (data && data.requests) {
        setRequests(data.requests);
        setPagination(data.pagination || { page, limit: 6, totalPages: 1, totalRequests: data.requests.length });
      } else {
        setRequests([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assistance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests(1);
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
      {/* Top Header & CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>My Assistance Requests</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Track real-time status and assignment history for all your submitted emergency requests.
          </p>
        </div>

        <button className="btn btn-danger" onClick={onNewRequest}>
          <Plus size={18} />
          New Assistance Request
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search description, contact, or name..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Status Filter */}
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

          {/* Category Filter */}
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
            Search
          </button>

          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => fetchRequests(pagination.page)}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* Error Banner */}
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

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading assistance requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <AlertTriangle size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3>No Assistance Requests Found</h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem', color: 'var(--text-secondary)' }}>
            You haven't submitted any emergency requests matching the selected filter, or you haven't requested aid yet.
          </p>
          <button className="btn btn-danger" onClick={onNewRequest}>
            <Plus size={18} />
            Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {requests.map((req) => (
            <div key={req._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header row: Status and Urgency */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span className={`status-badge ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                    <span className={`badge ${getUrgencyBadge(req.urgency)}`}>
                      {req.urgency}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Category & Title */}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: '#fff' }}>
                  {req.assistanceType} Assistance
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

                {/* Meta details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <MapPin size={14} style={{ color: '#f87171' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.location?.address}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Phone size={14} style={{ color: '#34d399' }} />
                    <span>{req.contactNumber} ({req.requesterName})</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.75rem', color: req.assignedTo ? '#38bdf8' : 'var(--text-muted)' }}>
                  {req.assignedTo ? `Assigned to: ${req.assignedTo.name || 'Volunteer'}` : 'Awaiting Volunteer'}
                </span>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedRequest(req)}
                >
                  <Eye size={14} /> View Timeline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalRequests} total)
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
