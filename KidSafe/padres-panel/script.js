// === Navegación por tiles ===
const go = (path) => location.href = path;
document.querySelector('.tile-reporte')?.addEventListener('click', () => go('./reporte/'));
document.querySelector('.tile-mensajes')?.addEventListener('click', () => go('./mensaje/'));
document.querySelector('.tile-justificante')?.addEventListener('click', () => go('./justificante/'));

// === Modal reutilizable ===
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const btnSi = document.getElementById('modal-si');
const btnNo = document.getElementById('modal-no');
const btnClose = document.getElementById('modal-close');

let currentAction = null; // 'llevar' | 'recoger'

function openModal({ title, text, action, accent = 'reporte' }) {
  currentAction = action;
  modalTitle.textContent = title;
  modalText.textContent = text;

  // color del botón "Sí" (rojo para llevar, verde para recoger)
  btnSi.style.background = accent === 'reporte'
    ? 'linear-gradient(90deg, #b3261e, #8f1c18)'
    : 'linear-gradient(90deg, #15803d, #166534)';

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentAction = null;
}
btnClose.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

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
const db = getFirestore(app);
await signInAnonymously(auth).catch(console.error);

// === UI aviso bajo Encargado ===
const aviso = document.getElementById('aviso-encargado');
function renderAviso(estadoLlevar, estadoRecoger) {
  const llevarSi = String(estadoLlevar || 'No') === 'Si';
  const recogerSi = String(estadoRecoger || 'No') === 'Si';

  if (!llevarSi && !recogerSi) {
    aviso.classList.add('hidden');
    aviso.textContent = '';
    return;
  }
  let partes = [];
  if (llevarSi) partes.push('llevará');
  if (recogerSi) partes.push('recogerá');
  const acciones = partes.join(' y ');
  aviso.textContent = `Se notificará que usted ${acciones} a Liam el día de hoy.`;
  aviso.classList.remove('hidden');
}

// === Estado inicial desde Firestore (llevar/recoger) ===
async function loadEstados() {
  const refLlevar = doc(db, 'panel', 'llevar');
  const refRecoger = doc(db, 'panel', 'recoger');
  const [snapL, snapR] = await Promise.all([getDoc(refLlevar), getDoc(refRecoger)]);
  const estadoL = snapL.exists() ? (snapL.data().Mensaje || 'No') : 'No';
  const estadoR = snapR.exists() ? (snapR.data().Mensaje || 'No') : 'No';
  renderAviso(estadoL, estadoR);
}
await loadEstados();

// === Botones "Otras Opciones" ===
document.getElementById('btn-llevo')?.addEventListener('click', () => {
  openModal({
    title: 'Confirmar acción',
    text: '¿Está segura/o de que usted llevará a Liam hoy?',
    action: 'llevar',
    accent: 'reporte' // rojo
  });
});

document.getElementById('btn-recojo')?.addEventListener('click', () => {
  openModal({
    title: 'Confirmar acción',
    text: '¿Está segura/o de que usted recogerá a Liam hoy?',
    action: 'recoger',
    accent: 'verde' // verde
  });
});

// === Acciones en el modal ===
btnSi.addEventListener('click', async () => {
  if (!currentAction) return;
  try {
    await setDoc(doc(db, 'panel', currentAction), { Mensaje: 'Si' }, { merge: true });
    await loadEstados();
  } finally {
    closeModal();
  }
});
btnNo.addEventListener('click', async () => {
  if (!currentAction) return;
  try {
    await setDoc(doc(db, 'panel', currentAction), { Mensaje: 'No' }, { merge: true });
    await loadEstados();
  } finally {
    closeModal();
  }
});

// === Encargado: en tiempo real desde security/cuidador.activo ===
const encargadoEstadoEl = document.querySelector('.encargado-estado');

function setEncargadoLoading() {
  encargadoEstadoEl.textContent = 'Cargando…';
  encargadoEstadoEl.classList.remove('on','off');
  encargadoEstadoEl.classList.add('loading');
}
function setEncargadoEstado(activoVal) {
  const isOn = String(activoVal || 'Off') === 'On';
  encargadoEstadoEl.textContent = isOn ? 'Activo' : 'Fuera';
  encargadoEstadoEl.classList.remove('loading');
  encargadoEstadoEl.classList.toggle('on', isOn);
  encargadoEstadoEl.classList.toggle('off', !isOn);
}
setEncargadoLoading();
onSnapshot(
  doc(db, 'security', 'cuidador'),
  (snap) => setEncargadoEstado(snap.exists() ? snap.data().activo : 'Off'),
  (err) => { console.error('onSnapshot cuidador error:', err); setEncargadoEstado('Off'); }
);

// === CONTADORES CON CACHÉ LOCAL (para no ver 0 al inicio) ===
const COL_REPORTE = 'reporte';
const COL_MENSAJE = 'mensaje';
const COL_JUSTI   = 'justificante';

const elCountReporte = document.getElementById('count-reporte');
const elCountMens   = document.getElementById('count-mensajes');
const elCountJusti  = document.getElementById('count-justificante');

// Ocultar visualmente los contadores hasta que pintemos algo real (caché o Firestore)
[elCountReporte, elCountMens, elCountJusti].forEach(el => { if (el) el.style.visibility = 'hidden'; });

const COUNTS_CACHE_KEY = 'kidsafe_counts_v1';

function setCount(el, val) {
  if (!el) return;
  el.textContent = String(val ?? 0);
  el.style.visibility = 'visible'; // mostramos cuando ponemos un valor real
}

function loadCachedCounts() {
  try {
    const raw = localStorage.getItem(COUNTS_CACHE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return false;

    let painted = false;
    if ('reporte' in data) { setCount(elCountReporte, data.reporte); painted = true; }
    if ('mensaje' in data) { setCount(elCountMens,    data.mensaje); painted = true; }
    if ('justificante' in data) { setCount(elCountJusti, data.justificante); painted = true; }
    return painted;
  } catch (e) {
    console.warn('No se pudo leer la caché de contadores:', e);
    return false;
  }
}

function saveCounts(partial) {
  try {
    const prev = JSON.parse(localStorage.getItem(COUNTS_CACHE_KEY) || '{}');
    const next = { ...prev, ...partial, ts: Date.now() };
    localStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('No se pudo guardar la caché de contadores:', e);
  }
}

// 1) Pintar inmediatamente lo último guardado (si existe)
const hadCache = loadCachedCounts();

// 2) Suscribir y actualizar caché cuando llegue Firestore
function bindCounter(colName, el, cacheField) {
  try {
    onSnapshot(
      collection(db, colName),
      (snap) => {
        const n = snap.size || 0;
        setCount(el, n);
        saveCounts({ [cacheField]: n });
      },
      (err) => {
        console.error(`onSnapshot ${colName} error:`, err);
        // No tocamos la visibilidad ni la caché en error para no "parpadear" a 0
      }
    );
  } catch (e) {
    console.error(`Counter ${colName} init error:`, e);
  }
}

bindCounter(COL_REPORTE, elCountReporte, 'reporte');
bindCounter(COL_MENSAJE, elCountMens,    'mensaje');
bindCounter(COL_JUSTI,   elCountJusti,   'justificante');