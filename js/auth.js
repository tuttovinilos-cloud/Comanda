// Auth centralizado COMANDA
// Aplica control de sesión, permisos por página y filtrado de menú.

(function () {
  const AUTH_KEY = "comanda_operador_actual";
  const PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const PAGE_PERMISSIONS = {
    "index.html": "puede_pedidos",
    "clientes.html": "puede_clientes",
    "materiales.html": "puede_materiales",
    "precios.html": "puede_precios",
    "estadisticas.html": "puede_estadisticas",
    "configuracion.html": "puede_configuracion",
    "marketing.html": "puede_marketing",
    "cotizador.html": "puede_cotizador",
    "organizador de ideas.html": "puede_organizador"
  };

  const PAGE_ORDER = [
    "index.html",
    "clientes.html",
    "materiales.html",
    "precios.html",
    "estadisticas.html",
    "marketing.html",
    "cotizador.html",
    "organizador de ideas.html",
    "configuracion.html"
  ];

  function getSesionOperador() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSesionOperador(op) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(op));
  }

  function clearSesionOperador() {
    localStorage.removeItem(AUTH_KEY);
  }

  function esRoberto(op) {
    return String(op && op.nombre || "").trim().toLowerCase() === "roberto";
  }

  function operadorActivo(op) {
    return !!op && op.activo !== false;
  }

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
      const href = hrefRaw.toLowerCase().split("?")[0];
      const perm = PAGE_PERMISSIONS[href];
      if (!perm) return;
      a.style.display = tienePermiso(op, perm) ? "" : "none";
    });
  }

  function aplicarPermisosComanda() {
    // Login no se bloquea aquí.
    if (PAGE === "login.html") return true;

    const op = getSesionOperador();

    if (!operadorActivo(op)) {
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
  window.esRoberto = esRoberto;
  window.aplicarPermisosComanda = aplicarPermisosComanda;

  document.addEventListener("DOMContentLoaded", aplicarPermisosComanda);
})();
