console.log("APP JS conectado correctamente v84 auditoría financiera segura");
console.log("Supabase window:", window.supabaseClient);

let pedidoEditandoId = null;
let pedidosDB = [];
let paginaActualPedidos = 1;
let pedidosPorPagina = 40;
let archivoSeleccionado = null;
let materialesDB = [];
let tiposImpresionDB = [];
let materialesMap = new Map();
let tiposImpresionMap = new Map();
let clientesBusquedaDB = [];
let clientesCatalogoDB = [];
let ultimosPagosPorPedido = new Map();

// Las funciones globales de pago se asignan al final del archivo,
 // cuando ya existen las funciones internas. Así evitamos recursión.

// ===========================
// SUPABASE SEGURO
// ===========================
function db() {
  return window.supabaseClient;
}

function validarSupabase() {
  if (!db()) {
    console.error("No existe window.supabaseClient. Revisa /js/supabase.js");
    alert("No existe conexión Supabase. Revisa /js/supabase.js");
    return false;
  }

  return true;
}

// ===========================
// INDICADOR SUPABASE
// ===========================
function marcarSupabaseActivo() {
  const badge = document.getElementById("storageBadgeText");
  if (badge) badge.textContent = "SUPABASE";

  const badgeBox = document.getElementById("storageBadge");
  if (badgeBox) badgeBox.classList.add("ok");

  const badgeMobile = document.getElementById("storageBadgeTextMobile");
  if (badgeMobile) badgeMobile.textContent = "SUPABASE";

  const badgeMobileBox = document.getElementById("storageBadgeMobile");
  if (badgeMobileBox) badgeMobileBox.classList.add("ok");
}

