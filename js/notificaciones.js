/* =========================================================
   NOTIFICACIONES v27 Â· CACHE FIX
   - index carga js/app.js?v=27 y css/menu.css?v=27
   - evita que el navegador use el app.js viejo con otra campana

   NOTIFICACIONES v26 Â· lÃ³gica estable por estado real
   Regla corregida:
   - RubÃ©n ve solicitudes ACTIVAS leyendo la tabla pedidos.
     Si estÃ¡ en Solicitud = cuenta.
     Si pasa a Listo = deja de contar.
   - Los operadores ven pedidos Listos leyendo la tabla notificaciones.
   - Ya no se usa "solicitud_ruben" persistente para contar.
   - Sin parpadeo: el contador se calcula por estado real.
========================================================= */
(function(){
  const CHECK_MS = 6000;

  let timer = null;
  let leyendo = false;
  let audioCtx = null;
  let audioHabilitado = false;

  let solicitudesRuben = [];
  let notificacionesListo = [];
  let itemsActuales = [];
  let ultimoIds = new Set();
  let primeraLecturaOk = false;

  function db(){
    return window.supabaseClient || null;
  }

  function normalizar(v){
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function primerNombre(v){
    return normalizar(v).split(" ")[0] || "";
  }

  function nombreOperador(v){
    if(!v) return "";
    if(typeof v === "string") return v;
    return v.nombre || v.operador || v.name || v.usuario || v.user || "";
  }

  function getOperador(){
    if(typeof window.getSesionOperador === "function"){
      const op = window.getSesionOperador();
      if(op && nombreOperador(op)) return nombreOperador(op);
    }

    const keys = [
      "comanda_operador_actual",
      "operador_actual",
      "operadorActual",
      "tutto_operador",
      "usuario_actual",
      "user"
    ];

    for(const key of keys){
      const raw = localStorage.getItem(key);
      if(!raw) continue;

      try{
        const parsed = JSON.parse(raw);
        const nombre = nombreOperador(parsed);
        if(nombre) return nombre;
      }catch(e){
        if(String(raw).trim()) return raw;
      }
    }

    return "";
  }

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function esRuben(nombre){
    const n = normalizar(nombre);
    return n === "ruben" || n === "rubÃ©n" || n.includes("ruben") || n.includes("rubÃ©n");
  }

  function perteneceAlOperador(noti, operadorActual){
    const op = normalizar(operadorActual);
    const op1 = primerNombre(operadorActual);

    const para = normalizar(noti.para_operador || "");
    const dest = normalizar(noti.destinatario || "");
    const para1 = primerNombre(noti.para_operador || "");
    const dest1 = primerNombre(noti.destinatario || "");

    if(!op) return false;

    return (
      para === op ||
      dest === op ||
      (op1 && para1 && op1 === para1) ||
      (op1 && dest1 && op1 === dest1)
    );
  }

  function habilitarAudio(){
    if(audioHabilitado) return;

    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if(audioCtx.state === "suspended") audioCtx.resume();
      audioHabilitado = true;
    }catch(e){
      console.warn("Audio bloqueado:", e);
    }
  }

  function sonarCampana(){
    try{
      habilitarAudio();
      if(!audioCtx) return;

      const now = audioCtx.currentTime;
      const gain = audioCtx.createGain();

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      gain.connect(audioCtx.destination);

      [
        { f:1046, t:0.00, d:0.12 },
        { f:1318, t:0.16, d:0.13 },
        { f:1568, t:0.33, d:0.18 }
      ].forEach(tn => {
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(tn.f, now + tn.t);
        osc.connect(gain);
        osc.start(now + tn.t);
        osc.stop(now + tn.t + tn.d);
      });
    }catch(e){
      console.warn("No sonÃ³ campana:", e);
    }
  }

  function toast(msg){
    const t = document.getElementById("toast");
    if(!t){
      console.log(msg);
      return;
    }

    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 2600);
  }

  function asegurarCampana(){
    let btn = document.getElementById("notiBtnGlobal");

    if(!btn){
      const header = document.querySelector(".header");
      if(!header) return;

      btn = document.createElement("button");
      btn.className = "noti-btn";
      btn.id = "notiBtnGlobal";
      btn.type = "button";
      btn.innerHTML = 'ðŸ”” <span class="noti-count empty" id="notiCount">0</span>';

      const nav = document.getElementById("authMenu");
      if(nav) header.insertBefore(btn, nav);
      else header.appendChild(btn);
    }

    btn.onclick = abrirNotificaciones;
    btn.style.setProperty("display", "inline-flex", "important");
    btn.style.setProperty("visibility", "visible", "important");
    btn.style.setProperty("opacity", "1", "important");
  }

  function pintarContador(total){
    asegurarCampana();

    const count = document.getElementById("notiCount");
    if(!count) return;

    count.textContent = total;

    if(total > 0){
      count.classList.remove("empty");
    }else{
      count.classList.add("empty");
    }
  }

  function recalcularItems(){
    itemsActuales = [
      ...solicitudesRuben.map(p => ({
        id:`solicitud_${p.id}`,
        tipo:"solicitud",
        pedido_id:p.id,
        titulo:"Nueva solicitud",
        mensaje:`${p.cliente || "Sin cliente"} Â· ${p.descripcion || "Sin descripciÃ³n"}`,
        meta:`Pedido #${p.id} Â· Creado por ${p.operador || "sin operador"}`
      })),
      ...notificacionesListo.map(n => ({
        id:`noti_${n.id}`,
        notificacion_id:n.id,
        tipo:"pedido_listo",
        pedido_id:n.pedido_id,
        titulo:n.titulo || "Pedido listo",
        mensaje:n.mensaje || "",
        meta:`Pedido #${n.pedido_id || ""} Â· Para: ${n.para_operador || n.destinatario || ""}`
      }))
    ];
  }

  function actualizarContador(sonar){
    recalcularItems();

    const total = itemsActuales.length;
    pintarContador(total);

    const idsActuales = new Set(itemsActuales.map(x => String(x.id)));
    let hayNueva = false;

    idsActuales.forEach(id => {
      if(!ultimoIds.has(id)) hayNueva = true;
    });

    if(sonar && primeraLecturaOk && hayNueva && total > 0){
      sonarCampana();
      toast("ðŸ”” Nueva notificaciÃ³n");
    }

    ultimoIds = idsActuales;
    primeraLecturaOk = true;
  }

  async function leerSolicitudesRuben(operador){
    if(!esRuben(operador)) return [];

    const { data, error } = await db()
      .from("pedidos")
      .select("id, fecha, operador, cliente, descripcion, estatus_trabajo")
      .eq("estatus_trabajo", "Solicitud")
      .order("id", { ascending:false })
      .limit(100);

    if(error){
      console.error("Error leyendo solicitudes para RubÃ©n:", error);
      return solicitudesRuben;
    }

    return data || [];
  }

  async function leerListosOperador(operador){
    const { data, error } = await db()
      .from("notificaciones")
      .select("id, pedido_id, tipo, para_operador, destinatario, titulo, mensaje, leida, created_at")
      .eq("leida", false)
      .eq("tipo", "pedido_listo")
      .order("created_at", { ascending:false })
      .limit(100);

    if(error){
      console.error("Error leyendo pedidos listos:", error);
      return notificacionesListo;
    }

    return (data || []).filter(n => perteneceAlOperador(n, operador));
  }

  async function leerNotificaciones(sonar = false){
    asegurarCampana();

    if(leyendo){
      return itemsActuales;
    }

    const operador = getOperador();

    if(!operador){
      console.warn("Notificaciones: operador no detectado. Mantengo contador actual.");
      pintarContador(itemsActuales.length);
      return itemsActuales;
    }

    if(!db()){
      console.warn("Notificaciones: Supabase no disponible. Mantengo contador actual.");
      pintarContador(itemsActuales.length);
      return itemsActuales;
    }

    leyendo = true;

    try{
      const [solicitudes, listos] = await Promise.all([
        leerSolicitudesRuben(operador),
        leerListosOperador(operador)
      ]);

      solicitudesRuben = solicitudes;
      notificacionesListo = listos;

      actualizarContador(sonar);
      return itemsActuales;
    }finally{
      leyendo = false;
    }
  }

  function renderNotificaciones(){
    const box = document.getElementById("notiList");
    if(!box) return;

    recalcularItems();

    if(!itemsActuales.length){
      box.innerHTML = `
        <div class="empty">Sin notificaciones pendientes</div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-add noti-read-all-btn" type="button" onclick="marcarTodasNotificacionesLeidas()">Marcar todos leÃ­dos</button>
          <button class="btn-add secondary" type="button" onclick="debugNotificaciones()">Debug</button>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-add noti-read-all-btn" type="button" onclick="marcarTodasNotificacionesLeidas()">Marcar todos leÃ­dos</button>
        <button class="btn-add secondary" type="button" onclick="debugNotificaciones()">Debug</button>
      </div>
      ${itemsActuales.map(n => `
        <div class="noti-item">
          <div class="noti-item-title">ðŸ”” ${esc(n.titulo || "NotificaciÃ³n")}</div>
          <div class="noti-item-msg">${esc(n.mensaje || "")}</div>
          <div class="noti-item-meta">${esc(n.meta || "")}</div>
          <div class="noti-actions">
            ${n.tipo === "pedido_listo"
              ? `<button class="noti-seen-btn" type="button" onclick="marcarNotificacionLeida(${Number(n.notificacion_id)})">Marcar como visto</button>`
              : `<span class="noti-status-chip">Activa mientras el pedido estÃ© en Solicitud</span>`
            }
          </div>
        </div>
      `).join("")}
    `;
  }

  window.abrirNotificaciones = async function(){
    habilitarAudio();
    await leerNotificaciones(false);
    renderNotificaciones();

    const bd = document.getElementById("notiBackdrop");
    if(bd) bd.style.display = "flex";
  };

  window.marcarNotificacionLeida = async function(id){
    if(!db()) return;

    const { error } = await db()
      .from("notificaciones")
      .update({ leida:true })
      .eq("id", id);

    if(error){
      console.error(error);
      toast("No se pudo marcar visto");
      return;
    }

    notificacionesListo = notificacionesListo.filter(n => Number(n.id) !== Number(id));
    actualizarContador(false);
    renderNotificaciones();
  };

  window.marcarTodasNotificacionesLeidas = async function(){
    if(!db()) return;

    const ids = notificacionesListo.map(n => n.id);

    if(!ids.length){
      toast("No hay pedidos listos pendientes por marcar");
      return;
    }

    const { error } = await db()
      .from("notificaciones")
      .update({ leida:true })
      .in("id", ids);

    if(error){
      console.error(error);
      toast("No se pudieron marcar todas");
      return;
    }

    notificacionesListo = [];
    actualizarContador(false);
    renderNotificaciones();
    toast("Pedidos listos marcados como vistos");
  };

  window.debugNotificaciones = async function(){
    const operador = getOperador();

    await leerNotificaciones(false);

    console.log("OPERADOR:", operador);
    console.log("SOLICITUDES RUBEN:", solicitudesRuben);
    console.log("LISTOS OPERADOR:", notificacionesListo);
    console.log("ITEMS ACTUALES:", itemsActuales);

    alert(
      "Operador: " + (operador || "NO DETECTADO") +
      "\
Solicitudes activas RubÃ©n: " + solicitudesRuben.length +
      "\
Pedidos listos para este operador: " + notificacionesListo.length +
      "\
Total campana: " + itemsActuales.length
    );
  };

  function iniciar(){
    asegurarCampana();
    pintarContador(0);

    document.addEventListener("click", habilitarAudio, { once:true });
    document.addEventListener("touchstart", habilitarAudio, { once:true });

    setTimeout(() => leerNotificaciones(false), 1200);

    if(timer) clearInterval(timer);

    timer = setInterval(() => {
      leerNotificaciones(true);
    }, CHECK_MS);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", iniciar);
  }else{
    iniciar();
  }
})();
