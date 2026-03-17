const fs = require("fs");
const path = require("path");
const Order = require("../model/order");
const Bid = require("../model/bid");
const productService = require("./productService");
const userService = require("./userService");
const emailService = require("./emailService");

const ordersFile = path.join(__dirname, "..", "data", "orders.json");
const bidsFile = path.join(__dirname, "..", "data", "bids.json");

function loadOrders() {
  if (!fs.existsSync(ordersFile)) return [];
  return JSON.parse(fs.readFileSync(ordersFile));
}

function saveOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function loadBids() {
  if (!fs.existsSync(bidsFile)) return [];
  return JSON.parse(fs.readFileSync(bidsFile));
}

function saveBids(bids) {
  fs.writeFileSync(bidsFile, JSON.stringify(bids, null, 2));
}

function isProductDeleted(productId) {
  const product = productService.getProductById(productId);
  return !product || product.deleted === true;
}

async function createFixedPriceOrder(productId, buyerId) {
  const product = productService.getProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  if (product.deleted === true) {
    throw new Error("Product has been deleted");
  }

  if (product.saleType !== 'fixed') {
    throw new Error("Product is not available for fixed price purchase");
  }

  if (product.status !== 'active') {
    throw new Error("Product is no longer available");
  }

  const buyer = userService.getUserById(buyerId);
  if (!buyer) {
    throw new Error("Buyer not found");
  }

  const orders = loadOrders();
  const maxId = orders.length > 0 ? Math.max(...orders.map(o => Number(o.id))) : 0;

  const newOrder = new Order(
    maxId + 1,
    productId,
    buyerId,
    product.sellerId,
    product.price,
    'Obrada',
    new Date().toISOString()
  );

  orders.push(newOrder);
  saveOrders(orders);

  productService.updateProduct(productId, { status: 'sold' });

  await emailService.sendPurchaseNotification(buyerId, product.sellerId, product.name, product.price);

  return newOrder;
}

async function placeBid(productId, bidderId, bidAmount) {
  const product = productService.getProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  if (product.deleted === true) {
    throw new Error("Product has been deleted");
  }

  if (product.saleType !== 'auction') {
    throw new Error("Product is not available for auction");
  }

  if (product.status !== 'active') {
    throw new Error("Auction is no longer active");
  }

  if (productService.isAuctionEnded(product)) {
    throw new Error("Auction has ended");
  }

  const bids = loadBids();
  const currentBids = bids.filter(b => b.productId == productId);
  const highestBid = currentBids.length > 0 ? Math.max(...currentBids.map(b => b.bidAmount)) : product.price;

  if (bidAmount <= highestBid) {
    throw new Error("Bid must be higher than current highest bid (" + highestBid + ")");
  }

  const maxBidId = bids.length > 0 ? Math.max(...bids.map(b => Number(b.id))) : 0;

  const newBid = new Bid(
    maxBidId + 1,
    productId,
    bidderId,
    bidAmount,
    new Date().toISOString()  
  );
  bids.push(newBid);
  saveBids(bids);

  await emailService.sendBidNotification(product.sellerId, bidderId, product.name, bidAmount);

  return newBid;
}

async function endAuction(productId, sellerId) {
  const product = productService.getProductById(productId);
  
  if (!product) {
    throw new Error("Product not found");
  }

  if (product.deleted === true) {
    throw new Error("Product has been deleted");
  }

  if (product.sellerId != sellerId) {
    throw new Error("Only the seller can end this auction");
  }

  if (product.saleType !== 'auction') {
    throw new Error("Product is not an auction");
  }

  if (product.status !== 'active') {
    throw new Error("Auction is not active");
  }

  const bids = loadBids();
  const productBids = bids.filter(b => b.productId == productId);
  
  if (productBids.length === 0) {
    throw new Error("No bids placed for this auction");
  }

  const winningBid = productBids.reduce((highest, current) => 
    current.bidAmount > highest.bidAmount ? current : highest
  );

  const orders = loadOrders();
  const maxId = orders.length > 0 ? Math.max(...orders.map(o => Number(o.id))) : 0;
  
  const newOrder = new Order(
    maxId + 1,
    productId,
    winningBid.bidderId,
    product.sellerId,
    winningBid.bidAmount,
    'Odobreno',  
    new Date().toISOString()
  );

  orders.push(newOrder);
  saveOrders(orders);

  productService.updateProduct(productId, { status: 'sold' });

  try {
    const allBidderIds = [...new Set(productBids.map(b => b.bidderId))];
    
    const winner = userService.getUserById(winningBid.bidderId);
    if (winner && winner.email) {
      await emailService.sendAuctionWinnerNotification(
        winner.email,
        winner.ime,
        product.name,
        winningBid.bidAmount
      );
    }

    for (const bidderId of allBidderIds) {
      if (bidderId != winningBid.bidderId) {
        const bidder = userService.getUserById(bidderId);
        if (bidder && bidder.email) {
          await emailService.sendAuctionLostNotification(
            bidder.email,
            bidder.ime,
            product.name,
            winningBid.bidAmount
          );
        }
      }
    }

    const seller = userService.getUserById(product.sellerId);
    if (seller && seller.email) {
      const winnerName = winner ? winner.ime + ' ' + winner.prezime : 'Nepoznat kupac';
      await emailService.sendAuctionEndedSellerNotification(
        seller.email,
        seller.ime,
        product.name,
        winningBid.bidAmount,
        winnerName
      );
    }
  } catch (emailError) {
    console.error('Error sending auction end notifications:', emailError);
  }

  return newOrder;
}

