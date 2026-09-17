/* =========================================================
     BLOQUE 3 — PANEL DE EDITOR/A
     Borradores con autoguardado, y alta/edición/eliminación
     de noticias publicadas.
  ========================================================== */

  let draftKeyActual = null;

 

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
      <div class="banner-info">
        <span class="banner-info__icono">💾</span>
        <div><strong>Tenés noticias sin terminar de publicar</strong>Las vamos guardando solas mientras escribís, para que no se pierdan.</div>
      </div>
      <div class="lista" style="margin-bottom:36px;">
        ${propios.map(([key, d]) => `
          <div class="fila fila--borrador">
            <div class="fila__info">
              <div class="fila__icono">📝</div>
              <div class="fila__texto">
                <h3>${escapeHTML(d.title || 'Todavía sin título')}<span class="pill-borrador">Sin publicar</span></h3>
                <p>Guardado el ${new Date(d.updatedAt).toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div class="fila__acciones">
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
      cont.innerHTML = '<div class="solo-lectura-vacio">📭 Todavía no hay noticias publicadas. Tocá "+ Crear noticia nueva" para empezar.</div>';
      return;
    }
    cont.innerHTML = noticias.map(n => `
      <div class="fila">
        <div class="fila__info">
          <div class="fila__icono">📰</div>
          <div class="fila__texto">
            <h3>${escapeHTML(n.title)}</h3>
            <p>${formatearFecha(n.date)} · ${escapeHTML(n.author || '')}</p>
          </div>
        </div>
        <div class="fila__acciones">
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
            renderGridPublico();
            mostrarToast('Noticia eliminada', '🗑️');
          }
        });
      });
    });
  }

  $('#btnNuevaNoticia').addEventListener('click', ()=> abrirFormularioNoticia(null));

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
        icono:'📝',
        titulo:'Encontramos un borrador',
        texto:'Hay una versión sin publicar de esta noticia. ¿Querés seguir donde la dejaste?',
        textoSi:'Sí, continuar con el borrador',
        onSi(){ continuarConDatos(true); }
      });
      $('#btnConfirmarNo').onclick = function(){
        $('#modalConfirmar').classList.remove('activo');
        continuarConDatos(false);
      };
    } else {
      continuarConDatos(!!borradorForzado);
    }
  }

  /* --- Autoguardado de borrador con debounce --- */
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

  const formNoticia = $('#formNoticia');
  if(formNoticia){
    formNoticia.addEventListener('submit', (e)=>{
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
      renderGridPublico();
      mostrarToast(existente ? 'Noticia actualizada' : 'Noticia publicada', '✔️');
    });
  }

  $('#btnLogoutEditor').addEventListener('click', cerrarSesion);