console.log("Configuración JS conectado");

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
// Cargar operadores
// ---------------------------
async function cargarOperadoresAdmin() {
  const { data, error } = await supabaseClient
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

  let lista = operadoresDB.filter(op => {
    const texto = [
      op.nombre,
      op.clave,
      op.rol,
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
    tbody.innerHTML = `<tr><td colspan="10" class="empty">Sin operadores</td></tr>`;
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

        <td>
          <select class="role-select op-rol" data-id="${op.id}" onchange="aplicarRol(${op.id})">
            <option ${op.rol === "Administrador" ? "selected" : ""}>Administrador</option>
            <option ${op.rol === "Supervisor" ? "selected" : ""}>Supervisor</option>
            <option ${op.rol === "Operador" ? "selected" : ""}>Operador</option>
            <option ${op.rol === "Solo lectura" ? "selected" : ""}>Solo lectura</option>
          </select>
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
// Aplicar permisos según rol
// ---------------------------
function aplicarRol(id) {
  const rol = document.querySelector(`.op-rol[data-id="${id}"]`)?.value || "Operador";

  const pedidos = document.querySelector(`.op-pedidos[data-id="${id}"]`);
  const clientes = document.querySelector(`.op-clientes[data-id="${id}"]`);
  const materiales = document.querySelector(`.op-materiales[data-id="${id}"]`);
  const estadisticas = document.querySelector(`.op-estadisticas[data-id="${id}"]`);
  const configuracion = document.querySelector(`.op-configuracion[data-id="${id}"]`);

  if (rol === "Administrador") {
    if (pedidos) pedidos.checked = true;
    if (clientes) clientes.checked = true;
    if (materiales) materiales.checked = true;
    if (estadisticas) estadisticas.checked = true;
    if (configuracion) configuracion.checked = true;
  }

  if (rol === "Supervisor") {
    if (pedidos) pedidos.checked = true;
    if (clientes) clientes.checked = true;
    if (materiales) materiales.checked = true;
    if (estadisticas) estadisticas.checked = true;
    if (configuracion) configuracion.checked = false;
  }

  if (rol === "Operador") {
    if (pedidos) pedidos.checked = true;
    if (clientes) clientes.checked = true;
    if (materiales) materiales.checked = false;
    if (estadisticas) estadisticas.checked = false;
    if (configuracion) configuracion.checked = false;
  }

  if (rol === "Solo lectura") {
    if (pedidos) pedidos.checked = true;
    if (clientes) clientes.checked = false;
    if (materiales) materiales.checked = false;
    if (estadisticas) estadisticas.checked = false;
    if (configuracion) configuracion.checked = false;
  }
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
      rol: "Operador",
      puede_pedidos: true,
      puede_clientes: true,
      puede_materiales: false,
      puede_estadisticas: false,
      puede_configuracion: false,
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
  const updates = operadoresDB.map(op => {
    const id = op.id;

    const nombre = document.querySelector(`.op-nombre[data-id="${id}"]`)?.value.trim() || "";
    const clave = document.querySelector(`.op-clave[data-id="${id}"]`)?.value.trim() || "";
    const rol = document.querySelector(`.op-rol[data-id="${id}"]`)?.value || "Operador";
    const puede_pedidos = document.querySelector(`.op-pedidos[data-id="${id}"]`)?.checked || false;
    const puede_clientes = document.querySelector(`.op-clientes[data-id="${id}"]`)?.checked || false;
    const puede_materiales = document.querySelector(`.op-materiales[data-id="${id}"]`)?.checked || false;
    const puede_estadisticas = document.querySelector(`.op-estadisticas[data-id="${id}"]`)?.checked || false;
    const puede_configuracion = document.querySelector(`.op-configuracion[data-id="${id}"]`)?.checked || false;
    const activo = document.querySelector(`.op-activo[data-id="${id}"]`)?.value === "true";

    if (!nombre) return null;

    return supabaseClient
      .from("operadores")
      .update({
        nombre,
        clave,
        rol,
        puede_pedidos,
        puede_clientes,
        puede_materiales,
        puede_estadisticas,
        puede_configuracion,
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
// NOTA: lo desactiva, no borra.
// ---------------------------
async function eliminarOperador(id) {
  const confirmar = confirm("¿Eliminar/desactivar este operador?");
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("operadores")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando operador:", error);
    toast("Error eliminando operador");
    return;
  }

  toast("Operador desactivado");
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
