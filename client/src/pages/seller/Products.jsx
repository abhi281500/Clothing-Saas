import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { formatINR, toRupees } from '../../utils/format';
import { Plus, Trash2, Edit2, Search, Shirt, X, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Kurtis',
  'Sarees',
  'Co-ord Sets',
  'Lehengas',
  'Suits & Anarkalis',
  'Western Wear',
  'Dresses',
  'Dupattas & Shawls',
  'Accessories',
];

const IMAGE_PRESETS = [
  { label: 'Embroidered Kurti', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Banarasi Silk Saree', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Party Lehenga', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Floral Dress', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Chic Co-ord Set', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80' },
];

const INITIAL_FORM = {
  name: '',
  category: 'Kurtis',
  description: '',
  priceRupees: '',
  compareAtPriceRupees: '',
  imageUrl: '',
  isPublished: true,
  variants: [
    { size: 'M', color: 'Default', stock: 10, sku: '' },
    { size: 'L', color: 'Default', stock: 10, sku: '' },
  ],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [form, setForm] = useState(INITIAL_FORM);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = [];
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`);
      if (params.length) query = `?${params.join('&')}`;

      const res = await api.getProducts(query);
      if (res.success) {
        const fetchedProducts = res.data.products || [];
        setProducts(fetchedProducts);

        // Merge existing categories with defaults
        const distinctFromRes = res.data.categories || [];
        const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...distinctFromRes]));
        setStoreCategories(mergedCategories);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setForm({
      ...INITIAL_FORM,
      category: storeCategories[0] || 'Kurtis',
    });
    setModalError('');
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    const isCustom = !storeCategories.includes(p.category);
    setIsCustomCategory(isCustom);
    if (isCustom) setCustomCategoryInput(p.category);

    setForm({
      name: p.name || '',
      category: p.category || 'Kurtis',
      description: p.description || '',
      priceRupees: toRupees(p.basePricePaise),
      compareAtPriceRupees: p.compareAtPricePaise ? toRupees(p.compareAtPricePaise) : '',
      imageUrl: p.images && p.images.length > 0 ? p.images[0] : '',
      isPublished: p.isPublished !== undefined ? p.isPublished : true,
      variants: p.variants && p.variants.length > 0
        ? p.variants.map(v => ({ size: v.size || 'Free Size', color: v.color || 'Default', stock: v.stock || 0, sku: v.sku || '' }))
        : [{ size: 'Free Size', color: 'Default', stock: p.totalStock || 0, sku: '' }],
    });
    setModalError('');
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm('You have unsaved changes in this product form. Are you sure you want to discard them?');
      if (!confirmDiscard) return;
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    setIsDirty(false);
    setModalError('');
  }, [isDirty]);

  // Handle Escape key and body scroll locking
  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, handleCloseModal]);

  const updateFormField = (field, value) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddVariant = () => {
    setIsDirty(true);
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: 'XL', color: 'Default', stock: 5, sku: '' }],
    }));
  };

  const handleRemoveVariant = (idx) => {
    if (form.variants.length <= 1) return;
    setIsDirty(true);
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const handleVariantChange = (idx, field, value) => {
    setIsDirty(true);
    const updated = [...form.variants];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'stock' ? Math.max(0, parseInt(value, 10) || 0) : value,
    };
    setForm((prev) => ({ ...prev, variants: updated }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // 1. Validate Product Name
    if (!form.name.trim()) {
      setModalError('Product Name is required.');
      return;
    }

    // 2. Validate Price
    const numericPrice = parseFloat(form.priceRupees);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setModalError('Selling Price must be a valid positive number greater than ₹0.');
      return;
    }

    // 3. Validate Original / Compare At Price
    const numericCompare = form.compareAtPriceRupees ? parseFloat(form.compareAtPriceRupees) : 0;
    if (numericCompare > 0 && numericCompare < numericPrice) {
      setModalError(`Original/MRP Price (₹${numericCompare}) cannot be lower than Selling Price (₹${numericPrice}).`);
      return;
    }

    // 4. Validate Category
    let finalCategory = form.category;
    if (isCustomCategory) {
      const trimmedCustom = customCategoryInput.trim();
      if (!trimmedCustom) {
        setModalError('Please enter a custom category name.');
        return;
      }
      finalCategory = trimmedCustom;
    }

    // 5. Validate Variants
    for (let i = 0; i < form.variants.length; i++) {
      const v = form.variants[i];
      if (v.stock < 0 || isNaN(v.stock)) {
        setModalError(`Variant #${i + 1} (${v.size} / ${v.color}) cannot have negative stock.`);
        return;
      }
    }

    try {
      setSaving(true);
      setModalError('');

      const payload = {
        name: form.name.trim(),
        category: finalCategory,
        description: form.description.trim(),
        priceRupees: numericPrice,
        compareAtPriceRupees: numericCompare > 0 ? numericCompare : 0,
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        isPublished: form.isPublished,
        variants: form.variants.map((v, idx) => ({
          size: v.size ? v.size.trim() : 'Free Size',
          color: v.color ? v.color.trim() : 'Default',
          stock: Math.max(0, parseInt(v.stock, 10) || 0),
          sku: v.sku ? v.sku.trim() : '',
        })),
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, payload);
      } else {
        await api.createProduct(payload);
      }

      // Add new custom category to state if not present
      if (isCustomCategory && !storeCategories.includes(finalCategory)) {
        setStoreCategories((prev) => [...prev, finalCategory]);
      }

      setIsDirty(false);
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setModalError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to remove this product from your boutique?')) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (err) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  // Calculate discount percentage preview
  const sellingNum = parseFloat(form.priceRupees) || 0;
  const mrpNum = parseFloat(form.compareAtPriceRupees) || 0;
  const discountPercentPreview =
    mrpNum > sellingNum && sellingNum > 0
      ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100)
      : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Catalog & Apparel Inventory</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage boutique apparel, custom categories, size/color variant stock, and pricing
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ padding: '0.625rem 1.25rem' }}>
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '240px', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search by apparel name, category, or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="btn-secondary" style={{ padding: '0.625rem 1rem' }} aria-label="Search">
            <Search size={16} />
          </button>
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '180px' }}
        >
          <option value="">All Categories ({products.length} items)</option>
          {storeCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Shirt size={48} style={{ margin: '0 auto 1rem auto', strokeWidth: 1.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>No products found</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Add your first dress, kurti, saree, or co-ord set to start selling!
            </p>
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={16} />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Apparel Item</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Price (INR)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Variants / Stock</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '56px',
                          borderRadius: '0.375rem',
                          backgroundColor: '#f1f5f9',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.innerHTML = '<span style="color:#94a3b8;font-size:10px;">No Image</span>';
                            }}
                          />
                        ) : (
                          <Shirt size={22} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Slug: /{p.slug}</p>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '0.2rem 0.55rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {formatINR(p.basePricePaise)}
                      {p.compareAtPricePaise > p.basePricePaise && (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.35rem' }}>
                          {formatINR(p.compareAtPricePaise)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: p.totalStock > 0 ? '#166534' : '#991b1b',
                          backgroundColor: p.totalStock > 0 ? '#dcfce7' : '#fee2e2',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        {p.totalStock > 0 ? `${p.totalStock} in stock (${p.variants?.length || 1} variants)` : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${p.isPublished ? 'badge-delivered' : 'badge-pending'}`}>
                        {p.isPublished ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.65rem' }}
                          title="Edit Product"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.65rem', color: '#e11d48' }}
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Add / Edit Modal — Rendered via Portal directly into document.body */}
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
              aria-labelledby="product-modal-title"
              style={{
                maxWidth: '740px',
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
              {/* Sticky Modal Header — Never scrolls away */}
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
                  <h2 id="product-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    {editingProduct ? 'Edit Boutique Apparel' : 'Add New Boutique Apparel'}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {editingProduct ? 'Update product pricing, images, and inventory variants' : 'List a new apparel item to your public store catalog'}
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

              {/* Scrollable Form Body — Independently scrolls, never hides header or footer */}
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

                <form id="product-form" onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Product Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chanderi Silk Embroidered Anarkali Kurti"
                      value={form.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      className="input-field"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Category Selection with Custom Category Toggle */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setIsCustomCategory(!isCustomCategory);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e11d48',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isCustomCategory ? '← Choose Existing Category' : '+ Create Custom Category'}
                      </button>
                    </div>

                    {isCustomCategory ? (
                      <input
                        type="text"
                        placeholder="Type new category (e.g. Bridal Lehengas, Organza Sarees, Co-ords)..."
                        value={customCategoryInput}
                        onChange={(e) => {
                          setIsDirty(true);
                          setCustomCategoryInput(e.target.value);
                        }}
                        className="input-field"
                        required
                      />
                    ) : (
                      <select
                        value={form.category}
                        onChange={(e) => updateFormField('category', e.target.value)}
                        className="input-field"
                      >
                        {storeCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Price Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                        Selling Price (INR ₹) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="1499"
                        value={form.priceRupees}
                        onChange={(e) => updateFormField('priceRupees', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                          Original / MRP Price (INR ₹)
                        </label>
                        {discountPercentPreview > 0 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                            {discountPercentPreview}% OFF
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="2499 (Optional, shows strikethrough)"
                        value={form.compareAtPriceRupees}
                        onChange={(e) => updateFormField('compareAtPriceRupees', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Image URL & Presets */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                      Apparel Image URL
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={form.imageUrl}
                        onChange={(e) => updateFormField('imageUrl', e.target.value)}
                        className="input-field"
                        style={{ flex: 1 }}
                      />
                      {form.imageUrl.trim() && (
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '0.375rem',
                            border: '1px solid #cbd5e1',
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={form.imageUrl}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles size={13} color="#e11d48" />
                        <span>Quick Presets:</span>
                      </span>
                      {IMAGE_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => updateFormField('imageUrl', p.url)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #e2e8f0',
                            backgroundColor: form.imageUrl === p.url ? '#ffe4e6' : '#ffffff',
                            color: form.imageUrl === p.url ? '#e11d48' : '#475569',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
                      Apparel Description & Fabric Details
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Pure Chanderi silk fabric with intricate zardozi hand embroidery. Includes matching organza dupatta..."
                      value={form.description}
                      onChange={(e) => updateFormField('description', e.target.value)}
                      className="input-field"
                    ></textarea>
                  </div>

                  {/* Size & Color Variants */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                          Size & Color Variants & Inventory
                        </label>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Specify available sizes, shades, and individual stock quantities
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        + Add Variant
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {form.variants.map((v, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            backgroundColor: '#f8fafc',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.15rem' }}>Size</label>
                            <input
                              type="text"
                              placeholder="Size (S, M, L, Free Size)"
                              value={v.size}
                              onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                              className="input-field"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            />
                          </div>

                          <div style={{ flex: '1 1 130px' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.15rem' }}>Color</label>
                            <input
                              type="text"
                              placeholder="Color (Maroon, Teal)"
                              value={v.color}
                              onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                              className="input-field"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            />
                          </div>

                          <div style={{ width: '90px' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.15rem' }}>Stock</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Stock"
                              value={v.stock}
                              onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                              className="input-field"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            />
                          </div>

                          {form.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#e11d48',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                marginTop: '1rem',
                              }}
                              title="Remove Variant"
                              aria-label={`Remove variant ${idx + 1}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Published Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem' }}>
                    <input
                      type="checkbox"
                      id="publishedCheckbox"
                      checked={form.isPublished}
                      onChange={(e) => updateFormField('isPublished', e.target.checked)}
                      style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#e11d48' }}
                    />
                    <label htmlFor="publishedCheckbox" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>
                      Publish immediately to public boutique storefront
                    </label>
                  </div>
                </form>
              </div>

              {/* Sticky Modal Footer — Never scrolls away */}
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
                  form="product-form"
                  disabled={saving}
                  className="btn-primary"
                  style={{ minWidth: '130px' }}
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
