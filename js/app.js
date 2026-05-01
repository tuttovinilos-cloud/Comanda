console.log("APP JS conectado correctamente");
console.log("Supabase:", window.supabaseClient);

let pedidoEditandoId = null;
let pedidosDB = [];
let archivoSeleccionado = null;
let materialesDB = [];
let tiposImpresionDB = [];
let clientesBusquedaDB = [];

// ---------------------------
// Indicador Supabase
// ---------------------------
const badge = document.getElementById("storageBadgeText");
if (badge) badge.textContent = "SUPABASE";

const badgeBox = document.getElementById("storageBadge");
if (badgeBox) badgeBox.classList.add("ok");

// ---------------------------
// Normalizar texto para búsqueda
// ---------------------------
function normalizarBusqueda(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ---------------------------
// Cargar materiales desde Supabase
// ---------------------------
async function cargarMateriales() {
  const { data, error } = await supabaseClient
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
      select.insertAdjacentHTML(
        "beforeend",
        `<option value="${m.nombre}">${m.nombre}</option>`
      );
    });

    if (valorActual) select.value = valorActual;
  });

  console.log("Materiales cargados:", materialesDB);
}

// ---------------------------
// Cargar tipos de impresión desde Supabase
// ---------------------------
async function cargarTiposImpresion() {
  const { data, error } = await supabaseClient
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
      select.insertAdjacentHTML(
        "beforeend",
        `<option value="${t.nombre}">${t.nombre}</option>`
      );
    });

    if (valorActual) select.value = valorActual;
  });

  console.log("Tipos de impresión cargados:", tiposImpresionDB);
}

// ---------------------------
// Cargar clientes para buscar por teléfono/correo/notas
// ---------------------------
async function cargarClientesBusqueda() {
  const { data, error } = await supabaseClient
    .from("clientes")
    .select("nombre, telefono, correo, notas");

  if (error) {
    console.warn("No se pudieron cargar clientes para búsqueda:", error);
    clientesBusquedaDB = [];
    return;
  }

  clientesBusquedaDB = data || [];
  console.log("Clientes para búsqueda cargados:", clientesBusquedaDB);
}

// ---------------------------
// Cargar pedidos desde Supabase
// ---------------------------
async function cargarPedidos() {
  const { data, error } = await supabaseClient
    .from("pedidos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error cargando pedidos:", error);
    return;
  }

  console.log("Pedidos:", data);
  pedidosDB = data || [];

  const tabla = document.getElementById("orderTableBody");
  if (!tabla) return;

  tabla.innerHTML = "";

  pedidosDB.forEach(p => {
    const archivo = p.archivo_url
      ? `<a class="file-link-chip" href="${p.archivo_url}" target="_blank" onclick="event.stopPropagation()">📎 ${p.archivo_nombre || "Archivo"}</a>`
      : "—";

    const fila = `
      <tr onclick="openEditOrder(${p.id})">
        <td>${p.id ?? ""}</td>
        <td>${p.fecha ?? ""}</td>
        <td>${p.operador ?? ""}</td>
        <td>${p.cliente ?? ""}</td>
        <td>${p.descripcion ?? ""}</td>

        <td>
          <input 
            class="cell-edit"
            value="${p.cantidad ?? ""}" 
            onchange="actualizarCampoPedido(${p.id}, 'cantidad', this.value)"
            onclick="event.stopPropagation()"
          />
        </td>

        <td>${p.material ?? ""}</td>
        <td>${p.tipo_impresion ?? ""}</td>
        <td>${p.precio ?? ""}</td>

        <td>
          <select 
            class="cell-select ${claseTrabajo(p.estatus_trabajo)}"
            onchange="actualizarCampoPedido(${p.id}, 'estatus_trabajo', this.value); this.className='cell-select ' + claseTrabajo(this.value)"
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
            onchange="actualizarCampoPedido(${p.id}, 'estatus_pago', this.value); this.className='cell-select ' + clasePago(this.value)"
            onclick="event.stopPropagation()"
          >
            <option ${p.estatus_pago === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option ${p.estatus_pago === "Abonado" ? "selected" : ""}>Abonado</option>
            <option ${p.estatus_pago === "Pagado" ? "selected" : ""}>Pagado</option>
          </select>
        </td>

        <td>${p.fecha_entrega || "—"}</td>
        <td>${archivo}</td>
      </tr>
    `;

    tabla.insertAdjacentHTML("beforeend", fila);
  });

  cargarOperadoresFiltroDesdeTabla();
  onSearch();
}

