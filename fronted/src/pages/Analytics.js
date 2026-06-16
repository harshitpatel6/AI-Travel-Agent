import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { adminAPI } from '../utils/api';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAnalytics(period);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <TrendingUp size={32} />
              Analytics
            </h1>
            <p className="page-subtitle">Track your platform performance</p>
          </div>
          <div className="period-selector">
            {periods.map(p => (
              <button
                key={p.value}
                className={`btn ${period === p.value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {analytics && (
          <>
            <div className="metrics-grid">
              <div className="metric-card card">
                <div className="metric-icon" style={{ background: '#667eea' }}>
                  <Users size={24} />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Total Users</div>
                  <div className="metric-value">{analytics.metrics.total_users}</div>
                  <div className="metric-sublabel">
                    {analytics.metrics.active_users} active
                  </div>
                </div>
              </div>

              <div className="metric-card card">
                <div className="metric-icon" style={{ background: '#48bb78' }}>
                  <MessageSquare size={24} />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Total Messages</div>
                  <div className="metric-value">{analytics.metrics.total_messages}</div>
                  <div className="metric-sublabel">All time</div>
                </div>
              </div>

              <div className="metric-card card">
                <div className="metric-icon" style={{ background: '#ed8936' }}>
                  <Calendar size={24} />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Total Bookings</div>
                  <div className="metric-value">{analytics.metrics.total_bookings}</div>
                  <div className="metric-sublabel">All time</div>
                </div>
              </div>

              <div className="metric-card card">
                <div className="metric-icon" style={{ background: '#38b2ac' }}>
                  <DollarSign size={24} />
                </div>
                <div className="metric-content">
                  <div className="metric-label">Active Users</div>
                  <div className="metric-value">{analytics.metrics.active_users}</div>
                  <div className="metric-sublabel">Currently active</div>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card card">
                <h2>User Registrations</h2>
                <div className="chart-container">
                  {analytics.charts.user_registrations.length === 0 ? (
                    <div className="no-data">No registration data for this period</div>
                  ) : (
                    <div className="simple-chart">
                      {analytics.charts.user_registrations.map((item, index) => (
                        <div key={index} className="chart-bar-group">
                          <div 
                            className="chart-bar" 
                            style={{ 
                              height: `${(item.count / Math.max(...analytics.charts.user_registrations.map(i => i.count))) * 100}%` 
                            }}
                          >
                            <span className="bar-value">{item.count}</span>
                          </div>
                          <div className="chart-label">{new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card card">
                <h2>Messages Over Time</h2>
                <div className="chart-container">
                  {analytics.charts.message_stats.length === 0 ? (
                    <div className="no-data">No message data for this period</div>
                  ) : (
                    <div className="simple-chart">
                      {analytics.charts.message_stats.map((item, index) => (
                        <div key={index} className="chart-bar-group">
                          <div 
                            className="chart-bar" 
                            style={{ 
                              height: `${(item.count / Math.max(...analytics.charts.message_stats.map(i => i.count))) * 100}%`,
                              background: 'linear-gradient(180deg, #48bb78 0%, #38a169 100%)'
                            }}
                          >
                            <span className="bar-value">{item.count}</span>
                          </div>
                          <div className="chart-label">{new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card card">
                <h2>Subscription Distribution</h2>
                <div className="chart-container">
                  {analytics.charts.subscription_stats.length === 0 ? (
                    <div className="no-data">No subscription data</div>
                  ) : (
                    <div className="subscription-chart">
                      {analytics.charts.subscription_stats.map((item, index) => {
                        const total = analytics.charts.subscription_stats.reduce((sum, i) => sum + i.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        const colors = {
                          free: '#718096',
                          premium: '#667eea',
                          enterprise: '#ed8936'
                        };
                        return (
                          <div key={index} className="subscription-item">
                            <div className="subscription-info">
                              <div 
                                className="subscription-color" 
                                style={{ background: colors[item._id] || '#718096' }}
                              ></div>
                              <span className="subscription-name">{item._id.toUpperCase()}</span>
                            </div>
                            <div className="subscription-stats">
                              <span className="subscription-count">{item.count}</span>
                              <span className="subscription-percentage">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
