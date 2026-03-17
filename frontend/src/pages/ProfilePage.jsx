import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById, updateUser } from '../services/userService';
import { getProducts, getProduct } from '../services/productService';
import { getReviewsBySeller, getReviewsByBuyer, createReview, getReviewByOrderId, getVisibleReviewsByBuyerForSeller } from '../services/reviewService';
import { 
  getOrdersByBuyer, 
  getOrdersBySeller,
  approveOrder,
  rejectOrder,
  cancelOrder,
  endAuction,
  getBidsForProduct
} from '../services/orderService';
import { createReport } from '../services/reportService';
import AdminDashboard from '../components/adminDashboard';
import '../css/ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isOwnProfile = currentUser && currentUser.id == id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordForEmail, setPasswordForEmail] = useState('');
  const [passwordForUsername, setPasswordForUsername] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [userProducts, setUserProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [activeTab, setActiveTab] = useState('info');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
const [loadingUsers, setLoadingUsers] = useState(false);

  // MyOrders states
  const [myPurchases, setMyPurchases] = useState([]);
  const [mySales, setMySales] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({});
  const [reviewedSales, setReviewedSales] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [showEmailPassword, setShowEmailPassword] = useState(false);
const [showUsernamePassword, setShowUsernamePassword] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
  

  const userRole = user?.uloga?.trim().toLowerCase() || '';
  const isSeller = userRole === 'prodavac' || userRole === 'administrator';
  const isAdmin = userRole === 'administrator';

 useEffect(() => {
  if (isOwnProfile && currentUser && allUsers.length === 0) {
    fetchAllUsers();
  }
}, [isOwnProfile, currentUser]);

useEffect(() => {
  if (activeTab === 'users' && isOwnProfile && currentUser) {
    fetchAllUsers();
  }
}, [activeTab, isOwnProfile]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getUserById(id);
      const userData = response.data;
      setUser(userData);
      setEditData(userData);

      const productsRes = await getProducts();
      const allProducts = productsRes.data;
      let allOrders = [];
      
      // ADMIN NE UČITAVA PROIZVODE
      if (userData.uloga === 'administrator') {
        setUserProducts([]);
        setUserOrders([]);
      } else if (userData.uloga === 'prodavac') {
        // PRODAVAC - proizvodi koje prodaje
        const products = allProducts.filter(p => p.sellerId == id && !p.deleted);
        setUserProducts(products);
        
        try {
          const ordersRes = await getOrdersBySeller(id);
          allOrders = ordersRes.data.data || ordersRes.data || [];
        } catch (err) {
          console.log('No seller orders found');
        }
    } else {
  // KUPAC - proizvodi koje je kupio
  try {
    const ordersRes = await getOrdersByBuyer(id);
    allOrders = ordersRes.data.data || ordersRes.data || [];
    
    // Učitaj svaki proizvod direktno, bez obzira na status (active/sold)
    const productPromises = allOrders.map(async (order) => {
      try {
        const productResponse = await getProduct(order.productId);
        // Vrati proizvod samo ako nije obrisan
        if (productResponse?.data && productResponse.data.deleted !== true) {
          return productResponse.data;
        }
        return null;
      } catch (error) {
        console.log(`Proizvod ${order.productId} nije pronađen`);
        return null;
      }
    });


    
    const boughtProducts = (await Promise.all(productPromises)).filter(p => p !== null);
    setUserProducts(boughtProducts);
  } catch (err) {
    console.log('No buyer orders found', err);
    setUserProducts([]);
  }

}
      
      setUserOrders(allOrders);

      // reviews samo za prodavce i kupce, ne za admina
      if (userData.uloga === 'prodavac') {
      try {
        const reviewsRes = await getReviewsBySeller(id);
        if (reviewsRes.data && reviewsRes.data.data) {
          setReviews(reviewsRes.data.data.reviews);
          setAverageRating(reviewsRes.data.data.averageRating);
        }
      } catch (err) {
        console.log('Error loading seller reviews:', err);
        setReviews([]);
        setAverageRating(0);
        }
      } else if (userData.uloga === 'kupac') {
      try {
        // Ako trenutni korisnik gleda profil kupca
        if (currentUser && currentUser.uloga === 'prodavac') {
          // Prodavac vidi samo recenzije kupca ako je i on njega ocenio
          const reviewsRes = await getVisibleReviewsByBuyerForSeller(id, currentUser.id);
          if (reviewsRes.data && reviewsRes.data.data) {
            setReviews(reviewsRes.data.data.reviews);
            setAverageRating(reviewsRes.data.data.averageRating);
          } else {
            setReviews([]);
            setAverageRating(0);
          }
        } else {
          // Admin ili sam kupac vidi sve recenzije
        const reviewsRes = await getReviewsByBuyer(id);
        if (reviewsRes.data && reviewsRes.data.data) {
          setReviews(reviewsRes.data.data.reviews);
          setAverageRating(reviewsRes.data.data.averageRating);
          } else {
            setReviews([]);
            setAverageRating(0);
          }
        }
      } catch (err) {
        console.log('Error loading buyer reviews:', err);
        setReviews([]);
        setAverageRating(0);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Greška pri učitavanju profila');
      setLoading(false);
    }
  };

  const checkReviewsForOrders = async (orders) => {
    const reviewStatus = {};
    for (const order of orders) {
      try {
        const response = await getReviewByOrderId(order.id, 'buyer');
        reviewStatus[order.id] = response.data.data !== null && response.data.data !== undefined;
      } catch (error) {
        reviewStatus[order.id] = false;
      }
    }
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
  // Dodaj novi useEffect na vrh komponente, posle postojećih useEffect-ova
// 1. Prvo definiši funkciju
const fetchAllUsers = async () => {
  try {
    setLoadingUsers(true);
    const response = await fetch('http://localhost:5000/users');
    const data = await response.json();
    // Filtriraj da se ukloni trenutni korisnik i administratori
    const otherUsers = data.filter(u => u.id != currentUser.id && u.uloga !== 'administrator');
    setAllUsers(otherUsers);
    setLoadingUsers(false);
  } catch (error) {
    console.error('Greška pri učitavanju korisnika:', error);
    setLoadingUsers(false);
  }
};
const filteredUsers = allUsers.filter(user => {
  const searchLower = searchTerm.toLowerCase();
  return user.ime.toLowerCase().includes(searchLower) ||
         user.prezime.toLowerCase().includes(searchLower) ||
         user.korisnickoIme.toLowerCase().includes(searchLower);
});

// 2. Zatim useEffect-ovi
useEffect(() => {
  fetchUserData();
}, [id]);

useEffect(() => {
  if (isOwnProfile && user && !isAdmin) {
    fetchOrders();
  }
}, [isOwnProfile, user, isAdmin]);

useEffect(() => {
  if (activeTab === 'users' && isOwnProfile && currentUser) {
    fetchAllUsers();
  }
}, [activeTab, isOwnProfile]);

  const fetchOrders = async () => {
    try {
      const purchasesResponse = await getOrdersByBuyer(id);
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

      if (isSeller && !isAdmin) {
        const salesResponse = await getOrdersBySeller(id);
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
        setReviewedSales(prev => ({ ...prev, [selectedOrder.id]: true }));
      } else {
        setReviewedOrders(prev => ({ ...prev, [selectedOrder.id]: true }));
      }
    } catch (error) {
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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError('');
    setPasswordError('');
    setEmailError('');
    setUsernameError('');
    setImagePreview(null);
    setNewImage(null);
    setRemoveImage(false);
    setNewPassword('');
    setConfirmPassword('');
    setOldPassword('');
    setPasswordForEmail('');
    setPasswordForUsername('');
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewImage(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleOldPasswordChange = (e) => {
    const value = e.target.value;
    setOldPassword(value);
    setPasswordError('');
  };

  const handleEmailPasswordChange = (e) => {
    const value = e.target.value;
    setPasswordForEmail(value);
    setEmailError('');
    
   
  };

  const handleUsernamePasswordChange = (e) => {
    const value = e.target.value;
    setPasswordForUsername(value);
    setUsernameError('');
    
    
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setPasswordError('');
      setEmailError('');
      setUsernameError('');

      // NOVA VALIDACIJA - proveri da li je šifra uneta ako se menja email
      if (editData.email !== user.email && !passwordForEmail) {
        setEmailError('Morate uneti lozinku da biste promenili email');
        setLoading(false);
        return;
      }

      // NOVA VALIDACIJA - proveri da li je šifra uneta ako se menja korisničko ime
      if (editData.korisnickoIme !== user.korisnickoIme && !passwordForUsername) {
        setUsernameError('Morate uneti lozinku da biste promenili korisničko ime');
        setLoading(false);
        return;
      }
      
      // Validacija lozinke
      if (newPassword || confirmPassword || oldPassword) {
        if (!oldPassword) {
          setPasswordError('Morate uneti staru lozinku da biste je promenili');
          setLoading(false);
          return;
        }
        if (!newPassword) {
          setPasswordError('Unesite novu lozinku');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setPasswordError('Nove lozinke se ne poklapaju');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setPasswordError('Nova lozinka mora imati najmanje 6 karaktera');
          setLoading(false);
          return;
        }
      }

      const updatePayload = { 
        ime: editData.ime || '',
        prezime: editData.prezime || '',
        telefon: editData.telefon || ''
      };

      // Email - uvek šalji, backend će validirati šifru ako je promenjen
      if (editData.email !== user.email) {
        updatePayload.email = editData.email;
        updatePayload.passwordForEmail = passwordForEmail;
      } else {
        updatePayload.email = user.email;
      }

      // Korisničko ime - uvek šalji, backend će validirati šifru ako je promenjeno
      if (editData.korisnickoIme !== user.korisnickoIme) {
        updatePayload.korisnickoIme = editData.korisnickoIme;
        updatePayload.passwordForUsername = passwordForUsername;
      } else {
        updatePayload.korisnickoIme = user.korisnickoIme;
      }

      if (editData.datumRodjenja && editData.datumRodjenja.trim()) {
        updatePayload.datumRodjenja = editData.datumRodjenja;
      }
      if (editData.opis && editData.opis.trim()) {
        updatePayload.opis = editData.opis;
      }
      if (oldPassword && newPassword) {
        updatePayload.oldPassword = oldPassword;
        updatePayload.lozinka = newPassword;
      }
      if (removeImage) {
        updatePayload.removeProfileImage = true;
      } else if (newImage) {
        updatePayload.profilnaSlika = newImage;
      }

      const response = await updateUser(id, updatePayload);
      const updatedUser = response.data;
      setUser(updatedUser);
      setEditData(updatedUser);
      setIsEditing(false);
      setImagePreview(null);
      setNewImage(null);
      setRemoveImage(false);
      setNewPassword('');
      setConfirmPassword('');
      setOldPassword('');
      setPasswordError('');
      setPasswordForEmail('');
      setPasswordForUsername('');
      setEmailError('');
      setUsernameError('');
      if (isOwnProfile) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      alert('Profil uspešno ažuriran!');
      setLoading(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      
      // Proveri da li je greška vezana za email ili username šifru
      if (errorMessage.toLowerCase().includes('email') || 
          (errorMessage.toLowerCase().includes('lozinka') && editData.email !== user.email)) {
        setEmailError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('korisničko') || 
                 (errorMessage.toLowerCase().includes('lozinka') && editData.korisnickoIme !== user.korisnickoIme)) {
        setUsernameError(errorMessage);
      } else {
        setError('Greška pri ažuriranju profila: ' + errorMessage);
      }
      setLoading(false);
    }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim()) {
      setReportError('Molimo unesite razlog prijave');
      return;
    }
    try {
      setReportError('');
      await createReport({
        reporterId: currentUser.id,
        reportedUserId: user.id,
        reason: reportReason
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportReason('');
        setReportSuccess(false);
      }, 2000);
    } catch (error) {
      setReportError('Greška pri podnošenju prijave: ' + (error.response?.data?.error || error.message));
    }
  };

  const canReportUser = () => {
    if (!currentUser || isOwnProfile || !user) return false;
    if (currentUser.uloga === 'kupac' && user.uloga === 'prodavac') {
      const hasBought = userOrders.some(order => order.sellerId == user.id);
      return hasBought;
    }
    if (currentUser.uloga === 'prodavac' && user.uloga === 'kupac') {
      const hasSold = userOrders.some(order => order.buyerId == user.id);
      return hasSold;
    }
    return false;
  };

  if (loading) return <div className="profile-loading">Učitavanje profila...</div>;
  if (error && !isEditing) return <div className="profile-error">{error}</div>;
  if (!user) return <div className="profile-error">Korisnik nije pronađen</div>;

return (
    <div className="profile-page-container">
      <div className="profile-header">
        <div className="profile-image-section">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="profile-image">
              {isEditing && (imagePreview || removeImage) ? (
                removeImage ? (
                  <div className="header-profile-placeholder" style={{ width: '100%', height: '100%', fontSize: '60px', border: '4px solid #ff69b4' }}>
                    {user.ime.charAt(0)}{user.prezime.charAt(0)}
                  </div>
                ) : (
                  <img src={imagePreview} alt={`${user.ime} ${user.prezime}`} />
                )
              ) : user.profilnaSlika ? (
                <img src={`http://localhost:5000${user.profilnaSlika}`} alt={`${user.ime} ${user.prezime}`} />
              ) : (
                <div className="header-profile-placeholder" style={{ width: '100%', height: '100%', fontSize: '60px', border: '4px solid #ff69b4' }}>
                  {user.ime.charAt(0)}{user.prezime.charAt(0)}
                </div>
              )}
            </div>
            {isEditing && (user.profilnaSlika || newImage) && !removeImage && (
              <button
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  background: '#dc3545',
                  color: 'white',
                  border: '3px solid white',
                  cursor: 'pointer',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s',
                  lineHeight: '1',
                  paddingBottom: '2px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.15)';
                  e.target.style.background = '#c82333';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.background = '#dc3545';
                }}
              >
                ×
              </button>
            )}
          </div>
          {isEditing && (
            <div className="image-upload">
              <input type="file" id="profileImageUpload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <label htmlFor="profileImageUpload" className="upload-btn">
                {newImage ? 'Promeni drugu sliku' : 'Dodaj/Promeni sliku'}
              </label>
            </div>
          )}
        </div>

        <div className="profile-info-section">
          {!isEditing ? (
            <>
              <h1 className="profile-name">{user.ime} {user.prezime}</h1>
              <p className="profile-username">@{user.korisnickoIme}</p>
              <p className="profile-role">{user.uloga}</p>
              {reviews.length > 0 && !isAdmin && (
                <div className="profile-rating">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.round(averageRating) ? 'filled' : ''}>★</span>
                    ))}
                  </div>
                  <span className="rating-text">{averageRating} / 5 ({reviews.length} recenzija)</span>
                </div>
              )}
              {user.opis && (
                <div className="profile-bio">
                  <p>{user.opis}</p>
                </div>
              )}
              {isOwnProfile && (
                <button className="edit-profile-btn" onClick={handleEditToggle}>Izmeni profil</button>
              )}
              {!isOwnProfile && canReportUser() && (
                <button className="report-user-btn" onClick={() => setShowReportModal(true)}>Prijavi korisnika</button>
              )}
            </>
          ) : (
            <div className="edit-form">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Ime:</label>
                <input type="text" name="ime" value={editData.ime} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Prezime:</label>
                <input type="text" name="prezime" value={editData.prezime} onChange={handleInputChange} />
              </div>
              
              <div style={{ borderTop: '2px solid #ffe4ec', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#c71585', marginBottom: '15px' }}>Korisničko ime</h4>
                {usernameError && (
                  <div className="error-message" style={{ marginBottom: '15px' }}>
                    {usernameError}
                  </div>
                )}
                <div className="form-group">
                  <label>Korisničko ime:</label>
                  <input type="text" name="korisnickoIme" value={editData.korisnickoIme} onChange={handleInputChange} />
                </div>
                {editData.korisnickoIme !== user.korisnickoIme && (
                  <div className="form-group">
                    <label>Lozinka (za potvrdu promene):</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showUsernamePassword ? "text" : "password"}
                        value={passwordForUsername} 
                        onChange={handleUsernamePasswordChange}
                        placeholder="Unesite lozinku da potvrdite promenu"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {showUsernamePassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ borderTop: '2px solid #ffe4ec', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#c71585', marginBottom: '15px' }}>Email</h4>
                {emailError && (
                  <div className="error-message" style={{ marginBottom: '15px' }}>
                    {emailError}
                  </div>
                )}
                <div className="form-group">
                  <label>Email:</label>
                  <input type="email" name="email" value={editData.email} onChange={handleInputChange} />
                </div>
                {editData.email !== user.email && (
                  <div className="form-group">
                    <label>Lozinka (za potvrdu promene):</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showEmailPassword ? "text" : "password"}
                        value={passwordForEmail} 
                        onChange={handleEmailPasswordChange}
                        placeholder="Unesite lozinku da potvrdite promenu"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {showEmailPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Telefon:</label>
                <input type="tel" name="telefon" value={editData.telefon} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Datum rođenja:</label>
                <input type="date" name="datumRodjenja" value={editData.datumRodjenja || ''} onChange={handleInputChange} />
              </div>
              
              <div style={{ borderTop: '2px solid #ffe4ec', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#c71585', marginBottom: '15px' }}>Promena lozinke (opcionalno)</h4>
                
                {passwordError && (
                  <div className="error-message" style={{ marginBottom: '15px' }}>
                    {passwordError}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Stara lozinka:</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword} 
                      onChange={handleOldPasswordChange}
                      placeholder="Unesite trenutnu lozinku"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {showOldPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Nova lozinka:</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Unesite novu lozinku (min. 6 karaktera)"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Potvrdite novu lozinku:</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Potvrdite novu lozinku"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>O meni:</label>
                <textarea name="opis" value={editData.opis || ''} onChange={handleInputChange} rows="4" />
              </div>
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave} disabled={loading}>{loading ? 'Čuvanje...' : 'Sačuvaj'}</button>
                <button className="cancel-btn" onClick={handleEditToggle} disabled={loading}>Otkaži</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          Informacije
        </button>
        
        {/* ADMIN PANEL TAB - SAMO ZA ADMINA */}
        {isOwnProfile && isAdmin && (
          <button className={`tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            Admin Panel
          </button>
        )}
        
        {/* PROIZVODI TAB - SAMO ZA PRODAVCA I KUPCA, NE ZA ADMINA */}
        {!isOwnProfile && !isAdmin && (
          <button className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            Proizvodi ({userProducts.length})
          </button>
        )}
        
        {/* KUPOVINE - SAMO ZA KUPCA I PRODAVCA, NE ZA ADMINA */}
        {isOwnProfile && !isAdmin && (
          <button className={`tab ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>
            Moje kupovine ({myPurchases.length})
          </button>
        )}
        
        {/* PRODAJE - SAMO ZA PRODAVCA */}
        {isOwnProfile && isSeller && !isAdmin && (
          <>
            <button className={`tab ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
              Moje prodaje ({mySales.length})
            </button>
            <button className={`tab ${activeTab === 'auctions' ? 'active' : ''}`} onClick={() => setActiveTab('auctions')}>
              Moje aukcije ({myAuctions.length})
            </button>
          </>
        )}
        
        {/* RECENZIJE - SAMO ZA PRODAVCA I KUPCA */}
        {reviews.length > 0 && !isAdmin && (
          <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            Recenzije ({reviews.length})
          </button>
        )}
      {/* KORISNICI TAB - SAMO NA SOPSTVENOM PROFILU */}
{isOwnProfile && currentUser && (
  <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
    Korisnici ({allUsers.length})
  </button>
)}
      </div>

      <div className="profile-content">
        {activeTab === 'info' && (
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Telefon:</span>
              <span className="info-value">{user.telefon}</span>
            </div>
            {user.datumRodjenja && (
              <div className="info-item">
                <span className="info-label">Datum rođenja:</span>
                <span className="info-value">{new Date(user.datumRodjenja).toLocaleDateString('sr-RS')}</span>
              </div>
            )}
          </div>
        )}

        {/* ADMIN PANEL CONTENT */}
        {activeTab === 'admin' && isOwnProfile && isAdmin && (
          <AdminDashboard />
        )}

        {activeTab === 'products' && (
          <div className="products-section">
            {userProducts.length === 0 ? (
              <p className="no-data">Nema proizvoda</p>
            ) : (
              <div className="products-grid">
                {userProducts.map((product) => (
                  <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img src={`http://localhost:5000${product.images[0]}`} alt={product.name} />
                      ) : (
                        <div className="no-image">Nema slike</div>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-price">{product.price} RSD</p>
                      <span className={`product-status ${product.status}`}>
                        {product.status === 'active' ? 'Aktivan' : 'Prodat'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchases' && isOwnProfile && !isAdmin && (
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
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Cena:</strong> {order.price} RSD</p>
                      <p><strong>Prodavac:</strong> <Link to={`/profile/${order.sellerId}`} style={{ color: '#c71585', textDecoration: 'underline' }}>{order.seller?.ime || 'Nepoznat'} {order.seller?.prezime || ''}</Link></p>
                      <p><strong>Datum narudžbe:</strong> {new Date(order.dateCreated).toLocaleString('sr-RS')}</p>
                      {order.rejectionReason && (
                        <p className="rejection-reason">
                          <strong>Razlog odbacivanja:</strong> {order.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="order-actions">
                      {order.status === 'Obrada' && (
                        <button className="cancel-btn" onClick={() => handleCancelOrder(order.id)}>Otkaži porudžbinu</button>
                      )}
                      {order.status === 'Odobreno' && (
                        <>
                          {reviewedOrders[order.id] ? (
                            <span className="review-submitted" style={{ color: '#28a745', fontWeight: 'bold', padding: '8px 16px', display: 'inline-block' }}>
                              ✓ Recenzija poslata
                            </span>
                          ) : (
                            <button className="approve-btn" style={{ backgroundColor: '#ff69b4' }} onClick={() => openReviewModal(order, false)}>
                              Ostavi recenziju
                            </button>
                          )}
                        </>
                      )}
                      <button className="view-product-btn" onClick={() => navigate('/products/' + order.productId)}>
                        Pogledaj proizvod
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sales' && isOwnProfile && isSeller && !isAdmin && (
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
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Cena:</strong> {order.price} RSD</p>
                      <p><strong>Kupac:</strong> <Link to={`/profile/${order.buyerId}`} style={{ color: '#c71585', textDecoration: 'underline' }}>{order.buyer?.ime || 'Nepoznat'} {order.buyer?.prezime || ''}</Link></p>
                      <p><strong>Email kupca:</strong> {order.buyer?.email || 'N/A'}</p>
                      <p><strong>Datum narudžbe:</strong> {new Date(order.dateCreated).toLocaleString('sr-RS')}</p>
                    </div>
                    <div className="order-actions">
                      {order.status === 'Obrada' && (
                        <>
                          <button className="approve-btn" onClick={() => handleApproveOrder(order.id)}>Odobri prodaju</button>
                          <button className="reject-btn" onClick={() => openRejectModal(order.id)}>Odbaci prodaju</button>
                        </>
                      )}
                      {order.status === 'Odobreno' && (
                        <>
                          {reviewedSales[order.id] ? (
                            <span className="review-submitted" style={{ color: '#28a745', fontWeight: 'bold', padding: '8px 16px', display: 'inline-block' }}>
                              ✓ Recenzija poslata
                            </span>
                          ) : (
                            <button className="approve-btn" style={{ backgroundColor: '#ff69b4' }} onClick={() => openReviewModal(order, true)}>
                              Oceni kupca
                            </button>
                          )}
                        </>
                      )}
                      <button className="view-product-btn" onClick={() => navigate('/products/' + order.productId)}>
                        Pogledaj proizvod
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'auctions' && isOwnProfile && isSeller && !isAdmin && (
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
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(auction.product.status) }}>
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
                        <button className="approve-btn" style={{ backgroundColor: '#dc3545' }} onClick={() => handleEndAuction(auction.product.id)}>
                          Završi aukciju
                        </button>
                      )}
                      <button className="view-product-btn" onClick={() => navigate('/products/' + auction.product.id)}>
                        Pogledaj proizvod
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && !isAdmin && (
          <div className="reviews-section">
            {reviews.length === 0 ? (
              <p className="no-data">Nema recenzija</p>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => {
                  const reviewerName = user.uloga === 'prodavac' ? review.buyerName : review.sellerName;
                  const reviewerId = user.uloga === 'prodavac' ? review.buyerId : review.sellerId;
                  return (
                    <div key={review.id} className="review-card">
                      <div className="review-product-info">
                        <div className="review-product-details">
                          <p className="review-author">
                            Recenzija od: <Link to={`/profile/${reviewerId}`} className="review-author-link"><strong>{reviewerName}</strong></Link>
                          </p>
                          <p className="review-product-label">Proizvod: {review.productName}</p>
                        </div>
                      </div>
                      <div className="review-header">
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= review.rating ? 'filled' : ''}>★</span>
                          ))}
                        </div>
                        <span className="review-date">{new Date(review.dateCreated).toLocaleDateString('sr-RS')}</span>
                      </div>
                      {review.comment && <p className="review-comment">{review.comment}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
    {activeTab === 'users' && isOwnProfile && currentUser &&(
  <div className="users-section">
    <h2>Kupci i prodavci</h2>
    
    <div className="users-search">
      <input
        type="text"
        placeholder="Pretraži po imenu, prezimenu ili korisničkom imenu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />
    </div>
    
    {loadingUsers ? (
      <p>Učitavanje korisnika...</p>
    ) : filteredUsers.length === 0 ? (
      <p className="no-data">{searchTerm ? 'Nema korisnika koji odgovaraju pretrazi' : 'Nema korisnika'}</p>
    ) : (
      <div className="users-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Korisnik</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Uloga</th>
              <th>Profil</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-name-cell">
                    {user.profilnaSlika ? (
                      <img 
                        src={`http://localhost:5000${user.profilnaSlika}`} 
                        alt={user.ime}
                        className="user-avatar-small"
                      />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {user.ime.charAt(0)}{user.prezime.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#c71585' }}>
                        {user.ime} {user.prezime}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        @{user.korisnickoIme}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.telefon || 'Nije uneto'}</td>
                <td>
                  <span className={`role-badge ${user.uloga}`}>
                    {user.uloga}
                  </span>
                </td>
                <td>
                 <button
    className="profile-link-btn"
    onClick={() => navigate(`/profile/${user.id}`)}
    style={{
      background: '#ff69b4',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
    }}
  >
    Pogledaj profil
  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Prijavi korisnika</h2>
            <p className="modal-subtitle">Prijavite korisnika {user.ime} {user.prezime} administratoru</p>
            {reportSuccess ? (
              <div className="success-message">✓ Prijava je uspešno podnesena i prosleđena administratoru!</div>
            ) : (
              <>
                {reportError && <div className="error-message">{reportError}</div>}
                <textarea className="report-textarea" placeholder="Unesite razlog prijave..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows="6" />
                <div className="modal-actions">
                  <button className="modal-submit-btn" onClick={handleReportUser}>Podnesi prijavu</button>
                  <button className="modal-cancel-btn" onClick={() => { setShowReportModal(false); setReportReason(''); setReportError(''); }}>Otkaži</button>
                </div>
              </>
            )}
          </div>
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
              <textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Unesite razlog zašto odbacujete ovu porudžbinu..." required />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeRejectModal}>Otkaži</button>
              <button className="confirm-btn" onClick={handleRejectOrder}>Odbaci porudžbinu</button>
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
                <label htmlFor="rating" style={{ display: 'block', marginBottom: '10px' }}>Ocena (1-5):</label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '30px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => setReviewRating(star)} style={{ cursor: 'pointer', color: star <= reviewRating ? '#ff69b4' : '#ddd' }}>★</span>
                  ))}
                </div>
              </div>
              <label htmlFor="reviewComment">Komentar (opcionalno):</label>
              <textarea id="reviewComment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder={selectedOrder?.isSeller ? "Napišite vaše iskustvo sa kupcem..." : "Napišite vaše iskustvo sa prodavcem..."} rows="5" />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeReviewModal}>Otkaži</button>
              <button className="confirm-btn" style={{ backgroundColor: '#ff69b4' }} onClick={handleSubmitReview}>Pošalji recenziju</button>
            </div>
          </div>
        </div>
      )}


      <Link to="/products" className="back-btn">← Nazad na proizvode</Link>
    </div>
  );
};

export default ProfilePage;