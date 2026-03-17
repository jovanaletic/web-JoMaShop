import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
import ProductPage from "./pages/ProductPage";
import MyOrders from './pages/MyOrders';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './components/adminDashboard';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<HomePage />} />
        <Route path="/add-product" element={<AddProductPage />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/edit/:id" element={<EditProductPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;