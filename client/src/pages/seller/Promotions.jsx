import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { Plus, Trash2, Edit2, Sparkles, Calendar, Clock, Tag, AlertCircle, X, CheckCircle, Percent } from 'lucide-react';

const GRADIENT_THEMES = [
  { label: 'Rose Gold', bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', text: '#be123c' },
  { label: 'Royal Purple', bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', text: '#7e22ce' },
  { label: 'Warm Amber', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', text: '#b45309' },
  { label: 'Emerald Festive', bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', text: '#047857' },
  { label: 'Indigo Silk', bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', text: '#4338ca' },
];

export default function Promotions() {
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState(['All', 'Kurtis', 'Sarees', 'Co-ord Sets', 'Lehengas']);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, UPCOMING, EXPIRED

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const getInitialDates = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  };

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    badge: 'Limited Time Deal',
    category: 'All',
    dealType: 'PERCENTAGE_DISCOUNT',
    discountValue: '20',
    priceCapRupees: '999',
    startDate: '',
    endDate: '',
    isActive: true,
    bgGradient: GRADIENT_THEMES[0].bg,
    textColor: GRADIENT_THEMES[0].text,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, productRes] = await Promise.all([
        api.getCampaigns(),
        api.getProducts(),
      ]);

      if (campaignRes.success) {
        setCampaigns(campaignRes.data || []);
      }

      if (productRes.success && productRes.data?.categories) {
        const unique = Array.from(new Set(['All', ...productRes.data.categories]));
        setCategories(unique);
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCampaign(null);
    const dates = getInitialDates();
    setForm({
      title: '',
      subtitle: '',
      badge: 'Festive Deal',
      category: 'All',
      dealType: 'PERCENTAGE_DISCOUNT',
      discountValue: '25',
      priceCapRupees: '999',
      startDate: dates.startDate,
      endDate: dates.endDate,
      isActive: true,
      bgGradient: GRADIENT_THEMES[0].bg,
      textColor: GRADIENT_THEMES[0].text,
    });
    setModalError('');
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCampaign(c);
    setForm({
      title: c.title || '',
      subtitle: c.subtitle || '',
      badge: c.badge || 'Deal',
      category: c.category || 'All',
      dealType: c.dealType || 'PERCENTAGE_DISCOUNT',
      discountValue: String(c.discountValue || 0),
      priceCapRupees: c.priceCapPaise ? String(c.priceCapPaise / 100) : '999',
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      isActive: c.isActive !== undefined ? c.isActive : true,
      bgGradient: c.bgGradient || GRADIENT_THEMES[0].bg,
      textColor: c.textColor || GRADIENT_THEMES[0].text,
    });
    setModalError('');
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm('You have unsaved changes in this campaign form. Discard them?');
      if (!confirmDiscard) return;
    }
    setIsModalOpen(false);
    setEditingCampaign(null);
    setIsDirty(false);
    setModalError('');
  }, [isDirty]);

  // Escape key & scroll lock
  useEffect(() => {
    if (!isModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, handleCloseModal]);

  const updateField = (field, value) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setModalError('Campaign title is required.');
      return;
    }

    if (!form.startDate || !form.endDate) {
      setModalError('Both start date and end date are required.');
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (start >= end) {
      setModalError('Start date must be strictly before end date.');
      return;
    }

    const discountNum = Number(form.discountValue);
    if (form.dealType === 'PERCENTAGE_DISCOUNT' && (isNaN(discountNum) || discountNum <= 0 || discountNum > 90)) {
      setModalError('Percentage discount must be between 1% and 90%.');
      return;
    }

    try {
      setSaving(true);
      setModalError('');

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        badge: form.badge.trim(),
        category: form.category,
        dealType: form.dealType,
        discountValue: form.dealType === 'PERCENTAGE_DISCOUNT' ? discountNum : 0,
        priceCapRupees: form.dealType === 'PRICE_CAP' ? Number(form.priceCapRupees) || 999 : 0,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
        bgGradient: form.bgGradient,
        textColor: form.textColor,
      };

      if (editingCampaign) {
        await api.updateCampaign(editingCampaign._id, payload);
      } else {
        await api.createCampaign(payload);
      }

      setIsDirty(false);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Error saving campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion campaign?')) {
      try {
        await api.deleteCampaign(id);
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to delete campaign');
      }
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === 'ACTIVE') return c.status === 'ACTIVE';
    if (activeTab === 'UPCOMING') return c.status === 'UPCOMING';
    if (activeTab === 'EXPIRED') return c.status === 'EXPIRED' || c.status === 'PAUSED';
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Promotions & Scheduled Sales</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Schedule genuine store sales, category-wide discounts, and coming-soon promotional cards
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ padding: '0.625rem 1.25rem' }}>
          <Plus size={18} />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {[
          { key: 'ALL', label: `All Campaigns (${campaigns.length})` },
          { key: 'ACTIVE', label: `Active Now (${campaigns.filter((c) => c.status === 'ACTIVE').length})` },
          { key: 'UPCOMING', label: `Upcoming / Coming Soon (${campaigns.filter((c) => c.status === 'UPCOMING').length})` },
          { key: 'EXPIRED', label: `Past / Paused (${campaigns.filter((c) => c.status === 'EXPIRED' || c.status === 'PAUSED').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: activeTab === tab.key ? '#ffe4e6' : 'transparent',
              color: activeTab === tab.key ? '#be123c' : '#64748b',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading promotional campaigns...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
          <Sparkles size={48} style={{ margin: '0 auto 1rem auto', strokeWidth: 1.5, color: '#f43f5e' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
            {activeTab === 'ALL' ? 'No promotion campaigns scheduled yet' : `No ${activeTab.toLowerCase()} campaigns`}
          </h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '1.25rem', maxWidth: '420px', margin: '0.25rem auto 1.25rem auto' }}>
            Create real seasonal sales, festive discounts, or upcoming launch announcements displayed directly on your public store.
          </p>
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={16} />
            <span>Launch First Promotion</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredCampaigns.map((c) => {
            const isCurrentlyActive = c.status === 'ACTIVE';
            const isUpcoming = c.status === 'UPCOMING';
            const isExpired = c.status === 'EXPIRED';

            return (
              <div
                key={c._id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  border: isCurrentlyActive ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                  boxShadow: isCurrentlyActive ? '0 4px 6px -1px rgba(225, 29, 72, 0.08)' : 'none',
                }}
              >
                <div>
                  {/* Status & Badge Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: isCurrentlyActive
                          ? '#dcfce7'
                          : isUpcoming
                          ? '#dbeafe'
                          : isExpired
                          ? '#f1f5f9'
                          : '#fef3c7',
                        color: isCurrentlyActive
                          ? '#166534'
                          : isUpcoming
                          ? '#1e40af'
                          : isExpired
                          ? '#64748b'
                          : '#92400e',
                      }}
                    >
                      {isCurrentlyActive ? '● Active Now' : isUpcoming ? '⏱ Upcoming' : isExpired ? 'Expired' : 'Paused'}
                    </span>

                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textColor }}>
                      {c.badge}
                    </span>
                  </div>

                  {/* Card Banner Preview */}
                  <div
                    style={{
                      background: c.bgGradient,
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      color: c.textColor,
                      marginBottom: '0.85rem',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85 }}>
                      {c.category === 'All' ? 'Storewide' : c.category}
                    </p>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem', lineHeight: 1.2 }}>
                      {c.title}
                    </h3>
                    {c.subtitle && (
                      <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.9 }}>
                        {c.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#94a3b8" />
                      <span>
                        {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
                        {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Tag size={14} color="#94a3b8" />
                      <span>
                        {c.dealType === 'PERCENTAGE_DISCOUNT' && `Discount: ${c.discountValue}% OFF`}
                        {c.dealType === 'PRICE_CAP' && `Price Cap: Under ₹${c.priceCapPaise / 100}`}
                        {c.dealType === 'FLAT_DISCOUNT' && `Flat Discount Deal`}
                        {c.dealType === 'SPECIAL_COLLECTION' && `Special Curated Collection`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => openEditModal(c)}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                    title="Edit Campaign"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(c._id)}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', color: '#e11d48' }}
                    title="Delete Campaign"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Campaign Modal — Rendered via Portal */}
      {isModalOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <div
              className="card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="campaign-modal-title"
              style={{
                maxWidth: '680px',
                width: '100%',
                maxHeight: 'min(90vh, 850px)',
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Sticky Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.75rem',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <div>
                  <h2 id="campaign-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    {editingCampaign ? 'Edit Promotion Campaign' : 'Create Store Promotion'}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Schedule verified deals, festive sales, and upcoming announcement banners
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Close dialog"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '0.4rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div
                style={{
                  padding: '1.5rem 1.75rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {modalError && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: '1px solid #fecaca',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <form id="campaign-form" onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Campaign Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                      Promotion Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali Festive Kurti Mela, Under ₹999 Clearance, Silk Sarees 40% Off"
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="input-field"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Subtitle & Badge */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Subtitle / Catchphrase
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Limited festive inventory on handloom fabrics"
                        value={form.subtitle}
                        onChange={(e) => updateField('subtitle', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Card Badge Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SPECIAL DEAL, FESTIVE SALE, 40% OFF"
                        value={form.badge}
                        onChange={(e) => updateField('badge', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Category & Deal Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Applicable Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="input-field"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'All' ? 'All Store Categories' : cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Deal Type
                      </label>
                      <select
                        value={form.dealType}
                        onChange={(e) => updateField('dealType', e.target.value)}
                        className="input-field"
                      >
                        <option value="PERCENTAGE_DISCOUNT">Percentage Discount (% OFF)</option>
                        <option value="PRICE_CAP">Price Cap (e.g. Under ₹999)</option>
                        <option value="SPECIAL_COLLECTION">Special Curated Collection</option>
                      </select>
                    </div>
                  </div>

                  {/* Value inputs based on deal type */}
                  {form.dealType === 'PERCENTAGE_DISCOUNT' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Discount Percentage (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        placeholder="25"
                        value={form.discountValue}
                        onChange={(e) => updateField('discountValue', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                  )}

                  {form.dealType === 'PRICE_CAP' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Price Cap (INR ₹) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="999"
                        value={form.priceCapRupees}
                        onChange={(e) => updateField('priceCapRupees', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                  )}

                  {/* Start & End Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => updateField('startDate', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => updateField('endDate', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  {/* Theme Gradient Picker */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                      Card Color Theme
                    </label>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {GRADIENT_THEMES.map((theme) => {
                        const isSelected = form.bgGradient === theme.bg;
                        return (
                          <button
                            key={theme.label}
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setForm((prev) => ({
                                ...prev,
                                bgGradient: theme.bg,
                                textColor: theme.text,
                              }));
                            }}
                            style={{
                              padding: '0.5rem 0.85rem',
                              borderRadius: '0.5rem',
                              border: isSelected ? '2px solid #e11d48' : '1px solid #cbd5e1',
                              background: theme.bg,
                              color: theme.text,
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 0 0 2px rgba(225, 29, 72, 0.2)' : 'none',
                            }}
                          >
                            {theme.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Card Preview */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                      Live Preview on Public Storefront:
                    </p>
                    <div
                      style={{
                        background: form.bgGradient,
                        borderRadius: '0.625rem',
                        padding: '1.25rem',
                        color: form.textColor,
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85 }}>
                        {form.badge || 'PROMOTION'}
                      </span>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>
                        {form.title || 'Your Promotion Title Here'}
                      </h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.9 }}>
                        {form.subtitle || 'Promotional subtitle and customer details'}
                      </p>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="campaignActiveCheckbox"
                      checked={form.isActive}
                      onChange={(e) => updateField('isActive', e.target.checked)}
                      style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#e11d48' }}
                    />
                    <label htmlFor="campaignActiveCheckbox" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>
                      Enable campaign immediately (Storefront visibility follows schedule dates)
                    </label>
                  </div>
                </form>
              </div>

              {/* Sticky Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.75rem',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="campaign-form"
                  disabled={saving}
                  className="btn-primary"
                  style={{ minWidth: '130px' }}
                >
                  {saving ? 'Saving...' : editingCampaign ? 'Update Promotion' : 'Publish Promotion'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
