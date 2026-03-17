import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/CategoryFilter.css';

import allProductsIcon from '../assets/category-icons/all-products.png';
import othersIcon from '../assets/category-icons/others.png';

const getCategoryIcon = (categoryName) => {
  if (categoryName === 'Svi proizvodi') {
    return allProductsIcon;
  }
  
  try {
    const iconMap = {
      'Elektronika': 'electronics.png',
      'Knjige': 'books.png',
      'Garderoba': 'clothing.png',
      'Igračke': 'toys-and-games.png',
      'Kuća': 'home.png',
      'Obuća': 'shoes.png',
      'Modni detalji': 'accessories.png',
      'Bašta i dvorište': 'garden.png',
      'Automobili': 'car.png',
      'Kućni ljubimci': 'pets.png',
      'Kuhinjski aparati': 'kitchen-appliances.png',
      'Kupatilo': 'bathroom-appliances.png',
      'Nameštaj': 'furniture.png',
      'Muzički instrumenti': 'musical-instruments.png',
      'Sport': 'sports.png',
      'Škola': 'school.png',
      'Umetnost': 'art.png',
      'Bebe i deca': 'babies-and-kids.png',
      'Muzika i filmovi': 'music-and-movies.png',
    };
    
    const fileName = iconMap[categoryName];
    if (fileName) {
      return require(`../assets/category-icons/${fileName}`);
    }
  } catch (error) {
    console.error(`Icon not found for ${categoryName}:`, error);
  }
  return null;
};

const DEFAULT_CATEGORIES = [
  'Elektronika', 'Knjige', 'Garderoba', 'Igračke', 
  'Kuća', 'Obuća', 'Modni detalji', 'Bašta i dvorište', 'Automobili', 
  'Kućni ljubimci', 'Kuhinjski aparati', 'Kupatilo', 
  'Nameštaj', 'Muzički instrumenti', 'Sport', 
  'Škola', 'Umetnost', 'Bebe i deca', 'Muzika i filmovi'
];

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  const [categories, setCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/categories');
      const allCategories = response.data;
      
      
      const serbianCollator = new Intl.Collator('sr-Latn-RS');
      
      const defaultCats = allCategories.filter(cat => 
        DEFAULT_CATEGORIES.includes(cat.name)
      ).sort((a, b) => serbianCollator.compare(a.name, b.name));
      
      const customCats = allCategories.filter(cat => 
        !DEFAULT_CATEGORIES.includes(cat.name)
      ).sort((a, b) => serbianCollator.compare(a.name, b.name));
      
      setCategories(defaultCats);
      setCustomCategories(customCats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      const serbianCollator = new Intl.Collator('sr-Latn-RS');
      const sortedDefaults = DEFAULT_CATEGORIES
        .map(name => ({ name }))
        .sort((a, b) => serbianCollator.compare(a.name, b.name));
      setCategories(sortedDefaults);
      setCustomCategories([]);
    }
  };

  fetchCategories();
}, []);

  const handleCategoryClick = (categoryName) => {
    if (categoryName === 'Svi proizvodi') {
      onSelectCategory(null);
    } else if (selectedCategory === categoryName) {
      onSelectCategory(null);
    } else {
      onSelectCategory(categoryName);
    }
    setShowCustomDropdown(false);
  };

  const handleOthersClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 5,
      left: rect.left + rect.width / 2
    });
    setShowCustomDropdown(!showCustomDropdown);
  };

  const handleCustomCategorySelect = (categoryName) => {
    onSelectCategory(categoryName);
    setShowCustomDropdown(false);
  };

  return (
    <div className="category-filter-container">
      <h3 className="category-title">Kategorije</h3>
      <div className="category-wrapper">
        <div
          className={`category-item fixed-category ${!selectedCategory ? 'selected' : ''}`}
          onClick={() => handleCategoryClick('Svi proizvodi')}
        >
          <div className="category-icon">
            {allProductsIcon ? (
              <img src={allProductsIcon} alt="Svi proizvodi" />
            ) : (
              <div className="placeholder-icon">✨</div>
            )}
          </div>
          <span className="category-name">Svi proizvodi</span>
        </div>

        <div className="category-scroll-wrapper">
          <div className="category-grid">
            {categories.map((category) => {
              const iconSrc = getCategoryIcon(category.name);
              const isSelected = selectedCategory === category.name;
              
              return (
                <div
                  key={category.name}
                  className={`category-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <div className="category-icon">
                    {iconSrc ? (
                      <img 
                        src={iconSrc} 
                        alt={category.name}
                      />
                    ) : (
                      <div className="placeholder-icon">{category.name.charAt(0)}</div>
                    )}
                  </div>
                  <span className="category-name">{category.name}</span>
                </div>
              );
            })}

            {customCategories.length > 0 && (
              <div className="others-category">
                <div 
                  className={`category-item ${customCategories.some(cat => cat.name === selectedCategory) ? 'selected' : ''}`}
                  onClick={handleOthersClick}
                >
                  <div className="category-icon">
                    {othersIcon ? (
                      <img src={othersIcon} alt="Ostalo" />
                    ) : (
                      <div className="placeholder-icon">📦</div>
                    )}
                  </div>
                  <span className="category-name">Ostalo</span>
                  <span className="dropdown-arrow">{showCustomDropdown ? '▲' : '▼'}</span>
                </div>

                {showCustomDropdown && (
                  <div 
                    className="custom-category-dropdown-simple"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {customCategories.map((category) => (
                      <div
                        key={category.name}
                        className={`dropdown-item ${selectedCategory === category.name ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomCategorySelect(category.name);
                        }}
                      >
                        {category.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;