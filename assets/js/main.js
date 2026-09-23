"use strict";

function cerrarSesion(){
  clearSession();
  window.location.href = '../index.html?salida=1';
}

/* =========================================================
   LÓGICA PRINCIPAL — index.html / main.js
========================================================== */

const contenedorIndex = document.getElementById('pagina-index');
if (contenedorIndex) {
  $$('.nav-scroll', contenedorIndex).forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = document.querySelector(a.getAttribute('href'));
    if (destino) destino.scrollIntoView({ behavior: 'smooth' });
  }));
}

const elAnio = document.getElementById('anioFooter');
if (elAnio) elAnio.textContent = new Date().getFullYear();

sembrarDatos();
renderGridPublico();
renderFormularios();

(function resolverEstadoInicial(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('salida') === '1'){
    mostrarToast('Saliste del panel. ¡Hasta pronto!', '👋');
    history.replaceState({}, '', window.location.pathname);
  }
  if(window.location.hash === '#login') mostrarPantallaLogin();
})();

/* ---------------- FORMULARIOS GOOGLE ---------------- */

function extraerUrlForm(entrada) {
  if (entrada.includes('<iframe')) {
    const match = entrada.match(/src=["']([^"']+)["']/);
    return match ? match[1] : null;
  }
  return entrada.trim();
}

