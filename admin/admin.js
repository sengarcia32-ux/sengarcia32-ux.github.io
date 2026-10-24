import { app, db, isConfigured } from "../js/firebase.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const views = {
  setup: document.getElementById("setup-notice"),
  login: document.getElementById("login-view"),
  denied: document.getElementById("denied-view"),
  dash: document.getElementById("dash-view"),
};

function show(name) {
  document.getElementById("loading").hidden = true;
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

// Shrinks a photo so it fits inside a Firestore document (1 MB limit) without Firebase Storage.
async function resizeImage(file, maxSize = 800) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.8, 0.65, 0.5]) {
    const data = canvas.toDataURL("image/jpeg", quality);
    if (data.length < 600_000) return data;
  }
  throw new Error("image too large");
}

function button(label, className, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = className;
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

if (!isConfigured) {
  show("setup");
} else {
  const auth = getAuth(app);
  const productsRef = collection(db, "products");
  let stopWatching = null;

  // ---- Product list ----
  const list = document.getElementById("product-list");
  const status = document.getElementById("products-status");

  function productRow(id, p) {
    const li = document.createElement("li");
    li.className = "product-row";

    const thumb = document.createElement(p.imageUrl ? "img" : "div");
    thumb.className = "thumb";
    if (p.imageUrl) {
      thumb.src = p.imageUrl;
      thumb.alt = "";
    }

    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("strong");
    name.textContent = p.name;
    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `${peso.format(p.price ?? 0)} · Stock: ${p.stock ?? 0}`;
    info.append(name, meta);

    const badge = document.createElement("span");
    badge.className = p.active ? "badge on" : "badge off";
    badge.textContent = p.active ? "Nasa store" : "Nakatago";

    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      button("Edit", "secondary", () => openForm(id, p)),
      button("Delete", "danger", () => removeProduct(id, p)),
    );

    li.append(thumb, info, badge, actions);
    return li;
  }

  function watchProducts() {
    stopWatching?.();
    stopWatching = onSnapshot(
      query(productsRef, orderBy("createdAt", "desc")),
      (snap) => {
        status.hidden = !snap.empty;
        status.textContent = "Wala pang products. I-click ang \"+ Magdagdag\" para gumawa ng una.";
        list.replaceChildren(...snap.docs.map((d) => productRow(d.id, d.data())));
      },
      (err) => {
        status.hidden = false;
        status.textContent = `Hindi ma-load ang products (${err.code}).`;
      },
    );
  }

  async function removeProduct(id, p) {
    if (!confirm(`I-delete ang "${p.name}"? Hindi na ito maibabalik.`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      alert(`Hindi ma-delete (${err.code}).`);
    }
  }

  // ---- Add / edit form ----
  const dialog = document.getElementById("product-dialog");
  const form = document.getElementById("product-form");
  const field = (name) => form.elements.namedItem(name);
  const formError = document.getElementById("product-error");
  const saveButton = document.getElementById("product-save");
  const preview = document.getElementById("image-preview");
  const imageInput = document.getElementById("image-input");
  const imageRemove = document.getElementById("image-remove");
  let editingId = null;
  let imageData = "";

  function setImage(data) {
    imageData = data;
    preview.hidden = !data;
    imageRemove.hidden = !data;
    if (data) preview.src = data;
    else preview.removeAttribute("src");
  }

  function openForm(id = null, p = {}) {
    editingId = id;
    document.getElementById("product-form-title").textContent = id ? "I-edit ang product" : "Bagong product";
    field("name").value = p.name ?? "";
    field("price").value = p.price ?? "";
    field("stock").value = p.stock ?? 0;
    field("description").value = p.description ?? "";
    field("active").checked = p.active ?? true;
    setImage(p.imageUrl ?? "");
    formError.textContent = "";
    dialog.showModal();
  }

  imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];
    imageInput.value = "";
    if (!file) return;
    formError.textContent = "";
    try {
      setImage(await resizeImage(file));
    } catch {
      formError.textContent = "Hindi magamit ang picture na ito. Subukan ang ibang file.";
    }
  });

  imageRemove.addEventListener("click", () => setImage(""));
  document.getElementById("product-cancel").addEventListener("click", () => dialog.close());
  document.getElementById("add-product").addEventListener("click", () => openForm());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: field("name").value.trim(),
      price: Number(field("price").value),
      stock: Math.max(0, Math.floor(Number(field("stock").value) || 0)),
      description: field("description").value.trim(),
      imageUrl: imageData,
      active: field("active").checked,
      updatedAt: serverTimestamp(),
    };
    if (!data.name) {
      formError.textContent = "Lagyan ng pangalan ang product.";
      return;
    }
    saveButton.disabled = true;
    try {
      if (editingId) await updateDoc(doc(db, "products", editingId), data);
      else await addDoc(productsRef, { ...data, createdAt: serverTimestamp() });
      dialog.close();
    } catch (err) {
      formError.textContent = `Hindi ma-save (${err.code || err.message}).`;
    } finally {
      saveButton.disabled = false;
    }
  });

  // ---- Auth ----
  onAuthStateChanged(auth, async (user) => {
    stopWatching?.();
    stopWatching = null;
    if (!user) return show("login");

    document.getElementById("denied-uid").textContent = user.uid;
    let isAdmin = false;
    try {
      isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists();
      document.getElementById("denied-reason").textContent = "Hindi pa admin ang account na ito.";
    } catch (err) {
      document.getElementById("denied-reason").textContent =
        `Hindi ma-check ang access (${err.code}). Na-publish mo na ba ang firestore.rules?`;
    }
    if (!isAdmin) return show("denied");

    document.getElementById("who").textContent = user.email;
    show("dash");
    watchProducts();
  });

  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const { email, password } = Object.fromEntries(new FormData(loginForm));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginForm.reset();
    } catch (err) {
      loginError.textContent = err.code === "auth/invalid-credential"
        ? "Mali ang email o password."
        : `Hindi maka-login (${err.code}).`;
    }
  });

  for (const id of ["logout", "denied-logout"]) {
    document.getElementById(id).addEventListener("click", () => signOut(auth));
  }
}
