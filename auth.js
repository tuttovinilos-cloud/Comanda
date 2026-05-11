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
  "cotizador.html": "puede_cotizador",
  "organizador de ideas.html": "puede_organizador"
};

const CURRENT_PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const REQUIRED_PERMISSION = PAGE_PERMISSIONS[CURRENT_PAGE] || "puede_pedidos";

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
