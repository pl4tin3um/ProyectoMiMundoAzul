
(function(){
  "use strict";

  /* =========================================================
     BLOQUE 1 — SITIO PRINCIPAL / PÚBLICO
     Grilla de noticias públicas, lectura de noticia completa
     en pestaña aparte, y pantalla de login (acceso a admin/editor).
  ========================================================== */

  /* ---------------- NAVEGACIÓN SUAVE ---------------- */
  $$('.nav-scroll').forEach(a => a.addEventListener('click', (e)=>{
    e.preventDefault();
    const destino = document.querySelector(a.getAttribute('href'));
    if(destino) destino.scrollIntoView({behavior:'smooth'});
  }));
  $('#anioFooter').textContent = new Date().getFullYear();


  /* ---------------- INICIO ---------------- */
  sembrarDatos();
  renderGridPublico();

  /* ---------------- RENDER: NOTICIAS PÚBLICAS ---------------- */
  function renderGridPublico(){
    const grid = $('#gridNoticias');
    const noticias = DB.getNews();
    if(noticias.length === 0){
      grid.innerHTML = '';
      $('#piePublicoVacio').innerHTML = '<div class="solo-lectura-vacio">📭 Todavía no hay noticias publicadas. ¡Volvé pronto!</div>';
      return;
    }
    $('#piePublicoVacio').innerHTML = '';
    grid.innerHTML = noticias.map(n => `
      <article class="tarjeta-noticia">
        <div class="tarjeta-noticia__imagen" style="background-image:url('${n.image || placeholderImg(n.id)}')">
          <span class="tarjeta-noticia__fecha">${formatearFecha(n.date)}</span>
        </div>
        <div class="tarjeta-noticia__cuerpo">
          <h3 class="tarjeta-noticia__titulo">${escapeHTML(n.title)}</h3>
          <p class="tarjeta-noticia__extracto">${escapeHTML(n.excerpt)}</p>
          <button class="boton boton--azul boton--chico tarjeta-noticia__boton" data-abrir-noticia="${n.id}">
            <span class="boton__icono">📖</span> Leer noticia completa
          </button>
        </div>
      </article>
    `).join('');

    $$('[data-abrir-noticia]', grid).forEach(btn=>{
      btn.addEventListener('click', ()=> abrirNoticiaCompleta(btn.dataset.abrirNoticia));
    });
  }

  /* ---------------- ABRIR NOTICIA EN PESTAÑA COMPLETA ---------------- */
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
  header .marca .icono{ width:44px; height:44px; border-radius:50%; background:radial-gradient(circle at 35% 35%, var(--sol), var(--azul-oscuro) 70%); box-shadow: inset 0 0 0 3px rgba(255,255,255,.5);}
  header button{ background:#fff; color:var(--azul-fuerte); border:none; padding:14px 26px; border-radius:999px; font-family:'Baloo 2',sans-serif; font-weight:700; font-size:1rem; cursor:pointer; min-height:52px;}
  main{ max-width:740px; margin:0 auto; padding:50px 6vw 60px; }
  .portada{ width:100%; border-radius:32px; aspect-ratio:16/10; object-fit:cover; margin-bottom:30px; box-shadow:0 18px 40px -18px rgba(18,58,86,.35);}
  .meta{ font-size:.9rem; color:var(--tinta-suave); text-transform:uppercase; letter-spacing:.05em; font-weight:800; margin-bottom:14px;}
  h1{ font-family:'Baloo 2',sans-serif; font-size:clamp(1.6rem,4vw,2.5rem); color:var(--azul-oscuro); line-height:1.3; margin:0 0 26px;}
  article p{ margin-bottom:20px; font-size:1.1rem;}
  footer{ text-align:center; padding:20px 6vw 70px; }
  footer button{ background:var(--sol); color:var(--tinta); border:none; padding:16px 32px; border-radius:999px; font-weight:700; font-size:1.05rem; cursor:pointer; font-family:'Baloo 2',sans-serif; min-height:56px; }
</style>
</head>
<body>
  <header>
    <div class="marca"><div class="icono"></div>Mi Mundo Azul</div>
    <button onclick="window.close()">← Volver</button>
  </header>
  <main>
    <img class="portada" src="${noticia.image || placeholderImg(noticia.id)}" alt="">
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

  /* ---------------- LOGIN (acceso a admin/editor) ---------------- */
  $('#btnIrLogin').addEventListener('click', ()=> mostrarVista('login'));
  $('#volverSitioLogin').addEventListener('click', ()=> mostrarVista('publico'));

  $('#btnMostrarPass').addEventListener('click', ()=>{
    const campo = $('#loginPassword');
    const btn = $('#btnMostrarPass');
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    btn.textContent = mostrar ? '🙈' : '👁️';
  });

  $('#formLogin').addEventListener('submit', (e)=>{
    e.preventDefault();
    const usuario = $('#loginUsuario').value.trim();
    const pass = $('#loginPassword').value;
    const encontrado = DB.getUsers().find(u => u.username === usuario && u.password === pass);
    if(!encontrado){
      $('#errorLogin').innerHTML = '<div class="mensaje-error"><span>⚠️</span><span>Ese usuario o esa contraseña no son correctos. Fijate bien e intentá de nuevo.</span></div>';
      return;
    }
    $('#errorLogin').innerHTML = '';
    setSession({ id:encontrado.id, username:encontrado.username, role:encontrado.role, name:encontrado.name });
    $('#formLogin').reset();
    if(encontrado.role === 'admin') irAPanelAdmin(); else irAPanelEditor();
  });


          


          


          



          


          


          

  /* =========================================================
     BLOQUE 3 — PANEL DE EDITOR/A
     Borradores con autoguardado, y alta/edición/eliminación
     de noticias publicadas.
  ========================================================== */

  let draftKeyActual = null;

  function irAPanelEditor(){
    $('#nombreEditor').textContent = getSession().name;
    renderPanelEditor();
    mostrarVista('editor');
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


          


          


          

 
})();
