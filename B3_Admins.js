 
 
 
 
 
 
 
 
 
 
 /* =========================================================
     BLOQUE 2 — PANEL DE ADMINISTRADOR/A
     Alta y baja de cuentas de editores/as.
  ========================================================== */

  function irAPanelAdmin(){
    $('#nombreAdmin').textContent = getSession().name;
    renderListaEditores();
    mostrarVista('admin');
  }

  function renderListaEditores(){
    const cont = $('#listaEditores');
    const editores = DB.getUsers().filter(u => u.role === 'editor');
    if(editores.length === 0){
      cont.innerHTML = '<div class="solo-lectura-vacio">🙂 Todavía no creaste cuentas de editores/as. Tocá el botón de arriba para crear la primera.</div>';
      return;
    }
    cont.innerHTML = editores.map(u => `
      <div class="fila">
        <div class="fila__info">
          <div class="fila__icono">✍️</div>
          <div class="fila__texto">
            <h3>${escapeHTML(u.name)}</h3>
            <p>Usuario para entrar: <strong>${escapeHTML(u.username)}</strong></p>
          </div>
        </div>
        <div class="fila__acciones">
          <button class="boton boton--rojo boton--chico" data-eliminar-editor="${u.id}">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');

    $$('[data-eliminar-editor]', cont).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.eliminarEditor;
        const u = DB.getUsers().find(x=>x.id===id);
        preguntarConfirmacion({
          icono:'🗑️',
          titulo:'¿Eliminar esta cuenta?',
          texto:`"${u.name}" ya no va a poder entrar al panel con su usuario y contraseña.`,
          textoSi:'Sí, eliminar',
          onSi(){
            DB.setUsers(DB.getUsers().filter(x=>x.id!==id));
            renderListaEditores();
            mostrarToast('Cuenta eliminada', '🗑️');
          }
        });
      });
    });
  }

  $('#btnNuevoEditor').addEventListener('click', ()=> abrirModal('modalEditor'));

  $('#formNuevoEditor').addEventListener('submit', (e)=>{
    e.preventDefault();
    const nombre = $('#editorNombre').value.trim();
    const usuario = $('#editorUsuario').value.trim();
    const pass = $('#editorPassword').value.trim();
    if(DB.getUsers().some(u=>u.username===usuario)){
      mostrarAviso('Ese usuario ya existe. Probá con otro nombre de usuario.');
      return;
    }
    const nuevos = DB.getUsers();
    nuevos.push({ id: uid('u'), username: usuario, password: pass, role:'editor', name: nombre });
    DB.setUsers(nuevos);
    $('#formNuevoEditor').reset();
    cerrarModal('modalEditor');
    renderListaEditores();
    mostrarToast('Cuenta creada correctamente', '✔️');
  });

  $('#btnLogoutAdmin').addEventListener('click', cerrarSesion);
