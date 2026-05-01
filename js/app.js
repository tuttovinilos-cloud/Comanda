console.log("APP JS conectado correctamente");
console.log("Supabase:", window.supabaseClient);
let pedidoEditandoId = null;
let pedidosDB = [];

// Forzar indicador a Supabase
const badge = document.getElementById("storageBadgeText");
if (badge) badge.textContent = "SUPABASE";

const badgeBox = document.getElementById("storageBadge");
if (badgeBox) badgeBox.classList.add("ok");

// ---------------------------
// Cargar pedidos
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

  const tabla = document.getElementById("orderTableBody");;
  if (!tabla) return;

  tabla.innerHTML = "";

  data.forEach(p => {
    const fila = `
      <tr onclick="openEditOrder(${p.id})">
        <td>${p.id ?? ""}</td>
        <td>${p.fecha ?? ""}</td>
        <td>${p.operador ?? ""}</td>
        <td>${p.cliente ?? ""}</td>
        <td>${p.descripcion ?? ""}</td>
        <td>${p.cantidad ?? ""}</td>
        <td>${p.material ?? ""}</td>
        <td>${p.tipo_impresion ?? ""}</td>
        <td>${p.precio ?? ""}</td>
<td>${badgeTrabajo(p.estatus_trabajo)}</td>
<td>${badgePago(p.estatus_pago)}</td>
        <td>${p.fecha_entrega ?? ""}</td>
      </tr>
    `;
    tabla.insertAdjacentHTML("beforeend", fila);
  });
}

// Ejecutar al cargar
window.addEventListener("DOMContentLoaded", cargarPedidos);
// ---------------------------
// Guardar pedido
// ---------------------------

async function guardarPedido() {
  const fila = document.querySelector("tr"); // fila de ingreso

  const fecha = fila.querySelector('input[type="date"]').value;
  const operador = fila.querySelector('select').value;
  const cliente = fila.querySelector('input[placeholder="Cliente"]').value;
  const descripcion = fila.querySelector('textarea').value;
  const cantidad = fila.querySelector('input[placeholder="Cantidad / m"]').value;

  const { error } = await supabaseClient.from("pedidos").insert([
    {
      fecha,
      operador,
      cliente,
      descripcion,
      cantidad
    }
  ]);

  if (error) {
    console.error("Error guardando:", error);
    return;
  }

  alert("Pedido guardado");

  cargarPedidos(); // recargar tabla
}
// ---------------------------
// Guardar desde botón GUARDAR del modal
// ---------------------------
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

  const modal = document.getElementById("orderBackdrop");
  if (modal) modal.style.display = "none";

  cargarPedidos();
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
  const fecha_entrega = document.getElementById("q_entrega")?.value || "";

  if (!cliente && !descripcion) {
    alert("Coloca al menos cliente o descripción");
    return;
  }

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
    fecha_entrega
  }]);

  if (error) {
    console.error("Error guardando pedido rápido:", error);
    alert("Error guardando pedido");
    return;
  }

  alert("Pedido guardado");
  cargarPedidos();
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

window.addEventListener("DOMContentLoaded", ponerFechaHoy);
// ---------------------------
// Badges de estado
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
// Cerrar modal genérico
// ---------------------------
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";

  pedidoEditandoId = null;
}
// ---------------------------
// Cerrar modal
// ---------------------------
function closeModal(id) {
  console.log("cerrando modal:", id); // para verificar

  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
  } else {
    console.log("no encontró modal");
  }

  pedidoEditandoId = null;
}
