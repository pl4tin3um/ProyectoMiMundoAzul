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
        <button class="boton boton--azul flex-1 py-2.5 text-sm" data-abrir-form="${form.id}">
          <i class="bi bi-pencil-square" aria-hidden="true"></i> Completar
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
}


function abrirModalFormulario(form) {
  const urlFormulario = obtenerUrlFormularioValida(form?.url);
  if (!urlFormulario) {
    mostrarErrorUrlFormulario();
    return;
  }
  document.getElementById('avisoUrlFormulario')?.remove();

  const modal = document.getElementById('modalFormulario');
  if (!modal) return;

  const modalTitulo = document.getElementById('modalTitulo');
  const iframeModal = document.getElementById('iframeModal');
  const btnCerrar = document.getElementById('btnCerrarModal');

  if (modalTitulo) modalTitulo.textContent = form.title;
  if (iframeModal) iframeModal.src = urlFormulario;

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

function obtenerUrlFormularioValida(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.hostname === 'forms.gle' && /^\/[\w-]+\/?$/.test(url.pathname)) return url.href;
  if (url.hostname !== 'docs.google.com') return null;

  const rutaValida = /^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[\w-]+\/viewform\/?$/;
  return rutaValida.test(url.pathname) ? url.href : null;
}

function mostrarErrorUrlFormulario() {
  const grid = document.getElementById('gridFormularios');
  if (!grid) return;

  let aviso = document.getElementById('avisoUrlFormulario');
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'avisoUrlFormulario';
    aviso.className = 'mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800';
    aviso.setAttribute('role', 'alert');
    grid.parentNode.insertBefore(aviso, grid);
  }

  aviso.textContent = 'No pudimos abrir este formulario porque el enlace no parece correcto. Revisá la URL o pedí que la actualicen.';
}