// ===========================
// UTILIDADES
// ===========================
function normalizarBusqueda(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nombreBonito(valor) {
  const limpio = String(valor || "").trim().replace(/\s+/g, " ");
  if (!limpio) return "";

  return limpio
    .split(" ")
    .map(p => p ? (p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()) : "")
    .join(" ");
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numeroSeguro(valor) {
  const n = Number(String(valor ?? "").replace(/[^0-9,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function money(n) {
  return Number(n || 0).toFixed(2);
}

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");

  if (!toast) {
    console.log(mensaje);
    return;
  }

  toast.textContent = mensaje;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2200);
}


// ===========================
// AUDITORÍA DE CAMBIOS
// ===========================
const AUDITORIA_LABELS = {
  cliente:"Cliente",
  cantidad:"Cantidad",
  tipo_entrega:"Forma de entrega",
  estatus_trabajo:"Estado de trabajo",
  estatus_pago:"Estado de pago",
  pago_simple_total:"Monto de deuda",
  pago_simple_tipo:"Tipo de cuenta",
  pago_simple_pagado:"Pagado / abonado",
  pago_simple_estado:"Estado financiero",
  fecha_entrega:"Fecha de entrega"
};

function valorAuditoriaComparable(v){
  if(v === null || v === undefined) return "";
  if(typeof v === "number") return Math.round(v * 10000) / 10000;
  return String(v);
}

function construirCambiosAuditoria(antes, despues, campos){
  const out = {};
  (campos || []).forEach(campo => {
    const a = valorAuditoriaComparable(antes ? antes[campo] : null);
    const d = valorAuditoriaComparable(despues ? despues[campo] : null);
    if(String(a) === String(d)) return;
    out[campo] = {
      etiqueta:AUDITORIA_LABELS[campo] || campo,
      antes:a === "" ? null : a,
      despues:d === "" ? null : d
    };
  });
  return out;
}

async function registrarAuditoriaPedido(id, tipoEvento, cambios, detalle = "", contexto = {}){
  if(!db() || !id || !cambios || !Object.keys(cambios).length) return;
  const pedido = contexto.pedido || getPedidoPorId(id) || {};
  try{
    const { error } = await db().from("pedidos_auditoria").insert([{
      pedido_id:Number(id),
      cliente_id:contexto.cliente_id || pedido.cliente_id || null,
      cliente_nombre:contexto.cliente_nombre || pedido.cliente || null,
      tipo_evento:String(tipoEvento || "CAMBIO").toUpperCase(),
      origen:"INDEX",
      operador:operadorActualNombre() || null,
      cambios,
      detalle:detalle || null
    }]);
    if(error) console.warn("No se pudo guardar auditoría del pedido:", error);
  }catch(error){
    console.warn("Error guardando auditoría del pedido:", error);
  }
}

function cambiosCreacionPedido(payload){
  return {
    pago_simple_total:{etiqueta:"Monto de deuda",antes:null,despues:numeroSeguro(payload?.pago_simple_total || 0)},
    pago_simple_tipo:{etiqueta:"Tipo de cuenta",antes:null,despues:String(payload?.pago_simple_tipo || "DIVISA")},
    estatus_pago:{etiqueta:"Estado de pago",antes:null,despues:String(payload?.estatus_pago || "Pendiente")}
  };
}


async function aplicarSaldoFavorDisponible(clienteId, tipoPago, pedidoId = null){
  if(!db() || !clienteId) return {ok:true,monto_aplicado:0,pedidos_afectados:0};
  try{
    const { data, error } = await db().rpc("aplicar_saldo_favor_cliente_v1", {
      p_cliente_id:Number(clienteId),
      p_tipo_pago:String(tipoPago || "DIVISA").toUpperCase() === "BCV" ? "BCV" : "DIVISA",
      p_pedido_id:pedidoId ? Number(pedidoId) : null,
      p_operador:operadorActualNombre() || null
    });
    if(error){
      console.warn("No se pudo aplicar saldo a favor automáticamente:", error);
      return {ok:false,error};
    }
    return data || {ok:true,monto_aplicado:0,pedidos_afectados:0};
  }catch(error){
    console.warn("Error aplicando saldo a favor:", error);
    return {ok:false,error};
  }
}

// ===========================
// SESIÓN / PERMISOS
// ===========================
function getOperadorSesionLocal() {
  try {
    return JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
  } catch (e) {
    return null;
  }
}

function esRobertoLocal(op) {
  return String(op && op.nombre ? op.nombre : "")
    .trim()
    .toLowerCase() === "roberto";
}

function puedeModificarOperadorLocal() {
  const op = getOperadorSesionLocal();
  if (!op) return false;
  if (esRobertoLocal(op)) return true;
  return op.puede_modificar_operador === true;
}

function puedeModificarCantidadLocal() {
  const op = getOperadorSesionLocal();
  if (!op) return false;
  if (esRobertoLocal(op)) return true;
  return op.puede_modificar_cantidad === true;
}

// ===========================
// CLIENTES
// ===========================
async function asegurarClienteExiste(nombreCliente) {
  const nombre = String(nombreCliente || "").trim();
  if (!nombre) return { id: null, nombre: "" };

  const nombreNormalizado = normalizarBusqueda(nombre);

  const { data, error } = await db()
    .from("clientes")
    .select("id, nombre")
    .limit(1000);

  if (error) {
    console.warn("No se pudo verificar cliente:", error);
    return { id: null, nombre: nombreBonito(nombre) };
  }

  const clienteExistente = (data || []).find(c => normalizarBusqueda(c.nombre) === nombreNormalizado);

  if (clienteExistente) {
    return {
      id: clienteExistente.id || null,
      nombre: String(clienteExistente.nombre || nombreBonito(nombre)).trim()
    };
  }

  const nombreFinal = nombreBonito(nombre);

  const { data: nuevoCliente, error: insertError } = await db()
    .from("clientes")
    .insert([{
      nombre: nombreFinal,
      tipo_cliente: "Cliente Standar",
      telefono: "",
      correo: "",
      notas: "",
      activo: true
    }])
    .select("id, nombre")
    .single();

  if (insertError) {
    console.warn("No se pudo crear cliente automáticamente:", insertError);
    return { id: null, nombre: nombreFinal };
  }

  console.log("Cliente creado automáticamente:", nombreFinal, "ID:", nuevoCliente?.id);
  return {
    id: nuevoCliente?.id || null,
    nombre: String(nuevoCliente?.nombre || nombreFinal).trim()
  };
}

async function cargarClientesBusqueda() {
  const { data, error } = await db()
    .from("clientes")
    .select("id, nombre, telefono, correo, notas, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.warn("No se pudieron cargar clientes para búsqueda:", error);
    clientesBusquedaDB = [];
    clientesCatalogoDB = [];
    return;
  }

  clientesBusquedaDB = data || [];
  clientesCatalogoDB = [...clientesBusquedaDB];
  renderClienteDatalist();
}

function renderClienteDatalist() {
  const datalist = document.getElementById("clientesDatalist");
  if (!datalist) return;

  datalist.innerHTML = "";

  const usados = new Set();

  clientesCatalogoDB.forEach(c => {
    const nombre = String(c.nombre || "").trim();
    if (!nombre) return;

    const key = normalizarBusqueda(nombre);
    if (!key || usados.has(key)) return;

    usados.add(key);

    const opt = document.createElement("option");
    opt.value = nombre;
    datalist.appendChild(opt);
  });
}

function buscarClienteExactoNormalizado(nombre) {
  const norm = normalizarBusqueda(nombre);
  if (!norm) return null;
  return clientesCatalogoDB.find(c => normalizarBusqueda(c.nombre) === norm) || null;
}

async function resolverNombreClienteAntesDeGuardar(nombreIngresado) {
  const nombre = String(nombreIngresado || "").trim();

  if (!nombre) return { ok: true, nombreFinal: "" };

  const exacto = buscarClienteExactoNormalizado(nombre);

  if (exacto) {
    return { ok: true, nombreFinal: String(exacto.nombre || "").trim() };
  }

  return { ok: true, nombreFinal: nombreBonito(nombre) };
}

async function resolverNombreClienteIdAntesDeGuardar(nombreIngresado) {
  const decision = await resolverNombreClienteAntesDeGuardar(nombreIngresado);
  if (!decision.ok) return { ok: false, id: null, nombreFinal: "" };

  const clienteInfo = await asegurarClienteExiste(decision.nombreFinal || nombreIngresado);

  return {
    ok: true,
    id: clienteInfo && clienteInfo.id ? clienteInfo.id : null,
    nombreFinal: clienteInfo && clienteInfo.nombre ? clienteInfo.nombre : (decision.nombreFinal || nombreBonito(nombreIngresado))
  };
}

// ===========================
// OPERADORES
// ===========================
async function cargarOperadoresComandaDesdeSupabase() {
  const fallback = [
    { nombre: "Roberto" },
    { nombre: "Ricardo" },
    { nombre: "Chico" },
    { nombre: "Carlos" },
    { nombre: "Alejandro" },
    { nombre: "Ruben" },
    { nombre: "Ana" },
    { nombre: "Miguel" }
  ];

  let operadores = fallback;

  try {
    const { data, error } = await db()
      .from("operadores")
      .select("id, nombre, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (!error && Array.isArray(data) && data.length) operadores = data;
  } catch (e) {
    console.warn("No se pudieron cargar operadores:", e);
  }

  llenarSelectOperadores(document.getElementById("q_operador"), operadores, "Operador");
  llenarSelectOperadores(document.getElementById("f_operador"), operadores, "Seleccionar…");
  llenarSelectOperadores(document.getElementById("filterOperador"), operadores, "Operador");
  aplicarOperadorSesion();
}

function llenarSelectOperadores(select, operadores, placeholder) {
  if (!select) return;

  const actual = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;

  operadores.forEach(op => {
    const opt = document.createElement("option");
    opt.value = op.nombre;
    opt.textContent = op.nombre;
    select.appendChild(opt);
  });

  if (actual) select.value = actual;
}

function aplicarOperadorSesion() {
  const op = getOperadorSesionLocal();
  if (!op || !op.nombre) return;

  const puedeCambiar = puedeModificarOperadorLocal();

  ["q_operador", "f_operador"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = op.nombre;
    el.disabled = !puedeCambiar;
  });
}

// ===========================
// CATÁLOGOS
// ===========================
function normalizarCatalogo(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function colorSeguro(v, fallback) {
  const s = String(v || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

function catalogCfg(mapa, nombre) {
  return mapa.get(normalizarCatalogo(nombre)) || {
    color_fondo: "#e5e7eb",
    color_texto: "#111827"
  };
}

function chipCatalogo(nombre, tipo) {
  const raw = String(nombre || "").trim();
  if (!raw || raw === "—") return escapeHtml(raw || "—");

  const mapa = tipo === "impresion" ? tiposImpresionMap : materialesMap;
  const cfg = catalogCfg(mapa, raw);

  return `<span class="catalog-pill" style="background:${escapeHtml(cfg.color_fondo)};color:${escapeHtml(cfg.color_texto)}">${escapeHtml(raw)}</span>`;
}

function opcionesCatalogoIguales(select, lista, placeholder) {
  if (!select) return true;

  const actuales = [...select.options].map(o => o.value).join("|");
  const nuevos = ["", ...lista.map(x => x.nombre)].join("|");

  return actuales === nuevos && select.options[0]?.textContent === placeholder;
}

function pintarSelectCatalogo(select, mapa) {
  if (!select) return;

  const cfg = catalogCfg(mapa, select.value);

  if (select.value) {
    select.classList.add("catalog-select-colored");
    select.style.background = cfg.color_fondo;
    select.style.color = cfg.color_texto;
    select.style.borderColor = cfg.color_fondo;
  } else {
    select.classList.remove("catalog-select-colored");
    select.style.background = "";
    select.style.color = "";
    select.style.borderColor = "";
  }
}

function pintarSelectsCatalogos() {
  pintarSelectCatalogo(document.getElementById("q_material"), materialesMap);
  pintarSelectCatalogo(document.getElementById("f_material"), materialesMap);
  pintarSelectCatalogo(document.getElementById("q_impresion"), tiposImpresionMap);
  pintarSelectCatalogo(document.getElementById("f_impresion"), tiposImpresionMap);
}

document.addEventListener("change", function(e) {
  if (e.target && ["q_material", "f_material", "q_impresion", "f_impresion"].includes(e.target.id)) {
    pintarSelectsCatalogos();
  }
});

// ===========================
// MATERIALES
// ===========================
async function cargarMateriales() {
  let res = await db()
    .from("materiales")
    .select("id, nombre, precio_base, activo, color_fondo, color_texto")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (res.error) {
    const msg = String(res.error.message || "");
    if (msg.includes("color_fondo") || msg.includes("color_texto") || msg.includes("schema cache")) {
      res = await db()
        .from("materiales")
        .select("id, nombre, precio_base, activo")
        .eq("activo", true)
        .order("nombre", { ascending: true });
    }
  }

  if (res.error) {
    console.error("Error cargando materiales:", res.error);
    return;
  }

  materialesDB = res.data || [];

  materialesMap = new Map(materialesDB.map(m => [
    normalizarCatalogo(m.nombre),
    {
      color_fondo: colorSeguro(m.color_fondo, "#e5e7eb"),
      color_texto: colorSeguro(m.color_texto, "#111827")
    }
  ]));

  [document.getElementById("q_material"), document.getElementById("f_material")].forEach(select => {
    if (!select) return;

    const valorActual = select.value;

    if (!opcionesCatalogoIguales(select, materialesDB, "Material")) {
      select.innerHTML = `<option value="">Material</option>`;
      materialesDB.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.nombre;
        opt.textContent = m.nombre;
        select.appendChild(opt);
      });
    }

    if (valorActual) select.value = valorActual;
  });

  pintarSelectsCatalogos();
}

// ===========================
// TIPOS DE IMPRESIÓN
// ===========================
async function cargarTiposImpresion() {
  let res = await db()
    .from("tipos_impresion")
    .select("id, nombre, precio_extra, activo, color_fondo, color_texto")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (res.error) {
    const msg = String(res.error.message || "");
    if (msg.includes("color_fondo") || msg.includes("color_texto") || msg.includes("schema cache")) {
      res = await db()
        .from("tipos_impresion")
        .select("id, nombre, precio_extra, activo")
        .eq("activo", true)
        .order("nombre", { ascending: true });
    }
  }

  if (res.error) {
    console.error("Error cargando tipos de impresión:", res.error);
    return;
  }

  tiposImpresionDB = res.data || [];

  tiposImpresionMap = new Map(tiposImpresionDB.map(t => [
    normalizarCatalogo(t.nombre),
    {
      color_fondo: colorSeguro(t.color_fondo, "#e5e7eb"),
      color_texto: colorSeguro(t.color_texto, "#111827")
    }
  ]));

  [document.getElementById("q_impresion"), document.getElementById("f_impresion")].forEach(select => {
    if (!select) return;

    const valorActual = select.value;

    if (!opcionesCatalogoIguales(select, tiposImpresionDB, "Impresión")) {
      select.innerHTML = `<option value="">Impresión</option>`;
      tiposImpresionDB.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.nombre;
        opt.textContent = t.nombre;
        select.appendChild(opt);
      });
    }

    if (valorActual) select.value = valorActual;
  });

  pintarSelectsCatalogos();
}

// ===========================
// COLORES DE ESTATUS
// ===========================
function claseTrabajo(valor) {
  const estado = valor || "";
  if (estado === "Solicitud") return "status-solicitud";
  if (estado === "En curso") return "status-en-curso estado-en-curso";
  if (estado === "Revisado") return "status-revisado";
  if (estado === "Listo") return "status-listo";
  return "";
}

function clasePago(valor) {
  const estado = valor || "";
  if (estado === "Pendiente") return "pago-pendiente";
  if (estado === "Abonado") return "pago-abonado";
  if (estado === "Pagado") return "pago-pagado";
  return "";
}

function claseAbono(valor) {
  const n = numeroSeguro(valor);
  if (n > 0) return "abono-pos";
  if (n < 0) return "abono-neg";
  return "abono-zero";
}

function claseEntrega(valor) {
  const tipo = normalizarBusqueda(valor);
  if (tipo === "retiro en tienda" || tipo === "retiro") return "entrega-retiro";
  if (tipo === "delivery") return "entrega-delivery";
  if (tipo === "envio") return "entrega-envio";
  return "";
}

function opcionesEntregaHtml(valorActual) {
  const actual = String(valorActual || "");
  return `
    <option value="" ${!actual ? "selected" : ""}>Por definir</option>
    <option value="Retiro en tienda" ${actual === "Retiro en tienda" ? "selected" : ""}>🏪 Retiro</option>
    <option value="Delivery" ${actual === "Delivery" ? "selected" : ""}>🛵 Delivery</option>
    <option value="Envío" ${actual === "Envío" ? "selected" : ""}>📦 Envío</option>
  `;
}

// ===========================
// NOTIFICACIONES
// ===========================
function normalizarEstadoNotificacion(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function esEstadoListo(valor) {
  return normalizarEstadoNotificacion(valor) === "listo";
}

async function resolverOperadorIdPorNombre(nombre) {
  const nombreBuscado = normalizarEstadoNotificacion(nombre);
  if (!nombreBuscado || !db()) return null;

  try {
    const { data, error } = await db()
      .from("operadores")
      .select("id,nombre")
      .eq("activo", true);

    if (error) throw error;

    const encontrado = (data || []).find(op => {
      const n = normalizarEstadoNotificacion(op.nombre);
      const primero = n.split(" ")[0];
      const buscadoPrimero = nombreBuscado.split(" ")[0];
      return n === nombreBuscado || (primero && buscadoPrimero && primero === buscadoPrimero);
    });

    return encontrado ? Number(encontrado.id) : null;
  } catch (e) {
    console.warn("No se pudo resolver operador_id:", e);
    return null;
  }
}

async function crearNotificacionPedidoListoFallback(id, pedidoBase, estadoAnterior, estadoNuevo) {
  if (!db()) return;
  if (!esEstadoListo(estadoNuevo)) return;
  if (esEstadoListo(estadoAnterior)) return;

  const pedido = pedidoBase || pedidosDB.find(p => Number(p.id) === Number(id)) || {};
  const operadorDestino = String(pedido.operador || "").trim();

  if (!operadorDestino) {
    console.warn("No se creó notificación: pedido sin operador", id);
    return;
  }

  try {
    const { data: existente } = await db()
      .from("notificaciones")
      .select("id")
      .eq("pedido_id", id)
      .eq("tipo", "pedido_listo")
      .limit(1);

    if (Array.isArray(existente) && existente.length) return;

    const cliente = String(pedido.cliente || "").trim();
    const descripcion = String(pedido.descripcion || "").trim();
    const operadorDestinoId = await resolverOperadorIdPorNombre(operadorDestino);

    const { error } = await db()
      .from("notificaciones")
      .insert([{
        pedido_id: id,
        destinatario_id: operadorDestinoId,
        para_operador_id: operadorDestinoId,
        destinatario: operadorDestino,
        para_operador: operadorDestino,
        cliente: cliente || null,
        descripcion: descripcion || null,
        mensaje: "El pedido de " + (cliente || "cliente sin nombre") + " ya está listo.",
        visto: false,
        leida: false,
        tipo: "pedido_listo",
        titulo: "Pedido listo"
      }]);

    if (error) {
      console.error("No se pudo crear notificación de pedido listo:", error);
      return;
    }

    if (typeof window.leerNotificaciones === "function") {
      setTimeout(() => window.leerNotificaciones(true), 300);
    }
  } catch (e) {
    console.error("Error creando notificación fallback:", e);
  }
}


// ===========================
// WHATSAPP · PEDIDO LISTO DETALLADO
// ===========================
function normalizarTelefonoWhatsApp(telefono) {
  let numero = String(telefono || "").replace(/\D/g, "");
  if (!numero) return "";

  // Venezuela: 0414XXXXXXX → 58414XXXXXXX
  if (numero.length === 11 && numero.startsWith("0")) {
    numero = "58" + numero.slice(1);
  } else if (numero.length === 10 && !numero.startsWith("58")) {
    numero = "58" + numero;
  }

  return numero;
}

function textoEntregaWhatsApp(valor) {
  const entrega = normalizarBusqueda(valor || "");
  if (entrega === "retiro" || entrega === "retiro en tienda") return "Retiro en tienda";
  if (entrega === "delivery") return "Delivery";
  if (entrega === "envio") return "Envío";
  return "Por definir";
}

function datosPagoWhatsApp(pedido) {
  const deuda = resumenDeudaPedido(pedido || {});

  if (deuda.estado === "sin_monto") {
    return {
      estado: "Sin monto",
      saldo: "Sin monto definido"
    };
  }

  if (deuda.estado === "pagado") {
    return {
      estado: "Pagado",
      saldo: "Sin saldo pendiente"
    };
  }

  if (deuda.estado === "abonado") {
    return {
      estado: "Abonado",
      saldo: deuda.saldoTexto
    };
  }

  return {
    estado: "Pendiente",
    saldo: deuda.saldoTexto
  };
}

async function obtenerClienteWhatsApp(pedido) {
  if (!pedido || !db()) return null;

  const clienteId = pedido.cliente_id || clienteIdPorPedido(pedido);

  if (clienteId) {
    const local = clientesBusquedaDB.find(c => String(c.id) === String(clienteId));
    if (local) return local;

    const { data, error } = await db()
      .from("clientes")
      .select("id,nombre,telefono")
      .eq("id", clienteId)
      .maybeSingle();

    if (!error && data) return data;
  }

  const nombre = normalizarBusqueda(pedido.cliente || "");
  if (!nombre) return null;

  const localPorNombre = clientesBusquedaDB.find(c => normalizarBusqueda(c.nombre) === nombre);
  if (localPorNombre) return localPorNombre;

  const { data, error } = await db()
    .from("clientes")
    .select("id,nombre,telefono")
    .ilike("nombre", String(pedido.cliente || "").trim())
    .limit(1)
    .maybeSingle();

  if (error) console.warn("No se pudo buscar el cliente para WhatsApp:", error);
  return data || null;
}

async function verificarEntregaWhatsApp(wamid) {
  const idMensaje = String(wamid || "").trim();
  if (!idMensaje || !db()) return;

  for (let intento = 0; intento < 12; intento++) {
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const { data, error } = await db()
        .from("whatsapp_mensajes")
        .select("estado,error_code,error_title,error_message")
        .eq("wamid", idMensaje)
        .maybeSingle();

      if (error || !data) continue;

      const estado = String(data.estado || "").toLowerCase();

      if (estado === "delivered" || estado === "read") {
        mostrarToast(
          estado === "read"
            ? "WhatsApp entregado y leído ✅"
            : "WhatsApp entregado ✅"
        );
        return;
      }

      if (estado === "failed") {
        const detalle =
          data.error_message ||
          data.error_title ||
          (data.error_code ? "Código " + data.error_code : "Meta no pudo entregar el mensaje");

        mostrarToast("WhatsApp no entregado: " + String(detalle).slice(0, 120));
        console.error("Fallo de entrega WhatsApp:", data);
        return;
      }
    } catch (e) {
      console.warn("No se pudo consultar el estado de entrega:", e);
    }
  }

  mostrarToast("WhatsApp aceptado · entrega aún pendiente");
}

async function enviarWhatsAppCuandoPedidoListo(id, pedidoBase, estadoAnterior, estadoNuevo) {
  const anterior = normalizarEstadoNotificacion(estadoAnterior);
  const nuevo = normalizarEstadoNotificacion(estadoNuevo);

  // Se envía cuando pasa de cualquier estado distinto de Listo a Listo.
  if (nuevo !== "listo") return;
  if (anterior === "listo") return;
  if (!db()) return;

  try {
    const pedidoActual =
      pedidosDB.find(p => Number(p.id) === Number(id)) ||
      pedidoBase ||
      {};

    // Número fijo de prueba. Todos los avisos llegan aquí.
    const telefono = "584144143004";

    // Plantilla de utilidad para avisar cuando el pedido está listo.
    // Variables:
    // 1) Cliente
    // 2) Entrega
    // 3) Estado del pago
    // 4) Saldo pendiente
    const pagoWhatsApp = datosPagoWhatsApp(pedidoActual);

    const { data, error } = await db().functions.invoke("enviar-whatsapp", {
      body: {
        pedido_id: Number(id),
        to: telefono,
        template: "pedido_listo_utilidad",
        language: "es_ES",
        parameters: [
          pedidoActual.cliente || "Cliente",
          textoEntregaWhatsApp(pedidoActual.tipo_entrega),
          pagoWhatsApp.estado,
          pagoWhatsApp.saldo
        ]
      }
    });

    if (error) throw error;

    if (!data || data.ok !== true) {
      throw new Error(
        data?.error?.message ||
        data?.data?.error?.message ||
        "Meta no confirmó el envío"
      );
    }

    const metaData = data?.data || data;
    const mensajeId =
      metaData?.messages?.[0]?.id ||
      data?.messages?.[0]?.id ||
      null;
    const estadoMeta =
      metaData?.messages?.[0]?.message_status ||
      data?.messages?.[0]?.message_status ||
      "accepted";

    console.log("WhatsApp aceptado por Meta:", {
      pedidoId: id,
      cliente: pedidoActual.cliente || "",
      telefono,
      template: "pedido_listo_utilidad",
      language: "es_ES",
      mensajeId,
      estadoMeta,
      respuestaCompleta: data
    });

    mostrarToast("WhatsApp aceptado por Meta · verificando entrega…");
    if (mensajeId) verificarEntregaWhatsApp(mensajeId);
  } catch (error) {
    console.error("No se pudo enviar WhatsApp para el pedido " + id + ":", error);

    let detalle = "Error desconocido";

    try {
      detalle =
        error?.context?.data?.data?.error?.message ||
        error?.context?.data?.error?.message ||
        error?.context?.data?.error ||
        error?.message ||
        String(error);
    } catch (e) {
      detalle = error?.message || String(error);
    }

    console.error("Detalle exacto de Meta:", detalle);

    const mensajeCorto = String(detalle || "Error desconocido").slice(0, 140);
    mostrarToast("WhatsApp falló: " + mensajeCorto);
  }
}

// ===========================
// CARGAR PEDIDOS
// ===========================
async function cargarUltimosPagosPedidos() {
  ultimosPagosPorPedido = new Map();

  if (!validarSupabase()) return;

  try {
    const { data, error } = await db()
      .from("pedidos_pagos")
      .select("id,pedido_id,monto_recibido,moneda,equivalente_usd,metodo_pago,metodo_otro,referencia,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.warn("No se pudieron cargar últimos pagos:", error);
      return;
    }

    (data || []).forEach(pago => {
      const key = Number(pago.pedido_id || 0);
      if (!key || ultimosPagosPorPedido.has(key)) return;
      ultimosPagosPorPedido.set(key, pago);
    });
  } catch (e) {
    console.warn("No se pudo cargar historial de pagos:", e);
  }
}

async function cargarPedidos(resetPage = true) {
  if (!validarSupabase()) return;

  const { data, error } = await db()
    .from("pedidos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error cargando pedidos:", error);
    alert("Error cargando pedidos: " + error.message);
    return;
  }

  pedidosDB = data || [];
  console.log("Pedidos cargados:", pedidosDB.length);

  await cargarUltimosPagosPedidos();
  renderPedidosPaginados(resetPage);

  if (typeof aplicarPermisosComanda === "function") aplicarPermisosComanda();
}

function getClienteExtraBusqueda(nombreCliente) {
  try {
    const clienteNorm = normalizarBusqueda(nombreCliente);
    const clienteRelacionado = clientesBusquedaDB.find(c => normalizarBusqueda(c.nombre) === clienteNorm);
    return clienteRelacionado ? [clienteRelacionado.telefono, clienteRelacionado.correo, clienteRelacionado.notas].join(" ") : "";
  } catch (e) {
    return "";
  }
}

function pedidoCumpleFiltros(p) {
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
  const deuda = resumenDeudaPedido(p);
  const pagoSimple = typeof resumenPagoSimplePedido === "function" ? resumenPagoSimplePedido(p) : null;
  const ultimoPago = ultimosPagosPorPedido.get(Number(p.id));

  const contenido = normalizarBusqueda([
    p.id,
    p.fecha,
    p.cliente,
    p.descripcion,
    p.cantidad,
    p.material,
    p.tipo_impresion,
    p.tipo_entrega,
    p.precio,
    p.precio_total,
    p.pago_simple_total,
    p.pago_simple_pagado,
    p.pago_simple_saldo,
    p.pago_simple_a_favor,
    p.pago_simple_estado,
    p.pago_simple_tipo,
    p.moneda_deuda,
    p.tipo_tasa_deuda,
    deuda.totalTexto,
    deuda.pagadoTexto,
    deuda.saldoTexto,
    pagoSimple?.estado,
    pagoSimple?.tipo,
    pagoSimple?.fecha,
    ultimoPago?.metodo_pago,
    ultimoPago?.metodo_otro,
    ultimoPago?.referencia,
    p.estatus_trabajo,
    p.estatus_pago,
    p.fecha_entrega,
    p.archivo_nombre,
    getClienteExtraBusqueda(p.cliente)
  ].join(" "));

  if (texto && !contenido.includes(texto)) return false;

  if (estadoFiltro === "Procesos") {
    if (!["Solicitud", "En curso", "Revisado"].includes(estatus)) return false;
  } else if (estadoFiltro && estatus !== estadoFiltro) {
    return false;
  }

  if (pagoFiltro) {
    const f = String(pagoFiltro || "").toUpperCase();
    const item = pagoSimple || resumenPagoSimplePedido(p);
    const total = numeroSeguro(item.total || 0);
    const saldo = numeroSeguro(item.saldo || 0);
    const aFavor = numeroSeguro(item.aFavor || item.favor || 0);
    const estadoSimple = String(item.estado || "").toUpperCase();

    // Filtro simple:
    // Pendiente = todo pedido que todavía debe, tenga abono o no.
    // Pagado = pedido saldado, incluyendo los que quedaron con saldo a favor.
    const pendiente = total > 0.009 && saldo > 0.009 && estadoSimple !== "PAGADO" && estadoSimple !== "A_FAVOR";
    const pagadoCompleto = (total > 0.009 && saldo <= 0.009) || estadoSimple === "PAGADO";
    const pagadoOAFavor = pagadoCompleto || aFavor > 0.009 || estadoSimple === "A_FAVOR";

    if (f === "PENDIENTE" && !pendiente) return false;
    else if (f === "PAGADO" && !pagadoOAFavor) return false;
    else if (!["PENDIENTE","PAGADO"].includes(f) && pago !== pagoFiltro) return false;
  }

  if (operadorFiltro && operador !== operadorFiltro) return false;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;

  return true;
}

function tipoDeudaNormalizado(valor) {
  const v = String(valor || "USD_FIJO").toUpperCase();
  if (v === "BCV" || v === "BS_BCV") return "BS_BCV";
  if (v === "MANUAL" || v === "BS_MANUAL") return "BS_MANUAL";
  return "USD_FIJO";
}

function esDeudaBs(pedido) {
  const tipo = tipoDeudaNormalizado(pedido?.tipo_tasa_deuda || pedido?.tipo_deuda);
  const moneda = String(pedido?.moneda_deuda || "").toUpperCase();
  return moneda === "BS" || tipo === "BS_BCV" || tipo === "BS_MANUAL";
}

function tasaDeudaPedido(pedido) {
  const t = numeroSeguro(pedido?.tasa_deuda || 0);
  return t > 0 ? t : 1;
}

function totalBaseUsdPedido(pedido) {
  if (!pedido) return 0;

  const posibles = [
    pedido.precio_total,
    pedido.total,
    pedido.precio,
    pedido.precio_unitario_calculado
  ];

  for (const valor of posibles) {
    const n = numeroSeguro(valor);
    if (n > 0) return n;
  }

  return 0;
}

function totalBsPedido(pedido) {
  if (!pedido) return 0;
  const guardado = numeroSeguro(pedido.total_bs || 0);
  if (guardado > 0) return guardado;
  return totalBaseUsdPedido(pedido) * tasaDeudaPedido(pedido);
}

function pagadoUsdPedido(pedido) {
  return numeroSeguro(pedido ? pedido.monto_abonado : 0);
}

function pagadoBsPedido(pedido) {
  if (!pedido) return 0;
  const guardado = numeroSeguro(pedido.monto_abonado_bs || 0);
  if (guardado > 0) return guardado;
  if (esDeudaBs(pedido)) return pagadoUsdPedido(pedido) * tasaDeudaPedido(pedido);
  return 0;
}

function formatoBs(valor) {
  return "Bs " + money(valor);
}

function formatoUsd(valor) {
  return "$" + money(valor);
}

function etiquetaTipoDeuda(pedido) {
  const tipo = tipoDeudaNormalizado(pedido?.tipo_tasa_deuda || pedido?.tipo_deuda);
  const tasa = tasaDeudaPedido(pedido);

  if (tipo === "BS_BCV") return "BCV " + money(tasa);
  if (tipo === "BS_MANUAL") return "Tasa " + money(tasa);
  return "Dólares ($)";
}

function resumenDeudaPedido(pedido) {
  const bs = esDeudaBs(pedido);
  const totalUsd = totalBaseUsdPedido(pedido);
  const tasa = tasaDeudaPedido(pedido);
  const total = bs ? totalBsPedido(pedido) : totalUsd;
  const pagado = bs ? pagadoBsPedido(pedido) : pagadoUsdPedido(pedido);
  const saldo = Math.max(total - pagado, 0);
  const estado = total <= 0 ? "sin_monto" : (saldo <= 0.009 ? "pagado" : (pagado > 0 ? "abonado" : "debe"));

  return {
    esBs: bs,
    tipo: tipoDeudaNormalizado(pedido?.tipo_tasa_deuda || pedido?.tipo_deuda),
    tasa,
    total,
    totalUsd,
    totalBs: bs ? total : 0,
    pagado,
    saldo,
    estado,
    totalTexto: bs ? formatoBs(total) : formatoUsd(total),
    pagadoTexto: bs ? formatoBs(pagado) : formatoUsd(pagado),
    saldoTexto: bs ? formatoBs(saldo) : formatoUsd(saldo),
    tipoTexto: etiquetaTipoDeuda(pedido)
  };
}

function payloadDeudaDesdeFormulario(prefijo) {
  const montoBaseUsd = numeroSeguro(document.getElementById(prefijo + "_precio_total")?.value || 0);
  const tipo = tipoDeudaNormalizado(document.getElementById(prefijo + "_tipo_deuda")?.value || "USD_FIJO");
  let tasa = numeroSeguro(document.getElementById(prefijo + "_tasa_deuda")?.value || 1);

  if (tipo === "USD_FIJO") tasa = 1;
  if (tasa <= 0) tasa = 1;

  const esBs = tipo === "BS_BCV" || tipo === "BS_MANUAL";

  return {
    precio_total: montoBaseUsd,
    moneda_deuda: esBs ? "BS" : "USD",
    tipo_tasa_deuda: tipo,
    tasa_deuda: tasa,
    total_bs: esBs ? (montoBaseUsd * tasa) : null
  };
}

function aplicarFormularioDeuda(prefijo, pedido) {
  const monto = totalBaseUsdPedido(pedido);
  const tipo = tipoDeudaNormalizado(pedido?.tipo_tasa_deuda || (esDeudaBs(pedido) ? "BS_BCV" : "USD_FIJO"));
  const tasa = tasaDeudaPedido(pedido);

  const montoEl = document.getElementById(prefijo + "_precio_total");
  const tipoEl = document.getElementById(prefijo + "_tipo_deuda");
  const tasaEl = document.getElementById(prefijo + "_tasa_deuda");

  if (montoEl) montoEl.value = monto > 0 ? money(monto) : "";
  if (tipoEl) tipoEl.value = tipo;
  if (tasaEl) tasaEl.value = tipo === "USD_FIJO" ? "" : money(tasa);

  actualizarVisibilidadTasaDeuda(prefijo);
}

function actualizarVisibilidadTasaDeuda(prefijo) {
  const tipoEl = document.getElementById(prefijo + "_tipo_deuda");
  const tasaEl = document.getElementById(prefijo + "_tasa_deuda");
  const wrap = document.getElementById(prefijo + "_tasa_deuda_wrap");

  const tipo = tipoDeudaNormalizado(tipoEl?.value || "USD_FIJO");
  const mostrar = tipo !== "USD_FIJO";

  if (tasaEl) {
    tasaEl.style.display = mostrar ? "" : "none";
    if (!mostrar) tasaEl.value = "";
  }

  if (wrap) wrap.style.display = mostrar ? "" : "none";
}


function onPagoTipoDeudaChange() {
  const tipo = tipoDeudaNormalizado(getEl("pago_deuda_tipo")?.value || "USD_FIJO");
  const wrap = getEl("pago_deuda_tasa_wrap");
  const tasaEl = getEl("pago_deuda_tasa");

  if (wrap) wrap.style.display = tipo === "USD_FIJO" ? "none" : "";
  if (tasaEl && tipo === "USD_FIJO") tasaEl.value = "";
}

function payloadDeudaDesdePagoModal() {
  const montoBaseUsd = numeroSeguro(getEl("pago_deuda_monto")?.value || 0);
  const tipo = tipoDeudaNormalizado(getEl("pago_deuda_tipo")?.value || "USD_FIJO");
  let tasa = numeroSeguro(getEl("pago_deuda_tasa")?.value || 1);

  if (tipo === "USD_FIJO") tasa = 1;
  if (tasa <= 0) tasa = 1;

  const esBs = tipo === "BS_BCV" || tipo === "BS_MANUAL";

  return {
    precio_total: montoBaseUsd,
    moneda_deuda: esBs ? "BS" : "USD",
    tipo_tasa_deuda: tipo,
    tasa_deuda: tasa,
    total_bs: esBs ? (montoBaseUsd * tasa) : null
  };
}

function pedidoConDeudaPagoModal(pedido) {
  if (!pedido) return pedido;
  const modal = getEl("pagoBackdrop");
  const montoEl = getEl("pago_deuda_monto");
  if (!modal || !montoEl) return pedido;
  return { ...pedido, ...payloadDeudaDesdePagoModal() };
}

function inputAbonoHtml(id, monto) {
  return `
    <div class="abono-wrap">
      <input class="cell-edit abono-edit ${claseAbono(monto)}" data-abono-id="${escapeHtml(id)}" type="number" step="0.01" value="${money(monto)}" title="Editar abono equivalente USD" onclick="event.stopPropagation()"/>
    </div>
  `;
}

function ultimoPagoTexto(id) {
  const pago = ultimosPagosPorPedido.get(Number(id));
  if (!pago) return "";

  const metodo = String(pago.metodo_otro || pago.metodo_pago || "").trim();
  const ref = String(pago.referencia || "").trim();
  const monto = pago.moneda === "BS" ? formatoBs(pago.monto_recibido) : formatoUsd(pago.monto_recibido);

  const partes = [monto, metodo, ref ? "Ref. " + ref : ""].filter(Boolean);
  return partes.join(" · ");
}

function botonPagoHtml(id, pedido) {
  const deuda = resumenDeudaPedido(pedido);
  let texto = "Definir";
  let clase = "pay-sinmonto";

  if (deuda.estado === "pagado") {
    texto = "Pagado";
    clase = "pay-pagado";
  } else if (deuda.estado === "abonado") {
    texto = "Debe " + deuda.saldoTexto;
    clase = "pay-abonado";
  } else if (deuda.estado === "debe") {
    texto = "Debe " + deuda.saldoTexto;
    clase = "pay-debe";
  }

  const ultimo = ultimoPagoTexto(id);

  return `
    <div class="payment-action-wrap">
      <button class="pay-cell-btn ${clase}" type="button" data-pago-id="${escapeHtml(id)}" title="Registrar pago">
        <span>${escapeHtml(texto)}</span>
        <small>${escapeHtml(deuda.tipoTexto)}</small>
      </button>
      ${ultimo ? `<div class="pay-last-info" title="${escapeHtml(ultimo)}">${escapeHtml(ultimo)}</div>` : ""}
    </div>
  `;
}

function deudaCellHtml(pedido) {
  const deuda = resumenDeudaPedido(pedido);
  if (deuda.total <= 0) return `<span class="deuda-pill deuda-empty">Sin monto</span>`;

  return `
    <div class="deuda-cell-wrap">
      <strong>${escapeHtml(deuda.totalTexto)}</strong>
      <span>${escapeHtml(deuda.tipoTexto)}</span>
    </div>
  `;
}

function pedidoFilaHTML(p) {
  const id = Number(p.id);

  const archivo = p.archivo_url
    ? `<a class="file-link-chip" href="${escapeHtml(p.archivo_url)}" target="_blank" onclick="event.stopPropagation()">📎 ${escapeHtml(p.archivo_nombre || "Archivo")}</a>`
    : "—";

  const cantidadDisabled = puedeModificarCantidadLocal() ? "" : "disabled";
  const st = String(p.estatus_trabajo || "Solicitud");
  const pg = String(p.estatus_pago || "Pendiente");
  const entrega = String(p.tipo_entrega || "");
  const abono = numeroSeguro(p.monto_abonado || 0);

  return `
    <tr onclick="openEditOrder(${id})">
      <td>${escapeHtml(p.id)}</td>
      <td>${escapeHtml(p.fecha)}</td>
      <td>${escapeHtml(p.operador)}</td>
      <td>${escapeHtml(p.cliente)}</td>
      <td title="${escapeHtml(p.descripcion)}">${escapeHtml(p.descripcion)}</td>

      <td>
        <input 
          class="cell-edit"
          value="${escapeHtml(p.cantidad)}" 
          onchange="actualizarCampoPedido(${id}, 'cantidad', this.value)"
          onclick="event.stopPropagation()"
          ${cantidadDisabled}
        />
      </td>

      <td>${chipCatalogo(p.material, "material")}</td>
      <td>${chipCatalogo(p.tipo_impresion, "impresion")}</td>
      <td class="tipo-entrega-cell">
        <select
          class="cell-select entrega-select ${claseEntrega(entrega)}"
          onchange="actualizarCampoPedido(${id}, 'tipo_entrega', this.value); this.className='cell-select entrega-select ' + claseEntrega(this.value)"
          onclick="event.stopPropagation()"
          title="Forma de entrega"
        >
          ${opcionesEntregaHtml(entrega)}
        </select>
      </td>

      <td>
        <select 
          class="cell-select ${claseTrabajo(st)}"
          onchange="actualizarCampoPedido(${id}, 'estatus_trabajo', this.value); this.className='cell-select ' + claseTrabajo(this.value)"
          onclick="event.stopPropagation()"
        >
          <option ${st === "Solicitud" ? "selected" : ""}>Solicitud</option>
          <option ${st === "En curso" ? "selected" : ""}>En curso</option>
          <option ${st === "Revisado" ? "selected" : ""}>Revisado</option>
          <option ${st === "Listo" ? "selected" : ""}>Listo</option>
        </select>
      </td>

      <td>
        <select 
          class="cell-select ${clasePago(pg)}"
          onchange="actualizarCampoPedido(${id}, 'estatus_pago', this.value); this.className='cell-select ' + clasePago(this.value)"
          onclick="event.stopPropagation()"
        >
          <option ${pg === "Pendiente" ? "selected" : ""}>Pendiente</option>
          <option ${pg === "Abonado" ? "selected" : ""}>Abonado</option>
          <option ${pg === "Pagado" ? "selected" : ""}>Pagado</option>
        </select>
      </td>

      <td class="abono-cell">${inputAbonoHtml(id, abono)}</td>
      <td class="entrega-cell">${escapeHtml(p.fecha_entrega || "—")}</td>
      <td class="pago-action-cell">${botonPagoHtml(id, p)}</td>
      <td>${archivo}</td>
    </tr>
  `;
}


function renderPaginacionPedidos(total, paginas, inicio, fin) {
  const bar = document.getElementById("paginationBar");
  if (!bar) return;

  if (!total) {
    bar.innerHTML = `<span class="page-info">0 pedidos</span>`;
    return;
  }

  bar.innerHTML = `
    <button class="page-btn" type="button" onclick="cambiarPaginaPedidos(-1)" ${paginaActualPedidos <= 1 ? "disabled" : ""}>← Anterior</button>
    <span class="page-info">${inicio + 1}-${fin} de ${total}</span>
    <span class="page-info">Página ${paginaActualPedidos} / ${paginas}</span>
    <button class="page-btn" type="button" onclick="cambiarPaginaPedidos(1)" ${paginaActualPedidos >= paginas ? "disabled" : ""}>Siguiente →</button>
    <select class="page-select" onchange="cambiarTamanoPaginaPedidos(this.value)">
      <option value="20" ${pedidosPorPagina === 20 ? "selected" : ""}>1-20 por página</option>
      <option value="40" ${pedidosPorPagina === 40 ? "selected" : ""}>1-40 por página</option>
      <option value="100" ${pedidosPorPagina === 100 ? "selected" : ""}>1-100 por página</option>
    </select>
  `;
}

function renderPedidosPaginados(resetPage = false) {
  const tabla = document.getElementById("orderTableBody");
  const emptyState = document.getElementById("emptyState");

  if (!tabla) return;

  const filtrados = pedidosDB
    .filter(pedidoCumpleFiltros)
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  const total = filtrados.length;
  const paginas = Math.max(1, Math.ceil(total / pedidosPorPagina));

  if (resetPage) paginaActualPedidos = 1;
  if (paginaActualPedidos < 1) paginaActualPedidos = 1;
  if (paginaActualPedidos > paginas) paginaActualPedidos = paginas;

  const inicio = (paginaActualPedidos - 1) * pedidosPorPagina;
  const fin = Math.min(inicio + pedidosPorPagina, total);
  const pagina = filtrados.slice(inicio, fin);

  tabla.innerHTML = "";

  if (!total) {
    if (emptyState) {
      emptyState.style.display = "block";
      emptyState.textContent = "— SIN PEDIDOS EN ESTE FILTRO —";
    }
    renderPaginacionPedidos(0, 1, 0, 0);
    return;
  }

  if (emptyState) {
    emptyState.style.display = "none";
    emptyState.textContent = "— SIN PEDIDOS —";
  }

  tabla.innerHTML = pagina.map(pedidoFilaHTML).join("");
  renderPaginacionPedidos(total, paginas, inicio, fin);

  if (typeof aplicarPermisosComanda === "function") aplicarPermisosComanda();
  if (typeof aplicarColoresEstadosYAbonos === "function") setTimeout(aplicarColoresEstadosYAbonos, 30);
}

function cambiarPaginaPedidos(delta) {
  paginaActualPedidos += Number(delta || 0);
  renderPedidosPaginados(false);
}

function cambiarTamanoPaginaPedidos(valor) {
  pedidosPorPagina = Number(valor || 40);
  paginaActualPedidos = 1;
  renderPedidosPaginados(false);
}

window.cambiarPaginaPedidos = cambiarPaginaPedidos;
window.cambiarTamanoPaginaPedidos = cambiarTamanoPaginaPedidos;
window.renderPedidosPaginados = renderPedidosPaginados;

// ===========================
// GUARDAR FILA RÁPIDA
// ===========================
async function saveQuickOrder() {
  if (!validarSupabase()) return;

  let fecha = document.getElementById("q_fecha")?.value || "";
  let operador = document.getElementById("q_operador")?.value || "";
  let cliente = document.getElementById("q_cliente")?.value || "";
  const descripcion = document.getElementById("q_descripcion")?.value || "";
  const cantidad = document.getElementById("q_cantidad")?.value || "";
  const material = document.getElementById("q_material")?.value || "";
  const tipo_impresion = document.getElementById("q_impresion")?.value || "";
  const tipo_entrega = document.getElementById("q_tipo_entrega")?.value || "";
  const estatus_trabajo = document.getElementById("q_estatus_trabajo")?.value || "Solicitud";
  const fecha_entrega = document.getElementById("q_entrega")?.value || null;
  const deudaPayload = payloadDeudaDesdeFormulario("q");

  const opSesion = getOperadorSesionLocal();
  if (!puedeModificarOperadorLocal() && opSesion && opSesion.nombre) operador = opSesion.nombre;
  if (!fecha) fecha = new Date().toISOString().split("T")[0];

  if (!cliente && !descripcion) {
    alert("Coloca al menos cliente o descripción.");
    return;
  }

  const archivoData = await subirArchivoPedido();
  const decisionCliente = await resolverNombreClienteIdAntesDeGuardar(cliente);
  if (!decisionCliente.ok) return;

  cliente = decisionCliente.nombreFinal || cliente;
  const cliente_id = decisionCliente.id || null;
  const tipoCuenta = deudaPayload.moneda_deuda === "BS" ? "BCV" : "DIVISA";
  const pagoPayload = payloadPedidoSimple({
    monto:numeroSeguro(deudaPayload.precio_total || 0),
    tipo:tipoCuenta,
    tasa:tipoCuenta === "BCV" ? numeroSeguro(deudaPayload.tasa_deuda || 0) : 0,
    pagado:0,
    fecha,
    estado:numeroSeguro(deudaPayload.precio_total || 0) > 0 ? "PENDIENTE" : "SIN_MONTO"
  });

  const payload = {
    fecha,
    operador,
    cliente_id,
    cliente,
    descripcion,
    cantidad,
    material,
    tipo_impresion,
    tipo_entrega,
    estatus_trabajo,
    fecha_entrega,
    ...pagoPayload,
    archivo_url: archivoData.archivo_url,
    archivo_nombre: archivoData.archivo_nombre
  };

  const { data:nuevoPedido, error } = await db()
    .from("pedidos")
    .insert([payload])
    .select("id")
    .single();

  if (error) {
    console.error("Error guardando pedido rápido:", error);
    alert("Error guardando pedido: " + error.message);
    return;
  }

  if(nuevoPedido?.id){
    await registrarAuditoriaPedido(
      nuevoPedido.id,
      "DEUDA_CREADA",
      cambiosCreacionPedido(payload),
      "Pedido creado desde fila rápida",
      {cliente_id, cliente_nombre:cliente}
    );
    await aplicarSaldoFavorDisponible(cliente_id, tipoCuenta, nuevoPedido.id);
  }

  archivoSeleccionado = null;
  limpiarFilaRapida();
  ponerFechaHoy();

  await cargarClientesBusqueda();
  await cargarPedidos();

  mostrarToast("Pedido agregado ✅");
  animarGuardadoRapido();
}

// ===========================
// GUARDAR MODAL
// ===========================
async function saveOrder() {
  if (!validarSupabase()) return;

  let fecha = document.getElementById("f_fecha")?.value || "";
  let operador = document.getElementById("f_operador")?.value || "";
  let cliente = document.getElementById("f_cliente")?.value || "";
  const descripcion = document.getElementById("f_descripcion")?.value || "";
  const cantidad = document.getElementById("f_cantidad")?.value || "";
  const material = document.getElementById("f_material")?.value || "";
  const tipo_impresion = document.getElementById("f_impresion")?.value || "";
  const tipo_entrega = document.getElementById("f_tipo_entrega")?.value || "";
  const fecha_entrega = document.getElementById("f_entrega")?.value || null;
  const deudaPayload = payloadDeudaDesdeFormulario("f");
  const pedidoAnterior = pedidoEditandoId ? {...(getPedidoPorId(pedidoEditandoId) || {})} : null;

  const opSesion = getOperadorSesionLocal();
  if (!puedeModificarOperadorLocal() && opSesion && opSesion.nombre) operador = opSesion.nombre;
  if (!fecha) fecha = new Date().toISOString().split("T")[0];

  const decisionCliente = await resolverNombreClienteIdAntesDeGuardar(cliente);
  if (!decisionCliente.ok) return;

  cliente = decisionCliente.nombreFinal || cliente;
  const cliente_id = decisionCliente.id || null;

  const tipoCuentaNuevo = deudaPayload.moneda_deuda === "BS" ? "BCV" : "DIVISA";
  const pagadoActual = pedidoAnterior ? numeroSeguro(pedidoAnterior.pago_simple_pagado || 0) : 0;
  const tipoCuentaAnterior = pedidoAnterior ? tipoPagoSimpleDesdePedido(pedidoAnterior) : tipoCuentaNuevo;
  const totalNuevo = numeroSeguro(deudaPayload.precio_total || 0);

  if(pedidoAnterior && tipoCuentaNuevo !== tipoCuentaAnterior && pagadoActual > 0.009){
    alert(
      `No puedes cambiar este pedido de ${tipoCuentaAnterior} a ${tipoCuentaNuevo} porque ya tiene $${money(pagadoActual)} aplicado.

` +
      `Primero anula/reconcilia el pago desde Clientes.`
    );
    return;
  }

  if(pedidoAnterior && totalNuevo + 0.009 < pagadoActual){
    alert(`El monto de la deuda no puede quedar por debajo de lo ya pagado ($${money(pagadoActual)}).`);
    return;
  }

  const pagoPayload = payloadPedidoSimple({
    monto:totalNuevo,
    tipo:tipoCuentaNuevo,
    tasa:tipoCuentaNuevo === "BCV" ? numeroSeguro(deudaPayload.tasa_deuda || 0) : 0,
    pagado:pagadoActual,
    fecha:pedidoAnterior?.pago_simple_fecha || fecha,
    estado:estadoPagoSimpleDesdeMontos(totalNuevo, pagadoActual)
  });

  const archivoData = await subirArchivoPedido();

  const datosPedido = {
    fecha,
    operador,
    cliente_id,
    cliente,
    descripcion,
    material,
    tipo_impresion,
    tipo_entrega,
    fecha_entrega,
    ...pagoPayload
  };

  if (puedeModificarCantidadLocal() || !pedidoEditandoId) datosPedido.cantidad = cantidad;
  if (archivoData.archivo_url) {
    datosPedido.archivo_url = archivoData.archivo_url;
    datosPedido.archivo_nombre = archivoData.archivo_nombre;
  }

  let error = null;
  let pedidoGuardadoId = pedidoEditandoId;

  if (pedidoEditandoId) {
    const respuesta = await db().from("pedidos").update(datosPedido).eq("id", pedidoEditandoId);
    error = respuesta.error;
  } else {
    datosPedido.estatus_trabajo = "Solicitud";
    const respuesta = await db().from("pedidos").insert([datosPedido]).select("id").single();
    error = respuesta.error;
    pedidoGuardadoId = respuesta.data?.id || null;
  }

  if (error) {
    console.error("Error guardando pedido:", error);
    alert("Error guardando pedido: " + error.message);
    return;
  }

  if(pedidoGuardadoId){
    if(pedidoAnterior){
      const despues = {...pedidoAnterior, ...datosPedido};
      const cambios = construirCambiosAuditoria(
        pedidoAnterior,
        despues,
        ["cliente","cantidad","tipo_entrega","estatus_pago","pago_simple_total","pago_simple_tipo","pago_simple_pagado","pago_simple_estado","fecha_entrega"]
      );
      await registrarAuditoriaPedido(pedidoGuardadoId, "PEDIDO_EDITADO", cambios, "Pedido editado desde modal", {cliente_id,cliente_nombre:cliente});
    }else{
      await registrarAuditoriaPedido(
        pedidoGuardadoId,
        "DEUDA_CREADA",
        cambiosCreacionPedido(datosPedido),
        "Pedido creado desde modal",
        {cliente_id,cliente_nombre:cliente}
      );
    }
    await aplicarSaldoFavorDisponible(cliente_id, tipoCuentaNuevo, pedidoGuardadoId);
  }

  pedidoEditandoId = null;
  archivoSeleccionado = null;
  closeModal("orderBackdrop");

  await cargarClientesBusqueda();
  await cargarPedidos();

  mostrarToast("Pedido guardado ✅");
}

// ===========================
// ACTUALIZAR CAMPO RÁPIDO
// ===========================
async function actualizarCampoPedido(id, campo, valor) {
  if (!validarSupabase()) return;

  const pedidoOriginal = pedidosDB.find(p => Number(p.id) === Number(id));
  const valorAnteriorPedidoOriginal = pedidoOriginal ? pedidoOriginal[campo] : undefined;

  if (campo === "cantidad" && !puedeModificarCantidadLocal()) {
    alert("No tienes permiso para modificar cantidad.");
    await cargarPedidos(false);
    return;
  }

  if (campo === "operador" && !puedeModificarOperadorLocal()) {
    alert("No tienes permiso para modificar operador.");
    await cargarPedidos(false);
    return;
  }

  window.__COMANDA_SUPRIMIR_REFRESH_PEDIDOS_HASTA = Date.now() + 2500;

  const pedidoLocal = pedidosDB.find(p => Number(p.id) === Number(id));
  const valorAnteriorLocal = pedidoLocal ? pedidoLocal[campo] : undefined;

  if (pedidoLocal) pedidoLocal[campo] = valor;

  const { error } = await db()
    .from("pedidos")
    .update({ [campo]: valor })
    .eq("id", id);

  if (error) {
    console.error("Error actualizando campo:", error);
    if (pedidoLocal) pedidoLocal[campo] = valorAnteriorLocal;
    alert("Error actualizando: " + error.message);
    return;
  }

  if(String(valorAnteriorPedidoOriginal ?? "") !== String(valor ?? "")) {
    await registrarAuditoriaPedido(
      id,
      "CAMBIO_RAPIDO",
      {
        [campo]:{
          etiqueta:AUDITORIA_LABELS[campo] || campo,
          antes:valorAnteriorPedidoOriginal ?? null,
          despues:valor ?? null
        }
      },
      "Cambio realizado desde la tabla"
    );
  }

  if (campo === "estatus_trabajo") {
    await crearNotificacionPedidoListoFallback(id, pedidoOriginal, valorAnteriorPedidoOriginal, valor);
    await enviarWhatsAppCuandoPedidoListo(id, pedidoOriginal, valorAnteriorPedidoOriginal, valor);
  }
}

async function actualizarAbonoPedido(id, monto) {
  alert("Los abonos se registran desde el botón Pago para conservar el historial y la conciliación.");
  await cargarPedidos(false);
  return false;
}


// ===========================
// PAGO SIMPLE DEFINITIVO V58
// ===========================
const PAGO_SIMPLE_VERSION = "v84_auditoria_financiera_segura";
const PAGO_SIMPLE_NOTA = "PAGO_SIMPLE_V58";
const PAGO_UNIFICADO_NOTA = "PAGO_UNIFICADO_V1";
let pagoSimpleGuardando = false;
let pagoSimpleOperacionUUIDPendiente = null;
let pagoSimpleActualId = null;
let pagoSimpleHistorialActual = [];

function fechaISO() {
  return new Date().toISOString().split("T")[0];
}

function fechaCortaPagoSimple(iso) {
  if (!iso) return "";
  const p = String(iso).slice(0, 10).split("-");
  if (p.length !== 3) return String(iso).slice(0, 10);
  return p[2] + "/" + p[1];
}

function tipoPagoSimpleDesdePedido(pedido) {
  const simple = String(pedido?.pago_simple_tipo || "").toUpperCase().trim();
  if (simple === "BCV" || simple === "DIVISA") return simple;

  const tipo = String(pedido?.tipo_tasa_deuda || "").toUpperCase();
  const moneda = String(pedido?.moneda_deuda || "").toUpperCase();
  if (tipo.includes("BCV") || moneda === "BS") return "BCV";
  return "DIVISA";
}

function totalPagoSimplePedido(pedido) {
  // Para no arrastrar pagos viejos, el sistema nuevo solo toma pago_simple_total.
  return numeroSeguro(pedido?.pago_simple_total || 0);
}

function pagadoPagoSimplePedido(pedido) {
  // Para no arrastrar abonos viejos, el sistema nuevo solo toma pago_simple_pagado.
  return numeroSeguro(pedido?.pago_simple_pagado || 0);
}

function tasaPagoSimplePedido(pedido) {
  const t = numeroSeguro(pedido?.tasa_deuda || 0);
  return t > 0 ? t : 0;
}

function estadoPagoSimpleDesdeMontos(total, pagado) {
  total = numeroSeguro(total);
  pagado = numeroSeguro(pagado);
  if (total <= 0) return "SIN_MONTO";
  if (pagado > total + 0.009) return "A_FAVOR";
  if (pagado >= total - 0.009) return "PAGADO";
  if (pagado > 0.009) return "ABONADO";
  return "PENDIENTE";
}

function estadoSupabaseDesdePagoSimple(estado) {
  const e = String(estado || "").toUpperCase();
  if (e === "PAGADO" || e === "A_FAVOR") return "Pagado";
  if (e === "ABONADO") return "Abonado";
  return "Pendiente";
}

function textoTipoPagoSimple(item) {
  if (item.tipo === "BCV") return item.tasa > 0 ? "BCV " + money(item.tasa) : "BCV";
  return "Divisa";
}

function resumenPagoSimplePedido(pedido) {
  const total = totalPagoSimplePedido(pedido);
  const pagado = pagadoPagoSimplePedido(pedido);
  const saldo = Math.max(total - pagado, 0);
  const aFavor = Math.max(pagado - total, 0);
  const tipo = tipoPagoSimpleDesdePedido(pedido);
  const tasa = tasaPagoSimplePedido(pedido);
  const estadoGuardado = String(pedido?.pago_simple_estado || "").toUpperCase();
  const estado = estadoGuardado && estadoGuardado !== "PENDIENTE_PAGO"
    ? estadoGuardado
    : estadoPagoSimpleDesdeMontos(total, pagado);

  return {
    id: Number(pedido?.id || 0),
    monto: total,
    total,
    pagado,
    saldo,
    aFavor,
    favor: aFavor,
    tipo,
    tasa,
    estado,
    fecha: pedido?.pago_simple_fecha || ""
  };
}

// Reemplazo del resumen viejo para búsquedas/filtros.
function resumenDeudaPedido(pedido) {
  const r = resumenPagoSimplePedido(pedido);
  return {
    esBs: r.tipo === "BCV",
    tipo: r.tipo === "BCV" ? "BS_BCV" : "USD_FIJO",
    tasa: r.tasa || 1,
    total: r.total,
    totalUsd: r.total,
    totalBs: r.tipo === "BCV" && r.tasa > 0 ? r.total * r.tasa : 0,
    pagado: r.pagado,
    saldo: r.saldo,
    estado: r.estado === "PAGADO" || r.estado === "A_FAVOR" ? "pagado" : (r.estado === "ABONADO" ? "abonado" : (r.estado === "PENDIENTE" ? "debe" : "sin_monto")),
    totalTexto: formatoUsd(r.total),
    pagadoTexto: formatoUsd(r.pagado),
    saldoTexto: formatoUsd(r.saldo),
    tipoTexto: textoTipoPagoSimple(r)
  };
}

function payloadPagoSimpleInicial(deudaPayload, montoAbonado, fecha) {
  const total = numeroSeguro(deudaPayload?.precio_total || 0);
  const pagado = numeroSeguro(montoAbonado || 0);
  const tipo = deudaPayload?.moneda_deuda === "BS" ? "BCV" : "DIVISA";
  const estado = estadoPagoSimpleDesdeMontos(total, pagado);

  return {
    estatus_pago: estadoSupabaseDesdePagoSimple(estado),
    pago_simple_total: total,
    pago_simple_tipo: tipo,
    pago_simple_pagado: pagado,
    pago_simple_saldo: Math.max(total - pagado, 0),
    pago_simple_a_favor: Math.max(pagado - total, 0),
    pago_simple_estado: estado,
    pago_simple_fecha: fecha || fechaISO(),
    pago_simple_actualizado_en: new Date().toISOString()
  };
}

function payloadPedidoSimple(itemFinal) {
  const total = numeroSeguro(itemFinal.monto);
  const pagado = numeroSeguro(itemFinal.pagado);
  const tipo = itemFinal.tipo === "BCV" ? "BCV" : "DIVISA";
  const tasa = tipo === "BCV" && numeroSeguro(itemFinal.tasa) > 0 ? numeroSeguro(itemFinal.tasa) : 1;
  const estadoManual = String(itemFinal.estado || "").toUpperCase();
  const cierreSinMonto = estadoManual === "PAGADO" && total <= 0.009;
  const estado = cierreSinMonto ? "PAGADO" : estadoPagoSimpleDesdeMontos(total, pagado);
  const saldo = cierreSinMonto ? 0 : Math.max(total - pagado, 0);
  const aFavor = cierreSinMonto ? 0 : Math.max(pagado - total, 0);

  return {
    precio_total: total,
    monto_abonado: pagado,
    estatus_pago: estadoSupabaseDesdePagoSimple(estado),
    moneda_deuda: tipo === "BCV" ? "BS" : "USD",
    tipo_tasa_deuda: tipo === "BCV" ? "BS_BCV" : "USD_FIJO",
    tasa_deuda: tasa,
    total_bs: tipo === "BCV" ? total * tasa : null,
    monto_abonado_bs: tipo === "BCV" ? pagado * tasa : 0,
    pago_simple_total: total,
    pago_simple_tipo: tipo,
    pago_simple_pagado: pagado,
    pago_simple_saldo: saldo,
    pago_simple_a_favor: aFavor,
    pago_simple_estado: estado,
    pago_simple_fecha: itemFinal.fecha || fechaISO(),
    pago_simple_actualizado_en: new Date().toISOString()
  };
}

function htmlBotonPagoSimple(id, pedido) {
  const item = resumenPagoSimplePedido(pedido || getPedidoPorId(id));
  let clase = "simple-sin";
  let titulo = "Definir";
  let sub = "Sin monto";

  // Los pedidos viejos cerrados pueden estar PAGADOS aunque no tengan monto.
  // En ese caso deben verse como pagados, no como "Definir / Sin monto".
  if (item.estado === "PAGADO" && item.total <= 0.009) {
    clase = "simple-ok";
    titulo = "Listo";
    sub = "Sin monto" + (item.fecha ? " · " + fechaCortaPagoSimple(item.fecha) : "");
  } else if (item.estado === "A_FAVOR" && item.total <= 0.009) {
    clase = "simple-favor";
    titulo = "A favor $" + money(item.aFavor);
    sub = "Cerrado" + (item.fecha ? " · " + fechaCortaPagoSimple(item.fecha) : "");
  } else if (item.total > 0) {
    if (item.aFavor > 0.009 || item.estado === "A_FAVOR") {
      clase = "simple-favor";
      titulo = "A favor $" + money(item.aFavor);
      sub = "Pagó $" + money(item.pagado) + (item.fecha ? " · " + fechaCortaPagoSimple(item.fecha) : "");
    } else if (item.estado === "PAGADO" || item.pagado >= item.total - 0.009) {
      clase = "simple-ok";
      titulo = "Pagado $" + money(item.total);
      sub = textoTipoPagoSimple(item) + (item.fecha ? " · " + fechaCortaPagoSimple(item.fecha) : "");
    } else if (item.estado === "ABONADO" || item.pagado > 0.009) {
      clase = "simple-abono";
      titulo = "Debe $" + money(item.saldo);
      sub = "Abonó $" + money(item.pagado) + (item.fecha ? " · " + fechaCortaPagoSimple(item.fecha) : "");
    } else {
      clase = "simple-debe";
      titulo = "Debe $" + money(item.total);
      sub = textoTipoPagoSimple(item) + (item.fecha ? " · " + fechaCortaPagoSimple(item.fecha) : "");
    }
  }

  return `<button class="pay-simple-btn ${clase}" type="button" data-simple-pago-id="${escapeHtml(id)}">
    <span>${escapeHtml(titulo)}</span>
    <small>${escapeHtml(sub)}</small>
  </button>`;
}

// Reemplaza el botón viejo del app sin tocar el HTML.
function botonPagoHtml(id, pedido) {
  return htmlBotonPagoSimple(id, pedido);
}

function deudaCellHtml(pedido) {
  const item = resumenPagoSimplePedido(pedido);
  if (item.total <= 0) return `<span class="deuda-pill deuda-empty">Sin monto</span>`;
  return `<div class="deuda-cell-wrap"><strong>${escapeHtml(formatoUsd(item.total))}</strong><span>${escapeHtml(textoTipoPagoSimple(item))}</span></div>`;
}

function getPedidoPorId(id) {
  return pedidosDB.find(p => Number(p.id) === Number(id)) || null;
}

function totalAbonosPagoSimple(abonos) {
  return (Array.isArray(abonos) ? abonos : []).reduce((s, a) => {
    if (!a || a.anulado) return s;
    return s + numeroSeguro(a.monto);
  }, 0);
}

function crearOperacionUUIDPagoSimple() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch (e) {}

  const hex = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return hex.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function setPagoSimpleProcesando(procesando) {
  pagoSimpleGuardando = !!procesando;

  const btn = document.getElementById("pagoSimpleGuardar");
  if (btn) {
    if (!btn.dataset.textoOriginal) btn.dataset.textoOriginal = btn.textContent || "Guardar";
    btn.disabled = !!procesando;
    btn.textContent = procesando ? "Procesando..." : (btn.dataset.textoOriginal || "Guardar");
  }

  [
    "pagoSimpleMonto",
    "pagoSimpleTipo",
    "pagoSimpleTasa",
    "pagoSimpleAccion",
    "pagoSimpleAbono",
    "pagoSimpleFecha"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !!procesando;
  });

  const cerrar = document.getElementById("pagoSimpleCerrar");
  const cancelar = document.getElementById("pagoSimpleCancelar");
  if (cerrar) cerrar.disabled = !!procesando;
  if (cancelar) cancelar.disabled = !!procesando;
}

function esRobertoSesion() {
  return esRobertoLocal(getOperadorSesionLocal());
}

function setTextPagoSimple(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function crearModalPagoSimple() {
  if (document.getElementById("pagoSimpleBackdrop")) return;

  const modal = document.createElement("div");
  modal.className = "backdrop modal-backdrop pago-simple-backdrop";
  modal.id = "pagoSimpleBackdrop";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal pago-simple-modal" style="max-width:580px">
      <div class="modal-header">
        <h2>Pago del pedido</h2>
        <button class="modal-close" type="button" id="pagoSimpleCerrar">✕</button>
      </div>
      <div class="modal-body">
        <div class="simple-kpi-grid">
          <div class="simple-kpi-card"><span>Total</span><strong id="pagoSimpleKpiTotal">$0.00</strong></div>
          <div class="simple-kpi-card"><span>Pagado</span><strong id="pagoSimpleKpiPagado">$0.00</strong></div>
          <div class="simple-kpi-card"><span>Saldo</span><strong id="pagoSimpleKpiSaldo">$0.00</strong></div>
          <div class="simple-kpi-card simple-kpi-favor" id="pagoSimpleKpiFavorCard"><span>A favor</span><strong id="pagoSimpleKpiFavor">$0.00</strong></div>
        </div>

        <div class="simple-resumen" id="pagoSimpleResumen">Sin monto definido</div>

        <div class="simple-grid-3">
          <div class="field">
            <label>Monto que debe</label>
            <input type="number" id="pagoSimpleMonto" step="0.01" placeholder="Ej: 100.00"/>
          </div>
          <div class="field">
            <label>Tipo</label>
            <select id="pagoSimpleTipo">
              <option value="DIVISA">Divisa</option>
              <option value="BCV">BCV</option>
            </select>
          </div>
          <div class="field" id="pagoSimpleTasaWrap">
            <label>Tasa</label>
            <input type="number" id="pagoSimpleTasa" step="0.0001" placeholder="Ej: 40.00"/>
          </div>
        </div>

        <div class="simple-grid-3 simple-grid-action">
          <div class="field simple-action-field">
            <label>Acción</label>
            <select id="pagoSimpleAccion">
              <option value="PENDIENTE">Pendiente</option>
              <option value="ABONO">Agregar abono</option>
              <option value="LISTO">Listo / pagar restante</option>
            </select>
          </div>
          <div class="field" id="pagoSimpleAbonoWrap">
            <label>Nuevo abono</label>
            <input type="number" id="pagoSimpleAbono" step="0.01" placeholder="Ej: 20.00"/>
          </div>
          <div class="field simple-date-field">
            <label>Fecha</label>
            <input type="date" id="pagoSimpleFecha"/>
          </div>
        </div>

        <div class="simple-historial" id="pagoSimpleHistorial"></div>
      </div>
      <div class="modal-footer simple-modal-footer">
        <button class="btn-add secondary" type="button" id="pagoSimpleCancelar">Cancelar</button>
        <button class="btn-add" type="button" id="pagoSimpleGuardar">Guardar</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  modal.addEventListener("click", e => {
    const borrar = e.target && e.target.closest ? e.target.closest(".simple-delete-pay") : null;
    if (borrar) {
      e.preventDefault();
      e.stopPropagation();
      eliminarPagoSimple(Number(borrar.dataset.pagoId || 0));
      return;
    }
    if (e.target === modal) cerrarModalPagoSimple();
  });

  document.getElementById("pagoSimpleCerrar")?.addEventListener("click", cerrarModalPagoSimple);
  document.getElementById("pagoSimpleCancelar")?.addEventListener("click", cerrarModalPagoSimple);
  document.getElementById("pagoSimpleGuardar")?.addEventListener("click", guardarPagoSimple);
  ["pagoSimpleTipo", "pagoSimpleAccion", "pagoSimpleMonto", "pagoSimpleTasa", "pagoSimpleAbono", "pagoSimpleFecha"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", pintarModalPagoSimple);
    document.getElementById(id)?.addEventListener("change", pintarModalPagoSimple);
  });
}

async function cargarHistorialPagoSimple(id) {
  if (!db()) return [];

  try {
    const { data, error } = await db()
      .from("pedidos_pagos")
      .select("id,cliente_pago_id,monto_recibido,monto_aplicado,fecha_pago,tipo_movimiento,metodo_pago,nota,created_at")
      .eq("pedido_id", id)
      .order("id", { ascending: true });

    if (error) {
      console.warn("No se pudo leer historial de pago simple:", error);
      return [];
    }

    const movimientos = (data || []).filter(p => {
      const nota = String(p.nota || "");
      return nota === PAGO_SIMPLE_NOTA ||
             nota === PAGO_UNIFICADO_NOTA ||
             Number(p.cliente_pago_id || 0) > 0;
    });

    const parentIds = [...new Set(
      movimientos
        .map(p => Number(p.cliente_pago_id || 0))
        .filter(Boolean)
    )];

    const padresMap = new Map();

    if (parentIds.length) {
      const { data: padres, error: errorPadres } = await db()
        .from("clientes_pagos")
        .select("id,estado,origen,monto_recibido,tipo_pago,metodo_pago,fecha_pago,anulado_en,anulado_por,motivo_anulacion")
        .in("id", parentIds);

      if (errorPadres) {
        console.warn("No se pudieron leer entradas de pago:", errorPadres);
      } else {
        (padres || []).forEach(p => padresMap.set(Number(p.id), p));
      }
    }

    return movimientos.map(p => {
      const parentId = Number(p.cliente_pago_id || 0) || null;
      const parent = parentId ? padresMap.get(parentId) : null;
      const anulado = parent ? String(parent.estado || "ACTIVO").toUpperCase() === "ANULADO" : false;

      return {
        pagoId: Number(p.id),
        clientePagoId: parentId,
        monto: numeroSeguro(p.monto_aplicado || p.monto_recibido || 0),
        fecha: String(p.fecha_pago || p.created_at || fechaISO()).slice(0, 10),
        auto: String(p.tipo_movimiento || p.metodo_pago || "").toUpperCase().includes("LISTO"),
        anulado,
        origen: parent ? String(parent.origen || "") : "LEGACY",
        entradaMonto: parent ? numeroSeguro(parent.monto_recibido || 0) : 0,
        tipoPago: parent ? String(parent.tipo_pago || "") : tipoPagoSimpleDesdePedido(getPedidoPorId(id) || {}),
        metodoPago: parent ? String(parent.metodo_pago || "") : String(p.metodo_pago || ""),
        anuladoPor: parent ? String(parent.anulado_por || "") : "",
        motivoAnulacion: parent ? String(parent.motivo_anulacion || "") : ""
      };
    }).filter(a => numeroSeguro(a.monto) > 0);
  } catch (e) {
    console.warn("Error leyendo historial de pago simple:", e);
    return [];
  }
}

function itemModalPagoSimple() {
  const pedido = getPedidoPorId(pagoSimpleActualId);
  const base = resumenPagoSimplePedido(pedido || {});
  const abonos = Array.isArray(pagoSimpleHistorialActual) ? pagoSimpleHistorialActual : [];

  return {
    id: pagoSimpleActualId,
    monto: numeroSeguro(document.getElementById("pagoSimpleMonto")?.value || base.monto || 0),
    tipo: document.getElementById("pagoSimpleTipo")?.value || base.tipo || "DIVISA",
    tasa: numeroSeguro(document.getElementById("pagoSimpleTasa")?.value || base.tasa || 0),
    pagado: numeroSeguro(base.pagado || 0),
    estado: base.estado,
    fecha: document.getElementById("pagoSimpleFecha")?.value || base.fecha || fechaISO(),
    abonos
  };
}

async function abrirModalPagoSimple(id) {
  let pedido = getPedidoPorId(id);
  if (!pedido) {
    alert("No se encontró el pedido. Recarga la página y prueba de nuevo.");
    return false;
  }

  const clienteId = clienteIdPorPedido(pedido);
  if(clienteId){
    const credito = await aplicarSaldoFavorDisponible(clienteId, tipoPagoSimpleDesdePedido(pedido), id);
    if(numeroSeguro(credito?.monto_aplicado || 0) > 0.009){
      await cargarPedidos(false);
      pedido = getPedidoPorId(id) || pedido;
      mostrarToast("Saldo a favor aplicado automáticamente ✅");
    }
  }

  crearModalPagoSimple();
  pagoSimpleOperacionUUIDPendiente = null;
  setPagoSimpleProcesando(false);
  pagoSimpleActualId = Number(id);
  pagoSimpleHistorialActual = await cargarHistorialPagoSimple(id);

  const item = resumenPagoSimplePedido(pedido);

  document.getElementById("pagoSimpleMonto").value = item.monto > 0 ? money(item.monto) : "";
  document.getElementById("pagoSimpleTipo").value = item.tipo || "DIVISA";
  document.getElementById("pagoSimpleTasa").value = item.tasa > 0 ? money(item.tasa) : "";
  document.getElementById("pagoSimpleAccion").value = item.monto > 0 && item.pagado > 0 ? "ABONO" : "PENDIENTE";
  document.getElementById("pagoSimpleFecha").value = item.fecha || fechaISO();
  document.getElementById("pagoSimpleAbono").value = "";

  pintarModalPagoSimple();
  document.getElementById("pagoSimpleBackdrop").style.display = "flex";
  return false;
}

function cerrarModalPagoSimple() {
  if (pagoSimpleGuardando) return;
  const modal = document.getElementById("pagoSimpleBackdrop");
  if (modal) modal.style.display = "none";
  pagoSimpleActualId = null;
  pagoSimpleHistorialActual = [];
  pagoSimpleOperacionUUIDPendiente = null;
  setPagoSimpleProcesando(false);
}

function pintarModalPagoSimple() {
  const item = itemModalPagoSimple();
  const accion = document.getElementById("pagoSimpleAccion")?.value || "PENDIENTE";
  const tipo = item.tipo || "DIVISA";
  const wrapTasa = document.getElementById("pagoSimpleTasaWrap");
  const wrapAbono = document.getElementById("pagoSimpleAbonoWrap");

  if (wrapTasa) wrapTasa.style.display = tipo === "BCV" ? "" : "none";
  if (wrapAbono) wrapAbono.style.display = accion === "ABONO" ? "" : "none";
  if (document.getElementById("pagoSimpleFecha") && !document.getElementById("pagoSimpleFecha").value) {
    document.getElementById("pagoSimpleFecha").value = fechaISO();
  }

  let totalPreview = item.monto;
  let pagadoPreview = item.pagado;
  let accionTexto = "Se guardará como pendiente";
  const nuevoAbono = accion === "ABONO" ? numeroSeguro(document.getElementById("pagoSimpleAbono")?.value || 0) : 0;

  if (accion === "ABONO") {
    pagadoPreview += nuevoAbono;
    accionTexto = nuevoAbono > 0 ? "Se agregará abono " + tipo + " de $" + money(nuevoAbono) : "Coloca el monto del abono";
  }

  if (accion === "LISTO") {
    pagadoPreview = item.pagado > item.monto ? item.pagado : item.monto;
    accionTexto = "Se completará automáticamente el saldo restante";
  }

  const saldo = Math.max(totalPreview - pagadoPreview, 0);
  const favor = Math.max(pagadoPreview - totalPreview, 0);
  const estadoTexto = favor > 0.009 ? "A favor $" + money(favor) : "Saldo $" + money(saldo);
  const fecha = document.getElementById("pagoSimpleFecha")?.value || fechaISO();

  setTextPagoSimple("pagoSimpleKpiTotal", "$" + money(totalPreview));
  setTextPagoSimple("pagoSimpleKpiPagado", "$" + money(pagadoPreview));
  setTextPagoSimple("pagoSimpleKpiSaldo", "$" + money(saldo));
  setTextPagoSimple("pagoSimpleKpiFavor", "$" + money(favor));

  const favorCard = document.getElementById("pagoSimpleKpiFavorCard");
  if (favorCard) favorCard.classList.toggle("is-active", favor > 0.009);

  const resumen = item.monto > 0
    ? `${estadoTexto} · ${textoTipoPagoSimple(item)} · Fecha ${fechaCortaPagoSimple(fecha)} · ${accionTexto}`
    : `Sin monto · Fecha ${fechaCortaPagoSimple(fecha)} · Al guardar se preguntará si quieres ponerlo Listo sin agregar monto`;
  setTextPagoSimple("pagoSimpleResumen", resumen);

  const hist = document.getElementById("pagoSimpleHistorial");
  if (hist) {
    const header = `<div class="simple-hist-title">Historial de abonos</div>`;
    if (!item.abonos.length) {
      hist.innerHTML = header + `<div class="simple-empty">Sin abonos registrados.</div>`;
    } else {
      const puedeAnular = esRobertoSesion();
      hist.innerHTML = header + item.abonos.map((a, i) => {
        const metaEntrada = a.clientePagoId
          ? ` · Entrada #${escapeHtml(a.clientePagoId)}${a.origen ? " · " + escapeHtml(a.origen) : ""} · Entrada completa $${money(a.entradaMonto || a.monto)}`
          : " · Registro anterior";
        const anuladoTxt = a.anulado ? " · ANULADO" : "";
        const boton = puedeAnular && !a.anulado && !a.clientePagoId
          ? `<button class="simple-delete-pay" type="button" data-pago-id="${escapeHtml(a.pagoId)}" title="Corregir registro anterior">✕</button>`
          : `<span></span>`;
        const centralizado = a.clientePagoId && !a.anulado
          ? " · Anulación: Clientes → Ver cuenta"
          : "";

        return `
        <div class="simple-hist-row ${a.anulado ? "is-anulado" : ""}">
          <span class="simple-hist-main">${a.anulado ? "Anulado" : "Abono"} ${a.tipoPago || item.tipo || "DIVISA"} ${i + 1}: $${money(a.monto)}</span>
          <small>${escapeHtml(fechaCortaPagoSimple(a.fecha))}${a.auto ? " · automático" : ""}${metaEntrada}${centralizado}${anuladoTxt}</small>
          ${boton}
        </div>`;
      }).join("");
    }
  }
}

async function actualizarPedidoSimpleSupabase(id, itemFinal) {
  if (!validarSupabase()) return false;

  const pedidoAnterior = {...(getPedidoPorId(id) || {})};
  const tipoAnterior = tipoPagoSimpleDesdePedido(pedidoAnterior);
  const pagadoAnterior = numeroSeguro(pedidoAnterior.pago_simple_pagado || 0);
  const payload = payloadPedidoSimple(itemFinal);
  const tipoNuevo = String(payload.pago_simple_tipo || "DIVISA").toUpperCase() === "BCV" ? "BCV" : "DIVISA";
  const totalNuevo = numeroSeguro(payload.pago_simple_total || 0);

  if(tipoNuevo !== tipoAnterior && pagadoAnterior > 0.009){
    alert(
      `No puedes cambiar este pedido de ${tipoAnterior} a ${tipoNuevo} porque ya tiene $${money(pagadoAnterior)} aplicado.

` +
      `Primero anula/reconcilia el pago desde Clientes.`
    );
    return false;
  }

  if(totalNuevo + 0.009 < pagadoAnterior){
    alert(`El monto no puede quedar por debajo de lo ya pagado ($${money(pagadoAnterior)}).`);
    return false;
  }

  const { error } = await db()
    .from("pedidos")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("No se pudo actualizar pago simple:", error);
    alert("No se pudo actualizar el saldo del pedido.\n\n" + error.message);
    return false;
  }

  const despues = {...pedidoAnterior, ...payload};
  const cambios = construirCambiosAuditoria(
    pedidoAnterior,
    despues,
    ["pago_simple_total","pago_simple_tipo","pago_simple_pagado","pago_simple_estado","estatus_pago"]
  );
  await registrarAuditoriaPedido(id, "CAMBIO_FINANCIERO", cambios, "Cambio desde modal de Pago");

  const local = getPedidoPorId(id);
  if (local) Object.assign(local, payload);
  return true;
}

