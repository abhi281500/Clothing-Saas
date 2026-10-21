import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { formatINR } from '../../utils/format';
import {
  Shirt,
  ShoppingBag,
  IndianRupee,
  Clock,
  ExternalLink,
  Plus,
  CheckCircle,
  Truck,
  Package,
} from 'lucide-react';

export default function Dashboard() {
  const { store } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const storeUrl = store ? `${window.location.origin}/store/${store.slug}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div style={{ color: '#64748b' }}>Loading dashboard metrics...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner / Store Link Callout */}
      <div
        className="card"
        style={{
          backgroundColor: '#fff1f2',
          borderColor: '#fecdd3',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9f1239' }}>
            Welcome, {store?.name}!
          </h2>
          <p style={{ color: '#be123c', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Your live public storefront is active and ready to receive customer orders.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleCopyLink} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}>
            {copied ? '✓ Copied Link' : 'Copy Store Link'}
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            <span>Visit Storefront</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Total Revenue</span>
            <div style={{ padding: '0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.5rem' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.75rem' }}>
            {formatINR(stats?.totalRevenuePaise || 0)}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>From fulfilled orders</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Total Orders</span>
            <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '0.5rem' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.75rem' }}>
            {stats?.totalOrders || 0}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>All-time customer checkouts</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Active Products</span>
            <div style={{ padding: '0.5rem', backgroundColor: '#ffe4e6', color: '#e11d48', borderRadius: '0.5rem' }}>
              <Shirt size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.75rem' }}>
            {stats?.totalProducts || 0}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>In your boutique catalog</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Pending Orders</span>
            <div style={{ padding: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '0.5rem' }}>
              <Clock size={18} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.75rem' }}>
            {stats?.statusCounts?.PENDING || 0}
          </p>
          <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>Needs fulfillment</span>
        </div>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Recent Orders</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Latest customer purchases</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/seller/products" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.8rem' }}>
              <Plus size={15} />
              <span>Add Product</span>
            </Link>
            <Link to="/seller/orders" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.8rem' }}>
              <span>View All Orders</span>
            </Link>
          </div>
        </div>

        {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <ShoppingBag size={40} style={{ margin: '0 auto 0.75rem auto', strokeWidth: 1.5 }} />
            <p style={{ fontWeight: 600, color: '#475569' }}>No orders yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Share your store link on WhatsApp and Instagram to receive your first order!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Order #</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Items</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Total</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((ord) => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#e11d48' }}>
                      <Link to={`/seller/orders`}>{ord.orderNumber}</Link>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{ord.customer?.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{ord.customer?.phone}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{ord.items?.length || 0} item(s)</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>
                      {formatINR(ord.financials?.totalPaise || 0)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge badge-${ord.orderStatus.toLowerCase()}`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
