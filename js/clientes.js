console.log("Clientes JS v17 conectado");

let clientesDB = [];
let pedidosDB = [];

function dbClientes() { return window.supabaseClient || window.supabase; }
function validarSupabaseClientes() {
  if (!dbClientes()) { console.error("No existe conexión Supabase"); toast("No existe conexión Supabase"); return false; }
  return true;
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 1800);
}

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
  const limpio = String(nombre || "").trim().replace(/\s+/g, " ");
  if (!limpio) return "";
  return limpio.split(" ").map(p => p ? (p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()) : "").join(" ");
}

function esRobertoNombre(nombre) { return normalizarNombre(nombre) === "roberto"; }
function fechaCorta(valor) { return String(valor || "").slice(0, 10) || "-"; }
function clientePorId(id) { return clientesDB.find(c => Number(c.id) === Number(id)); }

function pedidosDelCliente(nombre) {
  const n = normalizarNombre(nombre);
  return pedidosDB.filter(p => normalizarNombre(p.cliente) === n);
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
    if (!mapa[norm]) mapa[norm] = { nombre: nombreBonito(nombreOriginal), norm, pedidos: [], ultimoUso: "" };
    mapa[norm].pedidos.push(p);
    const fecha = fechaCorta(p.fecha);
    if (fecha !== "-" && fecha > mapa[norm].ultimoUso) mapa[norm].ultimoUso = fecha;
  });
  return mapa;
}

async function cargarPedidosClientes() {
  if (!validarSupabaseClientes()) return;
  const { data, error } = await dbClientes().from("pedidos")
    .select("id, fecha, cliente, descripcion, cantidad, material, tipo_impresion, estatus_trabajo, estatus_pago, fecha_entrega")
    .order("id", { ascending: false });
  if (error) { console.error(error); toast("Error cargando pedidos"); return; }
  pedidosDB = data || [];
}

async function cargarClientesAdmin() {
  if (!validarSupabaseClientes()) return;
  const { data, error } = await dbClientes().from("clientes").select("*").order("nombre", { ascending: true });
  if (error) { console.error(error); toast("Error cargando clientes"); return; }
  clientesDB = data || [];
}

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
  const { error } = await dbClientes().from("clientes").insert(nuevos);
  if (error) { console.error(error); toast("Error sincronizando clientes"); return; }
  toast(`${nuevos.length} clientes creados desde pedidos`);
  await cargarClientesAdmin();
}

function renderClientes() {
  const tbody = document.getElementById("clientesBody");
  const count = document.getElementById("clientesCount");
  if (!tbody) return;

  const filtro = normalizarNombre(document.getElementById("searchClientes")?.value || "");
  const orden = document.getElementById("ordenClientes")?.value || "nombre_az";
  let lista = [...clientesDB];

  if (filtro) {
    lista = lista.filter(c => normalizarNombre([c.nombre, c.tipo_cliente, c.telefono, c.correo, c.notas].join(" ")).includes(filtro));
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
  if (!lista.length) { tbody.innerHTML = `<tr><td colspan="8" class="empty">Sin clientes</td></tr>`; return; }

  tbody.innerHTML = "";
  lista.forEach(c => {
    const pedidos = pedidosDelCliente(c.nombre);
    const activo = c.activo !== false;
    const esRoberto = esRobertoNombre(c.nombre);
    const botonEliminar = esRoberto
      ? `<button class="mini-btn del" type="button" disabled title="Roberto no se puede eliminar">Eliminar</button>`
      : `<button class="mini-btn del" onclick="eliminarCliente(${c.id})">Eliminar</button>`;

    tbody.insertAdjacentHTML("beforeend", `
      <tr data-id="${c.id}">
        <td><input class="name-input cli-nombre" data-id="${c.id}" value="${escapeHtml(c.nombre)}"></td>
        <td>
          <select class="type-select cli-tipo" data-id="${c.id}">
            <option ${c.tipo_cliente === "Cliente VIP" ? "selected" : ""}>Cliente VIP</option>
            <option ${c.tipo_cliente === "Cliente Standar" ? "selected" : ""}>Cliente Standar</option>
            <option ${c.tipo_cliente === "Cliente basico" ? "selected" : ""}>Cliente basico</option>
            <option ${c.tipo_cliente === "Editado" ? "selected" : ""}>Editado</option>
          </select>
        </td>
        <td><input class="phone-input cli-telefono" data-id="${c.id}" value="${escapeHtml(c.telefono || "")}" placeholder="Telefono"></td>
        <td><input class="email-input cli-correo" data-id="${c.id}" value="${escapeHtml(c.correo || "")}" placeholder="Correo"></td>
        <td><textarea class="notes-input cli-notas" data-id="${c.id}" placeholder="Notas">${escapeHtml(c.notas || "")}</textarea></td>
        <td><button class="mini-btn info" onclick="verHistorialCliente(${c.id})">${pedidos.length} pedidos</button></td>
        <td>
          <select class="active-select cli-activo" data-id="${c.id}">
            <option value="true" ${activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>
        <td>${botonEliminar}</td>
      </tr>
    `);
  });
}

function filtrarClientes() { renderClientes(); }

async function nuevoCliente() {
  if (!validarSupabaseClientes()) return;
  const nombreUnico = "Nuevo cliente " + Date.now();
  const { error } = await dbClientes().from("clientes").insert([{ nombre: nombreUnico, tipo_cliente: "Cliente Standar", telefono: "", correo: "", notas: "", activo: true }]);
  if (error) { console.error(error); toast("Error creando cliente"); return; }
  toast("Cliente añadido");
  await recargarTodo();
}

function buscarClienteConMismoNombre(nombreNuevo, idActual) {
  const nuevoNorm = normalizarNombre(nombreNuevo);
  if (!nuevoNorm) return null;
  return clientesDB.find(c => Number(c.id) !== Number(idActual) && normalizarNombre(c.nombre) === nuevoNorm) || null;
}

async function guardarTodosClientes() {
  if (!validarSupabaseClientes()) return;

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
          `Nombre duplicado detectado\n\nYa existe: ${duplicado.nombre}\n\nCambiaste: ${c.nombre}\n\nSi continuas, los pedidos de "${c.nombre}" pasaran a "${duplicado.nombre}".\n\nDeseas unificar?`
        );
        if (!confirmar) { toast("Guardado cancelado"); return; }
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
    return dbClientes().from("clientes").update({ nombre: nombreBonito(nombre), tipo_cliente, telefono, correo, notas, activo }).eq("id", id);
  }).filter(Boolean);

  if (!updates.length) { toast("No hay clientes para guardar"); return; }
  const resultados = await Promise.all(updates);
  const error = resultados.find(r => r.error)?.error;
  if (error) { console.error(error); toast("Error guardando clientes"); return; }

  toast("Clientes guardados");
  await recargarTodo();
}