async function approveOrder(orderId, sellerId) {
  const orders = loadOrders();
  const order = orders.find(o => o.id == orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (isProductDeleted(order.productId)) {
    throw new Error("Product has been deleted");
  }

  if (order.sellerId != sellerId) {
    throw new Error("Only the seller can approve this order");
  }

  if (order.status !== 'Obrada') {
    throw new Error("Order cannot be approved in current status");
  }

  order.status = 'Odobreno';
  saveOrders(orders);

  const product = productService.getProductById(order.productId);
  
  await emailService.sendApprovalNotification(order.buyerId, sellerId, product.name, order.price);

  return order;
}

async function rejectOrder(orderId, sellerId, rejectionReason) {
  const orders = loadOrders();
  const order = orders.find(o => o.id == orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (isProductDeleted(order.productId)) {
    throw new Error("Product has been deleted");
  }

  if (order.sellerId != sellerId) {
    throw new Error("Only the seller can reject this order");
  }

  if (order.status !== 'Obrada') {
    throw new Error("Order cannot be rejected in current status");
  }

  order.status = 'Odbačeno';
  order.rejectionReason = rejectionReason;
  saveOrders(orders);

  productService.updateProduct(order.productId, { status: 'active' });

  const product = productService.getProductById(order.productId);

  await emailService.sendRejectionNotification(order.buyerId, sellerId, product.name, rejectionReason);

  return order;
}

async function cancelOrder(orderId, buyerId) {
  const orders = loadOrders();
  const order = orders.find(o => o.id == orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (isProductDeleted(order.productId)) {
    throw new Error("Product has been deleted");
  }

  if (order.buyerId != buyerId) {
    throw new Error("Only the buyer can cancel this order");
  }

  if (order.status !== 'Obrada') {
    throw new Error("Order can only be cancelled if it's in processing status");
  }

  order.status = 'Otkazano';
  saveOrders(orders);

  productService.updateProduct(order.productId, { status: 'active' });

  const product = productService.getProductById(order.productId);

  await emailService.sendCancellationNotification(buyerId, order.sellerId, product.name);

  return order;
}

function getAllOrders() {
  const orders = loadOrders();
  return orders.filter(o => !isProductDeleted(o.productId));
}

function getOrdersByBuyer(buyerId) {
  const orders = loadOrders();
  return orders.filter(o => {
    if (o.buyerId != buyerId) return false;
    return !isProductDeleted(o.productId);
  });
}

function getOrdersBySeller(sellerId) {
  const orders = loadOrders();
  return orders.filter(o => {
    if (o.sellerId != sellerId) return false;
    return !isProductDeleted(o.productId);
  });
}

function getOrderById(orderId) {
  const orders = loadOrders();
  const order = orders.find(o => o.id == orderId);
  if (order && isProductDeleted(order.productId)) {
    return null;
  }
  return order;
}

function getBidsForProduct(productId) {
  if (isProductDeleted(productId)) {
    return [];
  }
  const bids = loadBids();
  return bids.filter(b => b.productId == productId).sort((a, b) => b.bidAmount - a.bidAmount);
}

function getHighestBidForProduct(productId) {
  const bids = getBidsForProduct(productId);
  return bids.length > 0 ? bids[0] : null;
}

function getAllBids() {
  return loadBids();
}

module.exports = {
  createFixedPriceOrder,
  placeBid,
  endAuction,
  approveOrder,
  rejectOrder,
  cancelOrder,
  getAllOrders,
  getOrdersByBuyer,
  getOrdersBySeller,
  getOrderById,
  getBidsForProduct,
  getHighestBidForProduct,
  getAllBids
};