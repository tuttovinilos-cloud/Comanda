console.log("Clientes JS conectado");

let clientesDB = [];
let pedidosDB = [];

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
// Escapar HTML básico
// ---------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ---------------------------
// Normalizar nombre para detectar duplicados
// ---------------------------
function normalizarNombre(nombre) {
  return String(nombre || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

// ---------------------------
// Cargar clientes
// ---------------------------
async function cargarClientesAdmin() {
  const { data, error } = await supabaseClient
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando clientes:", error);
    toast("Error cargando clientes");
    return;
  }

  clientesDB = data || [];
  renderClientes();
}

// ---------------------------
// Cargar pedidos para conteo/historial
// ---------------------------
async function cargarPedidosClientes() {
  const { data, error } = await supabaseClient
    .from("pedidos")
    .select("id, fecha, cliente, descripcion, cantidad, material, tipo_impresion, estatus_trabajo, estatus_pago, fecha_entrega")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error cargando pedidos:", error);
    toast("Error cargando pedidos");
    return;
  }

  pedidosDB = data || [];
}

// ---------------------------
// Contar pedidos por nombre de cliente
// ---------------------------
function pedidosDelCliente(nombre) {
  const n = normalizarNombre(nombre);

  return pedidosDB.filter(p => {
    return normalizarNombre(p.cliente) === n;
  });
}

// ---------------------------
// Detectar duplicados
// ---------------------------
function contarDuplicados() {
  const mapa = {};

  clientesDB.forEach(c => {
    const n = normalizarNombre(c.nombre);
    if (!n) return;
    mapa[n] = (mapa[n] || 0) + 1;
  });

  return Object.values(mapa).filter(total => total > 1).length;
}

