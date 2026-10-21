import React, { useState, useEffect } from 'react';
import { useParams, Outlet, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { ShoppingBag, MessageCircle, MapPin } from 'lucide-react';

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function StorefrontLayout() {
  const { slug } = useParams();
  const { getCart } = useCart();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cart = getCart(slug);
  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        const res = await api.getStorefront(slug);
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
  }, [slug]);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafaf9' }}>
      {/* Top Announcement Bar */}
      <div style={{ backgroundColor: primaryColor, color: '#ffffff', padding: '0.4rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
        ✨ Free Delivery & Cash On Delivery Available Across India ✨
      </div>

      {/* Boutique Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0eee9', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div>
            <Link to={`/store/${slug}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em' }}>
                {store.name}
              </span>
              {store.tagline && (
                <span style={{ fontSize: '0.8rem', color: '#78716c', marginTop: '-2px' }}>
                  {store.tagline}
                </span>
              )}
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {store.whatsappNumber && (
              <a
                href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${store.name}, I want to enquire about your boutique collection!`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                <MessageCircle size={16} />
                <span style={{ display: 'none', md: 'inline' }}>WhatsApp Us</span>
              </a>
            )}

            {store.instagramHandle && (
              <a
                href={`https://instagram.com/${store.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#e1306c', padding: '0.45rem', display: 'flex', alignItems: 'center' }}
                title="Follow on Instagram"
              >
                <InstagramIcon size={22} />
              </a>
            )}

            {/* Cart Button */}
            <Link
              to={`/store/${slug}/cart`}
              className="btn-primary"
              style={{ backgroundColor: primaryColor, padding: '0.45rem 0.95rem', fontSize: '0.85rem', position: 'relative' }}
            >
              <ShoppingBag size={17} />
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
          </div>

        </div>
      </header>

      {/* Main Storefront Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Outlet context={{ store }} />
      </main>

      {/* Boutique Footer */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f0eee9', marginTop: 'auto', padding: '2rem 1rem', textAlign: 'center', color: '#78716c', fontSize: '0.85rem' }}>
        <p style={{ fontWeight: 600, color: '#1c1917', fontSize: '1rem', fontFamily: 'Playfair Display, serif' }}>{store.name}</p>
        {store.address?.city && (
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <MapPin size={14} />
            <span>{store.address.city}, {store.address.state}</span>
          </p>
        )}
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#a8a29e' }}>
          Powered by BoutiqueSaaS • Multi-Tenant Commerce Platform
        </p>
      </footer>
    </div>
  );
}
