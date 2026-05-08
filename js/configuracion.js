console.log("ConfiguraciÃ³n JS conectado");

let operadoresDB = [];

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
// Escapar HTML bÃ¡sico
// ---------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ---------------------------
// Cargar operadores
// ---------------------------
async function cargarOperadoresAdmin() {
  const { data, error } = await supabaseClient
    .from("operadores")
    .select("*")
    .eq("activo", true)
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

  let lista = operadoresDB.filter(op => {
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

    const fila = `
      <tr data-id="${op.id}">
        <td>
          <input class="name-input op-nombre" data-id="${op.id}" value="${escapeHtml(op.nombre || "")}" placeholder="Nombre">
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
          <select class="active-select op-activo" data-id="${op.id}">
            <option value="true" ${activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <button class="mini-btn del" onclick="eliminarOperador(${op.id})">Eliminar</button>
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
  const nombreUnico = "Nuevo operador " + Date.now();

  const { error } = await supabaseClient
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

  toast("Operador aÃ±adido");
  await cargarOperadoresAdmin();
}

// ---------------------------
// Guardar todos
// ---------------------------
async function guardarTodosOperadores() {
  const updates = operadoresDB.map(op => {
    const id = op.id;

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

    return supabaseClient
      .from("operadores")
      .update({
        nombre,
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
        activo
      })
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
// Eliminar operador
// NOTA: elimina de forma definitiva.
// ---------------------------
async function eliminarOperador(id) {
  const confirmar = confirm("¿Eliminar/desactivar este operador?");
  if (!confirmar) return;

  const { error } = await supabaseClient
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
  toast("ConfiguraciÃ³n recargada");
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", recargarTodo);

