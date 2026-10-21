import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { formatINR, formatDate } from '../../utils/format';
import { ShoppingCart, MessageCircle, Truck, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await api.getOrders(query);
      if (res.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setStatusUpdateLoading(true);
      setActionError('');
      const res = await api.updateOrderStatus(orderId, { status: newStatus });
      if (res.success) {
        setSelectedOrder(res.data);
        loadOrders();
      }
    } catch (err) {
      setActionError(err.message || 'Status transition failed');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const openWhatsAppCustomer = (order) => {
    const phone = (order.customer?.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi ${order.customer?.name}, this is regarding your order #${order.orderNumber} for ${formatINR(
        order.financials?.totalPaise || 0
      )}. Current status: ${order.orderStatus}. Thank you for shopping with us!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Orders & Fulfillment</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Track boutique purchases, customer deliveries, and manage status transitions
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <ShoppingCart size={48} style={{ margin: '0 auto 1rem auto', strokeWidth: 1.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>No orders found</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              When shoppers checkout from your public storefront, their orders will show up here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Items</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#e11d48' }}>
                      {ord.orderNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.825rem' }}>
                      {formatDate(ord.createdAt)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <p style={{ fontWeight: 600 }}>{ord.customer?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{ord.customer?.phone}</p>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      {ord.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem' }}>
                          {item.quantity}x {item.productName} ({item.size}/{item.color})
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      {formatINR(ord.financials?.totalPaise || 0)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge badge-${ord.orderStatus.toLowerCase()}`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openWhatsAppCustomer(ord)}
                          className="btn-whatsapp"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Message Customer on WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        >
                          Manage
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

      {/* Order Detail & State Transition Modal */}
      {selectedOrder && (
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Order #{selectedOrder.orderNumber}</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Placed on {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ padding: '0.35rem 0.65rem' }}>
                Close
              </button>
            </div>

            {actionError && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}

            {/* Status & Transition Controls */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Current Status:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className={`badge badge-${selectedOrder.orderStatus.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                  {selectedOrder.orderStatus}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  (Payment: {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus})
                </span>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedOrder.orderStatus === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'CONFIRMED')}
                      disabled={statusUpdateLoading}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'CANCELLED')}
                      disabled={statusUpdateLoading}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: '#e11d48' }}
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                {selectedOrder.orderStatus === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'SHIPPED')}
                      disabled={statusUpdateLoading}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      Mark Shipped
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'CANCELLED')}
                      disabled={statusUpdateLoading}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: '#e11d48' }}
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                {selectedOrder.orderStatus === 'SHIPPED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'DELIVERED')}
                    disabled={statusUpdateLoading}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', backgroundColor: '#16a34a' }}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Customer & Delivery Info</h3>
              <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                <p><strong>Name:</strong> {selectedOrder.customer?.name}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer?.phone}</p>
                <p><strong>Address:</strong> {selectedOrder.customer?.shippingAddress?.addressLine}, {selectedOrder.customer?.shippingAddress?.city}, {selectedOrder.customer?.shippingAddress?.state} - {selectedOrder.customer?.shippingAddress?.pincode}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Purchased Items Snapshot</h3>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.productName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {formatINR(item.subtotalPaise)}
                    </span>
                  </div>
                ))}
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total Amount</span>
                  <span>{formatINR(selectedOrder.financials?.totalPaise || 0)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
