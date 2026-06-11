console.log("COTIZADOR JS conectado v54 propuesta económica + imágenes ordenadas");

const $ = (id) => document.getElementById(id);

let clientesDB = [];
let cotizacionesDB = [];
let cotizacionSeleccionada = null;

const TUTTO_LOGO_SRC = "img/logo-tutto.svg?v=10";
let tuttoLogoPngPromise = null;

let previewPdfUrl = null;
let previewPdfBlob = null;
let previewPdfDoc = null;
let previewSnapshot = null;

let undoStack = [];
let restaurandoDeshacer = false;
const UNDO_MAX = 4;

let data = {
  tipo: "Cotización",
  responsable: "Ricardo",
  items: [{ kind: "item", desc: "", qty: 1, price: 0 }]
};


/* =========================================================
   PATCH v34 · compatibilidad clientes/cotizaciones
========================================================= */
function pickClienteField(c, campo){
  if(!c) return "";
  if(campo === "rif") return c.rif_cedula || c.rif || c.cedula_rif || c.identificacion || "";
  if(campo === "correo") return c.correo || c.email || "";
  if(campo === "direccion") return c.direccion || c.address || "";
  return c[campo] || "";
}

function buildClientePayload(form, existente=null, incluirActivo=true){
  const base = {
    nombre:nombreBonito(form.cliente),
    tipo_cliente: existente?.tipo_cliente || "Cliente Básico",
    telefono: form.telefono || "",
    correo: form.email || "",
    notas: existente?.notas || ""
  };

  // Estas columnas pueden existir o no. Se prueban con fallback.
  base.rif_cedula = form.rif || "";
  base.direccion = form.direccion || "";

  if(incluirActivo) base.activo = true;

  return base;
}

function limpiarPayloadClienteParaFallback(payload, errorMsg){
  const p = {...payload};
  const msg = String(errorMsg || "").toLowerCase();

  if(msg.includes("activo") || msg.includes("schema cache")) delete p.activo;
  if(msg.includes("rif_cedula") || msg.includes("schema cache")) delete p.rif_cedula;
  if(msg.includes("direccion") || msg.includes("schema cache")) delete p.direccion;
  if(msg.includes("notas") || msg.includes("schema cache")) delete p.notas;

  return p;
}

async function ejecutarClienteConFallback(queryFactory, payload){
  let res = await queryFactory(payload);

  if(res.error){
    const fallback = limpiarPayloadClienteParaFallback(payload, res.error.message || "");
    const cambio = JSON.stringify(fallback) !== JSON.stringify(payload);

    if(cambio){
      res = await queryFactory(fallback);
    }
  }

  return res;
}

function estadoTextoCotizacion(c){
  if(c?.errada === true) return "Errada";
  return c?.aprobado === true ? "Aprobada" : "Pendiente";
}


function db(){ return window.supabaseClient; }

function validarSupabase(){
  if(!db()){
    showToast("No existe conexión Supabase. Revisa js/supabase.js", "err");
    console.error("No existe window.supabaseClient");
    return false;
  }
  return true;
}

function pad2(n){ return String(n).padStart(2, "0"); }

function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function formatoFechaNumero(fechaISO){
  const [y,m,d] = String(fechaISO || todayISO()).split("-");
  return `${d}-${m}-${y}`;
}

function crearNumeroDocumento(consecutivo, fechaISO){
  return `${pad2(consecutivo)}-${formatoFechaNumero(fechaISO)}`;
}

function currency(n){ return "$" + Number(n || 0).toFixed(2); }

function currencyDocumento(n,tipoDocumento=""){
  if(esFacturaTipo(tipoDocumento)){
    return "BS " + moneyFactura(n,2);
  }

  return currency(n);
}

function cleanText(v){ return String(v || "").trim(); }

function normalizar(valor){
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function nombreBonito(valor){
  const limpio = String(valor || "").trim().replace(/\s+/g, " ");
  if(!limpio) return "";
  return limpio.split(" ").map(p => p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : "").join(" ");
}

function html(v){
  return String(v ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function operadorSesionActual(){
  try{
    if(typeof window.getSesionOperador === "function"){
      const op = window.getSesionOperador();
      if(op && op.nombre) return op;
    }
  }catch(e){}

  try{
    return JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
  }catch(e){
    return null;
  }
}

function esRoberto(){
  const op = operadorSesionActual();
  return normalizar(op?.nombre || "") === "roberto";
}

function setResponsableDesdeSesion(){
  const op = operadorSesionActual();
  const nombre = op?.nombre || "";
  if(!nombre) return;

  const select = $("responsable");
  if(!select) return;

  const existe = [...select.options].some(o => normalizar(o.value) === normalizar(nombre));

  if(!existe){
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = "👤 " + nombre;
    select.appendChild(opt);
  }

  const option = [...select.options].find(o => normalizar(o.value) === normalizar(nombre));
  select.value = option?.value || nombre;
  data.responsable = select.value;

  bloquearResponsableSiNoEsRoberto();
}

function bloquearResponsableSiNoEsRoberto(){
  const select = $("responsable");
  if(!select) return;

  if(esRoberto()){
    select.disabled = false;
    select.classList.remove("operator-locked");
  }else{
    select.disabled = true;
    select.classList.add("operator-locked");
  }
}

function aplicarMenuDesplegable(){
  // El menú móvil/global lo maneja js/menu.js.
  // Se deja esta función para no romper iniciarCotizador().
}


function showToast(msg, type="ok"){
  const t = $("toast");

  if(!t){
    alert(msg);
    return;
  }

  t.textContent = msg;
  t.className = "toast " + type + " show";

  setTimeout(() => {
    t.className = "toast";
  }, 3600);
}

async function obtenerSiguienteNumeroDocumento(fechaISO){
  if(!validarSupabase()) return crearNumeroDocumento(1, fechaISO);

  const sufijo = formatoFechaNumero(fechaISO);

  const { data: rows, error } = await db()
    .from("cotizaciones")
    .select("numero")
    .eq("fecha", fechaISO);

  if(error){
    console.warn("No se pudo calcular consecutivo:", error);
    return crearNumeroDocumento(1, fechaISO);
  }

  let max = 0;

  (rows || []).forEach(r => {
    const numero = String(r.numero || "");
    if(!numero.endsWith(sufijo)) return;

    const primero = Number(numero.split("-")[0]);
    if(Number.isFinite(primero)) max = Math.max(max, primero);
  });

  return crearNumeroDocumento(max + 1, fechaISO);
}

async function numeroExiste(numero){
  const { data: rows, error } = await db()
    .from("cotizaciones")
    .select("id")
    .eq("numero", numero)
    .limit(1);

  if(error) throw error;

  return (rows || []).length > 0;
}

async function asegurarNumeroDisponible(){
  const form = getForm();

  if(esFacturaTipo(form.tipo)){
    return;
  }

  if(!form.numero || await numeroExiste(form.numero)){
    $("numero").value = await obtenerSiguienteNumeroDocumento(form.fecha || todayISO());
  }
}

async function initDates(){
  const now = new Date();
  const fecha = todayISO();
  const tipo = $("tipoDocumento")?.value || data.tipo;

  $("fecha").value = fecha;

  const due = new Date(now);
  due.setDate(due.getDate() + 5);

  $("vence").value = `${due.getFullYear()}-${pad2(due.getMonth()+1)}-${pad2(due.getDate())}`;

  aplicarModoNumeroDocumento(tipo, esFacturaTipo(tipo));

  if(esFacturaTipo(tipo)){
    $("numero").value = "";
  }else{
    $("numero").value = await obtenerSiguienteNumeroDocumento(fecha);
  }
}

async function refrescarNumeroPorFecha(){
  const tipo = $("tipoDocumento")?.value || data.tipo;

  aplicarModoNumeroDocumento(tipo, false);

  if(esFacturaTipo(tipo)) return;

  $("numero").value = await obtenerSiguienteNumeroDocumento($("fecha").value || todayISO());
}

function itemTotal(item){
  return Number(item.qty || 0) * Number(item.price || 0);
}

function esFacturaTipo(tipo){
  return normalizar(tipo || "") === "factura";
}

function esPropuestaEconomicaTipo(tipo){
  return normalizar(tipo || "") === "propuesta economica";
}

const PROPUESTA_ECONOMICA_INTRO = [
  "El presente archivo tiene como finalidad poder presentarles una propuesta económica que sirva como base para que ambas partes puedan mantener sus operaciones comerciales sin afectar la calidad que muy bien nos definen.",
  "Es por ello, que vamos a tomar como ejemplo este tipo de etiqueta, ya que tenemos el vector y medidas."
];

function getIvaRate(tipo){
  return 0.16;
}

function getIvaLabel(tipo){
  return "IVA 16%";
}


function aplicarModoNumeroDocumento(tipo, limpiarSiFactura=false){
  const input = $("numero");
  if(!input) return;

  if(esFacturaTipo(tipo)){
    input.readOnly = false;
    input.placeholder = "Coloca el N° de factura";
    input.classList.add("manual-number");

    if(limpiarSiFactura){
      input.value = "";
    }
  }else{
    input.readOnly = true;
    input.placeholder = "Automático";
    input.classList.remove("manual-number");
  }
}

function actualizarEtiquetaIva(tipo){
  const label = getIvaLabel(tipo || $("tipoDocumento")?.value || data.tipo);

  const check = $("ivaTextoCheck");
  if(check) check.textContent = `Aplicar ${label}`;

  const resumen = $("ivaResumenLabel");
  if(resumen) resumen.textContent = label;
}

function calcularTotales(items=data.items, ivaAplicado=$("ivaCheck")?.checked, tipoDocumento=$("tipoDocumento")?.value || data.tipo){
  const subtotal = (items || []).reduce((acc,it) => {
    return acc + (it.kind === "item" ? itemTotal(it) : 0);
  }, 0);

  const iva = ivaAplicado ? subtotal * getIvaRate(tipoDocumento) : 0;

  return {
    subtotal,
    iva,
    total: subtotal + iva
  };
}

function updateTotals(){
  const tipo = $("tipoDocumento")?.value || data.tipo;
  const t = calcularTotales(data.items, $("ivaCheck")?.checked, tipo);

  actualizarEtiquetaIva(tipo);

  const formato = esFacturaTipo(tipo) ? (n => "BS " + moneyFactura(n,2)) : currency;

  $("subtotal").textContent = formato(t.subtotal);
  $("iva").textContent = formato(t.iva);
  $("total").textContent = formato(t.total);
}

function updateItemVisualTotal(index){
  const item = data.items[index];
  if(!item) return;

  const total = itemTotal(item);

  document.querySelectorAll(`[data-total-index="${index}"]`).forEach(el => {
    if(el.tagName === "INPUT"){
      el.value = total.toFixed(2);
    }else{
      el.textContent = currency(total);
    }
  });
}

function addItem(){
  guardarEstadoDeshacer();
  data.items.push({ kind:"item", desc:"", qty:1, price:0 });
  render();
}

function addSeparator(){
  guardarEstadoDeshacer();
  data.items.push({ kind:"separator", desc:"" });
  render();
}

function procesarImagenCotizador(file,maxPx=300){
  return new Promise((resolve,reject) => {
    if(!file || !String(file.type || "").startsWith("image/")){
      reject(new Error("Selecciona un archivo de imagen válido."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const escala = Math.min(1, maxPx / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || maxPx) * escala));
        const h = Math.max(1, Math.round((img.height || maxPx) * escala));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0,w,h);

        const mime = String(file.type || "").includes("png") ? "image/png" : "image/jpeg";
        const src = canvas.toDataURL(mime,0.86);

        resolve({ src, width:w, height:h, mime });
      };

      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    reader.readAsDataURL(file);
  });
}

function addImageItem(){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if(!file) return;

    try{
      guardarEstadoDeshacer();
      const img = await procesarImagenCotizador(file,300);

      data.items.push({
        kind:"image",
        desc:"",
        name:file.name || "imagen",
        src:img.src,
        width:img.width,
        height:img.height,
        mime:img.mime
      });

      render();
      showToast("Imagen añadida", "ok");
    }catch(error){
      console.error(error);
      showToast(error.message || "No se pudo añadir la imagen", "err");
    }
  });

  input.click();
}