function clienteIdPorPedido(pedido) {
  if (!pedido) return null;
  if (pedido.cliente_id) return pedido.cliente_id;

  const nombre = normalizarBusqueda(pedido.cliente || "");
  if (!nombre) return null;

  const cliente = clientesBusquedaDB.find(c => normalizarBusqueda(c.nombre) === nombre);
  return cliente ? cliente.id : null;
}

async function asegurarClienteIdPedidoParaPago(id) {
  const pedido = getPedidoPorId(id);
  if (!pedido) return null;

  let clienteId = clienteIdPorPedido(pedido);
  if (clienteId) return clienteId;

  const info = await asegurarClienteExiste(pedido.cliente || "");
  clienteId = info && info.id ? Number(info.id) : null;

  if (clienteId) {
    const { error } = await db()
      .from("pedidos")
      .update({ cliente_id: clienteId })
      .eq("id", id);

    if (error) {
      console.warn("No se pudo enlazar cliente_id al pedido:", error);
    } else {
      pedido.cliente_id = clienteId;
    }
  }

  return clienteId;
}

async function confirmarPagoUnificadoPorUUID(uuid) {
  if (!uuid || !db()) return null;

  try {
    const { data, error } = await db()
      .from("clientes_pagos")
      .select("id,estado,monto_recibido,monto_aplicado,saldo_a_favor,pedidos_afectados,operacion_uuid")
      .eq("operacion_uuid", uuid)
      .maybeSingle();

    if (error) return null;
    return data || null;
  } catch (e) {
    return null;
  }
}

