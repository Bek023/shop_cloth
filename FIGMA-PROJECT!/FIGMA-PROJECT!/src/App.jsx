import React, { useState, useRef } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import LoginModal from "./LoginModal";
import "./App.css";


const HERO_IMAGES = {
  pants: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
  blackShirt:
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", 
};

const NEW_THIS_WEEK_PRODUCTS = [
  {
    id: "1",
    subCategory: "V-Neck T-Shirt",
    title: "Embroidered Seersucker Shirt",
    price: 99,
    img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600",
  },
  {
    id: "2",
    subCategory: "Cotton T-Shirt",
    title: "Basic Slim Fit T-Shirt",
    price: 99,
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600",
  },
  {
    id: "3",
    subCategory: "Henley T-Shirt",
    title: "Blurred Print T-Shirt",
    price: 99,
    img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600", 
  },
  {
    id: "4",
    subCategory: "Crewneck T-Shirt",
    title: "Full Sleeve Zipper",
    price: 99,
    img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600",
  },
];

const XIV_COLLECTIONS_PRODUCTS = [
  {
    id: "5",
    subCategory: "Cotton T-Shirt",
    title: "Basic Heavy Weight T-Shirt",
    price: 199,
    img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600", 
  },
  {
    id: "6",
    subCategory: "Cotton Jeans",
    title: "Soft Wash Straight Fit Jeans",
    price: 199,
    img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600", 
  },
  {
    id: "7",
    subCategory: "Cotton T-Shirt",
    title: "Basic Heavy Weight T-Shirt",
    price: 199,
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600",
  },
];

// 4. ИЗОБРАЖЕНИЯ ДЛЯ ГАЛЕРЕИ (OUR APPROACH TO FASHION DESIGN)
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600", 
];

