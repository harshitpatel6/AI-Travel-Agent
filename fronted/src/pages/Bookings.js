import React, { useState, useEffect } from 'react';
import { Hotel, Plane, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { bookingAPI } from '../utils/api';
import './Bookings.css';

const Bookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState({ hotels: [], flights: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const [hotelsRes, flightsRes] = await Promise.all([
        bookingAPI.getHotelBookings(),
        bookingAPI.getFlightBookings()
      ]);

      setBookings({
        hotels: hotelsRes.data.bookings || [],
        flights: flightsRes.data.bookings || []
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === 'hotels') return bookings.hotels;
    if (activeTab === 'flights') return bookings.flights;
    return [...bookings.hotels, ...bookings.flights];
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return <div className="loading-screen">Loading bookings...</div>;
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <div className="bookings-header">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Manage all your travel reservations</p>
        </div>

        <div className="bookings-tabs">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Bookings ({bookings.hotels.length + bookings.flights.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotels')}
          >
            <Hotel size={18} />
            Hotels ({bookings.hotels.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => setActiveTab('flights')}
          >
            <Plane size={18} />
            Flights ({bookings.flights.length})
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state card">
            <Calendar size={64} />
            <h3>No bookings found</h3>
            <p>Start planning your next adventure!</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map((booking) => (
              <div key={booking.booking_id} className="booking-item card">
                <div className="booking-header">
                  <div className="booking-type">
                    {booking.hotel_name ? <Hotel size={24} /> : <Plane size={24} />}
                  </div>
                  <span className={`status-badge status-${booking.status}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="booking-body">
                  {booking.hotel_name ? (
                    <>
                      <h3 className="booking-title">{booking.hotel_name}</h3>
                      <div className="booking-info">
                        <div className="info-item">
                          <MapPin size={16} />
                          <span>{booking.location}</span>
                        </div>
                        <div className="info-item">
                          <Calendar size={16} />
                          <span>{booking.check_in} - {booking.check_out}</span>
                        </div>
                        <div className="info-item">
                          <Users size={16} />
                          <span>{booking.guests} guest(s)</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="booking-title">
                        {booking.origin} → {booking.destination}
                      </h3>
                      <div className="booking-info">
                        <div className="info-item">
                          <Calendar size={16} />
                          <span>Departure: {booking.departure_date}</span>
                        </div>
                        {booking.return_date && (
                          <div className="info-item">
                            <Calendar size={16} />
                            <span>Return: {booking.return_date}</span>
                          </div>
                        )}
                        <div className="info-item">
                          <Users size={16} />
                          <span>{booking.passengers} passenger(s)</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="booking-footer">
                  <div className="booking-price">
                    <DollarSign size={18} />
                    <span>${booking.price}</span>
                  </div>
                  <button className="btn btn-outline btn-sm">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
