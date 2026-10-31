import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  CheckCircle2,
  AlertCircle,
  MapPin,
  Share2,
  ExternalLink,
  Sparkles,
  Globe,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

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

  // Custom Domain state
  const [domainInput, setDomainInput] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainMessage, setDomainMessage] = useState({ type: '', text: '' });
  const [copiedKey, setCopiedKey] = useState('');
  const [showDnsHelp, setShowDnsHelp] = useState(false);

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

      if (store.customDomain?.domain) {
        setDomainInput(store.customDomain.domain);
      }
    }
  }, [store]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleConnectDomain = async (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    try {
      setDomainLoading(true);
      setDomainMessage({ type: '', text: '' });
      const res = await api.setCustomDomain({ domain: domainInput.trim() });
      if (res.success) {
        setStore(res.data);
        setDomainMessage({
          type: 'success',
          text: `Custom domain "${res.data.customDomain?.domain}" linked! Add the DNS records below at your domain registrar and click "Verify DNS Connection".`,
        });
      }
    } catch (err) {
      setDomainMessage({ type: 'error', text: err.message || 'Failed to connect custom domain' });
    } finally {
      setDomainLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      setDomainLoading(true);
      setDomainMessage({ type: '', text: '' });
      const res = await api.verifyCustomDomain();
      if (res.success) {
        setStore(res.data.store);
        if (res.data.verified) {
          setDomainMessage({ type: 'success', text: res.data.message });
        } else {
          setDomainMessage({ type: 'warning', text: res.data.message });
        }
      }
    } catch (err) {
      setDomainMessage({ type: 'error', text: err.message || 'Domain DNS verification failed' });
    } finally {
      setDomainLoading(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (
      !window.confirm(
        'Are you sure you want to disconnect your custom domain? Your store will continue to be available on your default store URL.'
      )
    ) {
      return;
    }
    try {
      setDomainLoading(true);
      setDomainMessage({ type: '', text: '' });
      const res = await api.removeCustomDomain();
      if (res.success) {
        setStore(res.data);
        setDomainInput('');
        setDomainMessage({ type: 'success', text: 'Custom domain removed successfully.' });
      }
    } catch (err) {
      setDomainMessage({ type: 'error', text: err.message || 'Failed to remove custom domain' });
    } finally {
      setDomainLoading(false);
    }
  };

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

      {/* Custom Domain Management Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Globe size={20} color="#e11d48" />
              <span>Custom Domain Mapping (Branded Storefront)</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>
              Connect your own domain (e.g. <code>boutiquename.in</code> or <code>shop.boutiquename.com</code>) so buyers experience a 100% branded D2C website.
            </p>
          </div>

          {store?.customDomain?.domain && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                backgroundColor:
                  store.customDomain.status === 'ACTIVE'
                    ? '#dcfce7'
                    : store.customDomain.status === 'PENDING_DNS'
                    ? '#fef3c7'
                    : '#fee2e2',
                color:
                  store.customDomain.status === 'ACTIVE'
                    ? '#166534'
                    : store.customDomain.status === 'PENDING_DNS'
                    ? '#92400e'
                    : '#991b1b',
              }}
            >
              {store.customDomain.status === 'ACTIVE' ? (
                <>
                  <ShieldCheck size={14} /> ACTIVE (SSL ON)
                </>
              ) : store.customDomain.status === 'PENDING_DNS' ? (
                <>
                  <RefreshCw size={14} className={domainLoading ? 'animate-spin' : ''} /> PENDING DNS
                </>
              ) : (
                <>
                  <AlertCircle size={14} /> CONFIG ERROR
                </>
              )}
            </span>
          )}
        </div>

        {domainMessage.text && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              backgroundColor:
                domainMessage.type === 'success'
                  ? '#dcfce7'
                  : domainMessage.type === 'warning'
                  ? '#fef3c7'
                  : '#fee2e2',
              color:
                domainMessage.type === 'success'
                  ? '#166534'
                  : domainMessage.type === 'warning'
                  ? '#92400e'
                  : '#991b1b',
              border: `1px solid ${
                domainMessage.type === 'success'
                  ? '#bbf7d0'
                  : domainMessage.type === 'warning'
                  ? '#fde68a'
                  : '#fecaca'
              }`,
            }}
          >
            {domainMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{domainMessage.text}</span>
          </div>
        )}

        {/* If no custom domain is set or user wants to connect */}
        {!store?.customDomain?.domain ? (
          <form onSubmit={handleConnectDomain} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>
                Enter Your Custom Domain or Subdomain
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="e.g. shop.fashionhub.in or fashionhub.in"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '240px' }}
                  required
                />
                <button
                  type="submit"
                  disabled={domainLoading || !domainInput.trim()}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Globe size={16} />
                  <span>{domainLoading ? 'Connecting...' : 'Connect Domain'}</span>
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                You can use a root domain (e.g. <code>mybrand.in</code>) or a subdomain (e.g. <code>shop.mybrand.in</code>).
              </span>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Active Domain Info Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Configured Custom Domain
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    {store.customDomain.domain}
                  </span>
                  <a
                    href={`https://${store.customDomain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#e11d48', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    <span>Visit</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleVerifyDomain}
                  disabled={domainLoading}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} className={domainLoading ? 'animate-spin' : ''} />
                  <span>{domainLoading ? 'Verifying DNS...' : 'Verify DNS Connection'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveDomain}
                  disabled={domainLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={14} />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>

            {/* DNS Instructions Table */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                Required DNS Records at your Registrar (GoDaddy, Hostinger, Cloudflare, etc.)
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Log in to where you bought your domain and create the following DNS record(s):
              </p>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.6rem 1rem', color: '#475569', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '0.6rem 1rem', color: '#475569', fontWeight: 600 }}>Host / Name</th>
                      <th style={{ padding: '0.6rem 1rem', color: '#475569', fontWeight: 600 }}>Target / Value</th>
                      <th style={{ padding: '0.6rem 1rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(store.customDomain.dnsRecords || []).map((rec, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < store.customDomain.dnsRecords.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
                            {rec.recordType}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#334155' }}>
                          {rec.name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all' }}>
                          {rec.value}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(rec.value, `rec-${idx}`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: copiedKey === `rec-${idx}` ? '#dcfce7' : '#f8fafc',
                              color: copiedKey === `rec-${idx}` ? '#166534' : '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                            }}
                          >
                            {copiedKey === `rec-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedKey === `rec-${idx}` ? 'Copied!' : 'Copy Value'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error / Propagation status alert */}
            {store.customDomain.lastDnsCheckError && store.customDomain.status !== 'ACTIVE' && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <strong>DNS Diagnostics:</strong> {store.customDomain.lastDnsCheckError}
              </div>
            )}

            {/* Collapsible Registrar Guide */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowDnsHelp(!showDnsHelp)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HelpCircle size={15} color="#64748b" />
                  <span>How to add DNS records (GoDaddy, Hostinger, Cloudflare, Namecheap)</span>
                </span>
                {showDnsHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDnsHelp && (
                <div style={{ padding: '1rem', fontSize: '0.825rem', color: '#475569', lineHeight: 1.6, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                  <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>
                      <strong>GoDaddy:</strong> Log in &gt; Go to <em>My Products</em> &gt; Click <em>DNS</em> next to your domain &gt; Click <em>Add New Record</em> &gt; Choose <code>CNAME</code> (or <code>A</code>) and enter the Name and Value shown in the table above &gt; Save.
                    </li>
                    <li>
                      <strong>Hostinger:</strong> Open <em>hPanel</em> &gt; Go to <em>Domains</em> &gt; Click <em>DNS / Nameservers</em> &gt; Under <em>Manage DNS Records</em>, select the Record Type and add the Host and Points to value &gt; Click <em>Add Record</em>.
                    </li>
                    <li>
                      <strong>Cloudflare:</strong> Go to your Cloudflare dashboard &gt; Select your Domain &gt; Click <em>DNS &gt; Records</em> &gt; Click <em>Add record</em> &gt; Set Proxy status to <em>DNS only</em> (grey cloud) or <em>Proxied</em> (orange cloud) &gt; Save.
                    </li>
                    <li>
                      <strong>Namecheap:</strong> Go to <em>Domain List</em> &gt; Click <em>Manage</em> &gt; Open <em>Advanced DNS</em> tab &gt; Click <em>Add New Record</em> &gt; Add Host and Target &gt; Click Save checkmark.
                    </li>
                  </ol>
                  <p style={{ marginTop: '0.75rem', marginBottom: 0, color: '#64748b', fontSize: '0.785rem' }}>
                    💡 <em>Tip:</em> DNS propagation typically takes between 2 to 15 minutes worldwide. Once added, click <strong>Verify DNS Connection</strong> above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
