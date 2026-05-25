console.log("NOTIFICACIONES conectado v35 robusto visto/leida");

/* =========================================================
   NOTIFICACIONES · TUTTOVINILOS v34
   Sistema único de campana:
   - Lee SOLO la tabla public.notificaciones.
   - Solicitud -> notificación persistente para Ruben.
   - Listo -> notificación persistente para operador creador.
   - La notificación solo desaparece si leida = true y visto = true.
   - Sonido cuando llega una nueva.
   - Realtime + respaldo cada 30s.
========================================================= */

(function(){
  let leyendo = false;
  let audioCtx = null;
  let audioHabilitado = false;
  let notificaciones = [];
  let ultimoIds = new Set();
  let primeraLecturaOk = false;

  function db(){
    return window.supabaseClient || null;
  }

  function normalizar(v){
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g," ")
      .replace(/\s+/g," ")
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

  function getSesionOperadorLocal(){
    try{
      if(typeof window.getSesionOperador === "function"){
        const op = window.getSesionOperador();
        if(op) return op;
      }
      return JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
    }catch(e){
      return null;
    }
  }

  function getOperador(){
    const opSesion = getSesionOperadorLocal();
    if(opSesion && nombreOperador(opSesion)) return nombreOperador(opSesion);

    const keys = [
      "comanda_operador_actual",
      "operador_actual",
      "operadorActual",
      "tutto_operador",
      "usuario_actual",
      "user",
      "operador"
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

  function getOperadorId(){
    const op = getSesionOperadorLocal();
    const id = Number(op && op.id ? op.id : 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function perteneceAlOperador(noti, operadorActual){
    const operadorId = getOperadorId();

    if(operadorId){
      const destId = Number(noti.destinatario_id || 0);
      const paraId = Number(noti.para_operador_id || 0);
      if(destId === operadorId || paraId === operadorId) return true;
    }

    // Respaldo para notificaciones viejas que todavía no tengan ID.
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

  function toast(msg){
    const t = document.getElementById("toast");
    if(!t){
      console.log(msg);
      return;
    }

    t.textContent = msg;
    t.style.display = "block";

    setTimeout(() => {
      t.style.display = "none";
    }, 2600);
  }

  function habilitarAudio(){
    if(audioHabilitado && audioCtx) return true;

    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

      if(audioCtx.state === "suspended"){
        audioCtx.resume();
      }

      audioHabilitado = true;
      return true;
    }catch(e){
      console.warn("Audio bloqueado:", e);
      return false;
    }
  }

  function sonarCampana(){
    try{
      if(!habilitarAudio() || !audioCtx) return;

      const now = audioCtx.currentTime;

      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.9, now + 0.018);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
      master.connect(audioCtx.destination);

      [
        { f:880,  t:0.00, d:0.12 },
        { f:1175, t:0.14, d:0.13 },
        { f:1568, t:0.31, d:0.19 },
        { f:1175, t:0.55, d:0.14 }
      ].forEach(tn => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(tn.f, now + tn.t);

        gain.gain.setValueAtTime(0.0001, now + tn.t);
        gain.gain.exponentialRampToValueAtTime(1, now + tn.t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + tn.t + tn.d);

        osc.connect(gain);
        gain.connect(master);

        osc.start(now + tn.t);
        osc.stop(now + tn.t + tn.d + 0.05);
      });
    }catch(e){
      console.warn("No sonó campana:", e);
    }
  }

  function asegurarCampana(){
    let btn = document.getElementById("notiBtnGlobal") || document.querySelector(".noti-btn");

    if(!btn){
      const header = document.querySelector(".header");
      const menu = document.getElementById("authMenu");

      if(!header) return;

      btn = document.createElement("button");
      btn.className = "noti-btn";
      btn.id = "notiBtnGlobal";
      btn.type = "button";
      btn.innerHTML = '🔔 <span class="noti-count empty" id="notiCount">0</span>';

      if(menu) header.insertBefore(btn, menu);
      else header.appendChild(btn);
    }

    btn.id = "notiBtnGlobal";
    btn.type = "button";
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

  function tipoTitulo(n){
    if(n.tipo === "pedido_solicitud") return n.titulo || "Nueva solicitud";
    if(n.tipo === "pedido_listo") return n.titulo || "Pedido listo";
    return n.titulo || "Notificación";
  }

  function tipoMeta(n){
    if(n.tipo === "pedido_solicitud") return `Pedido #${n.pedido_id || ""} · Para Rubén`;
    if(n.tipo === "pedido_listo") return `Pedido #${n.pedido_id || ""} · Para ${n.para_operador || n.destinatario || ""}`;
    return `Pedido #${n.pedido_id || ""}`;
  }

  function actualizarContador(sonar){
    const total = notificaciones.length;

    pintarContador(total);

    const idsActuales = new Set(notificaciones.map(n => String(n.id)));
    let hayNueva = false;

    idsActuales.forEach(id => {
      if(!ultimoIds.has(id)) hayNueva = true;
    });

    if(sonar && primeraLecturaOk && hayNueva && total > 0){
      sonarCampana();
      toast("🔔 Nueva notificación");
    }

    ultimoIds = idsActuales;
    primeraLecturaOk = true;
  }

  async function leerNotificaciones(sonar = false){
    asegurarCampana();

    if(leyendo) return notificaciones;

    const operador = getOperador();

    if(!operador){
      console.warn("Notificaciones: operador no detectado");
      pintarContador(notificaciones.length);
      return notificaciones;
    }

    if(!db()){
      console.warn("Notificaciones: Supabase no disponible");
      pintarContador(notificaciones.length);
      return notificaciones;
    }

    leyendo = true;

    try{
      const { data, error } = await db()
        .from("notificaciones")
        .select("id, pedido_id, tipo, para_operador_id, destinatario_id, para_operador, destinatario, titulo, mensaje, leida, visto, created_at")
        .or("leida.eq.false,visto.eq.false")
        .order("created_at", { ascending:false })
        .limit(200);

      if(error){
        console.error("Error leyendo notificaciones:", error);
        toast("Error leyendo notificaciones");
        return notificaciones;
      }

      notificaciones = (data || []).filter(n => perteneceAlOperador(n, operador));
      actualizarContador(sonar);

      return notificaciones;
    }finally{
      leyendo = false;
    }
  }

  window.leerNotificaciones = leerNotificaciones;

  function renderNotificaciones(){
    const box = document.getElementById("notiList");
    if(!box) return;

    if(!notificaciones.length){
      box.innerHTML = `
        <div class="empty">Sin notificaciones pendientes</div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-add secondary" type="button" onclick="activarSonidoNotificaciones()">Activar sonido</button>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-add noti-read-all-btn" type="button" onclick="marcarTodasNotificacionesLeidas()">Marcar todas como vistas</button>
        <button class="btn-add secondary" type="button" onclick="activarSonidoNotificaciones()">Activar sonido</button>
      </div>
      ${notificaciones.map(n => `
        <div class="noti-item">
          <div class="noti-item-title">🔔 ${esc(tipoTitulo(n))}</div>
          <div class="noti-item-msg">${esc(n.mensaje || "")}</div>
          <div class="noti-item-meta">${esc(tipoMeta(n))}</div>
          <div class="noti-actions">
            <button class="noti-seen-btn" type="button" onclick="marcarNotificacionLeida(${Number(n.id)})">
              Marcar como visto
            </button>
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

  window.activarSonidoNotificaciones = function(){
    habilitarAudio();
    sonarCampana();
    toast("Sonido de campana activado");
  };

  window.marcarNotificacionLeida = async function(id){
    if(!db()) return;

    const { error } = await db()
      .from("notificaciones")
      .update({ leida:true, visto:true })
      .eq("id", id);

    if(error){
      console.error(error);
      toast("No se pudo marcar visto");
      return;
    }

    notificaciones = notificaciones.filter(n => Number(n.id) !== Number(id));
    actualizarContador(false);
    renderNotificaciones();
    toast("Notificación marcada como vista");
  };

  window.marcarTodasNotificacionesLeidas = async function(){
    if(!db()) return;

    const ids = notificaciones.map(n => n.id);

    if(!ids.length){
      toast("No hay notificaciones pendientes");
      return;
    }

    const { error } = await db()
      .from("notificaciones")
      .update({ leida:true, visto:true })
      .in("id", ids);

    if(error){
      console.error(error);
      toast("No se pudieron marcar todas");
      return;
    }

    notificaciones = [];
    actualizarContador(false);
    renderNotificaciones();
    toast("Notificaciones marcadas como vistas");
  };

  window.debugNotificaciones = async function(){
    const operador = getOperador();
    await leerNotificaciones(false);

    console.log("OPERADOR:", operador);
    console.log("NOTIFICACIONES:", notificaciones);

    alert(
      "Operador: " + (operador || "NO DETECTADO") +
      "\nNotificaciones pendientes: " + notificaciones.length
    );
  };

  function refrescarPorRealtime(origen){
    console.log("Realtime notificación:", origen);

    const ahora = Date.now();
    const suprimirPedidosHasta = Number(window.__COMANDA_SUPRIMIR_REFRESH_PEDIDOS_HASTA || 0);
    const debeSuprimirRefreshPedidos = ahora < suprimirPedidosHasta;

    /*
      FIX v33:
      Si esta misma pestaña acaba de cambiar status/pago/cantidad,
      NO repintamos toda la tabla al recibir el eco de Realtime.
      Eso elimina el flash visual.
      En otras pantallas este flag no existe, por eso sí se actualizan.
    */
    if(!debeSuprimirRefreshPedidos && typeof window.cargarPedidos === "function"){
      try{
        window.cargarPedidos(false);
      }catch(e){
        console.warn("No se pudo refrescar pedidos:", e);
      }
    }

    leerNotificaciones(true);
  }

  function iniciarRealtime(){
    if(!db()){
      console.warn("Realtime: Supabase todavía no disponible");
      return;
    }

    try{
      if(window.__COMANDA_REALTIME_CHANNEL__){
        db().removeChannel(window.__COMANDA_REALTIME_CHANNEL__);
        window.__COMANDA_REALTIME_CHANNEL__ = null;
      }
    }catch(e){
      console.warn("No se pudo remover canal anterior:", e);
    }

    const canal = db()
      .channel("comanda_realtime_notificaciones_v34")
      .on("postgres_changes", { event:"*", schema:"public", table:"pedidos" }, payload => {
        refrescarPorRealtime({ tabla:"pedidos", evento:payload.eventType, id:payload.new?.id || payload.old?.id });
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"notificaciones" }, payload => {
        refrescarPorRealtime({ tabla:"notificaciones", evento:payload.eventType, id:payload.new?.id || payload.old?.id });
      })
      .subscribe(status => {
        console.log("Realtime notificaciones status:", status);
        const badge = document.getElementById("storageBadgeTextHeader") || document.getElementById("storageBadgeText");
        if(badge && status === "SUBSCRIBED"){
          badge.textContent = "SUPABASE";
        }
      });

    window.__COMANDA_REALTIME_CHANNEL__ = canal;
  }

  function iniciar(){
    asegurarCampana();
    pintarContador(0);

    document.addEventListener("click", habilitarAudio, { once:true });
    document.addEventListener("touchstart", habilitarAudio, { once:true });

    setTimeout(() => leerNotificaciones(false), 900);
    setTimeout(() => iniciarRealtime(), 1400);

    if(window.__COMANDA_NOTI_BACKUP_TIMER__){
      clearInterval(window.__COMANDA_NOTI_BACKUP_TIMER__);
    }

    window.__COMANDA_NOTI_BACKUP_TIMER__ = setInterval(() => {
      leerNotificaciones(false);
    }, 30000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", iniciar);
  }else{
    iniciar();
  }
})();


