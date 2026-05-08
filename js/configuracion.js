console.log("Configuración JS conectado");

// =====================================================
// CONFIGURACIÓN · OPERADORES
// =====================================================

let operadoresDB = [];

// =====================================================
// TOAST
// =====================================================

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

// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// =====================================================
// NORMALIZAR
// =====================================================

function normalizar(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function esRobertoNombre(nombre) {
  return normalizar(nombre) === "roberto";
}

// =====================================================
// PLANTILLAS POR JERARQUÍA
// =====================================================

const JERARQUIAS = {
  Administrador: {
    puede_pedidos: true,
    puede_clientes: true,
    puede_materiales: true,
    puede_estadisticas: true,
    puede_configuracion: true,
    puede_marketing: true,
    puede_cotizador: true,
    puede_organizador: true,
    puede_modificar_operador: true,
    puede_modificar_cantidad: true
  },

  Supervisor: {
    puede_pedidos: true,
    puede_clientes: true,
    puede_materiales: false,
    puede_estadisticas: true,
    puede_configuracion: false,
    puede_marketing: false,
    puede_cotizador: true,
    puede_organizador: true,
    puede_modificar_operador: true,
    puede_modificar_cantidad: true
  },

  Operador: {
    puede_pedidos: true,
    puede_clientes: true,
    puede_materiales: false,
    puede_estadisticas: false,
    puede_configuracion: false,
    puede_marketing: false,
    puede_cotizador: false,
    puede_organizador: false,
    puede_modificar_operador: false,
    puede_modificar_cantidad: false
  },

  Marketing: {
    puede_pedidos: false,
    puede_clientes: false,
    puede_materiales: false,
    puede_estadisticas: false,
    puede_configuracion: false,
    puede_marketing: true,
    puede_cotizador: false,
    puede_organizador: false,
    puede_modificar_operador: false,
    puede_modificar_cantidad: false
  },

  "Solo lectura": {
    puede_pedidos: true,
    puede_clientes: false,
    puede_materiales: false,
    puede_estadisticas: false,
    puede_configuracion: false,
    puede_marketing: false,
    puede_cotizador: false,
    puede_organizador: false,
    puede_modificar_operador: false,
    puede_modificar_cantidad: false
  }
};

function getJerarquia(op) {
  if (op.jerarquia) return op.jerarquia;
  if (esRobertoNombre(op.nombre)) return "Administrador";
  if (op.puede_marketing && !op.puede_pedidos) return "Marketing";
  if (op.puede_configuracion) return "Administrador";
  if (op.puede_estadisticas) return "Supervisor";
  if (op.puede_pedidos) return "Operador";
  return "Solo lectura";
}

// =====================================================
// CARGAR OPERADORES
// =====================================================

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

// =====================================================
// RENDER OPERADORES
// =====================================================

function renderOperadores() {
  const tbody = document.getElementById("operadoresBody");
  const count = document.getElementById("operadoresCount");
  const filtro = normalizar(document.getElementById("searchOperadores")?.value || "");

  if (!tbody) return;

  let lista = operadoresDB.filter(op => {
    const texto = normalizar([
      op.nombre,
      op.clave,
      op.jerarquia,
      op.activo ? "activo" : "inactivo"
    ].join(" "));

    return !filtro || texto.includes(filtro);
  });

  lista.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));

  if (count) {
    const activos = operadoresDB.filter(op => op.activo !== false).length;
    count.textContent = `${activos} activos`;
  }

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="15" class="empty">Sin operadores</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  lista.forEach(op => {
    const id = op.id;
    const activo = op.activo !== false;
    const esRoberto = esRobertoNombre(op.nombre);
    const jerarquia = getJerarquia(op);

    const fila = `
      <tr data-id="${id}">
        <td>
          <input 
            class="name-input op-nombre" 
            data-id="${id}" 
            value="${escapeHtml(op.nombre || "")}" 
            placeholder="Nombre"
            ${esRoberto ? "readonly title='Roberto está protegido'" : ""}
          >
        </td>

        <td>
          <input 
            class="clave-input op-clave" 
            data-id="${id}" 
            value="${escapeHtml(op.clave || "")}" 
            placeholder="Clave"
          >
        </td>

        <td>
          <select 
            class="jerarquia-select op-jerarquia" 
            data-id="${id}" 
            onchange="aplicarJerarquia(${id})"
            ${esRoberto ? "disabled title='Roberto siempre es administrador'" : ""}
          >
            <option ${jerarquia === "Administrador" ? "selected" : ""}>Administrador</option>
            <option ${jerarquia === "Supervisor" ? "selected" : ""}>Supervisor</option>
            <option ${jerarquia === "Operador" ? "selected" : ""}>Operador</option>
            <option ${jerarquia === "Marketing" ? "selected" : ""}>Marketing</option>
            <option ${jerarquia === "Solo lectura" ? "selected" : ""}>Solo lectura</option>
          </select>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-pedidos" data-id="${id}" ${op.puede_pedidos ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-clientes" data-id="${id}" ${op.puede_clientes ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-materiales" data-id="${id}" ${op.puede_materiales ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-estadisticas" data-id="${id}" ${op.puede_estadisticas ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-configuracion" data-id="${id}" ${op.puede_configuracion ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-marketing" data-id="${id}" ${op.puede_marketing ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-cotizador" data-id="${id}" ${op.puede_cotizador ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-organizador" data-id="${id}" ${op.puede_organizador ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-mod-operador" data-id="${id}" ${op.puede_modificar_operador ? "checked" : ""}>
        </td>

        <td class="check-cell">
          <input type="checkbox" class="op-mod-cantidad" data-id="${id}" ${op.puede_modificar_cantidad ? "checked" : ""}>
        </td>

        <td>
          <select class="active-select op-activo" data-id="${id}" ${esRoberto ? "disabled title='Roberto no puede desactivarse'" : ""}>
            <option value="true" ${activo ? "selected" : ""}>Activo</option>
            <option value="false" ${!activo ? "selected" : ""}>Inactivo</option>
          </select>
        </td>

        <td>
          ${esRoberto
            ? `<button class="mini-btn" type="button" disabled title="Roberto no se puede eliminar">Protegido</button>`
            : `<button class="mini-btn del" type="button" onclick="desactivarOperador(${id})">Desactivar</button>`}
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);

    if (esRoberto) {
      bloquearRobertoVisual(id);
    }
  });
}

// =====================================================
// BLOQUEAR ROBERTO VISUALMENTE
// =====================================================

function bloquearRobertoVisual(id) {
  const checks = [
    ".op-pedidos",
    ".op-clientes",
    ".op-materiales",
    ".op-estadisticas",
    ".op-configuracion",
    ".op-marketing",
    ".op-cotizador",
    ".op-organizador",
    ".op-mod-operador",
    ".op-mod-cantidad"
  ];

  checks.forEach(cls => {
    const el = document.querySelector(`${cls}[data-id="${id}"]`);
    if (!el) return;
    el.checked = true;
    el.disabled = true;
    el.title = "Roberto tiene acceso total permanente";
  });
}

// =====================================================
// FILTRAR
// =====================================================

function filtrarOperadores() {
  renderOperadores();
}

// =====================================================
// APLICAR JERARQUÍA
// =====================================================

function setCheck(selector, id, value) {
  const el = document.querySelector(`${selector}[data-id="${id}"]`);
  if (el) el.checked = !!value;
}

function aplicarJerarquia(id) {
  const nombre = document.querySelector(`.op-nombre[data-id="${id}"]`)?.value || "";

  if (esRobertoNombre(nombre)) {
    bloquearRobertoVisual(id);
    toast("Roberto siempre es administrador");
    return;
  }

  const jerarquia = document.querySelector(`.op-jerarquia[data-id="${id}"]`)?.value || "Operador";
  const plantilla = JERARQUIAS[jerarquia];

  if (!plantilla) return;

  setCheck(".op-pedidos", id, plantilla.puede_pedidos);
  setCheck(".op-clientes", id, plantilla.puede_clientes);
  setCheck(".op-materiales", id, plantilla.puede_materiales);
  setCheck(".op-estadisticas", id, plantilla.puede_estadisticas);
  setCheck(".op-configuracion", id, plantilla.puede_configuracion);
  setCheck(".op-marketing", id, plantilla.puede_marketing);
  setCheck(".op-cotizador", id, plantilla.puede_cotizador);
  setCheck(".op-organizador", id, plantilla.puede_organizador);
  setCheck(".op-mod-operador", id, plantilla.puede_modificar_operador);
  setCheck(".op-mod-cantidad", id, plantilla.puede_modificar_cantidad);

  toast(`Jerarquía aplicada: ${jerarquia}`);
}

// =====================================================
// NUEVO OPERADOR
// =====================================================

async function nuevoOperador() {
  const nombreUnico = "Nuevo operador " + Date.now();

  const plantilla = JERARQUIAS.Operador;

  const { error } = await supabaseClient
    .from("operadores")
    .insert([{
      nombre: nombreUnico,
      clave: "0000",
      jerarquia: "Operador",

      puede_pedidos: plantilla.puede_pedidos,
      puede_clientes: plantilla.puede_clientes,
      puede_materiales: plantilla.puede_materiales,
      puede_estadisticas: plantilla.puede_estadisticas,
      puede_configuracion: plantilla.puede_configuracion,
      puede_marketing: plantilla.puede_marketing,
      puede_cotizador: plantilla.puede_cotizador,
      puede_organizador: plantilla.puede_organizador,
      puede_modificar_operador: plantilla.puede_modificar_operador,
      puede_modificar_cantidad: plantilla.puede_modificar_cantidad,

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

// =====================================================
// LEER FILA
// =====================================================

function leerOperadorDesdeFila(op) {
  const id = op.id;

  const nombre = document.querySelector(`.op-nombre[data-id="${id}"]`)?.value.trim() || "";
  const clave = document.querySelector(`.op-clave[data-id="${id}"]`)?.value.trim() || "";
  const jerarquia = document.querySelector(`.op-jerarquia[data-id="${id}"]`)?.value || getJerarquia(op);

  let data = {
    nombre,
    clave,
    jerarquia,

    puede_pedidos: document.querySelector(`.op-pedidos[data-id="${id}"]`)?.checked || false,
    puede_clientes: document.querySelector(`.op-clientes[data-id="${id}"]`)?.checked || false,
    puede_materiales: document.querySelector(`.op-materiales[data-id="${id}"]`)?.checked || false,
    puede_estadisticas: document.querySelector(`.op-estadisticas[data-id="${id}"]`)?.checked || false,
    puede_configuracion: document.querySelector(`.op-configuracion[data-id="${id}"]`)?.checked || false,
    puede_marketing: document.querySelector(`.op-marketing[data-id="${id}"]`)?.checked || false,
    puede_cotizador: document.querySelector(`.op-cotizador[data-id="${id}"]`)?.checked || false,
    puede_organizador: document.querySelector(`.op-organizador[data-id="${id}"]`)?.checked || false,
    puede_modificar_operador: document.querySelector(`.op-mod-operador[data-id="${id}"]`)?.checked || false,
    puede_modificar_cantidad: document.querySelector(`.op-mod-cantidad[data-id="${id}"]`)?.checked || false,

    activo: document.querySelector(`.op-activo[data-id="${id}"]`)?.value === "true"
  };

  // Roberto blindado
  if (esRobertoNombre(op.nombre) || esRobertoNombre(nombre)) {
    data.nombre = op.nombre || "Roberto";
    data.jerarquia = "Administrador";
    data.puede_pedidos = true;
    data.puede_clientes = true;
    data.puede_materiales = true;
    data.puede_estadisticas = true;
    data.puede_configuracion = true;
    data.puede_marketing = true;
    data.puede_cotizador = true;
    data.puede_organizador = true;
    data.puede_modificar_operador = true;
    data.puede_modificar_cantidad = true;
    data.activo = true;
  }

  return data;
}

// =====================================================
// GUARDAR TODOS
// =====================================================

async function guardarTodosOperadores() {
  const updates = operadoresDB.map(op => {
    const id = op.id;
    const data = leerOperadorDesdeFila(op);

    if (!data.nombre) return null;

    return supabaseClient
      .from("operadores")
      .update(data)
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

  // Refresca la sesión actual si se modificó el usuario logueado
  await refrescarSesionActual();

  await cargarOperadoresAdmin();
}

// =====================================================
// REFRESCAR SESIÓN ACTUAL
// =====================================================

async function refrescarSesionActual() {
  try {
    const sesion = JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
    if (!sesion?.id) return;

    const { data, error } = await supabaseClient
      .from("operadores")
      .select("*")
      .eq("id", sesion.id)
      .single();

    if (error || !data) return;

    localStorage.setItem("comanda_operador_actual", JSON.stringify(data));
  } catch (e) {
    console.warn("No se pudo refrescar sesión:", e);
  }
}

// =====================================================
// DESACTIVAR OPERADOR
// =====================================================

async function desactivarOperador(id) {
  const operador = operadoresDB.find(op => Number(op.id) === Number(id));

  if (!operador) {
    toast("Operador no encontrado");
    return;
  }

  if (esRobertoNombre(operador.nombre)) {
    toast("Roberto no se puede desactivar");
    return;
  }

  const confirmar = confirm(`¿Desactivar a ${operador.nombre}? No se borrará el historial.`);
  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("operadores")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error desactivando operador:", error);
    toast("Error desactivando operador");
    return;
  }

  toast("Operador desactivado");
  await cargarOperadoresAdmin();
}

// =====================================================
// RECARGAR
// =====================================================

async function recargarTodo() {
  await cargarOperadoresAdmin();
  toast("Configuración recargada");
}

// =====================================================
// INICIO
// =====================================================

window.addEventListener("DOMContentLoaded", async () => {
  await recargarTodo();
});
