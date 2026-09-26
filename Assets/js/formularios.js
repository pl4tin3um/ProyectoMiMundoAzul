/* ---------------- FORMULARIOS GOOGLE ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderFormularios();

  const btnAgregar = document.getElementById('btnAgregar');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', AgregarForm);
  }
});


function renderFormularios() {
  const container = document.getElementById('gridFormularios');
  if (!container) return;

  const formularios = DB.getForms();

  if (!formularios || formularios.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center text-tinta-suave py-8 bg-white/50 rounded-3xl border border-dashed border-cielo-oscuro">
        <p>📭 No hay formularios disponibles en este momento.</p>
      </div>`;
    return;
  }

  container.innerHTML = formularios.map((form) => `
    <article class="bg-white rounded-3xl p-6 shadow-md border border-cielo-medio flex flex-col justify-between hover:-translate-y-1 transition duration-200">
      <div>
        <div class="text-3xl text-azul-fuerte mb-3">
          <i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i>
        </div>
        <h3 class="font-baloo font-bold text-xl text-azul-oscuro break-words">${escapeHTML(form.title)}</h3>
      </div>
      <div class="mt-6 flex gap-2">
        <button class="boton boton--azul flex-1 py-2.5 text-sm" data-abrir-form="${form.id}">
          <span>📝</span> Completar
        </button>
        <button class="bg-rojo-claro text-rojo font-bold px-3 py-2.5 rounded-xl hover:bg-rojo hover:text-white transition text-sm" data-eliminar-form="${form.id}" title="Eliminar">
          <i class="bi bi-trash-fill" aria-hidden="true"></i>
        </button>
      </div>
    </article>
  `).join('');

  // Eventos para abrir modal
  container.querySelectorAll('[data-abrir-form]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.abrirForm;
      const form = DB.getForms().find(f => f.id === id);
      if (form) abrirModalFormulario(form);
    });
  });

  // Eventos para eliminar
  container.querySelectorAll('[data-eliminar-form]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.eliminarForm;
      if (confirm('¿Seguro que deseas eliminar este formulario?')) {
        const nuevosForms = DB.getForms().filter(f => f.id !== id);
        DB.setForms(nuevosForms);
        renderFormularios();
        if (typeof mostrarToast === 'function') {
          mostrarToast('Formulario eliminado correctamente', '🗑️');
        }
      }
    });
  });
}


function abrirModalFormulario(form) {
  let modal = document.getElementById('modalFormulario');
  if (!modal) return;

  const modalTitulo = document.getElementById('modalTitulo');
  const iframeModal = document.getElementById('iframeModal');
  const btnCerrar = document.getElementById('btnCerrarModal');

  if (modalTitulo) modalTitulo.textContent = form.title;
  if (iframeModal) iframeModal.src = form.url;

  modal.classList.remove('hidden');

  const cerrar = () => {
    modal.classList.add('hidden');
    if (iframeModal) iframeModal.src = '';
  };

  if (btnCerrar) btnCerrar.onclick = cerrar;
  modal.onclick = (e) => {
    if (e.target === modal) cerrar();
  };
}