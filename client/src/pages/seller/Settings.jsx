import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { store, setStore } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    whatsappNumber: '',
    instagramHandle: '',
    city: '',
    state: '',
    primaryColor: '#e11d48',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        tagline: store.tagline || '',
        description: store.description || '',
        whatsappNumber: store.whatsappNumber || '',
        instagramHandle: store.instagramHandle || '',
        city: store.address?.city || '',
        state: store.address?.state || '',
        primaryColor: store.branding?.primaryColor || '#e11d48',
      });
    }
  }, [store]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const payload = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        whatsappNumber: formData.whatsappNumber,
        instagramHandle: formData.instagramHandle,
        address: {
          city: formData.city,
          state: formData.state,
        },
        branding: {
          primaryColor: formData.primaryColor,
        },
      };

      const res = await api.updateMyStore(payload);
      if (res.success) {
        setStore(res.data);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Boutique Profile & Store Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Customize your storefront appearance, WhatsApp contact number, and boutique identity
        </p>
      </div>

      <div className="card">
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} />
            <span>Store settings saved successfully! Changes are live on your storefront.</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Boutique Display Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Tagline
            </label>
            <input
              type="text"
              name="tagline"
              placeholder="Curated Designer Fashion & Ethnic Wear"
              value={formData.tagline}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                WhatsApp Contact Number
              </label>
              <input
                type="text"
                name="whatsappNumber"
                placeholder="+919876543210"
                value={formData.whatsappNumber}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Instagram Handle
              </label>
              <input
                type="text"
                name="instagramHandle"
                placeholder="@myboutique"
                value={formData.instagramHandle}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                City
              </label>
              <input
                type="text"
                name="city"
                placeholder="Jaipur / Surat / Mumbai"
                value={formData.city}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                State
              </label>
              <input
                type="text"
                name="state"
                placeholder="Rajasthan / Gujarat / Maharashtra"
                value={formData.state}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Storefront Primary Brand Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="color"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                style={{ width: '48px', height: '40px', padding: '0', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>{formData.primaryColor}</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              About the Boutique
            </label>
            <textarea
              rows="3"
              name="description"
              placeholder="Tell your shoppers about your fabrics, artisanal heritage, and styling tips..."
              value={formData.description}
              onChange={handleChange}
              className="input-field"
            ></textarea>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </form>
      </div>

    </div>
  );
}
