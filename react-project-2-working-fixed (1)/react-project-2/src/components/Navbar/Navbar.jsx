import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiUser, FiMenu } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { itemCount } = useCart();
  return (
    <nav className="navbar">
      <div className="nav-left">
        <FiMenu className="menu-icon" />
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/collections" className="nav-link">Collections</Link>
        <Link to="/new" className="nav-link">New</Link>
      </div>
      <Link to="/" className="nav-logo" aria-label="Home"><div className="triangle-logo"></div></Link>
      <div className="nav-right">
        <button className="icon-btn" aria-label="Wishlist"><FiHeart /></button>
        <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${itemCount} items`}>
          <span>Cart{itemCount > 0 ? ` (${itemCount})` : ''}</span>
          <div className="cart-icon-wrapper"><FiShoppingCart /></div>
        </Link>
        <button className="icon-btn" aria-label="Account"><FiUser /></button>
      </div>
    </nav>
  );
};
export default Navbar;
