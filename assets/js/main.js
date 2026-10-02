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

// (sembrarDatos() ya no existe: los datos viven en Supabase)
renderGridPublico();


(function resolverEstadoInicial(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('salida') === '1'){
    mostrarToast('Saliste del panel. ¡Hasta pronto!', '👋');
    history.replaceState({}, '', window.location.pathname);
  }
  if(window.location.hash === '#login') mostrarPantallaLogin();
})();


/* ---------------- NOTICIAS PÚBLICAS ---------------- */

// Se guardan acá para poder abrir una noticia sin volver a consultar la BD.
// (window.open tiene que ejecutarse enseguida tras el clic; si esperara una
// consulta, el navegador podría bloquear la ventana emergente.)
let noticiasPublicas = [];

async function renderGridPublico(){
  const grid = document.getElementById('gridNoticias');
  if(!grid) return;
  const pieVacio = document.getElementById('piePublicoVacio');

  let noticias = [];
  try {
    noticias = (await DB.getNews()).filter(n => n.enabled !== false);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '';
    if(pieVacio) pieVacio.innerHTML = '<p class="text-center text-tinta-suave">⚠️ No pudimos cargar las noticias. Probá de nuevo en un rato.</p>';
    return;
  }

  noticiasPublicas = noticias;

  if(noticias.length === 0){
    grid.innerHTML = '';
    if(pieVacio) pieVacio.innerHTML = '<p class="text-center text-tinta-suave">📭 Todavía no hay noticias publicadas. ¡Volvé pronto!</p>';
    return;
  }
  if(pieVacio) pieVacio.innerHTML = '';
  grid.innerHTML = noticias.map(n => `
    <article class="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col h-full">
      <div class="tarjeta-noticia__imagen h-44 relative" style="background-image:url('${(() => {
        const imgSrc = n.imagenPortada || n.image;
        if (!imgSrc) return '';
        return imgSrc instanceof File ? URL.createObjectURL(imgSrc) : imgSrc;
      })()}')">
        <span class="absolute bottom-3 left-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">${formatearFecha(n.date)}</span>
      </div>
      <div class="p-5 flex flex-col flex-1 gap-3">
        <h3 class="font-baloo font-bold text-lg text-azul-oscuro break-words" style="overflow-wrap:anywhere;">${escapeHTML(n.title)}</h3>
        <p class="text-sm text-tinta-suave mt-0 flex-1 break-words leading-relaxed" style="min-height:0;">${escapeHTML(n.excerpt)}</p>
        <button class="boton boton--azul self-start mt-auto" data-abrir-noticia="${n.id}">
          <i class="bi bi-book" aria-hidden="true"></i> Leer noticia completa
        </button>
      </div>
    </article>
  `).join('');

  $$('[data-abrir-noticia]', grid).forEach(btn=>{
    btn.addEventListener('click', ()=> abrirNoticiaCompleta(btn.dataset.abrirNoticia));
  });
}


