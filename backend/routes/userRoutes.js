const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const uploadProfile = require("../middleware/uploadProfile");

router.post("/login", (req, res) => {
  const { korisnickoIme, lozinka } = req.body;
  if (!korisnickoIme || !lozinka) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    const user = userService.loginUser(korisnickoIme, lozinka);
    
    // PRVO proveri da li korisnik postoji
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    // ZATIM proveri da li je blokiran
    if (user.blokiran) {
      return res.status(403).json({ error: "Ne možete se prijaviti na profil jer vas je administrator blokirao" });
    }
    
    const { lozinka: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", uploadProfile.single("profilnaSlika"), (req, res) => {
  try {
    const userData = { ...req.body };
    if (req.file) {
      userData.profilnaSlika = `/uploads/profiles/${req.file.filename}`;
    }
    const newUser = userService.createUser(userData);
    const { lozinka, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", (req, res) => {
  res.json(userService.getAllUsers());
});

router.get("/:id", (req, res) => {
  const user = userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { lozinka, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

router.put("/:id", uploadProfile.single("profilnaSlika"), (req, res) => {
  try {
    console.log("===UPDATE START===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("removeProfileImage value:", req.body.removeProfileImage);
    console.log("removeProfileImage type:", typeof req.body.removeProfileImage);
    
    const updateData = { ...req.body };
    
    // Konvertuj string 'true' u boolean
    if (req.body.removeProfileImage) {
      updateData.removeProfileImage = req.body.removeProfileImage === 'true' || req.body.removeProfileImage === true;
    }
    
    console.log("updateData.removeProfileImage nakon konverzije:", updateData.removeProfileImage);
    
    // Ako uklanjamo sliku, ne dodajemo novi fajl
    if (updateData.removeProfileImage === true) {
      console.log("UKLANJAM PROFILNU SLIKU");
    } else if (req.file) {
      // Samo ako nije removeProfileImage, dodaj novi fajl
      updateData.profilnaSlika = `/uploads/profiles/${req.file.filename}`;
      console.log("Dodajem novu sliku:", updateData.profilnaSlika);
    }
    
    console.log("Final updateData:", updateData);
    
    const updatedUser = userService.updateUser(req.params.id, updateData);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    
    const { lozinka, ...userWithoutPassword } = updatedUser;
    console.log("Ažurirani korisnik - profilnaSlika:", userWithoutPassword.profilnaSlika);
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  const deleted = userService.deleteUser(req.params.id);
  if (!deleted) return res.status(404).json({ error: "User not found" });
  res.json({ message: "User deleted" });
});

module.exports = router;