console.log("Clientes JS v15 conectado");

let clientesDB = [];
let pedidosDB = [];
let clientesCombinados = [];

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
  return String(nombre || "")
    .trim()
    .replace(/\s+/g, " ");
}

function fechaCorta(valor) {
  return String(valor || "").slice(0, 10) || "—";
}

function clientePorId(id) {
  return clientesDB.find(c => Number(c.id) === Number(id));
}

function pedidosDelCliente(nombre) {
  const n = normalizarNombre(nombre);
  return pedidosDB.filter(p => normalizarNombre(p.cliente) === n);
}

function pedidosPorNombreNormalizado() {
  const mapa = {};

  pedidosDB.forEach(p => {
    const nombre = nombreBonito(p.cliente);
    const norm = normalizarNombre(nombre);

    if (!norm) return;

    if (!mapa[norm]) {
      mapa[norm] = {
        nombre,
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
// COMBINAR CLIENTES + PEDIDOS
// ===========================
function construirClientesCombinados() {
  const mapaPedidos = pedidosPorNombreNormalizado();
  const mapaClientes = {};

  clientesDB.forEach(c => {
    const norm = normalizarNombre(c.nombre);
    if (!norm) return;

    mapaClientes[norm] = c;
  });

  const combinados = [];

  // 1. Clientes registrados
  clientesDB.forEach(c => {
    const norm = normalizarNombre(c.nombre);
    if (!norm) return;

    const infoPedidos = mapaPedidos[norm];
    const pedidos = infoPedidos?.pedidos || [];

    combinados.push({
      origenKey: norm,
      id: c.id,
      nombre: c.nombre,
      tipo_cliente: c.tipo_cliente || "Cliente Standar",
      telefono: c.telefono || "",
      correo: c.correo || "",
      notas: c.notas || "",
      activo: c.activo !== false,
      registrado: true,
      enPedidos: !!infoPedidos,
      origen: infoPedidos ? "mix" : "db",
      pedidos,
      pedidosCount: pedidos.length,
      ultimoUso: infoPedidos?.ultimoUso || "—"
    });
  });

  // 2. Clientes que existen en pedidos pero no en clientes
  Object.values(mapaPedidos).forEach(info => {
    if (mapaClientes[info.norm]) return;

    combinados.push({
      origenKey: info.norm,
      id: null,
      nombre: info.nombre,
      tipo_cliente: "Cliente Standar",
      telefono: "",
      correo: "",
      notas: "",
      activo: true,
      registrado: false,
      enPedidos: true,
      origen: "pedidos",
      pedidos: info.pedidos,
      pedidosCount: info.pedidos.length,
      ultimoUso: info.ultimoUso || "—"
    });
  });

  clientesCombinados = combinados;
}

// ===========================
// RESUMEN
// ===========================
function renderResumenClientes() {
  const registrados = clientesDB.length;
  const enPedidos = Object.keys(pedidosPorNombreNormalizado()).length;
  const faltantes = clientesCombinados.filter(c => !c.registrado && c.enPedidos).length;

  const clientesCount = document.getElementById("clientesCount");
  const clientesPedidosCount = document.getElementById("clientesPedidosCount");
  const clientesFaltantesCount = document.getElementById("clientesFaltantesCount");

  if (clientesCount) clientesCount.textContent = `${registrados} registrados`;
  if (clientesPedidosCount) clientesPedidosCount.textContent = `${enPedidos} en pedidos`;
  if (clientesFaltantesCount) clientesFaltantesCount.textContent = `${faltantes} faltantes`;
}

// ===========================
// CLIENTES FALTANTES
// ===========================
function renderClientesFaltantes() {
  const tbody = document.getElementById("clientesFaltantesBody");
  if (!tbody) return;

  const faltantes = clientesCombinados
    .filter(c => !c.registrado && c.enPedidos)
    .sort((a, b) => b.pedidosCount - a.pedidosCount);

  if (!faltantes.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No hay clientes faltantes</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  faltantes.forEach(c => {
    const row = `
      <tr>
        <td><strong>${escapeHtml(c.nombre)}</strong></td>
        <td>${c.pedidosCount}</td>
        <td>${escapeHtml(c.ultimoUso)}</td>
        <td>
          <button class="mini-btn warn" onclick="registrarClienteDesdePedido('${escapeHtml(c.origenKey)}')">
            Registrar
          </button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// ===========================
// RENDER CLIENTES
// ===========================
function renderClientes() {
  const tbody = document.getElementById("clientesBody");
  if (!tbody) return;

  const filtro = normalizarNombre(document.getElementById("searchClientes")?.value || "");
  const orden = document.getElementById("ordenClientes")?.value || "nombre_az";

  let lista = [...clientesCombinados];

  if (orden === "solo_pedidos") {
    lista = lista.filter(c => !c.registrado && c.enPedidos);
  }

  if (orden === "registrados") {
    lista = lista.filter(c => c.registrado);
  }

  if (filtro) {
    lista = lista.filter(c => {
      const texto = normalizarNombre([
        c.nombre,
        c.tipo_cliente,
        c.telefono,
        c.correo,
        c.notas,
        c.origen
      ].join(" "));

      return texto.includes(filtro);
    });
  }

  lista.sort((a, b) => {
    const na = normalizarNombre(a.nombre);
    const nb = normalizarNombre(b.nombre);

    if (orden === "nombre_az") return na.localeCompare(nb);
    if (orden === "nombre_za") return nb.localeCompare(na);
    if (orden === "pedidos_mayor") return b.pedidosCount - a.pedidosCount;
    if (orden === "pedidos_menor") return a.pedidosCount - b.pedidosCount;

    return na.localeCompare(nb);
  });

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty">Sin clientes</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  lista.forEach(c => {
    const origenTexto =
      c.origen === "mix" ? "Registrado + pedidos" :
      c.origen === "db" ? "Registrado" :
      "Solo pedidos";

    const origenClass =
      c.origen === "mix" ? "mix" :
      c.origen === "db" ? "db" :
      "pedidos";

    if (!c.registrado) {
      const filaSoloPedido = `
        <tr>
          <td>
            <strong>${escapeHtml(c.nombre)}</strong>
          </td>

          <td>
            <span class="origin-pill ${origenClass}">${origenTexto}</span>
          </td>

          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>Detectado automáticamente desde pedidos</td>

          <td>
            <button class="mini-btn info" onclick="verHistorialNombre('${escapeHtml(c.origenKey)}')">
              ${c.pedidosCount} pedidos
            </button>
          </td>

          <td>
            <span class="origin-pill pedidos">No registrado</span>
          </td>

          <td>
            <button class="mini-btn warn" onclick="registrarClienteDesdePedido('${escapeHtml(c.origenKey)}')">
              Registrar
            </button>
          </td>
        </tr>
      `;

      tbody.insertAdjacentHTML("beforeend", filaSoloPedido);
      return;
    }

    const fila = `
      <tr data-id="${c.id}">
        <td>
          <input class="name-input cli-nombre" data-id="${c.id}" value="${escapeHtml(c.nombre)}">
        </td>

        <td>
          <span class="origin-pill ${origenClass}">${origenTexto}</span>
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
          <input class="phone-input cli-telefono" data-id="${c.id}" value="${escapeHtml(c.telefono)}" placeholder="Teléfono">
        </td>

        <td>
          <input class="email-input cli-correo" data-id="${c.id}" value="${escapeHtml(c.correo)}" placeholder="Correo">
        </td>

        <td>
          <textarea class="notes-input cli-notas" data-id="${c.id}" placeholder="Notas">${escapeHtml(c.notas)}</textarea>
        </td>

        <td>
          <button class="mini-btn info" onclick="verHistorialCliente(${c.id})">
            ${c.pedidosCount} pedidos
          </button>
        </td>

        <td>
          <select class="active-select cli-activo" data-id="${c.id}">
            <option value="true" ${c.activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!c.activo ? "selected" : ""}>Inactivo</option>
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
// REGISTRAR DESDE PEDIDOS
// ===========================
async function registrarClienteDesdePedido(origenKey) {
  if (!validarSupabaseClientes()) return;

  const item = clientesCombinados.find(c => c.origenKey === origenKey && !c.registrado);

  if (!item) {
    toast("Cliente no encontrado");
    return;
  }

  const confirmar = confirm(`¿Registrar "${item.nombre}" en la tabla de clientes?`);
  if (!confirmar) return;

  const { error } = await dbClientes()
    .from("clientes")
    .insert([{
      nombre: item.nombre,
      tipo_cliente: "Cliente Standar",
      telefono: "",
      correo: "",
      notas: "Creado desde pedidos",
      activo: true
    }]);

  if (error) {
    console.error("Error registrando cliente:", error);
    toast("Error registrando cliente");
    return;
  }

  toast("Cliente registrado");
  await recargarTodo();
}

async function sincronizarClientesDesdePedidos() {
  if (!validarSupabaseClientes()) return;

  const faltantes = clientesCombinados.filter(c => !c.registrado && c.enPedidos);

  if (!faltantes.length) {
    toast("No hay clientes faltantes");
    return;
  }

  const confirmar = confirm(`Se van a registrar ${faltantes.length} clientes detectados en pedidos. ¿Continuar?`);
  if (!confirmar) return;

  const nuevos = faltantes.map(c => ({
    nombre: c.nombre,
    tipo_cliente: "Cliente Standar",
    telefono: "",
    correo: "",
    notas: "Creado desde pedidos",
    activo: true
  }));

  const { error } = await dbClientes()
    .from("clientes")
    .insert(nuevos);

  if (error) {
    console.error("Error sincronizando clientes:", error);
    toast("Error sincronizando clientes");
    return;
  }

  toast("Clientes sincronizados");
  await recargarTodo();
}

// ===========================
// DUPLICADOS VISUALES
// ===========================
function tokensNombre(nombre) {
  return normalizarNombre(nombre)
    .split(" ")
    .filter(t => t.length >= 3);
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

  return inter.length >= Math.min(ta.length, tb.length);
}

function detectarGruposDuplicados() {
  const base = clientesCombinados
    .filter(c => c.nombre)
    .map(c => ({
      ...c,
      norm: normalizarNombre(c.nombre)
    }));

  const usados = new Set();
  const grupos = [];

  for (let i = 0; i < base.length; i++) {
    if (usados.has(i)) continue;

    const grupo = [base[i]];
    usados.add(i);

    for (let j = i + 1; j < base.length; j++) {
      if (usados.has(j)) continue;

      if (similitudClientes(base[i].nombre, base[j].nombre)) {
        grupo.push(base[j]);
        usados.add(j);
      }
    }

    if (grupo.length > 1) {
      grupo.sort((a, b) => {
        if (b.pedidosCount !== a.pedidosCount) return b.pedidosCount - a.pedidosCount;
        return String(b.nombre).length - String(a.nombre).length;
      });

      grupos.push({
        clientes: grupo,
        sugerido: grupo[0],
        totalPedidos: grupo.reduce((acc, c) => acc + c.pedidosCount, 0)
      });
    }
  }

  return grupos.sort((a, b) => b.totalPedidos - a.totalPedidos);
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
      const origen =
        c.origen === "mix" ? "registrado + pedidos" :
        c.origen === "db" ? "registrado" :
        "solo pedidos";

      return `<span class="dup-chip"><strong>${escapeHtml(c.nombre)}</strong> · ${c.pedidosCount} pedidos · ${origen}</span>`;
    }).join("");

    const fila = `
      <tr>
        <td><div class="dup-group">${chips}</div></td>
        <td><strong style="color:var(--accent2)">${escapeHtml(grupo.sugerido.nombre)}</strong></td>
        <td>${grupo.totalPedidos}</td>
        <td>
          <span class="badge warn">Revisar manual</span>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
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
// GUARDAR CLIENTES
// ===========================
function buscarClienteConMismoNombre(nombreNuevo, idActual) {
  const nuevoNorm = normalizarNombre(nombreNuevo);

  if (!nuevoNorm) return null;

  return clientesDB.find(c => {
    if (Number(c.id) === Number(idActual)) return false;
    return normalizarNombre(c.nombre) === nuevoNorm;
  }) || null;
}

async function guardarTodosClientes() {
  if (!validarSupabaseClientes()) return;

  // Revisar duplicado exacto antes de guardar
  for (const c of clientesDB) {
    const id = c.id;
    const input = document.querySelector(`.cli-nombre[data-id="${id}"]`);
    if (!input) continue;

    const nombreNuevo = input.value.trim();
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
          `Si continúas, los pedidos de "${c.nombre}" pasarán a "${duplicado.nombre}".\n\n` +
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

  const resultados = await Promise.all(updates);
  const error = resultados.find(r => r.error)?.error;

  if (error) {
    console.error("Error guardando:", error);
    toast("Error guardando clientes");
    return;
  }

  toast("Clientes guardados");
  await recargarTodo();
}

async function unificarCliente(origen, principal) {
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
      .update({ activo: false })
      .eq("id", origen.id);
  }

  toast("Clientes unificados");
  await recargarTodo();
}

// ===========================
// ELIMINAR
// ===========================
async function eliminarCliente(id) {
  if (!validarSupabaseClientes()) return;

  const cliente = clientePorId(id);
  if (!cliente) return;

  const confirmar = confirm(`¿Desactivar cliente "${cliente.nombre}"?`);
  if (!confirmar) return;

  const { error } = await dbClientes()
    .from("clientes")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando:", error);
    toast("Error eliminando cliente");
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

  abrirHistorial(cliente.nombre, pedidosDelCliente(cliente.nombre));
}

function verHistorialNombre(origenKey) {
  const item = clientesCombinados.find(c => c.origenKey === origenKey);
  if (!item) return;

  abrirHistorial(item.nombre, item.pedidos || []);
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

  construirClientesCombinados();
  renderResumenClientes();
  renderClientesFaltantes();
  renderDuplicados();
  renderClientes();

  toast("Clientes actualizados");
}

// ===========================
// INICIO
// ===========================
window.addEventListener("DOMContentLoaded", async () => {
  await recargarTodo();
});