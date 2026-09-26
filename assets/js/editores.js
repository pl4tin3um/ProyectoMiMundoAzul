"use strict";
  function preguntarConfirmacion(opciones){
    $('#iconoConfirmar').textContent = opciones.icono || '❓';
    $('#tituloConfirmar').textContent = opciones.titulo || '¿Estás seguro/a?';
    $('#textoConfirmar').textContent = opciones.texto || '';
    $('#btnConfirmarSi').textContent = opciones.textoSi || 'Sí, continuar';
    const modal = $('#modalConfirmar');
    modal.classList.remove('hidden'); modal.classList.add('flex');

    const btnSi = $('#btnConfirmarSi');
    const btnNo = $('#btnConfirmarNo');
    function limpiar(){
      modal.classList.add('hidden'); modal.classList.remove('flex');
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
    const modal = $('#modalAviso');
    modal.classList.remove('hidden'); modal.classList.add('flex');
  }
  $('#btnCerrarAviso').addEventListener('click', ()=>{
    const modal = $('#modalAviso');
    modal.classList.add('hidden'); modal.classList.remove('flex');
  });

  function abrirModal(id){ const m = $('#'+id); m.classList.remove('hidden'); m.classList.add('flex'); }
  function cerrarModal(id){ const m = $('#'+id); m.classList.add('hidden'); m.classList.remove('flex'); }
  $$('[data-cerrar-modal]').forEach(btn=> btn.addEventListener('click', ()=> cerrarModal(btn.dataset.cerrarModal)));
  $$('.fixed.inset-0.bg-black\\/50').forEach(fondo=> fondo.addEventListener('click', (e)=>{ if(e.target === fondo){ fondo.classList.add('hidden'); fondo.classList.remove('flex'); } }));

  function cerrarSesion(){
    clearSession();
    window.location.href = '../index.html';
  }

  /* =========================================================
     PROTECCIÓN DE ACCESO (nueva — necesaria por la navegación real)
     Antes, el panel de editor/a era solo una "vista" que JS mostraba
     dentro de la misma página; nunca tenía una URL propia. Ahora que
     editor.html es un archivo real, cualquiera podría escribir esa
     dirección directo en el navegador sin haber iniciado sesión. Por
     eso, apenas carga el archivo, se revisa la sesión y si no es
     válida (o no es de un/a editor/a) se redirige a ../../index.html.
  ========================================================== */
  sembrarDatos();
  const sesion = getSession();
  if(!sesion || sesion.role !== 'editor'){
    !alert('No tenés permiso para entrar a esta página. Vas a volver al inicio.') && window.location.href = '../index.html';
  }

  /* =========================================================
     PANEL DE EDITOR/A — reciclado del Bloque 3 original.
     Único cambio real de lógica: ya NO se llama a renderGridPublico()
     después de guardar/eliminar una noticia, porque esa función vive
     en ../../index.html, en OTRO documento HTML. No hace falta llamarla: la
     próxima vez que alguien entre a ../../index.html, la grilla pública se
     arma de nuevo leyendo localStorage, así que ya va a mostrar los
     cambios sin ninguna sincronización manual entre páginas.
  ========================================================== */
  let draftKeyActual = null;

  function iniciarPanelEditor(){
    renderPanelEditor();

    $('#btnNuevaNoticia').addEventListener('click', ()=> abrirFormularioNoticia(null));
    $('#btnLogoutEditor').addEventListener('click', cerrarSesion);

    ['noticiaTitulo','noticiaImagen','noticiaExtracto','noticiaCuerpo'].forEach(id=>{
      $('#'+id).addEventListener('input', programarGuardadoBorrador);
    });

    $('#btnDescartarBorrador').addEventListener('click', ()=>{
      if(!draftKeyActual) return;
      preguntarConfirmacion({
        icono:'🗑️', titulo:'¿Descartar los cambios?',
        texto:'Lo que escribiste en esta noticia sin publicar se va a perder.',
        textoSi:'Sí, descartar',
        onSi(){
          const drafts = DB.getDrafts();
          delete drafts[draftKeyActual];
          DB.setDrafts(drafts);
          cerrarModal('modalNoticia');
          renderPanelEditor();
          mostrarToast('Borrador descartado', '🗑️');
        }
      });
    });

    $('#formNoticia').addEventListener('submit', (e)=>{
      e.preventDefault();
      const s = getSession();
      const id = $('#noticiaId').value || uid('n');
      const titulo = $('#noticiaTitulo').value.trim();
      const extracto = $('#noticiaExtracto').value.trim();
      const cuerpo = $('#noticiaCuerpo').value.trim();
      const imagen = $('#noticiaImagen').value.trim();

      let noticias = DB.getNews();
      const existente = noticias.find(n=>n.id===id);
      if(existente){
        existente.title = titulo; existente.excerpt = extracto; existente.body = cuerpo; existente.image = imagen;
      } else {
        noticias.push({ id, title: titulo, excerpt: extracto, body: cuerpo, image: imagen, author: s.name, date: new Date().toISOString() });
      }
      DB.setNews(noticias);

      const drafts = DB.getDrafts();
      delete drafts[draftKeyActual];
      DB.setDrafts(drafts);

      cerrarModal('modalNoticia');
      renderPanelEditor();
      mostrarToast(existente ? 'Noticia actualizada' : 'Noticia publicada', '✔️');
    });
  }

  function renderPanelEditor(){
    renderBloqueBorradores();
    renderListaNoticiasEditor();
  }

  function draftKeyPara(usuario, idNoticia){ return `${usuario}__${idNoticia || 'nueva'}`; }

  function renderBloqueBorradores(){
    const s = getSession();
    const drafts = DB.getDrafts();
    const propios = Object.entries(drafts).filter(([key]) => key.startsWith(s.username + '__'));
    const bloque = $('#bloqueBorradores');
    if(propios.length === 0){ bloque.innerHTML = ''; return; }

    bloque.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-6">
        <span class="text-2xl">💾</span>
        <div><strong class="block">Tenés noticias sin terminar de publicar</strong><span class="text-sm text-tinta-suave">Las vamos guardando solas mientras escribís, para que no se pierdan.</span></div>
      </div>
      <div class="space-y-3 mb-9">
        ${propios.map(([key, d]) => `
          <div class="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="text-2xl">📝</div>
              <div>
                <h3 class="font-bold">${escapeHTML(d.title || 'Todavía sin título')}<span class="pill-borrador">Sin publicar</span></h3>
                <p class="text-sm text-tinta-suave">Guardado el ${new Date(d.updatedAt).toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="boton boton--azul boton--chico" data-continuar-borrador="${key}">▶️ Continuar</button>
              <button class="boton boton--rojo boton--chico" data-borrar-borrador="${key}">🗑️ Descartar</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    $$('[data-continuar-borrador]', bloque).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const key = btn.dataset.continuarBorrador;
        const d = DB.getDrafts()[key];
        const idNoticia = key.split('__')[1];
        abrirFormularioNoticia(idNoticia === 'nueva' ? null : idNoticia, d);
      });
    });
    $$('[data-borrar-borrador]', bloque).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const key = btn.dataset.borrarBorrador;
        preguntarConfirmacion({
          icono:'🗑️', titulo:'¿Descartar este borrador?',
          texto:'Se va a perder todo lo que escribiste en esta noticia sin publicar.',
          textoSi:'Sí, descartar',
          onSi(){
            const drafts = DB.getDrafts();
            delete drafts[key];
            DB.setDrafts(drafts);
            renderBloqueBorradores();
            mostrarToast('Borrador descartado', '🗑️');
          }
        });
      });
    });
  }

  function renderListaNoticiasEditor(){
    const cont = $('#listaNoticiasEditor');
    const noticias = DB.getNews();
    if(noticias.length === 0){
      cont.innerHTML = '<div class="text-center text-tinta-suave py-8">📭 Todavía no hay noticias publicadas. Tocá "+ Crear noticia nueva" para empezar.</div>';
      return;
    }
    cont.innerHTML = noticias.map(n => `
      <div class="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="text-2xl">📰</div>
          <div>
            <h3 class="font-bold">${escapeHTML(n.title)}</h3>
            <p class="text-sm text-tinta-suave">${formatearFecha(n.date)} · ${escapeHTML(n.author || '')}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="boton boton--azul boton--chico" data-editar-noticia="${n.id}">✏️ Editar</button>
          <button class="boton boton--rojo boton--chico" data-eliminar-noticia="${n.id}">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');

    $$('[data-editar-noticia]', cont).forEach(btn=>{
      btn.addEventListener('click', ()=> abrirFormularioNoticia(btn.dataset.editarNoticia));
    });
    $$('[data-eliminar-noticia]', cont).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.eliminarNoticia;
        preguntarConfirmacion({
          icono:'🗑️', titulo:'¿Eliminar esta noticia?',
          texto:'Va a desaparecer del sitio para siempre.',
          textoSi:'Sí, eliminar',
          onSi(){
            DB.setNews(DB.getNews().filter(n=>n.id!==id));
            renderListaNoticiasEditor();
            mostrarToast('Noticia eliminada', '🗑️');
          }
        });
      });
    });
  }

  function abrirFormularioNoticia(idNoticia, borradorForzado){
    const s = getSession();
    draftKeyActual = draftKeyPara(s.username, idNoticia);

    const drafts = DB.getDrafts();
    const borradorExistente = borradorForzado || drafts[draftKeyActual];
    const noticiaPublicada = idNoticia ? DB.getNews().find(n=>n.id===idNoticia) : null;

    function continuarConDatos(usarBorrador){
      const datos = usarBorrador ? borradorExistente : (noticiaPublicada || { title:'', image:'', excerpt:'', body:'' });
      $('#tituloModalNoticia').textContent = idNoticia ? '✏️ Editar noticia' : '➕ Nueva noticia';
      $('#noticiaId').value = idNoticia || '';
      $('#noticiaTitulo').value = datos.title || '';
      $('#noticiaImagen').value = datos.image || '';
      $('#noticiaExtracto').value = datos.excerpt || '';
      $('#noticiaCuerpo').value = datos.body || '';
      $('#btnPublicarNoticia').innerHTML = idNoticia ? '✔️ Guardar cambios' : '✔️ Publicar noticia';
      const estado = $('#estadoGuardado');
      const texto = $('#textoEstadoGuardado');
      if(usarBorrador){
        texto.textContent = 'Restauramos el borrador que habías dejado sin publicar.';
        estado.classList.add('activo');
      } else {
        texto.textContent = 'Mientras escribís, vamos guardando para que no pierdas nada.';
        estado.classList.remove('activo');
      }
      abrirModal('modalNoticia');
    }

    if(borradorExistente && !borradorForzado){
      preguntarConfirmacion({
        icono:'📝', titulo:'Encontramos un borrador',
        texto:'Hay una versión sin publicar de esta noticia. ¿Querés seguir donde la dejaste?',
        textoSi:'Sí, continuar con el borrador',
        onSi(){ continuarConDatos(true); }
      });
      $('#btnConfirmarNo').onclick = function(){
        const modal = $('#modalConfirmar');
        modal.classList.add('hidden'); modal.classList.remove('flex');
        continuarConDatos(false);
      };
    } else {
      continuarConDatos(!!borradorForzado);
    }
  }

  let temporizadorGuardado;
  function programarGuardadoBorrador(){
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(guardarBorradorActual, 600);
  }
  function guardarBorradorActual(){
    if(!draftKeyActual) return;
    const s = getSession();
    if(!s) return;
    const titulo = $('#noticiaTitulo').value.trim();
    const extracto = $('#noticiaExtracto').value.trim();
    const cuerpo = $('#noticiaCuerpo').value.trim();
    const imagen = $('#noticiaImagen').value.trim();
    if(!titulo && !extracto && !cuerpo && !imagen) return;

    const drafts = DB.getDrafts();
    drafts[draftKeyActual] = { title: titulo, excerpt: extracto, body: cuerpo, image: imagen, updatedAt: new Date().toISOString() };
    DB.setDrafts(drafts);

    const estado = $('#estadoGuardado');
    $('#textoEstadoGuardado').textContent = 'Guardado automático a las ' + new Date().toLocaleTimeString('es-AR');
    estado.classList.add('activo');
  }


