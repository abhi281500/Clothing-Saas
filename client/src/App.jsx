import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

// Pages & Layouts
import Home from './pages/Home.jsx';
import Login from './pages/seller/Login.jsx';
import Register from './pages/seller/Register.jsx';
import SellerLayout from './components/SellerLayout.jsx';
import Dashboard from './pages/seller/Dashboard.jsx';
import Products from './pages/seller/Products.jsx';
import Promotions from './pages/seller/Promotions.jsx';
import Orders from './pages/seller/Orders.jsx';
import Discounts from './pages/seller/Discounts.jsx';
import Settings from './pages/seller/Settings.jsx';

import StorefrontLayout from './components/StorefrontLayout.jsx';
import StoreCatalog from './pages/storefront/StoreCatalog.jsx';
import ProductDetail from './pages/storefront/ProductDetail.jsx';
import CartCheckout from './pages/storefront/CartCheckout.jsx';
import OrderSuccess from './pages/storefront/OrderSuccess.jsx';
import OrderTrack from './pages/storefront/OrderTrack.jsx';

const isCustomDomainHost = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (!host) return false;
  return !(
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.onrender.com')
  );
};

export default function App() {
  const isCustomDomain = isCustomDomainHost();

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {isCustomDomain ? (
              /* Custom Domain: Storefront is rendered directly at root / */
              <Route path="/" element={<StorefrontLayout />}>
                <Route index element={<StoreCatalog />} />
                <Route path="products/:productSlug" element={<ProductDetail />} />
                <Route path="cart" element={<CartCheckout />} />
                <Route path="order-success/:orderNumber" element={<OrderSuccess />} />
                <Route path="track" element={<OrderTrack />} />
              </Route>
            ) : (
              /* Main Platform: SaaS Marketing Landing Page at root / */
              <Route path="/" element={<Home />} />
            )}

            {/* Seller Auth */}
            <Route path="/seller/login" element={<Login />} />
            <Route path="/seller/register" element={<Register />} />

            {/* Seller Dashboard (Protected) */}
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<Navigate to="/seller/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="orders" element={<Orders />} />
              <Route path="discounts" element={<Discounts />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Public Boutique Storefront for standard /store/:slug */}
            <Route path="/store/:slug" element={<StorefrontLayout />}>
              <Route index element={<StoreCatalog />} />
              <Route path="products/:productSlug" element={<ProductDetail />} />
              <Route path="cart" element={<CartCheckout />} />
              <Route path="order-success/:orderNumber" element={<OrderSuccess />} />
              <Route path="track" element={<OrderTrack />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
