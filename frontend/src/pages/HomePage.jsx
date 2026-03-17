import React, { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import Login from "../components/LogIn";
import Register from "../components/Register";
import CategoryFilter from "../components/CategoryFilter";
import SearchBar from "../components/SearchBar";
import { getProducts, deleteProduct } from "../services/productService";
import { useNavigate, Link } from "react-router-dom";
import '../css/HomePage.css';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('others');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [saleType, setSaleType] = useState('all');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isFirstLoad = sessionStorage.getItem('appInitialized');
    
    if (!isFirstLoad) {
      localStorage.removeItem('currentUser');
      sessionStorage.setItem('appInitialized', 'true');
    }
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchProducts = async () => {
  try {
    setLoading(true);
    const res = await getProducts();
    const activeProducts = res.data.filter(p => !p.deleted && p.status !== 'sold');
    setProducts(activeProducts);
    setLoading(false);
  } catch (err) {
    console.error("Error while trying to load products:", err);
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowLogin(false);
    alert(`Dobrodošli, ${user.ime} ${user.prezime}!`);
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowRegister(false);
    alert(`Uspešno ste se registrovali, ${user.ime} ${user.prezime}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    alert("Uspešno ste se odjavili!");
  };

  const openLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const openRegister = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const closeAuthModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setPriceFrom('');
    setPriceTo('');
    setSaleType('all');
    setLocation('');
  };

  const isAdmin = currentUser?.uloga === 'administrator';
  const isSeller = currentUser?.uloga === 'prodavac' || isAdmin;

  const getFilteredProducts = () => {
  let filtered = products;

  // ADMIN VIDI SVE PROIZVODE - NE FILTRIRA PO SELLER ID
  if (currentUser && !isAdmin) {
    if (activeTab === 'my') {
      filtered = filtered.filter(p => Number(p.sellerId) === Number(currentUser.id));
    } else if (activeTab === 'others') {
      filtered = filtered.filter(p => Number(p.sellerId) !== Number(currentUser.id));
    }
  }

  if (selectedCategory) {
    filtered = filtered.filter(p => {
      const productCategory = typeof p.category === 'object' ? p.category.name : p.category;
      return productCategory === selectedCategory;
    });
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
  }

  if (priceFrom) {
    filtered = filtered.filter(p => p.price >= Number(priceFrom));
  }
  if (priceTo) {
    filtered = filtered.filter(p => p.price <= Number(priceTo));
  }

  if (saleType !== 'all') {
    filtered = filtered.filter(p => p.saleType === saleType);
  }

  // ISPRAVKA ZA FILTRIRANJE PO LOKACIJI
  if (location.trim()) {
    const loc = location.toLowerCase();
    filtered = filtered.filter(p => {
      if (!p.location) return false;
      
      // Pretraživanje kroz sva polja lokacije
      const searchableFields = [
        p.location.city,
        p.location.country,
        p.location.street,
        p.location.postalCode,
        p.location.fullAddress
      ];
      
      return searchableFields.some(field => 
        field && field.toLowerCase().includes(loc)
      );
    });
  }

  return filtered;
};
  if (loading) return <p>Loading products...</p>;

  const filteredProducts = getFilteredProducts();

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          <span className="jo">Jo</span>
          <span className="ma">Ma</span>
          <span className="shop">Shop</span>
        </h1>
        
        <div className="user-controls">
          {currentUser ? (
            <div className="logged-user">
              <Link to={`/profile/${currentUser.id}`} className="profile-link">
                {currentUser.profilnaSlika ? (
                  <img 
                    src={`http://localhost:5000${currentUser.profilnaSlika}`} 
                    alt="Profil" 
                    className="header-profile-img"
                  />
                ) : (
                  <div className="header-profile-placeholder">
                    {currentUser.ime.charAt(0)}{currentUser.prezime.charAt(0)}
                  </div>
                )}
              </Link>
              <span className="welcome-text">
                Dobrodošli, {currentUser.ime} {currentUser.prezime} 
                ({currentUser.uloga})
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                Odjavi se
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="auth-btn login-btn" onClick={openLogin}>
                Prijavi se
              </button>
              <button className="auth-btn register-btn" onClick={openRegister}>
                Registruj se
              </button>
            </div>
          )}
        </div>
      </div>

      {/* UKLONJEN ADMIN PANEL BUTTON SA HOME PAGE */}

      <SearchBar onSearch={handleSearch} searchQuery={searchQuery} />

      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategorySelect} 
      />

      <div className="advanced-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Cena od:</label>
            <input 
              type="number" 
              placeholder="Min" 
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Cena do:</label>
            <input 
              type="number" 
              placeholder="Max" 
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Tip prodaje:</label>
            <select value={saleType} onChange={(e) => setSaleType(e.target.value)}>
              <option value="all">Sve</option>
              <option value="auction">Aukcija</option>
              <option value="fixed">Fiksna cena</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Lokacija:</label>
            <input 
              type="text" 
              placeholder="Unesite lokaciju" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button className="reset-filters-btn" onClick={resetFilters}>
            Resetuj filtere
          </button>
        </div>
      </div>

      {/* TABOVI SAMO ZA PRODAVCA - NE ZA ADMINA */}
      {currentUser && currentUser.uloga === 'prodavac' && (
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            Moji proizvodi ({products.filter(p => Number(p.sellerId) === Number(currentUser.id)).length})
          </button>
          <button 
            className={`tab ${activeTab === 'others' ? 'active' : ''}`}
            onClick={() => setActiveTab('others')}
          >
            Za kupovinu ({products.filter(p => Number(p.sellerId) !== Number(currentUser.id)).length})
          </button>
        </div>
      )}

      <div className="results-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {isAdmin ? 'Svi proizvodi' : 'Pronađeno proizvoda'}: <strong>{filteredProducts.length}</strong>
        </span>
        
        {/* DUGME ZA DODAVANJE PROIZVODA SAMO ZA PRODAVCA - NE ZA ADMINA */}
        {currentUser && currentUser.uloga === 'prodavac' && activeTab === 'my' && (
          <button
            onClick={() => navigate("/add-product")}
            style={{
              padding: '8px 20px',
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              backgroundColor: '#c71585',
              color: 'white',
              transition: '0.3s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            + Dodaj proizvod
          </button>
        )}
      </div>

      <ProductList products={filteredProducts} onDelete={handleDelete} currentUser={currentUser} />

      {showLogin && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={openRegister}
          onClose={closeAuthModals}
        />
      )}

      {showRegister && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={openLogin}
          onClose={closeAuthModals}
        />
      )}
    </div>
  );
};

export default HomePage;