function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const searchInputRef = useRef(null);

  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const query = searchQuery.trim().toLowerCase();

  const isNewThisWeekQuery =
    query !== "" &&
    ("new this week".includes(query) ||
      query.includes("new") ||
      query.includes("week"));

  const isCollectionsQuery =
    query !== "" &&
    ("xiv collections 23-24".includes(query) ||
      query.includes("collection") ||
      query.includes("xiv"));

  const filteredNewProducts = NEW_THIS_WEEK_PRODUCTS.filter((item) => {
    if (!query) return true;
    if (isNewThisWeekQuery) return true;
    if (isCollectionsQuery) return false;
    return (
      item.title.toLowerCase().includes(query) ||
      item.subCategory.toLowerCase().includes(query)
    );
  });

  const filteredCollectionProducts = XIV_COLLECTIONS_PRODUCTS.filter((item) => {
    if (!query) return true;
    if (isCollectionsQuery) return true;
    if (isNewThisWeekQuery) return false;
    return (
      item.title.toLowerCase().includes(query) ||
      item.subCategory.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-container">
      <header className="header">
        <nav className="nav-menu">
          <Link to="/" className="active">
            Home
          </Link>
          <a href="#collections">Collections</a>
          <a href="#new">Items</a>
        </nav>

        <div className="brand-logo">▲</div>

        <div className="header-icons">
          <span
            className="material-symbols-outlined icon"
            onClick={handleSearchIconClick}
          >
            search
          </span>

          <button className="cart-btn">
            <span>0/0 $</span>
            <span className="material-symbols-outlined">shopping_bag</span>
          </button>

          <span
            className="material-symbols-outlined icon"
            onClick={() => setIsLoginOpen(true)}
          >
            person
          </span>
        </div>
      </header>

      <div className="sub-header">
        <div className="categories">
          <span>MEN</span>
          <span>WOMEN</span>
          <span>KIDS</span>
        </div>

        <div className="search-bar">
          <span className="material-symbols-outlined">search</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <section className="hero-section">
        <div className="hero-left">
          <h1 className="hero-title">
            NEW
            <br />
            COLLECTION
          </h1>
          <p className="hero-subtitle">Summer / 2024</p>
          <p className="hero-tag">HOODIES</p>
          <div className="hero-controls">
            <button className="btn-black">Go To Shop →</button>
            <div className="slider-arrows">
              <button>&lt;</button>
              <button>&gt;</button>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-card">
            <img src={HERO_IMAGES.pants} alt="Light Pants" />
          </div>
          <div className="hero-card">
            <img src={HERO_IMAGES.blackShirt} alt="Black T-Shirt" />
          </div>
        </div>
      </section>

      <section className="section" id="new">
        <div className="section-title">
          <h2>
            NEW THIS WEEK <span>({filteredNewProducts.length})</span>
          </h2>
          <a href="#" className="see-all">
            See All
          </a>
        </div>

        <div className="product-grid four-cols">
          {filteredNewProducts.length > 0 ? (
            filteredNewProducts.map((item) => (
              <Link
                to={`/product/${item.id}`}
                key={item.id}
                className="product-card"
              >
                <div className="img-box">
                  <img src={item.img} alt={item.title} />
                  <button className="add-btn">+</button>
                </div>
                <span className="sub-cat">{item.subCategory}</span>
                <h3>{item.title}</h3>
                <p className="price">${item.price}</p>
              </Link>
            ))
          ) : (
            <p className="no-items">No items found</p>
          )}
        </div>
      </section>

      <section className="section" id="collections">
        <div className="section-title">
          <h2>XIV COLLECTIONS 23-24</h2>
          <div className="filter-sorts">Filters(+) / Sorts(-)</div>
        </div>

        <div className="tab-menu">
          <span className="active">(ALL)</span>
          <span>Men</span>
          <span>Women</span>
          <span>KID</span>
        </div>

        <div className="product-grid three-cols">
          {filteredCollectionProducts.length > 0 ? (
            filteredCollectionProducts.map((item) => (
              <Link
                to={`/product/${item.id}`}
                key={item.id}
                className="product-card"
              >
                <div className="img-box">
                  <img src={item.img} alt={item.title} />
                  <button className="add-btn">+</button>
                </div>
                <span className="sub-cat">{item.subCategory}</span>
                <h3>{item.title}</h3>
                <p className="price">${item.price}</p>
              </Link>
            ))
          ) : (
            <p className="no-items">No collection items found</p>
          )}
        </div>
      </section>

      <section className="about-section">
        <h2>OUR APPROACH TO FASHION DESIGN</h2>
        <p className="about-desc">
          at elegant vogue, we blend creativity with craftsmanship to create
          fashion that transcends trends and stands the test of time each design
          is meticulously crafted, ensuring the highest quality exquisite
          finish.
        </p>
        <div className="about-gallery">
          {GALLERY_IMAGES.map((src, index) => (
            <div key={index} className="gallery-card">
              <img src={src} alt={`Gallery ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>

      <footer className="footer-figma">
        <div className="footer-container">
          <div className="footer-left-col">
            <div className="footer-group">
              <span className="footer-label">INFO</span>
              <p>PRICING /</p>
              <p>ABOUT /</p>
              <p>CONTACTS</p>
            </div>

            <div className="footer-group">
              <span className="footer-label">LANGUAGES</span>
              <p>ENG /</p>
              <p>ESP /</p>
              <p>SVE</p>
            </div>
          </div>

          <div className="footer-center-col">
            <span className="footer-label">TECHNOLOGIES</span>
            <div className="footer-brand-wrap">
              <div className="footer-big-logo">
                <span className="triangle-icon">▲</span>
                <h1>
                  XIV
                  <br />
                  QR
                </h1>
              </div>
              <div className="footer-nfc-text">Near-field communication</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2024 — copyright</span>
          <span>privacy</span>
        </div>
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const allProducts = [...NEW_THIS_WEEK_PRODUCTS, ...XIV_COLLECTIONS_PRODUCTS];
  const product = allProducts.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product not found</h2>
        <Link to="/" className="btn-black">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container product-detail-container">
      <Link to="/" className="btn-black back-btn">
        ← Back to Catalog
      </Link>
      <div className="product-detail-wrapper">
        <img src={product.img} alt={product.title} className="detail-img" />
        <div>
          <span className="sub-cat">{product.subCategory}</span>
          <h1 className="product-detail-title">{product.title}</h1>
          <h2 className="product-detail-price">${product.price}</h2>
          <p className="product-detail-desc">
            Dynamic Product Page. ID: <strong>{id}</strong>.
          </p>
          <button className="btn-black">Add To Bag</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
    </Routes>
  );
}
