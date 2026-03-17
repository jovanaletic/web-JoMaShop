import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

export const getAllUsers = () => api.get("/users");

export const getUserById = (id) => api.get(`/users/${id}`);

export const createUser = (userData) => {
  const formData = new FormData();
  
  Object.keys(userData).forEach(key => {
    if (userData[key] !== null && userData[key] !== undefined) {
      formData.append(key, userData[key]);
    }
  });
  
  return api.post("/users", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const updateUser = (id, userData) => {
  const formData = new FormData();
  
  Object.keys(userData).forEach(key => {
    if (userData[key] !== null && userData[key] !== undefined) {
      formData.append(key, userData[key]);
    }
  });
  
  return api.put(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const deleteUser = (id) => api.delete(`/users/${id}`);

export const blockUser = (id) => api.put(`/users/${id}/block`);

export const unblockUser = (id) => api.put(`/users/${id}/unblock`);

export const loginUser = async (korisnickoIme, lozinka) => {
  try {
    const response = await api.post("/users/login", { korisnickoIme, lozinka });
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};