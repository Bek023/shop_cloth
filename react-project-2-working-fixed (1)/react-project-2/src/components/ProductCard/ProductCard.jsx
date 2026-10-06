import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const openProduct = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <article
      className="product-card"
      onClick={openProduct}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') openProduct();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${product.title} mahsulotini ochish`}
    >
      <div className="image-container">
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span className="category">{product.category}</span>
          {product.colors && <span className="colors-count">{product.colors}</span>}
        </div>
        <div className="product-main-info">
          <h3 className="title">{product.title}</h3>
          <span className="price">{product.price}</span>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
