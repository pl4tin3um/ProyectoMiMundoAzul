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
 
  async function cerrarSesion() {
  try {
    const { error } = await supabaseClient.auth.signOut({
      scope: 'local'
    });
 
    if (error) throw error;
 
    clearSession();
    window.location.replace('../index.html');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    mostrarToast(
      'No pudimos cerrar la sesión. Intentá nuevamente.',
      '⚠️'
    );
  }
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
  async function verificarAccesoEditor() {
  try {
    const sesion = await obtenerCuentaActual();
 
    if (!sesion || sesion.role !== 'editor') {
      window.location.replace('../index.html');
      return;
    }
 
    setSession(sesion);
 
    iniciarPanelEditor();
    renderFormularios();
 
    document.body.hidden = false;
  } catch (error) {
    console.error('Error al verificar acceso de editor:', error);
 
    const aviso = document.createElement('p');
    aviso.textContent =
      'No pudimos cargar el panel. Recargá para intentar nuevamente.';
 
    document.body.replaceChildren(aviso);
    document.body.hidden = false;
  }
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
  let noticiasCache = [];            // última lista traída de Supabase
  const videosYaSubidos = new Map(); // evita resubir a YouTube si hay que reintentar
 
  function iniciarPanelEditor(){
    renderPanelEditor();
 
    $('#btnNuevaNoticia')?.addEventListener('click', ()=> abrirFormularioNoticia(null));
    $('#btnLogoutEditor')?.addEventListener('click', cerrarSesion);
 
    // Protección con comprobación de existencia para evitar errores si algún elemento no está
    ['noticiaTitulo','imagenPortada','noticiaMedia','noticiaYoutube','noticiaExtracto','noticiaCuerpo'].forEach(id=>{
      const el = $('#'+id);
      if(el){
        el.addEventListener('input', programarGuardadoBorrador);
      }
    });
 
    $('#btnDescartarBorrador')?.addEventListener('click', ()=>{
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
 
    $('#noticiaMedia')?.addEventListener('change', renderArchivosElegidos);
    $('#imagenPortada')?.addEventListener('change', ()=>{
      const archivo = $('#imagenPortada').files[0];
      const prev = $('#previewImagenPortada');
      if (archivo && prev) { prev.src = URL.createObjectURL(archivo); prev.classList.remove('hidden'); }
    });
    $('#formNoticia')?.addEventListener('submit', publicarNoticia);
  }
 
  /* =========================================================
     SUBIDA DE MEDIA
     - Videos: el navegador los sube DIRECTO a YouTube (la función
       'youtube-subida' solo prepara la subida). Se guarda el id del video.
     - Fotos: viajan a la función 'crear-noticia', que las sube a ImageKit.
     Así ningún video pasa por Supabase ni gasta su almacenamiento.
  ========================================================== */
  const MAX_FOTO_MB  = 10;
  const MAX_VIDEO_MB = 2048;
 
  function mostrarProgreso(texto, porcentaje){
    $('#bloqueProgreso').classList.remove('hidden');
    $('#textoProgreso').textContent = texto;
    $('#barraProgreso').style.width = Math.max(0, Math.min(100, porcentaje)) + '%';
  }
  function ocultarProgreso(){ $('#bloqueProgreso')?.classList.add('hidden'); }
 
  function renderArchivosElegidos(){
    const lista = $('#listaArchivosElegidos');
    if (!lista) return;
    const archivos = Array.from($('#noticiaMedia')?.files || []);
    lista.innerHTML = archivos.map(f =>
      `<li>${f.type.startsWith('video/') ? '🎬' : '🖼️'} ${escapeHTML(f.name)} <span class="text-tinta-clara">(${(f.size / 1048576).toFixed(1)} MB)</span></li>`
    ).join('');
  }
 
  // functions.invoke esconde el mensaje real del servidor dentro de error.context
  async function mensajeDeErrorFuncion(error){
    if (error?.context instanceof Response) {
      try {
        const r = await error.context.clone().json();
        if (typeof r.error === 'string') return r.error;
      } catch { /* seguimos con el mensaje general */ }
    }
    return error?.message || 'Error desconocido';
  }
 
  // Achica las fotos JPG grandes del celular (ahorra espacio y tiempo de subida)
  async function optimizarImagen(archivo, ladoMax = 2000){
    if (archivo.type !== 'image/jpeg' || archivo.size < 1.5 * 1048576) return archivo;
    try {
      const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
      const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * escala);
      canvas.height = Math.round(bmp.height * escala);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
      if (!blob || blob.size >= archivo.size) return archivo;
      return new File([blob], archivo.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch { return archivo; }
  }
 
  function subirArchivoConProgreso(url, archivo, onProgreso){
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', archivo.type || 'application/octet-stream');
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgreso(e.loaded / e.total); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error('YouTube respondió algo inesperado.')); }
        } else {
          reject(new Error(`YouTube rechazó la subida del video (código ${xhr.status}).`));
        }
      };
      xhr.onerror = () => reject(new Error('Se cortó la conexión mientras se subía el video. Probá de nuevo.'));
      xhr.send(archivo);
    });
  }
 
  async function subirVideoAYoutube(archivo, titulo, onProgreso){
    const clave = `${archivo.name}|${archivo.size}|${archivo.lastModified}`;
    if (videosYaSubidos.has(clave)) return videosYaSubidos.get(clave);
 
    const { data, error } = await supabaseClient.functions.invoke('youtube-subida', {
      body: { titulo, tamano: archivo.size, tipo: archivo.type || 'video/mp4' }
    });
    if (error) throw new Error(await mensajeDeErrorFuncion(error));
    if (!data?.uploadUrl) throw new Error('No se pudo preparar la subida a YouTube.');
 
    const video = await subirArchivoConProgreso(data.uploadUrl, archivo, onProgreso);
    if (!video?.id) throw new Error('YouTube no devolvió el identificador del video.');
 
    const item = { type: 'youtube', videoId: video.id, url: `https://www.youtube.com/watch?v=${video.id}` };
    videosYaSubidos.set(clave, item);
    return item;
  }
 
  async function eliminarNoticia(id){
    const { data, error } = await supabaseClient.functions.invoke('crear-noticia', {
      body: { accion: 'eliminar', id }
    });
    if (error) throw new Error(await mensajeDeErrorFuncion(error));
    if (!data?.ok) throw new Error('El servidor no confirmó que se eliminara la noticia.');
  }
 
  let publicando = false;
  async function publicarNoticia(e){
    e.preventDefault();
    if (publicando) return;
    publicando = true;
 
    const btn = $('#btnPublicarNoticia');
    const textoBtn = btn.innerHTML;
    btn.disabled = true;
 
    try {
      const titulo    = $('#noticiaTitulo').value.trim();
      const idNoticia = $('#noticiaId').value;
      const portada   = $('#imagenPortada').files[0];
      const elegidos  = Array.from($('#noticiaMedia').files || []);
      const fotosSrc  = elegidos.filter(f => f.type.startsWith('image/'));
      const videos    = elegidos.filter(f => f.type.startsWith('video/'));
      const otros     = elegidos.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'));
 
      if (!idNoticia && !portada) throw new Error('Elegí una imagen de portada para la noticia.');
      if (otros.length) throw new Error(`"${otros[0].name}" no es una foto ni un video.`);
      const muyGrande = videos.find(v => v.size > MAX_VIDEO_MB * 1048576);
      if (muyGrande) throw new Error(`El video "${muyGrande.name}" pesa más de ${MAX_VIDEO_MB / 1024} GB.`);
 
      // 1) Videos -> YouTube (de a uno, mostrando el avance)
      const videosSubidos = [];
      for (let i = 0; i < videos.length; i++) {
        const etiqueta = `Subiendo video ${i + 1} de ${videos.length}`;
        mostrarProgreso(`${etiqueta}…`, 0);
        videosSubidos.push(await subirVideoAYoutube(videos[i], titulo, p =>
          mostrarProgreso(`${etiqueta}… ${Math.round(p * 100)}%`, p * 100)));
      }
 
      // 2) Texto + portada + fotos -> crear-noticia (ImageKit + base de datos)
      mostrarProgreso('Guardando la noticia y subiendo las fotos…', 100);
      const formData = new FormData();
      if (idNoticia) formData.append('noticiaId', idNoticia);
      formData.append('title', titulo);
      formData.append('excerpt', $('#noticiaExtracto').value.trim());
      formData.append('body', $('#noticiaCuerpo').value.trim());
      if (portada) {
        const p = await optimizarImagen(portada);
        formData.append('imagenPortada', p, p.name);
      }
      for (const f of fotosSrc) {
        const o = await optimizarImagen(f);
        formData.append('fotos', o, o.name);
      }
      formData.append('videos', JSON.stringify(videosSubidos));
 
      const { data, error } = await supabaseClient.functions.invoke('crear-noticia', { body: formData });
      if (error) throw new Error(await mensajeDeErrorFuncion(error));
      if (!data?.ok) throw new Error('El servidor no confirmó la publicación.');
 
      videosYaSubidos.clear();
      mostrarToast(idNoticia ? '¡Cambios guardados!' : '¡Noticia publicada con éxito!', '✨');
 
      const drafts = DB.getDrafts();
      if (draftKeyActual) delete drafts[draftKeyActual];
      DB.setDrafts(drafts);
 
      cerrarModal('modalNoticia');
      await renderPanelEditor();
    } catch (err) {
      console.error(err);
      mostrarAviso(err.message || 'No se pudo publicar la noticia. Probá de nuevo.');
    } finally {
      publicando = false;
      btn.disabled = false;
      btn.innerHTML = textoBtn;
      ocultarProgreso();
    }
  }
 
  async function renderPanelEditor(){
    renderBloqueBorradores();
    await renderListaNoticiasEditor();
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
 
async function renderListaNoticiasEditor(){
    const cont = $('#listaNoticiasEditor');
    let noticias = [];
    try {
      noticias = await DB.getNews();
    } catch (err) {
      console.error(err);
      cont.innerHTML = '<div class="text-center text-tinta-suave py-8">⚠️ No pudimos cargar las noticias. Recargá la página.</div>';
      return;
    }
    noticiasCache = noticias;
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
            <p class="text-sm text-tinta-suave">${formatearFecha(n.date)}</p>
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
          async onSi(){
            try {
              await eliminarNoticia(id);
              mostrarToast('Noticia eliminada', '🗑️');
              await renderListaNoticiasEditor();
            } catch (err) {
              console.error(err);
              mostrarAviso(err.message || 'No se pudo eliminar la noticia.');
            }
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
    const noticiaPublicada = idNoticia ? noticiasCache.find(n => String(n.id) === String(idNoticia)) : null;
 
function continuarConDatos(usarBorrador){
    const datos = usarBorrador ? borradorExistente : (noticiaPublicada || { title:'', image:'', excerpt:'', body:'' });
    
    $('#tituloModalNoticia').textContent = idNoticia ? '✏️ Editar noticia' : '➕ Nueva noticia';
    $('#noticiaId').value = idNoticia || '';
    $('#noticiaTitulo').value = datos.title || '';
    // las URLs blob: de borradores viejos ya no existen, se ignoran
    const imagenActual = [datos.imagen_portada, datos.imagenPortada, datos.image].find(u => u && !u.startsWith('blob:')) || '';
    const previewImg = $('#previewImagenPortada');
    if (previewImg) {
      previewImg.src = imagenActual;
      previewImg.classList.toggle('hidden', !imagenActual);
    }
    $('#imagenPortada').value = '';
    $('#noticiaMedia').value = '';
    renderArchivosElegidos();
    ocultarProgreso();
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
 
    const archivoInput = $('#imagenPortada').files[0];
    if(!titulo && !extracto && !cuerpo && !archivoInput && !draftKeyActual) return;
 
    const draftsActuales = DB.getDrafts();
    const borradorViejo = draftsActuales[draftKeyActual] || {};
    const imagenFinal = archivoInput ? URL.createObjectURL(archivoInput) : (borradorViejo.image || 'https://i.ibb.co/6X0Z3kM/portada-noticia-default.png');
 
    draftsActuales[draftKeyActual] = { title: titulo, excerpt: extracto, body: cuerpo, image: imagenFinal, updatedAt: new Date().toISOString() };
    DB.setDrafts(draftsActuales);
 
    const estado = $('#estadoGuardado');
    $('#textoEstadoGuardado').textContent = 'Guardado automático a las ' + new Date().toLocaleTimeString('es-AR');
    estado.classList.add('activo');
  }
document.addEventListener('DOMContentLoaded', verificarAccesoEditor);
 
/* =========================================================
   ==================== Formularios ========================
   ========================================================= */
/* ---------------- CREACIÓN DE FORMULARIOS ---------------- */
 
// Inicializa el evento en el botón de agregar
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formNuevoGoogle');
 
    if (form) {
        form.addEventListener('submit', AgregarForm);
    }
});
 
async function renderFormularios() {
  const container = document.getElementById('gridFormularios');
  if (!container) return;
 
  const { data: formularios, error } = await supabaseClient
    .from('formularios')
    .select('id, created_at, title, google_URL, editor_ID, enable')
    .eq('enable', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
 
  if (!formularios || formularios.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center text-tinta-suave py-8 bg-white/50 rounded-3xl border border-dashed border-azul-fuerte">
        <p><i class="bi bi-inbox-fill me-2" aria-hidden="true"></i>No hay formularios disponibles en este momento.</p>
      </div>`;
    return;
  }
 
  container.innerHTML = formularios.map((form) => `
    <article class="bg-white rounded-3xl p-6 shadow-md border border-cielo-medio flex flex-col justify-between hover:-translate-y-1 transition duration-200">
      <div>
        <div class="text-3xl text-azul-fuerte mb-3">
          <i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i>
        </div>
        <h3 class="font-baloo font-bold text-xl text-azul-oscuro break-words [overflow-wrap:anywhere]">${escapeHTML(form.title)}</h3>
      </div>
      <div class="mt-6 flex gap-2">
        <button class="boton boton--rojo py-2.5 px-3 text-sm" data-eliminar-form="${form.id}" aria-label="Eliminar formulario">
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </article>
  `).join('');
 
  container.querySelectorAll('[data-eliminar-form]').forEach(btn => {
    btn.addEventListener('click', () => {
      const eliminar = () => {
        supabaseClient
          .from('formularios')
          .delete()
          .eq('id', btn.dataset.eliminarForm)
          .then(({ error }) => {
            if (error) {
              console.error('Error al eliminar formulario:', error);
              mostrarToast('No se pudo eliminar el formulario.', '⚠️');
              return;
            }
            renderFormularios();
          });
      };
 
      if (typeof preguntarConfirmacion === 'function') {
        preguntarConfirmacion({
          icono: '🗑️',
          titulo: 'Eliminar formulario',
          texto: '¿Querés eliminar este formulario?',
          textoSi: 'Sí, eliminar',
          onSi: eliminar
        });
      } else if (window.confirm('¿Querés eliminar este formulario?')) {
        eliminar();
      }
    });
  });
}
 
function extraerUrlForm(entrada) {
  let valor = typeof entrada === 'string' ? entrada.trim() : '';

  if (/<iframe\b/i.test(valor)) {
    const match = valor.match(/<iframe\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/i);
    valor = match ? match[2].trim() : '';
  }
 
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
 
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return null;
  if (url.hostname === 'forms.gle' && /^\/[\w-]+\/?$/.test(url.pathname)) return url.href;
  if (url.hostname !== 'docs.google.com') return null;
 
  const rutaValida = /^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[\w-]+\/viewform\/?$/;
  if (!rutaValida.test(url.pathname)) return null;
 
  url.searchParams.set('embedded', 'true');
  return url.href;
}
 
async function AgregarForm(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const botonEnviar = form?.querySelector('[type="submit"]');
  if (botonEnviar?.disabled) return;
 
  const inputTitulo = document.getElementById('tituloForm');
  const inputUrl = document.getElementById('inputGoogleForm');
 
  const titulo = inputTitulo ? inputTitulo.value.trim() : '';
  const rawInput = inputUrl ? inputUrl.value.trim() : '';
  const urlLimpia = rawInput ? extraerUrlForm(rawInput) : null;
 
  if (rawInput && !urlLimpia) {
    mostrarToast('El enlace no parece una ruta válida de Google Forms. Revisá la URL o el iframe.', '⚠️');
    inputUrl?.focus();
    return;
  }
 
  if (!titulo || !urlLimpia) {
    const mensaje = !titulo
      ? 'Ingresá un título para identificar el formulario.'
      : 'El enlace no parece una ruta válida de Google Forms. Revisá la URL o el iframe.';
    if (typeof mostrarToast === 'function') {
      mostrarToast(mensaje, '⚠️');
    } else {
      alert(mensaje);
    }
    (!titulo ? inputTitulo : inputUrl)?.focus();
    return;
  }
 
  if (botonEnviar) botonEnviar.disabled = true;
  form?.setAttribute('aria-busy', 'true');
  try {
    const { error } = await supabaseClient
      .from('formularios')
      .insert([{
        title: titulo,
        google_URL: urlLimpia,
        editor_ID: getSession()?.id,
        enable: true
      }]);
    if (error) throw error;
    if (inputTitulo) inputTitulo.value = '';
    if (inputUrl) inputUrl.value = '';
    await renderFormularios();
    mostrarToast('¡Tarjeta de formulario agregada!', '✨');
  } catch (error) {
    console.error('Error al guardar formulario:', error);
    mostrarToast('No se pudo guardar el formulario.', '⚠️');
  } finally {
    if (botonEnviar) botonEnviar.disabled = false;
    form?.removeAttribute('aria-busy');
  }
}