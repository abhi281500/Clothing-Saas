import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Store, User, LogOut, ExternalLink, Package, Tag, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, store, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/seller/login');
  };

  return (
    <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: '#e11d48' }}>
            <ShoppingBag size={24} />
            <span>BoutiqueSaaS</span>
          </Link>
          {store && (
            <span style={{ fontSize: '0.875rem', padding: '0.2rem 0.6rem', backgroundColor: '#ffe4e6', color: '#be123c', borderRadius: '9999px', fontWeight: 600 }}>
              {store.name}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              {store && (
                <a
                  href={`/store/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={15} />
                  <span>View My Store</span>
                </a>
              )}
              <Link to="/seller/dashboard" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/seller/login" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Seller Login
              </Link>
              <Link to="/seller/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Start Free Store
              </Link>
            </div>
          )}
        </nav>

      </div>
    </header>
  );
}
