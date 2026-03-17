import axios from 'axios';

const API_URL = 'http://localhost:5000/reviews';

export const getReviewsByBuyer = async (buyerId) => {
  return axios.get(`${API_URL}/buyer/${buyerId}`);
};

export const getReviewsBySeller = async (sellerId) => {
  return axios.get(`${API_URL}/seller/${sellerId}`);
};


export const getVisibleReviewsByBuyerForSeller = async (buyerId, sellerId) => {
  return axios.get(`${API_URL}/buyer/${buyerId}/visible-to-seller/${sellerId}`);
};

export const createReview = async (productId, sellerId, buyerId, orderId, rating, comment, reviewerRole) => {
  return axios.post(API_URL, {
    productId,
    sellerId,
    buyerId,
    orderId,
    rating,
    comment,
    reviewerRole
  });
};

export const getReviewByOrderId = async (orderId, reviewerRole) => {
  return axios.get(`${API_URL}/order/${orderId}/${reviewerRole}`);
};