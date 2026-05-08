console.log("Auth JS conectado");

// =========================================
// CONFIGURACIÓN DE ACCESO POR PÁGINA
// =========================================
const PAGE_PERMISSIONS = {
  "index.html": "puede_pedidos",
  "clientes.html": "puede_clientes",
  "materiales.html": "puede_materiales",
  "estadisticas.html": "puede_estadisticas",
  "configuracion.html": "puede_configuracion",
  "marketing.html": "puede_marketing"
};

const CURRENT_PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const REQUIRED_PERMISSION = PAGE_PERMISSIONS[CURRENT_PAGE] || "puede_pedidos";

// Pages that should be restricted to Administrador only (e.g. Roberto tools).
const ADMIN_ONLY_PAGES = new Set([
  "cotizador.html",
  "organizador%20de%20ideas.html",
]);

let operadorActual = null;

// =========================================
// CSS DEL LOGIN
// =========================================
function injectAuthStyles() {
  if (document.getElementById("authStyles")) return;

  const style = document.createElement("style");
  style.id = "authStyles";
  style.textContent = `
    .auth-backdrop{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.88);
      backdrop-filter:blur(6px);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
    }

    .auth-card{
      width:100%;
      max-width:420px;
      background:#13161d;
      border:1px solid #2a3048;
      border-radius:16px;
      box-shadow:0 24px 80px #000;
      overflow:hidden;
      color:#e2e8f0;
      font-family:'Barlow',Arial,sans-serif;
    }

    .auth-head{
      padding:18px 20px;
      border-bottom:1px solid #1e2330;
    }

    .auth-title{
      font-family:'Barlow Condensed',Arial,sans-serif;
      font-size:22px;
      font-weight:900;
      letter-spacing:2px;
      text-transform:uppercase;
      color:#60a5fa;
    }

    .auth-sub{
      margin-top:4px;
      font-size:12px;
      color:#94a3b8;
      line-height:1.4;
    }

    .auth-body{
      padding:20px;
      display:flex;
      flex-direction:column;
      gap:12px;
    }

    .auth-field{
      display:flex;
      flex-direction:column;
      gap:6px;
    }

    .auth-field label{
      font-family:'Barlow Condensed',Arial,sans-serif;
      font-size:11px;
      font-weight:700;
      letter-spacing:1.7px;
      text-transform:uppercase;
      color:#64748b;
    }

    .auth-field input,
    .auth-field select{
      width:100%;
      background:#0d0f14;
      color:#e2e8f0;
      border:1px solid #2a3048;
      border-radius:8px;
      padding:11px 12px;
      outline:none;
      font-size:14px;
    }

    .auth-field input:focus,
    .auth-field select:focus{
      border-color:#3b82f6;
      box-shadow:0 0 0 2px #3b82f622;
    }

    .auth-btn{
      margin-top:6px;
      background:#3b82f6;
      color:white;
      border:none;
      border-radius:8px;
      padding:11px 14px;
      cursor:pointer;
      font-family:'Barlow Condensed',Arial,sans-serif;
      font-size:13px;
      font-weight:900;
      letter-spacing:1.7px;
      text-transform:uppercase;
    }

    .auth-btn:hover{filter:brightness(1.1)}

    .auth-error{
      display:none;
      background:#FF3B3011;
      border:1px solid #FF3B3044;
      color:#FF3B30;
      border-radius:8px;
      padding:10px 12px;
      font-size:13px;
      line-height:1.35;
    }

    .auth-topbar{
      position:fixed;
      right:14px;
      bottom:14px;
      z-index:9999;
      display:flex;
      align-items:center;
      gap:8px;
      background:#13161d;
      border:1px solid #2a3048;
      border-radius:999px;
      padding:7px 8px 7px 12px;
      box-shadow:0 10px 35px #0008;
      color:#e2e8f0;
      font-family:'Barlow Condensed',Arial,sans-serif;
      font-size:11px;
      font-weight:700;
      letter-spacing:1px;
      text-transform:uppercase;
    }

    .auth-topbar span{
      color:#60a5fa;
      max-width:150px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }

    .auth-logout{
      border:1px solid #2a3048;
      background:transparent;
      color:#94a3b8;
      border-radius:999px;
      padding:5px 8px;
      cursor:pointer;
      font-family:'Barlow Condensed',Arial,sans-serif;
      font-size:10px;
      font-weight:700;
      letter-spacing:1px;
      text-transform:uppercase;
    }

    .auth-logout:hover{
      border-color:#FF3B30;
      color:#FF3B30;
      background:#FF3B3011;
    }
  `;

  document.head.appendChild(style);
}

// =========================================
// SESIÓN LOCAL
// =========================================
function getSesionOperador() {
  try {
    return JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
  } catch {
    return null;
  }
}

function setSesionOperador(op) {
  localStorage.setItem("comanda_operador_actual", JSON.stringify(op));
}

function clearSesionOperador() {
  localStorage.removeItem("comanda_operador_actual");
}