function abrirNoticiaCompleta(id) {
  const noticia = noticiasPublicas.find(n => String(n.id) === String(id));
  if (!noticia) return;

  const parrafos = (noticia.body || '')
    .split(/\n\s*\n/)
    .map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  let portadaHTML = '';
  const imagenPortadaSrc = noticia.imagenPortada || noticia.image;
  if (imagenPortadaSrc) {
    const src = imagenPortadaSrc instanceof File ? URL.createObjectURL(imagenPortadaSrc) : imagenPortadaSrc;
    portadaHTML = `<img class="portada" src="${src}" alt="">`;
  }

  let mediaHTML = '';
  if (Array.isArray(noticia.media) && noticia.media.length > 0) {
    mediaHTML = noticia.media.map(item => {
    const archivo = item.data || item;
    const src = archivo instanceof File ? URL.createObjectURL(archivo) : archivo;

      const esVideo =
        item.type === 'video' ||
        (archivo instanceof File && archivo.type.startsWith('video/')) ||
        (typeof archivo === 'string' && archivo.startsWith('data:video/'));

      if (esVideo) {
        const tipoVideo = archivo instanceof File ? archivo.type : 'video/mp4';
        return `
          <video class="media-item" controls preload="metadata">
            <source src="${src}" type="${tipoVideo}">
            Tu navegador no soporta la reproducción de video.
          </video>
        `;
      }

      return `<img class="media-item" src="${src}" alt="" loading="lazy">`;
    }).join('');
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(noticia.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --azul-fuerte: #1B5E8C; --azul-oscuro: #123A56; --cielo: #EAF4FB; --sol: #FFC857; --tinta: #16324A; --tinta-suave: #3F5A72; }
    * { box-sizing: border-box; }
    html { font-size: 19px; }
    body { margin: 0; font-family: 'Nunito', sans-serif; background: var(--cielo); color: var(--tinta); line-height: 1.8; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 20px 5vw; background: var(--azul-fuerte); flex-wrap: wrap; gap: 14px; }
    header .marca { display: flex; align-items: center; gap: 12px; color: #fff; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 1.15rem; }
    header button { background: #fff; color: var(--azul-fuerte); border: none; padding: 14px 26px; border-radius: 999px; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; min-height: 52px; }
    main { max-width: 740px; margin: 0 auto; padding: 50px 6vw 60px; }
    .portada { width: 100%; border-radius: 32px; aspect-ratio: 16 / 10; object-fit: cover; margin-bottom: 30px; }
    .meta { display: block; font-size: 0.9rem; color: var(--tinta-suave); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; margin-bottom: 14px; }
    h1 { font-family: 'Baloo 2', sans-serif; font-size: clamp(1.6rem, 4vw, 2.5rem); color: var(--azul-oscuro); line-height: 1.3; margin: 0 0 26px; }
    .media-gallery { display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px; }
    .media-item { width: 100%; border-radius: 24px; max-height: 500px; object-fit: cover; background: #000; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
    video.media-item { aspect-ratio: 16 / 9; }
    article p { margin-bottom: 20px; font-size: 1.1rem; }
    footer { text-align: center; padding: 20px 6vw 70px; }
    footer button { background: var(--sol); color: var(--tinta); border: none; padding: 16px 32px; border-radius: 999px; font-weight: 700; font-size: 1.05rem; cursor: pointer; font-family: 'Baloo 2', sans-serif; min-height: 56px; }
  </style>
</head>
<body>
  <header>
    <div class="marca">Mi Mundo Azul</div>
    <button onclick="window.close()">Volver</button>
  </header>
  <main>
    ${portadaHTML}
    <span class="meta">
      ${formatearFecha(noticia.date)}
      ·
      ${escapeHTML(typeof noticia.author === 'string' ? noticia.author : 'Equipo Mi Mundo Azul')}
    </span>
    <h1>${escapeHTML(noticia.title)}</h1>
    <div class="media-gallery">${mediaHTML}</div>
    <article>${parrafos}</article>
  </main>
  <footer>
    <button onclick="window.close()">Volver</button>
  </footer>
</body>
</html>
`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
/* ========================================================
   Bloques de información
========================================================== */


function abrirBloqueTexto(data) {
  const win = window.open('', '_blank');
  if (!win) return;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(data.titulo || 'Información')} · Mi Mundo Azul</title>
  
  <style>
    :root {
      --azul-fuerte: #1B5E8C;
      --cielo: #EAF4FB;
      --tinta: #16324A;
      --tinta-suave: #3F5A72;
    }
    
    * { box-sizing: border-box; }
    
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--cielo);
      color: var(--tinta);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    /* Tarjeta contenedora para bloques cortos */
    .card {
      background: #ffffff;
      max-width: 500px;
      width: 100%;
      padding: 32px;
      border-radius: 24px;
      box-shadow: 0 10px 25px rgba(27, 94, 140, 0.1);
    }

    .categoria {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--tinta-suave);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      display: block;
    }

    h1 {
      margin: 0 0 16px;
      color: var(--azul-fuerte);
      font-size: 1.5rem;
      line-height: 1.3;
    }

    .contenido {
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .btn-cerrar {
      width: 100%;
      background: var(--azul-fuerte);
      color: #ffffff;
      border: none;
      padding: 12px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-cerrar:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>

  <main class="card">
    ${data.categoria ? `<span class="categoria">${escapeHTML(data.categoria)}</span>` : ''}
    <h1>${escapeHTML(data.titulo || 'Nota')}</h1>
    
    <div class="contenido">
      ${escapeHTML(data.texto || '').replace(/\n/g, '<br>')}
    </div>

    <button class="btn-cerrar" onclick="window.close()">Entendido</button>
  </main>

</body>
</html>
  `;

  win.document.write(html);
  win.document.close();
}


/* ---------------- LOGIN ---------------- */

function mostrarPantallaLogin(){
  // Se quitó mostrarUsuarios(): era una ayuda de pruebas que listaba las
  // cuentas en pantalla. Con la BD real no debe verse públicamente.
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
  formLogin.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const err = document.getElementById('errorLogin');
    const usuario = document.getElementById('loginUsuario')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value;

    let encontrado = null;
    try {
      encontrado = await loginCuenta(usuario, pass);
    } catch (error) {
      console.error(error);
      if(err) err.innerHTML = '<div class="bg-red-50 text-red-700 text-sm font-semibold rounded-xl px-4 py-3 flex gap-2"><span>⚠️</span><span>No pudimos conectarnos. Probá de nuevo en un rato.</span></div>';
      return;
    }

    if(!encontrado){
      if(err) err.innerHTML = '<div class="bg-red-50 text-red-700 text-sm font-semibold rounded-xl px-4 py-3 flex gap-2"><span>⚠️</span><span>Ese usuario o esa contraseña no son correctos. Fijate bien e intentá de nuevo.</span></div>';
      return;
    }

    if(err) err.innerHTML = '';
    setSession({ id:encontrado.id, username:encontrado.username, role:encontrado.role, name:encontrado.name });
    formLogin.reset();
    window.location.href = (encontrado.role === 'admin') ? 'pages/admins.html' : 'pages/editores.html';
  });
}