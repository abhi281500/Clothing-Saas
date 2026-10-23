import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages & Layouts
import Home from './pages/Home';
import Login from './pages/seller/Login';
import Register from './pages/seller/Register';
import SellerLayout from './components/SellerLayout';
import Dashboard from './pages/seller/Dashboard';
import Products from './pages/seller/Products';
import Promotions from './pages/seller/Promotions';
import Orders from './pages/seller/Orders';
import Discounts from './pages/seller/Discounts';
import Settings from './pages/seller/Settings';

import StorefrontLayout from './components/StorefrontLayout';
import StoreCatalog from './pages/storefront/StoreCatalog';
import ProductDetail from './pages/storefront/ProductDetail';
import CartCheckout from './pages/storefront/CartCheckout';
import OrderSuccess from './pages/storefront/OrderSuccess';
import OrderTrack from './pages/storefront/OrderTrack';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Home />} />

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

            {/* Public Boutique Storefront */}
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
