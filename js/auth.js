// Auth estable y autónomo para COMANDA.
// Evita depender de auth.js raíz (actualmente incompleto).

(function () {
  const AUTH_KEY = "comanda_operador_actual";
  const PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const PAGE_PERMISSIONS = {
    "index.html": "puede_pedidos",
    "clientes.html": "puede_clientes",
    "materiales.html": "puede_materiales",
    "estadisticas.html": "puede_estadisticas",
    "marketing.html": "puede_marketing",
    "cotizador.html": "puede_cotizador",
    "organizador de ideas.html": "puede_organizador",
    "configuracion.html": "puede_configuracion"
  };

  function getSesionOperador() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function esRoberto(op) {
    return String(op && op.nombre || "").trim().toLowerCase() === "roberto";
  }

  function tienePermiso(op, permiso) {
    if (!op || op.activo === false) return false;
    if (esRoberto(op)) return true;
    if (!permiso) return true;
    return op[permiso] === true;
  }

  function primeraPaginaPermitida(op) {
    if (!op || op.activo === false) return "login.html";
    if (esRoberto(op)) return "index.html";

    const orden = [
      "index.html",
      "clientes.html",
      "materiales.html",
      "estadisticas.html",
      "marketing.html",
      "cotizador.html",
      "organizador de ideas.html",
      "configuracion.html"
    ];

    for (const page of orden) {
      const permiso = PAGE_PERMISSIONS[page];
      if (tienePermiso(op, permiso)) return page;
    }

    return "login.html";
  }

  function aplicarPermisosComanda() {
    const op = getSesionOperador();

    // No tocamos login.
    if (PAGE === "login.html") return;

    if (!op || op.activo === false) {
      location.href = "login.html";
      return;
    }

    const requerido = PAGE_PERMISSIONS[PAGE];
    if (requerido && !tienePermiso(op, requerido)) {
      location.href = primeraPaginaPermitida(op);
      return;
    }
  }

  window.getSesionOperador = getSesionOperador;
  window.aplicarPermisosComanda = aplicarPermisosComanda;

  document.addEventListener("DOMContentLoaded", aplicarPermisosComanda);
})();
