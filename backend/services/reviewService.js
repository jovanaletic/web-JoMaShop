const fs = require("fs");
const path = require("path");
const Review = require("../model/review");
const orderService = require("./orderService");
const userService = require("./userService");
const productService = require("./productService");

const reviewsFile = path.join(__dirname, "..", "data", "reviews.json");

function loadReviews() {
  if (!fs.existsSync(reviewsFile)) return [];
  return JSON.parse(fs.readFileSync(reviewsFile));
}

function saveReviews(reviews) {
  fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
}

function createReview(productId, sellerId, buyerId, orderId, rating, comment, reviewerRole = 'buyer') {
  const order = orderService.getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== 'Odobreno') {
    throw new Error("You can only review approved orders");
  }

  if (reviewerRole === 'buyer') {
    if (order.buyerId != buyerId) {
      throw new Error("You can only review your own purchases");
    }
    if (order.sellerId != sellerId) {
      throw new Error("Seller ID mismatch");
    }
  } else if (reviewerRole === 'seller') {
    if (order.sellerId != sellerId) {
      throw new Error("You can only review your own sales");
    }
    if (order.buyerId != buyerId) {
      throw new Error("Buyer ID mismatch");
    }
  }

  const reviews = loadReviews();
  const existingReview = reviews.find(r => 
    r.orderId == orderId && r.reviewerRole === reviewerRole
  );
  if (existingReview) {
    throw new Error("You have already reviewed this order");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const maxId = reviews.length > 0 ? Math.max(...reviews.map(r => Number(r.id))) : 0;

  const newReview = new Review(
    maxId + 1,
    productId,
    sellerId,
    buyerId,
    orderId,
    parseInt(rating),
    comment,
    new Date().toISOString(),
    reviewerRole
  );

  reviews.push(newReview);
  saveReviews(reviews);

  return newReview;
}

function getReviewsBySeller(sellerId) {
  const reviews = loadReviews();
  return reviews.filter(r => r.sellerId == sellerId && r.reviewerRole === 'buyer');
}

function getReviewsByBuyer(buyerId) {
  const reviews = loadReviews();
  return reviews.filter(r => r.buyerId == buyerId && r.reviewerRole === 'seller');
}

function getReviewByOrderId(orderId, reviewerRole = 'buyer') {
  const reviews = loadReviews();
  return reviews.find(r => r.orderId == orderId && r.reviewerRole === reviewerRole);
}

function getAllReviews() {
  return loadReviews();
}

function getAverageRatingForSeller(sellerId) {
  const reviews = getReviewsBySeller(sellerId);
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

function getAverageRatingForBuyer(buyerId) {
  const reviews = getReviewsByBuyer(buyerId);
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

function getEnrichedReviewsBySeller(sellerId) {
  const reviews = getReviewsBySeller(sellerId);
  
  return reviews.map(review => {
    const buyer = userService.getUserById(review.buyerId);
    const product = productService.getProductById(review.productId);
    
    return {
      ...review,
      buyerName: buyer ? `${buyer.ime} ${buyer.prezime}` : 'Nepoznat kupac',
      buyerUsername: buyer ? buyer.korisnickoIme : '',
      productName: product ? product.name : 'Nepoznat proizvod',
      productImage: product && product.images && product.images.length > 0 ? product.images[0] : null
    };
  });
}

function getEnrichedReviewsByBuyer(buyerId) {
  const reviews = getReviewsByBuyer(buyerId);
  
  return reviews.map(review => {
    const seller = userService.getUserById(review.sellerId);
    const product = productService.getProductById(review.productId);
    
    return {
      ...review,
      sellerName: seller ? `${seller.ime} ${seller.prezime}` : 'Nepoznat prodavac',
      sellerUsername: seller ? seller.korisnickoIme : '',
      productName: product ? product.name : 'Nepoznat proizvod',
      productImage: product && product.images && product.images.length > 0 ? product.images[0] : null
    };
  });
}

// NOVA FUNKCIJA - Vraća recenzije kupca koje prodavac može da vidi
function getVisibleReviewsByBuyerForSeller(buyerId, sellerId) {
  const allReviews = loadReviews();
  
  // Recenzije koje je kupac dobio (reviewerRole === 'seller')
  const buyerReviews = allReviews.filter(r => 
    r.buyerId == buyerId && r.reviewerRole === 'seller'
  );
  
  // Filtriraj samo one gde je ovaj prodavac ostavio recenziju za istog kupca
  const visibleReviews = buyerReviews.filter(review => {
    // Proveri da li je prodavac ostavio recenziju za ovog kupca za istu porudžbinu
    const sellerReview = allReviews.find(r => 
      r.orderId == review.orderId && 
      r.sellerId == sellerId && 
      r.reviewerRole === 'seller'
    );
    return sellerReview !== undefined;
  });
  
  // Obogati sa podacima
  return visibleReviews.map(review => {
    const reviewerSeller = userService.getUserById(review.sellerId);
    const product = productService.getProductById(review.productId);
    
    return {
      ...review,
      sellerName: reviewerSeller ? `${reviewerSeller.ime} ${reviewerSeller.prezime}` : 'Nepoznat prodavac',
      sellerUsername: reviewerSeller ? reviewerSeller.korisnickoIme : '',
      productName: product ? product.name : 'Nepoznat proizvod',
      productImage: product && product.images && product.images.length > 0 ? product.images[0] : null
    };
  });
}

module.exports = {
  createReview,
  getReviewsBySeller,
  getReviewsByBuyer,
  getReviewByOrderId,
  getAllReviews,
  getAverageRatingForSeller,
  getAverageRatingForBuyer,
  getEnrichedReviewsBySeller,
  getEnrichedReviewsByBuyer,
  getVisibleReviewsByBuyerForSeller
};