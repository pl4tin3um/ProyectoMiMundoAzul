function preguntarConfirmacion(opciones){
  const elIcono = $('#iconoConfirmar');
  const elTitulo = $('#tituloConfirmar');
  const elTexto = $('#textoConfirmar');
  const elBtnSi = $('#btnConfirmarSi');
  const elBtnNo = $('#btnConfirmarNo');
  const modal = $('#modalConfirmar');

  if(elIcono) elIcono.textContent = opciones.icono || '❓';
  if(elTitulo) elTitulo.textContent = opciones.titulo || '¿Estás seguro/a?';
  if(elTexto) elTexto.textContent = opciones.texto || '';
  if(elBtnSi) elBtnSi.textContent = opciones.textoSi || 'Sí, continuar';
  
  if(modal){
    modal.classList.remove('hidden'); 
    modal.classList.add('flex');
  }

  function limpiar(){
    if(modal){ modal.classList.add('hidden'); modal.classList.remove('flex'); }
    if(elBtnSi) elBtnSi.removeEventListener('click', alConfirmar);
    if(elBtnNo) elBtnNo.removeEventListener('click', alCancelar);
  }
  function alConfirmar(){ limpiar(); if(opciones.onSi) opciones.onSi(); }
  function alCancelar(){ limpiar(); }

  if(elBtnSi) elBtnSi.addEventListener('click', alConfirmar);
  if(elBtnNo) elBtnNo.addEventListener('click', alCancelar);
}

function mostrarAviso(texto){
  const elTexto = $('#textoAviso');
  const modal = $('#modalAviso');
  if(elTexto) elTexto.textContent = texto;
  if(modal){ modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

const btnCerrarAviso = $('#btnCerrarAviso');
if(btnCerrarAviso){
  btnCerrarAviso.addEventListener('click', ()=>{
    const modal = $('#modalAviso');
    if(modal){ modal.classList.add('hidden'); modal.classList.remove('flex'); }
  });
}

function abrirModal(id){ 
  const m = $('#'+id); 
  if(m){ m.classList.remove('hidden'); m.classList.add('flex'); }
}

function cerrarModal(id){ 
  const m = $('#'+id); 
  if(m){ m.classList.add('hidden'); m.classList.remove('flex'); }
}

$$('[data-cerrar-modal]').forEach(btn=> btn.addEventListener('click', ()=> cerrarModal(btn.dataset.cerrarModal)));$$
('.fixed.inset-0.bg-black\\/50').forEach(fondo=> fondo.addEventListener('click', (e)=>{ if(e.target === fondo){ fondo.classList.add('hidden'); fondo.classList.remove('flex'); } }));

function cerrarSesion(){
  clearSession();
  window.location.href = '../index.html';
}

/* =========================================================
   PROTECCIÓN DE ACCESO
========================================================== */
sembrarDatos();
const sesion = getSession();
if(!sesion || sesion.role !== 'admin'){
  window.location.href = '../index.html';
} else {
  const elNombreAdmin = $('#nombreAdmin');
  if(elNombreAdmin){
    elNombreAdmin.textContent = sesion.name;
  }
  mostrarToast('Bienvenido/a al panel de administración', '🛠️');
  iniciarPanelAdmin();
}

/* =========================================================
   PANEL DE ADMINISTRACIÓN
========================================================== */
function iniciarPanelAdmin(){
  renderListaEditores();

  const btnNuevo = $('#btnNuevoEditor');
  if(btnNuevo){
    btnNuevo.addEventListener('click', ()=>{
      const form = $('#formNuevoEditor');
      if(form) form.reset();
      abrirModal('modalEditor');
    });
  }

  const btnLogout = $('#btnLogoutAdmin');
  if(btnLogout) btnLogout.addEventListener('click', cerrarSesion);

  const formNuevo = $('#formNuevoEditor');
  if(formNuevo){
    formNuevo.addEventListener('submit', (e)=>{
      e.preventDefault();
      const nombre = $('#editorNombre')?.value.trim() || '';
      const usuario = $('#editorUsuario')?.value.trim() || '';
      const password = $('#editorPassword')?.value || '';

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
}

function renderListaEditores(){
  const cont = $('#listaEditores');
  if(!cont) return;

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