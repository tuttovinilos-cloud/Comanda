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

  const tabla = document.querySelector("tbody");
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
        <td>${p.estatus_trabajo ?? ""}</td>
        <td>${p.estatus_pago ?? ""}</td>
        <td>${p.fecha_entrega ?? ""}</td>
      </tr>
    `;
    tabla.insertAdjacentHTML("beforeend", fila);
  });
}

// Ejecutar al cargar
window.addEventListener("DOMContentLoaded", cargarPedidos);