// ---------------------------
// Render clientes
// ---------------------------
function renderClientes() {
  const tbody = document.getElementById("clientesBody");
  const count = document.getElementById("clientesCount");
  const dupCount = document.getElementById("duplicadosCount");
  const filtro = (document.getElementById("searchClientes")?.value || "").toLowerCase().trim();

  if (!tbody) return;

  const lista = clientesDB.filter(c => {
    const texto = [
      c.nombre,
      c.tipo_cliente,
      c.telefono,
      c.correo,
      c.notas
    ].join(" ").toLowerCase();

    return !filtro || texto.includes(filtro);
  });

  if (count) count.textContent = `${clientesDB.length} clientes`;
  if (dupCount) dupCount.textContent = `${contarDuplicados()} posibles duplicados`;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Sin clientes</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  lista.forEach(c => {
    const pedidos = pedidosDelCliente(c.nombre);
    const activo = c.activo !== false;

    const fila = `
      <tr data-id="${c.id}">
        <td>
          <input class="name-input cli-nombre" data-id="${c.id}" value="${escapeHtml(c.nombre)}">
        </td>

        <td>
          <select class="type-select cli-tipo" data-id="${c.id}">
            <option ${c.tipo_cliente === "Cliente VIP" ? "selected" : ""}>Cliente VIP</option>
            <option ${c.tipo_cliente === "Cliente Standar" ? "selected" : ""}>Cliente Standar</option>
            <option ${c.tipo_cliente === "Cliente basico" ? "selected" : ""}>Cliente basico</option>
            <option ${c.tipo_cliente === "Editado" ? "selected" : ""}>Editado</option>
          </select>
        </td>

        <td>
          <input class="phone-input cli-telefono" data-id="${c.id}" value="${escapeHtml(c.telefono || "")}" placeholder="Teléfono">
        </td>

        <td>
          <input class="email-input cli-correo" data-id="${c.id}" value="${escapeHtml(c.correo || "")}" placeholder="Correo">
        </td>

        <td>
          <textarea class="notes-input cli-notas" data-id="${c.id}" placeholder="Notas">${escapeHtml(c.notas || "")}</textarea>
        </td>

        <td>
          <button class="mini-btn info" onclick="verHistorialCliente(${c.id})">${pedidos.length} pedidos</button>
        </td>

        <td>
          <select class="active-select cli-activo" data-id="${c.id}">
            <option value="true" ${activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <button class="mini-btn del" onclick="eliminarCliente(${c.id})">Eliminar</button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}

// ---------------------------
// Filtrar clientes
// ---------------------------
function filtrarClientes() {
  renderClientes();
}

// ---------------------------
// Nuevo cliente
// ---------------------------
async function nuevoCliente() {
  const nombreUnico = "Nuevo cliente " + Date.now();

  const { error } = await supabaseClient
    .from("clientes")
    .insert([{
      nombre: nombreUnico,
      tipo_cliente: "Cliente Standar",
      telefono: "",
      correo: "",
      notas: "",
      activo: true
    }]);

  if (error) {
    console.error("Error creando cliente:", error);
    toast("Error creando cliente");
    return;
  }

  toast("Cliente añadido");
  await cargarClientesAdmin();
}

// ---------------------------
// Guardar todos los clientes
// ---------------------------
async function guardarTodosClientes() {
  const updates = clientesDB.map(c => {
    const id = c.id;

    const nombre = document.querySelector(`.cli-nombre[data-id="${id}"]`)?.value.trim() || "";
    const tipo_cliente = document.querySelector(`.cli-tipo[data-id="${id}"]`)?.value || "Cliente Standar";
    const telefono = document.querySelector(`.cli-telefono[data-id="${id}"]`)?.value.trim() || "";
    const correo = document.querySelector(`.cli-correo[data-id="${id}"]`)?.value.trim() || "";
    const notas = document.querySelector(`.cli-notas[data-id="${id}"]`)?.value.trim() || "";
    const activo = document.querySelector(`.cli-activo[data-id="${id}"]`)?.value === "true";

    if (!nombre) return null;

    return supabaseClient
      .from("clientes")
      .update({
        nombre,
        tipo_cliente,
        telefono,
        correo,
        notas,
        activo
      })
      .eq("id", id);
  }).filter(Boolean);

  if (!updates.length) {
    toast("No hay clientes para guardar");
    return;
  }

  const resultados = await Promise.all(updates);
  const error = resultados.find(r => r.error)?.error;

  if (error) {
    console.error("Error guardando clientes:", error);
    toast("Error guardando clientes");
    return;
  }

  toast("Clientes guardados");
  await recargarTodo();
}

// ---------------------------
// Eliminar cliente
// NOTA: lo desactiva para no romper historial.
// ---------------------------
async function eliminarCliente(id) {
  const confirmar = confirm("¿Eliminar este cliente de la lista activa?");
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("clientes")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando cliente:", error);
    toast("Error eliminando cliente");
    return;
  }

  toast("Cliente eliminado");
  await cargarClientesAdmin();
}

// ---------------------------
// Ver historial del cliente
// ---------------------------
function verHistorialCliente(id) {
  const cliente = clientesDB.find(c => Number(c.id) === Number(id));
  if (!cliente) return;

  const pedidos = pedidosDelCliente(cliente.nombre);

  const title = document.getElementById("historyTitle");
  const body = document.getElementById("historyBody");
  const backdrop = document.getElementById("historyBackdrop");

  if (title) title.textContent = `Historial · ${cliente.nombre}`;

  if (!body) return;

  if (!pedidos.length) {
    body.innerHTML = `<div class="empty">Sin pedidos asociados</div>`;
  } else {
    body.innerHTML = "";

    pedidos.forEach(p => {
      const item = `
        <div class="history-item">
          <div class="history-top">
            <span>#${p.id} · ${p.fecha || "Sin fecha"}</span>
            <span>${p.estatus_trabajo || ""} / ${p.estatus_pago || ""}</span>
          </div>
          <div class="history-desc">${escapeHtml(p.descripcion || "")}</div>
          <div style="margin-top:6px;color:var(--muted2);font-size:12px">
            Cantidad: ${escapeHtml(p.cantidad || "")} · Material: ${escapeHtml(p.material || "")} · Impresión: ${escapeHtml(p.tipo_impresion || "")}
          </div>
        </div>
      `;

      body.insertAdjacentHTML("beforeend", item);
    });
  }

  if (backdrop) backdrop.style.display = "flex";
}

// ---------------------------
// Cerrar historial
// ---------------------------
function cerrarHistorial() {
  const backdrop = document.getElementById("historyBackdrop");
  if (backdrop) backdrop.style.display = "none";
}

function cerrarHistorialSiFondo(event) {
  if (event.target.id === "historyBackdrop") {
    cerrarHistorial();
  }
}

// ---------------------------
// Recargar todo
// ---------------------------
async function recargarTodo() {
  await cargarPedidosClientes();
  await cargarClientesAdmin();
  toast("Clientes recargados");
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await recargarTodo();
});