// =========================================
// VERIFICAR PERMISO
// =========================================
function tienePermiso(op) {
  if (!op) return false;
  if (op.activo === false) return false;

  // Administrador entra a todo.
  if (op.rol === "Administrador") return true;

  // Some tools are admin-only regardless of checkbox permissions.
  if (ADMIN_ONLY_PAGES.has(CURRENT_PAGE)) return false;

  return op[REQUIRED_PERMISSION] === true;
}

// =========================================
// CARGAR OPERADORES ACTIVOS
// =========================================
async function obtenerOperadores() {
  const { data, error } = await supabaseClient
    .from("operadores")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando operadores para login:", error);
    return [];
  }

  return data || [];
}

// =========================================
// MOSTRAR LOGIN
// =========================================
async function mostrarLogin(mensaje = "") {
  injectAuthStyles();

  const operadores = await obtenerOperadores();

  const viejo = document.getElementById("authBackdrop");
  if (viejo) viejo.remove();

  const options = operadores.map(op => {
    return `<option value="${op.id}">${op.nombre} · ${op.rol || "Operador"}</option>`;
  }).join("");

  const html = `
    <div class="auth-backdrop" id="authBackdrop">
      <div class="auth-card">
        <div class="auth-head">
          <div class="auth-title">Acceso requerido</div>
          <div class="auth-sub">Selecciona tu usuario e introduce la clave para entrar a este módulo.</div>
        </div>

        <div class="auth-body">
          <div class="auth-error" id="authError">${mensaje || ""}</div>

          <div class="auth-field">
            <label>Operador</label>
            <select id="authUser">
              ${options}
            </select>
          </div>

          <div class="auth-field">
            <label>Clave</label>
            <input id="authPass" type="password" placeholder="Clave" autocomplete="current-password">
          </div>

          <button class="auth-btn" type="button" onclick="loginOperador()">Entrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);

  const errorBox = document.getElementById("authError");
  if (mensaje && errorBox) errorBox.style.display = "block";

  const pass = document.getElementById("authPass");
  if (pass) {
    pass.focus();
    pass.addEventListener("keydown", e => {
      if (e.key === "Enter") loginOperador();
    });
  }
}

// =========================================
// LOGIN
// =========================================
async function loginOperador() {
  const userId = document.getElementById("authUser")?.value;
  const clave = document.getElementById("authPass")?.value || "";
  const errorBox = document.getElementById("authError");

  const operadores = await obtenerOperadores();
  const op = operadores.find(o => String(o.id) === String(userId));

  if (!op) {
    if (errorBox) {
      errorBox.textContent = "Usuario no encontrado.";
      errorBox.style.display = "block";
    }
    return;
  }

  if (String(op.clave || "") !== String(clave)) {
    if (errorBox) {
      errorBox.textContent = "Clave incorrecta.";
      errorBox.style.display = "block";
    }
    return;
  }

  if (!tienePermiso(op)) {
    if (errorBox) {
      errorBox.textContent = "Este usuario no tiene permiso para entrar a este módulo.";
      errorBox.style.display = "block";
    }
    return;
  }

  operadorActual = op;
  setSesionOperador(op);

  const backdrop = document.getElementById("authBackdrop");
  if (backdrop) backdrop.remove();

  pintarTopbarSesion();
  aplicarOperadorDefault();
}

// =========================================
// CERRAR SESIÓN
// =========================================
function logoutOperador() {
  clearSesionOperador();
  location.reload();
}

// =========================================
// BARRA DE SESIÓN
// =========================================
function pintarTopbarSesion() {
  injectAuthStyles();

  const viejo = document.getElementById("authTopbar");
  if (viejo) viejo.remove();

  if (!operadorActual) return;

  const html = `
    <div class="auth-topbar" id="authTopbar">
      <span>${operadorActual.nombre || "Usuario"}</span>
      <button class="auth-logout" onclick="logoutOperador()">Salir</button>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
}

// =========================================
// PONER OPERADOR DEFAULT EN COMANDA
// =========================================
function aplicarOperadorDefault() {
  if (!operadorActual) return;

  const qOperador = document.getElementById("q_operador");
  const fOperador = document.getElementById("f_operador");

  if (qOperador && !qOperador.value) {
    qOperador.value = operadorActual.nombre;
  }

  if (fOperador && !fOperador.value) {
    fOperador.value = operadorActual.nombre;
  }
}

// =========================================
// PROTEGER PÁGINA
// =========================================
async function protegerPagina() {
  injectAuthStyles();

  const sesion = getSesionOperador();

  if (!sesion) {
    await mostrarLogin();
    return;
  }

  // Revalidar contra Supabase para que permisos actualizados tengan efecto.
  const operadores = await obtenerOperadores();
  const actualizado = operadores.find(o => String(o.id) === String(sesion.id));

  if (!actualizado) {
    clearSesionOperador();
    await mostrarLogin("Tu usuario ya no existe o está inactivo.");
    return;
  }

  if (!tienePermiso(actualizado)) {
    clearSesionOperador();
    await mostrarLogin("No tienes permiso para entrar a este módulo.");
    return;
  }

  operadorActual = actualizado;
  setSesionOperador(actualizado);
  pintarTopbarSesion();
  aplicarOperadorDefault();
}

// =========================================
// INICIO
// =========================================
window.addEventListener("DOMContentLoaded", protegerPagina);
