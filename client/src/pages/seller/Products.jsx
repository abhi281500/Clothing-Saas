import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { formatINR, toRupees, toPaise } from '../../utils/format';
import { Plus, Trash2, Edit2, Search, Shirt, CheckCircle2, X } from 'lucide-react';

const CATEGORIES = ['Kurtis', 'Sarees', 'Co-ord Sets', 'Lehengas', 'Suits & Anarkalis', 'Western Wear', 'Accessories'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: 'Kurtis',
    description: '',
    priceRupees: '',
    compareAtPriceRupees: '',
    imageUrl: '',
    isPublished: true,
    variants: [
      { size: 'M', color: 'Standard', stock: 10, sku: '' },
    ],
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`);
      if (params.length) query = `?${params.join('&')}`;

      const res = await api.getProducts(query);
      if (res.success) {
        setProducts(res.data.products || []);
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
    setForm({
      name: '',
      category: 'Kurtis',
      description: '',
      priceRupees: '',
      compareAtPriceRupees: '',
      imageUrl: '',
      isPublished: true,
      variants: [{ size: 'M', color: 'Default', stock: 10, sku: '' }],
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category || 'Kurtis',
      description: p.description || '',
      priceRupees: toRupees(p.basePricePaise),
      compareAtPriceRupees: p.compareAtPricePaise ? toRupees(p.compareAtPricePaise) : '',
      imageUrl: p.images && p.images.length > 0 ? p.images[0] : '',
      isPublished: p.isPublished,
      variants: p.variants && p.variants.length > 0 ? p.variants : [{ size: 'Free Size', color: 'Default', stock: p.totalStock, sku: '' }],
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { size: 'L', color: 'Default', stock: 5, sku: '' }],
    });
  };

  const handleRemoveVariant = (idx) => {
    setForm({
      ...form,
      variants: form.variants.filter((_, i) => i !== idx),
    });
  };

  const handleVariantChange = (idx, field, value) => {
    const updated = [...form.variants];
    updated[idx][field] = field === 'stock' ? parseInt(value, 10) || 0 : value;
    setForm({ ...form, variants: updated });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.priceRupees) {
      setModalError('Product name and price are required.');
      return;
    }

    try {
      setSaving(true);
      setModalError('');

      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        priceRupees: parseFloat(form.priceRupees),
        compareAtPriceRupees: form.compareAtPriceRupees ? parseFloat(form.compareAtPriceRupees) : 0,
        images: form.imageUrl ? [form.imageUrl.trim()] : [],
        isPublished: form.isPublished,
        variants: form.variants,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, payload);
      } else {
        await api.createProduct(payload);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setModalError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to remove this product from your store?')) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (err) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Catalog & Inventory</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage boutique apparel, variants, stock, and pricing in Indian Rupees
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '220px', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search by apparel name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="btn-secondary" style={{ padding: '0.625rem 1rem' }}>
            <Search size={16} />
          </button>
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '180px' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
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
              Add your first dress, kurti, or saree to start receiving orders.
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
                  <th style={{ padding: '0.85rem 1rem' }}>Item</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Price</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Variants / Stock</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '0.375rem',
                          backgroundColor: '#f1f5f9',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Shirt size={20} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/{p.slug}</p>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{p.category}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {formatINR(p.basePricePaise)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: p.totalStock > 0 ? '#166534' : '#991b1b',
                          backgroundColor: p.totalStock > 0 ? '#dcfce7' : '#fee2e2',
                          padding: '0.2rem 0.5rem',
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
                          style={{ padding: '0.35rem 0.6rem' }}
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', color: '#e11d48' }}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
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

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingProduct ? 'Edit Boutique Apparel' : 'Add New Boutique Apparel'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chanderi Silk Embroidered Anarkali"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Selling Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1499"
                    value={form.priceRupees}
                    onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Image URL (CDN / Unsplash / Cloudinary)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Store image URLs safely from object storage/CDN.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Description & Fabric Details
                </label>
                <textarea
                  rows="3"
                  placeholder="Pure Chanderi silk with intricate zardozi handwork. Comes with matching dupatta..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                ></textarea>
              </div>

              {/* Size & Color Variants */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Size & Color Variants & Inventory
                  </label>
                  <button type="button" onClick={handleAddVariant} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    + Add Variant
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {form.variants.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Size (e.g. M, L)"
                        value={v.size}
                        onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                        className="input-field"
                        style={{ width: '120px' }}
                      />
                      <input
                        type="text"
                        placeholder="Color (e.g. Maroon)"
                        value={v.color}
                        onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                        className="input-field"
                        style={{ width: '140px' }}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                        className="input-field"
                        style={{ width: '90px' }}
                      />
                      {form.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '0.4rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Published checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="publishedCheckbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="publishedCheckbox" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Publish immediately to public storefront
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
