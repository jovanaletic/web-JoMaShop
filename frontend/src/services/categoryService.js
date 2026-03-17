import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

export const getCategories = () => api.get("/categories");

export const createCategory = (categoryName) => {
  return api.post("/categories", { name: categoryName });
};