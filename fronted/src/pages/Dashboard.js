import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Calendar, Plane, Hotel, TrendingUp, Clock } from 'lucide-react';
import { subscriptionAPI, bookingAPI } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const [subscription, setSubscription] = useState(null);
  const [bookings, setBookings] = useState({ hotels: [], flights: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, hotelsRes, flightsRes] = await Promise.all([
        subscriptionAPI.getStatus(),
        bookingAPI.getHotelBookings(),
        bookingAPI.getFlightBookings()
      ]);

      console.log('Dashboard data:', {
        subscription: subRes.data,
        hotels: hotelsRes.data,
        flights: flightsRes.data
      });

      setSubscription(subRes.data);
      setBookings({
        hotels: hotelsRes.data.bookings || [],
        flights: flightsRes.data.bookings || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  const totalBookings = bookings.hotels.length + bookings.flights.length;
  const usage = subscription?.usage || {};
  const plan = subscription?.subscription?.plan || 'free';

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your travel overview</p>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'var(--gradient)' }}>
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalBookings}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'var(--gradient-2)' }}>
              <MessageCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{usage.messages?.used || 0}</div>
              <div className="stat-label">Messages Today</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'var(--gradient-3)' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
              <div className="stat-label">Current Plan</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/chat" className="action-card card">
              <MessageCircle size={32} />
              <h3>AI Assistant</h3>
              <p>Chat with AI to plan your trip</p>
            </Link>

            <Link to="/bookings" className="action-card card">
              <Calendar size={32} />
              <h3>View Bookings</h3>
              <p>Manage your reservations</p>
            </Link>

            <div className="action-card card">
              <Plane size={32} />
              <h3>Book Flight</h3>
              <p>Find and book flights</p>
            </div>

            <div className="action-card card">
              <Hotel size={32} />
              <h3>Book Hotel</h3>
              <p>Reserve accommodations</p>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="recent-bookings">
          <h2 className="section-title">Recent Bookings</h2>
          {totalBookings === 0 ? (
            <div className="empty-state card">
              <Calendar size={48} />
              <h3>No bookings yet</h3>
              <p>Start planning your trip with our AI assistant</p>
              <Link to="/chat" className="btn btn-primary">
                <MessageCircle size={18} />
                Start Chatting
              </Link>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.hotels.slice(0, 3).map((booking) => (
                <div key={booking.booking_id} className="booking-card card">
                  <div className="booking-icon">
                    <Hotel size={24} />
                  </div>
                  <div className="booking-details">
                    <h3>{booking.hotel_name}</h3>
                    <p>{booking.location}</p>
                    <div className="booking-dates">
                      <Clock size={16} />
                      {booking.check_in} - {booking.check_out}
                    </div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                    <div className="booking-price">${booking.price}</div>
                  </div>
                </div>
              ))}

              {bookings.flights.slice(0, 3).map((booking) => (
                <div key={booking.booking_id} className="booking-card card">
                  <div className="booking-icon">
                    <Plane size={24} />
                  </div>
                  <div className="booking-details">
                    <h3>{booking.origin} → {booking.destination}</h3>
                    <p>{booking.passengers} passenger(s)</p>
                    <div className="booking-dates">
                      <Clock size={16} />
                      {booking.departure_date}
                    </div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                    <div className="booking-price">${booking.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
