console.log("Estadísticas JS conectado");

let pedidosStatsDB = [];

// ===========================
// SUPABASE SEGURO
// ===========================
function dbStats() {
  return window.supabaseClient;
}

function validarSupabaseStats() {
  if (!dbStats()) {
    console.error("No existe window.supabaseClient. Revisa js/supabase.js");
    toast("No existe conexión Supabase");
    return false;
  }

  return true;
}

// ===========================
// TOAST
// ===========================
function toast(msg) {
  const el = document.getElementById("toast");

  if (!el) {
    console.log(msg);
    return;
  }

  el.textContent = msg;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 1800);
}

// ===========================
// UTILIDADES
// ===========================
function normalizar(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function textoBonito(valor, fallback = "Sin dato") {
  const txt = String(valor || "").trim();
  return txt || fallback;
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCantidad(valor) {
  if (valor === null || valor === undefined) return 0;

  const texto = String(valor)
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const num = Number(texto);
  return Number.isFinite(num) ? num : 0;
}

function fmt(num) {
  const n = Number(num || 0);

  return n.toLocaleString("es-VE", {
    maximumFractionDigits: 2
  });
}

function fechaValida(valor) {
  const fecha = String(valor || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}/.test(fecha)) return null;

  const d = new Date(fecha + "T00:00:00");

  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function fechaCorta(valor) {
  const fecha = String(valor || "").slice(0, 10);
  return fecha || "—";
}

function diasEntre(fechaA, fechaB) {
  const a = fechaValida(fechaA);
  const b = fechaValida(fechaB);

  if (!a || !b) return null;

  const diff = Math.abs(b.getTime() - a.getTime());
  return Math.round(diff / 86400000);
}

function textoFrecuencia(dias) {
  if (dias === null || dias === undefined || !Number.isFinite(Number(dias))) {
    return "Sin recurrencia";
  }

  const d = Math.round(Number(dias));

  if (d <= 0) return "Mismo día";
  if (d === 1) return "Cada 1 día";
  if (d < 30) return `Cada ${d} días`;

  const meses = d / 30;

  if (meses < 12) {
    return `Cada ${meses.toFixed(1)} meses`;
  }

  const años = d / 365;
  return `Cada ${años.toFixed(1)} años`;
}

// ===========================
// CARGAR PEDIDOS
// ===========================
async function cargarPedidosStats() {
  if (!validarSupabaseStats()) return;

  const { data, error } = await dbStats()
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

// ===========================
// LLENAR AÑOS
// ===========================
function llenarAnios() {
  const select = document.getElementById("filterYear");
  if (!select) return;

  const actual = select.value || "all";

  const anios = [...new Set(
    pedidosStatsDB
      .map(p => String(p.fecha || "").slice(0, 4))
      .filter(a => /^\d{4}$/.test(a))
  )].sort((a, b) => Number(b) - Number(a));

  select.innerHTML = `<option value="all">Todos los años</option>`;

  anios.forEach(anio => {
    select.insertAdjacentHTML(
      "beforeend",
      `<option value="${escapeHtml(anio)}">${escapeHtml(anio)}</option>`
    );
  });

  if (actual && [...select.options].some(o => o.value === actual)) {
    select.value = actual;
  }
}

// ===========================
// FILTROS
// ===========================
function pedidosFiltrados() {
  const year = document.getElementById("filterYear")?.value || "all";
  const month = document.getElementById("filterMonth")?.value || "all";

  return pedidosStatsDB.filter(p => {
    const fecha = String(p.fecha || "");

    if (year !== "all" && !fecha.startsWith(year)) return false;

    if (month !== "all") {
      const mes = fecha.slice(5, 7);
      if (mes !== month) return false;
    }

    return true;
  });
}

// ===========================
// AGRUPAR
// ===========================
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
        pendientes: 0,
        fechas: []
      };
    }

    mapa[keyNorm].total += getValue(p);
    mapa[keyNorm].pedidos += 1;

    if (p.estatus_trabajo === "Listo") mapa[keyNorm].listos += 1;
    if (p.estatus_pago === "Pagado") mapa[keyNorm].pagados += 1;
    if (p.estatus_pago !== "Pagado") mapa[keyNorm].pendientes += 1;

    const fecha = String(p.fecha || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      mapa[keyNorm].fechas.push(fecha);
    }
  });

  return Object.values(mapa).map(item => {
    item.fechas = [...new Set(item.fechas)].sort();

    item.primeraFecha = item.fechas[0] || "";
    item.ultimaFecha = item.fechas[item.fechas.length - 1] || "";

    item.frecuenciaDias = calcularFrecuenciaPromedio(item.fechas);
    item.frecuenciaTexto = textoFrecuencia(item.frecuenciaDias);

    return item;
  });
}

