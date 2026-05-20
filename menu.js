console.log("MENU GLOBAL conectado v1");

/* =========================================================
   MENÚ GLOBAL TUTTOVINILOS / COMANDA
   Archivo: js/menu.js

   Uso en cada HTML:

   <button class="app-menu-btn" id="mobileMenuBtn" type="button">☰ Menú</button>
   <nav class="app-menu" id="authMenu"></nav>

   Al final del HTML:
   <script src="js/menu.js?v=1"></script>
========================================================= */

const MENU_ITEMS = [
  {
    label: "Pedidos",
    icon: "📋",
    href: "index.html",
    permiso: "pedidos"
  },
  {
    label: "Clientes",
    icon: "👤",
    href: "clientes.html",
    permiso: "clientes"
  },
  {
    label: "Materiales",
    icon: "💲",
    href: "materiales.html",
    permiso: "materiales"
  },
  {
    label: "Estadísticas",
    icon: "📊",
    href: "estadisticas.html",
    permiso: "estadisticas"
  },
  {
    label: "Cotizador",
    icon: "🧾",
    href: "Cotizador.html",
    permiso: "cotizador"
  },
  {
    label: "TUTTOPROYECTO",
    icon: "🚀",
    href: "Organizador de ideas.html",
    permiso: "proyectos"
  },
  {
    label: "Configuración",
    icon: "⚙️",
    href: "configuracion.html",
    permiso: "configuracion"
  }
];

/* =========================================================
   PERMISOS BÁSICOS POR OPERADOR
   Luego esto se puede conectar a Supabase.
========================================================= */

const PERMISOS_OPERADOR = {
  Roberto: ["todo"],

  Ricardo: [
    "pedidos",
    "clientes",
    "cotizador",
    "proyectos"
  ],

  "Marie Gabriela": [
    "pedidos",
    "clientes",
    "cotizador",
    "proyectos"
  ],

  Ana: [
    "marketing"
  ],

  Chico: [
    "pedidos",
    "proyectos"
  ],

  Carlos: [
    "pedidos",
    "proyectos"
  ],

  Ruben: [
    "pedidos",
    "proyectos"
  ]
};

/* =========================================================
   UTILIDADES
========================================================= */

function menuNormalizar(valor){
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function menuGetOperadorActual(){
  try{
    if(typeof window.getSesionOperador === "function"){
      const op = window.getSesionOperador();

      if(op && op.nombre){
        return op;
      }
    }
  }catch(error){
    console.warn("No se pudo leer operador desde auth.js:", error);
  }

  try{
    const local = JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");

    if(local && local.nombre){
      return local;
    }
  }catch(error){
    console.warn("No se pudo leer operador desde localStorage:", error);
  }

  return null;
}

function menuTienePermiso(permiso){
  const operador = menuGetOperadorActual();

  if(!operador || !operador.nombre){
    return false;
  }

  const nombreOperador = operador.nombre;
  const permisos = PERMISOS_OPERADOR[nombreOperador] || [];

  if(permisos.includes("todo")){
    return true;
  }

  return permisos.includes(permiso);
}

function menuPaginaActual(){
  const path = window.location.pathname;
  const file = decodeURIComponent(path.split("/").pop() || "index.html");

  return file || "index.html";
}

function menuEsActivo(href){
  const actual = menuNormalizar(menuPaginaActual());
  const destino = menuNormalizar(href);

  return actual === destino;
}

function menuCerrarSesion(){
  try{
    localStorage.removeItem("comanda_operador_actual");
    localStorage.removeItem("operadorActual");
    localStorage.removeItem("usuarioActual");
  }catch(error){
    console.warn("No se pudo limpiar sesión:", error);
  }

  window.location.href = "login.html?logout=1";
}

/* =========================================================
   RENDER DEL MENÚ
========================================================= */

function renderMenuGlobal(){
  const menu = document.getElementById("authMenu");

  if(!menu){
    console.warn("No existe #authMenu en esta página.");
    return;
  }

  const operador = menuGetOperadorActual();

  const visibles = MENU_ITEMS.filter(item => {
    return menuTienePermiso(item.permiso);
  });

  const linksHtml = visibles.map(item => {
    const active = menuEsActivo(item.href) ? "active" : "";

    return `
      <a class="${active}" href="${item.href}">
        <span>${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `;
  }).join("");

  const operadorHtml = operador?.nombre
    ? `<span class="menu-user">👤 ${operador.nombre}</span>`
    : "";

  menu.innerHTML = `
    ${linksHtml}

    ${operadorHtml}

    <button type="button" class="menu-logout" id="menuLogoutBtn">
      Salir
    </button>
  `;

  const logoutBtn = document.getElementById("menuLogoutBtn");

  if(logoutBtn){
    logoutBtn.addEventListener("click", menuCerrarSesion);
  }
}

/* =========================================================
   BOTÓN MÓVIL
========================================================= */

function activarMenuMovil(){
  const btn = document.getElementById("mobileMenuBtn");
  const menu = document.getElementById("authMenu");

  if(!btn || !menu){
    return;
  }

  btn.addEventListener("click", () => {
    menu.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    const clickDentroMenu = menu.contains(e.target);
    const clickBoton = btn.contains(e.target);

    if(!clickDentroMenu && !clickBoton){
      menu.classList.remove("open");
    }
  });
}

/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderMenuGlobal();
  activarMenuMovil();
});