async function registrarMovimientoPagoSimple(id, delta, itemFinal, auto, fechaPago) {
  if (!db() || delta <= 0) return null;

  const pedido = getPedidoPorId(id);
  if (!pedido) {
    alert("No se encontró el pedido.");
    return null;
  }

  const clienteId = await asegurarClienteIdPedidoParaPago(id);
  if (!clienteId) {
    alert("No se pudo identificar el cliente de este pedido.");
    return null;
  }

  if (!pagoSimpleOperacionUUIDPendiente) {
    pagoSimpleOperacionUUIDPendiente = crearOperacionUUIDPagoSimple();
  }

  const uuid = pagoSimpleOperacionUUIDPendiente;
  const metodo = auto ? "Listo desde pedido" : "Abono desde pedido";

  const parametros = {
    p_operacion_uuid: uuid,
    p_cliente_id: clienteId,
    p_tipo_pago: itemFinal.tipo === "BCV" ? "BCV" : "DIVISA",
    p_monto: numeroSeguro(delta),
    p_metodo: metodo,
    p_referencia: "Pedido #" + id,
    p_nota: "Registrado desde Index · Pedido #" + id,
    p_fecha: fechaPago || fechaISO(),
    p_registrado_por: operadorActualNombre() || null,
    p_origen: "INDEX",
    p_pedido_id: Number(id)
  };

  try {
    const { data, error } = await db().rpc("registrar_pago_cliente_v1", parametros);

    if (error) {
      const confirmado = await confirmarPagoUnificadoPorUUID(uuid);
      if (confirmado && String(confirmado.estado || "ACTIVO").toUpperCase() !== "ANULADO") {
        return {
          ok: true,
          recuperado: true,
          pago_id: confirmado.id,
          monto_aplicado: numeroSeguro(confirmado.monto_aplicado || 0),
          saldo_a_favor: numeroSeguro(confirmado.saldo_a_favor || 0),
          pedidos_afectados: numeroSeguro(confirmado.pedidos_afectados || 0)
        };
      }

      console.error("No se pudo registrar el pago unificado:", error);
      alert("No se pudo registrar el pago.\n\n" + (error.message || "Error desconocido"));
      return null;
    }

    return data || null;
  } catch (e) {
    const confirmado = await confirmarPagoUnificadoPorUUID(uuid);
    if (confirmado && String(confirmado.estado || "ACTIVO").toUpperCase() !== "ANULADO") {
      return {
        ok: true,
        recuperado: true,
        pago_id: confirmado.id,
        monto_aplicado: numeroSeguro(confirmado.monto_aplicado || 0),
        saldo_a_favor: numeroSeguro(confirmado.saldo_a_favor || 0),
        pedidos_afectados: numeroSeguro(confirmado.pedidos_afectados || 0)
      };
    }

    console.error("Error registrando pago unificado:", e);
    alert("No se pudo confirmar el pago. Vuelve a intentar sin cambiar los valores.");
    return null;
  }
}