async function cambiarImagenItem(index,file){
  if(!data.items[index] || data.items[index].kind !== "image" || !file) return;

  try{
    guardarEstadoDeshacer();
    const img = await procesarImagenCotizador(file,300);

    data.items[index] = {
      ...data.items[index],
      name:file.name || data.items[index].name || "imagen",
      src:img.src,
      width:img.width,
      height:img.height,
      mime:img.mime
    };

    render();
    showToast("Imagen actualizada", "ok");
  }catch(error){
    console.error(error);
    showToast(error.message || "No se pudo cambiar la imagen", "err");
  }
}

function removeItem(index){
  guardarEstadoDeshacer();
  if(data.items.length <= 1){
    data.items = [{ kind:"item", desc:"", qty:1, price:0 }];
  }else{
    data.items.splice(index, 1);
  }

  render();
}

function getFooter(){
  return {
    direccion: cleanText($("footerDireccion")?.innerText || ""),
    contacto: cleanText($("footerContacto")?.innerText || ""),
    preparado_texto: cleanText($("footerPreparadoTexto")?.innerText || "Documento preparado por:")
  };
}

function getForm(){
  return {
    tipo: $("tipoDocumento").value,
    responsable: $("responsable").value,
    fecha: $("fecha").value,
    numero: cleanText($("numero").value),
    vence: $("vence").value,
    cliente: nombreBonito($("cliente").value),
    rif: cleanText($("rif").value),
    telefono: cleanText($("telefono").value),
    email: cleanText($("email").value),
    direccion: cleanText($("direccion").value),
    notas: cleanText($("notas").value),
    iva: $("ivaCheck").checked,
    footer: getFooter()
  };
}

function crearEstadoActualDeshacer(){
  return {
    form:{
      tipo: $("tipoDocumento")?.value || data.tipo || "Cotización",
      responsable: $("responsable")?.value || data.responsable || "",
      fecha: $("fecha")?.value || "",
      numero: $("numero")?.value || "",
      vence: $("vence")?.value || "",
      cliente: $("cliente")?.value || "",
      rif: $("rif")?.value || "",
      telefono: $("telefono")?.value || "",
      email: $("email")?.value || "",
      direccion: $("direccion")?.value || "",
      notas: $("notas")?.value || "",
      iva: !!$("ivaCheck")?.checked,
      footer:getFooter()
    },
    items:JSON.parse(JSON.stringify(data.items || []))
  };
}

function estadoDeshacerKey(estado){
  return JSON.stringify(estado || {});
}

function actualizarBotonDeshacer(){
  const btn = $("undoBtn");
  if(!btn) return;

  btn.disabled = undoStack.length === 0;
  btn.title = undoStack.length ? `Deshacer (${undoStack.length})` : "Sin cambios para deshacer";
}

function guardarEstadoDeshacer(){
  if(restaurandoDeshacer) return;

  const estado = crearEstadoActualDeshacer();
  const key = estadoDeshacerKey(estado);
  const ultimo = undoStack.length ? estadoDeshacerKey(undoStack[undoStack.length - 1]) : "";

  if(key === ultimo) return;

  undoStack.push(estado);

  if(undoStack.length > UNDO_MAX){
    undoStack = undoStack.slice(undoStack.length - UNDO_MAX);
  }

  actualizarBotonDeshacer();
}

function setValueDeshacer(id,value){
  const el = $(id);
  if(!el) return;

  if(el.type === "checkbox"){
    el.checked = !!value;
  }else{
    el.value = value ?? "";
  }
}

function setTextDeshacer(id,value){
  const el = $(id);
  if(!el) return;
  el.innerText = value ?? "";
}

function deshacerUltimoCambio(){
  if(!undoStack.length){
    showToast("No hay cambios para deshacer", "warn");
    actualizarBotonDeshacer();
    return;
  }

  const estado = undoStack.pop();
  const f = estado.form || {};

  restaurandoDeshacer = true;

  setValueDeshacer("tipoDocumento",f.tipo);
  setValueDeshacer("responsable",f.responsable);
  setValueDeshacer("fecha",f.fecha);
  setValueDeshacer("numero",f.numero);
  setValueDeshacer("vence",f.vence);
  setValueDeshacer("cliente",f.cliente);
  setValueDeshacer("rif",f.rif);
  setValueDeshacer("telefono",f.telefono);
  setValueDeshacer("email",f.email);
  setValueDeshacer("direccion",f.direccion);
  setValueDeshacer("notas",f.notas);
  setValueDeshacer("ivaCheck",f.iva);

  setTextDeshacer("footerDireccion",f.footer?.direccion || "");
  setTextDeshacer("footerContacto",f.footer?.contacto || "");
  setTextDeshacer("footerPreparadoTexto",f.footer?.preparado_texto || "Documento preparado por:");

  data.tipo = f.tipo || "Cotización";
  data.responsable = f.responsable || "";
  data.items = JSON.parse(JSON.stringify(estado.items && estado.items.length ? estado.items : [{ kind:"item", desc:"", qty:1, price:0 }]));

  aplicarModoNumeroDocumento(data.tipo,false);
  actualizarEtiquetaIva(data.tipo);
  render();
  revisarClienteActual();

  restaurandoDeshacer = false;
  actualizarBotonDeshacer();
  showToast("Cambio deshecho", "ok");
}

function crearSnapshotActual(){
  const form = getForm();
  const items = JSON.parse(JSON.stringify(data.items || []));
  const totals = calcularTotales(items, form.iva, form.tipo);

  return {
    form,
    items,
    totals,
    footer: form.footer
  };
}

