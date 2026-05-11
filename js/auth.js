// Modo estable temporal: no bloquear vistas por permisos.
// Objetivo: asegurar que index pueda mostrar pedidos siempre.

(function () {
  function getSesionOperador() {
    try {
      return JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
    } catch {
      return null;
    }
  }

  function aplicarPermisosComanda() {
    // Intencionalmente vacío mientras estabilizamos carga de pedidos.
    return true;
  }

  window.getSesionOperador = getSesionOperador;
  window.aplicarPermisosComanda = aplicarPermisosComanda;
})();
