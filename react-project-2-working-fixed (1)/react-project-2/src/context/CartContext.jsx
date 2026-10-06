import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cloth-store-cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, size, quantity = 1) => {
    setCartItems(current => {
      const key = `${product.id}-${size}`;
      const existing = current.find(item => item.key === key);
      if (existing) {
        return current.map(item => item.key === key
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }
      return [...current, {
        key, id: product.id, title: product.title, category: product.category,
        image: product.image, price: product.price, size, quantity
      }];
    });
  };

  const updateQuantity = (key, quantity) => {
    setCartItems(current => quantity <= 0
      ? current.filter(item => item.key !== key)
      : current.map(item => item.key === key ? { ...item, quantity } : item));
  };

  const removeFromCart = key => setCartItems(current => current.filter(item => item.key !== key));
  const clearCart = () => setCartItems([]);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + parseFloat(String(item.price).replace(/[^0-9.]/g, '')) * item.quantity, 0);

  const value = useMemo(() => ({ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, itemCount, total }), [cartItems, itemCount, total]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};
