 








 
// =========================================================
 //    BLOQUE 4 — CÓDIGO COMÚN
 //    Utilizado por el sitio principal, el panel de admin y el
 //    panel de editor: almacenamiento (localStorage/sessionStorage),
 //    helpers de DOM, datos semilla, avisos/modales genéricos,
 //    cambio de vistas, sesión, y arranque de la app.
//
 //    Nota: $ y $$ se declaran como "function" (en vez de "const")
 //    a propósito, para que queden disponibles (hoisted) en TODO
 //    el archivo sin importar el orden de los bloques, ya que se
 //    usan de forma inmediata en los bloques 1, 2 y 3.
//  ========================================================== */

  const LS_USERS   = 'mma2_users';
  const LS_NEWS    = 'mma2_news';
  const LS_DRAFTS  = 'mma2_drafts';
  const SS_SESSION = 'mma2_session';

  function $(sel, ctx){ return (ctx||document).querySelector(sel); }
  function $$(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }
  function uid(prefijo){ return prefijo + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function formatearFecha(iso){
    return new Date(iso).toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' });
  }
  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
  function placeholderImg(seed){ return `https://picsum.photos/seed/mma2-${seed}/900/700`; }

  /* ---------------- SEED DE DATOS ---------------- */
  function sembrarDatos(){
    if(!localStorage.getItem(LS_USERS)){
      localStorage.setItem(LS_USERS, JSON.stringify([
        { id:'u_admin', username:'admin', password:'admin123', role:'admin', name:'Administración' },
        { id:'u_edit1', username:'editora1', password:'editor123', role:'editor', name:'Valentina Ríos' }
      ]));
    }
    if(!localStorage.getItem(LS_NEWS)){
      const hoy = new Date();
      const haceDias = n => { const d = new Date(hoy); d.setDate(d.getDate()-n); return d.toISOString(); };
      localStorage.setItem(LS_NEWS, JSON.stringify([
        {
          id:'n1',
          title:"Abrimos inscripciones para el taller de verano",
          excerpt:"Juego y estimulación sensorial para niñas y niños de 3 a 8 años. Cupos limitados.",
          body:"Desde el 15 de diciembre abrimos las inscripciones para el taller de verano, para niñas y niños de 3 a 8 años.\n\nLas actividades combinan juego libre y momentos de calma en la sala sensorial, siempre acompañados por el equipo.\n\nLos cupos son limitados. Podés anotarte en la sede o escribiéndonos por correo.",
          image:"https://picsum.photos/seed/mma2-taller/900/700",
          author:"Equipo Mi Mundo Azul",
          date: haceDias(2)
        },
        {
          id:'n2',
          title:"Nueva sala sensorial en la sede",
          excerpt:"Gracias a la comunidad, sumamos un espacio para la calma y la autorregulación.",
          body:"Inauguramos una nueva sala sensorial, pensada junto al equipo de terapia ocupacional.\n\nTiene luz regulable, texturas variadas y un rincón de calma para los momentos que lo necesitan.\n\nGracias a cada familia y donante que hizo esto posible.",
          image:"https://picsum.photos/seed/mma2-sala/900/700",
          author:"Equipo Mi Mundo Azul",
          date: haceDias(9)
        },
        {
          id:'n3',
          title:"Taller gratuito de comunicación para familias",
          excerpt:"Aprendé a usar pictogramas y tableros de comunicación en casa.",
          body:"Organizamos un taller gratuito sobre comunicación aumentativa para familias.\n\nNuestras fonoaudiólogas muestran cómo usar pictogramas y tableros en el día a día.\n\nEs abierto a toda la comunidad. Los cupos se confirman por orden de inscripción.",
          image:"https://picsum.photos/seed/mma2-comunicacion/900/700",
          author:"Lic. Marina Sosa",
          date: haceDias(18)
        },
        {
          id:'n4',
          title:"La historia de Tomás",
          excerpt:"Su mamá cuenta cómo cambió el día a día después de empezar en Mi Mundo Azul.",
          body:"Tomás llegó a los tres años, cuando a la familia le costaba comunicarse con él. Hoy, dos años después, su mamá comparte su historia.\n\n'El equipo nos acompañó a toda la familia, con mucha paciencia', cuenta.\n\nHistorias como la de Tomás son las que nos recuerdan por qué hacemos este trabajo.",
          image:"https://picsum.photos/seed/mma2-historia/900/700",
          author:"Equipo Mi Mundo Azul",
          date: haceDias(27)
        }
      ]));
    }
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

  /* ---------------- AVISO FLOTANTE (toast) ---------------- */
  let toastTimer;
  function mostrarToast(msg, icono){
    const t = $('#toast');
    t.innerHTML = `<span>${icono||'✅'}</span><span>${msg}</span>`;
    t.classList.add('mostrar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('mostrar'), 3200);
  }

  /* ---------------- VENTANAS DE CONFIRMACIÓN Y AVISO (reemplazan confirm/alert) ---------------- */
  function preguntarConfirmacion(opciones){
    // opciones: {icono, titulo, texto, textoSi, onSi}
    $('#iconoConfirmar').textContent = opciones.icono || '❓';
    $('#tituloConfirmar').textContent = opciones.titulo || '¿Estás seguro/a?';
    $('#textoConfirmar').textContent = opciones.texto || '';
    $('#btnConfirmarSi').textContent = opciones.textoSi || 'Sí, continuar';
    const modal = $('#modalConfirmar');
    modal.classList.add('activo');

    const btnSi = $('#btnConfirmarSi');
    const btnNo = $('#btnConfirmarNo');
    function limpiar(){
      modal.classList.remove('activo');
      btnSi.removeEventListener('click', alConfirmar);
      btnNo.removeEventListener('click', alCancelar);
    }
    function alConfirmar(){ limpiar(); if(opciones.onSi) opciones.onSi(); }
    function alCancelar(){ limpiar(); }
    btnSi.addEventListener('click', alConfirmar);
    btnNo.addEventListener('click', alCancelar);
  }

  function mostrarAviso(texto){
    $('#textoAviso').textContent = texto;
    $('#modalAviso').classList.add('activo');
  }
  $('#btnCerrarAviso').addEventListener('click', ()=> $('#modalAviso').classList.remove('activo'));

  /* ---------------- CIERRE DE SESIÓN (usado por admin y editor) ---------------- */
  function cerrarSesion(){
    clearSession();
    mostrarVista('publico');
    mostrarToast('Saliste del panel. ¡Hasta pronto!', '👋');
  }

  /* ---------------- CAMBIO DE VISTAS ---------------- */
  function mostrarVista(nombre){
    ['vistaPublica','vistaLogin','vistaAdmin','vistaEditor'].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      const debeVerse = (
        (nombre==='publico' && id==='vistaPublica') ||
        (nombre==='login' && id==='vistaLogin') ||
        (nombre==='admin' && id==='vistaAdmin') ||
        (nombre==='editor' && id==='vistaEditor')
      );
      el.classList.toggle('oculto', !debeVerse);
    });
    $('#cabeceraPublica').classList.toggle('oculto', nombre !== 'publico');
    window.scrollTo(0,0);
  }

  /* ---------------- MODALES Y UTILERÍAS DE INTERFAZ ---------------- */
  function abrirModal(id){ $('#'+id).classList.add('activo'); }
  function cerrarModal(id){ $('#'+id).classList.remove('activo'); }
  $$('[data-cerrar-modal]').forEach(btn=> btn.addEventListener('click', ()=> cerrarModal(btn.dataset.cerrarModal)));
  $$('.modal-fondo').forEach(fondo=> fondo.addEventListener('click', (e)=>{ if(e.target === fondo) fondo.classList.remove('activo'); }));


