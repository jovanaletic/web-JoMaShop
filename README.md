# JoMaShop

JoMaShop je projekat rađen u okviru predmeta **Web programiranje**.

## Opis

Aplikacija predstavlja **online shop** platformu za pregled i upravljanje proizvodima i porudžbinama.

## Tehnologije

- **Backend:** JavaScript (Node.js + Express)
- **Frontend:** JavaScript (React)

## Pokretanje projekta

1. Instaliraj backend zavisnosti:
```bash
cd backend
npm install
```

2. Pokreni backend:
```bash
cd backend
node index.js
```

3. Instaliraj frontend zavisnosti:
```bash
cd frontend
npm install
```

4. Pokreni frontend:
```bash
cd frontend
npm start
```

## Napomena za email (.env)

U `backend` folderu možeš kreirati `.env` fajl za email funkcionalnosti:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=JoMaShop <your_email@gmail.com>
```

Ako ove vrednosti nisu podešene, delovi aplikacije koji šalju email mogu praviti greške.

---

# English

JoMaShop is a project created as part of the **Web Programming** course.

## Description

The application is an **online shop** platform for browsing and managing products and orders.

## Technologies

- **Backend:** JavaScript (Node.js + Express)
- **Frontend:** JavaScript (React)

## Running the project

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Start backend:
```bash
cd backend
node index.js
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Start frontend:
```bash
cd frontend
npm start
```

## Email note (.env)

In the `backend` folder, you can create a `.env` file for email features:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=JoMaShop <your_email@gmail.com>
```

If these values are not configured, app flows that send emails may throw errors.
