import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/format';
import { ShoppingBag, MessageCircle, ArrowLeft, Check, ShieldCheck, Truck } from 'lucide-react';

export default function ProductDetail() {
  const { slug, productSlug } = useParams();
  const { store } = useOutletContext();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.getStoreProduct(slug, productSlug);
        if (res.success) {
          const prod = res.data.product;
          setProduct(prod);
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }
        }
      } catch (err) {
        setError(err.message || 'Product could not be found');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug, productSlug]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#78716c' }}>Loading item details...</div>;
  }

  if (error || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }} className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e11d48' }}>Product Not Found</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: '1.5rem' }}>{error}</p>
        <Link to={`/store/${slug}`} className="btn-primary">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const primaryColor = store.branding?.primaryColor || '#e11d48';

  const currentPricePaise = product.basePricePaise + (selectedVariant?.priceDifferencePaise || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : product.totalStock;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(slug, {
      productId: product._id,
      variantId: selectedVariant?._id,
      name: product.name,
      pricePaise: currentPricePaise,
      quantity,
      size: selectedVariant?.size || 'Free Size',
      color: selectedVariant?.color || 'Default',
      image: product.images && product.images[0] ? product.images[0] : '',
    });

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate(`/store/${slug}/cart`);
  };

  const handleWhatsAppInquiry = () => {
    const phone = (store.whatsappNumber || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${store.name}! I am interested in purchasing:\n\n*${product.name}*\nSize: ${
        selectedVariant?.size || 'Free Size'
      }\nColor: ${selectedVariant?.color || 'Default'}\nPrice: ${formatINR(
        currentPricePaise
      )}\nLink: ${window.location.href}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Back button */}
      <div>
        <Link
          to={`/store/${slug}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#78716c', fontSize: '0.875rem', fontWeight: 500 }}
        >
          <ArrowLeft size={16} />
          <span>Back to Collection</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', backgroundColor: '#ffffff', padding: '2rem', borderRadius: '1rem', border: '1px solid #f0eee9' }}>
        
        {/* Product Image */}
        <div style={{ width: '100%', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: '#f5f5f4', aspectRatio: '3/4' }}>
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#a8a29e' }}>
              No image available
            </div>
          )}
        </div>

        {/* Product Details & Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a8a29e', fontWeight: 600 }}>
              {product.category}
            </span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1c1917', marginTop: '0.25rem', lineHeight: 1.25 }}>
              {product.name}
            </h1>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1c1917' }}>
                {formatINR(currentPricePaise)}
              </span>
              {product.compareAtPricePaise > currentPricePaise && (
                <span style={{ fontSize: '1.1rem', color: '#a8a29e', textDecoration: 'line-through' }}>
                  {formatINR(product.compareAtPricePaise)}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, backgroundColor: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                Inclusive of all taxes
              </span>
            </div>

            {/* Size & Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#44403c' }}>
                    Select Size & Shade:
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: currentStock > 0 ? '#166534' : '#991b1b' }}>
                    {currentStock > 0 ? `${currentStock} available in stock` : 'Out of Stock'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?._id === v._id;
                    return (
                      <button
                        key={v._id}
                        onClick={() => setSelectedVariant(v)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          borderRadius: '0.375rem',
                          border: isSelected ? `2px solid ${primaryColor}` : '1px solid #e7e5e4',
                          backgroundColor: isSelected ? '#fff1f2' : '#ffffff',
                          color: isSelected ? primaryColor : '#1c1917',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        {v.size} {v.color && v.color !== 'Default' ? `(${v.color})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#44403c', marginBottom: '0.5rem' }}>
                Quantity:
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e7e5e4', borderRadius: '0.375rem' }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: '0.4rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                >
                  -
                </button>
                <span style={{ padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.9rem' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => (currentStock ? Math.min(currentStock, q + 1) : q + 1))}
                  style={{ padding: '0.4rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {addedAnimation ? <Check size={18} color="#16a34a" /> : <ShoppingBag size={18} />}
                  <span>{addedAnimation ? 'Added to Bag!' : 'Add to Bag'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="btn-primary"
                  style={{ flex: 1, backgroundColor: primaryColor, padding: '0.75rem' }}
                >
                  <span>{isOutOfStock ? 'Out of Stock' : 'Buy Now'}</span>
                </button>
              </div>

              {store.whatsappNumber && (
                <button
                  onClick={handleWhatsAppInquiry}
                  className="btn-whatsapp"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <MessageCircle size={18} />
                  <span>Enquire / Order on WhatsApp</span>
                </button>
              )}
            </div>

            {/* Guarantees & Perks */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #f0eee9', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#78716c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={16} color="#16a34a" />
                <span>Cash on Delivery (COD) available across India</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#16a34a" />
                <span>Direct boutique seller guarantee & authentic craftsmanship</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #f0eee9', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1c1917' }}>
                Product Description & Fabric Details
              </h3>
              <p style={{ color: '#57534e', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {product.description}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
