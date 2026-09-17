  /* =========================================================
     UTILIDADES COMUNES — pegar acá, sin cambios, el mismo bloque
     que está en index.js (desde "const LS_USERS" hasta "clearSession").
     Se repite abajo completo para que este archivo funcione dentro
     de la vista previa combinada. Ver nota sobre "comun.js" en index.js.
  ========================================================== */

  const LS_USERS   = 'mma2_users';
  const LS_NEWS    = 'mma2_news';
  const LS_DRAFTS  = 'mma2_drafts';
  const SS_SESSION = 'mma2_session';
  const RAIZ = document.getElementById('pagina-editor'); // 👈 solo para esta vista previa combinada

  function $(sel, ctx){ return (ctx||RAIZ||document).querySelector(sel); }
  function $$(sel, ctx){ return Array.from((ctx||RAIZ||document).querySelectorAll(sel)); }
  function uid(prefijo){ return prefijo + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function formatearFecha(iso){
    return new Date(iso).toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' });
  }
  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
  function sembrarDatos(){
    if(!localStorage.getItem(LS_USERS)){
      localStorage.setItem(LS_USERS, JSON.stringify([
        { id:'u_admin', username:'admin', password:'admin123', role:'admin', name:'Administración' },
        { id:'u_edit1', username:'editora1', password:'editor123', role:'editor', name:'Valentina Ríos' }
      ]));
    }
    if(!localStorage.getItem(LS_NEWS)) localStorage.setItem(LS_NEWS, JSON.stringify([]));
    if(!localStorage.getItem(LS_DRAFTS)) localStorage.setItem(LS_DRAFTS, JSON.stringify({}));
  }
  const DB = {
    getUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); },
    setUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u)); },
    getNews(){ return JSON.parse(localStorage.getItem(LS_NEWS) || '[]').sort((a,b)=> new Date(b.date)-new Date(a.date)); },
    setNews(n){ localStorage.setItem(LS_NEWS, JSON.stringify(n)); },
    getDrafts(){ return JSON.parse(localStorage.getItem(LS_DRAFTS) || '{}'); },
    setDrafts(d){ localStorage.setItem(LS_DRAFTS, JSON.stringify(d)); }
  };
  function getSession(){ try{ return JSON.parse(sessionStorage.getItem(SS_SESSION)); } catch(e){ return null; } }
  function setSession(s){ sessionStorage.setItem(SS_SESSION, JSON.stringify(s)); }
  function clearSession(){ sessionStorage.removeItem(SS_SESSION); }

   let toastTimer;
  function mostrarToast(msg, icono){
    const t = $('#toast');
    if(!t) return;
    t.innerHTML = `<span>${icono||'✅'}</span><span>${msg}</span>`;
    t.classList.add('mostrar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('mostrar'), 3200);
  }

  function mostrarUsuarios(){
    const usuarios = DB.getUsers();
    const ventana = document.createElement('div');
    ventana.id = 'ventanaUsuarios';
    ventana.className = 'fixed inset-y-0 left-0 z-50 flex items-center p-6 pointer-events-none';
    ventana.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="tituloUsuarios">
        <div class="flex items-center justify-between mb-4">
          <h2 id="tituloUsuarios" class="font-baloo font-extrabold text-2xl text-azul-oscuro">Usuarios</h2>
          <button type="button" id="cerrarUsuarios" class="text-2xl text-tinta-suave" aria-label="Cerrar">&times;</button>
        </div>
        <div class="space-y-3">
          ${usuarios.length ? usuarios.map(usuario => `
            <div class="rounded-2xl bg-cielo p-4">
              <p class="font-bold">${escapeHTML(usuario.name || usuario.username)}</p>
              <p class="text-sm text-tinta-suave">@${escapeHTML(usuario.username)} <br> ${escapeHTML(usuario.role)}</p>
              <p class="text-sm text-tinta-suave">Contraseña: ${escapeHTML(usuario.password || '')}</p>
            </div>
          `).join('') : '<p class="text-tinta-suave">No hay usuarios registrados.</p>'}
        </div>
      </div>`;

    document.body.appendChild(ventana);
    const cerrar = () => ventana.remove();
    ventana.querySelector('#cerrarUsuarios').addEventListener('click', cerrar);
    ventana.addEventListener('click', event => {
      if(event.target === ventana) cerrar();
    });
  }
  