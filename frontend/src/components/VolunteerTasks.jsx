import React, { useState, useEffect } from 'react';
import { requestApi } from '../api/client';
import RequestDetailModal from './RequestDetailModal';
import { 
  HeartHandshake, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Play, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  CheckCheck,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function VolunteerTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchAssignedTasks = async () => {
    setLoading(true);
    setError('');
    try {
      // Backend automatically filters by assignedTo: user._id for volunteer role
      const data = await requestApi.getAll({ limit: 50 });
      if (data && data.requests) {
        setTasks(data.requests);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const handleStatusUpdate = async (id, nextStatus) => {
    setUpdatingId(id);
    setActionSuccess('');
    setError('');
    try {
      await requestApi.updateStatus(id, nextStatus);
      setActionSuccess(`Mission status successfully updated to "${nextStatus}"`);
      await fetchAssignedTasks();
    } catch (err) {
      setError(err.message || `Failed to update status to ${nextStatus}`);
    } finally {
      setUpdatingId(null);
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

  // Metrics
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const assignedCount = tasks.filter(t => t.status === 'Assigned').length;
  const resolvedCount = tasks.filter(t => t.status === 'Resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Assigned Volunteer Missions</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Execute relief dispatches assigned to you. Follow the transition chain: Assigned &rarr; In Progress &rarr; Resolved.
          </p>
        </div>

        <button 
          className="btn btn-outline btn-sm"
          onClick={fetchAssignedTasks}
          title="Refresh missions"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Missions
        </button>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid-3">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{assignedCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Dispatch (Assigned)</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(249, 115, 22, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fb923c'
          }}>
            <Play size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{inProgressCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active In-Field Missions</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <CheckCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resolvedCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missions Resolved</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
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
          <span>{actionSuccess}</span>
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

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading your assigned missions...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <HeartHandshake size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3>No Missions Currently Assigned</h3>
          <p style={{ maxWidth: '440px', margin: '0.5rem auto 1.5rem', color: 'var(--text-secondary)' }}>
            You do not have any active assistance requests assigned to your responder account. Check the Nearby Emergency Radar to see unassigned emergencies in your vicinity.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {tasks.map((task) => {
            const isAssigned = task.status === 'Assigned';
            const isInProgress = task.status === 'In Progress';
            const isResolved = task.status === 'Resolved';
            const isUpdating = updatingId === task._id;

            return (
              <div 
                key={task._id} 
                className="glass-card"
                style={{
                  borderLeft: `4px solid ${
                    isResolved ? '#10b981' : isInProgress ? '#f97316' : '#6366f1'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`badge ${getUrgencyBadge(task.urgency)}`}>
                        {task.urgency} Urgency
                      </span>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                        {task.assistanceType}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>
                      {task.requesterName} &bull; {task.assistanceType} Assistance
                    </h3>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Created: {new Date(task.createdAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {task.description}
                </p>

                {/* Location and Contact */}
                <div className="grid-2" style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <MapPin size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                    <span>{task.location?.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Phone size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                    <a href={`tel:${task.contactNumber}`} style={{ color: '#34d399', fontWeight: 600 }}>
                      Call: {task.contactNumber}
                    </a>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedTask(task)}
                  >
                    <Eye size={14} /> View Details & Timeline
                  </button>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {isAssigned && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(task._id, 'In Progress')}
                      >
                        <Play size={14} />
                        {isUpdating ? 'Updating...' : 'Start Mission (In Progress)'}
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(task._id, 'Resolved')}
                      >
                        <CheckCircle2 size={14} />
                        {isUpdating ? 'Updating...' : 'Complete Mission (Resolved)'}
                      </button>
                    )}

                    {isResolved && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                        <CheckCheck size={16} /> Mission Completed & Logged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <RequestDetailModal
          request={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
