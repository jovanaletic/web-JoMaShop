const fs = require("fs");
const path = require("path");
const User = require("../model/user");

const usersFile = path.join(__dirname, "..", "data", "users.json");

function loadUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function createUser(data) {
  // Kreiraj data folder ako ne postoji
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const users = loadUsers();
  
  // PROVERI SAMO KORISNIČKO IME (ne email)
  const existingUser = users.find(u => 
    u.korisnickoIme === data.korisnickoIme
  );
  
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const maxId = users.length > 0
    ? Math.max(...users.map(u => Number(u.id)))
    : 0;

  const newUser = new User(
    maxId + 1,
    data.ime,
    data.prezime,
    data.korisnickoIme,
    data.email,
    data.telefon,
    data.lozinka,
    data.datumRodjenja || null,
    data.profilnaSlika || null,
    data.opis || null,
    data.uloga || "kupac"
  );

  users.push(newUser);
  saveUsers(users);

  return newUser;
}

function loginUser(korisnickoIme, lozinka) {
  const users = loadUsers();
  
  console.log("Searching for user:", korisnickoIme); 
  console.log("All users:", users.map(u => ({ 
    id: u.id, 
    korisnickoIme: u.korisnickoIme, 
    lozinka: u.lozinka,
    blokiran: u.blokiran
  }))); 
  
  const user = users.find(u => u.korisnickoIme === korisnickoIme);
  
  if (!user) {
    console.log("User not found"); 
    return null;
  }
  
  // UKLONJENA PROVERA BLOKIRANJA - backend ruta će proveriti
  // Backend u userRoutes.js će proveriti user.blokiran i vratiti 403
  
  console.log("Found user, checking password:", { 
    provided: lozinka, 
    stored: user.lozinka 
  }); 
  
  if (user.lozinka !== lozinka) {
    console.log("Password mismatch"); 
    return null;
  }
  
  console.log("Login successful for user:", user.korisnickoIme); 
  return user; // Vraća korisnika čak i ako je blokiran
}

function getAllUsers() {
  return loadUsers();
}

function getUserById(id) {
  const users = loadUsers();
  return users.find(u => u.id == id);
}

function updateUser(id, data) {
  const users = loadUsers();
  const user = users.find(u => u.id == id);

  if (!user) return null;
  
  // Provera lozinke za promenu korisničkog imena
  if (data.korisnickoIme && data.korisnickoIme !== user.korisnickoIme) {
    if (!data.passwordForUsername || user.lozinka !== data.passwordForUsername) {
      throw new Error('Lozinka nije tačna - ne možete promeniti korisničko ime');
    }
    // Provera da li korisničko ime već postoji
    const existingUser = users.find(u => u.korisnickoIme === data.korisnickoIme && u.id != id);
    if (existingUser) {
      throw new Error('Korisničko ime već postoji');
    }
  }

  // Provera lozinke za promenu email-a
  if (data.email && data.email !== user.email) {
    if (!data.passwordForEmail || user.lozinka !== data.passwordForEmail) {
      throw new Error('Lozinka nije tačna - ne možete promeniti email');
    }
  }

  // Provera stare lozinke ako se menja lozinka
  if (data.oldPassword && data.lozinka) {
    if (user.lozinka !== data.oldPassword) {
      throw new Error('Stara lozinka nije tačna');
    }
    user.lozinka = data.lozinka;
  }

  // Uklanjanje profilne slike - OVO IMA PRIORITET
  if (data.removeProfileImage === true) {
    if (user.profilnaSlika) {
      const oldImagePath = path.join(__dirname, '..', user.profilnaSlika);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    user.profilnaSlika = null;
    delete data.profilnaSlika;
  }
  // Ako postoji nova slika (i nije uklanjanje), obriši staru
  else if (data.profilnaSlika && data.profilnaSlika !== user.profilnaSlika) {
    if (user.profilnaSlika) {
      const oldImagePath = path.join(__dirname, '..', user.profilnaSlika);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    user.profilnaSlika = data.profilnaSlika;
  }

  // Ažuriranje ostalih polja
  for (const key in data) {
    if (key !== "id" && 
        key !== "oldPassword" && 
        key !== "removeProfileImage" && 
        key !== "passwordForEmail" && 
        key !== "passwordForUsername" &&
        key !== "profilnaSlika") {
      user[key] = data[key];
    }
  }

  saveUsers(users);
  return user;
}
function deleteUser(id) {
  const users = loadUsers();
  const index = users.findIndex(u => u.id == id);

  if (index === -1) return null;

  const deletedUser = users.splice(index, 1)[0];
  
  // Obriši profilnu sliku ako postoji
  if (deletedUser.profilnaSlika) {
    const imagePath = path.join(__dirname, '..', deletedUser.profilnaSlika);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  saveUsers(users);

  return deletedUser;
}

function blockUser(id) {
  const users = loadUsers();
  const user = users.find(u => u.id == id);

  if (!user) return null;

  user.blokiran = true;
  saveUsers(users);

  return user;
}

function unblockUser(id) {
  const users = loadUsers();
  const user = users.find(u => u.id == id);

  if (!user) return null;

  user.blokiran = false;
  saveUsers(users);

  return user;
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  loginUser, 
};