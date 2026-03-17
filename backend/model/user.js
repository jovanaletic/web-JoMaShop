const Product = require("./product");

class User {
    constructor(id, ime, prezime, korisnickoIme, email, telefon, lozinka, datumRodjenja, profilnaSlika, opis, uloga) {
        this.id = id;
        this.ime = ime;
        this.prezime = prezime;
        this.korisnickoIme = korisnickoIme;
        this.email = email;
        this.telefon = telefon;
        this.lozinka = lozinka;
        this.datumRodjenja = datumRodjenja;
        this.profilnaSlika = profilnaSlika || "";
        this.opis = opis || "";
        this.uloga = uloga; // Kupac | Prodavac | Administrator
        this.blokiran = false;

        // ako je kupac/prodavac:
        this.proizvodi = [];   // lista Product objekata (prodavac = prodaje, kupac = kupljeni)
        this.recenzije = [];   // lista recenzija (npr. stringovi ili posebna klasa Review)
        this.prosecnaOcena = 0;
    }

    addProduct(productData) {
        const product = new Product(
            productData.id,
            productData.name,
            productData.description,
            productData.category,
            productData.price,
            productData.saleType
        );
        this.proizvodi.push(product);
    }

    addReview(review) {
        this.recenzije.push(review);
        this._updateAverageRating();
    }

    _updateAverageRating() {
        if (this.recenzije.length === 0) {
            this.prosecnaOcena = 0;
            return;
        }
        const sum = this.recenzije.reduce((acc, r) => acc + r.rating, 0);
        this.prosecnaOcena = sum / this.recenzije.length;
    }
}

module.exports = User;
