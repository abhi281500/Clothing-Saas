import React from 'react';
import { useParams, useLocation, useOutletContext, Link } from 'react-router-dom';
import { formatINR } from '../../utils/format';
import { CheckCircle2, MessageCircle, ArrowRight, ShoppingBag, Truck } from 'lucide-react';

export default function OrderSuccess() {
  const { slug, orderNumber } = useParams();
  const { store } = useOutletContext();
  const location = useLocation();

  const order = location.state?.order;
  const primaryColor = store.branding?.primaryColor || '#e11d48';

  const handleWhatsAppConfirm = () => {
    const phone = (store.whatsappNumber || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${store.name}! I have placed Order *#${orderNumber}* on your boutique store for *${
        order ? formatINR(order.financials?.totalPaise || 0) : 'my order'
      }*. Please confirm the dispatch!`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#16a34a', marginBottom: '1.25rem' }}>
          <CheckCircle2 size={44} />
        </div>

        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#1c1917' }}>
          Thank You! Your Order is Placed
        </h1>

        <p style={{ color: '#78716c', marginTop: '0.5rem', fontSize: '1rem' }}>
          Order reference: <strong style={{ color: '#1c1917' }}>#{orderNumber}</strong>
        </p>

        <div style={{ margin: '2rem 0', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
            What happens next?
          </h3>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
            <li>{store.name} will prepare your items for packaging and dispatch.</li>
            <li>You will receive courier tracking updates on your WhatsApp phone number.</li>
            <li>Cash on Delivery payment will be collected at your doorstep.</li>
          </ul>
        </div>

        {/* WhatsApp confirmation CTA */}
        {store.whatsappNumber && (
          <button
            onClick={handleWhatsAppConfirm}
            className="btn-whatsapp"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', marginBottom: '1rem' }}
          >
            <MessageCircle size={20} />
            <span>Confirm Order on WhatsApp with Seller</span>
          </button>
        )}

        <Link
          to={`/store/${slug}`}
          className="btn-secondary"
          style={{ width: '100%', padding: '0.75rem' }}
        >
          <ShoppingBag size={18} />
          <span>Continue Shopping</span>
        </Link>
      </div>

    </div>
  );
}
