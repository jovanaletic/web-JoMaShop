import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageCarousel from "./ImageCarousel";
import { getBidsForProduct } from "../services/orderService";
import '../css/ProductList.css';

const ProductList = ({ products, onDelete, currentUser }) => {
  const [productsWithBids, setProductsWithBids] = useState({});

  useEffect(() => {
    checkAuctionBids();
  }, [products]);

  const checkAuctionBids = async () => {
    const bidsStatus = {};
    
    for (const product of products) {
      if (product.saleType === 'auction') {
        try {
          const response = await getBidsForProduct(product.id);
          const bidsData = response?.data?.data || response?.data || [];
          bidsStatus[product.id] = bidsData.length > 0;
        } catch (error) {
          console.error(`Error checking bids for product ${product.id}:`, error);
          bidsStatus[product.id] = false;
        }
      }
    }
    
    setProductsWithBids(bidsStatus);
  };

  const canEditProduct = (product) => {
    if (!currentUser) return false;
    // ADMIN NE MOŽE EDITOVATI/BRISATI
    if (currentUser.uloga === 'administrator') return false;
    if (Number(currentUser.id) !== Number(product.sellerId)) return false;
    
    // AKO JE AUKCIJA I IMA PONUDE, NE MOŽE SE IZMENITI
    if (product.saleType === 'auction' && productsWithBids[product.id]) {
      return false;
    }
    
    return true;
  };

  const handleEditClick = (e, product) => {
    if (product.saleType === 'auction' && productsWithBids[product.id]) {
      e.preventDefault();
      alert('Ne možete izmeniti aukciju koja već ima ponude!');
    }
  };

  return (
    <div className="product-list-header">
      <h1>Proizvodi</h1>
      <div className="product-grid">
        {products.length === 0 ? (
          <p>Nema dostupnih proizvoda.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-image-container">
                <ImageCarousel images={p.images || []} height="200px" />
              </div>
              
              <div className="product-card-content">
                <h3 className="product-name">{p.name}</h3>
                <p className="product-description">{p.description}</p>
                
                <div className="product-info">
                  <span className="product-category">{p.category.name}</span>
                  <span className="product-price">{p.price} RSD</span>
                </div>
                
                {p.location && p.location.city && p.location.country && (
                  <div className="product-location-badge">
                    <span className="location-icon">📍</span>
                    <span className="location-text">
                      {p.location.city}, {p.location.country}
                    </span>
                  </div>
                )}
                
                <div className="product-meta">
                  <span className="product-sale-type">
                    {p.saleType === 'fixed' ? 'Fiksna cena' : 'Aukcija'}
                  </span>
                  <span className={`product-status ${p.status}`}>
                    {p.status === 'active' ? 'Aktivan' : p.status === 'sold' ? 'Prodat' : p.status}
                  </span>
                </div>
                
                <div className="product-actions">
                  {currentUser && 
                   currentUser.uloga !== 'administrator' && 
                   Number(currentUser.id) === Number(p.sellerId) && (
                    <>
                      <Link 
                        to={`/edit/${p.id}`} 
                        className={`action-btn edit-btn ${
                          p.saleType === 'auction' && productsWithBids[p.id] ? 'disabled' : ''
                        }`}
                        onClick={(e) => handleEditClick(e, p)}
                        style={{
                          opacity: p.saleType === 'auction' && productsWithBids[p.id] ? 0.5 : 1,
                          cursor: p.saleType === 'auction' && productsWithBids[p.id] ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Izmeni
                        {p.saleType === 'auction' && productsWithBids[p.id] && ' 🔒'}
                      </Link>
                      <button onClick={() => onDelete(p.id)} className="action-btn delete-btn">
                        Obriši
                      </button>
                    </>
                  )}
                  <Link to={`/products/${p.id}`} className="action-btn details-btn">
                    Detalji
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;