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

// Contenedor donde irán los reportes
const content = document.querySelector(".content");

// --- helpers de orden ---
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

// --- Renderizar reportes ---
function renderReportes(snapshot) {
  const arr = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    arr.push({
      id: doc.id,
      texto: d.texto || "(sin texto)",
      fecha: d.fecha || "--/--/--",
    });
  });

  // Ordenar: primero por número en ID, luego por fecha
  arr.sort((a, b) => {
    const ai = numFromId(a.id);
    const bi = numFromId(b.id);
    if (ai !== null && bi !== null && ai !== bi) return bi - ai;

    const af = yyyymmddFromFecha(a.fecha);
    const bf = yyyymmddFromFecha(b.fecha);
    if (af !== null && bf !== null && af !== bf) return bf - af;

    return 0;
  });

  // Eliminar anteriores
  document.querySelectorAll(".reporte-card").forEach(e => e.remove());

  // Pintar
  arr.forEach(rep => {
    const card = document.createElement("div");
    card.className = "reporte-card";

    card.innerHTML = `
      <div class="reporte-header">
        <span class="reporte-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="lucide lucide-message-circle-warning-icon">
            <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>
            <path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
        </span>
        <div class="reporte-info">
          <span class="reporte-title">Reporte de incidencias</span>
          <span class="reporte-text">${rep.texto.length > 40 ? rep.texto.slice(0, 40) + "…" : rep.texto}</span>
        </div>
      </div>
      <div class="reporte-footer">
        <span class="reporte-fecha">${rep.fecha}</span>
      </div>
    `;

    // Modal para ver detalle completo
    card.addEventListener("click", () => {
      showModal(rep.texto, rep.fecha);
    });

    content.appendChild(card);
  });
}

// --- Modal ---
function showModal(texto, fecha) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card">
      <button class="modal-close">×</button>
      <h3>Reporte completo</h3>
      <p class="modal-text">${texto}</p>
      <p class="modal-fecha">Fecha: ${fecha}</p>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

// === Suscripción tiempo real a colección "reporte" ===
onSnapshot(collection(db, "reporte"), renderReportes);