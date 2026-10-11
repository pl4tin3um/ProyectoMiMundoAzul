/* =========================================================
   UTILIDADES COMUNES — Mi Mundo Azul (versión Supabase)
   Requiere en el HTML, ANTES de este archivo:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js"></script>
========================================================== */

// ---------- Conexión a Supabase ----------
const SUPABASE_URL = 'https://vcphcbrtaddmearotoly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8NKHHib_DLmdZYTz3sAEfQ_yJp01pNv';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Lo que sigue en el navegador ----------
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

// ---------- Acceso a datos ----------
// Todas las funciones son async: hay que usarlas con await.
const DB = {

  /* ---------- CUENTAS ---------- */
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
    const hash = await dcodeIO.bcrypt.hash(password, 10);
    const { error } = await supabaseClient.from('cuentas').insert([{
      name,
      username,
      email: email || null,
      password: hash,
      role: 'editor',
      enabled: true
    }]);
    if (error) throw error;
  },

  async eliminarCuenta(id) {
    const { error } = await supabaseClient.from('cuentas').delete().eq('id', id);
    if (error) throw error;
  },

  /* ---------- NOTICIAS ---------- */
  async getNews() {
  const { data, error } = await supabaseClient
    .from('noticias')
    .select('*')
    .eq('enabled', true)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
},

  /* ---------- BORRADORES Y FORMULARIOS (siguen locales) ---------- */
  getDrafts() { return JSON.parse(localStorage.getItem(LS_DRAFTS) || '{}'); },
  setDrafts(d) { localStorage.setItem(LS_DRAFTS, JSON.stringify(d)); },
  getForms() { return JSON.parse(localStorage.getItem(LS_FORMS) || '[]'); },
  setForms(f) { localStorage.setItem(LS_FORMS, JSON.stringify(f)); }
};

// ---------- Login ----------
// Devuelve { id, name, username, role } si es correcto, o null si no.
async function loginCuenta(identificador, password) {
  const columnas = 'id, name, username, role, password';

  // Se busca primero por username y luego por email (dos consultas simples,
  // sin armar filtros con texto del usuario).
  let { data, error } = await supabaseClient
    .from('cuentas').select(columnas)
    .eq('username', identificador).eq('enabled', true).maybeSingle();
  if (error) throw error;

  if (!data) {
    const r = await supabaseClient
      .from('cuentas').select(columnas)
      .eq('email', identificador).eq('enabled', true).maybeSingle();
    if (r.error) throw r.error;
    data = r.data;
  }

  if (!data) return null;

  const ok = await dcodeIO.bcrypt.compare(password, data.password);
  if (!ok) return null;

  return { id: data.id, name: data.name, username: data.username, role: data.role };
}

// ---------- Sesión (en el navegador) ----------
function getSession() { try { return JSON.parse(sessionStorage.getItem(SS_SESSION)); } catch (e) { return null; } }
function setSession(s) { sessionStorage.setItem(SS_SESSION, JSON.stringify(s)); }
function clearSession() { sessionStorage.removeItem(SS_SESSION); }

// ---------- Toast ----------
let toastTimer;
function mostrarToast(msg, icono) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<span>${icono || '✅'}</span><span>${msg}</span>`;
  t.classList.add('mostrar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('mostrar'), 3200);
}

// ---------- Ventana de usuarios ----------
// Ya no muestra contraseñas: en la BD solo existe el hash.
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