/* =========================================================
   ==================== Formularios ========================
   ========================================================= */
/* ---------------- CREACIÓN DE FORMULARIOS ---------------- */

// Inicializa el evento en el botón de agregar
document.addEventListener('DOMContentLoaded', () => {
  const btnAgregar = document.getElementById('btnAgregar');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', AgregarForm);
  }
});

// Procesa la entrada (URL o iframe completo) y la prepara para renderizarse
function extraerUrlForm(entrada) {
  let url = entrada.trim();
  
  if (entrada.includes('<iframe')) {
    const match = entrada.match(/src=["']([^"']+)["']/);
    url = match ? match[1] : '';
  }

  if (url.includes('docs.google.com/forms') && !url.includes('embedded=true')) {
    url += (url.includes('?') ? '&' : '?') + 'embedded=true';
  }

  return url || null;
}

// Captura los valores de los inputs y guarda el nuevo registro
function AgregarForm(e) {
  e.preventDefault();

  const inputTitulo = document.getElementById('tituloForm');
  const inputUrl = document.getElementById('inputGoogleForm');

  const titulo = inputTitulo ? inputTitulo.value.trim() : '';
  const rawInput = inputUrl ? inputUrl.value.trim() : '';
  const urlLimpia = rawInput ? extraerUrlForm(rawInput) : null;

  if (!titulo || !urlLimpia) {
    if (typeof mostrarToast === 'function') {
      mostrarToast('Ingresá un título y una URL o iframe válido.', '⚠️');
    } else {
      alert('Ingresá un título y una URL o iframe válido.');
    }
    return;
  }

  const nuevos = DB.getForms() || [];
  nuevos.push({
    id: typeof uid === 'function' ? uid('f') : Date.now().toString(),
    title: titulo,
    url: urlLimpia
  });

  DB.setForms(nuevos);

  if (inputTitulo) inputTitulo.value = '';
  if (inputUrl) inputUrl.value = '';

  // Opcional: si existe la función de render en el otro apartado, actualiza la vista
  if (typeof renderFormularios === 'function') {
    renderFormularios();
  }

  if (typeof mostrarToast === 'function') {
    mostrarToast('¡Tarjeta de formulario agregada!', '✨');
  }
}