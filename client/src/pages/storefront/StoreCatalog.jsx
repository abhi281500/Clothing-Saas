import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatINR } from '../../utils/format';
import { Search, ShoppingBag, Eye, Shirt, Tag } from 'lucide-react';

export default function StoreCatalog() {
  const { slug } = useParams();
  const { store } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        let query = '';
        const params = [];
        if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (params.length) query = `?${params.join('&')}`;

        const res = await api.getStoreCatalog(slug, query);
        if (res.success) {
          setProducts(res.data.products || []);
        }
      } catch (err) {
        console.error('Failed to load store catalog', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [slug, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Re-fetch triggers with search
    loadCatalog();
  };

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Boutique Intro Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          border: '1px solid #f0eee9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.25rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.5rem' }}>
          {store.name}
        </h1>
        <p style={{ color: '#78716c', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {store.description || store.tagline || 'Explore our newest designer clothing and ethnic boutique collection.'}
        </p>

        {/* Search */}
        <div style={{ maxWidth: '420px', margin: '1.5rem auto 0 auto', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search kurtis, sarees, dresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', borderRadius: '9999px', backgroundColor: '#fafaf9' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', justifyContent: 'center' }}>
          {categories.map((cat) => {
            const isSelected = (!selectedCategory && cat === 'All') || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? 'none' : '1px solid #e7e5e4',
                  backgroundColor: isSelected ? primaryColor : '#ffffff',
                  color: isSelected ? '#ffffff' : '#44403c',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#78716c' }}>
          Loading collection...
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#a8a29e' }}>
          <Shirt size={48} style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#44403c', fontWeight: 600 }}>No items currently in this section</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Check back soon for new arrivals!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.75rem' }}>
          {products.map((p) => {
            const hasVariants = p.variants && p.variants.length > 0;
            const availableSizes = hasVariants ? [...new Set(p.variants.map((v) => v.size))].join(', ') : '';

            return (
              <div
                key={p._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #f0eee9',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Image */}
                <Link to={`/store/${slug}/products/${p.slug}`} style={{ position: 'relative', width: '100%', paddingTop: '125%', overflow: 'hidden', backgroundColor: '#f5f5f4' }}>
                  {p.images && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d6d3d1' }}>
                      <Shirt size={40} />
                    </div>
                  )}

                  {p.totalStock <= 0 && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ backgroundColor: '#ffffff', color: '#1c1917', fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '0.25rem' }}>
                        Sold Out
                      </span>
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a8a29e', fontWeight: 600 }}>
                      {p.category}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1c1917', marginTop: '0.2rem', lineHeight: 1.3 }}>
                      <Link to={`/store/${slug}/products/${p.slug}`}>{p.name}</Link>
                    </h3>

                    {availableSizes && (
                      <p style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '0.35rem' }}>
                        Sizes: {availableSizes}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1917' }}>
                        {formatINR(p.basePricePaise)}
                      </span>
                      {p.compareAtPricePaise > p.basePricePaise && (
                        <span style={{ fontSize: '0.85rem', color: '#a8a29e', textDecoration: 'line-through', marginLeft: '0.5rem' }}>
                          {formatINR(p.compareAtPricePaise)}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/store/${slug}/products/${p.slug}`}
                      className="btn-primary"
                      style={{
                        backgroundColor: primaryColor,
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        borderRadius: '0.375rem',
                      }}
                    >
                      <span>Select Size</span>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