// ---------------------------
// Guardar desde fila rápida
// ---------------------------
async function saveQuickOrder() {
  const fecha = document.getElementById("q_fecha")?.value || "";
  const operador = document.getElementById("q_operador")?.value || "";
  const cliente = document.getElementById("q_cliente")?.value || "";
  const descripcion = document.getElementById("q_descripcion")?.value || "";
  const cantidad = document.getElementById("q_cantidad")?.value || "";
  const material = document.getElementById("q_material")?.value || "";
  const tipo_impresion = document.getElementById("q_impresion")?.value || "";
  const estatus_trabajo = document.getElementById("q_estatus_trabajo")?.value || "Solicitud";
  const estatus_pago = document.getElementById("q_estatus_pago")?.value || "Pendiente";
  const fecha_entrega = document.getElementById("q_entrega")?.value || null;

  if (!cliente && !descripcion) {
    alert("Coloca al menos cliente o descripción");
    return;
  }

  console.log("Archivo antes de guardar:", archivoSeleccionado);
  const archivoData = await subirArchivoPedido();
  console.log("Archivo subido:", archivoData);

  const { error } = await supabaseClient.from("pedidos").insert([{
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
    alert("Error guardando pedido");
    return;
  }

  alert("Pedido guardado");

  archivoSeleccionado = null;
  limpiarFilaRapida();
  ponerFechaHoy();
  await cargarPedidos();
}

// ---------------------------
// Guardar / actualizar pedido desde modal
// ---------------------------
async function saveOrder() {
  const fecha = document.getElementById("f_fecha")?.value || "";
  const operador = document.getElementById("f_operador")?.value || "";
  const cliente = document.getElementById("f_cliente")?.value || "";
  const descripcion = document.getElementById("f_descripcion")?.value || "";
  const cantidad = document.getElementById("f_cantidad")?.value || "";
  const material = document.getElementById("f_material")?.value || "";
  const tipo_impresion = document.getElementById("f_impresion")?.value || "";
  const fecha_entrega = document.getElementById("f_entrega")?.value || null;

  const archivoData = await subirArchivoPedido();

  const datosPedido = {
    fecha,
    operador,
    cliente,
    descripcion,
    cantidad,
    material,
    tipo_impresion,
    fecha_entrega
  };

  // Solo cambia el archivo si el usuario seleccionó uno nuevo.
  if (archivoData.archivo_url) {
    datosPedido.archivo_url = archivoData.archivo_url;
    datosPedido.archivo_nombre = archivoData.archivo_nombre;
  }

  let error;

  if (pedidoEditandoId) {
    const respuesta = await supabaseClient
      .from("pedidos")
      .update(datosPedido)
      .eq("id", pedidoEditandoId);

    error = respuesta.error;
  } else {
    datosPedido.estatus_trabajo = "Solicitud";
    datosPedido.estatus_pago = "Pendiente";

    const respuesta = await supabaseClient
      .from("pedidos")
      .insert([datosPedido]);

    error = respuesta.error;
  }

  if (error) {
    console.error("Error guardando pedido:", error);
    alert("Error guardando pedido");
    return;
  }

  alert(pedidoEditandoId ? "Pedido actualizado" : "Pedido guardado");

  pedidoEditandoId = null;
  archivoSeleccionado = null;
  closeModal("orderBackdrop");
  await cargarPedidos();
}

// ---------------------------
// Actualizar campo rápido en Supabase
// ---------------------------
async function actualizarCampoPedido(id, campo, valor) {
  const { error } = await supabaseClient
    .from("pedidos")
    .update({ [campo]: valor })
    .eq("id", id);

  if (error) {
    console.error("Error actualizando campo:", error);
    alert("Error actualizando");
    return;
  }

  console.log(`Pedido ${id} actualizado: ${campo} = ${valor}`);
}

// ---------------------------
// Abrir pedido para editar
// ---------------------------
function openEditOrder(id) {
  const pedido = pedidosDB.find(p => Number(p.id) === Number(id));

  if (!pedido) {
    alert("No se encontró el pedido");
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

// ---------------------------
// Abrir modal nuevo pedido
// ---------------------------
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

// ---------------------------
// Cerrar modal genérico
// ---------------------------
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";

  pedidoEditandoId = null;
}

// ---------------------------
// Cerrar modal al tocar fondo oscuro
// ---------------------------
function bdClick(event, id) {
  if (event.target.id === id) {
    closeModal(id);
  }
}

// ---------------------------
// Fecha automática
// ---------------------------
function ponerFechaHoy() {
  const hoy = new Date().toISOString().split("T")[0];

  const qFecha = document.getElementById("q_fecha");
  if (qFecha && !qFecha.value) {
    qFecha.value = hoy;
  }

  const fFecha = document.getElementById("f_fecha");
  if (fFecha && !fFecha.value) {
    fFecha.value = hoy;
  }
}

// ---------------------------
// Limpiar fila rápida después de guardar
// ---------------------------
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
}

// ---------------------------
// Limpiar fila rápida manual
// ---------------------------
function clearQuickEntry() {
  limpiarFilaRapida();
  ponerFechaHoy();
}

// ---------------------------
// Clases de color para select
// ---------------------------
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

// ---------------------------
// Archivo desde modal
// ---------------------------
function handleFileSelect(event) {
  archivoSeleccionado = event.target.files[0] || null;

  if (archivoSeleccionado) {
    alert("Archivo seleccionado: " + archivoSeleccionado.name);

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
}

// ---------------------------
// Archivo desde fila rápida
// ---------------------------
function openQuickAttach() {
  const input = document.getElementById("rowFileInput");
  if (input) input.click();
}

function handleRowFileSelect(event) {
  archivoSeleccionado = event.target.files[0] || null;

  if (archivoSeleccionado) {
    alert("Archivo seleccionado: " + archivoSeleccionado.name);
  }
}

// ---------------------------
// Quitar archivo seleccionado
// ---------------------------
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

// ---------------------------
// Subir archivo a Supabase Storage
// ---------------------------
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

  const { error } = await supabaseClient.storage
    .from("adjuntos-pedidos")
    .upload(ruta, archivoSeleccionado);

  if (error) {
    console.error("Error subiendo archivo:", error);
    alert("Error subiendo archivo");

    return {
      archivo_url: null,
      archivo_nombre: null
    };
  }

  const { data } = supabaseClient.storage
    .from("adjuntos-pedidos")
    .getPublicUrl(ruta);

  const resultado = {
    archivo_url: data.publicUrl,
    archivo_nombre: archivoSeleccionado.name
  };

  archivoSeleccionado = null;

  return resultado;
}

// ---------------------------
// Buscar / filtrar comanda
// ---------------------------
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
    const clienteRelacionado = clientesBusquedaDB.find(c => normalizarBusqueda(c.nombre) === clienteNorm);

    const telefonoCliente = clienteRelacionado?.telefono || "";
    const correoCliente = clienteRelacionado?.correo || "";
    const notasCliente = clienteRelacionado?.notas || "";

    const contenido = normalizarBusqueda([
      fecha,
      operador,
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

// ---------------------------
// Cargar operadores en filtro
// ---------------------------
function cargarOperadoresFiltroDesdeTabla() {
  const select = document.getElementById("filterOperador");
  if (!select) return;

  const actual = select.value;
  const filas = document.querySelectorAll("#orderTableBody tr");
  const operadores = new Set();

  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    const operador = celdas[2]?.textContent.trim();
    if (operador) operadores.add(operador);
  });

  select.innerHTML = `<option value="">Operador</option>`;

  [...operadores].sort().forEach(op => {
    select.insertAdjacentHTML("beforeend", `<option value="${op}">${op}</option>`);
  });

  if (actual) select.value = actual;
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", async () => {
  ponerFechaHoy();
  await cargarClientesBusqueda();
  await cargarMateriales();
  await cargarTiposImpresion();
  await cargarPedidos();
});
