console.log("Configuración JS conectado");

let operadoresDB = [];

// ---------------------------
// Supabase seguro
// ---------------------------
function db() {
  return window.supabaseClient || window.supabase;
}

function validarSupabaseConfig() {
  if (!db()) {
    console.error("No existe conexión Supabase. Revisa js/supabase.js");
    toast("No existe conexión Supabase");
    return false;
  }

  return true;
}

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
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------------------------
// Cargar operadores
// ---------------------------
async function cargarOperadoresAdmin() {
  if (!validarSupabaseConfig()) return;

  const { data, error } = await db()
    .from("operadores")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando operadores:", error);
    toast("Error cargando operadores");
    return;
  }

  operadoresDB = data || [];
  renderOperadores();
}

// ---------------------------
// Render operadores
// ---------------------------
function renderOperadores() {
  const tbody = document.getElementById("operadoresBody");
  const count = document.getElementById("operadoresCount");
  const filtro = (document.getElementById("searchOperadores")?.value || "").toLowerCase().trim();

  if (!tbody) return;

  const lista = operadoresDB.filter(op => {
    const texto = [
      op.nombre,
      op.clave,
      op.activo ? "activo" : "inactivo"
    ].join(" ").toLowerCase();

    return !filtro || texto.includes(filtro);
  });

  lista.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));

  if (count) {
    const activos = operadoresDB.filter(op => op.activo !== false).length;
    count.textContent = `${activos} activos`;
  }

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="14" class="empty">Sin operadores</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  lista.forEach(op => {
    const activo = op.activo !== false;
    const esRoberto = String(op.nombre || "").trim().toLowerCase() === "roberto";

    const fila = `
      <tr data-id="${op.id}">
        <td>
          <input class="name-input op-nombre" data-id="${op.id}" value="${escapeHtml(op.nombre || "")}" placeholder="Nombre" ${esRoberto ? "readonly" : ""}>
        </td>

        <td>
          <input class="clave-input op-clave" data-id="${op.id}" value="${escapeHtml(op.clave || "")}" placeholder="Clave">
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-pedidos" data-id="${op.id}" ${op.puede_pedidos !== false ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-clientes" data-id="${op.id}" ${op.puede_clientes !== false ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-materiales" data-id="${op.id}" ${op.puede_materiales ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-estadisticas" data-id="${op.id}" ${op.puede_estadisticas ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-configuracion" data-id="${op.id}" ${op.puede_configuracion ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-marketing" data-id="${op.id}" ${op.puede_marketing ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-cotizador" data-id="${op.id}" ${op.puede_cotizador ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-organizador" data-id="${op.id}" ${op.puede_organizador ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-mod-operador" data-id="${op.id}" ${op.puede_modificar_operador !== false ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-mod-cantidad" data-id="${op.id}" ${op.puede_modificar_cantidad !== false ? "checked" : ""}>
        </td>

        <td>
          <select class="active-select op-activo" data-id="${op.id}" ${esRoberto ? "disabled" : ""}>
            <option value="true" ${activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          ${esRoberto
            ? `<button class="mini-btn" type="button" disabled title="Roberto no se puede eliminar">Protegido</button>`
            : `<button class="mini-btn del" type="button" onclick="eliminarOperador(${op.id})">Eliminar</button>`}
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}

// ---------------------------
// Filtrar operadores
// ---------------------------
function filtrarOperadores() {
  renderOperadores();
}

// ---------------------------
// Nuevo operador
// ---------------------------
async function nuevoOperador() {
  if (!validarSupabaseConfig()) return;

  const nombreUnico = "Nuevo operador " + Date.now();

  const { error } = await db()
    .from("operadores")
    .insert([{
      nombre: nombreUnico,
      clave: "0000",
      puede_pedidos: true,
      puede_clientes: true,
      puede_materiales: false,
      puede_estadisticas: false,
      puede_configuracion: false,
      puede_marketing: false,
      puede_cotizador: false,
      puede_organizador: false,
      puede_modificar_operador: false,
      puede_modificar_cantidad: false,
      activo: true
    }]);

  if (error) {
    console.error("Error creando operador:", error);
    toast("Error creando operador");
    return;
  }

  toast("Operador añadido");
  await cargarOperadoresAdmin();
}

// ---------------------------
// Guardar todos
// ---------------------------
async function guardarTodosOperadores() {
  if (!validarSupabaseConfig()) return;

  const updates = operadoresDB.map(op => {
    const id = op.id;
    const esRoberto = String(op.nombre || "").trim().toLowerCase() === "roberto";

    const nombre = document.querySelector(`.op-nombre[data-id="${id}"]`)?.value.trim() || "";
    const clave = document.querySelector(`.op-clave[data-id="${id}"]`)?.value.trim() || "";

    const puede_pedidos = document.querySelector(`.op-pedidos[data-id="${id}"]`)?.checked || false;
    const puede_clientes = document.querySelector(`.op-clientes[data-id="${id}"]`)?.checked || false;
    const puede_materiales = document.querySelector(`.op-materiales[data-id="${id}"]`)?.checked || false;
    const puede_estadisticas = document.querySelector(`.op-estadisticas[data-id="${id}"]`)?.checked || false;
    const puede_configuracion = document.querySelector(`.op-configuracion[data-id="${id}"]`)?.checked || false;
    const puede_marketing = document.querySelector(`.op-marketing[data-id="${id}"]`)?.checked || false;
    const puede_cotizador = document.querySelector(`.op-cotizador[data-id="${id}"]`)?.checked || false;
    const puede_organizador = document.querySelector(`.op-organizador[data-id="${id}"]`)?.checked || false;
    const puede_modificar_operador = document.querySelector(`.op-mod-operador[data-id="${id}"]`)?.checked || false;
    const puede_modificar_cantidad = document.querySelector(`.op-mod-cantidad[data-id="${id}"]`)?.checked || false;

    const activo = document.querySelector(`.op-activo[data-id="${id}"]`)?.value === "true";

    if (!nombre) return null;

    const datos = {
      nombre: esRoberto ? "Roberto" : nombre,
      clave,
      puede_pedidos,
      puede_clientes,
      puede_materiales,
      puede_estadisticas,
      puede_configuracion,
      puede_marketing,
      puede_cotizador,
      puede_organizador,
      puede_modificar_operador,
      puede_modificar_cantidad,
      activo: esRoberto ? true : activo
    };

    if (esRoberto) {
      datos.puede_pedidos = true;
      datos.puede_clientes = true;
      datos.puede_materiales = true;
      datos.puede_estadisticas = true;
      datos.puede_configuracion = true;
      datos.puede_marketing = true;
      datos.puede_cotizador = true;
      datos.puede_organizador = true;
      datos.puede_modificar_operador = true;
      datos.puede_modificar_cantidad = true;
    }

    return db()
      .from("operadores")
      .update(datos)
      .eq("id", id);
  }).filter(Boolean);

  if (!updates.length) {
    toast("No hay operadores para guardar");
    return;
  }

  const resultados = await Promise.all(updates);
  const error = resultados.find(r => r.error)?.error;

  if (error) {
    console.error("Error guardando operadores:", error);
    toast("Error guardando operadores");
    return;
  }

  toast("Operadores guardados");
  await cargarOperadoresAdmin();
}

// ---------------------------
// Eliminar operador definitivo
// ---------------------------
async function eliminarOperador(id) {
  if (!validarSupabaseConfig()) return;

  const operador = operadoresDB.find(op => Number(op.id) === Number(id));
  const esRoberto = String(operador?.nombre || "").trim().toLowerCase() === "roberto";

  if (esRoberto) {
    toast("Roberto no se puede eliminar");
    return;
  }

  const nombre = operador?.nombre || "este operador";
  const confirmar = confirm(`¿Eliminar definitivamente a ${nombre}?`);

  if (!confirmar) return;

  const { error } = await db()
    .from("operadores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando operador:", error);
    toast("No se pudo eliminar: " + (error.message || "sin detalle"));
    return;
  }

  toast("Operador eliminado");
  await cargarOperadoresAdmin();
}

// ---------------------------
// Recargar
// ---------------------------
async function recargarTodo() {
  await cargarOperadoresAdmin();
  toast("Configuración recargada");
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", recargarTodo);