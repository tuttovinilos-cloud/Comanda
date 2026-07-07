console.log("MENU GLOBAL conectado v45 compras y contabilidad");

/* =========================================================
   MENU GLOBAL COMANDA / TUTTOVINILOS
   - Usa #authMenu
   - Usa .header-tabs / .tab-btn
   - Crea o reutiliza botón móvil .mobile-menu-btn
   - Carga operadores en q_operador, f_operador, filterOperador
   - Respeta permisos del operador actual
========================================================= */

(function(){
  const AUTH_KEY = "comanda_operador_actual";

  const links = [
    { page:"index.html", label:"▣ Pedido", permission:"puede_pedidos" },
    { page:"precios.html", label:"💲 Precio", permission:"puede_precios" },
    { page:"clientes.html", label:"♟ Cliente", permission:"puede_clientes" },
    { page:"label.html", label:"🏷 Label", permission:"puede_label" },
    { page:"Cotizador.html", label:"▣ Cotizador", permission:"puede_cotizador" },
    { page:"Organizador de ideas.html", label:"💡 Organizador", permission:"puede_organizador" },
    { page:"estadisticas.html", label:"▥ Estadísticas", permission:"puede_estadisticas" },
    { page:"marketing.html", label:"◄ Marketing", permission:"puede_marketing" },
    { page:"materiales.html", label:"$ Materiales", permission:"puede_materiales" },
    { page:"compras.html", label:"🛒 Compras", permission:"puede_compras" },
    { page:"contabilidad.html", label:"▤ Contabilidad", permission:"puede_contabilidad" },
    { page:"configuracion.html", label:"⚙ Configuración", permission:"puede_configuracion" }
  ];

  function getOp(){
    try{
      if(typeof window.getSesionOperador === "function"){
        const op = window.getSesionOperador();
        if(op) return op;
      }
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    }catch(e){
      return null;
    }
  }

  function norm(v){
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .trim();
  }

  function isRoberto(op){
    return norm(op && op.nombre) === "roberto";
  }

  function hasPermission(op, perm){
    if(!op || op.activo === false) return false;
    if(isRoberto(op)) return true;
    return op[perm] === true;
  }

  function firstAllowed(op){
    if(isRoberto(op)) return "index.html";
    const item = links.find(l => op && op[l.permission] === true);
    return item ? item.page : "login.html";
  }

  function currentPage(){
    const file = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
    return file || "index.html";
  }

  function samePage(a,b){
    return norm(a) === norm(b);
  }

  function logout(){
    localStorage.removeItem(AUTH_KEY);
    location.href = "login.html?logout=1";
  }

  function crearStoragePill(){
    const pill = document.createElement("div");
    pill.className = "menu-status storage-pill";
    pill.id = "storageBadgeHeader";
    pill.innerHTML = `
      <span class="status-dot storage-dot"></span>
      <span id="storageBadgeTextHeader">SUPABASE</span>
    `;
    return pill;
  }

  function renderMenu(){
    const op = getOp();

    if(!op || op.activo === false){
      location.href = "login.html";
      return;
    }

    const menu = document.getElementById("authMenu");

    if(!menu){
      console.warn("No existe #authMenu");
      marcarMenuListo();
      return;
    }

    menu.innerHTML = "";

    const pageNow = currentPage();
    let visibles = 0;

    links.forEach(item => {
      if(!hasPermission(op, item.permission)) return;

      visibles++;

      const a = document.createElement("a");
      a.href = item.page;
      a.textContent = item.label;
      a.className = "tab-btn";

      if(samePage(item.page, pageNow)){
        a.classList.add("active");
      }

      menu.appendChild(a);
    });

    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "tab-btn";
    logoutBtn.textContent = "Salir";
    logoutBtn.onclick = logout;
    menu.appendChild(logoutBtn);

    menu.appendChild(crearStoragePill());

    syncStorageBadge();

    const currentItem = links.find(l => samePage(l.page, pageNow));
    if(currentItem && !hasPermission(op, currentItem.permission)){
      location.href = firstAllowed(op);
      return;
    }

    if(visibles === 0){
      console.warn("Operador sin permisos visibles:", op);
    }
  }

  function setupMobileMenu(){
    const header = document.querySelector(".header, .top, .top-inner");
    const menu = document.getElementById("authMenu");

    if(!header || !menu) return;

    let btn = document.getElementById("mobileMenuBtn");

    if(!btn){
      btn = document.createElement("button");
      btn.id = "mobileMenuBtn";
      btn.className = "mobile-menu-btn";
      btn.type = "button";
      btn.textContent = "☰ Menú";
      header.insertBefore(btn, menu);
    }

    btn.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();

      const isOpen = menu.classList.toggle("open");
      btn.classList.toggle("active", isOpen);
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      btn.textContent = isOpen ? "✕ Cerrar" : "☰ Menú";

      if(typeof window.updateStickyOffsets === "function"){
        window.updateStickyOffsets();
      }
    };

    document.addEventListener("click", function(e){
      if(!menu.classList.contains("open")) return;
      if(header.contains(e.target)) return;
      menu.classList.remove("open");
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "☰ Menú";
    });
  }

  function syncStorageBadge(){
    const desktopText = document.getElementById("storageBadgeText");
    const headerText = document.getElementById("storageBadgeTextHeader");
    const desktopBadge = document.getElementById("storageBadge");
    const headerBadge = document.getElementById("storageBadgeHeader");

    const isSupa = !!window.supabaseClient || desktopBadge?.classList.contains("ok");

    if(headerText){
      headerText.textContent = isSupa
        ? "SUPABASE"
        : (desktopText?.textContent || "LOCAL");
    }

    if(headerBadge){
      if(isSupa){
        headerBadge.classList.add("ok");
      }else{
        headerBadge.classList.remove("ok");
      }
    }
  }

  function setSelectOptions(select, operadores, placeholder){
    if(!select) return;

    const current = select.value;
    select.innerHTML = `<option value="">${placeholder}</option>`;

    operadores.forEach(op => {
      const opt = document.createElement("option");
      opt.value = op.nombre;
      opt.textContent = op.nombre;
      select.appendChild(opt);
    });

    if(current){
      select.value = current;
    }
  }

  async function cargarOperadoresEnComanda(){
    const fallback = [
      { nombre:"Roberto" },
      { nombre:"Ricardo" },
      { nombre:"Marie Gabriela" },
      { nombre:"Chico" },
      { nombre:"Carlos" },
      { nombre:"Alejandro" },
      { nombre:"Ruben" },
      { nombre:"Ana" },
      { nombre:"Miguel" }
    ];

    let operadores = fallback;

    try{
      if(window.supabaseClient){
        const { data, error } = await window.supabaseClient
          .from("operadores")
          .select("nombre, activo")
          .eq("activo", true)
          .order("nombre", { ascending:true });

        if(!error && Array.isArray(data) && data.length){
          operadores = data;
        }
      }
    }catch(e){
      console.warn("No se pudieron cargar operadores desde Supabase:", e);
    }

    setSelectOptions(document.getElementById("q_operador"), operadores, "Operador");
    setSelectOptions(document.getElementById("f_operador"), operadores, "Seleccionar…");
    setSelectOptions(document.getElementById("filterOperador"), operadores, "Operador");

    const opActual = getOp();

    if(opActual && opActual.nombre){
      const puedeCambiarOperador = isRoberto(opActual) || opActual.puede_modificar_operador === true;

      ["q_operador", "f_operador"].forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;

        el.value = opActual.nombre;

        if(!puedeCambiarOperador){
          el.disabled = true;
        }
      });
    }
  }

  function marcarSupabaseSiListo(){
    const badgeText = document.getElementById("storageBadgeText");
    const badgeBox = document.getElementById("storageBadge");

    if(window.supabaseClient){
      if(badgeText) badgeText.textContent = "SUPABASE";
      if(badgeBox) badgeBox.classList.add("ok");
    }

    syncStorageBadge();
  }

  function updateStickyOffsets(){
    document.documentElement.style.setProperty("--sticky-head-top", "0px");
    document.documentElement.style.setProperty("--sticky-quick-top", "0px");
  }

  function marcarMenuListo(){
    const header = document.querySelector(".header, .top");

    document.documentElement.classList.remove("loading-menu");
    document.documentElement.classList.add("menu-ready");

    if(header){
      header.classList.add("menu-ready");
    }
  }

  window.logout = window.logout || logout;
  window.cargarOperadoresEnComanda = cargarOperadoresEnComanda;
  window.updateStickyOffsets = window.updateStickyOffsets || updateStickyOffsets;
  window.marcarSupabaseSiListo = window.marcarSupabaseSiListo || marcarSupabaseSiListo;

  document.addEventListener("DOMContentLoaded", function(){
    marcarSupabaseSiListo();
    renderMenu();
    setupMobileMenu();
    marcarMenuListo();

    updateStickyOffsets();
    cargarOperadoresEnComanda();
    syncStorageBadge();

    window.addEventListener("resize", updateStickyOffsets);

    if(window.__MENU_STORAGE_TIMER__){
      clearInterval(window.__MENU_STORAGE_TIMER__);
    }

    window.__MENU_STORAGE_TIMER__ = setInterval(syncStorageBadge, 1500);
  });
})();

