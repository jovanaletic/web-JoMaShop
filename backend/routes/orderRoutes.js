const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

router.post('/buy-fixed', async (req, res) => {
  try {
    const { productId, buyerId } = req.body;
    
    if (!productId || !buyerId) {
      return res.status(400).json({ error: 'ProductId i buyerId su obavezni' });
    }
    
    const order = await orderService.createFixedPriceOrder(productId, buyerId);
    res.status(201).json({ 
      success: true,
      message: 'Porudžbina je uspešno kreirana', 
      data: order 
    });
  } catch (error) {
    console.error('Greška pri kupovini:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.post('/bid', async (req, res) => {
  try {
    const { productId, bidderId, bidAmount } = req.body;
    
    if (!productId || !bidderId || !bidAmount) {
      return res.status(400).json({ error: 'ProductId, bidderId i bidAmount su obavezni' });
    }
    
    if (bidAmount <= 0) {
      return res.status(400).json({ error: 'Ponuda mora biti veća od 0' });
    }
    
    const bid = await orderService.placeBid(productId, bidderId, parseFloat(bidAmount));
    res.status(201).json({ 
      success: true,
      message: 'Ponuda je uspešno postavljena', 
      data: bid 
    });
  } catch (error) {
    console.error('Greška pri postavljanju ponude:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.post('/end-auction', async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
    
    console.log('=== BACKEND DEBUG ===');
    console.log('Received productId:', productId, 'Type:', typeof productId);
    console.log('Received sellerId:', sellerId, 'Type:', typeof sellerId);
    console.log('Full request body:', req.body);
    
    if (!productId || !sellerId) {
      return res.status(400).json({ error: 'ProductId i sellerId su obavezni' });
    }
    
    const order = await orderService.endAuction(Number(productId), Number(sellerId));
    res.status(201).json({ 
      success: true,
      message: 'Aukcija je završena', 
      data: order 
    });
  } catch (error) {
    console.error('Backend error ending auction:', error.message);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});
router.put('/:orderId/approve', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ error: 'SellerId je obavezan' });
    }
    
    const order = await orderService.approveOrder(orderId, sellerId);
    res.json({ 
      success: true,
      message: 'Porudžbina je odobrena', 
      data: order 
    });
  } catch (error) {
    console.error('Greška pri odobravanju porudžbine:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.put('/:orderId/reject', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sellerId, rejectionReason } = req.body;
    
    if (!sellerId || !rejectionReason) {
      return res.status(400).json({ error: 'SellerId i rejectionReason su obavezni' });
    }
    
    const order = await orderService.rejectOrder(orderId, sellerId, rejectionReason);
    res.json({ 
      success: true,
      message: 'Porudžbina je odbačena', 
      data: order 
    });
  } catch (error) {
    console.error('Greška pri odbacivanju porudžbine:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { buyerId } = req.body;
    
    if (!buyerId) {
      return res.status(400).json({ error: 'BuyerId je obavezan' });
    }
    
    const order = await orderService.cancelOrder(orderId, buyerId);
    res.json({ 
      success: true,
      message: 'Porudžbina je otkazana', 
      data: order 
    });
  } catch (error) {
    console.error('Greška pri otkazivanju porudžbine:', error);
    res.status(400).json({ 
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
    
    const orders = orderService.getOrdersByBuyer(buyerId);
    res.json({ 
      success: true,
      data: orders 
    });
  } catch (error) {
    console.error('Greška pri dobijanju porudžbina kupca:', error);
    res.status(500).json({ 
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
    
    const orders = orderService.getOrdersBySeller(sellerId);
    res.json({ 
      success: true,
      data: orders 
    });
  } catch (error) {
    console.error('Greška pri dobijanju porudžbina prodavca:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/bids/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'ProductId je obavezan' });
    }
    
    const bids = orderService.getBidsForProduct(productId);
    res.json({ 
      success: true,
      data: bids 
    });
  } catch (error) {
    console.error('Greška pri dobijanju ponuda:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/highest-bid/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'ProductId je obavezan' });
    }
    
    const highestBid = orderService.getHighestBidForProduct(productId);
    res.json({ 
      success: true,
      data: highestBid 
    });
  } catch (error) {
    console.error('Greška pri dobijanju najveće ponude:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = orderService.getAllOrders();
    res.json({ 
      success: true,
      data: orders 
    });
  } catch (error) {
    console.error('Greška pri dobijanju porudžbina:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Porudžbina nije pronađena' 
      });
    }
    
    res.json({ 
      success: true,
      data: order 
    });
  } catch (error) {
    console.error('Greška pri dobijanju porudžbine:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;