// === Navegación por tiles ===
const go = (path) => location.href = path;
document.querySelector('.tile-reporte')?.addEventListener('click', () => go('./reporte/'));
document.querySelector('.tile-mensajes')?.addEventListener('click', () => go('./mensaje/'));
document.querySelector('.tile-justificante')?.addEventListener('click', () => go('./justificante/'));

// === Modal reutilizable ===
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalText  = document.getElementById('modal-text');
const btnSi      = document.getElementById('modal-si');
const btnNo      = document.getElementById('modal-no');
const btnClose   = document.getElementById('modal-close');
const backdrop   = document.querySelector('.modal-backdrop');

let pendingState = null; // "On" | "Off"

function openModal({ title, text }) {
  modalTitle.textContent = title;
  modalText.textContent  = text;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  pendingState = null;
}
btnClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);
btnNo.addEventListener('click', closeModal);

// === Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot, collection
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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
const db   = getFirestore(app);
await signInAnonymously(auth).catch(console.error);

// === Encargado: en tiempo real ===
const encargadoEstadoEl = document.querySelector('.encargado-estado');
const btnOn  = document.getElementById('btn-estado-on');
const btnOff = document.getElementById('btn-estado-off');

function setEncargadoLoading() {
  encargadoEstadoEl.textContent = 'Cargando…';
  encargadoEstadoEl.classList.remove('on','off');
  encargadoEstadoEl.classList.add('loading');
  btnOn.disabled = btnOff.disabled = true;
}
function setEncargadoEstado(activoVal) {
  const isOn = String(activoVal || 'Off') === 'On';
  encargadoEstadoEl.textContent = isOn ? 'Activo' : 'Fuera';
  encargadoEstadoEl.classList.remove('loading');
  encargadoEstadoEl.classList.toggle('on', isOn);
  encargadoEstadoEl.classList.toggle('off', !isOn);
  btnOn.disabled  = isOn;
  btnOff.disabled = !isOn;
}
setEncargadoLoading();

onSnapshot(
  doc(db, 'security', 'cuidador'),
  (snap) => {
    const data = snap.exists() ? snap.data() : {};
    setEncargadoEstado(data.activo);
  },
  (err) => {
    console.error('onSnapshot cuidador error:', err);
    setEncargadoEstado('Off');
  }
);

// === Confirmaciones para cambiar estado ===
btnOn.addEventListener('click', () => {
  pendingState = 'On';
  openModal({
    title: 'Confirmar estado',
    text: '¿Estás segura/o de ponerte ACTIVO el día de hoy?'
  });
});
btnOff.addEventListener('click', () => {
  pendingState = 'Off';
  openModal({
    title: 'Confirmar estado',
    text: '¿Estás segura/o de ponerte INACTIVO (Fuera) el día de hoy?'
  });
});

btnSi.addEventListener('click', async () => {
  if (!pendingState) return;
  try {
    await setDoc(doc(db, 'security', 'cuidador'), { activo: pendingState }, { merge: true });
    // Se actualizará por onSnapshot
  } catch (e) {
    console.error('Error actualizando estado cuidador:', e);
  } finally {
    closeModal();
  }
});

// === CONTADORES CON CACHÉ LOCAL (para no ver 0 al inicio) ===
const COL_REPORTE = 'reporte';
const COL_MENSAJE = 'mensaje';
const COL_JUSTI   = 'justificante';

const elCountReporte = document.getElementById('count-reporte');
const elCountMens   = document.getElementById('count-mensajes');
const elCountJusti  = document.getElementById('count-justificante');

// ocultar hasta tener valor real (caché o Firestore)
[elCountReporte, elCountMens, elCountJusti].forEach(el => { if (el) el.style.visibility = 'hidden'; });

const COUNTS_CACHE_KEY = 'kidsafe_counts_v1';
function setCount(el, val){ if (!el) return; el.textContent = String(val ?? 0); el.style.visibility = 'visible'; }
function loadCachedCounts(){
  try{
    const raw = localStorage.getItem(COUNTS_CACHE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw)||{};
    let painted=false;
    if('reporte' in data){ setCount(elCountReporte, data.reporte); painted=true; }
    if('mensaje' in data){ setCount(elCountMens,    data.mensaje); painted=true; }
    if('justificante' in data){ setCount(elCountJusti, data.justificante); painted=true; }
    return painted;
  }catch(e){ console.warn('cache counts read fail', e); return false; }
}
function saveCounts(partial){
  try{
    const prev = JSON.parse(localStorage.getItem(COUNTS_CACHE_KEY) || '{}');
    const next = { ...prev, ...partial, ts: Date.now() };
    localStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify(next));
  }catch(e){ console.warn('cache counts write fail', e); }
}
loadCachedCounts();

function bindCounter(colName, el, cacheField){
  try{
    onSnapshot(collection(db, colName), (snap)=>{
      const n = snap.size || 0;
      setCount(el, n);
      saveCounts({ [cacheField]: n });
    }, (err)=>{
      console.error(`onSnapshot ${colName} error:`, err);
    });
  }catch(e){ console.error(`Counter ${colName} init error:`, e); }
}
bindCounter(COL_REPORTE, elCountReporte, 'reporte');
bindCounter(COL_MENSAJE, elCountMens,    'mensaje');
bindCounter(COL_JUSTI,   elCountJusti,   'justificante');

// ====== AVISO cuando familia marca Llevar/Recoger (tiempo real) ======
const avisoEl = document.getElementById('aviso-panel');
let estadoLlevar = 'No';
let estadoRecoger = 'No';

// ✅ Mensajes corregidos para hablar de la familia (no del cuidador)
function renderAvisoFamilia(){
  const llevarSi = String(estadoLlevar || 'No') === 'Si';
  const recogerSi = String(estadoRecoger || 'No') === 'Si';

  if (!llevarSi && !recogerSi) {
    avisoEl.classList.add('hidden');
    avisoEl.textContent = '';
    return;
  }

  let msg = '';
  if (llevarSi && recogerSi) {
    msg = 'La familia indicó que llevarán y recogerán a Liam el día de hoy.';
  } else if (llevarSi) {
    msg = 'La familia indicó que llevarán al colegio a Liam.';
  } else if (recogerSi) {
    msg = 'La familia indicó que van a recoger a Liam del colegio.';
  }

  avisoEl.textContent = msg;
  avisoEl.classList.remove('hidden');
}

onSnapshot(
  doc(db, 'panel', 'llevar'),
  (snap) => { estadoLlevar = snap.exists() ? (snap.data().Mensaje || 'No') : 'No'; renderAvisoFamilia(); },
  (err)  => { console.error('onSnapshot llevar error:', err); }
);
onSnapshot(
  doc(db, 'panel', 'recoger'),
  (snap) => { estadoRecoger = snap.exists() ? (snap.data().Mensaje || 'No') : 'No'; renderAvisoFamilia(); },
  (err)  => { console.error('onSnapshot recoger error:', err); }
);