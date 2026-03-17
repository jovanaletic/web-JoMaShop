import React, { useState } from 'react';
import '../css/SearchBar.css';

const SearchBar = ({ onSearch, searchQuery }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(localQuery);
  };

  const handleChange = (e) => {
    setLocalQuery(e.target.value);
    // Opciono: live search dok korisnik kuca
    onSearch(e.target.value);
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Pretražite proizvode po nazivu ili opisu..."
          value={localQuery}
          onChange={handleChange}
        />
        <button type="submit" className="search-button">
          🔍 Pretraži
        </button>
      </form>
    </div>
  );
};

export default SearchBar;