console.log("APP JS conectado correctamente");
console.log("Supabase window:", window.supabaseClient);

let pedidoEditandoId = null;
let pedidosDB = [];
let archivoSeleccionado = null;
let materialesDB = [];
let tiposImpresionDB = [];
let clientesBusquedaDB = [];
let clientesCatalogoDB = [];
let notificacionesDB = [];

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
  if (!nombre) return "";

  const nombreNormalizado = normalizarBusqueda(nombre);

  const { data, error } = await db()
    .from("clientes")
    .select("id, nombre")
    .limit(1000);

  if (error) {
    console.warn("No se pudo verificar cliente:", error);
    return nombreBonito(nombre);
  }

  const clienteExistente = (data || []).find(c => {
    return normalizarBusqueda(c.nombre) === nombreNormalizado;
  });

  if (clienteExistente) {
    return String(clienteExistente.nombre || nombreBonito(nombre)).trim();
  }

  const nombreFinal = nombreBonito(nombre);

  const { error: insertError } = await db()
    .from("clientes")
    .insert([{
      nombre: nombreFinal,
      tipo_cliente: "Cliente Standar",
      telefono: "",
      correo: "",
      notas: "",
      activo: true
    }]);

  if (insertError) {
    console.warn("No se pudo crear cliente automáticamente:", insertError);
    return nombreFinal;
  }

  console.log("Cliente creado automáticamente:", nombreFinal);
  return nombreFinal;
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

  console.log("Clientes para búsqueda cargados:", clientesBusquedaDB);
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

function puntajeParecidoCliente(a, b) {
  const na = normalizarBusqueda(a);
  const nb = normalizarBusqueda(b);

  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;

  const ta = na.split(" ").filter(Boolean);
  const tb = nb.split(" ").filter(Boolean);

  if (!ta.length || !tb.length) return 0;

  const sb = new Set(tb);

  let match = 0;

  ta.forEach(t => {
    if (sb.has(t)) match++;
  });

  return match / Math.max(ta.length, tb.length);
}

function buscarClienteParecido(nombre) {
  let mejor = null;
  let score = 0;

  clientesCatalogoDB.forEach(c => {
    const s = puntajeParecidoCliente(nombre, c.nombre);

    if (s > score) {
      score = s;
      mejor = c;
    }
  });

  return score >= 0.6 ? mejor : null;
}

async function resolverNombreClienteAntesDeGuardar(nombreIngresado) {
  const nombre = String(nombreIngresado || "").trim();

  if (!nombre) {
    return { ok: true, nombreFinal: "" };
  }

  const exacto = buscarClienteExactoNormalizado(nombre);

  if (exacto) {
    return {
      ok: true,
      nombreFinal: String(exacto.nombre || "").trim()
    };
  }

  return {
    ok: true,
    nombreFinal: nombreBonito(nombre)
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
      .select("nombre, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (!error && Array.isArray(data) && data.length) {
      operadores = data;
    }
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
// MATERIALES
// ===========================
async function cargarMateriales() {
  const { data, error } = await db()
    .from("materiales")
    .select("id, nombre, precio_base, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando materiales:", error);
    return;
  }

  materialesDB = data || [];

  const selects = [
    document.getElementById("q_material"),
    document.getElementById("f_material")
  ];

  selects.forEach(select => {
    if (!select) return;

    const valorActual = select.value;

    select.innerHTML = `<option value="">Material</option>`;

    materialesDB.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.nombre;
      opt.textContent = m.nombre;
      select.appendChild(opt);
    });

    if (valorActual) select.value = valorActual;
  });

  console.log("Materiales cargados:", materialesDB);
}

