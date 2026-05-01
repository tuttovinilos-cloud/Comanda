console.log("APP JS conectado correctamente");
console.log("Supabase:", window.supabaseClient);

let pedidoEditandoId = null;
let pedidosDB = [];
let archivoSeleccionado = null;

// ---------------------------
// Indicador Supabase
// ---------------------------
const badge = document.getElementById("storageBadgeText");
if (badge) badge.textContent = "SUPABASE";

const badgeBox = document.getElementById("storageBadge");
if (badgeBox) badgeBox.classList.add("ok");

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
      </tr>
    `;

    tabla.insertAdjacentHTML("beforeend", fila);
  });
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
const archivoData = await subirArchivoPedido();

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

  limpiarFilaRapida();
  ponerFechaHoy();
  cargarPedidos();
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
  const fecha_entrega = document.getElementById("f_entrega")?.value || "";

const archivoData = await subirArchivoPedido();

const datosPedido = {
  fecha,
  operador,
  cliente,
  descripcion,
  cantidad,
  material,
  tipo_impresion,
  fecha_entrega,
  archivo_url: archivoData.archivo_url,
  archivo_nombre: archivoData.archivo_nombre
};

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
  closeModal("orderBackdrop");
  cargarPedidos();
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

  const modal = document.getElementById("orderBackdrop");
  if (modal) modal.style.display = "flex";
}

// ---------------------------
// Abrir modal nuevo pedido
// ---------------------------
function openOrderModal() {
  pedidoEditandoId = null;

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
}

// ---------------------------
// Limpiar fila rápida manual
// ---------------------------
function clearQuickEntry() {
  limpiarFilaRapida();
  ponerFechaHoy();
}

// ---------------------------
// Badges de estado
// Se dejan por compatibilidad, aunque ahora usamos select directo en tabla.
// ---------------------------
function badgeTrabajo(valor) {
  const estado = valor || "";

  if (estado === "Solicitud") {
    return `<span class="badge" style="background:#FF3B3022;color:#FF3B30;border:1px solid #FF3B30">Solicitud</span>`;
  }

  if (estado === "Revisado") {
    return `<span class="badge" style="background:#FFD60A22;color:#FFD60A;border:1px solid #FFD60A">Revisado</span>`;
  }

  if (estado === "Listo") {
    return `<span class="badge" style="background:#30D15822;color:#30D158;border:1px solid #30D158">Listo</span>`;
  }

  return `<span class="badge">${estado}</span>`;
}

function badgePago(valor) {
  const estado = valor || "";

  if (estado === "Pendiente") {
    return `<span class="badge" style="background:#FF453A22;color:#FF453A;border:1px solid #FF453A">Pendiente</span>`;
  }

  if (estado === "Abonado") {
    return `<span class="badge" style="background:#FF9F0A22;color:#FF9F0A;border:1px solid #FF9F0A">Abonado</span>`;
  }

  if (estado === "Pagado") {
    return `<span class="badge" style="background:#32D74B22;color:#32D74B;border:1px solid #32D74B">Pagado</span>`;
  }

  return `<span class="badge">${estado}</span>`;
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
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
  ponerFechaHoy();
  cargarPedidos();
});
// ---------------------------
// Seleccionar archivo
// ---------------------------
function handleFileSelect(event) {
  archivoSeleccionado = event.target.files[0] || null;

  if (archivoSeleccionado) {
    alert("Archivo seleccionado: " + archivoSeleccionado.name);
  }
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

  const nombreLimpio = archivoSeleccionado.name.replace(/\s+/g, "_");
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

  return {
    archivo_url: data.publicUrl,
    archivo_nombre: archivoSeleccionado.name
  };
}
// ---------------------------
// Archivo desde modal
// ---------------------------
function handleFileSelect(event) {
  archivoSeleccionado = event.target.files[0] || null;

  if (archivoSeleccionado) {
    alert("Archivo seleccionado: " + archivoSeleccionado.name);
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
// Subir archivo a Supabase Storage
// ---------------------------
async function subirArchivoPedido() {
  if (!archivoSeleccionado) {
    return {
      archivo_url: null,
      archivo_nombre: null
    };
  }

  const nombreLimpio = archivoSeleccionado.name.replace(/\s+/g, "_");
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
