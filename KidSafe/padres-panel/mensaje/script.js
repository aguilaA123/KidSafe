// === Importar Firebase desde CDN ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// === Configuración Firebase KidSafe ===
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

// Autenticación anónima
await signInAnonymously(auth).catch(err => console.error("Error login anónimo:", err));

// Contenedor donde irán los mensajes
const list = document.getElementById("mensajes-list");

// Icono de Mensaje (lucide mail)
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
     viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     class="lucide lucide-mail-icon">
  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
  <rect x="2" y="4" width="20" height="16" rx="2"/>
</svg>`;

// Helpers
const resumen = (t, n=60) => {
  if (!t) return "—";
  const s = String(t).trim();
  return s.length > n ? s.slice(0, n).trim() + "…" : s;
};
// Extrae número del id tipo "mensaje123"
function numFromId(id) {
  const m = String(id).match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}
// Convierte "DD/MM/AA" -> número AAAAMMDD (asumiendo 20AA)
function yyyymmddFromFecha(fechaStr) {
  const m = String(fechaStr || '').match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const [_, dd, mm, aa] = m;
  const yyyy = 2000 + parseInt(aa, 10); // 20AA
  return parseInt(`${yyyy}${mm}${dd}`, 10);
}

// Modal dinámico
function showModal(texto, fecha) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card">
      <button class="modal-close" aria-label="Cerrar">×</button>
      <h3>Mensaje completo</h3>
      <p class="modal-text">${texto || "(Sin texto)"}</p>
      <p class="modal-fecha">Fecha: ${fecha || "—"}</p>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

// Render en tiempo real
onSnapshot(collection(db, "mensaje"), (snapshot) => {
  // armar array
  const arr = [];
  snapshot.forEach(docSnap => {
    const d = docSnap.data() || {};
    arr.push({
      id: docSnap.id,
      texto: d.texto || "",
      fecha: d.fecha || "—"
    });
  });

  // ordenar: por número en id desc, luego por fecha desc (DD/MM/AA)
  arr.sort((a, b) => {
    const ai = numFromId(a.id);
    const bi = numFromId(b.id);
    if (ai !== null && bi !== null && ai !== bi) return bi - ai;

    const af = yyyymmddFromFecha(a.fecha);
    const bf = yyyymmddFromFecha(b.fecha);
    if (af !== null && bf !== null && af !== bf) return bf - af;

    return 0;
  });

  // pintar
  list.innerHTML = "";
  if (!arr.length) {
    const p = document.createElement("p");
    p.textContent = "No hay mensajes aún.";
    p.style.color = "#b7c0d6";
    list.appendChild(p);
    return;
  }

  arr.forEach(msg => {
    const card = document.createElement("div");
    card.className = "msg-card";
    card.innerHTML = `
      <div class="msg-head">
        <span class="msg-icon" aria-hidden="true">${iconSVG}</span>
        <div>
          <div class="msg-title">Mensaje</div>
          <div class="msg-snippet">${resumen(msg.texto)}</div>
        </div>
      </div>
      <div class="msg-date">${msg.fecha}</div>
    `;
    card.addEventListener("click", () => showModal(msg.texto, msg.fecha));
    list.appendChild(card);
  });
}, (err) => {
  console.error("onSnapshot mensaje error:", err);
  list.innerHTML = "<p style='color:#f87171'>Error leyendo mensajes.</p>";
});