function renderFormularios() {
  const container = document.getElementById('gridFormularios');
  if (!container) return;

  const formularios = DB.getForms();
  
  if (formularios.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center text-tinta-suave py-8 bg-white/50 rounded-3xl border border-dashed border-cielo-oscuro">
        <p>📭 No hay formularios disponibles en este momento.</p>
      </div>`;
    return;
  }

  container.innerHTML = formularios.map((form) => `
    <article class="bg-white rounded-3xl p-6 shadow-md border border-cielo-medio flex flex-col justify-between hover:-translate-y-1 transition duration-200">
      <div>
        <div class="text-3xl text-azul-fuerte mb-3">
          <i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i>
        </div>
        <h3 class="font-baloo font-bold text-xl text-azul-oscuro break-words">${escapeHTML(form.title)}</h3>
      </div>
      <div class="mt-6 flex gap-2">
        <button class="boton boton--azul flex-1 py-2.5 text-sm" data-abrir-form="${form.id}">
          <span>📝</span> Completar
        </button>
        <button class="bg-rojo-claro text-rojo font-bold px-3 py-2.5 rounded-xl hover:bg-rojo hover:text-white transition text-sm" data-eliminar-form="${form.id}" title="Eliminar">
          <i class="bi bi-trash-fill" aria-hidden="true"></i>
        </button>
      </div>
    </article>
  `).join('');

  $$('[data-abrir-form]', container).forEach(btn => {     btn.addEventListener('click', () => {       const id = btn.dataset.abrirForm;       const form = DB.getForms().find(f => f.id === id);       if (form) abrirModalFormulario(form);     });   });    $$
('[data-eliminar-form]', container).forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.eliminarForm;
      if (confirm('¿Seguro que deseas eliminar este formulario?')) {
        const nuevosForms = DB.getForms().filter(f => f.id !== id);
        DB.setForms(nuevosForms);
        renderFormularios();
        mostrarToast('Formulario eliminado correctamente', '🗑️');
      }
    });
  });
}

// Escucha del botón por ID
const btnAgregar = document.getElementById('btnAgregarForm');
if (btnAgregar) {
  btnAgregar.addEventListener('click', (e) => {
    e.preventDefault();

    const inputTitulo = document.getElementById('inputTituloForm');
    const inputUrl = document.getElementById('inputUrlForm');

    const titulo = inputTitulo ? inputTitulo.value.trim() : '';
    const rawInput = inputUrl ? inputUrl.value.trim() : '';
    const urlLimpia = rawInput ? extraerUrlForm(rawInput) : null;

    if (!titulo || !urlLimpia) {
      mostrarToast('Ingresá un título y una URL o iframe válido.', '⚠️');
      return;
    }

    const nuevos = DB.getForms();
    nuevos.push({
      id: uid('f'),
      title: titulo,
      url: urlLimpia
    });

    DB.setForms(nuevos);

    if (inputTitulo) inputTitulo.value = '';
    if (inputUrl) inputUrl.value = '';

    renderFormularios();
    mostrarToast('¡Tarjeta de formulario agregada!', '✨');
  });
}

function abrirModalFormulario(form) {
  let modal = document.getElementById('modalFormulario');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalFormulario';
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
      <div class="flex justify-between items-center px-6 py-4 border-b border-cielo-medio bg-cielo">
        <h3 class="font-baloo font-bold text-lg text-azul-oscuro">${escapeHTML(form.title)}</h3>
        <button id="btnCerrarModalForm" class="text-tinta-suave hover:text-rojo text-2xl font-bold leading-none">&times;</button>
      </div>
      <div class="p-2 flex-1 bg-white">
        <iframe src="${form.url}" class="w-full h-full border-0 rounded-b-2xl" loading="lazy">Cargando formulario...</iframe>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  const cerrar = () => modal.classList.add('hidden');
  const btnCerrar = modal.querySelector('#btnCerrarModalForm');
  if(btnCerrar) btnCerrar.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrar();
  });
}

/* ---------------- NOTICIAS PÚBLICAS ---------------- */

function renderGridPublico(){
  const grid = document.getElementById('gridNoticias');
  if(!grid) return;
  const noticias = DB.getNews();
  if(noticias.length === 0){
    grid.innerHTML = '';
    const pieVacio = document.getElementById('piePublicoVacio');
    if(pieVacio) pieVacio.innerHTML = '<p class="text-center text-tinta-suave">📭 Todavía no hay noticias publicadas. ¡Volvé pronto!</p>';
    return;
  }
  const pieVacio = document.getElementById('piePublicoVacio');
  if(pieVacio) pieVacio.innerHTML = '';
  grid.innerHTML = noticias.map(n => `
    <article class="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col h-full">
      <div class="tarjeta-noticia__imagen h-44 relative" style="background-image:url('${n.image || ''}')">
        <span class="absolute bottom-3 left-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">${formatearFecha(n.date)}</span>
      </div>
      <div class="p-5 flex flex-col flex-1 gap-3">
        <h3 class="font-baloo font-bold text-lg text-azul-oscuro break-words" style="overflow-wrap:anywhere;">${escapeHTML(n.title)}</h3>
        <p class="text-sm text-tinta-suave mt-0 flex-1 break-words leading-relaxed" style="min-height:0;">${escapeHTML(n.excerpt)}</p>
        <button class="boton boton--azul self-start mt-auto" data-abrir-noticia="${n.id}">
          <span>📖</span> Leer noticia completa
        </button>
      </div>
    </article>
  `).join('');

  $$('[data-abrir-noticia]', grid).forEach(btn=>{
    btn.addEventListener('click', ()=> abrirNoticiaCompleta(btn.dataset.abrirNoticia));
  });
}

function abrirNoticiaCompleta(id){
  const noticia = DB.getNews().find(n => n.id === id);
  if(!noticia) return;

  const parrafos = (noticia.body || '')
    .split(/\n\s*\n/)
    .map(p => `<p>${escapeHTML(p).replace(/\n/g,'<br>')}</p>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(noticia.title)} · Mi Mundo Azul</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  :root{ --azul-fuerte:#1B5E8C; --azul-oscuro:#123A56; --cielo:#EAF4FB; --sol:#FFC857; --tinta:#16324A; --tinta-suave:#3F5A72; }
  *{box-sizing:border-box;}
  html{font-size:19px;}
  body{margin:0; font-family:'Nunito',sans-serif; background:var(--cielo); color:var(--tinta); line-height:1.8;}
  header{ display:flex; align-items:center; justify-content:space-between; padding:20px 5vw; background:var(--azul-fuerte); flex-wrap:wrap; gap:14px;}
  header .marca{ display:flex; align-items:center; gap:12px; color:#fff; font-family:'Baloo 2',sans-serif; font-weight:700; font-size:1.15rem;}
  header button{ background:#fff; color:var(--azul-fuerte); border:none; padding:14px 26px; border-radius:999px; font-family:'Baloo 2',sans-serif; font-weight:700; font-size:1rem; cursor:pointer; min-height:52px;}
  main{ max-width:740px; margin:0 auto; padding:50px 6vw 60px; }
  .portada{ width:100%; border-radius:32px; aspect-ratio:16/10; object-fit:cover; margin-bottom:30px;}
  .meta{ font-size:.9rem; color:var(--tinta-suave); text-transform:uppercase; letter-spacing:.05em; font-weight:800; margin-bottom:14px;}
  h1{ font-family:'Baloo 2',sans-serif; font-size:clamp(1.6rem,4vw,2.5rem); color:var(--azul-oscuro); line-height:1.3; margin:0 0 26px;}
  article p{ margin-bottom:20px; font-size:1.1rem;}
  footer{ text-align:center; padding:20px 6vw 70px; }
  footer button{ background:var(--sol); color:var(--tinta); border:none; padding:16px 32px; border-radius:999px; font-weight:700; font-size:1.05rem; cursor:pointer; font-family:'Baloo 2',sans-serif; min-height:56px; }
</style>
</head>
<body>
  <header>
    <div class="marca">Mi Mundo Azul</div>
    <button onclick="window.close()">← Volver</button>
  </header>
  <main>
    <img class="portada" src="${noticia.image || ''}" alt="">
    <span class="meta">${formatearFecha(noticia.date)} · ${escapeHTML(noticia.author || 'Equipo Mi Mundo Azul')}</span>
    <h1>${escapeHTML(noticia.title)}</h1>
    <article>${parrafos}</article>
  </main>
  <footer><button onclick="window.close()">✕ Cerrar esta noticia</button></footer>
</body>
</html>`;

  const blob = new Blob([html], {type:'text/html'});
  window.open(URL.createObjectURL(blob), '_blank');
}

/* ---------------- LOGIN ---------------- */

function mostrarPantallaLogin(){
  mostrarUsuarios();
  const cp = document.getElementById('contenidoPublico');
  const hp = document.getElementById('cabeceraPublica');
  const sl = document.getElementById('seccionLogin');
  if(cp) cp.classList.add('hidden');
  if(hp) hp.classList.add('hidden');
  if(sl) sl.classList.remove('hidden');
  window.scrollTo(0,0);
}

function mostrarSitioPublico(){
  const cp = document.getElementById('contenidoPublico');
  const hp = document.getElementById('cabeceraPublica');
  const sl = document.getElementById('seccionLogin');
  if(sl) sl.classList.add('hidden');
  if(cp) cp.classList.remove('hidden');
  if(hp) hp.classList.remove('hidden');
}

const btnIrLogin = document.getElementById('btnIrLogin');
if(btnIrLogin) {
  btnIrLogin.addEventListener('click', ()=>{
    window.location.hash = 'login';
    mostrarPantallaLogin();
  });
}

const btnVolver = document.getElementById('volverSitioLogin');
if(btnVolver) {
  btnVolver.addEventListener('click', ()=>{
    history.replaceState({}, '', window.location.pathname);
    mostrarSitioPublico();
  });
}

const btnPass = document.getElementById('btnMostrarPass');
if(btnPass) {
  btnPass.addEventListener('click', ()=>{
    const campo = document.getElementById('loginPassword');
    if (!campo) return;
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    btnPass.textContent = mostrar ? '🙈' : '👁️';
  });
}

const formLogin = document.getElementById('formLogin');
if(formLogin) {
  formLogin.addEventListener('submit', (e)=>{
    e.preventDefault();
    const usuario = document.getElementById('loginUsuario')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value;
    const encontrado = DB.getUsers().find(u => u.username === usuario && u.password === pass);
    if(!encontrado){
      const err = document.getElementById('errorLogin');
      if(err) err.innerHTML = '<div class="bg-red-50 text-red-700 text-sm font-semibold rounded-xl px-4 py-3 flex gap-2"><span>⚠️</span><span>Ese usuario o esa contraseña no son correctos. Fijate bien e intentá de nuevo.</span></div>';
      return;
    }
    const err = document.getElementById('errorLogin');
    if(err) err.innerHTML = '';
    setSession({ id:encontrado.id, username:encontrado.username, role:encontrado.role, name:encontrado.name });
    formLogin.reset();
    window.location.href = (encontrado.role === 'admin') ? 'Public/admin.html' : 'Public/editor.html';
  });
}