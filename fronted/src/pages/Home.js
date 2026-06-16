import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MessageCircle, Calendar, Shield, Zap, Globe, Star, TrendingUp, Users } from 'lucide-react';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: <MessageCircle size={32} />,
      title: 'AI-Powered Assistant',
      description: 'Chat with our intelligent AI to plan your perfect trip',
      gradient: 'var(--gradient)'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Easy Booking',
      description: 'Book flights and hotels seamlessly in one place',
      gradient: 'var(--gradient-2)'
    },
    {
      icon: <Shield size={32} />,
      title: 'Secure & Safe',
      description: 'Your data and payments are protected with top security',
      gradient: 'var(--gradient-3)'
    },
    {
      icon: <Zap size={32} />,
      title: 'Instant Results',
      description: 'Get real-time recommendations and instant confirmations',
      gradient: 'var(--gradient)'
    },
    {
      icon: <Globe size={32} />,
      title: 'Global Coverage',
      description: 'Access thousands of destinations worldwide',
      gradient: 'var(--gradient-2)'
    },
    {
      icon: <Star size={32} />,
      title: 'Best Prices',
      description: 'Compare and get the best deals on your bookings',
      gradient: 'var(--gradient-3)'
    }
  ];

  const stats = [
    { icon: <Users size={24} />, value: '50K+', label: 'Happy Travelers' },
    { icon: <Globe size={24} />, value: '150+', label: 'Countries' },
    { icon: <Calendar size={24} />, value: '100K+', label: 'Bookings' },
    { icon: <Star size={24} />, value: '4.9', label: 'Rating' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background"></div>
        <div className="hero-content container">
          <div className="hero-text fade-in">
            <h1 className="hero-title">
              Your AI Travel Companion
              <span className="hero-gradient-text"> Awaits</span>
            </h1>
            <p className="hero-subtitle">
              Plan, book, and explore the world with the power of AI. 
              Get personalized recommendations and seamless booking experience.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-gradient btn-large">
                <Plane size={20} />
                Start Your Journey
              </Link>
              <Link to="/chat" className="btn btn-outline btn-large">
                <MessageCircle size={20} />
                Try AI Assistant
              </Link>
            </div>
          </div>
          <div className="hero-image fade-in">
            <div className="floating-card card-1">
              <Plane size={24} />
              <span>Flight to Paris</span>
            </div>
            <div className="floating-card card-2">
              <Calendar size={24} />
              <span>Hotel Booked</span>
            </div>
            <div className="floating-card card-3">
              <Star size={24} />
              <span>Best Deals</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose TravelAI?</h2>
            <p className="section-subtitle">
              Experience the future of travel planning with our cutting-edge features
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card card fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon" style={{ background: feature.gradient }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Start Your Adventure?</h2>
              <p className="cta-subtitle">
                Join thousands of travelers who trust TravelAI for their journeys
              </p>
              <Link to="/register" className="btn btn-gradient btn-large">
                <TrendingUp size={20} />
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Plane size={24} />
              <span>TravelAI</span>
            </div>
            <p className="footer-text">
              © 2024 TravelAI. Your intelligent travel companion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
