console.log("Clientes JS v16 conectado");

let clientesDB = [];
let pedidosDB = [];

// ===========================
// SUPABASE
// ===========================
function dbClientes() {
  return window.supabaseClient || window.supabase;
}

function validarSupabaseClientes() {
  if (!dbClientes()) {
    console.error("No existe conexión Supabase");
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
    alert(msg);
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
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarNombre(nombre) {
  return String(nombre || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nombreBonito(nombre) {
  const limpio = String(nombre || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!limpio) return "";

  return limpio
    .split(" ")
    .map(p => {
      if (!p) return "";
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join(" ");
}

function fechaCorta(valor) {
  return String(valor || "").slice(0, 10) || "—";
}

function clientePorId(id) {
  return clientesDB.find(c => Number(c.id) === Number(id));
}

function pedidosDelCliente(nombre) {
  const n = normalizarNombre(nombre);

  return pedidosDB.filter(p => {
    return normalizarNombre(p.cliente) === n;
  });
}

function mapaClientesActuales() {
  const mapa = {};

  clientesDB.forEach(c => {
    const norm = normalizarNombre(c.nombre);
    if (!norm) return;
    mapa[norm] = c;
  });

  return mapa;
}

function mapaClientesDesdePedidos() {
  const mapa = {};

  pedidosDB.forEach(p => {
    const nombreOriginal = String(p.cliente || "").trim();
    const norm = normalizarNombre(nombreOriginal);

    if (!norm) return;

    if (!mapa[norm]) {
      mapa[norm] = {
        nombre: nombreBonito(nombreOriginal),
        norm,
        pedidos: [],
        ultimoUso: ""
      };
    }

    mapa[norm].pedidos.push(p);

    const fecha = fechaCorta(p.fecha);
    if (fecha !== "—" && fecha > mapa[norm].ultimoUso) {
      mapa[norm].ultimoUso = fecha;
    }
  });

  return mapa;
}

// ===========================
// CARGAR DATOS
// ===========================
async function cargarPedidosClientes() {
  if (!validarSupabaseClientes()) return;

  const { data, error } = await dbClientes()
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

async function cargarClientesAdmin() {
  if (!validarSupabaseClientes()) return;

  const { data, error } = await dbClientes()
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando clientes:", error);
    toast("Error cargando clientes");
    return;
  }

  clientesDB = data || [];
}

// ===========================
// SINCRONIZAR AUTOMÁTICO DESDE PEDIDOS
// ===========================
async function sincronizarAutomaticoDesdePedidos() {
  if (!validarSupabaseClientes()) return;

  const mapaPedidos = mapaClientesDesdePedidos();
  const mapaClientes = mapaClientesActuales();

  const nuevos = [];

  Object.values(mapaPedidos).forEach(item => {
    if (!mapaClientes[item.norm]) {
      nuevos.push({
        nombre: item.nombre,
        tipo_cliente: "Cliente Standar",
        telefono: "",
        correo: "",
        notas: "Creado automáticamente desde pedidos",
        activo: true
      });
    }
  });

  if (!nuevos.length) return;

  const { error } = await dbClientes()
    .from("clientes")
    .insert(nuevos);

  if (error) {
    console.error("Error sincronizando clientes desde pedidos:", error);
    toast("Error sincronizando clientes");
    return;
  }

  toast(`${nuevos.length} clientes creados desde pedidos`);

  await cargarClientesAdmin();
}

// ===========================
// RENDER CLIENTES
// ===========================
function renderClientes() {
  const tbody = document.getElementById("clientesBody");
  const count = document.getElementById("clientesCount");

  if (!tbody) return;

  const filtro = normalizarNombre(document.getElementById("searchClientes")?.value || "");
  const orden = document.getElementById("ordenClientes")?.value || "nombre_az";

  let lista = [...clientesDB];

  if (filtro) {
    lista = lista.filter(c => {
      const texto = normalizarNombre([
        c.nombre,
        c.tipo_cliente,
        c.telefono,
        c.correo,
        c.notas
      ].join(" "));

      return texto.includes(filtro);
    });
  }

  lista.sort((a, b) => {
    const na = normalizarNombre(a.nombre);
    const nb = normalizarNombre(b.nombre);

    const pedidosA = pedidosDelCliente(a.nombre).length;
    const pedidosB = pedidosDelCliente(b.nombre).length;

    if (orden === "nombre_az") return na.localeCompare(nb);
    if (orden === "nombre_za") return nb.localeCompare(na);
    if (orden === "pedidos_mayor") return pedidosB - pedidosA;
    if (orden === "pedidos_menor") return pedidosA - pedidosB;

    return na.localeCompare(nb);
  });

  if (count) count.textContent = `${clientesDB.length} clientes`;

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

function filtrarClientes() {
  renderClientes();
}

// ===========================
// NUEVO CLIENTE
// ===========================
async function nuevoCliente() {
  if (!validarSupabaseClientes()) return;

  const nombreUnico = "Nuevo cliente " + Date.now();

  const { error } = await dbClientes()
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
  await recargarTodo();
}

// ===========================
// DETECTAR DUPLICADO EXACTO AL GUARDAR
// ===========================
function buscarClienteConMismoNombre(nombreNuevo, idActual) {
  const nuevoNorm = normalizarNombre(nombreNuevo);

  if (!nuevoNorm) return null;

  return clientesDB.find(c => {
    if (Number(c.id) === Number(idActual)) return false;
    return normalizarNombre(c.nombre) === nuevoNorm;
  }) || null;
}

// ===========================
// GUARDAR CLIENTES
// ===========================
async function guardarTodosClientes() {
  if (!validarSupabaseClientes()) return;

  // Primero revisa si un cambio de nombre coincide con otro cliente
  for (const c of clientesDB) {
    const id = c.id;
    const inputNombre = document.querySelector(`.cli-nombre[data-id="${id}"]`);

    if (!inputNombre) continue;

    const nombreNuevo = inputNombre.value.trim();

    if (!nombreNuevo) continue;

    const cambioNombre = normalizarNombre(nombreNuevo) !== normalizarNombre(c.nombre);

    if (cambioNombre) {
      const duplicado = buscarClienteConMismoNombre(nombreNuevo, id);

      if (duplicado) {
        const confirmar = confirm(
          `⚠️ Nombre duplicado detectado\n\n` +
          `Ya existe: ${duplicado.nombre}\n\n` +
          `Estás intentando cambiar:\n${c.nombre}\n\n` +
          `por:\n${duplicado.nombre}\n\n` +
          `Si continúas, todos los pedidos de "${c.nombre}" pasarán a "${duplicado.nombre}".\n\n` +
          `¿Deseas unificar?`
        );

        if (!confirmar) {
          toast("Guardado cancelado");
          return;
        }

        await unificarCliente(c, duplicado);
        return;
      }
    }
  }

  const updates = clientesDB.map(c => {
    const id = c.id;

    const nombre = document.querySelector(`.cli-nombre[data-id="${id}"]`)?.value.trim() || "";
    const tipo_cliente = document.querySelector(`.cli-tipo[data-id="${id}"]`)?.value || "Cliente Standar";
    const telefono = document.querySelector(`.cli-telefono[data-id="${id}"]`)?.value.trim() || "";
    const correo = document.querySelector(`.cli-correo[data-id="${id}"]`)?.value.trim() || "";
    const notas = document.querySelector(`.cli-notas[data-id="${id}"]`)?.value.trim() || "";
    const activo = document.querySelector(`.cli-activo[data-id="${id}"]`)?.value === "true";

    if (!nombre) return null;

    return dbClientes()
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

// ===========================
// UNIFICAR CLIENTE
// ===========================
async function unificarCliente(origen, principal) {
  if (!origen || !principal) {
    toast("No se pudo unificar");
    return;
  }

  const pedidosOrigen = pedidosDelCliente(origen.nombre);

  for (const pedido of pedidosOrigen) {
    const { error } = await dbClientes()
      .from("pedidos")
      .update({ cliente: principal.nombre })
      .eq("id", pedido.id);

    if (error) {
      console.error("Error actualizando pedido:", error);
      toast("Error unificando pedidos");
      return;
    }
  }

  const notasFinales = [
    principal.notas,
    origen.notas,
    `Unificado desde: ${origen.nombre}`
  ].filter(Boolean).join("\n");

  await dbClientes()
    .from("clientes")
    .update({
      telefono: principal.telefono || origen.telefono || "",
      correo: principal.correo || origen.correo || "",
      notas: notasFinales,
      activo: true
    })
    .eq("id", principal.id);

  const { error: deleteError } = await dbClientes()
    .from("clientes")
    .delete()
    .eq("id", origen.id);

  if (deleteError) {
    await dbClientes()
      .from("clientes")
      .update({
        activo: false,
        notas: [
          origen.notas,
          `Cliente unificado con: ${principal.nombre}`
        ].filter(Boolean).join("\n")
      })
      .eq("id", origen.id);
  }

  toast("Clientes unificados");
  await recargarTodo();
}

// ===========================
// ELIMINAR / DESACTIVAR
// ===========================
async function eliminarCliente(id) {
  if (!validarSupabaseClientes()) return;

  const cliente = clientePorId(id);

  if (!cliente) {
    toast("Cliente no encontrado");
    return;
  }

  const confirmar = confirm(`¿Desactivar cliente "${cliente.nombre}"?`);
  if (!confirmar) return;

  const { error } = await dbClientes()
    .from("clientes")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error desactivando cliente:", error);
    toast("Error desactivando cliente");
    return;
  }

  toast("Cliente desactivado");
  await recargarTodo();
}

// ===========================
// HISTORIAL
// ===========================
function verHistorialCliente(id) {
  const cliente = clientePorId(id);
  if (!cliente) return;

  const pedidos = pedidosDelCliente(cliente.nombre);

  abrirHistorial(cliente.nombre, pedidos);
}

function abrirHistorial(nombre, pedidos) {
  const title = document.getElementById("historyTitle");
  const body = document.getElementById("historyBody");
  const backdrop = document.getElementById("historyBackdrop");

  if (title) title.textContent = `Historial · ${nombre}`;
  if (!body) return;

  if (!pedidos.length) {
    body.innerHTML = `<div class="empty">Sin pedidos asociados</div>`;
  } else {
    body.innerHTML = "";

    pedidos.forEach(p => {
      const item = `
        <div class="history-item">
          <div class="history-top">
            <span>#${p.id} · ${fechaCorta(p.fecha)}</span>
            <span>${escapeHtml(p.estatus_trabajo || "")} / ${escapeHtml(p.estatus_pago || "")}</span>
          </div>

          <div class="history-desc">${escapeHtml(p.descripcion || "")}</div>

          <div style="margin-top:6px;color:var(--muted2);font-size:12px">
            Cantidad: ${escapeHtml(p.cantidad || "")} ·
            Material: ${escapeHtml(p.material || "")} ·
            Impresión: ${escapeHtml(p.tipo_impresion || "")}
          </div>
        </div>
      `;

      body.insertAdjacentHTML("beforeend", item);
    });
  }

  if (backdrop) backdrop.style.display = "flex";
}

function cerrarHistorial() {
  const backdrop = document.getElementById("historyBackdrop");
  if (backdrop) backdrop.style.display = "none";
}

function cerrarHistorialSiFondo(event) {
  if (event.target.id === "historyBackdrop") {
    cerrarHistorial();
  }
}

// ===========================
// RECARGAR TODO
// ===========================
async function recargarTodo() {
  await cargarPedidosClientes();
  await cargarClientesAdmin();

  await sincronizarAutomaticoDesdePedidos();

  renderClientes();

  toast("Clientes actualizados");
}

// ===========================
// INICIO
// ===========================
window.addEventListener("DOMContentLoaded", async () => {
  await recargarTodo();
});