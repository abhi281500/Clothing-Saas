import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { LayoutDashboard, Shirt, ShoppingCart, Percent, Settings, ExternalLink, Sparkles } from 'lucide-react';

export default function SellerLayout() {
  const { user, store, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 500 }}>Loading boutique workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/seller/login" replace />;
  }

  const navItems = [
    { label: 'Overview', to: '/seller/dashboard', icon: LayoutDashboard },
    { label: 'Catalog & Products', to: '/seller/products', icon: Shirt },
    { label: 'Promotions & Sales', to: '/seller/promotions', icon: Sparkles },
    { label: 'Orders & Shipments', to: '/seller/orders', icon: ShoppingCart },
    { label: 'Discount Codes', to: '/seller/discounts', icon: Percent },
    { label: 'Store Settings', to: '/seller/settings', icon: Settings },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '260px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ padding: '0 0.75rem 1rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                Active Boutique
              </p>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                {store?.name || 'My Boutique'}
              </h2>
              {store && (
                <a
                  href={`/store/${store.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#e11d48', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 600 }}
                >
                  <ExternalLink size={13} />
                  <span>/{store.slug}</span>
                </a>
              )}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/seller/dashboard'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#e11d48' : '#475569',
                      backgroundColor: isActive ? '#ffe4e6' : 'transparent',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            <p style={{ fontWeight: 600, color: '#334155' }}>WhatsApp-First SaaS</p>
            <p style={{ marginTop: '0.25rem' }}>Optimized for Indian clothing sellers and direct WhatsApp orders.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem', backgroundColor: '#f8fafc' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
