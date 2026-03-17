import React, { useState, useEffect } from "react";
import { getCategories, createCategory } from "../services/categoryService";
import ImageCarousel from "./ImageCarousel";
import LocationMap from "./LocationMap";
import '../css/AddProductPage.css';

const ProductForm = ({ initialData, onSubmit }) => {
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "", 
    price: "",
    saleType: "fixed",
  });
  
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [location, setLocation] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

const fetchCategories = () => {
  getCategories()
    .then(res => {
      const serbianCollator = new Intl.Collator('sr-Latn-RS');
      const sortedCategories = res.data.sort((a, b) => 
        serbianCollator.compare(a.name, b.name)
      );
      
      setCategories(sortedCategories);
      
      if (initialData && initialData.category) {
        const categoryName = initialData.category?.name || initialData.category;
        const categoryExists = res.data.some(cat => cat.name === categoryName);
        
        if (!categoryExists) {
          setShowCustomCategory(true);
          setCustomCategory(categoryName);
        }
      }
    })
    .catch(err => console.error(err));
};

  useEffect(() => {
    fetchCategories();

    if (initialData) {
      setProduct({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category?.name || "", 
        price: initialData.price || "",
        saleType: initialData.saleType || "fixed",
      });
      
      if (initialData.images && initialData.images.length > 0) {
        setExistingImages(initialData.images);
        setImagePreviewUrls(initialData.images.map(img => `http://localhost:5000${img}`));
      }

      if (initialData.location) {
        setLocation(initialData.location);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === "CUSTOM") {
      setShowCustomCategory(true);
      setProduct(prev => ({ ...prev, category: "" }));
      setCustomCategory("");
    } else {
      setShowCustomCategory(false);
      setCustomCategory("");
      setProduct(prev => ({ ...prev, category: value }));
    }
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    setProduct(prev => ({ ...prev, category: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    if (index < existingImages.length) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newImageIndex = index - existingImages.length;
      setImages(prev => prev.filter((_, i) => i !== newImageIndex));
    }
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (locationData) => {
    setLocation(locationData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      alert('Molimo prijavite se da biste dodali proizvod');
      return;
    }
    
    if (!location) {
      alert('Morate odabrati lokaciju proizvoda!');
      return;
    }
    
    if (!location.latitude || !location.longitude) {
      alert('Molimo odaberite validnu lokaciju na mapi');
      return;
    }

    if (!product.category || product.category.trim() === "") {
      alert('Molimo unesite ili izaberite kategoriju!');
      return;
    }

    // Ako je custom kategorija, sačuvaj je
    if (showCustomCategory) {
      try {
        await createCategory(product.category);
        fetchCategories();
      } catch (error) {
        // Ako već postoji, to je OK, nastavi dalje
        console.log('Category might already exist:', error);
      }
    }
    
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('category', product.category);
    formData.append('price', product.price);
    formData.append('saleType', product.saleType);
    formData.append('sellerId', currentUser.id);
    formData.append('location', JSON.stringify(location));
    
    if (existingImages.length > 0) {
      formData.append('existingImages', JSON.stringify(existingImages));
    }
    
    images.forEach(image => {
      formData.append('images', image);
    });
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Greška pri čuvanju proizvoda');
    }
  };

  return (
    <div className="product-form-container">
      <h1>{initialData ? "Izmeni proizvod" : "Dodaj proizvod"}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Naziv proizvoda</label>
          <input
            type="text"
            name="name"
            placeholder="Unesite naziv"
            value={product.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Opis</label>
          <textarea
            name="description"
            placeholder="Unesite opis"
            value={product.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>Kategorija</label>
          <select
            name="category"
            value={showCustomCategory ? "CUSTOM" : product.category}
            onChange={handleCategoryChange}
            required
          >
            <option value="" disabled>Izaberite kategoriju</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat.name}>
                {cat.name}
              </option>
            ))}
            <option value="CUSTOM">Drugo (dodaj novu kategoriju)</option>
          </select>
        </div>

        {showCustomCategory && (
          <div className="form-group">
            <label>Nova kategorija</label>
            <input
              type="text"
              placeholder="Unesite naziv nove kategorije"
              value={customCategory}
              onChange={handleCustomCategoryChange}
              required
            />
            <p className="help-text">Unesite jedinstveni naziv kategorije</p>
          </div>
        )}

        <div className="form-group">
          <label>Cena (RSD)</label>
          <input
            type="number"
            name="price"
            placeholder="Unesite cenu"
            value={product.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tip prodaje</label>
          <select name="saleType" value={product.saleType} onChange={handleChange}>
            <option value="fixed">Fiksna cena</option>
            <option value="auction">Aukcija</option>
          </select>
        </div>

        <div className="form-group">
          <label>Lokacija proizvoda <span style={{color: 'red'}}>*</span></label>
          <LocationMap 
            onLocationSelect={handleLocationSelect}
            initialLocation={location}
            editable={true}
            height="400px"
          />
          {location && location.latitude && location.longitude ? (
            <div className="location-info location-success">
              <p><strong>✓ Odabrana lokacija:</strong></p>
              <p>{location.city && location.country 
                ? `${location.city}, ${location.country}` 
                : location.fullAddress || 'Lokacija odabrana'
              }</p>
            </div>
          ) : (
            <p className="location-required">⚠ Molimo odaberite lokaciju proizvoda (pretražite adresu ili kliknite na mapu)</p>
          )}
        </div>

        <div className="form-group">
          <label>Slike proizvoda</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input"
          />
          <p className="help-text">Možete odabrati više slika odjednom (maksimalno 10)</p>
        </div>

        {imagePreviewUrls.length > 0 && (
          <div className="image-preview-section">
            <h3>Pregled slika ({imagePreviewUrls.length})</h3>
            <div style={{ height: '400px', marginBottom: '20px' }}>
              <ImageCarousel 
                images={imagePreviewUrls}
                height="400px"
              />
            </div>
            
            <div className="image-thumbnails">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="thumbnail-container">
                  <img 
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="thumbnail-image"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="submit-btn">
          {initialData ? "Sačuvaj izmene" : "Kreiraj proizvod"}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;