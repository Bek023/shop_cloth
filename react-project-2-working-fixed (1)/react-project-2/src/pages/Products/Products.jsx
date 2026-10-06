import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import ProductList from '../../components/ProductList/ProductList';
import { FiSearch } from 'react-icons/fi';
import { productsData } from '../../data/products';
import './Products.css';

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const location = useLocation();
  const initialTag = location.pathname === '/new' ? 'NEW' : '';
  const [selectedTag, setSelectedTag] = useState(initialTag);
  useEffect(() => { setSelectedTag(location.pathname === '/new' ? 'NEW' : ''); }, [location.pathname]);

  const tagsList = ["NEW", "SHIRTS", "POLO SHIRTS", "SHORTS", "BEST SELLERS", "T-SHIRTS", "JEANS", "JACKETS"];

  const filteredProducts = productsData.filter((product) => {
    const matchSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSize = selectedSize ? product.sizes.includes(selectedSize) : true;
    const matchTag = selectedTag ? product.tags.includes(selectedTag) : true;
    return matchSearch && matchSize && matchTag;
  });

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="breadcrumbs">Home / Collections</div>
        <h1>COLLECTIONS</h1>
      </div>
      
      <div className="main-content">
        <div className="sidebar-section">
          <Sidebar selectedSize={selectedSize} setSelectedSize={setSelectedSize} />
        </div>
        
        <div className="products-section">
          <div className="top-filters">
            <div className="search-bar">
               <FiSearch className="search-icon" />
               <input 
                 type="text" 
                 placeholder="Search" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="tags">
              {tagsList.map(tag => (
                <button 
                  key={tag}
                  className={selectedTag === tag ? 'active' : ''}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <ProductList products={filteredProducts} />
        </div>
      </div>
    </div>
  );
};

export default Products;