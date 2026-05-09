console.log("Clientes JS conectado");

let clientesDB = [];
let pedidosDB = [];

// ===========================
// SUPABASE SEGURO
// ===========================
function dbClientes() {
  return window.supabaseClient || window.supabase;
}

function validarSupabaseClientes() {
  if (!dbClientes()) {
    console.error("No existe conexión Supabase. Revisa js/supabase.js");
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

function tokensNombre(nombre) {
  const stop = new Set([
    "cliente",
    "sr",
    "sra",
    "senor",
    "senora",
    "el",
    "la",
    "los",
    "las",
    "de",
    "del",
    "y"
  ]);

  return normalizarNombre(nombre)
    .split(" ")
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stop.has(t));
}

function similitudClientes(a, b) {
  const na = normalizarNombre(a);
  const nb = normalizarNombre(b);

  if (!na || !nb) return false;
  if (na === nb) return true;

  if (na.length >= 4 && nb.includes(na)) return true;
  if (nb.length >= 4 && na.includes(nb)) return true;

  const ta = tokensNombre(na);
  const tb = tokensNombre(nb);

  if (!ta.length || !tb.length) return false;

  const setB = new Set(tb);
  const inter = ta.filter(t => setB.has(t));
  const menor = Math.min(ta.length, tb.length);

  return inter.length >= menor && menor >= 1;
}

function clientePorId(id) {
  return clientesDB.find(c => Number(c.id) === Number(id));
}

function contarPedidosNombre(nombre) {
  return pedidosDelCliente(nombre).length;
}

function fechaTexto(valor) {
  return String(valor || "").slice(0, 10) || "Sin fecha";
}

// ===========================
// CARGAR DATOS
// ===========================
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

  renderClientes();
  renderDuplicados();
}

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

// ===========================
// PEDIDOS POR CLIENTE
// ===========================
function pedidosDelCliente(nombre) {
  const n = normalizarNombre(nombre);

  return pedidosDB.filter(p => {
    return normalizarNombre(p.cliente) === n;
  });
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
// UNIFICAR POR CAMBIO DE NOMBRE
// ===========================
async function unificarClientePorCambioNombre(clienteOrigen, clientePrincipal, datosEditadosOrigen = {}) {
  if (!validarSupabaseClientes()) return false;

  if (!clienteOrigen || !clientePrincipal) {
    toast("No se pudo unificar");
    return false;
  }

  const pedidosOrigen = pedidosDelCliente(clienteOrigen.nombre);

  const confirmar = confirm(
    `⚠️ NOMBRE DUPLICADO DETECTADO\n\n` +
    `Ya existe un cliente llamado:\n${clientePrincipal.nombre}\n\n` +
    `Estás intentando cambiar:\n${clienteOrigen.nombre}\n\n` +
    `por:\n${clientePrincipal.nombre}\n\n` +
    `Si continúas:\n` +
    `1. Los pedidos de "${clienteOrigen.nombre}" pasarán a "${clientePrincipal.nombre}".\n` +
    `2. Se conservará "${clientePrincipal.nombre}" como cliente principal.\n` +
    `3. Se eliminará/desactivará "${clienteOrigen.nombre}".\n\n` +
    `¿Deseas unificar?`
  );

  if (!confirmar) {
    toast("Unificación cancelada");
    return false;
  }

  // 1. Actualizar pedidos del cliente origen hacia el cliente principal
  for (const pedido of pedidosOrigen) {
    const { error } = await dbClientes()
      .from("pedidos")
      .update({ cliente: clientePrincipal.nombre })
      .eq("id", pedido.id);

    if (error) {
      console.error("Error actualizando pedido:", error);
      toast("Error unificando pedidos");
      return false;
    }
  }

  // 2. Mezclar datos útiles
  const telefonoFinal =
    clientePrincipal.telefono ||
    datosEditadosOrigen.telefono ||
    clienteOrigen.telefono ||
    "";

  const correoFinal =
    clientePrincipal.correo ||
    datosEditadosOrigen.correo ||
    clienteOrigen.correo ||
    "";

  const notasFinales = [
    clientePrincipal.notas,
    datosEditadosOrigen.notas,
    clienteOrigen.notas,
    `Unificado desde: ${clienteOrigen.nombre}`
  ]
    .filter(Boolean)
    .join("\n");

  const tipoFinal =
    clientePrincipal.tipo_cliente ||
    datosEditadosOrigen.tipo_cliente ||
    clienteOrigen.tipo_cliente ||
    "Cliente Standar";

  const { error: errorMaster } = await dbClientes()
    .from("clientes")
    .update({
      telefono: telefonoFinal,
      correo: correoFinal,
      notas: notasFinales,
      tipo_cliente: tipoFinal,
      activo: true
    })
    .eq("id", clientePrincipal.id);

  if (errorMaster) {
    console.error("Error actualizando cliente principal:", errorMaster);
    toast("Error actualizando cliente principal");
    return false;
  }

  // 3. Intentar eliminar el cliente duplicado
  const { error: deleteError } = await dbClientes()
    .from("clientes")
    .delete()
    .eq("id", clienteOrigen.id);

  // Si no deja eliminar, lo desactiva
  if (deleteError) {
    console.warn("No se pudo eliminar cliente, se desactiva:", deleteError);

    const { error: inactiveError } = await dbClientes()
      .from("clientes")
      .update({
        activo: false,
        notas: [
          clienteOrigen.notas,
          `Cliente unificado con: ${clientePrincipal.nombre}`
        ].filter(Boolean).join("\n")
      })
      .eq("id", clienteOrigen.id);

    if (inactiveError) {
      console.error("Error desactivando duplicado:", inactiveError);
      toast("Error desactivando cliente duplicado");
      return false;
    }
  }

  toast("Clientes unificados");
  await recargarTodo();
  return true;
}

// ===========================
// DUPLICADOS AUTOMÁTICOS VISUALES
// ===========================
function detectarGruposDuplicados() {
  const clientes = clientesDB
    .filter(c => String(c.nombre || "").trim())
    .map(c => ({
      ...c,
      norm: normalizarNombre(c.nombre),
      pedidosCount: contarPedidosNombre(c.nombre)
    }));

  const parent = {};

  clientes.forEach(c => {
    parent[c.id] = c.id;
  });

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);

    if (ra !== rb) parent[rb] = ra;
  }

  for (let i = 0; i < clientes.length; i++) {
    for (let j = i + 1; j < clientes.length; j++) {
      if (similitudClientes(clientes[i].nombre, clientes[j].nombre)) {
        union(clientes[i].id, clientes[j].id);
      }
    }
  }

  const gruposMap = {};

  clientes.forEach(c => {
    const root = find(c.id);

    if (!gruposMap[root]) gruposMap[root] = [];
    gruposMap[root].push(c);
  });

  return Object.values(gruposMap)
    .filter(g => g.length > 1)
    .map(grupo => {
      const ordenados = [...grupo].sort((a, b) => {
        if (b.pedidosCount !== a.pedidosCount) return b.pedidosCount - a.pedidosCount;
        return String(b.nombre || "").length - String(a.nombre || "").length;
      });

      return {
        clientes: ordenados,
        sugerido: ordenados[0],
        totalPedidos: ordenados.reduce((acc, c) => acc + c.pedidosCount, 0)
      };
    })
    .sort((a, b) => b.totalPedidos - a.totalPedidos);
}

