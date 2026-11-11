
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
  async getNews() {
    const { data, error } = await supabaseClient
      .from('noticias')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: false, nullsFirst: false }); 
    
    if (error) {
      console.error('Error fetching noticias de Supabase:', error);
      throw error;
    }
    return data || [];
  },

  async getForms() {
    const { data, error } = await supabaseClient
      .from('formularios')
      .select('*')
      .eq('enable', true)
      .order('created_at', { ascending: false, nullsLast: true });

    if (error) throw error;
    return data || [];
  },

  async crearFormulario(formulario) {
    const payload = {
      ...(formulario || {}),
      created_at: formulario?.created_at || new Date().toISOString(),
      enable: formulario?.enable ?? formulario?.enable ?? true,
      enable: formulario?.enable ?? formulario?.enable ?? true
    };

    try {
      const { data, error } = await supabaseClient
        .from('formularios')
        .insert([payload])
        .select()
        .single();

      if (error) {
        const esRls = error.code === '42501' || /row-level security|permission/i.test(error.message || '');
        if (!esRls) throw error;
      } else {
        return data;
      }
    } catch (error) {
      const esRls = error?.code === '42501' || /row-level security|permission/i.test(error?.message || '');
      if (!esRls) throw error;
    }

    const { data, error: functionError } = await supabaseClient.functions.invoke(
      'crear-formulario',
      { body: payload }
    );

    if (functionError) {
      let mensaje = 'No pudimos guardar el formulario.';

      if (functionError.context instanceof Response) {
        try {
          const respuesta = await functionError.context.json();
          if (typeof respuesta.error === 'string') mensaje = respuesta.error;
        } catch {
          // Mantener el mensaje general.
        }
      }

      throw new Error(mensaje);
    }

    if (!data?.ok) {
      throw new Error('El servicio no confirmó la creación del formulario.');
    }

    return data.formulario || data;
  },

  getDrafts() {
    try {
      const raw = localStorage.getItem(LS_DRAFTS);
      if (!raw) return {};

      const drafts = JSON.parse(raw);
      if (!drafts || typeof drafts !== 'object' || Array.isArray(drafts)) {
        throw new Error('El almacenamiento de borradores no tiene un formato válido.');
      }

      let actualizados = false;
      for (const [draftKey, draft] of Object.entries(drafts)) {
        if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
          delete drafts[draftKey];
          actualizados = true;
          continue;
        }
        for (const key of ['image', 'imagenPortada', 'imagen_portada']) {
          if (Object.prototype.hasOwnProperty.call(draft, key)) {
            delete draft[key];
            actualizados = true;
          }
        }
      }

      if (actualizados) {
        try {
          localStorage.setItem(LS_DRAFTS, JSON.stringify(drafts));
        } catch (error) {
          console.error('No se pudieron limpiar imágenes antiguas de los borradores:', error);
          mostrarToast('No pudimos limpiar datos antiguos de los borradores.', '⚠️');
        }
      }

      return drafts;
    } catch (error) {
      console.error('No se pudieron leer los borradores:', error);
      try {
        localStorage.removeItem(LS_DRAFTS);
      } catch (cleanupError) {
        console.error('No se pudo limpiar el almacenamiento de borradores:', cleanupError);
      }
      mostrarToast('No pudimos recuperar los borradores guardados.', '⚠️');
      return {};
    }
  },

  setDrafts(drafts) {
    try {
      localStorage.setItem(LS_DRAFTS, JSON.stringify(drafts));
      return true;
    } catch (error) {
      console.error('No se pudieron guardar los borradores:', error);
      mostrarToast('No pudimos guardar el borrador. Revisá el espacio disponible en el navegador.', '⚠️');
      return false;
    }
  },
};

async function loginCuenta(identificador, password) {
  let respuesta;
  try {
    respuesta = await supabaseClient.functions.invoke(
      'login-cuenta',
      {
        body: {
          identificador: identificador.trim(),
          password
        }
      }
    );
  } catch {
    throw new Error('No pudimos conectarnos al servicio de acceso. Probá de nuevo en un rato.');
  }

  const { data, error } = respuesta;
  if (error) {
    const status = error.context?.status;
    if (status === 429) {
      throw new Error('Demasiados intentos. Esperá y volvé a probar.');
    }
    if (status >= 400 && status < 500) return null;
    throw new Error('No pudimos conectarnos al servicio de acceso. Probá de nuevo en un rato.');
  }

  if (
    !data?.session?.access_token ||
    !data?.session?.refresh_token ||
    !data?.cuenta
  ) {
    throw new Error('No pudimos completar el acceso. Probá de nuevo en un rato.');
  }

  const { error: sessionError } =
    await supabaseClient.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

  if (sessionError) {
    console.error('No se pudo iniciar la sesión de Supabase:', sessionError);
    throw new Error('No pudimos completar el acceso. Probá de nuevo en un rato.');
  }

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

async function verificarSesion() {
  const path = window.location.pathname;
  const pagina = path.split('/').pop().toLowerCase();
  if (
    path === '/' ||
    path === '' ||
    pagina === 'index.html' ||
    pagina === 'noticia.html' ||
    pagina === 'formularios.html'
  ) return;

  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.replace('/');
  }
}

verificarSesion();
window.addEventListener('pageshow', verificarSesion);

let limpiarConfirmacionActiva = null;
function preguntarConfirmacion(opciones) {
  const modal = $('#modalConfirmar');
  const icono = $('#iconoConfirmar');
  const titulo = $('#tituloConfirmar');
  const texto = $('#textoConfirmar');
  const btnSi = $('#btnConfirmarSi');
  const btnNo = $('#btnConfirmarNo');

  if (!modal || !btnSi || !btnNo) {
    console.error('No se pudo abrir la confirmación: faltan elementos del modal.');
    return;
  }

  limpiarConfirmacionActiva?.(false);

  if (icono) icono.textContent = opciones.icono || '❓';
  if (titulo) titulo.textContent = opciones.titulo || '¿Estás seguro/a?';
  if (texto) texto.textContent = opciones.texto || '';
  btnSi.textContent = opciones.textoSi || 'Sí, continuar';

  function finalizar(confirmado, ejecutarAccion = true) {
    btnSi.removeEventListener('click', alConfirmar);
    btnNo.removeEventListener('click', alCancelar);
    modal.removeEventListener('click', alFondo);
    document.removeEventListener('keydown', alTeclado);
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    if (limpiarConfirmacionActiva === cancelar) {
      limpiarConfirmacionActiva = null;
    }

    if (!ejecutarAccion) return;
    const accion = confirmado ? opciones.onSi : opciones.onNo;
    if (typeof accion === 'function') accion();
  }

  function alConfirmar() {
    finalizar(true);
  }

  function alCancelar() {
    finalizar(false);
  }

  function alCerrar() {
    finalizar(false, false);
  }

  function alFondo(evento) {
    if (evento.target === modal) alCerrar();
  }

  function alTeclado(evento) {
    if (evento.key === 'Escape') alCerrar();
  }

  function cancelar(ejecutarAccion = false) {
    finalizar(false, ejecutarAccion);
  }

  limpiarConfirmacionActiva = cancelar;
  btnSi.addEventListener('click', alConfirmar);
  btnNo.addEventListener('click', alCancelar);
  modal.addEventListener('click', alFondo);
  document.addEventListener('keydown', alTeclado);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function cancelarConfirmacion() {
  limpiarConfirmacionActiva?.(false);
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
