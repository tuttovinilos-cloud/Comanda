console.log("Estadísticas JS conectado");

let pedidosStatsDB = [];

// ---------------------------
// Toast
// ---------------------------
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) {
    alert(msg);
    return;
  }

  el.textContent = msg;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 1800);
}

// ---------------------------
// Normalizar texto
// ---------------------------
function normalizar(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------
// Mostrar nombre bonito
// ---------------------------
function textoBonito(valor, fallback = "Sin dato") {
  const txt = String(valor || "").trim();
  return txt || fallback;
}

// ---------------------------
// Convertir cantidad a número
// ---------------------------
function parseCantidad(valor) {
  if (valor === null || valor === undefined) return 0;

  const texto = String(valor)
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const num = Number(texto);
  return Number.isFinite(num) ? num : 0;
}

// ---------------------------
// Formato número
// ---------------------------
function fmt(num) {
  const n = Number(num || 0);
  return n.toLocaleString("es-VE", {
    maximumFractionDigits: 2
  });
}

// ---------------------------
// Cargar pedidos
// ---------------------------
async function cargarPedidosStats() {
  const { data, error } = await supabaseClient
    .from("pedidos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    console.error("Error cargando estadísticas:", error);
    toast("Error cargando estadísticas");
    return;
  }

  pedidosStatsDB = data || [];
  llenarAnios();
  renderEstadisticas();
  toast("Estadísticas actualizadas");
}

// ---------------------------
// Llenar selector años
// ---------------------------
function llenarAnios() {
  const select = document.getElementById("filterYear");
  if (!select) return;

  const actual = select.value || "all";

  const anios = [...new Set(
    pedidosStatsDB
      .map(p => String(p.fecha || "").slice(0,4))
      .filter(a => /^\d{4}$/.test(a))
  )].sort((a,b) => Number(b) - Number(a));

  select.innerHTML = `<option value="all">Todos los años</option>`;

  anios.forEach(anio => {
    select.insertAdjacentHTML(
      "beforeend",
      `<option value="${anio}">${anio}</option>`
    );
  });

  if (actual && [...select.options].some(o => o.value === actual)) {
    select.value = actual;
  }
}

// ---------------------------
// Aplicar filtros
// ---------------------------
function pedidosFiltrados() {
  const year = document.getElementById("filterYear")?.value || "all";
  const month = document.getElementById("filterMonth")?.value || "all";

  return pedidosStatsDB.filter(p => {
    const fecha = String(p.fecha || "");

    if (year !== "all" && !fecha.startsWith(year)) return false;

    if (month !== "all") {
      const mes = fecha.slice(5,7);
      if (mes !== month) return false;
    }

    return true;
  });
}

// ---------------------------
// Agrupar por clave
// ---------------------------
function agrupar(lista, getKey, getValue = p => parseCantidad(p.cantidad)) {
  const mapa = {};

  lista.forEach(p => {
    const rawKey = getKey(p);
    const keyNorm = normalizar(rawKey);
    const keyShow = textoBonito(rawKey);

    if (!keyNorm) return;

    if (!mapa[keyNorm]) {
      mapa[keyNorm] = {
        key: keyNorm,
        nombre: keyShow,
        total: 0,
        pedidos: 0,
        listos: 0,
        pagados: 0,
        pendientes: 0
      };
    }

    mapa[keyNorm].total += getValue(p);
    mapa[keyNorm].pedidos += 1;

    if (p.estatus_trabajo === "Listo") mapa[keyNorm].listos += 1;
    if (p.estatus_pago === "Pagado") mapa[keyNorm].pagados += 1;
    if (p.estatus_pago !== "Pagado") mapa[keyNorm].pendientes += 1;
  });

  return Object.values(mapa);
}

// ---------------------------
// Render barras
// ---------------------------
function renderRanking(containerId, datos, tipo = "metros", limit = 10) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  if (!datos.length) {
    cont.innerHTML = `<div class="empty">Sin datos</div>`;
    return;
  }

  const ordenados = [...datos]
    .sort((a,b) => {
      const va = tipo === "pedidos" ? a.pedidos : a.total;
      const vb = tipo === "pedidos" ? b.pedidos : b.total;
      return vb - va;
    })
    .slice(0, limit);

  const max = Math.max(...ordenados.map(x => tipo === "pedidos" ? x.pedidos : x.total), 1);

  cont.innerHTML = "";

  ordenados.forEach(item => {
    const valor = tipo === "pedidos" ? item.pedidos : item.total;
    const pct = Math.max((valor / max) * 100, 2);

    const row = `
      <div class="row">
        <div class="row-title" title="${item.nombre}">${item.nombre}</div>
        <div class="row-val">${tipo === "pedidos" ? valor : fmt(valor)}</div>
        <div class="bar-wrap">
          <div class="bar" style="width:${pct}%"></div>
        </div>
      </div>
    `;

    cont.insertAdjacentHTML("beforeend", row);
  });
}

