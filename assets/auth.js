/* PYTHO Labs - Firebase Google Authentication (client only)
   Public Firebase application configuration, not an API/server secret.
   Protect privileged data/actions with server-side ID-token verification.
*/
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCdQNuYtk9DFWor7rLptx63qZH9X_94kFc',
  authDomain: 'pytho-labs.firebaseapp.com',
  projectId: 'pytho-labs',
  storageBucket: 'pytho-labs.firebasestorage.app',
  messagingSenderId: '155911737489',
  appId: '1:155911737489:web:c14464bd7d7033af066f30',
  measurementId: 'G-TG5PJDVTSK'
};

const root = document.getElementById('pytho-auth-root');
if (root) {
  const english = document.documentElement.lang.toLowerCase().startsWith('en');
  const words = english ? {
    login: 'Continue with Google', logout: 'Sign out', loading: 'Loading…',
    checking: 'Checking session…', signed: 'Signed in',
    error: 'Unable to load sign-in', popup: 'Popup closed. Try again.',
    blocked: 'Allow popups for this site and try again.',
    domain: 'This website domain must be authorized in Firebase.',
    provider: 'Enable Google as a sign-in provider in Firebase.',
    network: 'Network error. Please try again.', tryAgain: 'Try again'
  } : {
    login: 'Continuar con Google', logout: 'Cerrar sesión', loading: 'Cargando…',
    checking: 'Verificando sesión…', signed: 'Sesión iniciada',
    error: 'No se pudo cargar el acceso', popup: 'Se cerró la ventana. Inténtalo nuevamente.',
    blocked: 'Permite las ventanas emergentes para este sitio.',
    domain: 'Debes autorizar el dominio del sitio en Firebase.',
    provider: 'Habilita Google como proveedor de acceso en Firebase.',
    network: 'Error de red. Inténtalo de nuevo.', tryAgain: 'Reintentar'
  };
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const status = (message) => {
    root.replaceChildren(el('span', 'pytho-loading', message));
  };
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  let busy = false;

  function errorText(error) {
    const code = error && error.code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return words.popup;
    if (code === 'auth/popup-blocked') return words.blocked;
    if (code === 'auth/unauthorized-domain') return words.domain;
    if (code === 'auth/operation-not-allowed') return words.provider;
    if (code === 'auth/network-request-failed') return words.network;
    return words.error + (code ? ' (' + code + ')' : '');
  }
  function signInButton(errorMessage = '') {
    const container = el('div', 'pytho-auth-controls');
    const button = el('button', 'google-signin');
    button.type = 'button';
    button.append(el('span', 'google-g', 'G'), el('span', '', words.login));
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      status(words.loading);
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        busy = false;
        signInButton(errorText(error));
      }
    });
    container.append(button);
    if (errorMessage) {
      const msg = el('span', 'pytho-auth-error', errorMessage);
      msg.setAttribute('role', 'alert');
      container.append(msg);
    }
    root.replaceChildren(container);
  }
  function profile(user) {
    const container = el('div', 'pytho-user');
    if (user.photoURL && /^https:\/\//.test(user.photoURL)) {
      const img = el('img', 'pytho-avatar-img');
      img.src = user.photoURL;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      container.append(img);
    } else {
      container.append(el('span', 'pytho-avatar', (user.displayName || user.email || 'U').slice(0, 1).toUpperCase()));
    }
    const info = el('span', 'pytho-user-info');
    const name = el('span', 'pytho-name', user.displayName || user.email || 'Google');
    name.title = user.email || words.signed;
    info.append(name);
    if (user.email) info.append(el('span', 'pytho-email', user.email));
    container.append(info);
    const out = el('button', 'pytho-signout', words.logout);
    out.type = 'button';
    out.addEventListener('click', async () => {
      out.disabled = true;
      try { await signOut(auth); } catch (error) {
        out.disabled = false;
        const msg = el('span', 'pytho-auth-error', errorText(error));
        msg.setAttribute('role', 'alert');
        root.append(msg);
      }
    });
    root.replaceChildren(container, out);
  }
  status(words.checking);
  setPersistence(auth, browserLocalPersistence)
    .then(() => onAuthStateChanged(auth, (user) => {
      busy = false;
      if (user) profile(user);
      else signInButton();
    }, (error) => signInButton(errorText(error))))
    .catch((error) => signInButton(errorText(error)));
}
