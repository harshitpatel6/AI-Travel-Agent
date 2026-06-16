import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Plane, MessageCircle, Calendar, User, LogOut, Settings, CreditCard, TrendingUp, Activity } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Plane size={28} />
          <span>TravelAI</span>
        </Link>

        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={() => setIsOpen(false)}>
                <Calendar size={18} />
                Dashboard
              </Link>
              <Link to="/chat" className="navbar-link" onClick={() => setIsOpen(false)}>
                <MessageCircle size={18} />
                AI Assistant
              </Link>
              <Link to="/bookings" className="navbar-link" onClick={() => setIsOpen(false)}>
                <Calendar size={18} />
                My Bookings
              </Link>
              <Link to="/subscription" className="navbar-link" onClick={() => setIsOpen(false)}>
                <CreditCard size={18} />
                Subscription
              </Link>
              {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'system_admin') && (
                <>
                  <div className="navbar-divider"></div>
                  <Link to="/admin" className="navbar-link" onClick={() => setIsOpen(false)}>
                    <Settings size={18} />
                    Admin Dashboard
                  </Link>
                  <Link to="/admin/analytics" className="navbar-link" onClick={() => setIsOpen(false)}>
                    <TrendingUp size={18} />
                    Analytics
                  </Link>
                  <Link to="/admin/activity-logs" className="navbar-link" onClick={() => setIsOpen(false)}>
                    <Activity size={18} />
                    Activity Logs
                  </Link>
                </>
              )}
              <div className="navbar-divider"></div>
              <Link to="/profile" className="navbar-link" onClick={() => setIsOpen(false)}>
                <User size={18} />
                Profile
              </Link>
              <button className="navbar-link navbar-logout" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={() => setIsOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
