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

function getAllCategories() {
  return categories;
}

module.exports = {
  getAllCategories,
};
