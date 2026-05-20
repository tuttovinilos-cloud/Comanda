console.log("MENU GLOBAL conectado v3");

/* =========================================================
   MENU GLOBAL COMANDA / TUTTOVINILOS v3
   Adaptado al index actual:
   - Usa #authMenu
   - Usa .header-tabs / .tab-btn
   - Crea botón móvil .mobile-menu-btn
   - Carga operadores en q_operador, f_operador, filterOperador
   - Mueve badge SUPABASE al menú superior
========================================================= */

(function(){
  const AUTH_KEY = "comanda_operador_actual";

  const links = [
    { page:"index.html", label:"▣ Pedidos", permission:"puede_pedidos" },
    { page:"clientes.html", label:"♟ Clientes", permission:"puede_clientes" },
    { page:"materiales.html", label:"$ Materiales", permission:"puede_materiales" },
    { page:"estadisticas.html", label:"▥ Estadísticas", permission:"puede_estadisticas" },
    { page:"marketing.html", label:"◄ Marketing", permission:"puede_marketing" },
    { page:"Cotizador.html", label:"▣ Cotizador", permission:"puede_cotizador" },
    { page:"Organizador de ideas.html", label:"💡 Organizador", permission:"puede_organizador" },
    { page:"configuracion.html", label:"⚙ Configuración", permission:"puede_configuracion" }
  ];

  function getOp(){
    try{
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    }catch(e){
      return null;
    }
  }

  function isRoberto(op){
    return String(op && op.nombre || "").trim().toLowerCase() === "roberto";
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
    return String(a || "").toLowerCase() === String(b || "").toLowerCase();
  }

  function logout(){
    localStorage.removeItem("comanda_operador_actual");
    location.href = "login.html?logout=1";
  }

  function crearStoragePill(){
    const pill = document.createElement("div");
    pill.className = "storage-pill";
    pill.id = "storageBadgeHeader";
    pill.innerHTML = '<div class="storage-dot"></div><span id="storageBadgeTextHeader">SUPABASE</span>';
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

    if(visibles === 0){
      console.warn("Operador sin permisos visibles:", op);
    }

    if(!hasPermission(op, "puede_pedidos") && samePage(pageNow, "index.html")){
      location.href = firstAllowed(op);
    }
  }

  function setupMobileMenu(){
    const header = document.querySelector(".header");
    const menu = document.getElementById("authMenu");

    if(!header || !menu) return;

    if(!document.getElementById("mobileMenuBtn")){
      const btn = document.createElement("button");
      btn.id = "mobileMenuBtn";
      btn.className = "mobile-menu-btn";
      btn.type = "button";
      btn.textContent = "☰ Menú";

      btn.onclick = function(){
        menu.classList.toggle("open");

        if(typeof window.updateStickyOffsets === "function"){
          window.updateStickyOffsets();
        }
      };

      const noti = header.querySelector(".noti-btn");
      if(noti) header.insertBefore(btn, noti);
      else header.insertBefore(btn, menu);
    }
  }

  function syncStorageBadge(){
    const desktopText = document.getElementById("storageBadgeText");
    const headerText = document.getElementById("storageBadgeTextHeader");
    const desktopBadge = document.getElementById("storageBadge");
    const headerBadge = document.getElementById("storageBadgeHeader");

    if(headerText){
      headerText.textContent = window.supabaseClient ? "SUPABASE" : (desktopText?.textContent || "LOCAL");
    }

    if(headerBadge){
      if(window.supabaseClient || desktopBadge?.classList.contains("ok")) headerBadge.classList.add("ok");
      else headerBadge.classList.remove("ok");
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
    document.documentElement.style.setProperty("--sticky-head-top", `0px`);
    document.documentElement.style.setProperty("--sticky-quick-top", `0px`);
  }

  window.logout = window.logout || logout;
  window.cargarOperadoresEnComanda = cargarOperadoresEnComanda;
  window.updateStickyOffsets = window.updateStickyOffsets || updateStickyOffsets;
  window.marcarSupabaseSiListo = window.marcarSupabaseSiListo || marcarSupabaseSiListo;

  document.addEventListener("DOMContentLoaded", function(){
    marcarSupabaseSiListo();
    setupMobileMenu();
    renderMenu();
    updateStickyOffsets();
    cargarOperadoresEnComanda();
    syncStorageBadge();

    window.addEventListener("resize", updateStickyOffsets);
    setInterval(syncStorageBadge, 600);

    setTimeout(function(){
      marcarSupabaseSiListo();
      setupMobileMenu();
      renderMenu();
      updateStickyOffsets();
      cargarOperadoresEnComanda();
      syncStorageBadge();
    }, 700);
  });
})();
