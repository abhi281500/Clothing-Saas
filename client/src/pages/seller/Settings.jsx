import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { CheckCircle2, AlertCircle, MapPin, Share2, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';

export default function Settings() {
  const { store, setStore } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    whatsappNumber: '',
    instagramHandle: '',
    facebookUrl: '',
    googleMapsUrl: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
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
        facebookUrl: store.facebookUrl || '',
        googleMapsUrl: store.googleMapsUrl || '',
        street: store.address?.street || '',
        landmark: store.address?.landmark || '',
        city: store.address?.city || '',
        state: store.address?.state || '',
        pincode: store.address?.pincode || '',
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
        name: formData.name.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        instagramHandle: formData.instagramHandle.trim(),
        facebookUrl: formData.facebookUrl.trim(),
        googleMapsUrl: formData.googleMapsUrl.trim(),
        address: {
          street: formData.street.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '760px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Boutique Profile & Store Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Configure your boutique identity, social proof links, physical shop address, and Google Maps location
        </p>
      </div>

      <div className="card">
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #bbf7d0' }}>
            <CheckCircle2 size={18} />
            <span>Store settings saved successfully! Your Google Maps location, address, and social links are now live on your storefront.</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #fecaca' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Basic Identity */}
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} color="#e11d48" />
              <span>Boutique Brand Identity</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  Tagline / Brand Catchphrase
                </label>
                <input
                  type="text"
                  name="tagline"
                  placeholder="e.g. Handcrafted & Curated Designer Fashion"
                  value={formData.tagline}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
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
                  <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>{formData.primaryColor}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  About the Boutique (Brand Heritage & Fabric Story)
                </label>
                <textarea
                  rows="3"
                  name="description"
                  placeholder="Tell your shoppers about your fabrics, artisanal heritage, saree weaves, and tailoring specialty..."
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Social Proof & Digital Channels */}
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Share2 size={16} color="#e11d48" />
              <span>Social Media & Contact Channels (Builds Customer Trust)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  WhatsApp Order Number *
                </label>
                <input
                  type="text"
                  name="whatsappNumber"
                  placeholder="+919876543210"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                  Customers can chat directly with your boutique.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  Instagram Handle or Link
                </label>
                <input
                  type="text"
                  name="instagramHandle"
                  placeholder="@fashionhub or https://instagram.com/fashionhub"
                  value={formData.instagramHandle}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  Facebook Page Link
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  placeholder="https://facebook.com/fashionhubboutique"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  Google Maps Location Link
                </label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                  value={formData.googleMapsUrl}
                  onChange={handleChange}
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
                  Paste Google Maps share link so buyers can navigate to your shop.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Boutique Location & Address */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="#e11d48" />
              <span>Physical Shop Address (Displayed on Storefront Footer)</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  Shop No. / Building / Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  placeholder="e.g. Shop No. 14, Ground Floor, Silver Plaza"
                  value={formData.street}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                  Market Name / Landmark
                </label>
                <input
                  type="text"
                  name="landmark"
                  placeholder="e.g. Near Hawa Mahal, Bapu Bazaar / Ring Road Cloth Market"
                  value={formData.landmark}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="302003"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '0.5rem' }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.75rem 1.5rem', minWidth: '160px' }}>
              {saving ? 'Saving Changes...' : 'Save Store Profile'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
