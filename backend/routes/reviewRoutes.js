const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { sendReviewNotification } = require('../services/emailService');
const productService = require('../services/productService');

router.post('/', async (req, res) => {
  try {
    const { productId, sellerId, buyerId, orderId, rating, comment, reviewerRole } = req.body;
    
    if (!productId || !sellerId || !buyerId || !orderId || !rating || !reviewerRole) {
      return res.status(400).json({ error: 'Sva polja su obavezna' });
    }
    
    const review = reviewService.createReview(
      productId,
      sellerId,
      buyerId,
      orderId,
      rating,
      comment || '',
      reviewerRole
    );
    
    const product = productService.getProductById(productId);
    const productName = product ? product.name : 'Nepoznat proizvod';
    
    const reviewedUserId = reviewerRole === 'buyer' ? sellerId : buyerId;
    const reviewerUserId = reviewerRole === 'buyer' ? buyerId : sellerId;
    
    await sendReviewNotification(
      reviewedUserId,
      reviewerUserId,
      productName,
      rating,
      comment,
      reviewerRole
    );
    
    res.status(201).json({ 
      success: true,
      message: 'Recenzija je uspešno kreirana', 
      data: review 
    });
  } catch (error) {
    console.error('Greška pri kreiranju recenzije:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    if (!sellerId) {
      return res.status(400).json({ error: 'SellerId je obavezan' });
    }
    
    const reviews = reviewService.getEnrichedReviewsBySeller(sellerId);
    const averageRating = reviewService.getAverageRatingForSeller(sellerId);
    
    res.json({ 
      success: true,
      data: {
        reviews: reviews,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error('Greška pri dobijanju recenzija:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    if (!buyerId) {
      return res.status(400).json({ error: 'BuyerId je obavezan' });
    }
    
    const reviews = reviewService.getEnrichedReviewsByBuyer(buyerId);
    const averageRating = reviewService.getAverageRatingForBuyer(buyerId);
    
    res.json({ 
      success: true,
      data: {
        reviews: reviews,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error('Greška pri dobijanju recenzija:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// NOVI ENDPOINT - prodavac vidi recenzije kupca samo ako je i on njega ocenio
router.get('/buyer/:buyerId/visible-to-seller/:sellerId', async (req, res) => {
  try {
    const { buyerId, sellerId } = req.params;
    
    if (!buyerId || !sellerId) {
      return res.status(400).json({ error: 'BuyerId i SellerId su obavezni' });
    }
    
    const reviews = reviewService.getVisibleReviewsByBuyerForSeller(buyerId, sellerId);
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    
    res.json({ 
      success: true,
      data: {
        reviews: reviews,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error('Greška pri dobijanju recenzija:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/order/:orderId/:reviewerRole', async (req, res) => {
  try {
    const { orderId, reviewerRole } = req.params;
    
    if (!orderId || !reviewerRole) {
      return res.status(400).json({ error: 'OrderId i reviewerRole su obavezni' });
    }
    
    const review = reviewService.getReviewByOrderId(orderId, reviewerRole);
    
    res.json({ 
      success: true,
      data: review 
    });
  } catch (error) {
    console.error('Greška pri dobijanju recenzije:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/seller/:sellerId/average', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    if (!sellerId) {
      return res.status(400).json({ error: 'SellerId je obavezan' });
    }
    
    const averageRating = reviewService.getAverageRatingForSeller(sellerId);
    
    res.json({ 
      success: true,
      data: {
        averageRating: parseFloat(averageRating)
      }
    });
  } catch (error) {
    console.error('Greška pri dobijanju prosečne ocene:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;