import { db, isConfigured } from "./firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const grid = document.getElementById("products");
const notice = document.getElementById("notice");
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

function showNotice(text) {
  notice.textContent = text;
  notice.hidden = false;
}

function productCard(p) {
  const card = document.createElement("article");
  card.className = "card";
  if (p.imageUrl) {
    const img = document.createElement("img");
    img.src = p.imageUrl;
    img.alt = p.name;
    img.loading = "lazy";
    card.append(img);
  }
  const name = document.createElement("h3");
  name.textContent = p.name;
  const price = document.createElement("p");
  price.className = "price";
  price.textContent = peso.format(p.price ?? 0);
  card.append(name, price);
  return card;
}

async function loadProducts() {
  if (!isConfigured) return showNotice("Hindi pa naka-setup ang Firebase. Tingnan ang README.md.");
  try {
    // Only active products are readable by the public (see firestore.rules).
    const snap = await getDocs(query(collection(db, "products"), where("active", "==", true)));
    if (snap.empty) return showNotice("Wala pang products.");
    notice.hidden = true;
    grid.replaceChildren(...snap.docs.map((d) => productCard(d.data())));
  } catch (err) {
    console.error(err);
    showNotice("Hindi ma-load ang products. Subukan ulit mamaya.");
  }
}

loadProducts();
