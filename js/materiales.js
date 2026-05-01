console.log("Materiales JS conectado");

// ---------------------------
// Cargar materiales
// ---------------------------
async function cargarMaterialesAdmin() {
  const { data, error } = await supabaseClient
    .from("materiales")
    .select("id, nombre, precio_base, activo")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error cargando materiales:", error);
    alert("Error cargando materiales");
    return;
  }

  const tbody = document.getElementById("materialesBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach(m => {
    const fila = `
      <tr>
        <td>
          <input id="nombre_${m.id}" value="${m.nombre ?? ""}">
        </td>

        <td>
          <input id="precio_${m.id}" type="number" step="0.01" value="${m.precio_base ?? 0}">
        </td>

        <td>
          <select id="activo_${m.id}">
            <option value="true" ${m.activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!m.activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          <button class="success" onclick="guardarMaterial(${m.id})">Guardar</button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}

// ---------------------------
// Guardar material
// ---------------------------
async function guardarMaterial(id) {
  const nombre = document.getElementById(`nombre_${id}`)?.value || "";
  const precio_base = Number(document.getElementById(`precio_${id}`)?.value || 0);
  const activo = document.getElementById(`activo_${id}`)?.value === "true";

  const { error } = await supabaseClient
    .from("materiales")
    .update({
      nombre,
      precio_base,
      activo
    })
    .eq("id", id);

  if (error) {
    console.error("Error guardando material:", error);
    alert("Error guardando material");
    return;
  }

  alert("Material actualizado");
  cargarMaterialesAdmin();
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
    alert("Error creando material");
    return;
  }

  cargarMaterialesAdmin();
}

// ---------------------------
// Inicio
// ---------------------------
window.addEventListener("DOMContentLoaded", cargarMaterialesAdmin);
