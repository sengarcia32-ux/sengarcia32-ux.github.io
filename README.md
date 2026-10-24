# Sen Store

Static na online store sa GitHub Pages, may hiwalay na admin panel. Firebase ang database at login.

| Parte | URL | Files |
|---|---|---|
| Front store | `https://sengarcia32-ux.github.io/` | `index.html`, `css/store.css`, `js/store.js` |
| Admin panel | `https://sengarcia32-ux.github.io/admin/` | `admin/` |
| Shared | | `js/firebase.js`, `js/firebase-config.js` |
| Security rules | Naka-paste sa Firebase Console | `firestore.rules` |

## Setup checklist

### 1. Firebase project

1. Pumunta sa <https://console.firebase.google.com> → **Create a project**. Pwedeng i-off ang Google Analytics.
2. Sa Project Overview → **Add app** → **Web** (`</>`). Huwag i-check ang "Firebase Hosting". Kopyahin ang `firebaseConfig` papunta sa `js/firebase-config.js`.
3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
4. **Authentication → Users → Add user**: ilagay ang email at password ng admin.
5. **Build → Firestore Database → Create database**
   - Edition: **Standard** (kung tatanungin)
   - Location: **asia-southeast1 (Singapore)**. Pinakamalapit ito sa PH at hindi na mapapalitan pagkatapos.
   - **Start in production mode**
6. **Firestore → Rules**: i-paste ang laman ng `firestore.rules` → **Publish**.
7. **Firestore → Data → Start collection**
   - Collection ID: `admins`
   - Document ID: ang **UID** ng admin user (makikita sa Authentication → Users)
   - Field: `email` (string) = email ng admin
8. **Authentication → Settings → Authorized domains → Add domain**: `sengarcia32-ux.github.io`

### 2. GitHub Pages

1. Mag-login sa terminal: `gh auth login` (ikaw ang magla-login sa browser).
2. Gumawa ng public repo na `sengarcia32-ux.github.io` at i-push ang folder na ito.
3. Settings → Pages → Source: **Deploy from a branch**, Branch: `main` / `(root)`.

## Local preview

```
node dev-server.js
```

Store: <http://localhost:5500/> · Admin: <http://localhost:5500/admin/>

Kailangan ng server; hindi gagana kung bubuksan lang ang `index.html` nang direkta (file://).

## Data model (draft)

- `products/{id}`: `name`, `price` (number), `description`, `imageUrl`, `stock`, `active` (boolean)
- `orders/{id}`: `customer` {name, phone, address}, `items` [{productId, name, price, qty}], `total`, `paymentMethod`, `status` (`pending` → …), `createdAt`
- `admins/{uid}`: `email`. Sa Firebase Console lang ito dinadagdag.

## Notes

- **Public ang repo**, kaya huwag maglalagay ng passwords o secret keys sa code. OK lang na public ang Firebase config; ang `firestore.rules` ang nagpoprotekta sa data.
- **Product images**: kailangan na ng Blaze plan (may libreng quota pero kailangan ng card) para sa Firebase Storage ng bagong projects. Pwedeng alternatibo ang `images/` folder dito sa repo, o image URL galing sa ibang host.
