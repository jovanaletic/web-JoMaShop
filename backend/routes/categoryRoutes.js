const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Category = require("../model/category");

const categories = [
   new Category("Elektronika"),
  new Category("Knjige"),
  new Category("Garderoba"),
  new Category("Igračke"),
  new Category("Kuća"),
  new Category("Obuća"),
  new Category("Modni detalji"),
  new Category("Bašta i dvorište"),
  new Category("Automobili"),
  new Category("Kućni ljubimci"),
  new Category("Kuhinjski aparati"),
  new Category("Kupatilo"),
  new Category("Nameštaj"),
  new Category("Muzički instrumenti"),
  new Category("Sport"),
  new Category("Škola"),
  new Category("Umetnost"),
  new Category("Bebe i deca"),
  new Category("Muzika i filmovi"), 
];

const customCategoriesFile = path.join(__dirname, "..", "data", "custom-categories.json");

function loadCustomCategories() {
  if (!fs.existsSync(customCategoriesFile)) {
    fs.writeFileSync(customCategoriesFile, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(customCategoriesFile));
}

function saveCustomCategories(customCats) {
  fs.writeFileSync(customCategoriesFile, JSON.stringify(customCats, null, 2));
}

router.get("/", (req, res) => {
  const customCategories = loadCustomCategories();
  const allCategories = [...categories, ...customCategories];
  res.json(allCategories);
});

router.post("/", (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Naziv kategorije je obavezan" });
    }
    
    const customCategories = loadCustomCategories();
    const allCategories = [...categories, ...customCategories];
    
    const exists = allCategories.some(
      cat => cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (exists) {
      return res.status(400).json({ error: "Kategorija već postoji" });
    }
    
    const newCategory = new Category(name.trim());
    customCategories.push(newCategory);
    saveCustomCategories(customCategories);
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;