// ---------------------------
// Metros por mes
// ---------------------------
function renderMetrosPorMes(lista) {
  const cont = document.getElementById("metrosPorMes");
  if (!cont) return;

  const meses = {
    "01":"Enero","02":"Febrero","03":"Marzo","04":"Abril",
    "05":"Mayo","06":"Junio","07":"Julio","08":"Agosto",
    "09":"Septiembre","10":"Octubre","11":"Noviembre","12":"Diciembre"
  };

  const mapa = {};

  Object.keys(meses).forEach(m => mapa[m] = {
    nombre: meses[m],
    total: 0,
    pedidos: 0
  });

  lista.forEach(p => {
    const mes = String(p.fecha || "").slice(5,7);
    if (!mapa[mes]) return;

    mapa[mes].total += parseCantidad(p.cantidad);
    mapa[mes].pedidos += 1;
  });

  const datos = Object.entries(mapa).map(([key, val]) => ({
    key,
    nombre: val.nombre,
    total: val.total,
    pedidos: val.pedidos
  }));

  renderRanking("metrosPorMes", datos, "metros", 12);
}

// ---------------------------
// Tabla resumen clientes
// ---------------------------
function renderTablaClientes(datosClientes) {
  const tbody = document.getElementById("tablaClientes");
  if (!tbody) return;

  const ordenados = [...datosClientes]
    .sort((a,b) => b.total - a.total)
    .slice(0, 50);

  if (!ordenados.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">Sin clientes</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  ordenados.forEach(c => {
    const row = `
      <tr>
        <td>${c.nombre}</td>
        <td>${c.pedidos}</td>
        <td>${fmt(c.total)}</td>
        <td><span class="pill green">${c.listos}</span></td>
        <td><span class="pill green">${c.pagados}</span></td>
        <td><span class="pill red">${c.pendientes}</span></td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// ---------------------------
// Render principal
// ---------------------------
function renderEstadisticas() {
  const lista = pedidosFiltrados();

  const totalPedidos = lista.length;
  const totalMetros = lista.reduce((acc,p) => acc + parseCantidad(p.cantidad), 0);
  const clientesUnicos = new Set(lista.map(p => normalizar(p.cliente)).filter(Boolean)).size;
  const listos = lista.filter(p => p.estatus_trabajo === "Listo").length;
  const pagados = lista.filter(p => p.estatus_pago === "Pagado").length;

  document.getElementById("kpiPedidos").textContent = fmt(totalPedidos);
  document.getElementById("kpiMetros").textContent = fmt(totalMetros);
  document.getElementById("kpiClientes").textContent = fmt(clientesUnicos);
  document.getElementById("kpiListos").textContent = fmt(listos);
  document.getElementById("kpiPagados").textContent = fmt(pagados);

  const porCliente = agrupar(lista, p => p.cliente);
  const porMaterial = agrupar(lista, p => p.material);
  const porImpresion = agrupar(lista, p => p.tipo_impresion);
  const porOperador = agrupar(lista, p => p.operador, p => 1);

  renderRanking("topClientes", porCliente, "metros", 10);
  renderRanking("clientesRecurrentes", porCliente, "pedidos", 10);
  renderRanking("materialesUsados", porMaterial, "metros", 10);
  renderRanking("impresionesUsadas", porImpresion, "metros", 10);
  renderRanking("operadoresUsados", porOperador, "pedidos", 10);
  renderMetrosPorMes(lista);
  renderTablaClientes(porCliente);
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", cargarPedidosStats);
