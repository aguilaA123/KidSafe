import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

const list = document.getElementById("justificante-list");

// Icono libre (cuaderno con lapicero)
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
     viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     class="lucide lucide-notebook-pen-icon">
  <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/>
  <path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/>
  <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
</svg>`;

function resumen(t, n=60){ if(!t) return "—"; const s=String(t).trim(); return s.length>n? s.slice(0,n).trim()+"…" : s; }
function numFromId(id){ const m=String(id).match(/(\d+)$/); return m?parseInt(m[1],10):null; }
function yyyymmddFromFecha(f){ const m=String(f||'').match(/^(\d{2})\/(\d{2})\/(\d{2})$/); if(!m) return null; const [_,dd,mm,aa]=m; return parseInt(`20${aa}${mm}${dd}`,10); }

function showModal(texto,fecha){
  const modal=document.createElement("div");
  modal.className="modal-overlay";
  modal.innerHTML=`
    <div class="modal-card">
      <button class="modal-close" aria-label="Cerrar">×</button>
      <h3>Justificante completo</h3>
      <p class="modal-text">${texto||"(Sin texto)"}</p>
      <p class="modal-fecha">Fecha: ${fecha||"—"}</p>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector(".modal-close").addEventListener("click",()=>modal.remove());
  modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
}

onSnapshot(collection(db,"justificante"),(snapshot)=>{
  const arr=[];
  snapshot.forEach(docSnap=>{
    const d=docSnap.data()||{};
    arr.push({id:docSnap.id,texto:d.texto||"",fecha:d.fecha||"—"});
  });

  arr.sort((a,b)=>{
    const ai=numFromId(a.id), bi=numFromId(b.id);
    if(ai!==null&&bi!==null&&ai!==bi) return bi-ai;
    const af=yyyymmddFromFecha(a.fecha), bf=yyyymmddFromFecha(b.fecha);
    if(af!==null&&bf!==null&&af!==bf) return bf-af;
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
    card.className="just-card";
    card.innerHTML=`
      <div class="just-head">
        <span class="just-icon">${iconSVG}</span>
        <div>
          <div class="just-title">Justificante</div>
          <div class="just-snippet">${resumen(j.texto)}</div>
        </div>
      </div>
      <div class="just-date">${j.fecha}</div>`;
    card.addEventListener("click",()=>showModal(j.texto,j.fecha));
    list.appendChild(card);
  });
},err=>{
  console.error("Error leyendo justificantes:",err);
  list.innerHTML="<p style='color:#f87171'>Error leyendo justificantes.</p>";
});