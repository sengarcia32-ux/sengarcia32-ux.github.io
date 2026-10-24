# Sen Store

Static na online store sa GitHub Pages, may hiwalay na admin panel. Firebase ang database at login.

| Parte | URL | Files |
|---|---|---|
| Front store | `https://sengarcia32-ux.github.io/` | `index.html`, `css/store.css`, `js/store.js` |
| Admin panel | `https://sengarcia32-ux.github.io/admin/` | `admin/` |
| Shared | | `js/firebase.js`, `js/firebase-config.js` |
| Security rules | Naka-paste sa Firebase Console | `firestore.rules` |

## Setup checklist

### 1. Firebase

Project: **game-store-webpage** (Firestore sa asia-east1) · Web app: `sen-store-web`

Tapos na:
- [x] Web app at config (`js/firebase-config.js`)
- [x] Firestore security rules: `firebase deploy --only firestore:rules`
- [x] Email/Password sign-in: naka-enable
- [x] Authorized domain: `sengarcia32-ux.github.io`

Pagdagdag ng admin:
1. Sa Firebase Console (<https://console.firebase.google.com/project/game-store-webpage/authentication/users>): **Add user**, tapos ilagay ang email at password ng admin.
2. Mag-login sa `/admin/` at kopyahin ang UID na lalabas.
3. Sa **Firestore → Data**, gumawa ng document sa collection `admins` na ang Document ID ay ang UID, at may field na `email` (string).

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
- **Product images**: hindi Firebase Storage ang gamit, dahil kailangan noon ng Blaze plan. Sa admin, pinapaliit muna ang picture (max 800px, JPEG) bago i-save, tapos nakalagay ito mismo sa product document (`imageUrl`). Bagay ito sa maliit na store. Kung dadami na nang husto ang products, lumipat sa Firebase Storage o sa ibang image host.