async function guardarPagoSimple() {
  if (pagoSimpleGuardando) return;

  if (!pagoSimpleActualId) {
    alert("No hay pedido seleccionado.");
    return;
  }

  const id = pagoSimpleActualId;
  const item = itemModalPagoSimple();
  const accion = document.getElementById("pagoSimpleAccion")?.value || "PENDIENTE";
  const fechaPago = document.getElementById("pagoSimpleFecha")?.value || fechaISO();

  if (item.monto <= 0) {
    const okCierre = confirm("¿Quieres ponerlo Listo sin agregar monto?\n\nNo registrará dinero, no quedará deuda y aparecerá como Listo/Sin monto.");
    if (!okCierre) return;

    setPagoSimpleProcesando(true);

    try {
      const itemFinal = {
        monto: 0,
        tipo: item.tipo,
        tasa: item.tipo === "BCV" ? item.tasa : 0,
        pagado: 0,
        fecha: fechaPago,
        abonos: Array.isArray(item.abonos) ? [...item.abonos] : [],
        estado: "PAGADO"
      };

      const ok = await actualizarPedidoSimpleSupabase(id, itemFinal);
      if (!ok) return;

      setPagoSimpleProcesando(false);
      cerrarModalPagoSimple();
      mostrarToast("Pedido listo sin monto ✅");
      await cargarPedidos(false);
      return;
    } finally {
      setPagoSimpleProcesando(false);
    }
  }

  if (item.tipo === "BCV" && item.tasa <= 0) {
    const ok = confirm("No colocaste tasa BCV. ¿Guardar igual solo como referencia BCV?");
    if (!ok) return;
  }

  let delta = 0;
  let auto = false;

  if (accion === "ABONO") {
    delta = numeroSeguro(document.getElementById("pagoSimpleAbono")?.value || 0);
    if (delta <= 0) {
      alert("Coloca el monto del abono.");
      return;
    }
    auto = false;
  } else if (accion === "LISTO") {
    delta = Math.max(item.monto - numeroSeguro(item.pagado), 0);
    auto = true;
  }

  setPagoSimpleProcesando(true);

  try {
    // Primero guarda únicamente la definición de la deuda. El dinero se registra
    // después mediante una sola transacción en Supabase.
    const itemBase = {
      monto: item.monto,
      tipo: item.tipo,
      tasa: item.tipo === "BCV" ? item.tasa : 0,
      pagado: numeroSeguro(item.pagado),
      fecha: fechaPago,
      abonos: Array.isArray(item.abonos) ? [...item.abonos] : []
    };
    itemBase.estado = estadoPagoSimpleDesdeMontos(itemBase.monto, itemBase.pagado);

    const okDefinicion = await actualizarPedidoSimpleSupabase(id, itemBase);
    if (!okDefinicion) return;

    const pedidoDespuesDefinir = getPedidoPorId(id) || {};
    const clienteIdCredito = clienteIdPorPedido(pedidoDespuesDefinir);
    if(clienteIdCredito){
      const credito = await aplicarSaldoFavorDisponible(clienteIdCredito, item.tipo, id);
      if(numeroSeguro(credito?.monto_aplicado || 0) > 0.009){
        await cargarPedidos(false);
        if(accion === "LISTO"){
          const fresco = resumenPagoSimplePedido(getPedidoPorId(id) || {});
          delta = Math.max(fresco.total - fresco.pagado, 0);
          itemBase.pagado = fresco.pagado;
          itemBase.estado = fresco.estado;
        }
      }
    }

    if (delta <= 0.009) {
      pagoSimpleOperacionUUIDPendiente = null;
      setPagoSimpleProcesando(false);
      cerrarModalPagoSimple();
      mostrarToast("Pedido actualizado ✅");
      await cargarPedidos(false);
      return;
    }

    const resultado = await registrarMovimientoPagoSimple(id, delta, itemBase, auto, fechaPago);
    if (!resultado || resultado.ok === false) return;

    pagoSimpleOperacionUUIDPendiente = null;
    setPagoSimpleProcesando(false);
    cerrarModalPagoSimple();

    const aplicado = numeroSeguro(resultado.monto_aplicado || delta);
    const favor = numeroSeguro(resultado.saldo_a_favor || 0);

    if (favor > 0.009) {
      mostrarToast("Pago $" + money(aplicado) + " · A favor $" + money(favor));
    } else {
      mostrarToast("Pago registrado $" + money(aplicado) + " ✅");
    }

    await cargarPedidos(false);
  } finally {
    setPagoSimpleProcesando(false);
  }
}

