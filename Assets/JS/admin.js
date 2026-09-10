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
    window.location.href = '../../index.html';
  }

  /* =========================================================
     PROTECCIÓN DE ACCESO (igual criterio que en editor.js, pero
     exigiendo role === 'admin').
  ========================================================== */
  sembrarDatos();
  const sesion = getSession();
  if(!sesion || sesion.role !== 'admin'){
    window.location.href = '../../index.html';
  } else {
    $('#nombreAdmin').textContent = sesion.name;
    mostrarToast('Bienvenido/a al panel de administración', '🛠️');
    iniciarPanelAdmin();
  }

  /* =========================================================
     PANEL DE ADMINISTRACIÓN
     ⚠️ A DIFERENCIA DEL RESTO DEL ARCHIVO, esta parte NO estaba en el
     texto que me pasaste (solo venía el HTML del panel de admin, sin
     su lógica en JS — el "Bloque 2" de script nunca aparecía). La
     reconstruí siguiendo exactamente el mismo patrón que ya usaba el
     panel de editor/a (Bloque 3), para que el proyecto quede completo
     y funcional. Revisala con más atención que al resto.
  ========================================================== */
  function iniciarPanelAdmin(){
    renderListaEditores();

    $('#btnNuevoEditor').addEventListener('click', ()=>{
      $('#formNuevoEditor').reset();
      abrirModal('modalEditor');
    });

    $('#btnLogoutAdmin').addEventListener('click', cerrarSesion);

    $('#formNuevoEditor').addEventListener('submit', (e)=>{
      e.preventDefault();
      const nombre = $('#editorNombre').value.trim();
      const usuario = $('#editorUsuario').value.trim();
      const password = $('#editorPassword').value;

      const usuarios = DB.getUsers();
      const yaExiste = usuarios.some(u => u.username.toLowerCase() === usuario.toLowerCase());
      if(yaExiste){
        mostrarAviso('Ese nombre de usuario ya existe. Elegí otro para crear la cuenta.');
        return;
      }

      usuarios.push({ id: uid('u'), username: usuario, password, role:'editor', name: nombre });
      DB.setUsers(usuarios);
      cerrarModal('modalEditor');
      renderListaEditores();
      mostrarToast('Cuenta de editor/a creada', '✔️');
    });
  }

  function renderListaEditores(){
    const cont = $('#listaEditores');
    const editores = DB.getUsers().filter(u => u.role === 'editor');
    if(editores.length === 0){
      cont.innerHTML = '<div class="text-center text-tinta-suave py-8">📭 Todavía no creaste ninguna cuenta de editor/a.</div>';
      return;
    }
    cont.innerHTML = editores.map(u => `
      <div class="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="text-2xl">✍️</div>
          <div>
            <h3 class="font-bold">${escapeHTML(u.name)}</h3>
            <p class="text-sm text-tinta-suave">Usuario: ${escapeHTML(u.username)}</p>
          </div>
        </div>
        <button class="boton boton--rojo boton--chico" data-eliminar-editor="${u.id}">🗑️ Eliminar cuenta</button>
      </div>
    `).join('');

    $$('[data-eliminar-editor]', cont).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.eliminarEditor;
        const usuario = DB.getUsers().find(u=>u.id===id);
        preguntarConfirmacion({
          icono:'🗑️', titulo:'¿Eliminar esta cuenta?',
          texto:`${usuario ? usuario.name : 'Esta persona'} ya no va a poder entrar al panel de noticias. Las noticias que ya publicó quedan en el sitio.`,
          textoSi:'Sí, eliminar',
          onSi(){
            DB.setUsers(DB.getUsers().filter(u=>u.id!==id));
            // Además limpiamos los borradores sin publicar de esa cuenta.
            if(usuario){
              const drafts = DB.getDrafts();
              Object.keys(drafts).forEach(key=>{ if(key.startsWith(usuario.username + '__')) delete drafts[key]; });
              DB.setDrafts(drafts);
            }
            renderListaEditores();
            mostrarToast('Cuenta eliminada', '🗑️');
          }
        });
      });
    });
  }

  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
