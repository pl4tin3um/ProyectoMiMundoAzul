
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

 getDrafts() { return JSON.parse(localStorage.getItem(LS_DRAFTS) || '{}'); },
 setDrafts(d) { localStorage.setItem(LS_DRAFTS, JSON.stringify(d)); },
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

let toastTimer;
function mostrarToast(msg, icono) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<span>${icono || '✅'}</span><span>${msg}</span>`;
  t.classList.add('mostrar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('mostrar'), 3200);
}
