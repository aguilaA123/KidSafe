// Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, onSnapshot, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Config (misma de tu proyecto)
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

// Helpers
const list = document.getElementById("just-list");
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
     viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/>
  <path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/>
  <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
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

// Modal ver completo
function showModalView(texto, fecha){
  const overlay = document.createElement("div");
  overlay.className = "modal";
  overlay.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-deco modal-deco-just" aria-hidden="true">${iconSVG}</span>
        <h3 class="modal-title">Justificante</h3>
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

// Suscripción en tiempo real
onSnapshot(collection(db, "justificante"), (snapshot) => {
  const arr=[];
  snapshot.forEach(docSnap=>{
    const d=docSnap.data()||{};
    arr.push({ id:docSnap.id, texto:d.texto||"", fecha:d.fecha||"—" });
  });

  // más reciente arriba
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
    p.textContent="No hay justificantes aún.";
    p.style.color="#b7c0d6";
    list.appendChild(p);
    return;
  }

  arr.forEach(j=>{
    const card=document.createElement("div");
    card.className="jus-card";
    card.innerHTML=`
      <div class="jus-head">
        <span class="jus-icon" aria-hidden="true">${iconSVG}</span>
        <div class="jus-texts">
          <div class="jus-title">Justificante</div>
          <div class="jus-snippet">${resumen(j.texto)}</div>
        </div>
      </div>
      <div class="jus-date">${j.fecha}</div>`;
    card.addEventListener('click',()=>showModalView(j.texto, j.fecha));
    list.appendChild(card);
  });
}, (err)=>{
  console.error("Error leyendo justificantes:", err);
  list.innerHTML = "<p style='color:#f87171'>Error leyendo justificantes.</p>";
});

// ===== Crear nuevo justificante =====
const modal = document.getElementById('modal');
const openBtn = document.getElementById('btn-open-form');
const closeBtn = document.getElementById('modal-close');
const backdrop = document.querySelector('.modal-backdrop');
const txt = document.getElementById('jus-texto');
const fecha = document.getElementById('jus-fecha');
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
  if(!/^\d{2}\/\d{2}\/\d{2}$/.test(f)){
    formError.textContent="La fecha debe ser DD/MM/AA.";
    formError.classList.remove('hidden');
    return false;
  }
  formError.classList.add('hidden');
  formError.textContent="";
  return { texto:t, fecha:f };
}

async function nextJustId(){
  const snap = await getDocs(collection(db, 'justificante'));
  let maxN = 0;
  snap.forEach(s=>{
    const m = s.id.match(/justificante(\d+)$/i);
    if(m){ const n=parseInt(m[1],10); if(n>maxN) maxN=n; }
  });
  return `justificante${maxN+1}`;
}

btnEnviar.addEventListener('click', async ()=>{
  const data = validate();
  if(!data) return;

  try{
    const newId = await nextJustId();
    await setDoc(doc(db,'justificante', newId), {
      texto: data.texto,
      fecha: data.fecha
    }, { merge:false });
    closeForm();
    txt.value = "";
    fecha.value = "";
  }catch(e){
    console.error('Error creando justificante:', e);
    formError.textContent = "Error al enviar el justificante.";
    formError.classList.remove('hidden');
  }
});