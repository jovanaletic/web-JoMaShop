import React from "react";
import ProductForm from "../components/ProductForm";
import { createProduct } from "../services/productService";
import { useNavigate } from "react-router-dom";
import '../css/AddProductPage.css';

const AddProductPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      // NE dodavaj sellerId ovde - već je u formData iz ProductForm!
      await createProduct(formData);
      alert('Proizvod je uspešno dodat!');
      navigate("/");
    } catch (error) {
      console.error('Greška pri dodavanju proizvoda:', error);
      alert('Greška pri dodavanju proizvoda: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="add-product-container">
      <ProductForm onSubmit={handleSubmit} />
    </div>
  );
};

export default AddProductPage;