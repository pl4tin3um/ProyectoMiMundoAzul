(function () {
  const script = document.currentScript;
  const root = script?.getAttribute('data-root') || '';

  if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html')) {
    sessionStorage.removeItem('mma2_session');
    localStorage.removeItem('mma2_session');
  }

  function insertar() {
    const destino = document.getElementById('header');
    if (!destino) return;

    destino.innerHTML = `
      <style>
        #cabeceraPublica nav a {
          transition: background-color .2s ease, color .2s ease;
        }
        #cabeceraPublica nav a:hover {
          background-color: var(--cielo);
          color: var(--azul-oscuro);
        }
        #cabeceraPublica nav a:first-child:hover {
          background-color: var(--azul-oscuro);
          color: #fff;
        }
      </style>
      <header id="cabeceraPublica"
              class="flex items-center justify-between gap-4 flex-wrap
                     px-[5vw] py-4 rounded-2xl border border-[#d9c6f5]
                     bg-gradient-to-r from-[#f7f1ff] via-[#ffffff] to-[#eef9ff]
                     shadow-[0_8px_24px_rgba(61,74,155,0.12)] backdrop-blur-sm">
        <a href="${root}index.html#inicio"
           class="flex items-center gap-3">
          <img src="${root}assets/imgs/logo.png"
               alt="Mi Mundo Azul"
               class="w-16 h-16 shrink-0 object-contain">

          <div class="font-baloo text-xl font-bold leading-tight">
            Mi Mundo Azul
            <small class="block font-nunito text-base font-normal text-tinta-suave">
              Asociación Autista de Flores
            </small>
          </div>
        </a>

        <nav aria-label="Navegación principal"
             class="flex flex-wrap items-center gap-2
                  text-lg font-semibold text-azul-oscuro">
           <a href="${root}index.html"
             class="px-4 py-2 rounded-xl bg-cielo text-azul-oscuro font-bold hover:bg-azul-oscuro hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-oscuro transition-colors">
            Inicio
          </a>
          <a href="${root}index.html#nosotros"
             class="px-4 py-2 rounded-xl hover:bg-cielo transition-colors">
            Nosotros
          </a>
          <a href="${root}index.html#noticias"
             class="px-4 py-2 rounded-xl hover:bg-cielo transition-colors">
            Noticias
          </a>
          <a href="${root}pages/formularios.html"
             class="px-4 py-2 rounded-xl hover:bg-cielo transition-colors">
            Formularios
          </a>
        </nav>
      </header>
    `;
  }

  insertar();
})();