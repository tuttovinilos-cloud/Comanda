/* =========================================================
   PARCHE COMANDA · Filtros + Botón agregar + feedback móvil
   Pegar AL FINAL de js/app.js o cargar después de js/app.js.
   No modifica Supabase ni estructura de tablas.
========================================================= */
(function(){
  function normalizarComandaPatch(valor){
    return String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function asegurarOpcionesFiltroEstado(){
    const filtro = document.getElementById("filterStatus");
    if(!filtro) return;

    const opcionesActuales = [...filtro.options].map(o => o.value);

    if(!opcionesActuales.includes("En curso")){
      const opt = document.createElement("option");
      opt.value = "En curso";
      opt.textContent = "⚫ En curso";

      const listo = [...filtro.options].find(o => o.value === "Listo");
      filtro.insertBefore(opt, listo || null);
    }

    if(!opcionesActuales.includes("Procesos")){
      const opt = document.createElement("option");
      opt.value = "Procesos";
      opt.textContent = "Procesos";
      filtro.insertBefore(opt, filtro.options[1] || null);
    }
  }

  window.claseTrabajo = function(valor){
    const estado = String(valor || "");

    if(estado === "Solicitud") return "status-solicitud";
    if(estado === "En curso") return "status-en-curso estado-en-curso";
    if(estado === "Revisado") return "status-revisado";
    if(estado === "Listo") return "status-listo";

    return "";
  };

  window.pedidoCumpleFiltros = function(p){
    const texto = normalizarBusqueda(document.getElementById("searchInput")?.value || "");
    const estadoFiltro = document.getElementById("filterStatus")?.value || "";
    const pagoFiltro = document.getElementById("filterPago")?.value || "";
    const desde = document.getElementById("filterFechaDesde")?.value || "";
    const hasta = document.getElementById("filterFechaHasta")?.value || "";
    const operadorFiltro = document.getElementById("filterOperador")?.value || "";

    const fecha = String(p.fecha || "");
    const operador = String(p.operador || "");
    const estatus = String(p.estatus_trabajo || "");
    const pago = String(p.estatus_pago || "");

    const contenido = normalizarBusqueda([
      p.id,
      p.fecha,
      p.cliente,
      p.descripcion,
      p.cantidad,
      p.material,
      p.tipo_impresion,
      p.precio,
      p.estatus_trabajo,
      p.estatus_pago,
      p.fecha_entrega,
      p.archivo_nombre,
      typeof getClienteExtraBusqueda === "function" ? getClienteExtraBusqueda(p.cliente) : ""
    ].join(" "));

    if(texto && !contenido.includes(texto)) return false;

    if(estadoFiltro === "Procesos"){
      const procesos = ["Solicitud", "En curso", "Revisado"];
      if(!procesos.includes(estatus)) return false;
    }else if(estadoFiltro && estatus !== estadoFiltro){
      return false;
    }

    if(pagoFiltro && pago !== pagoFiltro) return false;

    /* Importante:
       En móvil Fecha, Nro y Operador pueden estar ocultos visualmente,
       pero el filtro sigue funcionando porque usa el dato real del pedido.
    */
    if(operadorFiltro && operador !== operadorFiltro) return false;

    if(desde && fecha < desde) return false;
    if(hasta && fecha > hasta) return false;

    return true;
  };

  function inyectarEstilosComandaPatch(){
    if(document.getElementById("patch-comanda-filtros-boton")) return;

    const style = document.createElement("style");
    style.id = "patch-comanda-filtros-boton";
    style.textContent = `
      .status-en-curso,
      .estado-en-curso,
      select.status-en-curso,
      select.estado-en-curso{
        color:#ffffff!important;
        border-color:#111827!important;
        background:#111827!important;
        font-weight:900!important;
      }

      .fila-guardada-ok td{
        animation:filaGuardadaOkComanda 1.35s ease both!important;
      }

      @keyframes filaGuardadaOkComanda{
        0%{background:#dcfce7!important;box-shadow:inset 0 0 0 2px #16a34a!important;}
        60%{background:#dcfce7!important;}
        100%{background:inherit!important;box-shadow:none!important;}
      }

      .quick-save-ok{
        animation:botonGuardarOkComanda .75s ease both!important;
      }

      @keyframes botonGuardarOkComanda{
        0%{transform:scale(1);}
        35%{transform:scale(1.12);background:#16a34a!important;border-color:#16a34a!important;}
        100%{transform:scale(1);}
      }

      @media(max-width:980px){
        .add-symbol-btn{
          width:100%!important;
          max-width:none!important;
          min-width:46px!important;
          height:34px!important;
          min-height:34px!important;
          font-size:22px!important;
          border-radius:10px!important;
        }
      }

      @media(max-width:430px){
        .add-symbol-btn{
          height:36px!important;
          min-height:36px!important;
          font-size:24px!important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function limpiarAbonoRapidoCorregido(){
    const abono = document.getElementById("q_monto_abonado");
    if(abono) abono.value = "";
  }

  function animarBotonGuardarRapido(){
    const btn = document.querySelector(".add-symbol-btn");
    if(!btn) return;

    btn.classList.remove("quick-save-ok");
    void btn.offsetWidth;
    btn.classList.add("quick-save-ok");

    setTimeout(() => btn.classList.remove("quick-save-ok"), 900);
  }

  function marcarUltimaFilaGuardada(){
    const primeraFila = document.querySelector("#orderTableBody tr");
    if(!primeraFila) return;

    primeraFila.classList.remove("fila-guardada-ok");
    void primeraFila.offsetWidth;
    primeraFila.classList.add("fila-guardada-ok");

    setTimeout(() => primeraFila.classList.remove("fila-guardada-ok"), 1600);
  }

  function instalarFeedbackGuardado(){
    if(window.__patchComandaFeedbackGuardadoInstalado) return;
    window.__patchComandaFeedbackGuardadoInstalado = true;

    if(typeof window.saveQuickOrder === "function"){
      const originalQuick = window.saveQuickOrder;

      window.saveQuickOrder = async function(){
        const resultado = await originalQuick.apply(this, arguments);

        limpiarAbonoRapidoCorregido();
        animarBotonGuardarRapido();

        if(typeof mostrarToast === "function"){
          mostrarToast("Pedido agregado ✅");
        }

        setTimeout(marcarUltimaFilaGuardada, 120);
        setTimeout(marcarUltimaFilaGuardada, 550);

        return resultado;
      };
    }

    if(typeof window.saveOrder === "function"){
      const originalSave = window.saveOrder;

      window.saveOrder = async function(){
        const eraEdicion = !!window.pedidoEditandoId;
        const resultado = await originalSave.apply(this, arguments);

        if(typeof mostrarToast === "function"){
          mostrarToast(eraEdicion ? "Pedido actualizado ✅" : "Pedido agregado ✅");
        }

        setTimeout(marcarUltimaFilaGuardada, 180);

        return resultado;
      };
    }
  }

  function instalarPatch(){
    asegurarOpcionesFiltroEstado();
    inyectarEstilosComandaPatch();
    instalarFeedbackGuardado();

    if(typeof renderPedidosPaginados === "function"){
      renderPedidosPaginados(false);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(instalarPatch, 250);
    setTimeout(instalarPatch, 900);
    setTimeout(instalarPatch, 1800);
  });

  window.addEventListener("load", function(){
    setTimeout(instalarPatch, 350);
  });

  window.instalarPatchComandaFiltrosBoton = instalarPatch;
})();
