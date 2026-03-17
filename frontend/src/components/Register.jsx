import React, { useState } from "react";
import { createUser } from "../services/userService";

const Register = ({ onRegister, onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    ime: "",
    prezime: "",
    korisnickoIme: "",
    email: "",
    telefon: "",
    lozinka: "",
    potvrdaLozinke: "",
    uloga: "kupac",
    profilnaSlika: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilnaSlika: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    const requiredFields = ['ime', 'prezime', 'korisnickoIme', 'email', 'telefon', 'lozinka'];
    for (let field of requiredFields) {
      if (!formData[field].trim()) {
        return "Sva polja su obavezna";
      }
    }

    if (formData.lozinka !== formData.potvrdaLozinke) {
      return "Lozinke se ne poklapaju";
    }

    if (formData.lozinka.length < 6) {
      return "Lozinka mora imati najmanje 6 karaktera";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Unesite validan email";
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.telefon)) {
      return "Unesite validan broj telefona";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const { potvrdaLozinke, ...userData } = formData;
      console.log("Attempting registration with:", userData);
      
      const response = await createUser(userData);
      const user = response.data;
      
      console.log("Registration response:", user);
      onRegister(user);
    } catch (err) {
  console.error("Registration error:", err);
  
  if (err.response?.data?.error) {
    // Prikaži tačnu grešku sa servera
    if (err.response.data.error.includes("Username")) {
      setError("Korisničko ime već postoji"); // Samo korisničko ime
    } else {
      setError(err.response.data.error);
    }
  } else if (err.response?.status === 500) {
    setError("Greška na serveru. Pokušajte ponovo.");
  } else {
    setError("Greška pri registraciji. Pokušajte ponovo.");
  }
}
  };

  return (
    <div className="auth-modal">
      <div className="auth-form register-form">
        <div className="auth-header">
          <h2>Registracija</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profilna slika */}
          <div className="form-group">
            <label htmlFor="profilnaSlika">Profilna slika:</label>
            <div className="image-upload-container">
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
              <input
                type="file"
                id="profilnaSlika"
                name="profilnaSlika"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginTop: '10px' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ime">Ime:</label>
              <input
                type="text"
                id="ime"
                name="ime"
                value={formData.ime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prezime">Prezime:</label>
              <input
                type="text"
                id="prezime"
                name="prezime"
                value={formData.prezime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="korisnickoIme">Korisničko ime:</label>
            <input
              type="text"
              id="korisnickoIme"
              name="korisnickoIme"
              value={formData.korisnickoIme}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefon">Telefon:</label>
            <input
              type="tel"
              id="telefon"
              name="telefon"
              value={formData.telefon}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="uloga">Uloga:</label>
            <select
              id="uloga"
              name="uloga"
              value={formData.uloga}
              onChange={handleChange}
              required
            >
              <option value="kupac">Kupac</option>
              <option value="prodavac">Prodavac</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lozinka">Lozinka:</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="lozinka"
                  name="lozinka"
                  value={formData.lozinka}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="potvrdaLozinke">Potvrdi lozinku:</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="potvrdaLozinke"
                  name="potvrdaLozinke"
                  value={formData.potvrdaLozinke}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Registracija..." : "Registruj se"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Već imate nalog?{" "}
            <button
              type="button"
              className="switch-btn"
              onClick={onSwitchToLogin}
            >
              Prijavite se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;