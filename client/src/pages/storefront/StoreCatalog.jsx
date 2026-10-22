import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatINR } from '../../utils/format';
import { Search, ShoppingBag, Eye, Shirt, Tag, Sparkles, Percent, ArrowRight, MessageCircle } from 'lucide-react';

const DEALS_SHOWCASE = [
  {
    title: 'MIN. 50% OFF',
    subtitle: 'Festive & Embroidered Kurtis',
    category: 'Kurtis',
    badge: 'Trending Now',
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    textColor: '#be123c',
  },
  {
    title: 'UNDER ₹999',
    subtitle: 'Daily Casuals & Co-ords',
    category: 'Co-ord Sets',
    badge: 'Budget Buys',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    textColor: '#92400e',
  },
  {
    title: 'HANDPICKED',
    subtitle: 'Silk Sarees & Heritage Weaves',
    category: 'Sarees',
    badge: 'Pure Fabrics',
    bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    textColor: '#3730a3',
  },
  {
    title: 'SPECIAL DEALS',
    subtitle: 'Suits, Gowns & Western Wear',
    category: 'Suits & Anarkalis',
    badge: 'New Arrivals',
    bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    textColor: '#166534',
  },
];

export default function StoreCatalog() {
  const { slug } = useParams();
  const { store } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  const loadCatalog = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = [];
      if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (params.length) query = `?${params.join('&')}`;

      const res = await api.getStoreCatalog(slug, query);
      if (res.success) {
        setProducts(res.data.products || []);

        // Server sends all distinct categories in the store
        if (res.data.categories && res.data.categories.length > 0) {
          setCategories(['All', ...res.data.categories]);
        }
      }
    } catch (err) {
      console.error('Failed to load store catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [slug, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCatalog();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Boutique Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          border: '1px solid #f0eee9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: primaryColor, fontWeight: 700, letterSpacing: '0.08em' }}>
          Official Boutique Storefront
        </span>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 700, color: '#1c1917', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
          {store.name}
        </h1>
        <p style={{ color: '#78716c', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {store.description || store.tagline || 'Explore handcrafted kurtis, designer sarees, co-ord sets, and festive boutique collections with Cash on Delivery.'}
        </p>

        {/* Real-time Search Box */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '480px', margin: '1.25rem auto 0 auto', position: 'relative', display: 'flex' }}>
          <input
            type="text"
            placeholder="Search kurtis, sarees, anarkalis, dresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingRight: '5.5rem', borderRadius: '9999px', backgroundColor: '#fafaf9' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <button
            type="submit"
            className="btn-primary"
            style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', borderRadius: '9999px', padding: '0 1rem', fontSize: '0.8rem', backgroundColor: primaryColor }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Promotional Deals Section (Inspired by Myntra & Indian D2C Fashion) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color={primaryColor} />
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.35rem', fontWeight: 700, color: '#1c1917' }}>
              Big Savings & Category Deals
            </h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 600 }}>Limited Time Offers</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {DEALS_SHOWCASE.map((deal, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedCategory(deal.category)}
              style={{
                background: deal.bg,
                borderRadius: '0.75rem',
                padding: '1.25rem',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#ffffff', color: deal.textColor, padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-block', marginBottom: '0.5rem' }}>
                  {deal.badge}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: deal.textColor }}>
                  {deal.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500, marginTop: '0.2rem' }}>
                  {deal.subtitle}
                </p>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: deal.textColor }}>
                <span>Shop {deal.category}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter Pills (Never disappear upon filtering!) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map((cat) => {
            const isSelected = (!selectedCategory && cat === 'All') || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                style={{
                  padding: '0.5rem 1.15rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? 'none' : '1px solid #e7e5e4',
                  backgroundColor: isSelected ? primaryColor : '#ffffff',
                  color: isSelected ? '#ffffff' : '#44403c',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 4px rgba(225,29,72,0.2)' : 'none',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#78716c' }}>
          <Shirt size={36} color={primaryColor} style={{ margin: '0 auto 0.75rem auto', animation: 'spin 2s linear infinite' }} />
          <p style={{ fontWeight: 600 }}>Loading boutique apparel collection...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #f0eee9' }}>
          <Shirt size={48} color="#a8a29e" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#1c1917', fontWeight: 700 }}>No products found in this category</h3>
          <p style={{ fontSize: '0.9rem', color: '#78716c', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            Try selecting "All" or searching for a different apparel name.
          </p>
          <button onClick={() => { setSelectedCategory(''); setSearch(''); }} className="btn-primary" style={{ backgroundColor: primaryColor }}>
            View Full Collection
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products.map((p) => {
            const hasVariants = p.variants && p.variants.length > 0;
            const availableSizes = hasVariants ? [...new Set(p.variants.map((v) => v.size))].join(', ') : 'Free Size';
            const discountPercent = p.compareAtPricePaise > p.basePricePaise
              ? Math.round(((p.compareAtPricePaise - p.basePricePaise) / p.compareAtPricePaise) * 100)
              : 0;

            return (
              <div
                key={p._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.875rem',
                  border: '1px solid #f0eee9',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                }}
              >
                {/* Product Image with Discount Badge */}
                <Link
                  to={`/store/${slug}/products/${p.slug}`}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '3/4',
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f4',
                    display: 'block',
                  }}
                >
                  {p.images && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', backgroundColor: '#f5f5f4' }}>
                      <Shirt size={48} strokeWidth={1.25} />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>{p.category}</span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {discountPercent > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: '#e11d48',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }}
                    >
                      {discountPercent}% OFF
                    </span>
                  )}

                  {p.totalStock <= 0 && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ backgroundColor: '#ffffff', color: '#1c1917', fontWeight: 800, fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '0.25rem' }}>
                        Sold Out
                      </span>
                    </div>
                  )}
                </Link>

                {/* Product Info Section */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {p.category}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', lineHeight: 1.3 }}>
                      <Link to={`/store/${slug}/products/${p.slug}`} style={{ color: 'inherit' }}>
                        {p.name}
                      </Link>
                    </h3>

                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                      Sizes: <span style={{ fontWeight: 600, color: '#334155' }}>{availableSizes}</span>
                    </p>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        {formatINR(p.basePricePaise)}
                      </span>
                      {p.compareAtPricePaise > p.basePricePaise && (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.4rem' }}>
                          {formatINR(p.compareAtPricePaise)}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/store/${slug}/products/${p.slug}`}
                      className="btn-primary"
                      style={{
                        backgroundColor: primaryColor,
                        padding: '0.45rem 0.9rem',
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

      {/* Builder & Platform Contact Section for Interested Buyers / Clients */}
      <div
        style={{
          marginTop: '2rem',
          backgroundColor: '#0f172a',
          borderRadius: '1rem',
          padding: '2rem 1.5rem',
          color: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f43f5e', fontWeight: 800, letterSpacing: '0.08em' }}>
            Platform Builder Contact
          </span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem' }}>
            Want an E-Commerce Website for your Clothing Brand?
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            We build branded multi-tenant stores for Indian boutiques with WhatsApp order integration & COD.
          </p>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span>📞 Call / WhatsApp: <strong style={{ color: '#ffffff' }}>+91 6290197418</strong></span>
            <span>✉️ Email: <strong style={{ color: '#ffffff' }}>abhi281500@gmail.com</strong></span>
          </div>
        </div>

        <a
          href={`https://wa.me/916290197418?text=${encodeURIComponent('Hello! I visited the Clothing SaaS store and I am interested in building a boutique store for my brand.')}`}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp"
          style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
        >
          <MessageCircle size={18} />
          <span>Chat on WhatsApp (+91 6290197418)</span>
        </a>
      </div>

    </div>
  );
}
