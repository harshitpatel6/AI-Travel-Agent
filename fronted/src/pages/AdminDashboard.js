import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { adminAPI } from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers({ page: 1, limit: 10 })
      ]);

      setStats(dashboardRes.data);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading admin dashboard...</div>;
  }

  const statCards = [
    {
      icon: <Users size={28} />,
      label: 'Total Users',
      value: stats?.total_users || 0,
      gradient: 'var(--gradient)'
    },
    {
      icon: <Activity size={28} />,
      label: 'Active Users',
      value: stats?.active_users || 0,
      gradient: 'var(--gradient-2)'
    },
    {
      icon: <MessageCircle size={28} />,
      label: 'Total Messages',
      value: stats?.total_messages || 0,
      gradient: 'var(--gradient-3)'
    },
    {
      icon: <Calendar size={28} />,
      label: 'Total Bookings',
      value: stats?.total_bookings || 0,
      gradient: 'var(--gradient)'
    },
    {
      icon: <DollarSign size={28} />,
      label: 'Revenue',
      value: `$${stats?.revenue?.toFixed(2) || 0}`,
      gradient: 'var(--gradient-2)'
    },
    {
      icon: <TrendingUp size={28} />,
      label: 'Premium Users',
      value: stats?.subscriptions?.premium || 0,
      gradient: 'var(--gradient-3)'
    }
  ];

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Monitor and manage your platform</p>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {statCards.map((stat, index) => (
            <div key={index} className="admin-stat-card card">
              <div className="stat-icon" style={{ background: stat.gradient }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Subscription Breakdown */}
        <div className="admin-section">
          <h2 className="section-title">Subscription Breakdown</h2>
          <div className="subscription-grid">
            <div className="subscription-card card">
              <h3>Free Plan</h3>
              <div className="subscription-value">{stats?.subscriptions?.free || 0}</div>
              <p>users</p>
            </div>
            <div className="subscription-card card">
              <h3>Premium Plan</h3>
              <div className="subscription-value">{stats?.subscriptions?.premium || 0}</div>
              <p>users</p>
            </div>
            <div className="subscription-card card">
              <h3>Enterprise Plan</h3>
              <div className="subscription-value">{stats?.subscriptions?.enterprise || 0}</div>
              <p>users</p>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="admin-section">
          <h2 className="section-title">Recent Users</h2>
          <div className="users-table card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
