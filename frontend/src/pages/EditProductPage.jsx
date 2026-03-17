import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { getProduct, updateProduct } from "../services/productService";
//import '../css/EditProductPage.css'; 
import '../css/AddProductPage.css';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    getProduct(id).then(res => setProduct(res.data));
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      await updateProduct(id, formData);
      alert('Proizvod je uspešno ažuriran!');
      navigate("/");
    } catch (error) {
      console.error('Greška pri ažuriranju proizvoda:', error);
      alert('Greška pri ažuriranju proizvoda: ' + (error.response?.data?.error || error.message));
    }
  };

  if (!product) return <p>Loading product...</p>;

  return (
    <div className="edit-product-container">
      <ProductForm initialData={product} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditProductPage;