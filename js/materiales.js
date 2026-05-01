console.log("Materiales JS conectado");

let materialesDB = [];
let tiposImpresionDB = [];

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
// Cargar materiales
// ---------------------------
async function cargarMaterialesAdmin() {
  const { data, error } = await supabaseClient
    .from("materiales")
    .select("id, nombre, precio_base, activo")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando materiales:", error);
    toast("Error cargando materiales");
    return;
  }

  materialesDB = data || [];
  renderMateriales();
}

// ---------------------------
// Cargar tipos de impresión
// ---------------------------
async function cargarTiposImpresionAdmin() {
  const { data, error } = await supabaseClient
    .from("tipos_impresion")
    .select("id, nombre, precio_extra, activo")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando tipos de impresión:", error);
    toast("Error cargando tipos de impresión");
    return;
  }

  tiposImpresionDB = data || [];
  renderTiposImpresion();
}

// ---------------------------
// Render materiales
// ---------------------------
function renderMateriales() {
  const tbody = document.getElementById("materialesBody");
  const counter = document.getElementById("materialesCount");
  const filtro = (document.getElementById("searchCatalogos")?.value || "").toLowerCase().trim();

  if (!tbody) return;

  const lista = materialesDB.filter(m => {
    return !filtro || String(m.nombre || "").toLowerCase().includes(filtro);
  });

  if (counter) {
    const activos = materialesDB.filter(m => m.activo).length;
    counter.textContent = `${activos} activos`;
  }

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Sin materiales</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  lista.forEach(m => {
    const fila = `
      <tr data-id="${m.id}">
        <td>
          <input class="name-input mat-nombre" data-id="${m.id}" value="${escapeHtml(m.nombre)}">
        </td>

        <td>
          <input class="price-input mat-precio" data-id="${m.id}" type="number" step="0.01" value="${m.precio_base ?? 0}">
        </td>

        <td>
          <select class="active-select mat-activo" data-id="${m.id}">
            <option value="true" ${m.activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!m.activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <button class="mini-btn del" onclick="eliminarMaterial(${m.id})">Eliminar</button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}

// ---------------------------
// Render tipos de impresión
// ---------------------------
function renderTiposImpresion() {
  const tbody = document.getElementById("impresionBody");
  const counter = document.getElementById("impresionCount");
  const filtro = (document.getElementById("searchCatalogos")?.value || "").toLowerCase().trim();

  if (!tbody) return;

  const lista = tiposImpresionDB.filter(t => {
    return !filtro || String(t.nombre || "").toLowerCase().includes(filtro);
  });

  if (counter) {
    const activos = tiposImpresionDB.filter(t => t.activo).length;
    counter.textContent = `${activos} activos`;
  }

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Sin tipos de impresión</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  lista.forEach(t => {
    const fila = `
      <tr data-id="${t.id}">
        <td>
          <input class="name-input imp-nombre" data-id="${t.id}" value="${escapeHtml(t.nombre)}">
        </td>

        <td>
          <input class="price-input imp-precio" data-id="${t.id}" type="number" step="0.01" value="${t.precio_extra ?? 0}">
        </td>

        <td>
          <select class="active-select imp-activo" data-id="${t.id}">
            <option value="true" ${t.activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!t.activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <button class="mini-btn del" onclick="eliminarTipoImpresion(${t.id})">Eliminar</button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}

// ---------------------------
// Filtrar ambos catálogos
// ---------------------------
function filtrarCatalogos() {
  renderMateriales();
  renderTiposImpresion();
}

// ---------------------------
// Guardar todos los materiales
// ---------------------------
async function guardarTodosMateriales() {
  const updates = materialesDB.map(m => {
    const id = m.id;
    const nombre = document.querySelector(`.mat-nombre[data-id="${id}"]`)?.value.trim() || "";
    const precio_base = Number(document.querySelector(`.mat-precio[data-id="${id}"]`)?.value || 0);
    const activo = document.querySelector(`.mat-activo[data-id="${id}"]`)?.value === "true";

    if (!nombre) return null;

    return supabaseClient
      .from("materiales")
      .update({ nombre, precio_base, activo })
      .eq("id", id);
  }).filter(Boolean);

  if (!updates.length) {
    toast("No hay materiales para guardar");
    return;
  }

  const resultados = await Promise.all(updates);
  const error = resultados.find(r => r.error)?.error;

  if (error) {
    console.error("Error guardando materiales:", error);
    toast("Error guardando materiales");
    return;
  }

  toast("Materiales guardados");
  await cargarMaterialesAdmin();
}

// ---------------------------
// Guardar todos los tipos de impresión
// ---------------------------
async function guardarTodosTiposImpresion() {
  const updates = tiposImpresionDB.map(t => {
    const id = t.id;
    const nombre = document.querySelector(`.imp-nombre[data-id="${id}"]`)?.value.trim() || "";
    const precio_extra = Number(document.querySelector(`.imp-precio[data-id="${id}"]`)?.value || 0);
    const activo = document.querySelector(`.imp-activo[data-id="${id}"]`)?.value === "true";

    if (!nombre) return null;

    return supabaseClient
      .from("tipos_impresion")
      .update({ nombre, precio_extra, activo })
      .eq("id", id);
  }).filter(Boolean);

  if (!updates.length) {
    toast("No hay tipos para guardar");
    return;
  }

  const resultados = await Promise.all(updates);
  const error = resultados.find(r => r.error)?.error;

  if (error) {
    console.error("Error guardando tipos:", error);
    toast("Error guardando tipos");
    return;
  }

  toast("Tipos de impresión guardados");
  await cargarTiposImpresionAdmin();
}

// ---------------------------
// Nuevo material
// ---------------------------
// ---------------------------
// Nuevo material
// ---------------------------
async function nuevoMaterial() {
  const nombreUnico = "Nuevo material " + Date.now();

  const { error } = await supabaseClient
    .from("materiales")
    .insert([{
      nombre: nombreUnico,
      precio_base: 0,
      activo: true
    }]);

  if (error) {
    console.error("Error creando material:", error);
    toast("Error creando material");
    return;
  }

  toast("Material añadido");
  await cargarMaterialesAdmin();
}

// ---------------------------
// Nuevo tipo de impresión

async function nuevoTipoImpresion() {
  const nombreUnico = "Nuevo tipo " + Date.now();

  const { error } = await supabaseClient
    .from("tipos_impresion")
    .insert([{
      nombre: nombreUnico,
      precio_extra: 0,
      activo: true
    }]);

  if (error) {
    console.error("Error creando tipo:", error);
    toast("Error creando tipo");
    return;
  }

  toast("Tipo añadido");
  await cargarTiposImpresionAdmin();
}

// ---------------------------
// Eliminar material
// NOTA: para no romper pedidos viejos, lo desactiva.
// ---------------------------
async function eliminarMaterial(id) {
  const confirmar = confirm("¿Eliminar este material de la lista activa?");
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("materiales")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando material:", error);
    toast("Error eliminando material");
    return;
  }

  toast("Material eliminado");
  await cargarMaterialesAdmin();
}

// ---------------------------
// Eliminar tipo de impresión
// NOTA: para no romper pedidos viejos, lo desactiva.
// ---------------------------
async function eliminarTipoImpresion(id) {
  const confirmar = confirm("¿Eliminar este tipo de impresión de la lista activa?");
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("tipos_impresion")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando tipo:", error);
    toast("Error eliminando tipo");
    return;
  }

  toast("Tipo eliminado");
  await cargarTiposImpresionAdmin();
}

// ---------------------------
// Recargar todo
// ---------------------------
async function recargarTodo() {
  await cargarMaterialesAdmin();
  await cargarTiposImpresionAdmin();
  toast("Catálogos recargados");
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await recargarTodo();
});
