import React, { useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/client';
import { formatINR, toRupees } from '../../utils/format';
import { ShoppingBag, Trash2, ArrowRight, Tag, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CartCheckout() {
  const { slug } = useParams();
  const { store } = useOutletContext();
  const { getCart, updateQuantity, removeFromCart, clearCart, getSubtotalPaise } = useCart();
  const navigate = useNavigate();

  const cartItems = getCart(slug);
  const subtotalPaise = getSubtotalPaise(slug);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Checkout Form state
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  const discountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const totalPaise = Math.max(0, subtotalPaise - discountPaise);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;

    try {
      setCouponLoading(true);
      setCouponError('');
      const res = await api.validateCoupon(slug, {
        code: couponCode,
        subtotalPaise,
      });

      if (res.success) {
        setAppliedCoupon(res.data);
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
    setOrderError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItems.length) {
      setOrderError('Your shopping bag is empty.');
      return;
    }

    if (!customer.name || !customer.phone || !customer.addressLine || !customer.city || !customer.state || !customer.pincode) {
      setOrderError('Please fill in all required delivery address fields.');
      return;
    }

    // Phone validation
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setOrderError('Please enter a valid 10-digit mobile number for courier and WhatsApp updates.');
      return;
    }

    try {
      setOrderSubmitting(true);
      setOrderError('');

      const orderPayload = {
        customer: {
          name: customer.name.trim(),
          phone: cleanPhone,
          email: customer.email.trim(),
          shippingAddress: {
            addressLine: customer.addressLine,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
          },
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        discountCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod,
        customerNotes,
      };

      const res = await api.checkout(slug, orderPayload);
      if (res.success) {
        clearCart(slug);
        // Navigate to confirmation page
        navigate(`/store/${slug}/order-success/${res.data.orderNumber}`, { state: { order: res.data } });
      }
    } catch (err) {
      setOrderError(err.message || 'Failed to complete order. Please check item stock.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem' }} className="card">
        <ShoppingBag size={48} color="#a8a29e" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1917' }}>Your Shopping Bag is Empty</h2>
        <p style={{ color: '#78716c', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
          Explore our handpicked collection and add your favorite apparel.
        </p>
        <Link to={`/store/${slug}`} className="btn-primary" style={{ backgroundColor: primaryColor }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <Link
          to={`/store/${slug}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#78716c', fontSize: '0.875rem', fontWeight: 500 }}
        >
          <ArrowLeft size={16} />
          <span>Back to Collection</span>
        </Link>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1c1917', marginTop: '0.5rem' }}>
          Shopping Bag & Checkout
        </h1>
      </div>

      {orderError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} />
          <span>{orderError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left: Bag Items & Delivery Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Bag Items Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1c1917' }}>
              Your Selected Items ({cartItems.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item) => {
                const itemKey = `${item.productId}-${item.variantId || 'novariant'}`;
                return (
                  <div
                    key={itemKey}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ width: '64px', height: '80px', borderRadius: '0.375rem', backgroundColor: '#f5f5f4', overflow: 'hidden', flexShrink: 0 }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={20} color="#a8a29e" />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1c1917' }}>{item.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#78716c', marginTop: '0.15rem' }}>
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1c1917', marginTop: '0.35rem' }}>
                        {formatINR(item.pricePaise)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}>
                        <button
                          onClick={() => updateQuantity(slug, itemKey, -1)}
                          style={{ padding: '0.2rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(slug, itemKey, 1)}
                          style={{ padding: '0.2rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(slug, itemKey)}
                        style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '0.35rem' }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Shipping Details Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1c1917' }}>
              Delivery Details
            </h2>

            <form onSubmit={handlePlaceOrder} id="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Radhika Verma"
                    value={customer.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    value={customer.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="radhika@example.com"
                  value={customer.email}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Delivery Street Address / Flat / Landmark *
                </label>
                <textarea
                  rows="2"
                  name="addressLine"
                  placeholder="Flat 302, Sunrise Heights, 4th Cross Road"
                  value={customer.addressLine}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Mumbai"
                    value={customer.city}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="Maharashtra"
                    value={customer.state}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="400001"
                    value={customer.pincode}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Delivery Instructions / Customizations (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please send kurti length in 44 inches"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Payment Method:
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label
                    style={{
                      flex: 1,
                      border: paymentMethod === 'COD' ? `2px solid ${primaryColor}` : '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === 'COD' ? '#fff1f2' : '#ffffff',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cash on Delivery (COD)</span>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      border: paymentMethod === 'WHATSAPP_CONFIRM' ? `2px solid ${primaryColor}` : '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === 'WHATSAPP_CONFIRM' ? '#fff1f2' : '#ffffff',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="WHATSAPP_CONFIRM"
                      checked={paymentMethod === 'WHATSAPP_CONFIRM'}
                      onChange={() => setPaymentMethod('WHATSAPP_CONFIRM')}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pay via UPI / WhatsApp</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* Right: Order Summary & Coupon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '90px' }}>
          
          {/* Coupon Input */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={16} color={primaryColor} />
              <span>Apply Coupon</span>
            </h3>

            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', backgroundColor: '#dcfce7', borderRadius: '0.375rem', color: '#166534', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 700 }}>{appliedCoupon.code} Applied (-{formatINR(appliedCoupon.discountPaise)})</span>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Coupon code (e.g. WELCOME10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="input-field"
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && (
              <p style={{ color: '#e11d48', fontSize: '0.8rem', marginTop: '0.4rem' }}>{couponError}</p>
            )}
          </div>

          {/* Pricing Breakdown Card */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#1c1917' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#44403c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatINR(subtotalPaise)}</span>
              </div>

              {discountPaise > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Discount</span>
                  <span style={{ fontWeight: 600 }}>-{formatINR(discountPaise)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Charges</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>FREE</span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#1c1917' }}>
                <span>Total Amount</span>
                <span>{formatINR(totalPaise)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={orderSubmitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', backgroundColor: primaryColor, padding: '0.85rem' }}
            >
              {orderSubmitting ? 'Placing Your Order...' : `Confirm Order • ${formatINR(totalPaise)}`}
              <ArrowRight size={18} />
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#78716c', marginTop: '0.75rem' }}>
              🔒 100% Secure Checkout directly with {store.name}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
