
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



 


          


          


          



          


          


          

  
