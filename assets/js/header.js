(function () {
  const script = document.currentScript;
  const root = script?.getAttribute('data-root') || '';

  function insertar() {
    const destino = document.getElementById('header');
    if (!destino) return;

    destino.innerHTML = `
      <header id="cabeceraPublica"
              class="flex items-center justify-between gap-4 flex-wrap
                     px-[5vw] py-4 bg-morado-claro shadow-sm">
        <a href="${root}index.html#inicio"
           class="flex items-center gap-3">
          <img src="${root}assets/imgs/logo.png"
               alt="Mi Mundo Azul"
               class="w-16 h-16 shrink-0 object-contain">

          <div class="font-baloo font-bold leading-tight">
            Mi Mundo Azul
            <small class="block font-nunito font-normal text-tinta-suave text-sm">
              Asociación Autista de Flores
            </small>
          </div>
        </a>

        <nav aria-label="Navegación principal"
             class="flex flex-wrap items-center gap-2
                    text-sm font-semibold text-azul-oscuro">
          <a href="${root}index.html#inicio"
             class="px-4 py-2 rounded-xl hover:bg-cielo transition-colors">
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