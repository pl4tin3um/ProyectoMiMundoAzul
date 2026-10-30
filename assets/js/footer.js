/* =========================================================
   MI MUNDO AZUL - FOOTER REUTILIZABLE
   Uso: <div id="footer"></div>
        <script src="assets/js/footer.js" data-root=""></script>
   data-root = ruta hacia la raíz del sitio ("" en index, "../" en /pages)
========================================================= */

(function () {
  var script = document.currentScript;
  var root = (script && script.getAttribute('data-root')) || '';

  var html = `
<footer class="bg-azul-oscuro text-cielo-medio">
  <div class="max-w-6xl mx-auto px-[6vw] py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

    <!-- Marca -->
    <div>
      <div class="flex items-center gap-3">
        <img src="${root}assets/Imgs/logo.jpeg" alt="Mi Mundo Azul" class="w-12 h-12 rounded-full object-cover border-2 border-sol">
        <div class="font-baloo font-bold text-white leading-tight">
          Mi Mundo Azul
          <small class="block font-nunito font-normal text-azul-suave text-sm">Asociación Autista de Flores</small>
        </div>
      </div>
      <p class="mt-4 text-sm leading-relaxed text-azul-suave">
        Creamos espacios de apoyo y acompañamiento para personas autistas y sus familias.
      </p>
      <div class="flex gap-3 mt-5">
        <a href="https://www.facebook.com/p/MI-MUNDO-AZUL-100058705302009/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="w-10 h-10 rounded-full border border-azul-medio grid place-items-center text-white hover:bg-sol hover:text-tinta hover:border-sol transition">
        <i class="bi bi-facebook" aria-hidden="true"></i>
        </a>
        <a href="https://www.instagram.com/mimundoazultrinidad/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="w-10 h-10 rounded-full border border-azul-medio grid place-items-center text-white hover:bg-sol hover:text-tinta hover:border-sol transition">
        <i class="bi bi-instagram" aria-hidden="true"></i>
        </a>
        <a href="https://wa.me/59898992258" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="w-10 h-10 rounded-full border border-azul-medio grid place-items-center text-white hover:bg-sol hover:text-tinta hover:border-sol transition">
        <i class="bi bi-whatsapp" aria-hidden="true"></i>
        </a>
      </div>
    </div>

    <!-- Explorar -->
    <div>
      <h4 class="font-baloo font-bold text-white text-lg mb-4">Explorar</h4>
      <ul class="space-y-2.5 text-sm">
        <li><a href="${root}index.html#inicio" class="hover:text-sol transition">Inicio</a></li>
        <li><a href="${root}index.html#nosotros" class="hover:text-sol transition">Nuestra labor</a></li>
        <li><a href="${root}index.html#noticias" class="hover:text-sol transition">Noticias</a></li>
        <li><a href="${root}index.html#contacto" class="hover:text-sol transition">Contacto</a></li>
      </ul>
    </div>

    <!-- Colaborá -->
    <div>
      <h4 class="font-baloo font-bold text-white text-lg mb-4">Colaborá</h4>
      <ul class="space-y-2.5 text-sm">
        <li><a href="${root}pages/formularios.html" class="hover:text-sol transition">Formularios</a></li>
        <li><a href="${root}index.html#inicio" class="hover:text-sol transition">Donar</a></li>
        <li><a href="${root}index.html#nosotros" class="hover:text-sol transition">Hacerse socio</a></li>
      </ul>
    </div>

    <!-- Contacto -->
    <div>
      <h4 class="font-baloo font-bold text-white text-lg mb-4">Contacto</h4>
      <ul class="space-y-3 text-sm">
        <li class="flex items-start gap-3">
          <i class="bi bi-geo-alt-fill text-sol mt-0.5" aria-hidden="true"></i>
          <span>Dirección, Trinidad, Flores</span>
        </li>
        <li class="flex items-start gap-3">
          <i class="bi bi-telephone-fill text-sol mt-0.5" aria-hidden="true"></i>
          <span>+598 098 095 310</span> 
          <span>+598 098 992 258</span>
        </li>
        <li class="flex items-start gap-3">
          <i class="bi bi-envelope-fill text-sol mt-0.5" aria-hidden="true"></i>
          <a href="mailto:asociacionmimundoazultrinidad@gmail.com" class="hover:text-sol transition">
          asociacionmimundoazultrinidad@gmail.com</a>
        </li>
      </ul>
    </div>
  </div>

  <!-- Franja inferior -->
  <div class="border-t border-azul-fuerte">
    <div class="max-w-6xl mx-auto px-[6vw] py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-azul-suave">
      <p>© ${new Date().getFullYear()} Mi Mundo Azul · Asociación civil.</p>
      <p>Hecho con <i class="bi bi-heart-fill text-sol" aria-hidden="true"></i> para nuestra comunidad</p>
    </div>
  </div>
</footer>`;

  function insertar() {
    var destino = document.getElementById('footer');
    if (destino) {
      destino.innerHTML = html;
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertar);
  } else {
    insertar();
  }
})();