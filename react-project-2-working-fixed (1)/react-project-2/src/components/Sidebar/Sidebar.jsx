import React, { useState } from 'react';
import './Sidebar.css';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="filter-group accordion-item">
      <h4 onClick={() => setIsOpen(v => !v)}>{title}<span className={`arrow ${isOpen ? 'open' : ''}`}></span></h4>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}><div className="accordion-content-inner">{children}</div></div>
    </div>
  );
};

const Sidebar = ({ selectedSize, setSelectedSize }) => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2X'];
  return (
    <aside className="sidebar">
      <h3>Filters</h3>
      <div className="filter-group">
        <h4>Size</h4>
        <div className="size-buttons">
          {sizes.map(size => <button key={size} className={selectedSize === size ? 'active' : ''} onClick={() => setSelectedSize(selectedSize === size ? '' : size)}>{size}</button>)}
        </div>
      </div>
      <AccordionItem title="Availability" defaultOpen><label className="checkbox-label"><input type="checkbox" /> Availability <span>(450)</span></label><label className="checkbox-label"><input type="checkbox" /> Out Of Stock <span>(18)</span></label></AccordionItem>
      <AccordionItem title="Category"><label className="checkbox-label"><input type="checkbox" /> Men</label><label className="checkbox-label"><input type="checkbox" /> Women</label><label className="checkbox-label"><input type="checkbox" /> Kids</label></AccordionItem>
      <AccordionItem title="Colors"><label className="checkbox-label"><input type="checkbox" /> Black</label><label className="checkbox-label"><input type="checkbox" /> White</label></AccordionItem>
      <AccordionItem title="Price Range"><label className="checkbox-label"><input type="radio" name="price" /> $0 - $50</label><label className="checkbox-label"><input type="radio" name="price" /> $50 - $100</label><label className="checkbox-label"><input type="radio" name="price" /> $100+</label></AccordionItem>
      <AccordionItem title="Collections"><label className="checkbox-label"><input type="checkbox" /> Summer Collection</label><label className="checkbox-label"><input type="checkbox" /> Winter Collection</label></AccordionItem>
      <AccordionItem title="Tags"><label className="checkbox-label"><input type="checkbox" /> #New</label><label className="checkbox-label"><input type="checkbox" /> #Sale</label></AccordionItem>
      <AccordionItem title="Ratings"><label className="checkbox-label"><input type="radio" name="rating" /> 5 Stars</label><label className="checkbox-label"><input type="radio" name="rating" /> 4+ Stars</label></AccordionItem>
    </aside>
  );
};
export default Sidebar;
