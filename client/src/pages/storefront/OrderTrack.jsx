import React, { useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatINR, formatDate } from '../../utils/format';
import { Search, Clock, ArrowLeft, AlertCircle, HelpCircle, Phone, PackageCheck, MessageCircle } from 'lucide-react';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

export default function OrderTrack() {
  const { slug } = useParams();
  const { store } = useOutletContext();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  const handleTrack = async (e) => {
    e.preventDefault();

    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    // Normalize phone number: strip non-digits and leading +91 / 0 if 12/11 digits
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!cleanOrderNumber) {
      setError('Please enter your Order Number (e.g. ORD-12345).');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number used during checkout.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.trackOrder(slug, cleanOrderNumber, cleanPhone);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      setError(err.message || 'No order found matching these details. Please verify your order number and mobile number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'CANCELLED') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  const currentStep = order ? getStepIndex(order.orderStatus) : -1;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '1.5rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Navigation & Header */}
      <div>
        <Link
          to={`/store/${slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '0.35rem 0.65rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '0.375rem',
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>← Back to {store?.name || 'Store'}</span>
        </Link>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1c1917', marginTop: '0.25rem' }}>
          Track Your Boutique Order
        </h1>
        <p style={{ color: '#78716c', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Enter the order number and 10-digit mobile number provided at checkout to view real-time fulfillment status.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="card">
        <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
              Order Number *
            </label>
            <input
              type="text"
              placeholder="e.g. ORD-1729000000000-XYZ or ORD-1001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="input-field"
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
              Your order number was shown on your confirmation receipt and sent via SMS/WhatsApp.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
              Mobile Number (WhatsApp) *
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
              Must match the mobile number used when placing the order.
            </span>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                border: '1px solid #fecaca',
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: 600 }}>Order Tracking Notice</p>
                <p style={{ marginTop: '0.15rem' }}>{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ backgroundColor: primaryColor, padding: '0.75rem' }}
          >
            <Search size={16} />
            <span>{loading ? 'Verifying Order Records...' : 'Track Delivery Status'}</span>
          </button>
        </form>
      </div>

      {/* Order Status Result */}
      {order && (
        <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Order #{order.orderNumber}
              </span>
              <p style={{ fontSize: '0.85rem', color: '#78716c' }}>Placed on {formatDate(order.createdAt)}</p>
            </div>
            <span className={`badge badge-${order.orderStatus.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              {order.orderStatus}
            </span>
          </div>

          {/* Timeline */}
          {order.orderStatus === 'CANCELLED' ? (
            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
              This order has been cancelled by the boutique.
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>Fulfillment Timeline:</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={step} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9999px',
                          margin: '0 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDone ? '#16a34a' : '#e2e8f0',
                          color: isDone ? '#ffffff' : '#94a3b8',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          boxShadow: isCurrent ? '0 0 0 4px #dcfce7' : 'none',
                        }}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <p style={{ fontSize: '0.75rem', fontWeight: isDone ? 700 : 500, color: isDone ? '#166534' : '#94a3b8', marginTop: '0.35rem' }}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Items in this shipment:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc', fontSize: '0.9rem' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{item.productName}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatINR(item.subtotalPaise)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontWeight: 800 }}>
              <span>Total Amount (COD):</span>
              <span style={{ color: primaryColor }}>{formatINR(order.financials?.totalPaise || 0)}</span>
            </div>
          </div>

          {/* Destination with Privacy Redaction */}
          {order.customer?.shippingAddress && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#475569', border: '1px solid #e2e8f0' }}>
              <p><strong>Recipient:</strong> {order.customer?.name} ({order.customer?.phone})</p>
              <p style={{ marginTop: '0.2rem' }}>
                <strong>Destination:</strong> {order.customer.shippingAddress.city}, {order.customer.shippingAddress.state} - {order.customer.shippingAddress.pincode}
              </p>
            </div>
          )}

          {/* WhatsApp Support CTA */}
          {store.whatsappNumber && (
            <a
              href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${store.name}, I am checking status on my order #${order.orderNumber}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <MessageCircle size={18} />
              <span>Contact Boutique on WhatsApp</span>
            </a>
          )}
        </div>
      )}

    </div>
  );
}