function calcularFrecuenciaPromedio(fechas) {
  const limpias = [...new Set(fechas || [])]
    .filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
    .sort();

  if (limpias.length < 2) return null;

  let totalDias = 0;
  let conteo = 0;

  for (let i = 1; i < limpias.length; i++) {
    const dias = diasEntre(limpias[i - 1], limpias[i]);

    if (dias !== null) {
      totalDias += dias;
      conteo++;
    }
  }

  if (!conteo) return null;

  return totalDias / conteo;
}

// ===========================
// RENDER RANKING
// ===========================
function renderRanking(containerId, datos, tipo = "metros", limit = 10) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  if (!datos.length) {
    cont.innerHTML = `<div class="empty">Sin datos</div>`;
    return;
  }

  const ordenados = [...datos]
    .sort((a, b) => {
      const va = tipo === "pedidos" ? a.pedidos : a.total;
      const vb = tipo === "pedidos" ? b.pedidos : b.total;
      return vb - va;
    })
    .slice(0, limit);

  const max = Math.max(
    ...ordenados.map(x => tipo === "pedidos" ? x.pedidos : x.total),
    1
  );

  cont.innerHTML = "";

  ordenados.forEach(item => {
    const valor = tipo === "pedidos" ? item.pedidos : item.total;
    const pct = Math.max((valor / max) * 100, 2);

    const row = `
      <div class="row">
        <div class="row-title" title="${escapeHtml(item.nombre)}">${escapeHtml(item.nombre)}</div>
        <div class="row-val">${tipo === "pedidos" ? fmt(valor) + " pedidos" : fmt(valor)}</div>
        <div class="bar-wrap">
          <div class="bar" style="width:${pct}%"></div>
        </div>
      </div>
    `;

    cont.insertAdjacentHTML("beforeend", row);
  });
}

// ===========================
// RENDER FRECUENCIA CLIENTES
// ===========================
function renderFrecuenciaClientes(datosClientes) {
  const cont = document.getElementById("frecuenciaClientes");
  if (!cont) return;

  const recurrentes = [...datosClientes]
    .filter(c => c.pedidos >= 2 && c.frecuenciaDias !== null)
    .sort((a, b) => {
      if (a.frecuenciaDias !== b.frecuenciaDias) {
        return a.frecuenciaDias - b.frecuenciaDias;
      }

      return b.pedidos - a.pedidos;
    })
    .slice(0, 12);

  if (!recurrentes.length) {
    cont.innerHTML = `<div class="empty">Sin recurrencia todavía</div>`;
    return;
  }

  cont.innerHTML = "";

  const max = Math.max(...recurrentes.map(c => c.frecuenciaDias || 0), 1);

  recurrentes.forEach(c => {
    const pct = Math.max(100 - ((c.frecuenciaDias / max) * 100), 8);

    const row = `
      <div class="row">
        <div class="row-title" title="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</div>
        <div class="row-val">${escapeHtml(c.frecuenciaTexto)}</div>

        <div class="row-sub">
          ${fmt(c.pedidos)} pedidos · 
          Primero: ${escapeHtml(fechaCorta(c.primeraFecha))} · 
          Último: ${escapeHtml(fechaCorta(c.ultimaFecha))}
        </div>

        <div class="bar-wrap">
          <div class="bar" style="width:${pct}%"></div>
        </div>
      </div>
    `;

    cont.insertAdjacentHTML("beforeend", row);
  });
}

