/* Authentication UI for Azure Static Web Apps (Standard) */
(()=>{
  'use strict';
  const root=document.getElementById('pytho-auth-root');
  if(!root)return;
  const en=document.documentElement.lang.toLowerCase().startsWith('en');
  const t=en?{login:'Sign in with Google',logout:'Sign out',loading:'Checking session…',error:'Sign-in service unavailable',welcome:'Signed in as'}:{login:'Ingresar con Google',logout:'Cerrar sesión',loading:'Verificando sesión…',error:'Autenticación no disponible',welcome:'Sesión iniciada como'};
  const current=location.pathname.startsWith('/en/')?'/en/':'/';
  const safeRedirect=encodeURIComponent(current);
  const login='/.auth/login/google?post_login_redirect_uri='+safeRedirect;
  const logout='/.auth/logout?post_logout_redirect_uri='+safeRedirect;
  const set=(el,txt)=>{el.textContent=txt;return el;};
  root.textContent='';
  let loading=document.createElement('span');loading.className='pytho-loading';set(loading,t.loading);root.append(loading);
  fetch('/.auth/me',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'})
    .then(async response=>{
      if(!response.ok)throw Error('auth endpoint unavailable');
      const data=await response.json();
      if(!data || !Array.isArray(data.clientPrincipal))return data;
      return data;
    })
    .then(data=>{
      root.replaceChildren();
      const user=data && data.clientPrincipal;
      if(!user){
        const a=document.createElement('a');a.className='google-signin';a.href=login;
        const g=document.createElement('span');g.className='google-g';g.textContent='G';
        const name=document.createElement('span');name.textContent=t.login;
        a.append(g,name);root.append(a);return;
      }
      const wrapper=document.createElement('div');wrapper.className='pytho-user';
      const avatar=document.createElement('span');avatar.className='pytho-avatar';avatar.textContent=(user.userDetails||'U').trim().slice(0,1).toUpperCase();
      const name=document.createElement('span');name.className='pytho-name';name.textContent=user.userDetails||user.identityProvider||'Google';name.title=t.welcome+' '+name.textContent;
      wrapper.append(avatar,name);
      const a=document.createElement('a');a.href=logout;a.className='pytho-signout';a.setAttribute('aria-label',t.logout);a.title=t.logout;
      const glyph=document.createElement('span');glyph.textContent='↪';
      const txt=document.createElement('span');txt.className='pytho-signout-text';txt.textContent=t.logout;
      a.append(glyph,txt);root.append(wrapper,a);
    })
    .catch(()=>{
      root.replaceChildren();
      const msg=document.createElement('span');msg.className='pytho-loading';msg.textContent=t.error;
      root.append(msg);
    });
})();
