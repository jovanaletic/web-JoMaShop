import React from "react";
import ProductDetail from "../components/ProductDetail";
import '../css/ProductPage.css'; 
const ProductPage = () => {
  return (
    <div className="products-page-container">
      <ProductDetail />
    </div>
  );
};

export default ProductPage;