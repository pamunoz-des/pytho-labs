import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

// Firebase web identifiers are public by design. Do not put privileged credentials in this file.
const firebaseConfig = {
  apiKey: 'AIzaSyCdQNuYtk9DFWor7rLptx63qZH9X_94kFc',
  authDomain: 'pytho-labs.firebaseapp.com',
  projectId: 'pytho-labs',
  storageBucket: 'pytho-labs.firebasestorage.app',
  messagingSenderId: '155911737489',
  appId: '1:155911737489:web:c14464bd7d7033af066f30',
  measurementId: 'G-TG5PJDVTSK'
};

const en = document.documentElement.lang.toLowerCase().startsWith('en');
const copy = en ? {
  checking: 'Checking Google session…', welcome: 'Welcome back', member: 'PYTHO member',
  signIn: 'Continue with Google', signOut: 'Sign out', signedOut: 'You have signed out.',
  save: 'Save preferences', saving: 'Saving…', saved: 'Preferences saved securely.',
  loadError: 'Could not load your private information.',
  saveError: 'Could not save your preferences.',
  genericError: 'Unable to complete the request.',
  domain: 'Please authorize this website domain in Firebase Authentication.',
  provider: 'Enable Google sign-in in Firebase Authentication.',
  permission: 'Missing permissions. Check Firestore rules for members/{uid}.',
  loginRequired: 'Sign in with Google to open your personal dashboard.',
  lastSaved: 'Saved', notSaved: 'Not saved yet', chars: 'characters',
  loading: 'Loading your dashboard…'
} : {
  checking: 'Verificando sesión de Google…', welcome: 'Bienvenido de nuevo', member: 'Miembro de PYTHO',
  signIn: 'Continuar con Google', signOut: 'Cerrar sesión', signedOut: 'Has cerrado sesión.',
  save: 'Guardar preferencias', saving: 'Guardando…', saved: 'Preferencias guardadas de forma segura.',
  loadError: 'No fue posible cargar tu información privada.',
  saveError: 'No fue posible guardar tus preferencias.',
  genericError: 'No fue posible completar la solicitud.',
  domain: 'Autoriza este dominio en Firebase Authentication.',
  provider: 'Habilita el acceso con Google en Firebase Authentication.',
  permission: 'Faltan permisos. Revisa las reglas Firestore para members/{uid}.',
  loginRequired: 'Inicia sesión con Google para entrar a tu panel personal.',
  lastSaved: 'Guardado', notSaved: 'Sin guardar todavía', chars: 'caracteres',
  loading: 'Cargando tu dashboard…'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const $ = id => document.getElementById(id);
const gate = $('gate');
const dashboard = $('dashboard');
const status = $('status');
const login = $('login');
const logout = $('logout');
const save = $('save');
const interest = $('interest');
const note = $('note');
const name = $('user-name');
const email = $('user-email');
const avatar = $('avatar');
const initials = $('initials');
const savedAt = $('saved-at');
const noteCount = $('note-count');
const greeting = $('greeting');
let currentUser = null;
let canSave = false;
let loadSequence = 0;
let savedValues = { researchInterest:'', personalNote:'' };

function message(text, kind='info') {
  status.textContent = text;
  status.dataset.kind = kind;
}
function errorText(err, fallback) {
  if (err?.code === 'auth/unauthorized-domain') return copy.domain;
  if (err?.code === 'auth/operation-not-allowed') return copy.provider;
  if (err?.code === 'permission-denied') return copy.permission;
  return `${fallback} (${err?.code || 'unknown'})`;
}
function updateCounter() {
  noteCount.textContent = `${note.value.length}/600 ${copy.chars}`;
}
function updateDirty() {
  const dirty = interest.value !== savedValues.researchInterest || note.value !== savedValues.personalNote;
  if (canSave) save.disabled = !dirty;
}
function resetPanel() {
  interest.value = '';
  note.value = '';
  savedValues = { researchInterest:'', personalNote:'' };
  savedAt.textContent = copy.notSaved;
  initials.hidden = false;
  avatar.hidden = true;
  updateCounter();
}
function showGate() {
  gate.hidden = false;
  dashboard.hidden = true;
  canSave = false;
  save.disabled = true;
  resetPanel();
}
function showProfile(user) {
  const display = user.displayName || user.email?.split('@')[0] || 'PYTHO';
  name.textContent = display;
  email.textContent = user.email || '';
  greeting.textContent = `${copy.welcome}, ${display.split(' ')[0]}`;
  initials.textContent = display.slice(0,1).toUpperCase();
  if (user.photoURL && /^https:\/\//.test(user.photoURL)) {
    avatar.src = user.photoURL;
    avatar.referrerPolicy = 'no-referrer';
    avatar.hidden = false;
    initials.hidden = true;
  }
}

login.addEventListener('click', async () => {
  login.disabled = true;
  message('');
  try { await signInWithPopup(auth,provider); }
  catch(e) { message(errorText(e, copy.genericError),'error'); }
  finally { login.disabled = false; }
});
logout.addEventListener('click', async () => {
  logout.disabled = true;
  try { await signOut(auth); message(copy.signedOut); }
  catch(e) { message(errorText(e,copy.genericError),'error'); }
  finally { logout.disabled = false; }
});
[interest,note].forEach(input => input.addEventListener('input', () => {updateCounter();updateDirty();}));

save.addEventListener('click', async () => {
  if (!currentUser || !canSave) return;
  const uid = currentUser.uid;
  const payload = {
    uid,
    researchInterest: interest.value.trim().slice(0,100),
    personalNote: note.value.slice(0,600),
    updatedAt: serverTimestamp()
  };
  save.disabled = true;
  save.textContent = copy.saving;
  message('');
  try {
    await setDoc(doc(db,'members',uid),payload);
    if (auth.currentUser?.uid !== uid) return;
    interest.value = payload.researchInterest;
    savedValues = {researchInterest:payload.researchInterest,personalNote:payload.personalNote};
    savedAt.textContent = `${copy.lastSaved} · ${new Intl.DateTimeFormat(en?'en-US':'es-CL',{dateStyle:'medium',timeStyle:'short'}).format(new Date())}`;
    message(copy.saved,'success');
  } catch(e) { message(errorText(e, copy.saveError),'error'); }
  finally { save.textContent = copy.save; updateDirty(); }
});

message(copy.checking);
showGate();
onAuthStateChanged(auth, async (user) => {
  const seq = ++loadSequence;
  currentUser = user;
  canSave = false;
  save.disabled = true;
  message('');
  if (!user) { showGate(); return; }
  gate.hidden = true;
  dashboard.hidden = false;
  resetPanel();
  showProfile(user);
  message(copy.loading);
  try {
    const snapshot = await getDoc(doc(db,'members',user.uid));
    if (seq !== loadSequence || auth.currentUser?.uid !== user.uid) return;
    if (snapshot.exists()) {
      const data = snapshot.data();
      interest.value = typeof data.researchInterest === 'string' ? data.researchInterest.slice(0,100) : '';
      note.value = typeof data.personalNote === 'string' ? data.personalNote.slice(0,600) : '';
      if(data.updatedAt?.toDate) savedAt.textContent = `${copy.lastSaved} · ${new Intl.DateTimeFormat(en?'en-US':'es-CL',{dateStyle:'medium',timeStyle:'short'}).format(data.updatedAt.toDate())}`;
    }
    savedValues = {researchInterest:interest.value,personalNote:note.value};
    canSave = true;
    message('');
    updateCounter();
    updateDirty();
  } catch(e) {
    if (seq !== loadSequence) return;
    message(errorText(e, copy.loadError),'error');
  }
}, e => { showGate();message(errorText(e, copy.genericError),'error'); });
