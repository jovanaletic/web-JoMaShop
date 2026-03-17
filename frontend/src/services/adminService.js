import axios from 'axios';

const API_URL = 'http://localhost:5000/admin';



export const getAllReviews = async () => {
  return await axios.get(`${API_URL}/reviews`);
};

export const updateReview = async (id, reviewData) => {
  return await axios.put(`${API_URL}/reviews/${id}`, reviewData);
};

export const deleteReview = async (id) => {
  return await axios.delete(`${API_URL}/reviews/${id}`);
};



export const acceptReport = async (id, adminId) => {
  return await axios.post(`${API_URL}/reports/${id}/accept`, { adminId });
};

export const rejectReport = async (id, adminId, rejectionReason) => {
  return await axios.post(`${API_URL}/reports/${id}/reject`, { adminId, rejectionReason });
};



export const getSuspiciousUsers = async () => {
  return await axios.get(`${API_URL}/suspicious-users`);
};



export const getAllUsersAdmin = async () => {
  return await axios.get(`${API_URL}/users`);
};

export const blockUserAdmin = async (id) => {
  return await axios.post(`${API_URL}/users/${id}/block`);
};

export const unblockUserAdmin = async (id) => {
  return await axios.post(`${API_URL}/users/${id}/unblock`);
};