function render(){
  data.tipo = $("tipoDocumento").value;
  data.responsable = $("responsable").value;

  $("banner").textContent = data.tipo;
  $("creditName").textContent = data.responsable;
  actualizarEtiquetaIva(data.tipo);
  aplicarModoNumeroDocumento(data.tipo, false);

  const tbody = $("tbody");
  const mobile = $("mobileItems");

  tbody.innerHTML = "";
  mobile.innerHTML = "";

  let visibleNumber = 1;

  data.items.forEach((item,index) => {
    if(item.kind === "separator"){
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td class="num"></td>
          <td colspan="4">
            <input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc" style="text-align:center;font-weight:900;color:var(--azulOsc)">
          </td>
          <td class="center">
            <button class="btn btn-red" data-remove="${index}" type="button">✕</button>
          </td>
        </tr>
      `);

      mobile.insertAdjacentHTML("beforeend", `
        <div class="item-card">
          <div class="item-head">
            <span>Separador</span>
            <button class="btn btn-red" data-remove="${index}" type="button">✕</button>
          </div>
          <div class="item-body">
            <div class="field">
              <label>Título de sección</label>
              <input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc">
            </div>
          </div>
        </div>
      `);

      return;
    }

    if(item.kind === "image"){
      const imagenHtml = item.src
        ? `<img class="quote-image-preview" src="${html(item.src)}" alt="${html(item.name || "Imagen")}">`
        : `<div class="image-empty">Imagen pendiente</div>`;

      tbody.insertAdjacentHTML("beforeend", `
        <tr class="image-row">
          <td class="num"></td>
          <td colspan="4">
            <div class="quote-image-box">
              <div class="quote-image-actions">
                <label class="btn btn-gray image-picker">
                  Cambiar imagen
                  <input type="file" accept="image/*" data-image-index="${index}">
                </label>
                <input value="${html(item.desc || "")}" placeholder="Comentario de imagen (opcional)" data-index="${index}" data-field="desc">
              </div>
              ${imagenHtml}
              <div class="image-hint">Máximo guardado y mostrado: 300px por lado.</div>
            </div>
          </td>
          <td class="center">
            <button class="btn btn-red" data-remove="${index}" type="button">✕</button>
          </td>
        </tr>
      `);

      mobile.insertAdjacentHTML("beforeend", `
        <div class="item-card">
          <div class="item-head">
            <span>Imagen</span>
            <button class="btn btn-red" data-remove="${index}" type="button">✕</button>
          </div>
          <div class="item-body">
            <div class="quote-image-actions">
              <label class="btn btn-gray image-picker">
                Cambiar imagen
                <input type="file" accept="image/*" data-image-index="${index}">
              </label>
              <input value="${html(item.desc || "")}" placeholder="Comentario de imagen (opcional)" data-index="${index}" data-field="desc">
            </div>
            ${imagenHtml}
            <div class="image-hint">Máximo guardado y mostrado: 300px por lado.</div>
          </div>
        </div>
      `);

      return;
    }

    if(!item.kind) item.kind = "item";

    const number = visibleNumber++;
    const total = itemTotal(item);

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="num">${number}</td>
        <td class="desc">
          <input value="${html(item.desc)}" placeholder="Descripción" data-index="${index}" data-field="desc">
        </td>
        <td class="center">
          <input type="number" min="0" step="0.01" value="${item.qty}" data-index="${index}" data-field="qty">
        </td>
        <td class="center">
          <input type="number" min="0" step="0.01" value="${item.price}" data-index="${index}" data-field="price">
        </td>
        <td class="center total-cell">
          <input readonly data-total-index="${index}" value="${total.toFixed(2)}">
        </td>
        <td class="center">
          <button class="btn btn-red" data-remove="${index}" type="button">✕</button>
        </td>
      </tr>
    `);

    mobile.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="item-head">
          <span>Ítem ${number}</span>
          <button class="btn btn-red" data-remove="${index}" type="button">✕</button>
        </div>

        <div class="item-body">
          <div class="field">
            <label>Descripción</label>
            <input value="${html(item.desc)}" placeholder="Descripción del producto o servicio" data-index="${index}" data-field="desc">
          </div>

          <div class="item-grid">
            <div class="field">
              <label>Cantidad</label>
              <input type="number" min="0" step="0.01" value="${item.qty}" data-index="${index}" data-field="qty">
            </div>

            <div class="field">
              <label>P. Unit ($)</label>
              <input type="number" min="0" step="0.01" value="${item.price}" data-index="${index}" data-field="price">
            </div>
          </div>

          <div class="item-total">
            <span>Total ítem</span>
            <b data-total-index="${index}">${currency(total)}</b>
          </div>
        </div>
      </div>
    `);
  });

  updateTotals();
}

/* CLIENTES CORREGIDO */
async function cargarClientesCotizador(){
  if(!validarSupabase()) return;

  /*
    FIX v34:
    La tabla clientes ha cambiado varias veces. Primero intentamos traer todos
    los campos útiles. Si Supabase rechaza algún campo por schema cache,
    caemos a un select básico compatible.
  */
  let res = await db()
    .from("clientes")
    .select("id,nombre,tipo_cliente,telefono,correo,email,rif_cedula,rif,direccion,notas,activo")
    .order("nombre", { ascending:true });

  if(res.error){
    console.warn("Clientes select completo falló. Probando básico:", res.error);

    res = await db()
      .from("clientes")
      .select("id,nombre,tipo_cliente,telefono,correo,notas")
      .order("nombre", { ascending:true });
  }

  if(res.error){
    console.error("Error cargando clientes:", res.error);
    showToast("Error cargando clientes", "err");
    clientesDB = [];
    renderClientesDatalist();
    return;
  }

  clientesDB = res.data || [];
  console.log("Clientes cargados en cotizador:", clientesDB.length);

  renderClientesDatalist();
}

function renderClientesDatalist(){
  const lista = $("clientesList");
  if(!lista) return;

  lista.innerHTML = clientesDB
    .filter(c => c && c.nombre)
    .map(c => `<option value="${html(c.nombre || "")}"></option>`)
    .join("");

  console.log("Datalist actualizado:", lista.children.length);
}

function buscarClientePorNombre(nombre){
  const n = normalizar(nombre);
  if(!n) return null;

  return clientesDB.find(c => normalizar(c.nombre) === n) || null;
}

function llenarDatosCliente(cliente){
  if(!cliente) return;

  $("rif").value = pickClienteField(cliente, "rif");
  $("telefono").value = cliente.telefono || "";
  $("email").value = pickClienteField(cliente, "correo");
  $("direccion").value = pickClienteField(cliente, "direccion");

  const mini = $("clienteMini");
  if(mini){
    mini.innerHTML = `Cliente encontrado: <b>${html(cliente.nombre)}</b>`;
  }
}

function revisarClienteActual(){
  const nombre = $("cliente").value;
  const cliente = buscarClientePorNombre(nombre);
  const mini = $("clienteMini");

  if(cliente){
    llenarDatosCliente(cliente);
  }else if(mini){
    mini.innerHTML = nombre.trim()
      ? "Cliente nuevo: se guardará automáticamente en clientes."
      : "Escribe para buscar o crear cliente nuevo.";
  }
}

async function guardarOActualizarClienteDesdeCotizacion(){
  if(!validarSupabase()) throw new Error("No hay conexión Supabase.");

  const form = getForm();
  const nombre = nombreBonito(form.cliente);

  if(!nombre) throw new Error("Coloca el nombre del cliente.");

  const existente = buscarClientePorNombre(nombre);
  const payload = buildClientePayload({...form, cliente:nombre}, existente, true);

  if(existente){
    const res = await ejecutarClienteConFallback(
      datos => db()
        .from("clientes")
        .update(datos)
        .eq("id", existente.id)
        .select()
        .single(),
      payload
    );

    if(res.error) throw res.error;

    const idx = clientesDB.findIndex(c => Number(c.id) === Number(existente.id));
    if(idx >= 0) clientesDB[idx] = { ...clientesDB[idx], ...res.data };
    else clientesDB.push(res.data);

    renderClientesDatalist();
    return res.data;
  }

  const res = await ejecutarClienteConFallback(
    datos => db()
      .from("clientes")
      .insert([datos])
      .select()
      .single(),
    payload
  );

  if(res.error) throw res.error;

  clientesDB.push(res.data);
  renderClientesDatalist();

  return res.data;
}

function loadImageDataUrl(src){
  return new Promise((resolve,reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar el logo"));
    img.src = src;
  });
}

async function getTuttoLogoPngDataUrl(){
  if(tuttoLogoPngPromise) return tuttoLogoPngPromise;

  tuttoLogoPngPromise = (async () => {
    const img = await loadImageDataUrl(TUTTO_LOGO_SRC);

    const canvas = document.createElement("canvas");
    const scale = 6;
    const realW = img.naturalWidth || img.width || 600;
    const realH = img.naturalHeight || img.height || 180;

    canvas.width = Math.max(1, Math.round(realW * scale));
    canvas.height = Math.max(1, Math.round(realH * scale));

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);

    return canvas.toDataURL("image/png");
  })().catch(error => {
    console.warn("No se pudo rasterizar el logo:", error);
    return null;
  });

  return tuttoLogoPngPromise;
}

function drawPdfField(doc,x,y,w,h,label,value,opts={}){
  doc.setDrawColor(...(opts.border || [217,222,234]));
  doc.setFillColor(...(opts.fill || [255,255,255]));
  doc.roundedRect(x,y,w,h,opts.radius || 3,opts.radius || 3,"FD");

  doc.setFont("helvetica","bold");
  doc.setFontSize(opts.labelSize || 5.2);
  doc.setTextColor(107,114,128);
  doc.text(String(label || "").toUpperCase(), x+3, y+3.5);

  doc.setFont("helvetica", opts.valueBold ? "bold" : "normal");
  doc.setFontSize(opts.valueSize || 6.9);
  doc.setTextColor(17,24,39);

  const lines = doc.splitTextToSize(String(value || "—"), w - 6);
  doc.text(lines.slice(0, opts.maxLines || 1), x+3, y+8);
}

function drawPdfHeaderFooter(doc,footer,form){
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(247,248,252);
  doc.rect(0,H-20,W,20,"F");

  doc.setDrawColor(225,228,236);
  doc.line(14,H-20,W-14,H-20);

  doc.setFont("helvetica","normal");
  doc.setFontSize(7.5);
  doc.setTextColor(95,99,104);

  const dirLines = doc.splitTextToSize(footer?.direccion || "", W-28);
  doc.text(dirLines.slice(0,2), W/2, H-13, { align:"center" });
  doc.text(footer?.contacto || "", W/2, H-7.7, { align:"center" });

  doc.setFontSize(7.2);
  doc.setTextColor(120,124,130);
  doc.text(`${footer?.preparado_texto || "Documento preparado por:"} ${form?.responsable || ""}`, W/2, H-3.1, { align:"center" });
}

function formatFechaFactura(fechaISO){
  const raw = String(fechaISO || "").trim();

  if(!raw) return "";

  const parts = raw.split("-");
  if(parts.length === 3){
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    return `${d}-${m}-${y}`;
  }

  return raw;
}

function numeroFacturaVisible(numero){
  const limpio = String(numero || "").trim();
  if(!limpio) return "";

  if(/^\d+$/.test(limpio)){
    return limpio.padStart(6,"0");
  }

  return limpio;
}

function moneyFactura(n,decimales=2){
  return Number(n || 0).toLocaleString("es-VE",{
    minimumFractionDigits:decimales,
    maximumFractionDigits:decimales
  });
}

function cantidadFactura(n){
  const num = Number(n || 0);
  const tieneDecimales = Math.abs(num - Math.trunc(num)) > 0.000001;

  return num.toLocaleString("es-VE",{
    minimumFractionDigits:tieneDecimales ? 2 : 0,
    maximumFractionDigits:tieneDecimales ? 2 : 0
  });
}

const FACTURA_SCALE = 0.90;

function facturaFontSize(size){
  return Number(size || 10.4) * FACTURA_SCALE;
}

function drawTextFactura(doc,text,x,y,opts={}){
  const value = String(text ?? "");

  doc.setFont("helvetica", opts.bold === false ? "normal" : "bold");
  doc.setFontSize(facturaFontSize(opts.size || 10.4));
  doc.setTextColor(0,0,0);

  doc.text(value,x,y,{ align:opts.align || "left", baseline:"alphabetic" });
}

function drawFacturaReferenciaHeader(doc,snapshot){
  const form = snapshot.form;
  const W = doc.internal.pageSize.getWidth();

  // Ajuste v52:
  // - Todo el texto de factura se bajó 10% de tamaño.
  // - Fecha a 5.5 cm desde arriba.
  // - Factura a 6 cm desde arriba.
  // - Resto del bloque principal arranca a 7 cm desde arriba.
  // - RIF a 9 cm desde arriba.
  // - Tabla a 9.6 cm desde arriba.
  const left = 18;
  const centerData = W / 2 + 20;

  drawTextFactura(doc,"FECHA:",142,55,{ size:10.4, align:"right" });
  drawTextFactura(doc,formatFechaFactura(form.fecha),178,55,{ size:10.4, align:"right" });

  drawTextFactura(doc,"FACTURA #",142,60,{ size:10.4, align:"right" });
  drawTextFactura(doc,numeroFacturaVisible(form.numero),178,60,{ size:11.2, align:"right" });

  drawTextFactura(doc,"NOMBRE O RAZON SOCIAL:",left,70,{ size:10.4 });
  drawTextFactura(doc,(form.cliente || "").toUpperCase(),centerData,70,{ size:15.2, align:"center" });

  drawTextFactura(doc,"DIRECCION FISCAL:",23,82,{ size:10.4 });

  const dir = String(form.direccion || "");
  const dirLines = doc.splitTextToSize(dir, 92).slice(0,2);
  drawTextFactura(doc,dirLines[0] || "",centerData,80,{ size:10.2, align:"center" });
  if(dirLines[1]){
    drawTextFactura(doc,dirLines[1],centerData,86,{ size:10.2, align:"center" });
  }

  drawTextFactura(doc,"RIF.:",24,90,{ size:10.4 });
  drawTextFactura(doc,form.rif || "",38,90,{ size:10.4 });
}

function drawFacturaReferenciaTable(doc,items){
  const left = 18;
  const x1 = 37;
  const x2 = 108;
  const x3 = 127;
  const x4 = 154;
  const right = 184;
  const y = 96;
  const headerH = 9;
  const rowH = 16;

  doc.setDrawColor(0,0,0);
  doc.setLineWidth(.42);

  doc.setFillColor(175,175,175);
  doc.rect(left,y,right-left,headerH,"FD");

  [x1,x2,x3,x4].forEach(x => doc.line(x,y,x,y+headerH));

  drawTextFactura(doc,"#",(left+x1)/2,y+6.1,{ size:10.4, align:"center" });
  drawTextFactura(doc,"DESCRIPCION",(x1+x2)/2,y+6.1,{ size:10.4, align:"center" });
  drawTextFactura(doc,"CANT (m)",(x2+x3)/2,y+6.1,{ size:10.4, align:"center" });
  drawTextFactura(doc,"P.U",(x3+x4)/2,y+6.1,{ size:10.4, align:"center" });
  drawTextFactura(doc,"SUB TOTAL",(x4+right)/2,y+6.1,{ size:10.4, align:"center" });

  const visibles = (items || []).filter(it => it.kind === "item").slice(0,6);
  const filas = Math.max(1,visibles.length);

  for(let i=0;i<filas;i++){
    const rowY = y + headerH + (i * rowH);

    doc.setFillColor(255,255,255);
    doc.rect(left,rowY,right-left,rowH,"FD");
    [x1,x2,x3,x4].forEach(x => doc.line(x,rowY,x,rowY+rowH));

    const item = visibles[i];
    if(!item) continue;

    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const total = qty * price;
    const descLines = doc.splitTextToSize(String(item.desc || ""), x2 - x1 - 8).slice(0,2);
    const descY = rowY + (descLines.length > 1 ? 6.4 : 9.2);

    drawTextFactura(doc,String(i+1),(left+x1)/2,rowY+9.4,{ size:10.4, align:"center" });
    doc.setFont("helvetica","bold");
    doc.setFontSize(facturaFontSize(10.4));
    doc.text(descLines,(x1+x2)/2,descY,{ align:"center" });
    drawTextFactura(doc,cantidadFactura(qty),(x2+x3)/2,rowY+9.4,{ size:10.4, align:"center" });
    drawTextFactura(doc,moneyFactura(price,3),(x3+x4)/2,rowY+9.4,{ size:10.4, align:"center" });
    drawTextFactura(doc,moneyFactura(total,2),right-1,rowY+9.4,{ size:10.4, align:"right" });
  }

  doc.setLineWidth(.2);
}

function drawFacturaReferenciaTotals(doc,snapshot){
  const form = snapshot.form;
  const t = snapshot.totals || calcularTotales(snapshot.items, form.iva, form.tipo);

  const subtotal = Number(t.subtotal || 0);
  const iva = Number(t.iva || 0);
  const totalPagar = Number(t.total || subtotal + iva);

  const labelX = 154;
  const valueX = 183;

  drawTextFactura(doc,"SUB-TOTAL BS",labelX,225,{ size:10.4, align:"right" });
  drawTextFactura(doc,moneyFactura(subtotal,2),valueX,225,{ size:10.4, align:"right" });

  drawTextFactura(doc,"IVA 16%",labelX,233,{ size:10.4, align:"right" });
  drawTextFactura(doc,moneyFactura(iva,2),valueX,233,{ size:10.4, align:"right" });

  drawTextFactura(doc,"TOTAL A PAGAR BS",labelX,241,{ size:10.4, align:"right" });
  drawTextFactura(doc,moneyFactura(totalPagar,2),valueX,241,{ size:10.4, align:"right" });
}

async function crearDocumentoFacturaPDF(snapshot=crearSnapshotActual()){
  if(!window.jspdf || !window.jspdf.jsPDF) throw new Error("No cargó la librería PDF.");

  const { jsPDF } = window.jspdf;

  // La referencia impresa recibida viene en proporción A4.
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });

  drawFacturaReferenciaHeader(doc,snapshot);
  drawFacturaReferenciaTable(doc,snapshot.items || []);
  drawFacturaReferenciaTotals(doc,snapshot);

  return doc;
}

function drawPropuestaEconomicaIntro(doc,x,y,w){
  const blueDark = [11,31,122];
  const blueSoft = [248,249,255];
  const line = [217,222,234];

  doc.setDrawColor(...line);
  doc.setFillColor(...blueSoft);
  doc.roundedRect(x,y,w,42,3,3,"FD");

  doc.setFont("helvetica","bold");
  doc.setFontSize(10.4);
  doc.setTextColor(...blueDark);
  doc.text("Propuesta Económica",x+4,y+7);

  doc.setFont("helvetica","normal");
  doc.setFontSize(8.2);
  doc.setTextColor(55,65,81);

  let ty = y + 13;
  PROPUESTA_ECONOMICA_INTRO.forEach((parrafo,idx) => {
    const lines = doc.splitTextToSize(parrafo,w-8);
    doc.text(lines,x+4,ty);
    ty += (lines.length * 4.2) + (idx === 0 ? 3.2 : 0);
  });

  return y + 42;
}

function getPdfImageFormat(src){
  return String(src || "").toLowerCase().startsWith("data:image/png") ? "PNG" : "JPEG";
}

function getPdfImageSize(doc,src,maxW=82,maxH=62){
  try{
    const props = doc.getImageProperties(src);
    const ratio = Math.min(maxW / (props.width || maxW), maxH / (props.height || maxH), 1);
    return {
      w: Math.max(8,(props.width || maxW) * ratio),
      h: Math.max(8,(props.height || maxH) * ratio)
    };
  }catch(error){
    console.warn("No se pudieron calcular medidas de imagen PDF:", error);
    return { w:maxW, h:maxH };
  }
}

async function crearDocumentoPDF(snapshot=crearSnapshotActual()){
  if(!window.jspdf || !window.jspdf.jsPDF) throw new Error("No cargó la librería PDF.");

  const form = snapshot.form;
  const items = snapshot.items || [];
  const t = snapshot.totals || calcularTotales(items, form.iva);
  const footer = snapshot.footer || form.footer || getFooter();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const blue = [21,59,255];
  const blueDark = [11,31,122];
  const line = [217,222,234];

  doc.setFillColor(...blue);
  doc.rect(0,0,W,30,"F");

  const logoDataUrl = await getTuttoLogoPngDataUrl();

  if(logoDataUrl){
    try{
      doc.addImage(logoDataUrl, "PNG", 14, 7.2, 54, 16, undefined, "FAST");
    }catch(error){
      console.warn(error);
    }
  }

  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(8.5);
  doc.text("Tel: +58 414-4961122", W-14, 10.8, { align:"right" });
  doc.text("Email: tuttovinilos@gmail.com", W-14, 15.4, { align:"right" });
  doc.text("RIF: J-40218250-3", W-14, 20, { align:"right" });

  doc.setFillColor(...blueDark);
  doc.roundedRect(14,35,W-28,11,4,4,"F");

  doc.setFontSize(15);
  doc.setTextColor(255,255,255);
  doc.text((form.tipo || "Cotización").toUpperCase(), W/2, 42.2, { align:"center" });

  drawPdfField(doc,14,50,54,10,"Fecha",form.fecha || "",{ valueBold:true });
  drawPdfField(doc,71,50,62,10,"N° Documento",form.numero || "",{ valueBold:true });
  drawPdfField(doc,136,50,62,10,"Válido hasta",form.vence || "",{ valueBold:true });

  doc.setFont("helvetica","bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...blue);
  doc.text("DATOS DEL CLIENTE",14,66);

  doc.setDrawColor(...line);
  doc.line(14,67.5,W-14,67.5);

  drawPdfField(doc,14,70,67,10,"Cliente",form.cliente || "",{ valueBold:true,valueSize:6.7 });
  drawPdfField(doc,84,70,55,10,"RIF / Cédula",form.rif || "",{ valueSize:6.7 });
  drawPdfField(doc,142,70,56,10,"Teléfono",form.telefono || "",{ valueSize:6.7 });
  drawPdfField(doc,14,83,67,10,"Email",form.email || "",{ valueSize:6.5 });
  drawPdfField(doc,84,83,114,10,"Dirección",form.direccion || "",{ valueSize:6.5 });

  let tableStartY = 101;

  if(esPropuestaEconomicaTipo(form.tipo)){
    tableStartY = drawPropuestaEconomicaIntro(doc,14,98,W-28) + 7;
  }

  let count = 1;
  const body = [];

  items.forEach(item => {
    if(item.kind === "separator"){
      body.push([{
        content: item.desc || "SECCIÓN",
        colSpan: 5,
        styles:{
          halign:"center",
          fontStyle:"bold",
          fillColor:[232,236,255],
          textColor:[11,31,122]
        }
      }]);
      return;
    }

    if(item.kind === "image"){
      if(item.src){
        const dims = getPdfImageSize(doc,item.src,82,62);
        body.push([{
          content:"",
          colSpan:5,
          imageSrc:item.src,
          imageW:dims.w,
          imageH:dims.h,
          imageFormat:getPdfImageFormat(item.src),
          styles:{
            minCellHeight:dims.h + 8,
            halign:"center",
            valign:"middle",
            fillColor:[255,255,255]
          }
        }]);
      }else{
        body.push([{
          content:"IMAGEN",
          colSpan:5,
          styles:{ halign:"center", fontStyle:"bold", fillColor:[255,255,255] }
        }]);
      }
      return;
    }

    const total = itemTotal(item);

    body.push([
      String(count++),
      item.desc || "",
      String(item.qty || 0),
      "$"+Number(item.price || 0).toFixed(2),
      "$"+total.toFixed(2)
    ]);
  });

  doc.autoTable({
    startY:tableStartY,
    head:[["#","DESCRIPCIÓN DEL PRODUCTO / SERVICIO","CANT.","P. UNIT ($)","TOTAL ($)"]],
    body,
    theme:"grid",
    margin:{ left:14, right:14, bottom:26 },
    styles:{
      font:"helvetica",
      fontSize:7.7,
      cellPadding:2.3,
      textColor:[17,17,17],
      lineColor:[217,222,234],
      lineWidth:.2,
      overflow:"linebreak",
      valign:"middle"
    },
    headStyles:{
      fillColor:[243,245,252],
      textColor:[17,17,17],
      fontStyle:"bold",
      halign:"center",
      fontSize:7.2
    },
    columnStyles:{
      0:{ halign:"center", cellWidth:12, fontStyle:"bold", textColor:[220,38,38] },
      1:{ cellWidth:"auto" },
      2:{ halign:"center", cellWidth:19 },
      3:{ halign:"center", cellWidth:28 },
      4:{ halign:"center", cellWidth:30, fontStyle:"bold", textColor:[21,59,255] }
    },
    alternateRowStyles:{ fillColor:[252,252,254] },
    didDrawCell:(cellData) => {
      const raw = cellData.cell && cellData.cell.raw;

      if(cellData.section !== "body" || !raw || !raw.imageSrc) return;

      try{
        const imgX = cellData.cell.x + (cellData.cell.width - raw.imageW) / 2;
        const imgY = cellData.cell.y + 4;
        doc.addImage(raw.imageSrc, raw.imageFormat || "JPEG", imgX, imgY, raw.imageW, raw.imageH, undefined, "FAST");
      }catch(error){
        console.warn("No se pudo dibujar la imagen en PDF:", error);
      }
    },
    didDrawPage:() => drawPdfHeaderFooter(doc,footer,form)
  });

  let fy = doc.lastAutoTable.finalY + 6;
  const notesH = form.notas ? 33 : 18;
  const rightBoxH = Number(t.iva || 0) > 0 ? 33 : 25;

  if(fy > H - Math.max(notesH,rightBoxH) - 26){
    doc.addPage();
    fy = 20;
  }

  const leftW = 126;
  const rightX = 145;
  const rightW = W - rightX - 14;

  if(form.notas){
    doc.setDrawColor(...line);
    doc.setFillColor(252,252,254);
    doc.roundedRect(14,fy,leftW,33,3,3,"FD");

    doc.setFont("helvetica","bold");
    doc.setFontSize(8);
    doc.setTextColor(...blueDark);
    doc.text("NOTAS / CONDICIONES",17,fy+5.5);

    doc.setFont("helvetica","normal");
    doc.setFontSize(8.4);
    doc.setTextColor(70,74,82);
    doc.text(doc.splitTextToSize(form.notas,leftW-6).slice(0,7),17,fy+11);
  }

  doc.setDrawColor(...line);
  doc.setFillColor(255,255,255);
  doc.roundedRect(rightX,fy,rightW,rightBoxH,3,3,"FD");

  let rowY = fy;

  const drawSummaryRow = (label,value,fill,txtColor,bold=false,size=9.2) => {
    doc.setFillColor(...fill);
    doc.rect(rightX,rowY,rightW,8,"F");

    doc.setDrawColor(...line);
    doc.rect(rightX,rowY,rightW,8);

    doc.setFont("helvetica",bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...txtColor);

    doc.text(label,rightX+3,rowY+5.4);
    doc.text(value,rightX+rightW-3,rowY+5.4,{ align:"right" });

    rowY += 8;
  };

  drawSummaryRow("Sub Total",currency(t.subtotal),[255,255,255],[17,24,39],true);

  if(Number(t.iva || 0) > 0){
    drawSummaryRow(getIvaLabel(form.tipo),currency(t.iva),[255,255,255],[17,24,39],true);
  }

  doc.setFillColor(...blue);
  doc.roundedRect(rightX,rowY,rightW,10,0,0,"F");

  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.setTextColor(255,255,255);

  doc.text("TOTAL",rightX+3,rowY+6.7);
  doc.text(currency(t.total),rightX+rightW-3,rowY+6.7,{ align:"right" });

  drawPdfHeaderFooter(doc,footer,form);

  return doc;
}

function nombreArchivoPDF(snapshot){
  const form = snapshot.form || getForm();

  const clientName = (form.cliente || "cliente")
    .replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_")
    .slice(0,60);

  const tipo = (form.tipo || "Cotizacion").replace(/\s+/g,"_");

  return `${tipo}_Tuttovinilos_${form.numero || "sin_numero"}_${clientName}.pdf`;
}

function blobToBase64(blob){
  return new Promise((resolve,reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(String(reader.result || "").split(",")[1] || "");
    };

    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64,mime="application/pdf"){
  const clean = String(base64 || "").includes(",")
    ? String(base64).split(",").pop()
    : String(base64 || "");

  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);

  for(let i=0;i<binary.length;i++){
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes],{ type:mime });
}

function abrirBlobPdf(blob){
  const url = URL.createObjectURL(blob);
  window.open(url,"_blank");

  setTimeout(() => URL.revokeObjectURL(url),60000);
}

async function guardarRegistroCotizacionTexto(clienteGuardado,pdfInfo=null,snapshotOverride=null){
  const snapshot = snapshotOverride || crearSnapshotActual();
  const form = snapshot.form;
  const t = snapshot.totals;

  const registroBase = {
    fecha: form.fecha || null,
    numero: form.numero,
    tipo_documento: form.tipo,
    cliente_id: clienteGuardado?.id || null,
    cliente: form.cliente,
    rif_cedula: form.rif,
    telefono: form.telefono,
    correo: form.email,
    direccion: form.direccion,
    responsable: form.responsable,
    vence: form.vence || null,
    items:{
      version:5,
      modo:"texto_json_con_pdf_opcional",
      rows:snapshot.items,
      footer:snapshot.footer,
      iva_aplicado:form.iva
    },
    notas: form.notas,
    subtotal: Number(t.subtotal.toFixed(2)),
    iva: Number(t.iva.toFixed(2)),
    total: Number(t.total.toFixed(2)),
    pdf_path:"",
    pdf_url:""
  };

  const variantes = [];

  variantes.push({
    ...registroBase,
    pdf_base64: pdfInfo?.base64 || "",
    pdf_mime: pdfInfo?.mime || "application/pdf",
    pdf_nombre: pdfInfo?.nombre || ""
  });

  variantes.push({
    ...registroBase,
    pdf_mime: pdfInfo?.mime || "application/pdf",
    pdf_nombre: pdfInfo?.nombre || ""
  });

  variantes.push({...registroBase});

  // Fallback adicional si faltan columnas de cliente/contacto en cotizaciones.
  const basico = {
    fecha:registroBase.fecha,
    numero:registroBase.numero,
    tipo_documento:registroBase.tipo_documento,
    cliente:registroBase.cliente,
    responsable:registroBase.responsable,
    items:registroBase.items,
    notas:registroBase.notas,
    subtotal:registroBase.subtotal,
    iva:registroBase.iva,
    total:registroBase.total
  };
  variantes.push(basico);

  let ultimoError = null;

  for(const payload of variantes){
    const { data, error } = await db()
      .from("cotizaciones")
      .insert([payload])
      .select()
      .single();

    if(!error){
      return data;
    }

    ultimoError = error;
    console.warn("Falló variante guardando cotización:", error.message || error);
  }

  throw ultimoError || new Error("No se pudo guardar la cotización.");
}

async function validarFormularioDocumento(){
  let form = getForm();

  if(!form.cliente){
    showToast("Coloca el nombre del cliente", "err");
    return null;
  }

  if(!data.items.some(it => it.kind === "item" && cleanText(it.desc))){
    showToast("Agrega al menos un ítem con descripción", "err");
    return null;
  }

  if(esFacturaTipo(form.tipo)){
    if(!form.numero){
      showToast("Coloca el N° de factura", "err");
      return null;
    }

    if(validarSupabase()){
      try{
        if(await numeroExiste(form.numero)){
          showToast("Ese N° de factura/documento ya existe", "err");
          return null;
        }
      }catch(error){
        console.warn("No se pudo validar número duplicado:", error);
      }
    }
  }else{
    await asegurarNumeroDisponible();
  }

  return getForm();
}

async function crearDocumentoSegunTipo(snapshot){
  return esFacturaTipo(snapshot?.form?.tipo)
    ? await crearDocumentoFacturaPDF(snapshot)
    : await crearDocumentoPDF(snapshot);
}

function limpiarPreviewPdf(){
  if(previewPdfUrl){
    URL.revokeObjectURL(previewPdfUrl);
  }

  previewPdfUrl = null;
  previewPdfBlob = null;
  previewPdfDoc = null;
  previewSnapshot = null;

  const frame = $("previewFrame");
  if(frame) frame.removeAttribute("src");
}

function cerrarPreview(){
  const modal = $("previewBackdrop");
  if(modal) modal.style.display = "none";
}

async function previsualizarDocumento(){
  const btn = $("previewBtn");

  try{
    const form = await validarFormularioDocumento();
    if(!form) return;

    if(btn){
      btn.classList.add("loading");
      btn.disabled = true;
    }

    const snapshot = crearSnapshotActual();
    const doc = await crearDocumentoSegunTipo(snapshot);
    const blob = doc.output("blob");

    if(previewPdfUrl){
      URL.revokeObjectURL(previewPdfUrl);
    }

    previewPdfDoc = doc;
    previewPdfBlob = blob;
    previewSnapshot = snapshot;
    previewPdfUrl = URL.createObjectURL(blob);

    const title = $("previewTitle");
    if(title) title.textContent = `Previsualizador · ${snapshot.form.tipo || "Documento"} ${snapshot.form.numero || ""}`;

    const frame = $("previewFrame");
    if(frame) frame.src = previewPdfUrl;

    const modal = $("previewBackdrop");
    if(modal) modal.style.display = "flex";
  }catch(error){
    console.error("Error previsualizando documento:", error);
    showToast("Error previsualizando: " + (error.message || error), "err");
  }finally{
    if(btn){
      btn.classList.remove("loading");
      btn.disabled = false;
    }
  }
}

async function guardarDocumentoDesdePreview(){
  const btn = $("guardarPreview");

  try{
    if(!validarSupabase()) return;

    if(!previewSnapshot || !previewPdfDoc || !previewPdfBlob){
      await previsualizarDocumento();
      if(!previewSnapshot || !previewPdfDoc || !previewPdfBlob) return;
    }

    if(btn){
      btn.classList.add("loading");
      btn.disabled = true;
    }

    const form = previewSnapshot.form;

    if(esFacturaTipo(form.tipo)){
      if(!form.numero){
        showToast("Coloca el N° de factura", "err");
        return;
      }

      if(await numeroExiste(form.numero)){
        showToast("Ese N° de factura/documento ya existe", "err");
        return;
      }
    }

    const clienteGuardado = await guardarOActualizarClienteDesdeCotizacion();
    const pdfNombre = nombreArchivoPDF(previewSnapshot);

    let pdfBase64 = "";
    try{
      pdfBase64 = await blobToBase64(previewPdfBlob);
    }catch(e){
      console.warn("No se pudo convertir PDF a base64, se guardará texto:", e);
    }

    await guardarRegistroCotizacionTexto(clienteGuardado,{
      base64:pdfBase64,
      mime:"application/pdf",
      nombre:pdfNombre
    },previewSnapshot);

    previewPdfDoc.save(pdfNombre);

    showToast("Documento guardado", "ok");

    await cargarCotizacionesPrevias();

    if(!esFacturaTipo(form.tipo)){
      await refrescarNumeroPorFecha();
    }

    cerrarPreview();

    const tabPrevias = $("tabPrevias");
    if(tabPrevias) tabPrevias.click();
  }catch(err){
    console.error("Error guardando documento:", err);
    showToast("Error guardando: " + (err.message || err), "err");
  }finally{
    if(btn){
      btn.classList.remove("loading");
      btn.disabled = false;
    }
  }
}

function imprimirDocumentoDesdePreview(){
  const frame = $("previewFrame");

  if(frame?.contentWindow){
    try{
      frame.contentWindow.focus();
      frame.contentWindow.print();
      return;
    }catch(error){
      console.warn("No se pudo imprimir desde iframe:", error);
    }
  }

  if(previewPdfUrl){
    window.open(previewPdfUrl,"_blank");
  }else{
    showToast("Primero genera la previsualización", "err");
  }
}

async function createPDF(){
  await previsualizarDocumento();
}

function normalizarSnapshotDesdeRegistro(reg){
  const raw = reg?.items;

  let rows = [];
  let footer = null;
  let ivaAplicado = Number(reg?.iva || 0) > 0;

  if(Array.isArray(raw)){
    rows = raw;
  }else if(raw && typeof raw === "object"){
    rows = Array.isArray(raw.rows) ? raw.rows : (Array.isArray(raw.items) ? raw.items : []);
    footer = raw.footer || null;

    if(typeof raw.iva_aplicado === "boolean"){
      ivaAplicado = raw.iva_aplicado;
    }
  }

  const form = {
    tipo: reg?.tipo_documento || "Cotización",
    responsable: reg?.responsable || "",
    fecha: reg?.fecha || "",
    numero: reg?.numero || "",
    vence: reg?.vence || "",
    cliente: reg?.cliente || "",
    rif: reg?.rif_cedula || "",
    telefono: reg?.telefono || "",
    email: reg?.correo || "",
    direccion: reg?.direccion || "",
    notas: reg?.notas || "",
    iva: ivaAplicado,
    footer: footer || {
      direccion:"Avenida Universidad, Urbanización La Granja, Edificio Diario El Carabobeño, en el Municipio Naguanagua del estado Carabobo.",
      contacto:"Tel: +58 414-4961122 | tuttovinilos@gmail.com",
      preparado_texto:"Documento preparado por:"
    }
  };

  const calculado = calcularTotales(rows, ivaAplicado, form.tipo);

  return {
    form,
    items: rows,
    totals:{
      subtotal:Number(reg?.subtotal || calculado.subtotal),
      iva:Number(reg?.iva || calculado.iva),
      total:Number(reg?.total || calculado.total)
    },
    footer: form.footer
  };
}

async function cargarCotizacionesPrevias(){
  if(!validarSupabase()) return;

  const body = $("cotizacionesBody");

  if(body){
    body.innerHTML = `<tr><td colspan="8" class="empty">Cargando...</td></tr>`;
  }

  const selects = [
    `id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,
     responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_nombre,
     pdf_mime,aprobado,aprobado_at,aprobado_por,errada,errada_at,errada_por,created_at`,

    `id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,
     responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_nombre,
     pdf_mime,created_at`,

    `id,fecha,numero,tipo_documento,cliente,responsable,items,notas,subtotal,iva,total,created_at`,

    `*`
  ];

  let res = null;

  for(const sel of selects){
    res = await db()
      .from("cotizaciones")
      .select(sel)
      .order("created_at",{ ascending:false })
      .limit(200);

    if(!res.error) break;

    console.warn("Falló select cotizaciones previas, probando fallback:", res.error.message || res.error);
  }

  if(res.error){
    console.error("Error cargando cotizaciones:", res.error);

    if(body){
      body.innerHTML = `<tr><td colspan="8" class="empty">Error cargando cotizaciones: ${html(res.error.message || "")}</td></tr>`;
    }

    showToast("Error cargando cotizaciones","err");
    return;
  }

  cotizacionesDB = (res.data || []).map(c => ({
    ...c,
    aprobado:c.aprobado === true,
    errada:c.errada === true
  }));

  renderCotizacionesPrevias();
}

function renderCotizacionesPrevias(){
  const body = $("cotizacionesBody");
  if(!body) return;

  const q = normalizar($("buscarCotizaciones")?.value || "");
  const filtroAprobado = $("filtroAprobado")?.value || "";

  let lista = [...cotizacionesDB];

  if(q){
    lista = lista.filter(c => {
      const texto = [
        c.fecha,
        c.numero,
        c.cliente,
        c.responsable,
        c.telefono,
        c.total,
        c.tipo_documento,
        estadoTextoCotizacion(c)
      ].join(" ");

      return normalizar(texto).includes(q);
    });
  }

  if(filtroAprobado === "aprobadas"){
    lista = lista.filter(c => c.aprobado === true && c.errada !== true);
  }

  if(filtroAprobado === "pendientes"){
    lista = lista.filter(c => c.aprobado !== true && c.errada !== true);
  }

  if(filtroAprobado === "erradas"){
    lista = lista.filter(c => c.errada === true);
  }

  if(!lista.length){
    body.innerHTML = `<tr><td colspan="8" class="empty">Sin cotizaciones</td></tr>`;
    return;
  }

  body.innerHTML = lista.map(c => {
    const aprobadoMeta = c.aprobado
      ? `<span class="approved-meta">${html(c.aprobado_por || "")} ${c.aprobado_at ? "· " + html(String(c.aprobado_at).slice(0,10)) : ""}</span>`
      : "";

    const erradaMeta = c.errada
      ? `<span class="approved-meta">${html(c.errada_por || "")} ${c.errada_at ? "· " + html(String(c.errada_at).slice(0,10)) : ""}</span>`
      : "";

    return `
      <tr>
        <td class="center">
          <div class="status-stack">
            <button class="mini-btn ${c.aprobado ? "approved" : "pending"}" type="button" data-aprobar-cot="${Number(c.id)}">
              ${c.aprobado ? "✅ Aprobada" : "☐ Pendiente"}
            </button>

            <button class="mini-btn error ${c.errada ? "active" : ""}" type="button" data-errar-cot="${Number(c.id)}">
              ${c.errada ? "❌ Errada" : "Marcar errada"}
            </button>

            ${c.errada ? erradaMeta : aprobadoMeta}
          </div>
        </td>

        <td>${html(c.fecha || "")}</td>
        <td><b>${html(c.numero || "")}</b></td>
        <td>${html(c.cliente || "")}</td>

        <td>
          <span class="badge-responsable">${html(c.responsable || "Sin responsable")}</span>
        </td>

        <td>${html(c.telefono || "")}</td>
        <td><b>${currencyDocumento(c.total || 0,c.tipo_documento)}</b></td>

        <td class="center">
          <button class="mini-btn dark" type="button" data-ver-cot="${Number(c.id)}">Abrir</button>
          <button class="mini-btn" type="button" data-pdf-cot="${Number(c.id)}">${c.pdf_nombre ? "Abrir PDF" : "Generar PDF"}</button>
          ${esRoberto() ? `<button class="mini-btn delete" type="button" data-eliminar-cot="${Number(c.id)}">Eliminar</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");
}

async function toggleAprobadoCotizacion(id){
  const cot = cotizacionesDB.find(c => Number(c.id) === Number(id));

  if(!cot){
    showToast("No se encontró la cotización","err");
    return;
  }

  const nuevoEstado = !cot.aprobado;
  const op = operadorSesionActual();

  const update = {
    aprobado:nuevoEstado,
    aprobado_at:nuevoEstado ? new Date().toISOString() : null,
    aprobado_por:nuevoEstado ? (op?.nombre || "") : null,
    errada:false,
    errada_at:null,
    errada_por:null
  };

  const { error } = await db()
    .from("cotizaciones")
    .update(update)
    .eq("id",id);

  if(error){
    console.error(error);
    const msg = String(error.message || "");
    if(msg.includes("aprobado") || msg.includes("schema cache")){
      showToast("Faltan columnas de aprobación en Supabase", "err");
    }else{
      showToast("No se pudo actualizar aprobación","err");
    }
    return;
  }

  Object.assign(cot, update);

  renderCotizacionesPrevias();
  showToast(nuevoEstado ? "Cotización aprobada" : "Cotización marcada como pendiente","ok");
}


async function toggleErradaCotizacion(id){
  const cot = cotizacionesDB.find(c => Number(c.id) === Number(id));

  if(!cot){
    showToast("No se encontró la cotización","err");
    return;
  }

  const nuevoEstado = !cot.errada;
  const op = operadorSesionActual();

  const update = {
    errada:nuevoEstado,
    errada_at:nuevoEstado ? new Date().toISOString() : null,
    errada_por:nuevoEstado ? (op?.nombre || "") : null,
    aprobado:nuevoEstado ? false : cot.aprobado === true,
    aprobado_at:nuevoEstado ? null : (cot.aprobado_at || null),
    aprobado_por:nuevoEstado ? null : (cot.aprobado_por || null)
  };

  const { error } = await db()
    .from("cotizaciones")
    .update(update)
    .eq("id",id);

  if(error){
    console.error(error);
    const msg = String(error.message || "");
    if(msg.includes("errada") || msg.includes("schema cache")){
      showToast("Faltan columnas para marcar erradas en Supabase", "err");
    }else{
      showToast("No se pudo actualizar estado errada","err");
    }
    return;
  }

  Object.assign(cot, update);

  renderCotizacionesPrevias();
  showToast(nuevoEstado ? "Cotización marcada como errada" : "Cotización quitada de erradas","ok");
}


async function eliminarCotizacion(id){
  if(!esRoberto()){
    showToast("Solo Roberto puede eliminar documentos", "err");
    return;
  }

  const cot = cotizacionesDB.find(c => Number(c.id) === Number(id));

  if(!cot){
    showToast("No se encontró el documento", "err");
    return;
  }

  const seguro = confirm(`¿Eliminar definitivamente ${cot.tipo_documento || "documento"} ${cot.numero || ""} de ${cot.cliente || "sin cliente"}?\n\nEsta acción no se puede deshacer.`);
  if(!seguro) return;

  const { error } = await db()
    .from("cotizaciones")
    .delete()
    .eq("id",id);

  if(error){
    console.error(error);
    showToast("No se pudo eliminar el documento", "err");
    return;
  }

  cotizacionesDB = cotizacionesDB.filter(c => Number(c.id) !== Number(id));
  renderCotizacionesPrevias();
  showToast("Documento eliminado", "ok");
}

function buscarCotizacionPorId(id){
  return cotizacionesDB.find(c => Number(c.id) === Number(id)) || null;
}

async function obtenerCotizacionCompleta(id){
  let reg = buscarCotizacionPorId(id);

  if(reg && Object.prototype.hasOwnProperty.call(reg,"pdf_base64")){
    return reg;
  }

  const selectCompleto = `
    id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,
    responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,
    pdf_base64,pdf_mime,pdf_nombre,aprobado,aprobado_at,aprobado_por,errada,errada_at,errada_por,created_at
  `;

  const selectSinPdfBase64 = `
    id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,
    responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,
    pdf_mime,pdf_nombre,aprobado,aprobado_at,aprobado_por,errada,errada_at,errada_por,created_at
  `;

  let res = await db()
    .from("cotizaciones")
    .select(selectCompleto)
    .eq("id",id)
    .single();

  if(res.error){
    const msg = String(res.error.message || "");

    if(msg.includes("pdf_base64") || msg.includes("schema cache")){
      res = await db()
        .from("cotizaciones")
        .select(selectSinPdfBase64)
        .eq("id",id)
        .single();
    }
  }

  if(res.error) throw res.error;

  if(res.data){
    cotizacionesDB = cotizacionesDB.map(c => {
      return Number(c.id) === Number(id) ? { ...c, ...res.data } : c;
    });

    return res.data;
  }

  return reg;
}

function abrirDetalleCotizacion(id){
  const reg = buscarCotizacionPorId(id);

  if(!reg){
    showToast("No se encontró la cotización","err");
    return;
  }

  cotizacionSeleccionada = reg;

  const snap = normalizarSnapshotDesdeRegistro(reg);
  const form = snap.form;

  $("detalleTitle").textContent = `${form.tipo || "Cotización"} · ${form.numero || ""}`;

  let itemDetalleNumero = 1;

  const itemsHtml = (snap.items || []).map((it,i) => {
    if(it.kind === "separator"){
      return `<div class="detail-item"><b>${html(it.desc || "SECCIÓN")}</b></div>`;
    }

    if(it.kind === "image"){
      const img = it.src
        ? `<img class="detail-image" src="${html(it.src)}" alt="${html(it.name || "Imagen")}">`
        : `<div class="image-empty">Imagen pendiente</div>`;

      return `
        <div class="detail-item">
          <b>Imagen</b>${it.desc ? `<br>${html(it.desc)}` : ""}
          ${img}
        </div>
      `;
    }

    const numero = itemDetalleNumero++;

    return `
      <div class="detail-item">
        <b>${numero}. ${html(it.desc || "")}</b><br>
        Cant: ${html(it.qty || 0)} · P.Unit: ${currency(it.price || 0)} · Total: ${currency(itemTotal(it))}
      </div>
    `;
  }).join("");

  $("detalleBody").innerHTML = `
    <div class="detail-list">
      <div class="detail-item">
        <b>Cliente:</b> ${html(form.cliente || "")}<br>
        <b>Teléfono:</b> ${html(form.telefono || "")}<br>
        <b>Correo:</b> ${html(form.email || "")}<br>
        <b>Dirección:</b> ${html(form.direccion || "")}
      </div>

      <div class="detail-item">
        <b>Fecha:</b> ${html(form.fecha || "")} · <b>Vence:</b> ${html(form.vence || "")}<br>
        <b>Responsable:</b> ${html(form.responsable || "")}
      </div>

      ${itemsHtml || `<div class="empty">Sin ítems</div>`}

      <div class="detail-item">
        <b>Notas:</b><br>
        ${html(form.notas || "—")}
      </div>

      <div class="detail-item">
        <b>Subtotal:</b> ${currency(snap.totals.subtotal)}<br>
        <b>IVA:</b> ${currency(snap.totals.iva)}<br>
        <b>Total:</b> ${currency(snap.totals.total)}
      </div>
    </div>
  `;

  $("detalleBackdrop").style.display = "flex";
}

function cerrarDetalle(){
  $("detalleBackdrop").style.display = "none";
  cotizacionSeleccionada = null;
}

async function generarPdfDesdeCotizacion(id){
  try{
    const base = id ? buscarCotizacionPorId(id) : cotizacionSeleccionada;

    if(!base){
      showToast("No se encontró la cotización","err");
      return;
    }

    const reg = await obtenerCotizacionCompleta(base.id);

    if(reg?.pdf_base64){
      abrirBlobPdf(base64ToBlob(reg.pdf_base64, reg.pdf_mime || "application/pdf"));
      showToast("PDF guardado abierto","ok");
      return;
    }

    const snap = normalizarSnapshotDesdeRegistro(reg);
    const doc = esFacturaTipo(snap.form?.tipo)
      ? await crearDocumentoFacturaPDF(snap)
      : await crearDocumentoPDF(snap);

    doc.save(nombreArchivoPDF(snap));

    showToast("Esta cotización no tenía PDF guardado; se generó desde el texto","warn");

  }catch(error){
    console.error(error);
    showToast("No se pudo abrir/generar el PDF","err");
  }
}

function cargarCotizacionEnFormulario(){
  if(!cotizacionSeleccionada) return;

  const snap = normalizarSnapshotDesdeRegistro(cotizacionSeleccionada);
  const f = snap.form;

  $("tipoDocumento").value = f.tipo || "Cotización";
  $("responsable").value = f.responsable || $("responsable").value;
  $("fecha").value = f.fecha || todayISO();
  $("numero").value = f.numero || "";
  $("vence").value = f.vence || "";
  $("cliente").value = f.cliente || "";
  $("rif").value = f.rif || "";
  $("telefono").value = f.telefono || "";
  $("email").value = f.email || "";
  $("direccion").value = f.direccion || "";
  $("notas").value = f.notas || "";
  $("ivaCheck").checked = !!f.iva;
  aplicarModoNumeroDocumento(f.tipo || "Cotización", false);

  if(f.footer){
    $("footerDireccion").innerText = f.footer.direccion || $("footerDireccion").innerText;
    $("footerContacto").innerText = f.footer.contacto || $("footerContacto").innerText;
    $("footerPreparadoTexto").innerText = f.footer.preparado_texto || $("footerPreparadoTexto").innerText;
  }

  data.items = JSON.parse(JSON.stringify(
    snap.items && snap.items.length
      ? snap.items
      : [{ kind:"item", desc:"", qty:1, price:0 }]
  ));

  render();
  cerrarDetalle();
  activarTab("nueva");

  showToast("Cotización cargada para editar","ok");
}

async function nuevaCotizacionLimpia(){
  data.items = [{ kind:"item", desc:"", qty:1, price:0 }];

  $("cliente").value = "";
  $("rif").value = "";
  $("telefono").value = "";
  $("email").value = "";
  $("direccion").value = "";
  $("notas").value = "";
  $("ivaCheck").checked = false;
  $("clienteMini").textContent = "Escribe para buscar o crear cliente nuevo.";

  await initDates();

  setResponsableDesdeSesion();
  render();
  activarTab("nueva");
}

function activarTab(cual){
  const nueva = cual === "nueva";

  $("tabNueva").classList.toggle("active", nueva);
  $("tabPrevias").classList.toggle("active", !nueva);

  $("panelNueva").classList.toggle("active", nueva);
  $("panelPrevias").classList.toggle("active", !nueva);

  if(!nueva){
    cargarCotizacionesPrevias();
  }
}

function bindEvents(){
  document.addEventListener("focusin", e => {
    if(e.target.matches('#panelNueva input,#panelNueva textarea,#panelNueva select,#panelNueva [contenteditable="true"]')){
      guardarEstadoDeshacer();
    }
  });

  document.addEventListener("input", e => {
    if(e.target.matches("[data-index][data-field]")){
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      const value = e.target.value;

      if(!data.items[index]) return;

      data.items[index][field] =
        field === "qty" || field === "price"
          ? Number(value || 0)
          : value;

      updateItemVisualTotal(index);
      updateTotals();
    }
  });

  document.addEventListener("change", async e => {
    if(e.target.matches("[data-image-index]")){
      await cambiarImagenItem(Number(e.target.dataset.imageIndex), e.target.files && e.target.files[0]);
      e.target.value = "";
      return;
    }

    if(e.target.id === "tipoDocumento"){
      const esFactura = esFacturaTipo(e.target.value);

      if(esFactura && $("ivaCheck")){
        $("ivaCheck").checked = true;
      }

      aplicarModoNumeroDocumento(e.target.value, esFactura);

      if(!esFactura && !$("numero")?.value){
        await refrescarNumeroPorFecha();
      }

      render();
    }

    if(e.target.id === "responsable"){
      render();
    }

    if(e.target.id === "ivaCheck"){
      updateTotals();
    }

    if(e.target.id === "fecha"){
      await refrescarNumeroPorFecha();
    }
  });

  document.addEventListener("click", e => {
    const remove = e.target.closest("[data-remove]");

    if(remove){
      removeItem(Number(remove.dataset.remove));
      return;
    }

    const aprobar = e.target.closest("[data-aprobar-cot]");

    if(aprobar){
      toggleAprobadoCotizacion(Number(aprobar.dataset.aprobarCot));
      return;
    }

    const errar = e.target.closest("[data-errar-cot]");

    if(errar){
      toggleErradaCotizacion(Number(errar.dataset.errarCot));
      return;
    }

    const eliminar = e.target.closest("[data-eliminar-cot]");

    if(eliminar){
      eliminarCotizacion(Number(eliminar.dataset.eliminarCot));
      return;
    }

    const ver = e.target.closest("[data-ver-cot]");

    if(ver){
      abrirDetalleCotizacion(Number(ver.dataset.verCot));
      return;
    }

    const pdf = e.target.closest("[data-pdf-cot]");

    if(pdf){
      generarPdfDesdeCotizacion(Number(pdf.dataset.pdfCot));
      return;
    }
  });

  $("cliente")?.addEventListener("change", revisarClienteActual);
  $("cliente")?.addEventListener("blur", revisarClienteActual);

  $("cliente")?.addEventListener("input", () => {
    const mini = $("clienteMini");
    const cliente = buscarClientePorNombre($("cliente").value);

    if(cliente){
      mini.innerHTML = `Cliente encontrado: <b>${html(cliente.nombre)}</b>`;
    }else{
      mini.textContent = $("cliente").value.trim()
        ? "Cliente nuevo: se guardará automáticamente en clientes."
        : "Escribe para buscar o crear cliente nuevo.";
    }
  });

  $("addItem")?.addEventListener("click", addItem);
  $("addSep")?.addEventListener("click", addSeparator);
  $("addImg")?.addEventListener("click", addImageItem);

  $("previewBtn")?.addEventListener("click", previsualizarDocumento);
  $("undoBtn")?.addEventListener("click", deshacerUltimoCambio);
  $("guardarPreview")?.addEventListener("click", guardarDocumentoDesdePreview);
  $("imprimirPreview")?.addEventListener("click", imprimirDocumentoDesdePreview);
  $("cerrarPreview")?.addEventListener("click", cerrarPreview);

  $("previewBackdrop")?.addEventListener("click", e => {
    if(e.target.id === "previewBackdrop"){
      cerrarPreview();
    }
  });

  $("newQuoteBtn")?.addEventListener("click", nuevaCotizacionLimpia);
  $("clearBtn")?.addEventListener("click", () => {});

  $("tabNueva")?.addEventListener("click", () => activarTab("nueva"));
  $("tabPrevias")?.addEventListener("click", () => activarTab("previas"));

  $("recargarCotizaciones")?.addEventListener("click", cargarCotizacionesPrevias);
  $("buscarCotizaciones")?.addEventListener("input", renderCotizacionesPrevias);
  $("filtroAprobado")?.addEventListener("change", renderCotizacionesPrevias);

  $("cerrarDetalle")?.addEventListener("click", cerrarDetalle);

  $("detalleBackdrop")?.addEventListener("click", e => {
    if(e.target.id === "detalleBackdrop"){
      cerrarDetalle();
    }
  });

  $("pdfDetalle")?.addEventListener("click", () => generarPdfDesdeCotizacion());
  $("cargarDetalleForm")?.addEventListener("click", cargarCotizacionEnFormulario);
}

async function iniciarCotizador(){
  try{
    aplicarMenuDesplegable();

    setResponsableDesdeSesion();

    await initDates();

    aplicarModoNumeroDocumento($("tipoDocumento")?.value || data.tipo, false);
    setResponsableDesdeSesion();
    bloquearResponsableSiNoEsRoberto();

    render();
    bindEvents();

    await cargarClientesCotizador();
    await cargarCotizacionesPrevias();
    actualizarBotonDeshacer();
  }catch(error){
    console.error("Error iniciando cotizador:", error);
    showToast("Error iniciando cotizador: " + (error.message || error), "err");
  }
}



document.addEventListener("DOMContentLoaded", iniciarCotizador);