// ===========================
// METROS POR MES
// ===========================
function renderMetrosPorMes(lista) {
  const meses = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre"
  };

  const mapa = {};

  Object.keys(meses).forEach(m => {
    mapa[m] = {
      nombre: meses[m],
      total: 0,
      pedidos: 0
    };
  });

  lista.forEach(p => {
    const mes = String(p.fecha || "").slice(5, 7);
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

// ===========================
// TABLA CLIENTES
// ===========================
function renderTablaClientes(datosClientes) {
  const tbody = document.getElementById("tablaClientes");
  if (!tbody) return;

  const ordenados = [...datosClientes]
    .sort((a, b) => {
      if (b.pedidos !== a.pedidos) return b.pedidos - a.pedidos;
      return b.total - a.total;
    })
    .slice(0, 80);

  if (!ordenados.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty">Sin clientes</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  ordenados.forEach(c => {
    const frecuenciaClass = c.frecuenciaDias === null
      ? "yellow"
      : c.frecuenciaDias <= 30
        ? "green"
        : c.frecuenciaDias <= 90
          ? "blue"
          : "yellow";

    const row = `
      <tr>
        <td>${escapeHtml(c.nombre)}</td>
        <td>${fmt(c.pedidos)}</td>
        <td>${fmt(c.total)}</td>
        <td><span class="pill ${frecuenciaClass}">${escapeHtml(c.frecuenciaTexto)}</span></td>
        <td>${escapeHtml(fechaCorta(c.primeraFecha))}</td>
        <td>${escapeHtml(fechaCorta(c.ultimaFecha))}</td>
        <td><span class="pill green">${fmt(c.listos)}</span></td>
        <td><span class="pill green">${fmt(c.pagados)}</span></td>
        <td><span class="pill red">${fmt(c.pendientes)}</span></td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// ===========================
// KPI RECURRENCIA GENERAL
// ===========================
function calcularRecurrenciaGeneral(datosClientes) {
  const recurrentes = datosClientes
    .filter(c => c.pedidos >= 2 && c.frecuenciaDias !== null)
    .map(c => c.frecuenciaDias);

  if (!recurrentes.length) return null;

  const total = recurrentes.reduce((acc, n) => acc + n, 0);
  return total / recurrentes.length;
}

// ===========================
// RENDER PRINCIPAL
// ===========================
function renderEstadisticas() {
  const lista = pedidosFiltrados();

  const totalPedidos = lista.length;
  const totalMetros = lista.reduce((acc, p) => acc + parseCantidad(p.cantidad), 0);
  const clientesUnicos = new Set(lista.map(p => normalizar(p.cliente)).filter(Boolean)).size;
  const listos = lista.filter(p => p.estatus_trabajo === "Listo").length;
  const pagados = lista.filter(p => p.estatus_pago === "Pagado").length;

  const porCliente = agrupar(lista, p => p.cliente);
  const porMaterial = agrupar(lista, p => p.material);
  const porImpresion = agrupar(lista, p => p.tipo_impresion);
  const porOperador = agrupar(lista, p => p.operador, p => 1);

  const recurrenciaGeneral = calcularRecurrenciaGeneral(porCliente);

  const kpiPedidos = document.getElementById("kpiPedidos");
  const kpiMetros = document.getElementById("kpiMetros");
  const kpiClientes = document.getElementById("kpiClientes");
  const kpiListos = document.getElementById("kpiListos");
  const kpiPagados = document.getElementById("kpiPagados");
  const kpiRecurrencia = document.getElementById("kpiRecurrencia");

  if (kpiPedidos) kpiPedidos.textContent = fmt(totalPedidos);
  if (kpiMetros) kpiMetros.textContent = fmt(totalMetros);
  if (kpiClientes) kpiClientes.textContent = fmt(clientesUnicos);
  if (kpiListos) kpiListos.textContent = fmt(listos);
  if (kpiPagados) kpiPagados.textContent = fmt(pagados);
  if (kpiRecurrencia) kpiRecurrencia.textContent = recurrenciaGeneral === null ? "—" : textoFrecuencia(recurrenciaGeneral);

  renderRanking("topClientes", porCliente, "metros", 10);
  renderRanking("clientesRecurrentes", porCliente, "pedidos", 10);
  renderFrecuenciaClientes(porCliente);
  renderRanking("materialesUsados", porMaterial, "metros", 10);
  renderRanking("impresionesUsadas", porImpresion, "metros", 10);
  renderRanking("operadoresUsados", porOperador, "pedidos", 10);
  renderMetrosPorMes(lista);
  renderTablaClientes(porCliente);
}

// ===========================
// INICIO
// ===========================
window.addEventListener("DOMContentLoaded", cargarPedidosStats);