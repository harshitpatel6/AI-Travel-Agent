import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { subscriptionAPI } from '../utils/api';
import './Subscription.css';

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      console.log('Subscription response:', response.data);
      
      setSubscription(response.data.subscription);
      setUsage(response.data.usage);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setMessage({ type: 'error', text: 'Failed to load subscription data' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await subscriptionAPI.createSubscription(priceId);
      setMessage({ type: 'success', text: 'Subscription upgraded successfully!' });
      fetchSubscriptionStatus();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to upgrade subscription' 
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      priceId: 'free',
      features: [
        '10 messages per day',
        '2 bookings per day',
        'Basic AI assistance',
        'Email support'
      ],
      current: subscription?.plan === 'free'
    },
    {
      name: 'Premium',
      price: '$29.99',
      priceId: 'price_premium',
      features: [
        '100 messages per day',
        '20 bookings per day',
        'Advanced AI assistance',
        'Priority support',
        'Custom recommendations'
      ],
      popular: true,
      current: subscription?.plan === 'premium'
    },
    {
      name: 'Enterprise',
      price: '$99.99',
      priceId: 'price_enterprise',
      features: [
        'Unlimited messages',
        'Unlimited bookings',
        'Dedicated account manager',
        'Custom integrations',
        '24/7 phone support',
        'Advanced analytics',
        'API access'
      ],
      current: subscription?.plan === 'enterprise'
    }
  ];

  if (loading && !subscription) {
    return (
      <div className="subscription-page">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="container">
        <div className="subscription-header">
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Choose the plan that fits your needs</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {usage && (
          <div className="usage-card card">
            <h2>Current Usage (Today)</h2>
            <div className="usage-stats">
              <div className="usage-stat">
                <div className="stat-label">Messages</div>
                <div className="stat-value">
                  {usage.messages?.used || 0} / {usage.messages?.limit === -1 ? '∞' : usage.messages?.limit || 0}
                </div>
                <div className="stat-bar">
                  <div 
                    className="stat-bar-fill" 
                    style={{ 
                      width: `${usage.messages?.limit && usage.messages.limit !== -1 
                        ? Math.min((usage.messages.used / usage.messages.limit * 100), 100) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                {usage.messages?.remaining !== undefined && usage.messages.remaining !== -1 && (
                  <div className="stat-sublabel">
                    {usage.messages.remaining} remaining today
                  </div>
                )}
              </div>
              <div className="usage-stat">
                <div className="stat-label">Bookings</div>
                <div className="stat-value">
                  {usage.bookings?.used || 0} / {usage.bookings?.limit === -1 ? '∞' : usage.bookings?.limit || 0}
                </div>
                <div className="stat-bar">
                  <div 
                    className="stat-bar-fill" 
                    style={{ 
                      width: `${usage.bookings?.limit && usage.bookings.limit !== -1 
                        ? Math.min((usage.bookings.used / usage.bookings.limit * 100), 100) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                {usage.bookings?.remaining !== undefined && usage.bookings.remaining !== -1 && (
                  <div className="stat-sublabel">
                    {usage.bookings.remaining} remaining today
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="plans-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`plan-card card ${plan.popular ? 'popular' : ''} ${plan.current ? 'current' : ''}`}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              {plan.current && <div className="current-badge">Current Plan</div>}
              
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  {plan.price}
                  <span className="plan-period">/month</span>
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <Check size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${plan.popular ? 'btn-gradient' : 'btn-outline'} btn-block`}
                onClick={() => handleUpgrade(plan.priceId)}
                disabled={plan.current || loading}
              >
                {plan.current ? (
                  <>
                    <Check size={20} />
                    Current Plan
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    {plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="subscription-faq card">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-item">
            <h3>Can I change my plan anytime?</h3>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="faq-item">
            <h3>What happens if I exceed my limits?</h3>
            <p>You'll be prompted to upgrade your plan. Your service won't be interrupted.</p>
          </div>
          <div className="faq-item">
            <h3>Is there a refund policy?</h3>
            <p>Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
