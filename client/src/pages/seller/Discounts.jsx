import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { formatINR, toPaise } from '../../utils/format';
import { Percent, Plus, Trash2, Tag, CheckCircle2 } from 'lucide-react';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENT');
  const [value, setValue] = useState('');
  const [minOrderRupees, setMinOrderRupees] = useState('');
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.getDiscounts();
      if (res.success) {
        setDiscounts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load discounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    if (!code || !value) {
      setError('Please provide coupon code and discount value');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'PERCENT' ? parseFloat(value) : toPaise(value),
        minOrderPaise: minOrderRupees ? toPaise(minOrderRupees) : 0,
        maxDiscountPaise: maxDiscountRupees ? toPaise(maxDiscountRupees) : 0,
      };

      await api.createDiscount(payload);
      setCode('');
      setValue('');
      setMinOrderRupees('');
      setMaxDiscountRupees('');
      loadDiscounts();
    } catch (err) {
      setError(err.message || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this discount code?')) {
      try {
        await api.deleteDiscount(id);
        loadDiscounts();
      } catch (err) {
        alert(err.message || 'Failed to delete coupon');
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Discount Coupons & Offers</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Create promotional discount codes for your boutique customers
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Create Coupon Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={18} color="#e11d48" />
            <span>Create New Coupon</span>
          </h2>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCreateDiscount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Coupon Code *
              </label>
              <input
                type="text"
                placeholder="e.g. WELCOME10 or FESTIVE500"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input-field"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Discount Type
                </label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Value *
                </label>
                <input
                  type="number"
                  placeholder={type === 'PERCENT' ? '15' : '200'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Min Order (INR ₹)
                </label>
                <input
                  type="number"
                  placeholder="999"
                  value={minOrderRupees}
                  onChange={(e) => setMinOrderRupees(e.target.value)}
                  className="input-field"
                />
              </div>

              {type === 'PERCENT' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Max Cap (INR ₹)
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={maxDiscountRupees}
                    onChange={(e) => setMaxDiscountRupees(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {saving ? 'Creating...' : 'Save Coupon'}
            </button>
          </form>
        </div>

        {/* Existing Coupons List */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Active Coupons</h2>

          {loading ? (
            <div style={{ color: '#64748b' }}>Loading coupons...</div>
          ) : discounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
              <Percent size={36} style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontWeight: 600, color: '#475569' }}>No discount codes created</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Reward your loyal Instagram and WhatsApp buyers with coupons.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {discounts.map((d) => (
                <div
                  key={d._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#e11d48', fontSize: '0.95rem' }}>{d.code}</span>
                      <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Active</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {d.type === 'PERCENT' ? `${d.value}% OFF` : `Flat ₹${d.value / 100} OFF`}
                      {d.minOrderPaise > 0 && ` on min order of ₹${d.minOrderPaise / 100}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(d._id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }}
                    title="Delete coupon"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
