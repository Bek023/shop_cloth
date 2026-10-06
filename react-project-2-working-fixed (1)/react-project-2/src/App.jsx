import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Products from './pages/Products/Products';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Navbar from './components/Navbar/Navbar';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/collections" element={<Products />} />
        <Route path="/new" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="*" element={<Products />} />
      </Routes>
    </div>
  );
}
export default App;
