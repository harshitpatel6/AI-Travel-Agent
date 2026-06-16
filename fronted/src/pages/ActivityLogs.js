import React, { useState, useEffect } from 'react';
import { Activity, Filter, Search, Calendar } from 'lucide-react';
import { adminAPI } from '../utils/api';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    activity_type: '',
    user_id: '',
    search: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
        ...filters
      };
      
      const response = await adminAPI.getActivityLogs(params);
      setLogs(response.data.logs || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const activityTypes = [
    { value: '', label: 'All Types' },
    { value: 'user_registered', label: 'User Registered' },
    { value: 'user_login', label: 'User Login' },
    { value: 'message_sent', label: 'Message Sent' },
    { value: 'booking_created', label: 'Booking Created' },
    { value: 'subscription_upgraded', label: 'Subscription Upgraded' },
    { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
    { value: 'admin_action', label: 'Admin Action' }
  ];

  const getActivityColor = (type) => {
    const colors = {
      user_registered: '#48bb78',
      user_login: '#4299e1',
      message_sent: '#9f7aea',
      booking_created: '#ed8936',
      subscription_upgraded: '#38b2ac',
      subscription_cancelled: '#f56565',
      admin_action: '#ecc94b'
    };
    return colors[type] || '#718096';
  };

  return (
    <div className="activity-logs-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <Activity size={32} />
              Activity Logs
            </h1>
            <p className="page-subtitle">Monitor system activity and user actions</p>
          </div>
        </div>

        <div className="filters-card card">
          <div className="filters-grid">
            <div className="filter-group">
              <label>
                <Filter size={18} />
                Activity Type
              </label>
              <select
                value={filters.activity_type}
                onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                className="form-input"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <Search size={18} />
                User ID
              </label>
              <input
                type="text"
                placeholder="Filter by user ID..."
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="logs-card card">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <Activity size={64} />
              <h3>No Activity Logs</h3>
              <p>No activity logs found matching your filters</p>
            </div>
          ) : (
            <>
              <div className="logs-list">
                {logs.map((log, index) => (
                  <div key={index} className="log-item">
                    <div 
                      className="log-indicator" 
                      style={{ background: getActivityColor(log.activity_type) }}
                    ></div>
                    <div className="log-content">
                      <div className="log-header">
                        <span 
                          className="log-type"
                          style={{ color: getActivityColor(log.activity_type) }}
                        >
                          {log.activity_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="log-time">
                          <Calendar size={14} />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="log-description">{log.description}</div>
                      {log.user_id && (
                        <div className="log-meta">
                          User ID: <code>{log.user_id}</code>
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="log-metadata">
                          <summary>View Metadata</summary>
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