async function eliminarPagoSimple(pagoId) {
  if (!pagoSimpleActualId || !pagoId) {
    alert("No se encontró ese pago.");
    return;
  }

  if (!esRobertoSesion()) {
    alert("Solo Roberto puede anular o eliminar pagos.");
    return;
  }

  const pago = pagoSimpleHistorialActual.find(p => Number(p.pagoId) === Number(pagoId));
  if (!pago) {
    alert("No se encontró ese movimiento.");
    return;
  }

  if (pago.anulado) {
    alert("Ese pago ya está anulado.");
    return;
  }

  const id = pagoSimpleActualId;
  const montoTxt = "$" + money(pago.monto);

  // Pagos nuevos: nunca se borran. Se anula la entrada completa y Supabase
  // revierte automáticamente todos los pedidos que haya afectado.
  if (pago.clientePagoId) {
    let detalle = "¿Anular " + montoTxt + "?";
    if (pago.origen === "CLIENTES" && pago.entradaMonto > pago.monto + 0.009) {
      detalle =
        "Este abono pertenece a una entrada global de $" + money(pago.entradaMonto) + ".\n\n" +
        "Al anularla se revertirán TODOS los pedidos afectados por esa entrada.";
    } else {
      detalle += "\n\nEl saldo del pedido se recalculará automáticamente.";
    }

    const okConfirm = confirm(detalle);
    if (!okConfirm) return;

    const motivo = prompt("Motivo de la anulación:", "Corrección de pago");
    if (motivo === null) return;

    try {
      const { data, error } = await db().rpc("anular_pago_cliente_v1", {
        p_cliente_pago_id: Number(pago.clientePagoId),
        p_anulado_por: "Roberto",
        p_motivo: String(motivo || "").trim() || "Corrección de pago"
      });

      if (error) {
        console.error("No se pudo anular el pago:", error);
        alert("No se pudo anular el pago.\n\n" + error.message);
        return;
      }

      mostrarToast("Pago anulado ✅");
      await cargarPedidos(false);

      pagoSimpleActualId = id;
      pagoSimpleHistorialActual = await cargarHistorialPagoSimple(id);
      pintarModalPagoSimple();
      return data;
    } catch (e) {
      console.error("Error anulando pago:", e);
      alert("No se pudo anular el pago.");
      return;
    }
  }

  // Compatibilidad con registros antiguos que no tienen entrada en clientes_pagos.
  const okConfirm = confirm(
    "Este es un pago del sistema anterior.\n\n" +
    "¿Borrar " + montoTxt + " y recalcular el pedido?"
  );
  if (!okConfirm) return;

  const { error } = await db()
    .from("pedidos_pagos")
    .delete()
    .eq("id", pagoId)
    .eq("pedido_id", id)
    .is("cliente_pago_id", null);

  if (error) {
    console.error("No se pudo borrar el pago anterior:", error);
    alert("No se pudo borrar el pago.\n\n" + error.message);
    return;
  }

  pagoSimpleHistorialActual = await cargarHistorialPagoSimple(id);

  const pedido = getPedidoPorId(id) || {};
  const base = resumenPagoSimplePedido(pedido);
  const pagadoHistorial = totalAbonosPagoSimple(pagoSimpleHistorialActual);

  const item = {
    id,
    monto: base.monto,
    tipo: base.tipo,
    tasa: base.tasa,
    pagado: pagadoHistorial,
    fecha: base.fecha || fechaISO(),
    abonos: pagoSimpleHistorialActual
  };
  item.estado = estadoPagoSimpleDesdeMontos(item.monto, item.pagado);

  const ok = await actualizarPedidoSimpleSupabase(id, item);
  if (!ok) return;

  mostrarToast("Pago anterior eliminado ✅");
  await cargarPedidos(false);

  pagoSimpleActualId = id;
  pagoSimpleHistorialActual = await cargarHistorialPagoSimple(id);
  pintarModalPagoSimple();
}

