import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

export const buyFixedPriceProduct = async (productId, buyerId) =>
  api.post("/orders/buy-fixed", { productId, buyerId });

export const placeBid = async (productId, bidderId, bidAmount) =>
  api.post("/orders/bid", { productId, bidderId, bidAmount });

export const endAuction = async (productId, sellerId) =>
  api.post("/orders/end-auction", { 
    productId: Number(productId), 
    sellerId: Number(sellerId) 
  });

export const approveOrder = async (orderId, sellerId) =>
  api.put("/orders/" + orderId + "/approve", { sellerId });

export const rejectOrder = async (orderId, sellerId, rejectionReason) =>
  api.put("/orders/" + orderId + "/reject", { sellerId, rejectionReason });

export const cancelOrder = async (orderId, buyerId) =>
  api.put("/orders/" + orderId + "/cancel", { buyerId });

export const getAllOrders = async () => 
  api.get("/orders");

export const getOrdersByBuyer = async (buyerId) => 
  api.get("/orders/buyer/" + buyerId);

export const getOrdersBySeller = async (sellerId) => 
  api.get("/orders/seller/" + sellerId);

export const getBidsForProduct = async (productId) => 
  api.get("/orders/bids/" + productId);

export const getHighestBidForProduct = async (productId) => 
  api.get("/orders/highest-bid/" + productId);