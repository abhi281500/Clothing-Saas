import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Store items keyed by storeSlug: { [slug]: [ { productId, variantId, name, pricePaise, quantity, size, color, image } ] }
  const [cartMap, setCartMap] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_cart');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('boutique_cart', JSON.stringify(cartMap));
    } catch (e) {
      console.error('Error saving cart to local storage', e);
    }
  }, [cartMap]);

  const getCart = (slug) => {
    return cartMap[slug] || [];
  };

  const addToCart = (slug, item) => {
    setCartMap((prev) => {
      const currentItems = prev[slug] || [];
      const itemKey = `${item.productId}-${item.variantId || 'novariant'}`;
      const existingIndex = currentItems.findIndex(
        (i) => `${i.productId}-${i.variantId || 'novariant'}` === itemKey
      );

      let updated;
      if (existingIndex > -1) {
        updated = [...currentItems];
        updated[existingIndex].quantity += item.quantity || 1;
      } else {
        updated = [...currentItems, { ...item, quantity: item.quantity || 1 }];
      }

      return { ...prev, [slug]: updated };
    });
  };

  const updateQuantity = (slug, itemKey, delta) => {
    setCartMap((prev) => {
      const currentItems = prev[slug] || [];
      const updated = currentItems
        .map((i) => {
          const key = `${i.productId}-${i.variantId || 'novariant'}`;
          if (key === itemKey) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);

      return { ...prev, [slug]: updated };
    });
  };

  const removeFromCart = (slug, itemKey) => {
    setCartMap((prev) => {
      const currentItems = prev[slug] || [];
      const updated = currentItems.filter(
        (i) => `${i.productId}-${i.variantId || 'novariant'}` !== itemKey
      );
      return { ...prev, [slug]: updated };
    });
  };

  const clearCart = (slug) => {
    setCartMap((prev) => ({ ...prev, [slug]: [] }));
  };

  const getSubtotalPaise = (slug) => {
    const items = getCart(slug);
    return items.reduce((sum, item) => sum + (item.pricePaise || 0) * (item.quantity || 1), 0);
  };

  return (
    <CartContext.Provider
      value={{
        getCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getSubtotalPaise,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
