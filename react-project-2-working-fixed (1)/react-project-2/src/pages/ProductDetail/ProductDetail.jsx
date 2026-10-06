import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { productsData } from '../../data/products';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = productsData.find((item) => String(item.id) === String(productId));
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="product-detail-page not-found">
        <button className="back-button" onClick={() => navigate('/')}>
          <FiArrowLeft /> Orqaga
        </button>
        <h1>Mahsulot topilmadi</h1>
        <p>Bu mahsulot mavjud emas yoki o‘chirib yuborilgan.</p>
      </main>
    );
  }

  const increase = () => setQuantity((value) => value + 1);
  const decrease = () => setQuantity((value) => Math.max(1, value - 1));

  const handleAdd = () => {
    addToCart(product, selectedSize, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <main className="product-detail-page">
      <div className="detail-breadcrumb">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Products</span>
        </button>
        <span>/</span>
        <span>{product.title}</span>
      </div>

      <section className="product-detail">
        <div className="detail-image-wrap">
          <img src={product.image} alt={product.title} className="detail-image" />
        </div>

        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          <h1>{product.title}</h1>
          <div className="detail-price">{product.price}</div>

          <div className="detail-divider" />

          <p className="detail-description">
            Kundalik foydalanish uchun yaratilgan zamonaviy va qulay mahsulot.
            Sifatli material, toza dizayn va qulay fason birlashtirilgan.
          </p>

          <div className="detail-option">
            <div className="option-heading">
              <span>Size</span>
              <span className="selected-option">{selectedSize}</span>
            </div>
            <div className="size-list">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={selectedSize === size ? 'size-button active' : 'size-button'}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-option quantity-option">
            <span className="option-heading">Quantity</span>
            <div className="quantity-control">
              <button onClick={decrease} aria-label="Kamaytirish"><FiMinus /></button>
              <span>{quantity}</span>
              <button onClick={increase} aria-label="Ko‘paytirish"><FiPlus /></button>
            </div>
          </div>

          <button className="add-button" onClick={handleAdd}>
            {added ? <><FiCheck /> Added</> : <><FiShoppingBag /> Add to bag</>}
          </button>

          <div className="detail-features">
            <div><strong>Category</strong><span>{product.category}</span></div>
            <div><strong>Available sizes</strong><span>{product.sizes.join(', ')}</span></div>
            <div><strong>Collection</strong><span>{product.tags.join(' · ')}</span></div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProductDetail;
