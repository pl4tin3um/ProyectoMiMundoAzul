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
  } catch {
    mostrarToast(
      'No pudimos cerrar la sesión. Intentá nuevamente.',
      '⚠️'
    );
  }
}



/* =========================================================
   PROTECCIÓN DE ACCESO
   (ya no existe sembrarDatos(): los datos viven en Supabase)
========================================================== */
async function verificarAccesoAdmin() {
  try {
    const sesion = await obtenerCuentaActual();

    if (!sesion || sesion.role !== 'admin') {
      window.location.replace('../index.html');
      return;
    }

    const elNombreAdmin = $('#nombreAdmin');

    if (elNombreAdmin) {
      elNombreAdmin.textContent = sesion.name;
    }

    mostrarToast(
      'Bienvenido/a al panel de administración',
      '🛠️'
    );

    document.body.hidden = false;

    iniciarPanelAdmin();
  } catch (error){
    console.error('Error al verificar acceso:', error);
    const aviso = document.createElement('p');
  aviso.textContent =
    'No pudimos verificar tu acceso. Recargá para intentar nuevamente.';

  document.body.replaceChildren(aviso);
  document.body.hidden = false;
  }
}

verificarAccesoAdmin();




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
    formNuevo.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const nombre = $('#editorNombre')?.value.trim() || '';
      const usuario = $('#editorUsuario')?.value.trim() || '';
      const email = $('#editorEmail')?.value.trim() || '';   // opcional: agregá este input si tu tabla lo pide
      const password = $('#editorPassword')?.value || '';

      try {
        if(await DB.existeUsername(usuario)){
          mostrarAviso('Ese nombre de usuario ya existe. Elegí otro para crear la cuenta.');
          return;
        }

        await DB.crearEditor({ name: nombre, username: usuario, email, password });
        cerrarModal('modalEditor');
        await renderListaEditores();
        mostrarToast('Cuenta de editor/a creada', '✔️');
      } catch (err) {
        console.error(err);
        mostrarAviso('No se pudo crear la cuenta: ' + err.message);
      }
    });
  }
}

async function renderListaEditores() {
  const cont = $('#listaEditores');
  const plantilla = $('#plantillaEditor');
  const aviso = $('#estadoListaEditores');

  if (!cont || !plantilla || !aviso) {
    console.error('Falta el contenedor o la plantilla de editores.');
    return;
  }

  cont.replaceChildren();
  aviso.textContent = 'Cargando...';
  aviso.hidden = false;

  let editores;

  try {
    editores = await DB.getEditores();
  } catch (error) {
    console.error(error);
    aviso.textContent = 'No se pudieron cargar los editores.';
    return;
  }

  if (editores.length === 0) {
    aviso.textContent = 'Todavía no creaste cuentas de editor.';
    return;
  }

  aviso.hidden = true;

  for (const editor of editores) {
    const tarjeta = plantilla.content.cloneNode(true);

    tarjeta.querySelector('[data-nombre]').textContent = editor.name;
    tarjeta.querySelector('[data-usuario]').textContent = editor.username;

    const estado = tarjeta.querySelector('[data-estado]');
    estado.textContent = editor.enabled ? 'Activo' : 'Desactivado';

    estado.classList.add(
      ...(editor.enabled
        ? ['bg-green-100', 'text-green-800']
        : ['bg-slate-100', 'text-slate-600'])
    );

    const btn = tarjeta.querySelector('[data-cambiar-estado]');

    btn.textContent = editor.enabled ? 'Desactivar' : 'Activar';
    btn.classList.add(
      editor.enabled ? 'boton--rojo' : 'boton--verde'
    );

    btn.addEventListener('click', () => {
      const nuevoEstado = !editor.enabled;

      preguntarConfirmacion({
        icono: nuevoEstado ? '✅' : '⏸️',
        titulo: nuevoEstado
          ? '¿Activar editor?'
          : '¿Desactivar editor?',
        texto: nuevoEstado
          ? `${editor.name} podrá volver a ingresar con su usuario y contraseña.`
          : `${editor.name} no podrá volver a ingresar. Su cuenta y sus noticias se conservarán.`,
        textoSi: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',

        async onSi() {
          if (btn.disabled) return;

          btn.disabled = true;
          btn.textContent = 'Guardando...';

          try {
            const actualizado = await DB.cambiarEstadoEditor(
              editor.id,
              nuevoEstado
            );

            mostrarToast(
              actualizado.enabled
                ? 'Editor activado'
                : 'Editor desactivado',
              actualizado.enabled ? '✅' : '⏸️'
            );
          } catch (error) {
            console.error(error);
            mostrarAviso(error.message);
          } finally {
            await renderListaEditores();
          }
        }
      });
    });

    cont.appendChild(tarjeta);
  }
}
