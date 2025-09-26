// === Firebase (CDN) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, onSnapshot, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyCmmCY6cLGozAJSrTWJS2EUtC356cWGtR8",
  authDomain: "kidsafe-1ebf5.firebaseapp.com",
  projectId: "kidsafe-1ebf5",
  storageBucket: "kidsafe-1ebf5.firebasestorage.app",
  messagingSenderId: "141815298333",
  appId: "1:141815298333:web:ede7be2c8444e18147c9f4",
  measurementId: "G-5F7PB5940G"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
await signInAnonymously(auth).catch(console.error);

// ===== Listado en tiempo real =====
const list = document.getElementById("reportes-list");

// Icono del card
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
     viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     class="lucide lucide-message-circle-warning">
  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>
  <path d="M12 8v4"/><path d="M12 16h.01"/>
</svg>`;

const resumen = (t, n=60) => {
  if (!t) return "—";
  const s = String(t).trim();
  return s.length > n ? s.slice(0, n).trim() + "…" : s;
};
function numFromId(id){ const m=String(id).match(/(\d+)$/); return m?parseInt(m[1],10):null; }
function yyyymmddFromFecha(f){
  const m=String(f||'').match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if(!m) return null;
  const [_,dd,mm,aa]=m; const yyyy=2000+parseInt(aa,10);
  return parseInt(`${yyyy}${mm}${dd}`,10);
}

// Modal simple para ver completo (opcional, por si ya lo tenías)
function showModalView(texto, fecha){
  const overlay = document.createElement("div");
  overlay.className = "modal";
  overlay.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-deco" aria-hidden="true">${iconSVG}</span>
        <h3 class="modal-title">Reporte completo</h3>
        <button class="modal-close" aria-label="Cerrar">×</button>
      </div>
      <div class="modal-body">
        <div class="field-label">Texto</div>
        <div class="field-input" style="white-space:pre-wrap;">${texto||"(Sin texto)"}</div>
        <div class="field-label" style="margin-top:12px;">Fecha</div>
        <div class="field-input">${fecha||"—"}</div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-backdrop').addEventListener('click',()=>overlay.remove());
  overlay.querySelector('.modal-close').addEventListener('click',()=>overlay.remove());
}

onSnapshot(collection(db, "reporte"), (snapshot) => {
  const arr=[];
  snapshot.forEach(docSnap=>{
    const d=docSnap.data()||{};
    arr.push({ id:docSnap.id, texto:d.texto||"", fecha:d.fecha||"—" });
  });

  // más reciente arriba: por número del id desc; luego fecha desc
  arr.sort((a,b)=>{
    const ai=numFromId(a.id), bi=numFromId(b.id);
    if(ai!==null && bi!==null && ai!==bi) return bi-ai;
    const af=yyyymmddFromFecha(a.fecha), bf=yyyymmddFromFecha(b.fecha);
    if(af!==null && bf!==null && af!==bf) return bf-af;
    return 0;
  });

  list.innerHTML="";
  if(!arr.length){
    const p=document.createElement("p");
    p.textContent="No hay reportes aún.";
    p.style.color="#b7c0d6";
    list.appendChild(p);
    return;
  }

  arr.forEach(r=>{
    const card=document.createElement("div");
    card.className="rep-card";
    card.innerHTML=`
      <div class="rep-head">
        <span class="rep-icon" aria-hidden="true">${iconSVG}</span>
        <div>
          <div class="rep-title">Reporte de incidencias</div>
          <div class="rep-snippet">${resumen(r.texto)}</div>
        </div>
      </div>
      <div class="rep-date">${r.fecha}</div>`;
    card.addEventListener('click',()=>showModalView(r.texto, r.fecha));
    list.appendChild(card);
  });
}, (err)=>{
  console.error("Error leyendo reportes:", err);
  list.innerHTML = "<p style='color:#f87171'>Error leyendo reportes.</p>";
});

// ===== Crear nuevo reporte (formulario) =====
const modal = document.getElementById('modal');
const openBtn = document.getElementById('btn-open-form');
const closeBtn = document.getElementById('modal-close');
const backdrop = document.querySelector('.modal-backdrop');
const txt = document.getElementById('rep-texto');
const fecha = document.getElementById('rep-fecha');
const btnToday = document.getElementById('btn-today');
const btnEnviar = document.getElementById('btn-enviar');
const formError = document.getElementById('form-error');

function openForm(){ modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
function closeForm(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); formError.classList.add('hidden'); formError.textContent=""; }
openBtn.addEventListener('click', openForm);
closeBtn.addEventListener('click', closeForm);
backdrop.addEventListener('click', closeForm);

function hoyDDMMAA(){
  const d=new Date();
  const dd=String(d.getDate()).padStart(2,'0');
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const aa=String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${aa}`;
}
btnToday.addEventListener('click', ()=>{ fecha.value = hoyDDMMAA(); });

function validate(){
  const t=(txt.value||"").trim();
  const f=(fecha.value||"").trim();
  if(!t || !f){
    formError.textContent="Completa todos los campos.";
    formError.classList.remove('hidden');
    return false;
  }
  // validación simple de formato fecha
  if(!/^\d{2}\/\d{2}\/\d{2}$/.test(f)){
    formError.textContent="La fecha debe ser DD/MM/AA.";
    formError.classList.remove('hidden');
    return false;
  }
  formError.classList.add('hidden');
  formError.textContent="";
  return { texto:t, fecha:f };
}

async function nextReporteId(){
  // Busca el mayor "reporteN"
  const snap = await getDocs(collection(db, 'reporte'));
  let maxN = 0;
  snap.forEach(s=>{
    const m = s.id.match(/reporte(\d+)$/i);
    if(m){ const n=parseInt(m[1],10); if(n>maxN) maxN=n; }
  });
  const next = maxN + 1;
  return `reporte${next}`;
}

btnEnviar.addEventListener('click', async ()=>{
  const data = validate();
  if(!data) return;

  try{
    const newId = await nextReporteId();
    await setDoc(doc(db,'reporte', newId), {
      texto: data.texto,
      fecha: data.fecha
    }, { merge:false });
    closeForm();
    txt.value = "";
    fecha.value = "";
  }catch(e){
    console.error('Error creando reporte:', e);
    formError.textContent = "Error al enviar el reporte.";
    formError.classList.remove('hidden');
  }
});