function operadorActualNombre() {
  const op = getOperadorSesionLocal();
  return String(op && op.nombre ? op.nombre : "").trim();
}

let ultimoPagoSimpleTapId = null;
let ultimoPagoSimpleTapAt = 0;

function abrirPagoPedidoSeguro(id) {
  const pedidoId = Number(id);
  if (!pedidoId) {
    alert("No se encontró el ID del pedido para registrar pago.");
    return false;
  }

  const ahora = Date.now();
  if (ultimoPagoSimpleTapId === pedidoId && (ahora - ultimoPagoSimpleTapAt) < 450) return false;
  ultimoPagoSimpleTapId = pedidoId;
  ultimoPagoSimpleTapAt = ahora;

  abrirModalPagoSimple(pedidoId);
  return false;
}

function manejarBotonPagoSimple(e) {
  const btn = e.target && e.target.closest ? e.target.closest(".pay-simple-btn") : null;
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

  abrirPagoPedidoSeguro(btn.dataset.simplePagoId);
}

// V59: usar solo click evita que pointerdown/touchstart abra el modal antes de tiempo
// y deje los campos del modal sin poder tocarse en móvil.
document.addEventListener("click", manejarBotonPagoSimple, true);

function instalarCSSPagoSimple() {
  if (document.getElementById("pago-simple-v59-css")) return;

  const style = document.createElement("style");
  style.id = "pago-simple-v59-css";
  style.textContent = `
    /* PAGO SIMPLE V63 APP - FILTRO PAGO VISIBLE */
    #pagoSimpleBackdrop{
      position:fixed!important;
      inset:0!important;
      z-index:99999!important;
      align-items:center!important;
      justify-content:center!important;
      background:rgba(15,23,42,.42)!important;
      padding:16px!important;
      pointer-events:auto!important;
    }
    #pagoSimpleBackdrop .pago-simple-modal{
      width:min(580px, calc(100vw - 24px))!important;
      max-height:calc(100vh - 24px)!important;
      overflow:auto!important;
      pointer-events:auto!important;
      position:relative!important;
      z-index:100000!important;
      background:#fff!important;
    }
    #pagoSimpleBackdrop input,
    #pagoSimpleBackdrop select,
    #pagoSimpleBackdrop button{
      pointer-events:auto!important;
      touch-action:manipulation!important;
    }
    #filterPago{display:inline-flex!important}
    table{min-width:1350px!important}
    table th:nth-child(11),table td:nth-child(11),
    table th:nth-child(12),table td:nth-child(12){display:none!important}
    table th:nth-child(1),table td:nth-child(1){width:42px!important;min-width:42px!important}
    table th:nth-child(2),table td:nth-child(2){width:78px!important;min-width:78px!important}
    table th:nth-child(3),table td:nth-child(3){width:86px!important;min-width:86px!important}
    table th:nth-child(4),table td:nth-child(4){width:140px!important;min-width:140px!important}
    table th:nth-child(5),table td:nth-child(5){width:230px!important;min-width:230px!important;max-width:230px!important}
    table th:nth-child(6),table td:nth-child(6){width:72px!important;min-width:72px!important}
    table th:nth-child(7),table td:nth-child(7){width:104px!important;min-width:104px!important}
    table th:nth-child(8),table td:nth-child(8){width:104px!important;min-width:104px!important}
    table th:nth-child(9),table td:nth-child(9){display:table-cell!important;width:112px!important;min-width:112px!important;text-align:center!important}
    table th:nth-child(10),table td:nth-child(10){width:96px!important;min-width:96px!important}
    table th:nth-child(13),table td:nth-child(13){width:88px!important;min-width:88px!important;text-align:center!important}
    table th:nth-child(14),table td:nth-child(14){width:128px!important;min-width:128px!important;text-align:center!important;overflow:visible!important}
    table th:nth-child(15),table td:nth-child(15){width:70px!important;min-width:70px!important;text-align:center!important}
    th{padding:8px 7px!important}
    #orderTableBody td{height:40px!important;max-height:40px!important;padding:6px 7px!important}
    #orderTableBody td:nth-child(5){line-height:1.18!important}
    .pago-action-cell{overflow:visible!important}
    .pago-simple-modal{border-radius:16px!important}
    .pago-simple-modal .modal-body{gap:10px!important;padding:16px!important}
    .pago-simple-modal .modal-header{padding:14px 16px!important}
    .pago-simple-modal .modal-footer{padding:12px 16px!important}
    .pago-simple-modal .field{gap:4px!important}
    .pago-simple-modal .field label{font-size:9px!important;letter-spacing:.45px!important}
    .pago-simple-modal input,.pago-simple-modal select{height:38px!important;min-height:38px!important;padding:8px 10px!important;border-radius:10px!important;font-size:13px!important}
    .simple-grid-3{display:grid;grid-template-columns:1fr 105px 110px;gap:8px;align-items:end}
    .simple-grid-action{grid-template-columns:1fr 1fr 116px}
    .simple-date-field input{font-family:var(--mono);font-size:12px!important}
    .tipo-entrega-cell{overflow:visible!important}
    .entrega-select{width:100%!important;min-height:30px!important;border-radius:999px!important;text-align:center!important;text-align-last:center!important;font-family:var(--head)!important;font-size:8px!important;font-weight:900!important;padding:4px 20px 4px 6px!important;background:#f8f9ff!important;color:#64748b!important;border-color:#d9deea!important}
    .entrega-select.entrega-retiro{background:#eef1ff!important;color:#153bff!important;border-color:#c7d2fe!important}
    .entrega-select.entrega-delivery{background:#fff7ed!important;color:#c2410c!important;border-color:#fdba74!important}
    .entrega-select.entrega-envio{background:#ecfdf5!important;color:#047857!important;border-color:#6ee7b7!important}
    .pay-simple-btn{width:100%;min-height:32px;padding:4px 6px;border-radius:10px;border:1px solid #64748b;background:#64748b;color:#fff;cursor:pointer;font-family:var(--head);font-size:8px;font-weight:900;letter-spacing:.18px;text-transform:uppercase;line-height:1.03;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;white-space:nowrap;overflow:hidden}
    .pay-simple-btn span,.pay-simple-btn small{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pay-simple-btn small{font-size:6.5px;opacity:.92;letter-spacing:.10px}
    .pay-simple-btn.simple-debe{background:#dc2626;border-color:#dc2626;color:#fff}
    .pay-simple-btn.simple-abono{background:#f59e0b;border-color:#f59e0b;color:#111827}
    .pay-simple-btn.simple-ok{background:#16a34a;border-color:#16a34a;color:#fff}
    .pay-simple-btn.simple-favor{background:#2563eb;border-color:#2563eb;color:#fff}
    .pay-simple-btn.simple-sin{background:#64748b;border-color:#64748b;color:#fff}
    .simple-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
    .simple-kpi-card{border:1px solid #d9deea;border-radius:12px;background:#f8f9ff;padding:9px 8px;min-width:0}
    .simple-kpi-card span{display:block;font-family:var(--head);font-size:8px;font-weight:900;letter-spacing:.45px;text-transform:uppercase;color:#64748b;margin-bottom:3px;white-space:nowrap}
    .simple-kpi-card strong{display:block;font-family:var(--mono);font-size:14px;font-weight:900;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .simple-kpi-card.simple-kpi-favor strong{color:#2563eb}
    .simple-kpi-card.simple-kpi-favor{background:#eff6ff;border-color:#bfdbfe;opacity:.45}
    .simple-kpi-card.simple-kpi-favor.is-active{opacity:1;background:#dbeafe;border-color:#2563eb}
    .simple-resumen{border:1px solid #d9deea;border-radius:12px;background:#f8f9ff;padding:10px 11px;font-weight:900;color:#111827;font-family:var(--mono);font-size:11px;line-height:1.35}
    .simple-historial{border:1px solid #d9deea;border-radius:12px;background:#fff;overflow:hidden}
    .simple-hist-title{padding:8px 10px;background:#eef1ff;color:#153bff;font-family:var(--head);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}
    .simple-empty{padding:10px;color:#64748b;font-size:12px;font-weight:700}
    .simple-hist-row{display:grid;grid-template-columns:minmax(0,1fr) auto 28px;align-items:center;gap:8px;padding:8px 10px;border-top:1px solid #eef1ff;font-size:12px;font-weight:800;color:#111827}
    .simple-hist-main{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .simple-hist-row small{color:#64748b;font-family:var(--mono);font-size:10px;white-space:nowrap}
    .simple-hist-row.is-anulado{opacity:.52;background:#f8f9ff}
    .simple-hist-row.is-anulado .simple-hist-main{text-decoration:line-through}
    .simple-delete-pay{width:26px;height:26px;border-radius:999px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;font-size:12px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;line-height:1}
    .simple-delete-pay:hover{background:#dc2626;color:#fff;border-color:#dc2626}
    .simple-modal-footer .btn-add{min-height:36px!important;padding:8px 14px!important}
    @media(max-width:980px){
      table{min-width:1004px!important}
      table th:nth-child(4),table td:nth-child(4){width:160px!important;min-width:160px!important;padding-left:10px!important}
      table th:nth-child(5),table td:nth-child(5){width:190px!important;min-width:190px!important;max-width:190px!important}
      table th:nth-child(6),table td:nth-child(6){width:58px!important;min-width:58px!important}
      table th:nth-child(7),table td:nth-child(7),table th:nth-child(8),table td:nth-child(8){width:86px!important;min-width:86px!important}
      table th:nth-child(9),table td:nth-child(9){width:92px!important;min-width:92px!important}
      table th:nth-child(10),table td:nth-child(10){width:82px!important;min-width:82px!important}
      table th:nth-child(13),table td:nth-child(13){width:74px!important;min-width:74px!important}
      table th:nth-child(14),table td:nth-child(14){width:112px!important;min-width:112px!important}
      table th:nth-child(15),table td:nth-child(15){width:54px!important;min-width:54px!important}
      #orderTableBody td{height:32px!important;max-height:32px!important;padding:3px 4px!important}
      .entrega-select{min-height:27px!important;height:27px!important;font-size:6.8px!important;padding:3px 15px 3px 3px!important}
      .pay-simple-btn{min-height:28px;padding:3px 4px;font-size:6.9px}.pay-simple-btn small{font-size:5.5px}
      .simple-kpi-grid{grid-template-columns:1fr 1fr;gap:6px}
      .simple-grid-3,.simple-grid-action{grid-template-columns:1fr 1fr!important;gap:7px}
      .simple-action-field{grid-column:1/-1}
    }
    @media(max-width:430px){
      table{min-width:952px!important}
      table th:nth-child(4),table td:nth-child(4){width:150px!important;min-width:150px!important}
      table th:nth-child(5),table td:nth-child(5){width:178px!important;min-width:178px!important;max-width:178px!important}
      table th:nth-child(14),table td:nth-child(14){width:106px!important;min-width:106px!important}
      .pago-simple-modal .modal-body{padding:14px!important}
      .simple-grid-3,.simple-grid-action{grid-template-columns:1fr!important}
      .simple-kpi-grid{grid-template-columns:1fr 1fr}
    }
  `;

  document.head.appendChild(style);
}

