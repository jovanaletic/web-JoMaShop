import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProduct } from "../services/productService";
import { 
  buyFixedPriceProduct, 
  placeBid, 
  getBidsForProduct,
  getHighestBidForProduct
} from '../services/orderService';
import { getReviewsBySeller } from '../services/reviewService';
import { getUserById } from '../services/userService';
import ImageCarousel from './ImageCarousel';
import LocationMap from './LocationMap';
import '../css/ProductPage.css'; 

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [bids, setBids] = useState([]);
  const [highestBid, setHighestBid] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isAdmin = currentUser?.uloga === 'administrator';

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchSellerInfo = async (sellerId) => {
    try {
      const response = await getUserById(sellerId);
      setSeller(response.data);
    } catch (error) {
      console.error('Error fetching seller info:', error);
    }
  };

  const fetchSellerReviews = async (sellerId) => {
    try {
      const response = await getReviewsBySeller(sellerId);
      if (response.data && response.data.data) {
        setReviews(response.data.data.reviews);
        setAverageRating(response.data.data.averageRating);
        setTotalReviews(response.data.data.totalReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await getProduct(id);
      if (!res.data) {
        setError('Proizvod nije pronađen');
        return;
      }
      
      setProduct(res.data);
      
      if (res.data.sellerId) {
        await fetchSellerInfo(res.data.sellerId);
        await fetchSellerReviews(res.data.sellerId);
      }
      
      if (res.data.saleType === 'auction') {
        await fetchBids();
        await fetchHighestBid();
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError('Greška pri učitavanju proizvoda');
    }
  };

  const fetchBids = async () => {
    try {
      const response = await getBidsForProduct(id);
      let bidsData = [];
      if (response?.data) {
        if (response.data.data) {
          bidsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          bidsData = response.data;
        }
      }
      setBids(bidsData);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setBids([]);
    }
  };

  const fetchHighestBid = async () => {
    try {
      const response = await getHighestBidForProduct(id);
      let highestBidData = null;
      if (response?.data) {
        if (response.data.data) {
          highestBidData = response.data.data;
        } else {
          highestBidData = response.data;
        }
      }
      setHighestBid(highestBidData);
    } catch (error) {
      console.error('Error fetching highest bid:', error);
      setHighestBid(null);
    }
  };

  const handleFixedPricePurchase = async () => {
    if (!currentUser) {
      alert('Molimo prijavite se da biste kupili proizvod');
      return;
    }

    if (isAdmin) {
      alert('Administratori ne mogu kupovati proizvode');
      return;
    }

    if (currentUser.id === product.sellerId) {
      alert('Ne možete kupiti svoj proizvod');
      return;
    }

    if (product.status === 'sold') {
      alert('Proizvod je već prodat');
      return;
    }

    if (product.status !== 'active') {
      alert('Proizvod nije dostupan za kupovinu');
      return;
    }

    if (window.confirm('Da li ste sigurni da želite da kupite "' + product.name + '" za ' + product.price + ' RSD?')) {
      try {
        setPurchaseLoading(true);
        setError('');
        
        const response = await buyFixedPriceProduct(product.id, currentUser.id);
        
        if (response.data) {
          alert('Uspešno ste kupili proizvod! Čeka se odobravanje od prodavca.');
          setProduct(prev => ({ ...prev, status: 'sold' }));
          navigate('/');
        }
      } catch (error) {
        console.error('Purchase error:', error);
        const errorMessage = error.response?.data?.error || 'Greška pri kupovini proizvoda';
        alert(errorMessage);
        setError(errorMessage);
      } finally {
        setPurchaseLoading(false);
      }
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Molimo prijavite se da biste učestvovali u aukciji');
      return;
    }

    if (isAdmin) {
      alert('Administratori ne mogu učestvovati u aukcijama');
      return;
    }

    if (currentUser.id === product.sellerId) {
      alert('Ne možete učestvovati u aukciji za svoj proizvod');
      return;
    }

    if (product.status !== 'active') {
      alert('Aukcija nije aktivna');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    
    if (isNaN(bidValue) || bidValue <= 0) {
      alert('Unesite validnu cenu');
      return;
    }

    const minimumBid = highestBid ? highestBid.bidAmount + 1 : parseFloat(product.price) + 1;

    if (bidValue < minimumBid) {
      alert('Ponuda mora biti veća od ' + (minimumBid - 1) + ' RSD');
      return;
    }

    try {
      setBidLoading(true);
      setError('');
      
      const response = await placeBid(product.id, currentUser.id, bidValue);
      
      alert('Uspešno ste postavili ponudu!');
      setBidAmount('');
      
      await fetchBids();
      await fetchHighestBid();
      await fetchProduct();
    } catch (error) {
      console.error('Bid error:', error);
      const errorMessage = error.response?.data?.error || 'Greška pri postavljanju ponude';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setBidLoading(false);
    }
  };

  if (error) {
    return (
      <div className="products-page-container">
        <p style={{color: 'red'}}>{error}</p>
        <Link className="add-product-btn" to="/products">Nazad na proizvode</Link>
      </div>
    );
  }

  if (!product) return <p>Učitavanje proizvoda...</p>;

  const isOwner = currentUser && product.sellerId && currentUser.id === product.sellerId;
  const canPurchase = currentUser && 
    product.sellerId && 
    currentUser.id !== product.sellerId && 
    product.status === 'active' &&
    !isAdmin;

  return (
    <div className="products-page-container">
      <div className="product-detail-layout">
        <div className="product-detail-images">
          <ImageCarousel images={product.images || []} height="500px" />
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-title">{product.name}</h1>
          
          <div className="product-detail-section">
            <p><strong>Opis:</strong></p>
            <p className="product-detail-description">{product.description}</p>
          </div>

          <div className="product-detail-section">
            <div className="product-detail-meta">
              <div className="meta-item">
                <span className="meta-label">Kategorija:</span>
                <span className="meta-value">{product.category?.name || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Početna cena:</span>
                <span className="meta-value price">{product.price} RSD</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Tip prodaje:</span>
                <span className="meta-value">{product.saleType === 'fixed' ? 'Fiksna cena' : 'Aukcija'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span className={`meta-value status ${product.status}`}>
                  {product.status === 'active' ? 'Aktivan' : product.status === 'sold' ? 'Prodat' : product.status}
                </span>
              </div>
              
              {seller && (
                <div className="meta-item seller-info">
                  <span className="meta-label">Prodavac:</span>
                  <Link 
                    to={`/profile/${product.sellerId}`} 
                    className="seller-link"
                  >
                    {seller.ime} {seller.prezime} →
                  </Link>
                </div>
              )}

              {product.location && (
                <div className="meta-item">
                  <span className="meta-label">Lokacija:</span>
                  <span className="meta-value location-text">
                    {product.location.city && product.location.country 
                      ? `${product.location.city}, ${product.location.country}`
                      : product.location.fullAddress || 'Lokacija dostupna'
                    }
                  </span>
                </div>
              )}
              
              <div className="meta-item">
                <span className="meta-label">Datum objavljivanja:</span>
                <span className="meta-value">{new Date(product.datePublished).toLocaleString('sr-RS')}</span>
              </div>
            </div>
          </div>

          {product.saleType === 'auction' && highestBid && (
            <div className="highest-bid-section">
              <p className="highest-bid-label">Trenutno najveća ponuda:</p>
              <p className="highest-bid-amount">{highestBid.bidAmount} RSD</p>
            </div>
          )}

          {!isOwner && canPurchase && product.saleType === 'fixed' && (
            <button 
              className="purchase-btn" 
              onClick={handleFixedPricePurchase}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? 'Kupujem...' : 'Kupi za ' + product.price + ' RSD'}
            </button>
          )}

          {!isOwner && canPurchase && product.saleType === 'auction' && (
            <div className="bid-section">
              <h3>Postavite ponudu</h3>
              <form onSubmit={handlePlaceBid} className="bid-form">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Minimum: ${(highestBid?.bidAmount || parseFloat(product.price)) + 1} RSD`}
                  min={(highestBid?.bidAmount || parseFloat(product.price)) + 1}
                  required
                  className="bid-input"
                />
                <button type="submit" className="bid-btn" disabled={bidLoading}>
                  {bidLoading ? 'Postavljam...' : 'Postaviti ponudu'}
                </button>
              </form>
            </div>
          )}

          {product.saleType === 'auction' && bids.length > 0 && (
            <div className="bids-history-section">
              <h3>Istorija ponuda ({bids.length})</h3>
              <div className="bids-list">
                {bids.map((bid, index) => (
                  <div key={bid.id} className="bid-item">
                    <span className="bid-number">#{index + 1}</span>
                    <span className="bid-amount">{bid.bidAmount} RSD</span>
                    {bid.dateCreated && (
                      <span className="bid-date">{new Date(bid.dateCreated).toLocaleString('sr-RS')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && product.saleType === 'auction' && (
            <p className="owner-notice auction-notice">
              Ovo je vaš proizvod. Možete završiti aukciju iz "Moje aukcije".
            </p>
          )}

          {isOwner && product.saleType === 'fixed' && (
            <p className="owner-notice">
              Ovo je vaš proizvod. Ne možete ga kupiti.
            </p>
          )}
          
          {isAdmin && !isOwner && (
            <p className="owner-notice" style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107' }}>
              Kao administrator, možete samo pregledati proizvode, ali ne možete kupovati.
            </p>
          )}
          
          {!currentUser && (
            <p className="login-notice">
              Molimo prijavite se da biste mogli kupiti proizvod.
            </p>
          )}
          
          {product.status === 'sold' && (
            <p className="sold-notice">
              Ovaj proizvod je već prodat.
            </p>
          )}

          {product.status !== 'active' && product.status !== 'sold' && (
            <p className="unavailable-notice">
              Proizvod trenutno nije dostupan za kupovinu.
            </p>
          )}

          <Link className="back-btn" to="/products">← Nazad na proizvode</Link>
        </div>
      </div>

      {product.location && product.location.latitude && product.location.longitude && (
        <div className="product-location-section">
          <h2 className="location-section-title">Lokacija proizvoda</h2>
          <LocationMap 
            initialLocation={product.location}
            editable={false}
            height="400px"
          />
        </div>
      )}

      {reviews.length > 0 && (
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>Recenzije prodavca</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '24px', color: '#ff69b4' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ color: star <= Math.round(averageRating) ? '#ff69b4' : '#ddd' }}>
                    ★
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c71585' }}>
                {averageRating} / 5
              </span>
              <span style={{ color: '#666' }}>
                ({totalReviews} {totalReviews === 1 ? 'recenzija' : 'recenzija'})
              </span>
            </div>
          </div>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '18px', color: '#ff69b4', marginBottom: '8px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= review.rating ? '#ff69b4' : '#ddd' }}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                      Recenzija od:{' '}
                      <Link 
                        to={`/profile/${review.buyerId}`}
                        style={{ 
                          fontWeight: '600', 
                          color: '#c71585',
                          textDecoration: 'none'
                        }}
                      >
                        {review.buyerName}
                      </Link>
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                      Proizvod: {review.productName}
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', color: '#999' }}>
                    {new Date(review.dateCreated).toLocaleDateString('sr-RS')}
                  </span>
                </div>
                {review.comment && (
                  <p style={{ margin: '0', color: '#555', lineHeight: '1.6', fontSize: '14px' }}>
                    <strong style={{ color: '#c71585' }}>Komentar:</strong> {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;