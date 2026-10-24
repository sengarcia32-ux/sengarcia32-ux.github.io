import { app, db, isConfigured } from "../js/firebase.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, doc, getCountFromServer, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

function checkItem(label, ok) {
  const li = document.createElement("li");
  li.className = ok ? "ok" : "fail";
  li.textContent = label;
  return li;
}

async function runChecks() {
  const list = document.getElementById("checks");
  list.replaceChildren(checkItem("Firebase connected", true), checkItem("Admin access", true));
  try {
    const snap = await getCountFromServer(collection(db, "products"));
    list.append(checkItem(`Products collection readable (${snap.data().count} items)`, true));
  } catch (err) {
    list.append(checkItem(`Products collection: ${err.code}`, false));
  }
}

if (!isConfigured) {
  show("setup");
} else {
  const auth = getAuth(app);

  onAuthStateChanged(auth, async (user) => {
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
    runChecks();
  });

  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const { email, password } = Object.fromEntries(new FormData(form));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      form.reset();
    } catch (err) {
      errorEl.textContent = err.code === "auth/invalid-credential"
        ? "Mali ang email o password."
        : `Hindi maka-login (${err.code}).`;
    }
  });

  for (const id of ["logout", "denied-logout"]) {
    document.getElementById(id).addEventListener("click", () => signOut(auth));
  }
}
