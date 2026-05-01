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
      <tr>
        <td>
          <input class="name-input" id="mat_nombre_${m.id}" value="${escapeHtml(m.nombre)}">
        </td>

        <td>
          <input class="price-input" id="mat_precio_${m.id}" type="number" step="0.01" value="${m.precio_base ?? 0}">
        </td>

        <td>
          <select class="active-select" id="mat_activo_${m.id}">
            <option value="true" ${m.activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!m.activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <div class="row-actions">
            <button class="mini-btn save" onclick="guardarMaterial(${m.id})">Guardar</button>
            <button class="mini-btn off" onclick="desactivarMaterial(${m.id})">Off</button>
          </div>
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
      <tr>
        <td>
          <input class="name-input" id="imp_nombre_${t.id}" value="${escapeHtml(t.nombre)}">
        </td>

        <td>
          <input class="price-input" id="imp_precio_${t.id}" type="number" step="0.01" value="${t.precio_extra ?? 0}">
        </td>

        <td>
          <select class="active-select" id="imp_activo_${t.id}">
            <option value="true" ${t.activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!t.activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <div class="row-actions">
            <button class="mini-btn save" onclick="guardarTipoImpresion(${t.id})">Guardar</button>
            <button class="mini-btn off" onclick="desactivarTipoImpresion(${t.id})">Off</button>
          </div>
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
// Guardar material
// ---------------------------
async function guardarMaterial(id) {
  const nombre = document.getElementById(`mat_nombre_${id}`)?.value.trim() || "";
  const precio_base = Number(document.getElementById(`mat_precio_${id}`)?.value || 0);
  const activo = document.getElementById(`mat_activo_${id}`)?.value === "true";

  if (!nombre) {
    toast("El material necesita nombre");
    return;
  }

  const { error } = await supabaseClient
    .from("materiales")
    .update({ nombre, precio_base, activo })
    .eq("id", id);

  if (error) {
    console.error("Error guardando material:", error);
    toast("Error guardando material");
    return;
  }

  toast("Material actualizado");
  await cargarMaterialesAdmin();
}

// ---------------------------
// Guardar tipo de impresión
// ---------------------------
async function guardarTipoImpresion(id) {
  const nombre = document.getElementById(`imp_nombre_${id}`)?.value.trim() || "";
  const precio_extra = Number(document.getElementById(`imp_precio_${id}`)?.value || 0);
  const activo = document.getElementById(`imp_activo_${id}`)?.value === "true";

  if (!nombre) {
    toast("El tipo de impresión necesita nombre");
    return;
  }

  const { error } = await supabaseClient
    .from("tipos_impresion")
    .update({ nombre, precio_extra, activo })
    .eq("id", id);

  if (error) {
    console.error("Error guardando tipo:", error);
    toast("Error guardando tipo");
    return;
  }

  toast("Tipo de impresión actualizado");
  await cargarTiposImpresionAdmin();
}

// ---------------------------
// Nuevo material
// ---------------------------
async function nuevoMaterial() {
  const { error } = await supabaseClient
    .from("materiales")
    .insert([{
      nombre: "Nuevo material",
      precio_base: 0,
      activo: true
    }]);

  if (error) {
    console.error("Error creando material:", error);
    toast("Error creando material");
    return;
  }

  toast("Material creado");
  await cargarMaterialesAdmin();
}

// ---------------------------
// Nuevo tipo de impresión
// ---------------------------
async function nuevoTipoImpresion() {
  const { error } = await supabaseClient
    .from("tipos_impresion")
    .insert([{
      nombre: "Nuevo tipo",
      precio_extra: 0,
      activo: true
    }]);

  if (error) {
    console.error("Error creando tipo:", error);
    toast("Error creando tipo");
    return;
  }

  toast("Tipo de impresión creado");
  await cargarTiposImpresionAdmin();
}

// ---------------------------
// Desactivar material
// ---------------------------
async function desactivarMaterial(id) {
  const { error } = await supabaseClient
    .from("materiales")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error desactivando material:", error);
    toast("Error desactivando material");
    return;
  }

  toast("Material desactivado");
  await cargarMaterialesAdmin();
}

// ---------------------------
// Desactivar tipo de impresión
// ---------------------------
async function desactivarTipoImpresion(id) {
  const { error } = await supabaseClient
    .from("tipos_impresion")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error desactivando tipo:", error);
    toast("Error desactivando tipo");
    return;
  }

  toast("Tipo desactivado");
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
