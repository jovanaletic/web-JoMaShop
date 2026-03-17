import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

export const getProducts = () => api.get("/products");
export const getProduct = (id) => api.get(`/products/${id}`);
export const markProductAsSold = (id) => api.patch(`/products/${id}/mark-sold`);

export const createProduct = (formData) => {
  return api.post("/products", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateProduct = (id, formData) => {
  return api.put(`/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const deleteProductImage = (productId, imagePath) => {
  return api.delete(`/products/${productId}/images`, {
    data: { imagePath }
  });
};