// ===========================
// TIPOS DE IMPRESIÓN
// ===========================
async function cargarTiposImpresion() {
  const { data, error } = await db()
    .from("tipos_impresion")
    .select("id, nombre, precio_extra, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando tipos de impresión:", error);
    return;
  }

  tiposImpresionDB = data || [];

  const selects = [
    document.getElementById("q_impresion"),
    document.getElementById("f_impresion")
  ];

  selects.forEach(select => {
    if (!select) return;

    const valorActual = select.value;

    select.innerHTML = `<option value="">Impresión</option>`;

    tiposImpresionDB.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.nombre;
      opt.textContent = t.nombre;
      select.appendChild(opt);
    });

    if (valorActual) select.value = valorActual;
  });

  console.log("Tipos de impresión cargados:", tiposImpresionDB);
}

// ===========================
// COLORES DE ESTATUS
// ===========================
function claseTrabajo(valor) {
  const estado = valor || "";

  if (estado === "Solicitud") return "status-solicitud";
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

// ===========================
// NOTIFICACIONES v17
// - No depende de tabla notificaciones.
// - Lee directamente la tabla pedidos.
// - Solicitud: SOLO Rubén.
// - Listo: SOLO operador que creó el pedido.
// - Sonido tipo campanita.
// ===========================
const NOTI_READ_KEY = "tutto_notificaciones_leidas_v17";
const NOTI_LAST_COUNT_KEY = "tutto_notificaciones_count_v17";
let notiAudioCtx = null;
let notiAudioHabilitado = false;
let notiInterval = null;

function normalizarNoti(v){
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nombreOperadorActualNoti(){
  const op = typeof getOperadorSesionLocal === "function"
    ? getOperadorSesionLocal()
    : (typeof getSesionOperador === "function" ? getSesionOperador() : null);

  if(!op) return "";
  if(typeof op === "string") return op.trim();

  return String(op.nombre || op.operador || op.name || op.usuario || "").trim();
}

function esRubenNoti(nombre){
  const n = normalizarNoti(nombre);
  return n === "ruben" || n === "rubén" || n.includes("ruben") || n.includes("rubén");
}

function operadorCoincideNoti(creadorPedido, operadorSesion){
  const a = normalizarNoti(creadorPedido);
  const b = normalizarNoti(operadorSesion);

  if(!a || !b) return false;
  if(a === b) return true;
  if(a.includes(b) || b.includes(a)) return true;

  const a1 = a.split(" ")[0];
  const b1 = b.split(" ")[0];

  return !!a1 && !!b1 && a1 === b1;
}

function leerNotificacionesLeidas(){
  try{
    return JSON.parse(localStorage.getItem(NOTI_READ_KEY) || "[]");
  }catch(e){
    return [];
  }
}

function guardarNotificacionesLeidas(ids){
  localStorage.setItem(NOTI_READ_KEY, JSON.stringify([...new Set(ids)]));
}

function idNotificacionPedido(tipo, pedido){
  return `${tipo}_${pedido.id}_${normalizarNoti(pedido.estatus_trabajo)}`;
}

function habilitarAudioNoti(){
  if(notiAudioHabilitado) return;

  try{
    notiAudioCtx = notiAudioCtx || new (window.AudioContext || window.webkitAudioContext)();

    if(notiAudioCtx.state === "suspended"){
      notiAudioCtx.resume();
    }

    notiAudioHabilitado = true;
    console.log("Audio de notificaciones habilitado");
  }catch(e){
    console.warn("No se pudo habilitar audio:", e);
  }
}

function sonarCampanitaNoti(){
  try{
    habilitarAudioNoti();
    if(!notiAudioCtx) return;

    const now = notiAudioCtx.currentTime;
    const master = notiAudioCtx.createGain();

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.26, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    master.connect(notiAudioCtx.destination);

    [
      { f:1046.5, t:0.00, d:0.13 },
      { f:1318.5, t:0.17, d:0.13 },
      { f:1568.0, t:0.34, d:0.18 }
    ].forEach(tn => {
      const osc = notiAudioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(tn.f, now + tn.t);
      osc.connect(master);
      osc.start(now + tn.t);
      osc.stop(now + tn.t + tn.d);
    });
  }catch(e){
    console.warn("No sonó la campanita:", e);
  }
}

function asegurarCampanaHeader(){
  const btn = document.getElementById("notiBtnGlobal") || document.querySelector(".header .noti-btn");
  if(!btn) return;

  btn.onclick = function(){ abrirNotificaciones(); };
  btn.style.setProperty("display", "inline-flex", "important");
  btn.style.setProperty("visibility", "visible", "important");
  btn.style.setProperty("opacity", "1", "important");
}

function actualizarNumeroCampana(total, sonar){
  asegurarCampanaHeader();

  const count = document.getElementById("notiCount");
  if(count){
    count.textContent = String(total);
    count.classList.toggle("empty", total === 0);
  }

  const anterior = Number(localStorage.getItem(NOTI_LAST_COUNT_KEY) || "0");

  if(sonar && total > anterior){
    sonarCampanitaNoti();
    if(typeof mostrarToast === "function"){
      mostrarToast(`🔔 ${total} notificación${total === 1 ? "" : "es"} pendiente${total === 1 ? "" : "s"}`);
    }
  }

  localStorage.setItem(NOTI_LAST_COUNT_KEY, String(total));
}

async function crearNotificacionPedidoListo(pedidoOriginal){
  console.log("Pedido listo detectado para notificación:", pedidoOriginal && pedidoOriginal.id);
}

async function cargarNotificaciones(sonar = false){
  if(!validarSupabase()) return;

  const operadorActual = nombreOperadorActualNoti();
  const list = document.getElementById("notiList");

  if(!operadorActual){
    actualizarNumeroCampana(0, false);
    if(list) list.innerHTML = `<div class="empty">Sin operador activo</div>`;
    return;
  }

  const { data, error } = await db()
    .from("pedidos")
    .select("id, fecha, operador, cliente, descripcion, cantidad, material, tipo_impresion, estatus_trabajo, estatus_pago, fecha_entrega")
    .order("id", { ascending:false })
    .limit(400);

  if(error){
    console.error("Error cargando notificaciones desde pedidos:", error);
    if(list) list.innerHTML = `<div class="empty">Error cargando notificaciones</div>`;
    actualizarNumeroCampana(0, false);
    return;
  }

  const leidas = new Set(leerNotificacionesLeidas());

  notificacionesDB = (data || []).flatMap(p => {
    const estado = normalizarNoti(p.estatus_trabajo);
    const salida = [];

    if(esRubenNoti(operadorActual) && estado === "solicitud"){
      const id = idNotificacionPedido("solicitud_ruben", p);
      if(!leidas.has(id)){
        salida.push({ id, tipo:"solicitud", pedido_id:p.id, cliente:p.cliente || "", descripcion:p.descripcion || "", mensaje:`Nueva solicitud creada por ${p.operador || "sin operador"}.`, created_at:p.fecha || "", _local:true });
      }
    }

    if(operadorCoincideNoti(p.operador, operadorActual) && estado === "listo"){
      const id = idNotificacionPedido("listo_operador", p);
      if(!leidas.has(id)){
        salida.push({ id, tipo:"listo", pedido_id:p.id, cliente:p.cliente || "", descripcion:p.descripcion || "", mensaje:`El pedido de ${p.cliente || "Cliente"} ya está listo.`, created_at:p.fecha_entrega || p.fecha || "", _local:true });
      }
    }

    return salida;
  });

  actualizarNumeroCampana(notificacionesDB.length, sonar);
  if(list) renderNotificaciones();
}

function abrirNotificaciones(){
  habilitarAudioNoti();
  cargarNotificaciones(false);
  const modal = document.getElementById("notiBackdrop");
  if(modal) modal.style.display = "flex";
}

function renderNotificaciones(){
  const list = document.getElementById("notiList");
  if(!list) return;

  if(!notificacionesDB.length){
    list.innerHTML = `<div class="empty">No tienes notificaciones pendientes</div><div style="margin-top:12px"><button class="btn-add" type="button" onclick="probarCampanita()">Probar sonido</button></div>`;
    return;
  }

  list.innerHTML = `<div style="margin-bottom:10px"><button class="btn-add" type="button" onclick="probarCampanita()">Probar sonido</button></div>` + notificacionesDB.map(n => `
    <div class="noti-item">
      <div class="noti-item-title">🔔 ${escapeHtml(n.cliente || "Pedido")}</div>
      <div class="noti-item-msg">${escapeHtml(n.mensaje || "Notificación")}</div>
      <div class="noti-item-msg">${escapeHtml(n.descripcion || "")}</div>
      <div class="noti-item-meta">Pedido #${escapeHtml(n.pedido_id || "")} · ${escapeHtml(String(n.created_at || "").slice(0,19).replace("T"," "))}</div>
      <div class="noti-actions"><button class="mini-action" type="button" onclick="marcarNotificacionVista('${escapeHtml(n.id)}')">Marcar como visto</button></div>
    </div>`).join("");
}

async function marcarNotificacionVista(id){
  const leidas = leerNotificacionesLeidas();
  leidas.push(String(id));
  guardarNotificacionesLeidas(leidas);
  await cargarNotificaciones(false);
  if(typeof mostrarToast === "function") mostrarToast("Notificación marcada como vista");
}

function probarCampanita(){
  habilitarAudioNoti();
  sonarCampanitaNoti();
  if(typeof mostrarToast === "function") mostrarToast("🔔 Prueba de campanita");
}

function iniciarNotificacionesComanda(){
  asegurarCampanaHeader();
  document.addEventListener("click", habilitarAudioNoti, { once:true });
  document.addEventListener("touchstart", habilitarAudioNoti, { once:true });
  setTimeout(() => cargarNotificaciones(false), 900);
  if(notiInterval) clearInterval(notiInterval);
  notiInterval = setInterval(() => cargarNotificaciones(true), 8000);
}

window.abrirNotificaciones = abrirNotificaciones;
window.cargarNotificaciones = cargarNotificaciones;
window.marcarNotificacionVista = marcarNotificacionVista;
window.probarCampanita = probarCampanita;
window.iniciarNotificacionesComanda = iniciarNotificacionesComanda;

// ===========================
// CARGAR PEDIDOS
// ===========================
async function cargarPedidos() {
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

  console.log("Pedidos cargados:", pedidosDB);

  const tabla = document.getElementById("orderTableBody");
  const emptyState = document.getElementById("emptyState");

  if (!tabla) return;

  tabla.innerHTML = "";

  if (!pedidosDB.length) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  pedidosDB.forEach(p => {
    const id = Number(p.id);

    const archivo = p.archivo_url
      ? `<a class="file-link-chip" href="${escapeHtml(p.archivo_url)}" target="_blank" onclick="event.stopPropagation()">📎 ${escapeHtml(p.archivo_nombre || "Archivo")}</a>`
      : "—";

    const cantidadDisabled = puedeModificarCantidadLocal() ? "" : "disabled";

    const fila = `
      <tr onclick="openEditOrder(${id})">
        <td>${escapeHtml(p.id)}</td>
        <td>${escapeHtml(p.fecha)}</td>
        <td>${escapeHtml(p.operador)}</td>
        <td>${escapeHtml(p.cliente)}</td>
        <td>${escapeHtml(p.descripcion)}</td>

        <td>
          <input 
            class="cell-edit"
            value="${escapeHtml(p.cantidad)}" 
            onchange="actualizarCampoPedido(${id}, 'cantidad', this.value)"
            onclick="event.stopPropagation()"
            ${cantidadDisabled}
          />
        </td>

        <td>${escapeHtml(p.material)}</td>
        <td>${escapeHtml(p.tipo_impresion)}</td>
        <td>${escapeHtml(p.precio)}</td>

        <td>
          <select 
            class="cell-select ${claseTrabajo(p.estatus_trabajo)}"
            onchange="actualizarCampoPedido(${id}, 'estatus_trabajo', this.value); this.className='cell-select ' + claseTrabajo(this.value)"
            onclick="event.stopPropagation()"
          >
            <option ${p.estatus_trabajo === "Solicitud" ? "selected" : ""}>Solicitud</option>
            <option ${p.estatus_trabajo === "Revisado" ? "selected" : ""}>Revisado</option>
            <option ${p.estatus_trabajo === "Listo" ? "selected" : ""}>Listo</option>
          </select>
        </td>

        <td>
          <select 
            class="cell-select ${clasePago(p.estatus_pago)}"
            onchange="actualizarCampoPedido(${id}, 'estatus_pago', this.value); this.className='cell-select ' + clasePago(this.value)"
            onclick="event.stopPropagation()"
          >
            <option ${p.estatus_pago === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option ${p.estatus_pago === "Abonado" ? "selected" : ""}>Abonado</option>
            <option ${p.estatus_pago === "Pagado" ? "selected" : ""}>Pagado</option>
          </select>
        </td>

        <td>${escapeHtml(p.fecha_entrega || "—")}</td>
        <td>${archivo}</td>
      </tr>
    `;

    tabla.insertAdjacentHTML("beforeend", fila);
  });

  onSearch();

  if (typeof aplicarPermisosComanda === "function") {
    aplicarPermisosComanda();
  }

  if (typeof cargarNotificaciones === "function") {
    cargarNotificaciones();
  }
}

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
  const estatus_trabajo = document.getElementById("q_estatus_trabajo")?.value || "Solicitud";
  const estatus_pago = document.getElementById("q_estatus_pago")?.value || "Pendiente";
  const fecha_entrega = document.getElementById("q_entrega")?.value || null;

  const opSesion = getOperadorSesionLocal();

  if (!puedeModificarOperadorLocal() && opSesion && opSesion.nombre) {
    operador = opSesion.nombre;
  }

  if (!fecha) {
    fecha = new Date().toISOString().split("T")[0];
  }

  if (!cliente && !descripcion) {
    alert("Coloca al menos cliente o descripción.");
    return;
  }

  const archivoData = await subirArchivoPedido();

  const decisionCliente = await resolverNombreClienteAntesDeGuardar(cliente);
  if (!decisionCliente.ok) return;

  cliente = await asegurarClienteExiste(decisionCliente.nombreFinal || cliente) || cliente;

  const { error } = await db()
    .from("pedidos")
    .insert([{
      fecha,
      operador,
      cliente,
      descripcion,
      cantidad,
      material,
      tipo_impresion,
      estatus_trabajo,
      estatus_pago,
      fecha_entrega,
      archivo_url: archivoData.archivo_url,
      archivo_nombre: archivoData.archivo_nombre
    }]);

  if (error) {
    console.error("Error guardando pedido rápido:", error);
    alert("Error guardando pedido: " + error.message);
    return;
  }

  archivoSeleccionado = null;

  limpiarFilaRapida();
  ponerFechaHoy();

  await cargarClientesBusqueda();
  await cargarPedidos();

  mostrarToast("Pedido guardado");
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
  const fecha_entrega = document.getElementById("f_entrega")?.value || null;

  const opSesion = getOperadorSesionLocal();

  if (!puedeModificarOperadorLocal() && opSesion && opSesion.nombre) {
    operador = opSesion.nombre;
  }

  if (!fecha) {
    fecha = new Date().toISOString().split("T")[0];
  }

  const decisionCliente = await resolverNombreClienteAntesDeGuardar(cliente);
  if (!decisionCliente.ok) return;

  cliente = await asegurarClienteExiste(decisionCliente.nombreFinal || cliente) || cliente;

  const archivoData = await subirArchivoPedido();

  const datosPedido = {
    fecha,
    operador,
    cliente,
    descripcion,
    material,
    tipo_impresion,
    fecha_entrega
  };

  if (puedeModificarCantidadLocal() || !pedidoEditandoId) {
    datosPedido.cantidad = cantidad;
  }

  if (archivoData.archivo_url) {
    datosPedido.archivo_url = archivoData.archivo_url;
    datosPedido.archivo_nombre = archivoData.archivo_nombre;
  }

  let error;

  if (pedidoEditandoId) {
    const respuesta = await db()
      .from("pedidos")
      .update(datosPedido)
      .eq("id", pedidoEditandoId);

    error = respuesta.error;
  } else {
    datosPedido.estatus_trabajo = "Solicitud";
    datosPedido.estatus_pago = "Pendiente";

    const respuesta = await db()
      .from("pedidos")
      .insert([datosPedido]);

    error = respuesta.error;
  }

  if (error) {
    console.error("Error guardando pedido:", error);
    alert("Error guardando pedido: " + error.message);
    return;
  }

  pedidoEditandoId = null;
  archivoSeleccionado = null;

  closeModal("orderBackdrop");

  await cargarClientesBusqueda();
  await cargarPedidos();

  mostrarToast("Pedido guardado");
}

// ===========================
// ACTUALIZAR CAMPO RÁPIDO
// ===========================
async function actualizarCampoPedido(id, campo, valor) {
  if (!validarSupabase()) return;

  const pedidoOriginal = pedidosDB.find(p => Number(p.id) === Number(id));

  if (campo === "cantidad" && !puedeModificarCantidadLocal()) {
    alert("No tienes permiso para modificar cantidad.");
    await cargarPedidos();
    return;
  }

  if (campo === "operador" && !puedeModificarOperadorLocal()) {
    alert("No tienes permiso para modificar operador.");
    await cargarPedidos();
    return;
  }

  const { error } = await db()
    .from("pedidos")
    .update({ [campo]: valor })
    .eq("id", id);

  if (error) {
    console.error("Error actualizando campo:", error);
    alert("Error actualizando: " + error.message);
    return;
  }

  if(
    campo === "estatus_trabajo" &&
    pedidoOriginal &&
    pedidoOriginal.estatus_trabajo !== "Listo" &&
    valor === "Listo"
  ){
    await crearNotificacionPedidoListo(pedidoOriginal);
    await cargarNotificaciones();
    mostrarToast("Pedido listo. Notificación enviada a " + (pedidoOriginal.operador || "su creador"));
  }

  const pedidoLocal = pedidosDB.find(p => Number(p.id) === Number(id));
  if(pedidoLocal){
    pedidoLocal[campo] = valor;
  }

  console.log(`Pedido ${id} actualizado: ${campo} = ${valor}`);
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
  document.getElementById("f_entrega").value = pedido.fecha_entrega || "";

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

// ===========================
// MODAL NUEVO
// ===========================
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
  document.getElementById("f_entrega").value = "";

  const cantidadInput = document.getElementById("f_cantidad");
  if (cantidadInput) cantidadInput.disabled = false;

  const operadorInput = document.getElementById("f_operador");
  if (operadorInput) operadorInput.disabled = !puedeModificarOperadorLocal();

  const opSesion = getOperadorSesionLocal();

  if (opSesion && opSesion.nombre && operadorInput) {
    operadorInput.value = opSesion.nombre;
  }

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

// ===========================
// CERRAR MODAL
// ===========================
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
  if (event.target.id === id) {
    closeModal(id);
  }
}

// ===========================
// FECHA
// ===========================
function ponerFechaHoy() {
  const hoy = new Date().toISOString().split("T")[0];

  const qFecha = document.getElementById("q_fecha");
  if (qFecha && !qFecha.value) qFecha.value = hoy;

  const fFecha = document.getElementById("f_fecha");
  if (fFecha && !fFecha.value) fFecha.value = hoy;
}

// ===========================
// LIMPIAR FILA RÁPIDA
// ===========================
function limpiarFilaRapida() {
  const campos = [
    "q_cliente",
    "q_descripcion",
    "q_cantidad",
    "q_monto_abono",
    "q_entrega"
  ];

  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const estatusTrabajo = document.getElementById("q_estatus_trabajo");
  if (estatusTrabajo) estatusTrabajo.value = "Solicitud";

  const estatusPago = document.getElementById("q_estatus_pago");
  if (estatusPago) estatusPago.value = "Pendiente";

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

  if (archivoSeleccionado) {
    mostrarToast("Archivo seleccionado");
  }
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
  if (!archivoSeleccionado) {
    return {
      archivo_url: null,
      archivo_nombre: null
    };
  }

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

    return {
      archivo_url: null,
      archivo_nombre: null
    };
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
  const texto = normalizarBusqueda(document.getElementById("searchInput")?.value || "");
  const estadoFiltro = document.getElementById("filterStatus")?.value || "";
  const pagoFiltro = document.getElementById("filterPago")?.value || "";
  const desde = document.getElementById("filterFechaDesde")?.value || "";
  const hasta = document.getElementById("filterFechaHasta")?.value || "";
  const operadorFiltro = document.getElementById("filterOperador")?.value || "";

  const filas = document.querySelectorAll("#orderTableBody tr");

  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");

    if (!celdas.length) return;

    const fecha = celdas[1]?.textContent.trim() || "";
    const operador = celdas[2]?.textContent.trim() || "";
    const cliente = celdas[3]?.textContent.trim() || "";
    const descripcion = celdas[4]?.textContent.trim() || "";
    const cantidad = celdas[5]?.querySelector("input")?.value || celdas[5]?.textContent.trim() || "";
    const material = celdas[6]?.textContent.trim() || "";
    const impresion = celdas[7]?.textContent.trim() || "";
    const precio = celdas[8]?.textContent.trim() || "";
    const estatus = celdas[9]?.querySelector("select")?.value || celdas[9]?.textContent.trim() || "";
    const pago = celdas[10]?.querySelector("select")?.value || celdas[10]?.textContent.trim() || "";
    const entrega = celdas[11]?.textContent.trim() || "";
    const archivo = celdas[12]?.textContent.trim() || "";

    const clienteNorm = normalizarBusqueda(cliente);

    const clienteRelacionado = clientesBusquedaDB.find(c => {
      return normalizarBusqueda(c.nombre) === clienteNorm;
    });

    const telefonoCliente = clienteRelacionado ? clienteRelacionado.telefono || "" : "";
    const correoCliente = clienteRelacionado ? clienteRelacionado.correo || "" : "";
    const notasCliente = clienteRelacionado ? clienteRelacionado.notas || "" : "";

    const contenido = normalizarBusqueda([
      fecha,
      cliente,
      descripcion,
      cantidad,
      material,
      impresion,
      precio,
      estatus,
      pago,
      entrega,
      archivo,
      telefonoCliente,
      correoCliente,
      notasCliente
    ].join(" "));

    let mostrar = true;

    if (texto && !contenido.includes(texto)) mostrar = false;
    if (estadoFiltro && estatus !== estadoFiltro) mostrar = false;
    if (pagoFiltro && pago !== pagoFiltro) mostrar = false;
    if (operadorFiltro && operador !== operadorFiltro) mostrar = false;
    if (desde && fecha < desde) mostrar = false;
    if (hasta && fecha > hasta) mostrar = false;

    fila.style.display = mostrar ? "" : "none";
  });
}

// ===========================
// INICIO
// ===========================
window.addEventListener("DOMContentLoaded", async () => {
  if (!validarSupabase()) return;

  marcarSupabaseActivo();
  ponerFechaHoy();

  try {
    await cargarClientesBusqueda();
  } catch (e) {
    console.error("Error cargando clientes para búsqueda:", e);
  }

  try {
    await cargarPedidos();
  } catch (e) {
    console.error("Error cargando pedidos al iniciar:", e);
  }

  try {
    await cargarOperadoresComandaDesdeSupabase();
  } catch (e) {
    console.error("Error cargando operadores:", e);
  }

  try {
    if (typeof cargarOperadoresEnComanda === "function") {
      await cargarOperadoresEnComanda();
    }
  } catch (e) {
    console.error("Error cargando operadores fallback:", e);
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

  aplicarOperadorSesion();

  if (typeof aplicarPermisosComanda === "function") {
    aplicarPermisosComanda();
  }

  try {
    iniciarNotificacionesComanda();
  } catch (e) {
    console.error("Error iniciando notificaciones:", e);
  }
});