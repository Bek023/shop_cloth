import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, total } = useCart();

  return (
    <main className="cart-page">
      <div className="cart-header">
        <div>
          <Link to="/" className="back-link"><FiArrowLeft /> Continue shopping</Link>
          <h1>Your Cart</h1>
        </div>
        {cartItems.length > 0 && <button className="clear-cart" onClick={clearCart}>Clear cart</button>}
      </div>

      {cartItems.length === 0 ? (
        <section className="empty-cart">
          <FiShoppingBag />
          <h2>Your cart is empty</h2>
          <p>Add products from the catalog to see them here.</p>
          <Link to="/" className="shop-button">Shop products</Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            {cartItems.map(item => (
              <article className="cart-item" key={item.key}>
                <Link to={`/products/${item.id}`} className="cart-image">
                  <img src={item.image} alt={item.title} />
                </Link>
                <div className="cart-item-info">
                  <div>
                    <span className="cart-category">{item.category}</span>
                    <Link to={`/products/${item.id}`} className="cart-title">{item.title}</Link>
                    <span className="cart-size">Size: {item.size}</span>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-qty">
                      <button onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label="Decrease"><FiMinus /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label="Increase"><FiPlus /></button>
                    </div>
                    <strong>${(parseFloat(String(item.price).replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</strong>
                    <button className="remove-btn" onClick={() => removeFromCart(item.key)} aria-label="Remove"><FiTrash2 /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Summary</h2>
            <div><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div>
            <div><span>Shipping</span><span>Calculated at checkout</span></div>
            <div className="summary-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            <button className="checkout-button" onClick={() => alert('Checkout is ready to be connected.')}>Checkout</button>
          </aside>
        </section>
      )}
    </main>
  );
};
export default Cart;