function ajustarHeaderPagoSimple() {
  const th = document.querySelector("table thead tr:first-child th:nth-child(14)");
  if (th) th.textContent = "Pago";
}

function instalarPagoSimpleV58() {
  console.log("Pago simple app conectado", PAGO_SIMPLE_VERSION);
  instalarCSSPagoSimple();
  crearModalPagoSimple();
  ajustarHeaderPagoSimple();
  setTimeout(ajustarHeaderPagoSimple, 500);
  setTimeout(ajustarHeaderPagoSimple, 1500);
}

// Compatibilidad con HTML anterior.
function onMetodoPagoChange() {}
function calcularPagoModal() {}
function onPagoTipoDeudaChange() {}
async function guardarDeudaPedido() { return guardarPagoSimple(); }
async function aplicarPagoPedido() { return guardarPagoSimple(); }

window.openPagoPedido = abrirPagoPedidoSeguro;
window.openPagoPedidoSafe = abrirPagoPedidoSeguro;
window.onMetodoPagoChange = onMetodoPagoChange;
window.calcularPagoModal = calcularPagoModal;
window.aplicarPagoPedido = aplicarPagoPedido;
window.guardarDeudaPedido = guardarDeudaPedido;
window.onPagoTipoDeudaChange = onPagoTipoDeudaChange;
window.pagoSimpleAppV58 = {
  abrir: abrirModalPagoSimple,
  version: PAGO_SIMPLE_VERSION
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", instalarPagoSimpleV58);
} else {
  instalarPagoSimpleV58();
}

// ===========================
// EDITAR PEDIDO
// ===========================
function openEditOrder(id) {
  const pedido = pedidosDB.find(p => Number(p.id) === Number(id));

  if (!pedido) {
    alert("No se encontró el pedido.");
    return;
  }

  pedidoEditandoId = pedido.id;
  archivoSeleccionado = null;

  document.getElementById("f_fecha").value = pedido.fecha || "";
  document.getElementById("f_operador").value = pedido.operador || "";
  document.getElementById("f_cliente").value = pedido.cliente || "";
  document.getElementById("f_descripcion").value = pedido.descripcion || "";
  document.getElementById("f_cantidad").value = pedido.cantidad || "";
  document.getElementById("f_material").value = pedido.material || "";
  document.getElementById("f_impresion").value = pedido.tipo_impresion || "";
  document.getElementById("f_tipo_entrega").value = pedido.tipo_entrega || "";
  document.getElementById("f_monto_abonado").value = money(pedido.monto_abonado || 0);
  document.getElementById("f_entrega").value = pedido.fecha_entrega || "";
  aplicarFormularioDeuda("f", pedido);

  pintarSelectsCatalogos();

  const cantidadInput = document.getElementById("f_cantidad");
  if (cantidadInput) cantidadInput.disabled = !puedeModificarCantidadLocal();

  const operadorInput = document.getElementById("f_operador");
  if (operadorInput) operadorInput.disabled = !puedeModificarOperadorLocal();

  const titulo = document.getElementById("orderModalTitle");
  if (titulo) titulo.textContent = "EDITAR PEDIDO #" + pedido.id;

  const fileName = document.getElementById("fileName");
  const fileGeneric = document.getElementById("fileGeneric");
  const filePreview = document.getElementById("filePreview");
  const fileEmpty = document.getElementById("fileEmpty");
  const fileIconBig = document.getElementById("fileIconBig");

  if (pedido.archivo_url) {
    if (fileEmpty) fileEmpty.style.display = "none";
    if (filePreview) filePreview.style.display = "flex";
    if (fileGeneric) fileGeneric.style.display = "block";
    if (fileIconBig) fileIconBig.textContent = "📎";
    if (fileName) fileName.textContent = pedido.archivo_nombre || "Archivo adjunto";
  } else {
    if (fileEmpty) fileEmpty.style.display = "flex";
    if (filePreview) filePreview.style.display = "none";
    if (fileGeneric) fileGeneric.style.display = "none";
    if (fileName) fileName.textContent = "";
  }

  const modal = document.getElementById("orderBackdrop");
  if (modal) modal.style.display = "flex";
}

function openOrderModal() {
  pedidoEditandoId = null;
  archivoSeleccionado = null;

  document.getElementById("f_fecha").value = new Date().toISOString().split("T")[0];
  document.getElementById("f_operador").value = "";
  document.getElementById("f_cliente").value = "";
  document.getElementById("f_descripcion").value = "";
  document.getElementById("f_cantidad").value = "";
  document.getElementById("f_material").value = "";
  document.getElementById("f_impresion").value = "";
  document.getElementById("f_tipo_entrega").value = "";
  document.getElementById("f_monto_abonado").value = "";
  document.getElementById("f_entrega").value = "";
  document.getElementById("f_precio_total").value = "";
  document.getElementById("f_tipo_deuda").value = "USD_FIJO";
  document.getElementById("f_tasa_deuda").value = "";
  actualizarVisibilidadTasaDeuda("f");

  pintarSelectsCatalogos();

  const cantidadInput = document.getElementById("f_cantidad");
  if (cantidadInput) cantidadInput.disabled = false;

  const operadorInput = document.getElementById("f_operador");
  if (operadorInput) operadorInput.disabled = !puedeModificarOperadorLocal();

  const opSesion = getOperadorSesionLocal();
  if (opSesion && opSesion.nombre && operadorInput) operadorInput.value = opSesion.nombre;

  const titulo = document.getElementById("orderModalTitle");
  if (titulo) titulo.textContent = "NUEVO PEDIDO";

  const fileEmpty = document.getElementById("fileEmpty");
  const filePreview = document.getElementById("filePreview");
  const fileGeneric = document.getElementById("fileGeneric");
  const fileName = document.getElementById("fileName");

  if (fileEmpty) fileEmpty.style.display = "flex";
  if (filePreview) filePreview.style.display = "none";
  if (fileGeneric) fileGeneric.style.display = "none";
  if (fileName) fileName.textContent = "";

  const modal = document.getElementById("orderBackdrop");
  if (modal) modal.style.display = "flex";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";

  pedidoEditandoId = null;

  const cantidadInput = document.getElementById("f_cantidad");
  if (cantidadInput) cantidadInput.disabled = false;

  const operadorInput = document.getElementById("f_operador");
  if (operadorInput) operadorInput.disabled = false;

  aplicarOperadorSesion();
}

function bdClick(event, id) {
  if (event.target.id === id) closeModal(id);
}

// ===========================
// FECHA / LIMPIEZA
// ===========================
function ponerFechaHoy() {
  const hoy = new Date().toISOString().split("T")[0];

  const qFecha = document.getElementById("q_fecha");
  if (qFecha && !qFecha.value) qFecha.value = hoy;

  const fFecha = document.getElementById("f_fecha");
  if (fFecha && !fFecha.value) fFecha.value = hoy;
}

function limpiarFilaRapida() {
  const campos = [
    "q_cliente",
    "q_descripcion",
    "q_cantidad",
    "q_tipo_entrega",
    "q_monto_abonado",
    "q_entrega",
    "q_precio_total",
    "q_tasa_deuda"
  ];

  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const estatusTrabajo = document.getElementById("q_estatus_trabajo");
  if (estatusTrabajo) estatusTrabajo.value = "Solicitud";

  const estatusPago = document.getElementById("q_estatus_pago");
  if (estatusPago) estatusPago.value = "Pendiente";

  const tipoDeuda = document.getElementById("q_tipo_deuda");
  if (tipoDeuda) tipoDeuda.value = "USD_FIJO";
  actualizarVisibilidadTasaDeuda("q");

  const rowFileInput = document.getElementById("rowFileInput");
  if (rowFileInput) rowFileInput.value = "";

  archivoSeleccionado = null;
  aplicarOperadorSesion();
}

function clearQuickEntry() {
  limpiarFilaRapida();
  ponerFechaHoy();
}

// ===========================
// ARCHIVOS
// ===========================
function handleFileSelect(event) {
  archivoSeleccionado = event.target.files[0] || null;
  if (!archivoSeleccionado) return;

  const fileEmpty = document.getElementById("fileEmpty");
  const filePreview = document.getElementById("filePreview");
  const fileGeneric = document.getElementById("fileGeneric");
  const fileName = document.getElementById("fileName");
  const fileIconBig = document.getElementById("fileIconBig");

  if (fileEmpty) fileEmpty.style.display = "none";
  if (filePreview) filePreview.style.display = "flex";
  if (fileGeneric) fileGeneric.style.display = "block";
  if (fileIconBig) fileIconBig.textContent = "📎";
  if (fileName) fileName.textContent = archivoSeleccionado.name;
}

function openQuickAttach() {
  const input = document.getElementById("rowFileInput");
  if (input) input.click();
}

function handleRowFileSelect(event) {
  archivoSeleccionado = event.target.files[0] || null;
  if (archivoSeleccionado) mostrarToast("Archivo seleccionado");
}

function removeFile() {
  archivoSeleccionado = null;

  const input = document.getElementById("f_archivo");
  if (input) input.value = "";

  const fileEmpty = document.getElementById("fileEmpty");
  const filePreview = document.getElementById("filePreview");
  const fileGeneric = document.getElementById("fileGeneric");
  const fileName = document.getElementById("fileName");

  if (fileEmpty) fileEmpty.style.display = "flex";
  if (filePreview) filePreview.style.display = "none";
  if (fileGeneric) fileGeneric.style.display = "none";
  if (fileName) fileName.textContent = "";
}

async function subirArchivoPedido() {
  if (!archivoSeleccionado) return { archivo_url: null, archivo_nombre: null };

  const nombreLimpio = archivoSeleccionado.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]+/g, "_");

  const ruta = `pedidos/${Date.now()}_${nombreLimpio}`;

  const { error } = await db().storage
    .from("adjuntos-pedidos")
    .upload(ruta, archivoSeleccionado);

  if (error) {
    console.error("Error subiendo archivo:", error);
    alert("Error subiendo archivo: " + error.message);
    return { archivo_url: null, archivo_nombre: null };
  }

  const { data } = db().storage
    .from("adjuntos-pedidos")
    .getPublicUrl(ruta);

  const resultado = {
    archivo_url: data.publicUrl,
    archivo_nombre: archivoSeleccionado.name
  };

  archivoSeleccionado = null;
  return resultado;
}

// ===========================
// BUSCAR / FILTRAR
// ===========================
function onSearch() {
  renderPedidosPaginados(true);
}

// ===========================
// UX EXTRA
// ===========================
function asegurarOpcionesFiltroEstado() {
  const filtro = document.getElementById("filterStatus");
  if (!filtro) return;

  const valores = [...filtro.options].map(o => o.value);

  if (!valores.includes("Procesos")) {
    const opt = document.createElement("option");
    opt.value = "Procesos";
    opt.textContent = "⚙️ Procesos";
    filtro.insertBefore(opt, filtro.options[1] || null);
  }

  if (!valores.includes("En curso")) {
    const opt = document.createElement("option");
    opt.value = "En curso";
    opt.textContent = "⚫ En curso";
    const listo = [...filtro.options].find(o => o.value === "Listo");
    filtro.insertBefore(opt, listo || null);
  }
}

function animarGuardadoRapido() {
  const btn = document.querySelector(".add-symbol-btn");
  if (btn) {
    btn.classList.remove("quick-save-ok");
    void btn.offsetWidth;
    btn.classList.add("quick-save-ok");
    setTimeout(() => btn.classList.remove("quick-save-ok"), 900);
  }

  const primeraFila = document.querySelector("#orderTableBody tr");
  if (primeraFila) {
    primeraFila.classList.remove("fila-guardada-ok");
    void primeraFila.offsetWidth;
    primeraFila.classList.add("fila-guardada-ok");
    setTimeout(() => primeraFila.classList.remove("fila-guardada-ok"), 1600);
  }
}

function inyectarEstilosAppFinal() {
  if (document.getElementById("app-final-v42-styles")) return;

  const style = document.createElement("style");
  style.id = "app-final-v42-styles";
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
  `;

  document.head.appendChild(style);
}


// Reconfirmar funciones de pago para compatibilidad con HTML anterior.
// No llamar window.openPagoPedido -> openPagoPedido, porque eso causa recursión.
window.openPagoPedido = abrirPagoPedidoSeguro;
window.openPagoPedidoSafe = abrirPagoPedidoSeguro;
window.onMetodoPagoChange = onMetodoPagoChange;
window.calcularPagoModal = calcularPagoModal;
window.aplicarPagoPedido = aplicarPagoPedido;
window.actualizarVisibilidadTasaDeuda = actualizarVisibilidadTasaDeuda;
window.onPagoTipoDeudaChange = onPagoTipoDeudaChange;
window.guardarDeudaPedido = guardarDeudaPedido;
window.claseEntrega = claseEntrega;
window.resolverNombreClienteIdAntesDeGuardar = resolverNombreClienteIdAntesDeGuardar;

// ===========================
// LISTENERS ABONO
// ===========================
document.addEventListener("keydown", function(e) {
  if (e.target && e.target.classList && e.target.classList.contains("abono-edit") && e.key === "Enter") {
    e.preventDefault();
    e.target.blur();
  }
});

document.addEventListener("change", async function(e) {
  if (!(e.target && e.target.classList && e.target.classList.contains("abono-edit"))) return;

  const id = e.target.dataset.abonoId;
  const monto = numeroSeguro(e.target.value);

  try {
    e.target.disabled = true;
    await actualizarAbonoPedido(id, monto);
    e.target.value = money(monto);
  } finally {
    e.target.disabled = false;
  }
});

// ===========================
// INICIO
// ===========================
window.addEventListener("DOMContentLoaded", async () => {
  if (!validarSupabase()) return;

  marcarSupabaseActivo();
  ponerFechaHoy();
  actualizarVisibilidadTasaDeuda("q");
  actualizarVisibilidadTasaDeuda("f");
  asegurarOpcionesFiltroEstado();
  inyectarEstilosAppFinal();

  try {
    await cargarClientesBusqueda();
  } catch (e) {
    console.error("Error cargando clientes para búsqueda:", e);
  }

  try {
    await cargarMateriales();
  } catch (e) {
    console.error("Error cargando materiales:", e);
  }

  try {
    await cargarTiposImpresion();
  } catch (e) {
    console.error("Error cargando tipos de impresión:", e);
  }

  try {
    await cargarOperadoresComandaDesdeSupabase();
  } catch (e) {
    console.error("Error cargando operadores:", e);
  }

  try {
    await cargarPedidos();
  } catch (e) {
    console.error("Error cargando pedidos al iniciar:", e);
  }

  try {
    if (typeof cargarOperadoresEnComanda === "function") {
      await cargarOperadoresEnComanda();
    }
  } catch (e) {
    console.error("Error cargando operadores fallback:", e);
  }

  aplicarOperadorSesion();

  if (typeof aplicarPermisosComanda === "function") aplicarPermisosComanda();
});




