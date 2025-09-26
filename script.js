// === Importar Firebase desde CDN ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// === Configuración de tu proyecto KidSafe ===
const firebaseConfig = {
  apiKey: "AIzaSyCmmCY6cLGozAJSrTWJS2EUtC356cWGtR8",
  authDomain: "kidsafe-1ebf5.firebaseapp.com",
  projectId: "kidsafe-1ebf5",
  storageBucket: "kidsafe-1ebf5.firebasestorage.app",
  messagingSenderId: "141815298333",
  appId: "1:141815298333:web:ede7be2c8444e18147c9f4",
  measurementId: "G-5F7PB5940G"
};

// === Inicializar Firebase ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === Autenticación anónima (necesaria para leer con reglas) ===
await signInAnonymously(auth).catch(err => console.error("Error en login anónimo:", err));

// === Referencias UI ===
const codeInput = document.getElementById("code");
const submitBtn = document.getElementById("submit");
const msg = document.getElementById("msg");

// === Función para mostrar mensajes ===
function say(text, type = "info") {
  msg.textContent = text;
  msg.style.color =
    type === "error" ? "#e5484d" :
    type === "ok" ? "#16a34a" :
    "#6b7280";
}

// === Verificación al hacer clic en Ingresar ===
submitBtn.addEventListener("click", async () => {
  const code = (codeInput.value || "").trim();

  if (!/^\d+$/.test(code)) {
    say("Ingresa solo números", "error");
    return;
  }

  try {
    say("Verificando…");

    // Buscar en la colección 'security' por el campo 'codigo'
    // Estructura esperada de cada documento:
    // { codigo: "12345", estado: "On" | "Off", rol: "padres" | "cuidador" }
    const colRef = collection(db, "security");
    const q = query(colRef, where("codigo", "==", code), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      say("Código incorrecto", "error");
      return;
    }

    const data = snap.docs[0].data();
    const estado = String(data.estado || "Off");
    const rol = String(data.rol || "").toLowerCase();

    if (estado !== "On") {
      say("Acceso deshabilitado por el administrador", "error");
      return;
    }

    // Redirigir según el rol
    let target = null;
    if (rol === "padres") target = "padres-panel/";
    else if (rol === "cuidador") target = "cuidador-panel/";
    else {
      // Rol desconocido: puedes definir un fallback
      say(`Rol no reconocido: ${rol}`, "error");
      return;
    }

    say("Código correcto ✓", "ok");
    setTimeout(() => { location.href = target; }, 500);

  } catch (err) {
    console.error(err);
    say("Error conectando con Firestore", "error");
  }
});

// === Abrir teclado numérico en móviles ===
window.addEventListener("DOMContentLoaded", () => codeInput?.focus());
