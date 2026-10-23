
const SUPABASE_URL = 'https://vcphcbrtaddmearotoly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8NKHHib_DLmdZYTz3sAEfQ_yJp01pNv';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const LS_DRAFTS  = 'mma2_drafts';
const LS_FORMS   = 'mma2_forms';
const SS_SESSION = 'mma2_session';

function $(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

function $$(sel, ctx) {
  return Array.from((ctx || document).querySelectorAll(sel));
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

const DB = {
  async getEditores() {
    const { data, error } = await supabaseClient
      .from('cuentas')
      .select('id, name, username, email, enabled')
      .eq('role', 'editor')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getCuentas() {
    const { data, error } = await supabaseClient
      .from('cuentas')
      .select('id, name, username, email, role, enabled')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async existeUsername(username) {
    const { data, error } = await supabaseClient
      .from('cuentas')
      .select('id')
      .ilike('username', username)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async crearEditor({ name, username, email, password }) {
  const { data, error } = await supabaseClient.functions.invoke(
    'crear-editor',
    {
      body: {
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      }
    }
  );

  if (error) {
    let mensaje = 'No pudimos conectarnos al servicio de creación.';

    if (error.context instanceof Response) {
      mensaje = 'No se pudo crear la cuenta.';

      try {
        const respuesta = await error.context.json();

        if (typeof respuesta.error === 'string') {
          mensaje = respuesta.error;
        }
      } catch {

      }
    }

    throw new Error(mensaje);
  }

  if (!data?.ok) {
    throw new Error('El servicio no confirmó la creación de la cuenta.');
  }

  return data;
},

  async cambiarEstadoEditor(id, enabled) {
  const { data, error } = await supabaseClient.functions.invoke(
    'cambiar-estado-editor',
    {
      body: {
        id: Number(id),
        enabled
      }
    }
  );

  if (error) {
    let mensaje =
      'No pudimos confirmar el cambio. Actualizá el listado.';

    if (error.context instanceof Response) {
      try {
        const respuesta = await error.context.json();

        if (typeof respuesta.error === 'string') {
          mensaje = respuesta.error;
        }
      } catch {
        // Mantener el mensaje general.
      }
    }

    throw new Error(mensaje);
  }

  if (!data?.ok || !data?.editor) {
    throw new Error('El servicio no confirmó el cambio de estado.');
  }

  return data.editor;
},


 async eliminarCuenta(id, confirmacionUsuario) {
  const { data, error } = await supabaseClient.functions.invoke(
    'eliminar-editor',
    {
      body: {
        id: Number(id),
        confirmacionUsuario
      }
    }
  );

  if (error) {
    let mensaje =
      'No pudimos confirmar la eliminación. Actualizá el listado antes de reintentar.';

    if (error.context instanceof Response) {
      try {
        const respuesta = await error.context.json();

        if (typeof respuesta.error === 'string') {
          mensaje = respuesta.error;
        }
      } catch {
        // Mantener el mensaje general.
      }
    }

    throw new Error(mensaje);
  }

  if (!data?.ok || data.id !== Number(id)) {
    throw new Error(
      'El servicio no confirmó la eliminación. Actualizá el listado.'
    );
  }

  return data;
},

  async getNews() {
    const { data, error } = await supabaseClient
      .from('noticias')
      .select('*')
      .eq('enabled', true)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async crearNoticias(noticia) {
    const { error } = await supabaseClient.from('noticias').insert(noticia);
    if (error) throw error;
  },

  getDrafts() { return JSON.parse(localStorage.getItem(LS_DRAFTS) || '{}'); },
  setDrafts(d) { localStorage.setItem(LS_DRAFTS, JSON.stringify(d)); },
  getForms() { return JSON.parse(localStorage.getItem(LS_FORMS) || '[]'); },
  setForms(f) { localStorage.setItem(LS_FORMS, JSON.stringify(f)); }
};

async function loginCuenta(identificador, password) {
  const { data, error } = await supabaseClient.functions.invoke(
    'login-cuenta',
    {
      body: {
        identificador: identificador.trim(),
        password
      }
    }
  );

  if (error) {

    if (error.context?.status === 401) return null;

    throw new Error(
      error.context?.status === 429
        ? 'Demasiados intentos. Esperá y volvé a probar.'
        : 'No pudimos conectarnos al servicio de acceso.'
    );
  }

  if (
    !data?.session?.access_token ||
    !data?.session?.refresh_token ||
    !data?.cuenta
  ) {
    throw new Error('El servicio devolvió una respuesta incompleta.');
  }

  const { error: sessionError } =
    await supabaseClient.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

  if (sessionError) throw sessionError;

  return data.cuenta;
}

function getSession() { try { return JSON.parse(sessionStorage.getItem(SS_SESSION)); } catch (e) { return null; } }
function setSession(s) { sessionStorage.setItem(SS_SESSION, JSON.stringify(s)); }
function clearSession() { sessionStorage.removeItem(SS_SESSION); }

async function obtenerCuentaActual(){
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    if (
      error.name === 'AuthSessionMissingError' ||
      error.status === 401 ||
      error.status === 403
    ) {
      return null;
    }

    throw error;
  }

  if (!data.user) return null;

  const { data: cuenta, error: errorCuenta } = await supabaseClient
    .from('cuentas')
    .select('id, name, username, role, enabled')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();

  if (errorCuenta) throw errorCuenta;

  if (!cuenta || !cuenta.enabled) return null;

  return cuenta;
}

let toastTimer;
function mostrarToast(msg, icono) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<span>${icono || '✅'}</span><span>${msg}</span>`;
  t.classList.add('mostrar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('mostrar'), 3200);
}

async function mostrarUsuarios() {
  let usuarios = [];
  try {
    usuarios = await DB.getCuentas();
  } catch (e) {
    console.error(e);
    mostrarToast('No se pudieron cargar los usuarios', '⚠️');
    return;
  }

  const ventana = document.createElement('div');
  ventana.id = 'ventanaUsuarios';
  ventana.className = 'fixed inset-y-0 left-0 z-50 flex items-center p-6 pointer-events-none';
  ventana.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="tituloUsuarios">
      <div class="flex items-center justify-between mb-4">
        <h2 id="tituloUsuarios" class="font-baloo font-extrabold text-2xl text-azul-oscuro">Usuarios</h2>
        <button type="button" id="cerrarUsuarios" class="text-2xl text-tinta-suave" aria-label="Cerrar">&times;</button>
      </div>
      <div class="space-y-3">
        ${usuarios.length ? usuarios.map(usuario => `
          <div class="rounded-2xl bg-cielo p-4">
            <p class="font-bold">${escapeHTML(usuario.name || usuario.username)}</p>
            <p class="text-sm text-tinta-suave">@${escapeHTML(usuario.username)} <br>${escapeHTML(usuario.role)}</p>
          </div>
        `).join('') : '<p class="text-tinta-suave">No hay usuarios registrados.</p>'}
      </div>
    </div>`;

  document.body.appendChild(ventana);
  const cerrar = () => ventana.remove();
  ventana.querySelector('#cerrarUsuarios').addEventListener('click', cerrar);
  ventana.addEventListener('click', event => {
    if (event.target === ventana) cerrar();
  });
}
