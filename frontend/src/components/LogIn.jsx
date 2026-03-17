import React, { useState } from "react";
import { loginUser } from "../services/userService";

const Login = ({ onLogin, onSwitchToRegister, onClose }) => {
  const [formData, setFormData] = useState({
    korisnickoIme: "",
    lozinka: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.korisnickoIme || !formData.lozinka) {
      setError("Sva polja su obavezna");
      setLoading(false);
      return;
    }

    try {
      const user = await loginUser(formData.korisnickoIme, formData.lozinka);
      onLogin(user);
    } catch (err) {
      console.log("Login error:", err.response);
      
      if (err.response?.status === 401) {
        setError("Pogrešno korisničko ime ili lozinka");
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.error || "Ne možete se prijaviti jer vas je administrator blokirao");
      } else {
        setError("Greška pri prijavljivanju. Pokušajte ponovo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-form">
        <div className="auth-header">
          <h2>Prijava</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Nemate nalog?{" "}
            <button
              type="button"
              className="switch-btn"
              onClick={onSwitchToRegister}
            >
              Registrujte se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;