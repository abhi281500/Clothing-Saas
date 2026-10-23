import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatINR } from '../../utils/format';
import { Search, ShoppingBag, Eye, Shirt, Tag, Sparkles, Percent, ArrowRight, MessageCircle, X, Clock } from 'lucide-react';

export default function StoreCatalog() {
  const { slug } = useParams();
  const { store } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [dealsData, setDealsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  const loadCatalogAndDeals = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = [];
      if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (activeSearchQuery.trim()) params.push(`search=${encodeURIComponent(activeSearchQuery.trim())}`);
      if (params.length) query = `?${params.join('&')}`;

      const [catalogRes, dealsRes] = await Promise.all([
        api.getStoreCatalog(slug, query),
        api.getStoreDeals(slug).catch((err) => {
          console.warn('Deals not loaded', err);
          return { success: false, data: null };
        }),
      ]);

      if (catalogRes.success) {
        setProducts(catalogRes.data.products || []);
        if (catalogRes.data.categories && catalogRes.data.categories.length > 0) {
          setCategories(['All', ...catalogRes.data.categories]);
        }
      }

      if (dealsRes && dealsRes.success) {
        setDealsData(dealsRes.data);
      }
    } catch (err) {
      console.error('Failed to load store catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogAndDeals();
  }, [slug, selectedCategory, activeSearchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearchQuery(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setActiveSearchQuery('');
  };

  // Compile real deal cards from database campaigns + verified product inventory
  const realDealCards = [];

  if (dealsData) {
    // 1. Seller's active campaigns
    if (dealsData.activeDeals && dealsData.activeDeals.length > 0) {
      dealsData.activeDeals.forEach((d) => {
        realDealCards.push({
          id: d._id,
          title: d.title,
          subtitle: d.subtitle,
          category: d.category,
          badge: d.badge || 'Active Deal',
          bg: d.bgGradient,
          textColor: d.textColor,
          isUpcoming: false,
        });
      });
    }

    // 2. Verified inventory-backed deals if no custom campaigns exist
    if (realDealCards.length === 0 && dealsData.inventoryMetrics) {
      const { maxDiscountPercent, discountedProductsCount, under999Count } = dealsData.inventoryMetrics;

      if (maxDiscountPercent > 0 && discountedProductsCount > 0) {
        realDealCards.push({
          id: 'inv-discount',
          title: `UP TO ${maxDiscountPercent}% OFF`,
          subtitle: `Verified discounts on ${discountedProductsCount} boutique styles`,
          category: 'All',
          badge: 'Special Price',
          bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
          textColor: '#be123c',
          isUpcoming: false,
        });
      }

      if (under999Count > 0) {
        realDealCards.push({
          id: 'inv-under999',
          title: 'UNDER ₹999',
          subtitle: `${under999Count} budget-friendly apparel styles`,
          category: 'All',
          badge: 'Budget Buys',
          bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          textColor: '#92400e',
          isUpcoming: false,
        });
      }
    }

    // 3. Upcoming campaigns with honest Coming Soon badge
    if (dealsData.upcomingDeals && dealsData.upcomingDeals.length > 0) {
      dealsData.upcomingDeals.forEach((u) => {
        realDealCards.push({
          id: u._id,
          title: u.title,
          subtitle: u.subtitle,
          category: u.category,
          badge: 'Coming Soon',
          bg: u.bgGradient || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          textColor: u.textColor || '#475569',
          isUpcoming: true,
        });
      });
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Boutique Header */}
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
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: primaryColor, fontWeight: 700, letterSpacing: '0.08em' }}>
          Official Boutique Storefront
        </span>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 700, color: '#1c1917', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
          {store.name}
        </h1>
        <p style={{ color: '#78716c', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {store.description || store.tagline || 'Explore handcrafted kurtis, designer sarees, co-ord sets, and festive boutique collections with Cash on Delivery.'}
        </p>

        {/* Real-time Multi-Field Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '480px', margin: '1.25rem auto 0 auto', position: 'relative', display: 'flex' }}>
          <input
            type="text"
            placeholder="Search by apparel name, category, or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingRight: search ? '6.5rem' : '5rem', borderRadius: '9999px', backgroundColor: '#fafaf9' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '4.8rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem',
              }}
              title="Clear search query"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{
              position: 'absolute',
              right: '4px',
              top: '4px',
              bottom: '4px',
              borderRadius: '9999px',
              padding: '0 1rem',
              fontSize: '0.8rem',
              backgroundColor: primaryColor,
            }}
          >
            Search
          </button>
        </form>

        {activeSearchQuery && (
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', color: '#475569' }}>
            <span>Showing results for: <strong>"{activeSearchQuery}"</strong></span>
            <button onClick={handleClearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48', fontWeight: 600 }}>
              (Clear)
            </button>
          </div>
        )}
      </div>

      {/* Real Promotional Deals Section — Strictly Store-Backed */}
      {realDealCards.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color={primaryColor} />
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.35rem', fontWeight: 700, color: '#1c1917' }}>
                Store Promotions & Featured Deals
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 600 }}>Verified Boutique Offers</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {realDealCards.map((deal) => (
              <div
                key={deal.id}
                onClick={() => {
                  if (!deal.isUpcoming && deal.category && deal.category !== 'All') {
                    setSelectedCategory(deal.category);
                  }
                }}
                style={{
                  background: deal.bg,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  cursor: deal.isUpcoming ? 'default' : 'pointer',
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => {
                  if (!deal.isUpcoming) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!deal.isUpcoming) e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: '#ffffff',
                        color: deal.textColor,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      {deal.badge}
                    </span>
                    {deal.category && deal.category !== 'All' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: deal.textColor, opacity: 0.85 }}>
                        {deal.category}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: deal.textColor, lineHeight: 1.2 }}>
                    {deal.title}
                  </h3>
                  {deal.subtitle && (
                    <p style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500, marginTop: '0.25rem' }}>
                      {deal.subtitle}
                    </p>
                  )}
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: deal.textColor }}>
                  {deal.isUpcoming ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
                      <Clock size={13} />
                      <span>Starts Soon</span>
                    </span>
                  ) : (
                    <>
                      <span>{deal.category && deal.category !== 'All' ? `Shop ${deal.category}` : 'Explore Collection'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Category Filter Pills (Never disappear upon filtering) */}
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
          <Shirt size={36} color={primaryColor} style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 600 }}>Loading boutique apparel collection...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #f0eee9' }}>
          <Shirt size={48} color="#a8a29e" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#1c1917', fontWeight: 700 }}>
            {activeSearchQuery ? `No products matching "${activeSearchQuery}"` : 'No products found in this category'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#78716c', marginTop: '0.25rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0.25rem auto 1.5rem auto' }}>
            {activeSearchQuery
              ? 'Try searching by a broader term, or explore our full collection by category.'
              : 'New apparel is added regularly. Select "All" to browse all available boutique pieces.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('');
              handleClearSearch();
            }}
            className="btn-primary"
            style={{ backgroundColor: primaryColor }}
          >
            View Full Boutique Catalog
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products.map((p) => {
            const hasVariants = p.variants && p.variants.length > 0;
            const availableSizes = hasVariants ? [...new Set(p.variants.map((v) => v.size))].join(', ') : 'Free Size';
            const discountPercent =
              p.compareAtPricePaise > p.basePricePaise
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
                {/* Product Image with Discount Badge & Image Fallback */}
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
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.style.display = 'flex';
                          e.currentTarget.parentElement.style.alignItems = 'center';
                          e.currentTarget.parentElement.style.justifyContent = 'center';
                          e.currentTarget.parentElement.innerHTML = `
                            <div style="display:flex;flex-direction:column;align-items:center;color:#a8a29e;padding:1rem;">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
                              <span style="font-size:0.75rem;margin-top:0.35rem;font-weight:600;">${p.category}</span>
                            </div>
                          `;
                        }
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
          href={`https://wa.me/916290197418?text=${encodeURIComponent('Hello Abhishek! I visited the Clothing SaaS store and I am interested in building a boutique store for my brand.')}`}
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