function renderDuplicados() {
  const tbody = document.getElementById("duplicadosBody");
  const dupCount = document.getElementById("duplicadosCount");

  if (!tbody) return;

  const grupos = detectarGruposDuplicados();

  if (dupCount) {
    dupCount.textContent = `${grupos.length} posibles duplicados`;
  }

  if (!grupos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No hay posibles duplicados</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  grupos.forEach(grupo => {
    const chips = grupo.clientes.map(c => {
      return `<span class="dup-chip"><strong>${escapeHtml(c.nombre)}</strong> · ${c.pedidosCount} pedidos</span>`;
    }).join("");

    const ids = grupo.clientes.map(c => c.id).join(",");

    const fila = `
      <tr>
        <td>
          <div class="dup-group">${chips}</div>
        </td>

        <td>
          <strong style="color:var(--accent2)">${escapeHtml(grupo.sugerido.nombre)}</strong>
        </td>

        <td>${grupo.totalPedidos}</td>

        <td>
          <button class="mini-btn warn" onclick="unificarGrupoClientes('${ids}', ${grupo.sugerido.id})">
            Unificar
          </button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}

// ===========================
// RENDER CLIENTES
// ===========================
function renderClientes() {
  const tbody = document.getElementById("clientesBody");
  const count = document.getElementById("clientesCount");
  const filtro = (document.getElementById("searchClientes")?.value || "").toLowerCase().trim();

  if (!tbody) return;

  let lista = clientesDB.filter(c => {
    const texto = [
      c.nombre,
      c.tipo_cliente,
      c.telefono,
      c.correo,
      c.notas
    ].join(" ").toLowerCase();

    return !filtro || texto.includes(filtro);
  });

  const orden = document.getElementById("ordenClientes")?.value || "nombre_az";

  lista.sort((a, b) => {
    const nombreA = String(a.nombre || "").toLowerCase();
    const nombreB = String(b.nombre || "").toLowerCase();

    const pedidosA = pedidosDelCliente(a.nombre).length;
    const pedidosB = pedidosDelCliente(b.nombre).length;

    if (orden === "nombre_az") return nombreA.localeCompare(nombreB);
    if (orden === "nombre_za") return nombreB.localeCompare(nombreA);
    if (orden === "pedidos_mayor") return pedidosB - pedidosA;
    if (orden === "pedidos_menor") return pedidosA - pedidosB;

    return 0;
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
// GUARDAR TODOS CON DETECCIÓN DE DUPLICADO
// ===========================
async function guardarTodosClientes() {
  if (!validarSupabaseClientes()) return;

  // Primero revisa si estás cambiando un cliente hacia un nombre que ya existe
  for (const c of clientesDB) {
    const id = c.id;

    const nombreNuevo = document.querySelector(`.cli-nombre[data-id="${id}"]`)?.value.trim() || "";
    const tipo_cliente = document.querySelector(`.cli-tipo[data-id="${id}"]`)?.value || "Cliente Standar";
    const telefono = document.querySelector(`.cli-telefono[data-id="${id}"]`)?.value.trim() || "";
    const correo = document.querySelector(`.cli-correo[data-id="${id}"]`)?.value.trim() || "";
    const notas = document.querySelector(`.cli-notas[data-id="${id}"]`)?.value.trim() || "";
    const activo = document.querySelector(`.cli-activo[data-id="${id}"]`)?.value === "true";

    if (!nombreNuevo) continue;

    const nombreAnteriorNorm = normalizarNombre(c.nombre);
    const nombreNuevoNorm = normalizarNombre(nombreNuevo);

    const cambioNombre = nombreAnteriorNorm !== nombreNuevoNorm;

    if (cambioNombre) {
      const clienteDuplicado = buscarClienteConMismoNombre(nombreNuevo, id);

      if (clienteDuplicado) {
        await unificarClientePorCambioNombre(c, clienteDuplicado, {
          nombre: nombreNuevo,
          tipo_cliente,
          telefono,
          correo,
          notas,
          activo
        });

        return;
      }
    }
  }

  // Si no hay duplicado, guardar normal
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
// ELIMINAR CLIENTE
// ===========================
async function eliminarCliente(id) {
  if (!validarSupabaseClientes()) return;

  const cliente = clientePorId(id);

  if (!cliente) {
    toast("Cliente no encontrado");
    return;
  }

  const confirmar = confirm(`¿Eliminar de la lista activa a ${cliente.nombre}?`);
  if (!confirmar) return;

  const { error } = await dbClientes()
    .from("clientes")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando cliente:", error);
    toast("Error eliminando cliente");
    return;
  }

  toast("Cliente eliminado");
  await recargarTodo();
}

// ===========================
// UNIFICAR GRUPO DESDE SECCIÓN DUPLICADOS
// ===========================
async function unificarGrupoClientes(idsTexto, masterId) {
  if (!validarSupabaseClientes()) return;

  const ids = String(idsTexto || "")
    .split(",")
    .map(id => Number(id))
    .filter(Boolean);

  const master = clientePorId(masterId);

  if (!master) {
    toast("Cliente principal no encontrado");
    return;
  }

  const clientesGrupo = ids
    .map(id => clientePorId(id))
    .filter(Boolean);

  const duplicados = clientesGrupo.filter(c => Number(c.id) !== Number(masterId));

  if (!duplicados.length) {
    toast("No hay duplicados para unificar");
    return;
  }

  const nombresDuplicados = duplicados.map(c => c.nombre).join(", ");

  const confirmar = confirm(
    `Todos los pedidos de:\n\n${nombresDuplicados}\n\npasarán a:\n\n${master.nombre}\n\n¿Continuar?`
  );

  if (!confirmar) return;

  for (const dup of duplicados) {
    const pedidos = pedidosDelCliente(dup.nombre);

    for (const pedido of pedidos) {
      const { error } = await dbClientes()
        .from("pedidos")
        .update({ cliente: master.nombre })
        .eq("id", pedido.id);

      if (error) {
        console.error("Error actualizando pedido:", error);
        toast("Error unificando pedidos");
        return;
      }
    }
  }

  const telefono = master.telefono || duplicados.find(c => c.telefono)?.telefono || "";
  const correo = master.correo || duplicados.find(c => c.correo)?.correo || "";

  const notasExtra = duplicados
    .map(c => c.notas)
    .filter(Boolean)
    .join("\n");

  const notasFinales = [master.notas, notasExtra]
    .filter(Boolean)
    .join("\n");

  await dbClientes()
    .from("clientes")
    .update({
      telefono,
      correo,
      notas: notasFinales,
      activo: true
    })
    .eq("id", master.id);

  for (const dup of duplicados) {
    const { error } = await dbClientes()
      .from("clientes")
      .delete()
      .eq("id", dup.id);

    if (error) {
      console.warn("No se pudo eliminar, se desactiva:", dup.nombre, error);

      await dbClientes()
        .from("clientes")
        .update({ activo: false })
        .eq("id", dup.id);
    }
  }

  toast("Clientes unificados");
  await recargarTodo();
}

// ===========================
// HISTORIAL
// ===========================
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
            <span>#${p.id} · ${fechaTexto(p.fecha)}</span>
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
// RECARGAR
// ===========================
async function recargarTodo() {
  await cargarPedidosClientes();
  await cargarClientesAdmin();
  toast("Clientes recargados");
}

// ===========================
// INICIO
// ===========================
window.addEventListener("DOMContentLoaded", async () => {
  await recargarTodo();
});