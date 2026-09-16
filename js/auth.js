// Auth centralizado COMANDA
// v30 · Supabase Auth real + compatibilidad temporal con localStorage.
// localStorage conserva una copia de UI, pero ya NO autentica al usuario.

(function () {
  const AUTH_KEY = "comanda_operador_actual";

  function paginaActual() {
    const raw = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
    return String(raw || "index.html").toLowerCase().split("?")[0].split("#")[0] || "index.html";
  }

  const PAGE = paginaActual();

  const PAGE_PERMISSIONS = {
    "index.html": "puede_pedidos",
    "clientes.html": "puede_clientes",
    "materiales.html": "puede_materiales",
    "precios.html": "puede_precios",
    "estadisticas.html": "puede_estadisticas",
    "marketing.html": "puede_marketing",
    "compras.html": "puede_compras",
    "contabilidad.html": "puede_contabilidad",
    "cotizador.html": "puede_cotizador",
    "label.html": "puede_label",
    "organizador de ideas.html": "puede_organizador",
    "configuracion.html": "puede_configuracion"
  };

  const PAGE_ORDER = [
    "index.html",
    "precios.html",
    "clientes.html",
    "label.html",
    "cotizador.html",
    "organizador de ideas.html",
    "estadisticas.html",
    "marketing.html",
    "materiales.html",
    "compras.html",
    "contabilidad.html",
    "configuracion.html"
  ];

  function normalizar(v) {
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getSesionOperador() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSesionOperador(op) {
    if (!op) return;
    const clean = { ...op };
    delete clean.clave;
    delete clean.password;
    delete clean.pass;
    delete clean.pin;
    delete clean.auth_email;
    delete clean.auth_user_id;
    localStorage.setItem(AUTH_KEY, JSON.stringify(clean));
  }

  function clearSesionOperador() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  }

  function esRoberto(op) {
    return normalizar(op && op.nombre) === "roberto";
  }

  function operadorActivo(op) {
    return !!op && op.activo !== false;
  }

  // Esto controla solamente la UI. La autorización real se irá cerrando en RLS/RPC.
  function tienePermiso(op, permiso) {
    if (!operadorActivo(op)) return false;
    if (esRoberto(op)) return true;
    if (!permiso) return true;
    return op[permiso] === true;
  }

  function primeraPaginaPermitida(op) {
    if (!operadorActivo(op)) return "login.html";
    if (esRoberto(op)) return "index.html";

    for (const page of PAGE_ORDER) {
      const perm = PAGE_PERMISSIONS[page];
      if (tienePermiso(op, perm)) return page;
    }
    return "login.html";
  }

  function filtrarMenu(op) {
    const menu = document.getElementById("authMenu");
    if (!menu) return;
    const items = Array.from(menu.querySelectorAll("a.tab-btn"));
    items.forEach(a => {
      const hrefRaw = a.getAttribute("href") || "";
      const href = decodeURIComponent(hrefRaw.toLowerCase().split("?")[0].split("#")[0]);
      const perm = PAGE_PERMISSIONS[href];
      if (!perm) return;
      a.style.display = tienePermiso(op, perm) ? "" : "none";
    });
  }

  async function esperarSupabase() {
    for (let i = 0; i < 80; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return null;
  }

  async function obtenerOperadorAutenticado() {
    const db = await esperarSupabase();
    if (!db) return null;

    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError || !sessionData?.session?.user) return null;

    const { data, error } = await db.rpc("comanda_mi_operador");
    if (error) {
      console.error("No se pudo cargar el operador autenticado:", error);
      return null;
    }

    const op = Array.isArray(data) ? data[0] : data;
    if (!operadorActivo(op)) return null;

    setSesionOperador(op);
    // Compatibilidad con módulos antiguos. Estos valores NO conceden permisos en Supabase.
    localStorage.setItem("user", normalizar(op.nombre));
    localStorage.setItem("role", esRoberto(op) ? "total" : "operador");
    return op;
  }

  async function cerrarSesionComanda() {
    const db = await esperarSupabase();
    try {
      if (db) await db.auth.signOut();
    } catch (e) {
      console.warn("No se pudo cerrar la sesión remota:", e);
    }
    clearSesionOperador();
  }

  async function aplicarPermisosComanda() {
    if (PAGE === "login.html") return true;

    const op = await obtenerOperadorAutenticado();
    if (!op) {
      clearSesionOperador();
      location.href = "login.html";
      return false;
    }

    const permisoRequerido = PAGE_PERMISSIONS[PAGE];
    if (permisoRequerido && !tienePermiso(op, permisoRequerido)) {
      location.href = primeraPaginaPermitida(op);
      return false;
    }

    filtrarMenu(op);
    return true;
  }

  window.getSesionOperador = getSesionOperador;
  window.setSesionOperador = setSesionOperador;
  window.clearSesionOperador = clearSesionOperador;
  window.cerrarSesionComanda = cerrarSesionComanda;
  window.obtenerOperadorAutenticado = obtenerOperadorAutenticado;
  window.esRoberto = esRoberto;
  window.operadorActivo = operadorActivo;
  window.tienePermisoComanda = tienePermiso;
  window.aplicarPermisosComanda = aplicarPermisosComanda;
  window.PAGE_PERMISSIONS_COMANDA = PAGE_PERMISSIONS;

  function iniciar() {
    window.authReady = aplicarPermisosComanda();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
})();
