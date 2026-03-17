import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOrdersByBuyer,
  getOrdersBySeller,
  approveOrder,
  rejectOrder,
  cancelOrder,
  endAuction,
  getBidsForProduct
} from '../services/orderService';
import { getProduct } from '../services/productService';
import { getUserById } from '../services/userService';
import { createReview, getReviewByOrderId } from '../services/reviewService';
import '../css/MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const [myPurchases, setMyPurchases] = useState([]);
  const [mySales, setMySales] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // Review states
  const [reviewedOrders, setReviewedOrders] = useState({});
  const [reviewedSales, setReviewedSales] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  const userRole = currentUser?.uloga?.trim().toLowerCase() || '';
  const isSeller = userRole === 'prodavac' || userRole === 'administrator';

  useEffect(() => {
    if (!currentUser) {
      alert('Molimo prijavite se');
      navigate('/');
      return;
    }
    
    if (!isSeller) {
      setActiveTab('purchases');
    }
    
    fetchOrders();
  }, []);

  const checkReviewsForOrders = async (orders) => {
    const reviewStatus = {};
    for (const order of orders) {
      try {
        const response = await getReviewByOrderId(order.id, 'buyer');
        console.log('Review check for order', order.id, ':', response.data);
        reviewStatus[order.id] = response.data.data !== null && response.data.data !== undefined;
      } catch (error) {
        console.log('No review for order', order.id, error);
        reviewStatus[order.id] = false;
      }
    }
    console.log('Final review status:', reviewStatus);
    setReviewedOrders(reviewStatus);
  };

  const checkSellerReviewsForOrders = async (sales) => {
    const reviewStatus = {};
    for (const order of sales) {
      try {
        const response = await getReviewByOrderId(order.id, 'seller');
        reviewStatus[order.id] = response.data.data !== null && response.data.data !== undefined;
      } catch (error) {
        reviewStatus[order.id] = false;
      }
    }
    setReviewedSales(reviewStatus);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const purchasesResponse = await getOrdersByBuyer(currentUser.id);
      
      let ordersData = [];
      if (purchasesResponse?.data) {
        if (purchasesResponse.data.data) {
          ordersData = purchasesResponse.data.data;
        } else if (Array.isArray(purchasesResponse.data)) {
          ordersData = purchasesResponse.data;
        }
      }
      
      const myActualPurchases = ordersData.filter(order => 
        order.buyerId === currentUser.id || order.buyerId == currentUser.id
      );
      
      if (myActualPurchases.length > 0) {
        const purchasesWithDetails = await Promise.all(
          myActualPurchases.map(async (order) => {
            try {
              const productResponse = await getProduct(order.productId);
              if (!productResponse?.data || productResponse.data.deleted === true) {
                return null;
              }
              const sellerResponse = await getUserById(order.sellerId);
              return {
                ...order,
                product: productResponse.data,
                seller: sellerResponse?.data || { ime: 'Nepoznat', prezime: 'prodavac' }
              };
            } catch (error) {
              return null;
            }
          })
        );
        const filteredPurchases = purchasesWithDetails.filter(p => p !== null);
        setMyPurchases(filteredPurchases);
        await checkReviewsForOrders(filteredPurchases);
      } else {
        setMyPurchases([]);
        setReviewedOrders({});
      }

      if (isSeller) {
        const salesResponse = await getOrdersBySeller(currentUser.id);
        
        let salesData = [];
        if (salesResponse?.data) {
          if (salesResponse.data.data) {
            salesData = salesResponse.data.data;
          } else if (Array.isArray(salesResponse.data)) {
            salesData = salesResponse.data;
          }
        }
        
        const myActualSales = salesData.filter(order => 
          order.sellerId === currentUser.id || order.sellerId == currentUser.id
        );
        
        if (myActualSales.length > 0) {
          const salesWithDetails = await Promise.all(
            myActualSales.map(async (order) => {
              try {
                const productResponse = await getProduct(order.productId);
                if (!productResponse?.data || productResponse.data.deleted === true) {
                  return null;
                }
                const buyerResponse = await getUserById(order.buyerId);
                return {
                  ...order,
                  product: productResponse.data,
                  buyer: buyerResponse?.data || { ime: 'Nepoznat', prezime: 'kupac' }
                };
              } catch (error) {
                return null;
              }
            })
          );
          const filteredSales = salesWithDetails.filter(s => s !== null);
          setMySales(filteredSales);
          await checkSellerReviewsForOrders(filteredSales);
        } else {
          setMySales([]);
          setReviewedSales({});
        }

        await fetchMyAuctions();
      }
    } catch (error) {
      console.error('Greška pri učitavanju porudžbina:', error);
      alert('Greška pri učitavanju porudžbina');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAuctions = async () => {
    try {
      const allProductsResponse = await fetch('http://localhost:5000/products');
      const allProductsData = await allProductsResponse.json();
      
      const myAuctionProducts = allProductsData.filter(p => 
        p.sellerId == currentUser.id && 
        p.saleType === 'auction' &&
        !p.deleted
      );

      const auctionsWithBids = await Promise.all(
        myAuctionProducts.map(async (product) => {
          try {
            const bidsResponse = await getBidsForProduct(product.id);
            let bidsData = [];
            
            if (bidsResponse?.data) {
              if (bidsResponse.data.data) {
                bidsData = bidsResponse.data.data;
              } else if (Array.isArray(bidsResponse.data)) {
                bidsData = bidsResponse.data;
              }
            }

            const highestBid = bidsData.length > 0 
              ? bidsData.reduce((max, bid) => bid.bidAmount > max.bidAmount ? bid : max)
              : null;

            return {
              product: product,
              bids: bidsData,
              highestBid: highestBid,
              bidsCount: bidsData.length
            };
          } catch (error) {
            return {
              product: product,
              bids: [],
              highestBid: null,
              bidsCount: 0
            };
          }
        })
      );

      setMyAuctions(auctionsWithBids);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setMyAuctions([]);
    }
  };

  const handleEndAuction = async (productId) => {
    if (!currentUser || !currentUser.id) {
      alert('Molimo prijavite se');
      return;
    }

    if (window.confirm('Da li ste sigurni da želite da završite ovu aukciju?')) {
      try {
        await endAuction(productId, currentUser.id);
        alert('Aukcija je uspešno završena!');
        fetchOrders();
      } catch (error) {
        alert(error.response?.data?.error || 'Greška');
      }
    }
  };

  const handleApproveOrder = async (orderId) => {
    if (window.confirm('Da li ste sigurni da želite da odobrite ovu porudžbinu?')) {
      try {
        await approveOrder(orderId, currentUser.id);
        alert('Porudžbina je uspešno odobrena!');
        fetchOrders();
      } catch (error) {
        console.error('Error approving order:', error);
        alert(error.response?.data?.error || 'Greška pri odobravanju porudžbine');
      }
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      alert('Molimo unesite razlog odbacivanja');
      return;
    }

    try {
      await rejectOrder(selectedOrderId, currentUser.id, rejectionReason);
      alert('Porudžbina je odbačena!');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert(error.response?.data?.error || 'Greška pri odbacivanju porudžbine');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Da li ste sigurni da želite da otkažete ovu porudžbinu?')) {
      try {
        await cancelOrder(orderId, currentUser.id);
        alert('Porudžbina je otkazana!');
        fetchOrders();
      } catch (error) {
        console.error('Error canceling order:', error);
        alert(error.response?.data?.error || 'Greška pri otkazivanju porudžbine');
      }
    }
  };

  const openRejectModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedOrderId(null);
  };

  const openReviewModal = (order, isSeller = false) => {
    setSelectedOrder({ ...order, isSeller });
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrder(null);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!selectedOrder) return;

    const isSeller = selectedOrder.isSeller;

    try {
      await createReview(
        selectedOrder.productId,
        selectedOrder.sellerId,
        selectedOrder.buyerId,
        selectedOrder.id,
        reviewRating,
        reviewComment,
        isSeller ? 'seller' : 'buyer'
      );
      
      alert(isSeller ? 'Recenzija kupca je uspešno poslata!' : 'Recenzija je uspešno poslata!');
      closeReviewModal();
      
      if (isSeller) {
        setReviewedSales(prev => ({
          ...prev,
          [selectedOrder.id]: true
        }));
      } else {
        setReviewedOrders(prev => ({
          ...prev,
          [selectedOrder.id]: true
        }));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.error || 'Greška pri slanju recenzije');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Obrada': return '#ffc107';
      case 'Odobreno': return '#28a745';
      case 'Odbačeno': return '#dc3545';
      case 'Otkazano': return '#6c757d';
      case 'active': return '#17a2b8';
      case 'sold': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Obrada': return 'U obradi';
      case 'Odobreno': return 'Odobreno';
      case 'Odbačeno': return 'Odbačeno';
      case 'Otkazano': return 'Otkazano';
      case 'active': return 'Aktivna';
      case 'sold': return 'Završena';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">Učitavanje porudžbina...</div>;
  }

  return (
    <div className="my-orders">
      <div className="orders-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Nazad na početnu
        </button>
        <h1>Moje porudžbine</h1>
      </div>

      <div className="tabs">
        <button 
          className={'tab ' + (activeTab === 'purchases' ? 'active' : '')}
          onClick={() => setActiveTab('purchases')}
        >
          Moje kupovine ({myPurchases.length})
        </button>
        {isSeller && (
          <>
            <button 
              className={'tab ' + (activeTab === 'sales' ? 'active' : '')}
              onClick={() => setActiveTab('sales')}
            >
              Moje prodaje ({mySales.length})
            </button>
            <button 
              className={'tab ' + (activeTab === 'auctions' ? 'active' : '')}
              onClick={() => setActiveTab('auctions')}
            >
              Moje aukcije ({myAuctions.length})
            </button>
          </>
        )}
      </div>

      {activeTab === 'purchases' && (
        <div className="orders-section">
          <h2>Kupljeni proizvodi</h2>
          {myPurchases.length === 0 ? (
            <p className="no-orders">Nemate kupljenih proizvoda.</p>
          ) : (
            <div className="orders-list">
              {myPurchases.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>{order.product?.name || 'Nepoznat proizvod'}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <p><strong>Cena:</strong> {order.price} RSD</p>
                    <p><strong>Prodavac:</strong> {order.seller?.ime || 'Nepoznat'} {order.seller?.prezime || ''}</p>
                    <p><strong>Datum narudžbe:</strong> {new Date(order.dateCreated).toLocaleString('sr-RS')}</p>
                    {order.rejectionReason && (
                      <p className="rejection-reason">
                        <strong>Razlog odbacivanja:</strong> {order.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="order-actions">
                    {order.status === 'Obrada' && (
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Otkaži porudžbinu
                      </button>
                    )}
                    {order.status === 'Odobreno' && (
                      <>
                        {reviewedOrders[order.id] ? (
                          <span className="review-submitted" style={{ color: '#28a745', fontWeight: 'bold', padding: '8px 16px', display: 'inline-block' }}>
                            ✓ Recenzija poslata
                          </span>
                        ) : (
                          <button 
                            className="approve-btn"
                            style={{ backgroundColor: '#ff69b4' }}
                            onClick={() => openReviewModal(order, false)}
                          >
                            Ostavi recenziju
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      className="view-product-btn"
                      onClick={() => navigate('/products/' + order.productId)}
                    >
                      Pogledaj proizvod
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sales' && isSeller && (
        <div className="orders-section">
          <h2>Prodani proizvodi</h2>
          {mySales.length === 0 ? (
            <p className="no-orders">Nemate prodanih proizvoda.</p>
          ) : (
            <div className="orders-list">
              {mySales.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>{order.product?.name || 'Nepoznat proizvod'}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <p><strong>Cena:</strong> {order.price} RSD</p>
                    <p><strong>Kupac:</strong> {order.buyer?.ime || 'Nepoznat'} {order.buyer?.prezime || ''}</p>
                    <p><strong>Email kupca:</strong> {order.buyer?.email || 'N/A'}</p>
                    <p><strong>Datum narudžbe:</strong> {new Date(order.dateCreated).toLocaleString('sr-RS')}</p>
                  </div>

                  <div className="order-actions">
                    {order.status === 'Obrada' && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveOrder(order.id)}
                        >
                          Odobri prodaju
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => openRejectModal(order.id)}
                        >
                          Odbaci prodaju
                        </button>
                      </>
                    )}
                    {order.status === 'Odobreno' && (
                      <>
                        {reviewedSales[order.id] ? (
                          <span className="review-submitted" style={{ color: '#28a745', fontWeight: 'bold', padding: '8px 16px', display: 'inline-block' }}>
                            ✓ Recenzija poslata
                          </span>
                        ) : (
                          <button 
                            className="approve-btn"
                            style={{ backgroundColor: '#ff69b4' }}
                            onClick={() => openReviewModal(order, true)}
                          >
                            Oceni kupca
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      className="view-product-btn"
                      onClick={() => navigate('/products/' + order.productId)}
                    >
                      Pogledaj proizvod
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'auctions' && isSeller && (
        <div className="orders-section">
          <h2>Moje aukcije</h2>
          {myAuctions.length === 0 ? (
            <p className="no-orders">Nemate aktivnih aukcija.</p>
          ) : (
            <div className="orders-list">
              {myAuctions.map((auction) => (
                <div key={auction.product.id} className="order-card">
                  <div className="order-header">
                    <h3>{auction.product.name}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(auction.product.status) }}
                    >
                      {getStatusText(auction.product.status)}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <p><strong>Početna cena:</strong> {auction.product.price} RSD</p>
                    <p><strong>Broj ponuda:</strong> {auction.bidsCount}</p>
                    {auction.highestBid && (
                      <p><strong>Najviša ponuda:</strong> {auction.highestBid.bidAmount} RSD</p>
                    )}
                    <p><strong>Datum objave:</strong> {new Date(auction.product.datePublished).toLocaleString('sr-RS')}</p>
                  </div>

                  <div className="order-actions">
                    {auction.product.status === 'active' && auction.bidsCount > 0 && (
                      <button 
                        className="approve-btn"
                        style={{ backgroundColor: '#dc3545' }}
                        onClick={() => handleEndAuction(auction.product.id)}
                      >
                        Završi aukciju
                      </button>
                    )}
                    <button 
                      className="view-product-btn"
                      onClick={() => navigate('/products/' + auction.product.id)}
                    >
                      Pogledaj proizvod
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Odbaci porudžbinu</h3>
              <button className="close-btn" onClick={closeRejectModal}>×</button>
            </div>
            <div className="modal-body">
              <label htmlFor="rejectionReason">Razlog odbacivanja:</label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Unesite razlog zašto odbacujete ovu porudžbinu..."
                required
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeRejectModal}>
                Otkaži
              </button>
              <button className="confirm-btn" onClick={handleRejectOrder}>
                Odbaci porudžbinu
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedOrder?.isSeller ? 'Oceni kupca' : 'Ostavi recenziju'}</h3>
              <button className="close-btn" onClick={closeReviewModal}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="rating" style={{ display: 'block', marginBottom: '10px' }}>
                  Ocena (1-5):
                </label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '30px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        cursor: 'pointer',
                        color: star <= reviewRating ? '#ff69b4' : '#ddd'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <label htmlFor="reviewComment">Komentar (opcionalno):</label>
              <textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={selectedOrder?.isSeller ? 
                  "Napišite vaše iskustvo sa kupcem..." : 
                  "Napišite vaše iskustvo sa prodavcem..."
                }
                rows="5"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeReviewModal}>
                Otkaži
              </button>
              <button className="confirm-btn" style={{ backgroundColor: '#ff69b4' }} onClick={handleSubmitReview}>
                Pošalji recenziju
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;