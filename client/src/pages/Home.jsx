import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Smartphone, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfbf9' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto 2rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', backgroundColor: '#ffe4e6', color: '#e11d48', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          <Sparkles size={16} />
          <span>Tailored for Indian Boutiques & Instagram Sellers</span>
        </div>

        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: '1.5rem' }}>
          Launch Your Branded Boutique Store in <span style={{ color: '#e11d48' }}>60 Seconds</span>
        </h1>

        <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '720px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          Manage Kurtis, Sarees, Co-ord Sets, size & color variants, inventory, and receive COD & WhatsApp orders seamlessly without hiring developers.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/seller/register" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
            <span>Create Free Boutique Store</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/seller/login" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
            <span>Seller Login</span>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto', padding: '0 1.5rem', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '2.5rem', color: '#1e293b' }}>
          Built For Clothing Operations & Quick Sales
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Smartphone size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>WhatsApp-First Checkout</h3>
            <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.5 }}>
              Customers can checkout with COD or one-click confirm their order on WhatsApp with pre-filled variant & shipping details.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Size & Color Variant Stock</h3>
            <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.5 }}>
              Effortlessly track inventory by size (S, M, L, XL, Free Size) and shades (Maroon, Teal, Rani Pink). Prevent overselling with atomic stock locks.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Strict Tenant Isolation</h3>
            <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.5 }}>
              Enterprise-grade security with server-side sessions, HttpOnly cookies, and strict database query scoping per boutique owner.
            </p>
          </div>
        </div>
      </section>

      {/* Builder / Platform Contact Section */}
      <section style={{ maxWidth: '1100px', margin: '1rem auto 4rem auto', padding: '0 1.5rem', width: '100%' }}>
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '1rem',
            padding: '2.5rem 2rem',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#f43f5e', fontWeight: 800, letterSpacing: '0.08em' }}>
              Direct Builder & Custom SaaS Development
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.35rem' }}>
              Want to launch or buy a Boutique Platform for your brand?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem', maxWidth: '650px', lineHeight: 1.5 }}>
              Talk directly with the developer to launch your customized clothing ecommerce web app with WhatsApp orders, inventory sync, and Indian payment gateways.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
              <span>📞 Phone / WhatsApp: <strong style={{ color: '#ffffff' }}>+91 6290197418</strong></span>
              <span>✉️ Email: <strong style={{ color: '#ffffff' }}>abhi281500@gmail.com</strong></span>
            </div>
          </div>

          <a
            href="https://wa.me/916290197418?text=Hello%20Abhishek!%20I%20am%20interested%20in%20the%20Clothing%20Commerce%20SaaS%20platform%20for%20my%20business."
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp"
            style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', borderRadius: '0.5rem' }}
          >
            <span>Chat on WhatsApp (+91 6290197418)</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        <p>© 2026 BoutiqueSaaS • Multi-Tenant Clothing Commerce Platform</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#cbd5e1' }}>Built by Abhishek (abhi281500@gmail.com • +91 6290197418)</p>
      </footer>
    </div>
  );
}
