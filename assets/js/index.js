function cerrarSesion(){
  clearSession();
  window.location.href = '../index.html?salida=1';
}

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

(function resolverEstadoInicial(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('salida') === '1'){
    mostrarToast('Saliste del panel. ¡Hasta pronto!', '👋');
    history.replaceState({}, '', window.location.pathname);
  }
  if(window.location.hash === '#login') mostrarPantallaLogin();
})();

let noticiasPublicas = [];

// Solo URLs https. Si son de ImageKit y se pide un ancho, llegan ya redimensionadas
// (las tarjetas no necesitan la foto original de varios MB).
function fuenteImagen(url, ancho){
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return '';
  let u = url.replace(/[<>"'() ]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  if (ancho && /^https:\/\/ik\.imagekit\.io\//i.test(u) && !u.includes('?')) u += `?tr=w-${ancho},q-80`;
  return u;
}


async function cargarGridPublico() {
  const grid = document.getElementById('gridNoticias');
  if (!grid) return;
  const pieVacio = document.getElementById('piePublicoVacio');

  let noticias = [];
  try {
    // getNews() ya trae solo las enabled = true desde Supabase
    noticias = await DB.getNews();
  } catch (err) {
    console.error('Error al cargar la grilla:', err);
    grid.innerHTML = '';
    if (pieVacio) pieVacio.innerHTML = '<p class="text-center text-tinta-suave">⚠️ No pudimos cargar las noticias. Probá de nuevo en un rato.</p>';
    return;
  }

  noticiasPublicas = noticias;

  if (noticias.length === 0) {
    grid.innerHTML = '';
    if (pieVacio) pieVacio.innerHTML = '<p class="text-center text-tinta-suave">📭 Todavía no hay noticias publicadas. ¡Volvé pronto!</p>';
    return;
  }
  
  if (pieVacio) pieVacio.innerHTML = '';

  grid.innerHTML = noticias.map(n => {
    const portadaSrc = fuenteImagen(n.imagen_portada, 800);
    const estiloPortada = portadaSrc ? `background-image:url('${portadaSrc}')` : 'background-color:#D5ECF8';
    
    return `
      <article class="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col h-full">
        <div class="tarjeta-noticia__imagen h-44 relative bg-cover bg-center" style="${estiloPortada}">
          <span class="absolute bottom-3 left-3 bg-white/90 text-xs font-bold px-3 py-1 rounded-full">${formatearFecha(n.date || n.created_at)}</span>
        </div>
        <div class="p-5 flex flex-col flex-1 gap-3">
          <h3 class="font-baloo font-bold text-lg text-azul-oscuro break-words" style="overflow-wrap:anywhere;">${escapeHTML(n.title)}</h3>
          <p class="text-sm text-tinta-suave mt-0 flex-1 break-words leading-relaxed" style="min-height:0;">${escapeHTML(n.excerpt || '')}</p>
          <button class="boton boton--azul self-start mt-auto" data-abrir-noticia="${n.id}">
            <i class="bi bi-book" aria-hidden="true"></i> Leer noticia completa
          </button>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-abrir-noticia]').forEach(btn => {
    btn.addEventListener('click', () => abrirNoticiaCompleta(btn.dataset.abrirNoticia));
  });
}



function abrirBloqueTexto(data) {
  const modalExistente = $('#modal-bloque-texto');
  if (modalExistente) modalExistente.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modal-bloque-texto';
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300';

  overlay.innerHTML = `
    <div class="bg-white max-w-lg w-full p-8 rounded-3xl shadow-2xl border-2 border-azul-suave transform transition-all scale-95 opacity-0 animate-fade-in" style="animation: modalIn 0.25s forwards;">
      ${data.categoria ? `<span class="text-xs font-extrabold text-tinta-suave uppercase tracking-wider mb-2 block">${escapeHTML(data.categoria)}</span>` : ''}
      <h3 class="font-baloo font-bold text-2xl text-azul-oscuro mb-4 leading-tight">${escapeHTML(data.titulo || 'Nota')}</h3>
      
      <div class="text-base text-tinta-suave leading-relaxed mb-6">
        ${escapeHTML(data.texto || '').replace(/\n/g, '<br>')}
      </div>

      <button type="button" class="w-full bg-azul-fuerte text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition cursor-pointer" id="btn-cerrar-modal">
        Salir
      </button>
    </div>
  `;

  if (!$('#estilos-modal-animacion')) {
    const style = document.createElement('style');
    style.id = 'estilos-modal-animacion';
    style.innerHTML = `
      @keyframes modalIn {
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const cerrarModal = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 250);
  };

  overlay.querySelector('#btn-cerrar-modal').addEventListener('click', cerrarModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrarModal();
  });

  document.body.appendChild(overlay);
}

function abrirNoticiaCompleta(id) {
  window.open(`pages/noticia.html?id=${encodeURIComponent(id)}`, '_blank');
}

function mostrarPantallaLogin(){
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

document.addEventListener('click', (event) => {
  const acceso = event.target.closest('[data-acceso-equipo]');
  if (!acceso) return;

  event.preventDefault();
  window.location.hash = 'login';
  mostrarPantallaLogin();
});

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

if (formLogin) {
  let validando = false;

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validando) return;

    const err = document.getElementById('errorLogin');
    const estado = document.getElementById('estadoLogin');
    const boton = formLogin.querySelector('button[type="submit"]');
    const usuario = document.getElementById('loginUsuario')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value;

    validando = true;
    boton.disabled = true;
    boton.textContent = 'Validando usuario…';
    formLogin.setAttribute('aria-busy', 'true');

    if (err) err.textContent = '';
    if (estado) estado.textContent = 'Estamos comprobando tus datos. Un momento…';

    let redirigiendo = false;

    try {
      const encontrado = await loginCuenta(usuario, pass);

      if (!encontrado) {
        if (err) {
          err.innerHTML = `
            <div class="bg-red-50 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
              ⚠️ Ese usuario o esa contraseña no son correctos.
              Fijate bien e intentá de nuevo.
            </div>`;
        }
        return;
      }

      setSession({
        id: encontrado.id,
        username: encontrado.username,
        role: encontrado.role,
        name: encontrado.name
      });

      boton.textContent = 'Ingresando…';
      if (estado) estado.textContent = 'Datos correctos. Abriendo tu panel…';

      formLogin.reset();
      window.location.href = encontrado.role === 'admin'
        ? 'pages/admins.html'
        : 'pages/editores.html';

      redirigiendo = true;
    } catch (error) {
      console.error(error);
      if (err) {
        err.innerHTML = `
          <div class="bg-red-50 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
            ⚠️ No pudimos conectarnos. Probá de nuevo en un rato.
          </div>`;
      }
    } finally {
      // Si hay un error, permitir otro intento.
      // Si va a abrir el panel, mantener el indicador de carga.
      if (!redirigiendo) {
        validando = false;
        boton.disabled = false;
        boton.textContent = 'Entrar';
        formLogin.removeAttribute('aria-busy');
        if (estado) estado.textContent = '';
      }
    }
  });
}

// Cargar las noticias apenas esté listo el documento
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargarGridPublico);
else cargarGridPublico();
