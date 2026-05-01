console.log("APP JS conectado correctamente");
console.log("Supabase:", window.supabaseClient);

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

  const tabla = document.getElementById("orderTableBody");;
  if (!tabla) return;

  tabla.innerHTML = "";

  data.forEach(p => {
    const fila = `
      <tr>
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
async function saveOrder() {
  const fecha = document.getElementById("f_fecha")?.value || "";
  const operador = document.getElementById("f_operador")?.value || "";
  const cliente = document.getElementById("f_cliente")?.value || "";
  const descripcion = document.getElementById("f_descripcion")?.value || "";
  const cantidad = document.getElementById("f_cantidad")?.value || "";
  const material = document.getElementById("f_material")?.value || "";
  const tipo_impresion = document.getElementById("f_impresion")?.value || "";
  const fecha_entrega = document.getElementById("f_entrega")?.value || "";

  const { error } = await supabaseClient.from("pedidos").insert([{
    fecha,
    operador,
    cliente,
    descripcion,
    cantidad,
    material,
    tipo_impresion,
    estatus_trabajo: "Solicitud",
    estatus_pago: "Pendiente",
    fecha_entrega
  }]);

  if (error) {
    console.error("Error guardando pedido:", error);
    alert("Error guardando pedido");
    return;
  }

  alert("Pedido guardado");
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