async function unificarCliente(origen, principal) {
  if (!origen || !principal) { toast("No se pudo unificar"); return; }
  const pedidosOrigen = pedidosDelCliente(origen.nombre);

  for (const pedido of pedidosOrigen) {
    const { error } = await dbClientes().from("pedidos").update({ cliente: principal.nombre }).eq("id", pedido.id);
    if (error) { console.error(error); toast("Error unificando pedidos"); return; }
  }

  const notasFinales = [principal.notas, origen.notas, `Unificado desde: ${origen.nombre}`].filter(Boolean).join("\n");
  await dbClientes().from("clientes").update({ telefono: principal.telefono || origen.telefono || "", correo: principal.correo || origen.correo || "", notas: notasFinales, activo: true }).eq("id", principal.id);

  const { error: deleteError } = await dbClientes().from("clientes").delete().eq("id", origen.id);
  if (deleteError) {
    await dbClientes().from("clientes").update({ activo: false, notas: [origen.notas, `Cliente unificado con: ${principal.nombre}`].filter(Boolean).join("\n") }).eq("id", origen.id);
  }

  toast("Clientes unificados");
  await recargarTodo();
}

async function eliminarCliente(id) {
  if (!validarSupabaseClientes()) return;
  const cliente = clientePorId(id);
  if (!cliente) { toast("Cliente no encontrado"); return; }
  if (esRobertoNombre(cliente.nombre)) { toast("Roberto no se puede eliminar"); return; }
  const confirmar = confirm(`Desactivar cliente "${cliente.nombre}"?`);
  if (!confirmar) return;
  const { error } = await dbClientes().from("clientes").update({ activo: false }).eq("id", id);
  if (error) { console.error(error); toast("Error desactivando cliente"); return; }
  toast("Cliente desactivado");
  await recargarTodo();
}

function verHistorialCliente(id) {
  const cliente = clientePorId(id);
  if (!cliente) return;
  abrirHistorial(cliente.nombre, pedidosDelCliente(cliente.nombre));
}

function abrirHistorial(nombre, pedidos) {
  const title = document.getElementById("historyTitle");
  const body = document.getElementById("historyBody");
  const backdrop = document.getElementById("historyBackdrop");
  if (title) title.textContent = `Historial - ${nombre}`;
  if (!body) return;

  if (!pedidos.length) {
    body.innerHTML = `<div class="empty">Sin pedidos asociados</div>`;
  } else {
    body.innerHTML = "";
    pedidos.forEach(p => {
      body.insertAdjacentHTML("beforeend", `
        <div class="history-item">
          <div class="history-top"><span>#${p.id} - ${fechaCorta(p.fecha)}</span><span>${escapeHtml(p.estatus_trabajo || "")} / ${escapeHtml(p.estatus_pago || "")}</span></div>
          <div class="history-desc">${escapeHtml(p.descripcion || "")}</div>
          <div style="margin-top:6px;color:var(--muted2);font-size:12px">Cantidad: ${escapeHtml(p.cantidad || "")} - Material: ${escapeHtml(p.material || "")} - Impresion: ${escapeHtml(p.tipo_impresion || "")}</div>
        </div>
      `);
    });
  }
  if (backdrop) backdrop.style.display = "flex";
}

function cerrarHistorial() { const b = document.getElementById("historyBackdrop"); if (b) b.style.display = "none"; }
function cerrarHistorialSiFondo(event) { if (event.target.id === "historyBackdrop") cerrarHistorial(); }

async function recargarTodo() {
  await cargarPedidosClientes();
  await cargarClientesAdmin();
  await sincronizarAutomaticoDesdePedidos();
  renderClientes();
  toast("Clientes actualizados");
}

window.addEventListener("DOMContentLoaded", async () => { await recargarTodo(); });
