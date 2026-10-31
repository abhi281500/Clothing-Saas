import React, { useState, useEffect } from 'react';
import { useParams, Outlet, Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { ShoppingBag, MessageCircle, MapPin, Compass, Search, Clock, ExternalLink } from 'lucide-react';

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

export default function StorefrontLayout() {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const { getCart } = useCart();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isCustomDomain =
    !paramSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.endsWith('.vercel.app') &&
    !window.location.hostname.endsWith('.onrender.com');

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        let res;
        if (paramSlug) {
          res = await api.getStorefront(paramSlug);
        } else {
          // Resolve store by custom domain hostname
          const hostname = window.location.hostname;
          res = await api.getStorefrontByDomain(hostname);
        }
        if (res.success) {
          setStore(res.data);
        }
      } catch (err) {
        setError(err.message || 'Store could not be loaded');
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [paramSlug]);

  const currentSlug = paramSlug || store?.slug || '';
  const cart = getCart(currentSlug);
  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Derive active navigation state
  const isCatalogActive = isCustomDomain
    ? location.pathname === '/' || location.pathname === ''
    : location.pathname === `/store/${currentSlug}` || location.pathname === `/store/${currentSlug}/`;

  const isTrackActive = isCustomDomain
    ? location.pathname.startsWith('/track')
    : location.pathname.startsWith(`/store/${currentSlug}/track`);

  const isCartActive = isCustomDomain
    ? location.pathname.startsWith('/cart')
    : location.pathname.startsWith(`/store/${currentSlug}/cart`);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf9' }}>
        <p style={{ color: '#78716c', fontWeight: 500 }}>Loading boutique storefront...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ maxWidth: '600px', margin: '6rem auto', padding: '2rem', textAlign: 'center' }} className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e11d48', marginBottom: '0.5rem' }}>Store Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          {error || 'This boutique storefront is currently inactive or does not exist.'}
        </p>
        <Link to="/" className="btn-primary">
          Back to Homepage
        </Link>
      </div>
    );
  }

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  // Format Instagram URL
  const getInstagramUrl = (handle) => {
    if (!handle) return '';
    if (handle.startsWith('http')) return handle;
    return `https://instagram.com/${handle.replace('@', '')}`;
  };

  // Format Google Maps Location URL
  const addressParts = [
    store.address?.street,
    store.address?.landmark,
    store.address?.city,
    store.address?.state,
    store.address?.pincode,
  ].filter(Boolean);

  const fullAddressString = addressParts.join(', ');

  const mapsUrl = store.googleMapsUrl || (fullAddressString ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${fullAddressString}`)}` : '');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafaf9' }}>
      {/* Top Announcement Bar */}
      <div style={{ backgroundColor: primaryColor, color: '#ffffff', padding: '0.4rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
        ✨ Free Delivery & Cash On Delivery Available Across India ✨
      </div>

      {/* Boutique Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0eee9', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Brand Logo & Name */}
          <div style={{ flexShrink: 0 }}>
            <Link to={isCustomDomain ? '/' : `/store/${currentSlug}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {store.name}
              </span>
              {store.tagline && (
                <span style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '2px' }}>
                  {store.tagline}
                </span>
              )}
            </Link>
          </div>

          {/* Navigation & Social Actions */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Catalog Link */}
            <Link
              to={isCustomDomain ? '/' : `/store/${currentSlug}`}
              aria-current={isCatalogActive ? 'page' : undefined}
              style={{
                fontSize: '0.85rem',
                fontWeight: isCatalogActive ? 700 : 600,
                color: isCatalogActive ? primaryColor : '#64748b',
                backgroundColor: isCatalogActive ? '#ffe4e6' : 'transparent',
                padding: '0.4rem 0.65rem',
                borderRadius: '0.375rem',
                transition: 'all 0.15s ease',
              }}
            >
              Catalog
            </Link>

            {/* Track Order Link */}
            <Link
              to={isCustomDomain ? '/track' : `/store/${currentSlug}/track`}
              aria-current={isTrackActive ? 'page' : undefined}
              style={{
                fontSize: '0.85rem',
                fontWeight: isTrackActive ? 700 : 600,
                color: isTrackActive ? primaryColor : '#64748b',
                backgroundColor: isTrackActive ? '#ffe4e6' : 'transparent',
                padding: '0.4rem 0.65rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={15} />
              <span>Track Order</span>
            </Link>

            {/* Social Channel Links */}
            {store.instagramHandle && (
              <a
                href={getInstagramUrl(store.instagramHandle)}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#e1306c', padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                title="Follow on Instagram"
                aria-label="Instagram profile"
              >
                <InstagramIcon size={19} />
              </a>
            )}

            {store.facebookUrl && (
              <a
                href={store.facebookUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1877f2', padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                title="Facebook Page"
                aria-label="Facebook page"
              >
                <FacebookIcon size={19} />
              </a>
            )}

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#059669', padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                title="Google Maps Location"
                aria-label="Google Maps shop location"
              >
                <MapPin size={19} />
              </a>
            )}

            {/* WhatsApp Contact Button */}
            {store.whatsappNumber && (
              <a
                href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${store.name}, I want to enquire about your boutique collection!`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Bag Button */}
            <Link
              to={isCustomDomain ? '/cart' : `/store/${currentSlug}/cart`}
              aria-current={isCartActive ? 'page' : undefined}
              className="btn-primary"
              style={{
                backgroundColor: primaryColor,
                padding: '0.45rem 0.95rem',
                fontSize: '0.85rem',
                position: 'relative',
                boxShadow: isCartActive ? `0 0 0 3px rgba(225, 29, 72, 0.25)` : 'none',
              }}
            >
              <ShoppingBag size={16} />
              <span>Bag</span>
              {totalCartCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#ffffff',
                    color: primaryColor,
                    borderRadius: '9999px',
                    padding: '0.1rem 0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    marginLeft: '0.25rem',
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </Link>
          </nav>

        </div>
      </header>

      {/* Main Storefront Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Outlet context={{ store, slug: currentSlug, isCustomDomain }} />
      </main>

      {/* Verified Boutique Footer with Physical Address, Google Maps & Social Proof */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f0eee9', marginTop: 'auto', padding: '3rem 1rem 2rem 1rem', textAlign: 'center', color: '#78716c', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          
          {/* Boutique Name & Heritage */}
          <div>
            <p style={{ fontWeight: 800, color: '#1c1917', fontSize: '1.35rem', fontFamily: 'Playfair Display, serif' }}>
              {store.name}
            </p>
            {store.tagline && (
              <p style={{ fontSize: '0.85rem', color: '#78716c', marginTop: '0.15rem' }}>
                {store.tagline}
              </p>
            )}
            {store.description && (
              <p style={{ fontSize: '0.85rem', color: '#57534e', marginTop: '0.5rem', maxWidth: '600px', lineHeight: 1.5 }}>
                {store.description}
              </p>
            )}
          </div>

          {/* Physical Address & Google Maps */}
          {fullAddressString && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', backgroundColor: '#fafaf9', borderRadius: '0.75rem', border: '1px solid #f5f5f4', width: '100%', maxWidth: '560px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1c1917', fontWeight: 600, fontSize: '0.9rem' }}>
                <MapPin size={16} color={primaryColor} />
                <span>Physical Boutique Location</span>
              </div>
              <p style={{ color: '#44403c', fontSize: '0.85rem', textAlign: 'center' }}>
                {fullAddressString}
              </p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: primaryColor,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    marginTop: '0.25rem',
                    padding: '0.35rem 0.75rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #fecdd3',
                    borderRadius: '9999px',
                  }}
                >
                  <MapPin size={13} />
                  <span>Open in Google Maps</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {/* Social Proof Links Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
            {store.instagramHandle && (
              <a
                href={getInstagramUrl(store.instagramHandle)}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#e1306c', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <InstagramIcon size={17} />
                <span>Instagram</span>
              </a>
            )}

            {store.facebookUrl && (
              <a
                href={store.facebookUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#1877f2', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <FacebookIcon size={17} />
                <span>Facebook</span>
              </a>
            )}

            {store.whatsappNumber && (
              <a
                href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${store.name}, I have a question regarding your boutique collection.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <MessageCircle size={17} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {/* Builder Agency Contact Info for Interested Buyers */}
          <div style={{ width: '100%', maxWidth: '600px', margin: '1rem 0 0 0', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155' }}>
            <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              Want to launch a branded e-commerce store like this for your clothing boutique?
            </p>
            <p style={{ color: '#64748b' }}>
              Contact Builder: <strong>Abhishek</strong> • 📞 <a href="tel:+916290197418" style={{ color: '#e11d48', fontWeight: 600 }}>+91 6290197418</a> • ✉️ <a href="mailto:abhi281500@gmail.com" style={{ color: '#e11d48', fontWeight: 600 }}>abhi281500@gmail.com</a>
            </p>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#a8a29e' }}>
            Powered by BoutiqueSaaS • Multi-Tenant Clothing Commerce Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
