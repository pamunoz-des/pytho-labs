import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

// Firebase Web App identifiers are public. Never include admin credentials here.
const firebaseConfig = {
  apiKey: 'AIzaSyCdQNuYtk9DFWor7rLptx63qZH9X_94kFc',
  authDomain: 'pytho-labs.firebaseapp.com',
  projectId: 'pytho-labs',
  storageBucket: 'pytho-labs.firebasestorage.app',
  messagingSenderId: '155911737489',
  appId: '1:155911737489:web:c14464bd7d7033af066f30',
  measurementId: 'G-TG5PJDVTSK'
};
const english = document.documentElement.lang.startsWith('en');
const t = english ? {
  loading:'Checking your Google session…', login:'Continue with Google', logout:'Sign out',
  welcome:'Welcome', identity:'Your PYTHO account', interest:'Research interest',
  notes:'Private note (max 600 characters)', save:'Save my preferences', saved:'Saved privately to Firestore.',
  error:'Unable to access private data.', firestore:'Enable Cloud Firestore and install the supplied security rules.',
  session:'Sign in to access your private space.', signedOut:'You have signed out.'
} : {
  loading:'Verificando tu sesión de Google…', login:'Continuar con Google', logout:'Cerrar sesión',
  welcome:'Bienvenido/a', identity:'Tu cuenta PYTHO', interest:'Área de investigación de interés',
  notes:'Nota privada (máximo 600 caracteres)', save:'Guardar mis preferencias', saved:'Guardado de forma privada en Firestore.',
  error:'No fue posible acceder a los datos privados.', firestore:'Activa Cloud Firestore y publica las reglas de seguridad incluidas.',
  session:'Inicia sesión para ingresar a tu espacio privado.', signedOut:'Has cerrado sesión.'
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const gate = document.getElementById('gate');
const dashboard = document.getElementById('dashboard');
const status = document.getElementById('status');
const login = document.getElementById('login');
const logout = document.getElementById('logout');
const save = document.getElementById('save');
const displayName = document.getElementById('user-name');
const email = document.getElementById('user-email');
const avatar = document.getElementById('avatar');
const interest = document.getElementById('interest');
const note = document.getElementById('note');
let currentUser = null;
let canSave = false;
status.textContent = t.loading;
login.textContent = t.login;
logout.textContent = t.logout;
save.textContent = t.save;
document.getElementById('interest-label').textContent = t.interest;
document.getElementById('note-label').textContent = t.notes;
document.getElementById('gate-description').textContent = t.session;
login.addEventListener('click', async () => {
  login.disabled = true;
  try { await signInWithPopup(auth,provider); }
  catch(e) { status.textContent = `${t.error} (${e.code || 'unknown'})`; }
  finally { login.disabled = false; }
});
logout.addEventListener('click', async () => {
  try { await signOut(auth); status.textContent = t.signedOut; }
  catch(e) { status.textContent = `${t.error} (${e.code || 'unknown'})`; }
});
save.addEventListener('click', async () => {
  if (!currentUser || !canSave) return;
  save.disabled = true;
  status.textContent = '';
  try {
    await setDoc(doc(db,'members',currentUser.uid),{
      uid:currentUser.uid,
      researchInterest:interest.value.slice(0,100),
      personalNote:note.value.slice(0,600),
      updatedAt:serverTimestamp()
    });
    status.textContent = t.saved;
  } catch(e) { status.textContent = `${t.error} (${e.code || 'unknown'})`; }
  finally { save.disabled = false; }
});
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  canSave = false;
  save.disabled = true;
  status.textContent = '';
  gate.hidden = Boolean(user);
  dashboard.hidden = !user;
  if (!user) return;
  displayName.textContent = user.displayName || t.welcome;
  email.textContent = user.email || '';
  if (user.photoURL && user.photoURL.startsWith('https://')) {
    avatar.src = user.photoURL;
    avatar.hidden = false;
  } else avatar.hidden = true;
  interest.value = '';
  note.value = '';
  try {
    const snapshot = await getDoc(doc(db,'members',user.uid));
    if (auth.currentUser?.uid !== user.uid) return;
    if(snapshot.exists()) {
      interest.value = snapshot.data().researchInterest || '';
      note.value = snapshot.data().personalNote || '';
    }
    canSave = true;
    save.disabled = false;
  } catch(e) {
    status.textContent = `${t.firestore} (${e.code || 'unknown'})`;
  }
}, (e) => {
  gate.hidden = false;
  dashboard.hidden = true;
  status.textContent = `${t.error} (${e.code || 'unknown'})`;
});
