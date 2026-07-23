console.log("COTIZADOR JS conectado v66 descripción de archivo y monto final opcional");

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
let eventosCotizadorVinculados = false;

const PRECIO_UNIT_DECIMALES_MAX = 10;
const CANTIDAD_DECIMALES_MAX = 2;

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

  const invalidos = new Set([
    "sin telefono",
    "sin teléfono",
    "sin correo",
    "sin email",
    "sin direccion",
    "sin dirección",
    "—",
    "-"
  ]);

  const pick = (campos) => {
    for(const key of campos){
      const raw = c[key];

      if(raw === undefined || raw === null) continue;

      const value = String(raw).trim();
      if(!value) continue;
      if(invalidos.has(normalizar(value))) continue;

      return value;
    }

    return "";
  };

  if(campo === "rif") return pick([
    "rif_cedula",
    "rif",
    "cedula_rif",
    "rif_cliente",
    "documento",
    "documento_identidad",
    "identificacion",
    "cedula",
    "ci_rif",
    "nit",
    "tax_id"
  ]);

  if(campo === "telefono") return pick([
    "telefono",
    "telefono_cliente",
    "telefono_contacto",
    "celular",
    "movil",
    "móvil",
    "whatsapp",
    "phone",
    "telefono1",
    "contacto"
  ]);

  if(campo === "correo") return pick([
    "correo",
    "email",
    "correo_cliente",
    "mail"
  ]);

  if(campo === "direccion") return pick([
    "direccion",
    "dirección",
    "address",
    "direccion_fiscal",
    "direccion_cliente",
    "ubicacion",
    "ubicación"
  ]);

  return pick([campo]);
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

function parseNumeroLocal(valor){
  if(typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  let s = String(valor ?? "")
    .trim()
    .replace(/[^0-9,.-]/g, "");

  if(!s || s === "-" || s === "." || s === ",") return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if(lastComma >= 0 && lastDot >= 0){
    if(lastComma > lastDot){
      // Formato local: 1.000,50
      s = s.replace(/\./g, "").replace(",", ".");
    }else{
      // Formato internacional: 1,000.50
      s = s.replace(/,/g, "");
    }
  }else if(lastComma >= 0){
    // Formato local con coma decimal: 1000,50
    s = s.replace(/\./g, "").replace(",", ".");
  }else if(lastDot >= 0){
    const partes = s.split(".");
    const ultimo = partes[partes.length - 1] || "";

    // Si termina como 1.000 / 25.000 / 1.000.000, el punto es miles.
    if(partes.length > 1 && ultimo.length === 3 && partes.every(p => p !== "")){
      s = partes.join("");
    }
  }

  const num = Number(s);
  return Number.isFinite(num) ? num : 0;
}

function formatoMiles(n,decimales=2){
  return Number(n || 0).toLocaleString("es-VE",{
    minimumFractionDigits:decimales,
    maximumFractionDigits:decimales
  });
}

function formatoCampoNumero(n,decimales=2,rellenarDecimales=true){
  const num = Number(n || 0);
  const tieneDecimales = Math.abs(num - Math.trunc(num)) > Number.EPSILON;

  return num.toLocaleString("es-VE",{
    minimumFractionDigits:(rellenarDecimales && tieneDecimales) ? decimales : 0,
    maximumFractionDigits:decimales
  });
}

function formatoMilesFlexible(n,maxDecimales=10){
  return Number(n || 0).toLocaleString("es-VE",{
    minimumFractionDigits:0,
    maximumFractionDigits:maxDecimales
  });
}

function formatoPrecioUnitario(n){
  return formatoCampoNumero(n,PRECIO_UNIT_DECIMALES_MAX,false);
}

function monedaPrecioUnitario(n,tipoDocumento=""){
  return esFacturaTipo(tipoDocumento)
    ? "BS " + formatoMilesFlexible(n,PRECIO_UNIT_DECIMALES_MAX)
    : "$" + formatoMilesFlexible(n,PRECIO_UNIT_DECIMALES_MAX);
}

function currency(n){ return "$" + formatoMiles(n,2); }

function monedaDocumento(n,tipoDocumento="",decimales=2){
  return esFacturaTipo(tipoDocumento)
    ? "BS " + formatoMiles(n,decimales)
    : "$" + formatoMiles(n,decimales);
}

function etiquetaMonedaDocumento(tipoDocumento=""){
  return esFacturaTipo(tipoDocumento) ? "BS" : "$";
}

function currencyDocumento(n,tipoDocumento=""){
  return monedaDocumento(n,tipoDocumento,2);
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


/* =========================================================
   FIX v60 · Notas / condiciones autoexpandible
   Evita que el texto quede escondido dentro del textarea.
========================================================= */
function autoGrowTextarea(el){
  if(!el) return;

  const min = Number(el.dataset.minHeight || 116);
  el.style.height = "auto";
  el.style.height = Math.max(min, el.scrollHeight + 4) + "px";
}

function ajustarNotasAuto(){
  autoGrowTextarea($("notas"));
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

function actualizarEtiquetasMonedaItems(tipo){
  const moneda = etiquetaMonedaDocumento(tipo || $("tipoDocumento")?.value || data.tipo);

  const precio = $("thPrecioItem");
  const total = $("thTotalItem");

  if(precio) precio.textContent = `P. Unit (${moneda})`;
  if(total) total.textContent = `Total (${moneda})`;
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
  actualizarEtiquetasMonedaItems(tipo);

  const formato = n => monedaDocumento(n,tipo,2);

  const subtotalEl = $("subtotal");
  const ivaEl = $("iva");
  const totalEl = $("total");

  if(subtotalEl) subtotalEl.textContent = formato(t.subtotal);
  if(ivaEl) ivaEl.textContent = formato(t.iva);
  if(totalEl) totalEl.textContent = formato(t.total);
}

function updateItemVisualTotal(index){
  const item = data.items[index];
  if(!item) return;

  const tipo = $("tipoDocumento")?.value || data.tipo;
  const total = itemTotal(item);
  const totalTxt = monedaDocumento(total,tipo,2);

  document.querySelectorAll(`[data-total-index="${index}"]`).forEach(el => {
    if(el.tagName === "INPUT"){
      el.value = totalTxt;
    }else{
      el.textContent = totalTxt;
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

function procesarImagenCotizador(file,maxPx=100){
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

function crearRegistroImagen(file,img){
  return {
    name:file?.name || "imagen",
    src:img.src,
    width:img.width,
    height:img.height,
    mime:img.mime
  };
}

function getImagenesItem(item){
  if(!item || item.kind !== "image") return [];

  if(Array.isArray(item.images) && item.images.length){
    return item.images.filter(img => img && img.src);
  }

  if(item.src){
    return [{
      name:item.name || "imagen",
      src:item.src,
      width:item.width,
      height:item.height,
      mime:item.mime
    }];
  }

  return [];
}

function sincronizarImagenPrincipal(item){
  if(!item || item.kind !== "image") return item;

  const imagenes = getImagenesItem(item);
  item.images = imagenes;

  const primera = imagenes[0];

  item.name = primera?.name || item.name || "imagen";
  item.src = primera?.src || "";
  item.width = primera?.width || 0;
  item.height = primera?.height || 0;
  item.mime = primera?.mime || "";

  return item;
}

async function procesarArchivosImagen(files){
  const lista = Array.from(files || []).filter(file => file && String(file.type || "").startsWith("image/"));

  if(!lista.length){
    throw new Error("Selecciona un archivo de imagen válido.");
  }

  const imagenes = [];

  for(const file of lista){
    const img = await procesarImagenCotizador(file,100);
    imagenes.push(crearRegistroImagen(file,img));
  }

  return imagenes;
}

function addImageItem(){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.top = "-9999px";
  document.body.appendChild(input);

  input.addEventListener("change", async () => {
    if(!input.files || !input.files.length){
      input.remove();
      return;
    }

    try{
      guardarEstadoDeshacer();
      const imagenes = await procesarArchivosImagen(input.files);
      const primera = imagenes[0] || {};

      data.items.push(sincronizarImagenPrincipal({
        kind:"image",
        desc:"",
        images:imagenes,
        name:primera.name || "imagen",
        src:primera.src || "",
        width:primera.width || 0,
        height:primera.height || 0,
        mime:primera.mime || ""
      }));

      render();
      showToast(imagenes.length > 1 ? "Imágenes añadidas" : "Imagen añadida", "ok");
    }catch(error){
      console.error(error);
      showToast(error.message || "No se pudo añadir la imagen", "err");
    }finally{
      input.remove();
    }
  });

  input.click();
}

async function cambiarImagenItem(index,file,pos=0){
  if(!data.items[index] || data.items[index].kind !== "image" || !file) return;

  try{
    guardarEstadoDeshacer();
    const img = await procesarImagenCotizador(file,100);
    const imagenes = getImagenesItem(data.items[index]);

    imagenes[pos] = crearRegistroImagen(file,img);

    data.items[index] = sincronizarImagenPrincipal({
      ...data.items[index],
      images:imagenes
    });

    render();
    showToast("Imagen actualizada", "ok");
  }catch(error){
    console.error(error);
    showToast(error.message || "No se pudo cambiar la imagen", "err");
  }
}

async function agregarImagenAlMismoRenglon(index,files){
  if(!data.items[index] || data.items[index].kind !== "image") return;

  try{
    guardarEstadoDeshacer();
    const nuevas = await procesarArchivosImagen(files);
    const imagenes = getImagenesItem(data.items[index]).concat(nuevas);

    data.items[index] = sincronizarImagenPrincipal({
      ...data.items[index],
      images:imagenes
    });

    render();
    showToast(nuevas.length > 1 ? "Imágenes añadidas al renglón" : "Imagen añadida al renglón", "ok");
  }catch(error){
    console.error(error);
    showToast(error.message || "No se pudo añadir la imagen", "err");
  }
}

function eliminarImagenDelRenglon(index,pos){
  if(!data.items[index] || data.items[index].kind !== "image") return;

  const imagenes = getImagenesItem(data.items[index]);

  if(imagenes.length <= 1){
    showToast("Debe quedar al menos una imagen en el renglón", "warn");
    return;
  }

  guardarEstadoDeshacer();
  imagenes.splice(pos,1);

  data.items[index] = sincronizarImagenPrincipal({
    ...data.items[index],
    images:imagenes
  });

  render();
  showToast("Imagen eliminada", "ok");
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
    descripcion_archivo: cleanText($("descripcionArchivo")?.value || ""),
    mostrar_monto_final: $("mostrarMontoFinal") ? $("mostrarMontoFinal").checked : true,
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
      descripcion_archivo: $("descripcionArchivo")?.value || "",
      mostrar_monto_final: $("mostrarMontoFinal") ? $("mostrarMontoFinal").checked : true,
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
  setValueDeshacer("descripcionArchivo",f.descripcion_archivo || "");
  setValueDeshacer("mostrarMontoFinal",f.mostrar_monto_final !== false);
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
  const tipoEl = $("tipoDocumento");
  const responsableEl = $("responsable");
  const tbody = $("tbody");
  const mobile = $("mobileItems");

  if(!tipoEl || !responsableEl || !tbody || !mobile){
    console.warn("Render cotizador detenido: faltan elementos base del formulario.");
    return;
  }

  if(!Array.isArray(data.items) || !data.items.length){
    data.items = [{ kind:"item", desc:"", qty:1, price:0 }];
  }

  data.tipo = tipoEl.value || data.tipo || "Cotización";
  data.responsable = responsableEl.value || data.responsable || "";

  const banner = $("banner");
  const creditName = $("creditName");
  if(banner) banner.textContent = data.tipo;
  if(creditName) creditName.textContent = data.responsable;

  actualizarEtiquetaIva(data.tipo);
  actualizarEtiquetasMonedaItems(data.tipo);
  aplicarModoNumeroDocumento(data.tipo, false);

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
      const imagenes = getImagenesItem(item);
      const imagenesHtml = imagenes.length
        ? `<div class="quote-image-list">${imagenes.map((img,pos) => `
            <div class="quote-image-slot">
              <img class="quote-image-preview" src="${html(img.src)}" alt="${html(img.name || "Imagen")}">
              <label class="image-change-mini" title="Cambiar esta imagen">
                Cambiar
                <input type="file" accept="image/*" data-image-index="${index}" data-image-pos="${pos}">
              </label>
              ${imagenes.length > 1 ? `<button class="image-remove-mini" data-image-remove-index="${index}" data-image-remove-pos="${pos}" type="button" title="Quitar esta imagen">×</button>` : ""}
            </div>
          `).join("")}</div>`
        : `<div class="quote-image-list"><div class="image-empty">Imagen pendiente</div></div>`;

      tbody.insertAdjacentHTML("beforeend", `
        <tr class="image-row">
          <td class="num"></td>
          <td colspan="4">
            <div class="quote-image-box">
              <div class="quote-image-actions">
                <label class="btn btn-gray image-picker">
                  + Otra foto
                  <input type="file" accept="image/*" multiple data-image-add-index="${index}">
                </label>
              </div>
              ${imagenesHtml}
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
            <div class="quote-image-box mobile-image-box">
              <div class="quote-image-actions">
                <label class="btn btn-gray image-picker">
                  + Otra foto
                  <input type="file" accept="image/*" multiple data-image-add-index="${index}">
                </label>
              </div>
              ${imagenesHtml}
            </div>
          </div>
        </div>
      `);

      return;
    }

    if(!item.kind) item.kind = "item";

    const number = visibleNumber++;
    const total = itemTotal(item);
    const monedaItem = etiquetaMonedaDocumento(data.tipo);
    const totalItemTexto = monedaDocumento(total,data.tipo,2);

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="num">${number}</td>
        <td class="desc">
          <input value="${html(item.desc)}" placeholder="Descripción" data-index="${index}" data-field="desc">
        </td>
        <td class="center">
          <input type="text" inputmode="decimal" value="${formatoCampoNumero(item.qty,2)}" data-index="${index}" data-field="qty">
        </td>
        <td class="center">
          <input type="text" inputmode="decimal" value="${formatoPrecioUnitario(item.price)}" data-index="${index}" data-field="price">
        </td>
        <td class="center total-cell">
          <input readonly data-total-index="${index}" value="${totalItemTexto}">
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
              <input type="text" inputmode="decimal" value="${formatoCampoNumero(item.qty,2)}" data-index="${index}" data-field="qty">
            </div>

            <div class="field">
              <label>P. Unit (${monedaItem})</label>
              <input type="text" inputmode="decimal" value="${formatoPrecioUnitario(item.price)}" data-index="${index}" data-field="price">
            </div>
          </div>

          <div class="item-total">
            <span>Total ítem</span>
            <b data-total-index="${index}">${totalItemTexto}</b>
          </div>
        </div>
      </div>
    `);
  });

  updateTotals();
  ajustarNotasAuto();
}

/* CLIENTES CORREGIDO */
async function cargarClientesCotizador(){
  if(!validarSupabase()) return;

  /*
    FIX v58:
    Se usa select("*") para traer todos los campos reales de la tabla clientes.
    Antes, si una columna del select no existía, Supabase caía a un fallback
    demasiado básico y el cotizador detectaba el cliente, pero no traía RIF,
    teléfono, correo o dirección para autocompletar.
  */
  let res = await db()
    .from("clientes")
    .select("*")
    .order("nombre", { ascending:true });

  if(res.error){
    console.warn("Clientes select * falló. Probando select compatible:", res.error);

    res = await db()
      .from("clientes")
      .select("id,nombre,tipo_cliente,telefono,correo,rif_cedula,rif,direccion,notas")
      .order("nombre", { ascending:true });
  }

  if(res.error){
    console.warn("Clientes select compatible falló. Probando básico:", res.error);

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
  console.log("Clientes cargados en cotizador:", clientesDB.length, clientesDB[0] || null);

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

  const rif = pickClienteField(cliente, "rif");
  const telefono = pickClienteField(cliente, "telefono");
  const correo = pickClienteField(cliente, "correo");
  const direccion = pickClienteField(cliente, "direccion");

  if($("rif")) $("rif").value = rif;
  if($("telefono")) $("telefono").value = telefono;
  if($("email")) $("email").value = correo;
  if($("direccion")) $("direccion").value = direccion;

  console.log("Cliente autocompletado:", {
    nombre:cliente.nombre || "",
    rif,
    telefono,
    correo,
    direccion
  });

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

  const labelY = y + (opts.labelY || Math.min(3.1, h * 0.38));
  const valueY = y + (opts.valueY || Math.max(6.4, h - 1.6));

  doc.setFont("helvetica","bold");
  doc.setFontSize(opts.labelSize || 4.8);
  doc.setTextColor(107,114,128);
  doc.text(String(label || "").toUpperCase(), x+3, labelY);

  doc.setFont("helvetica", opts.valueBold ? "bold" : "normal");
  doc.setFontSize(opts.valueSize || 6.5);
  doc.setTextColor(17,24,39);

  const lines = doc.splitTextToSize(String(value || "—"), w - 6);
  doc.text(lines.slice(0, opts.maxLines || 1), x+3, valueY);
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
  return formatoMiles(n,decimales);
}

function moneyFacturaPrecio(n){
  return formatoMilesFlexible(n,PRECIO_UNIT_DECIMALES_MAX);
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
  drawTextFactura(doc,"P.U BS",(x3+x4)/2,y+6.1,{ size:10.4, align:"center" });
  drawTextFactura(doc,"SUB TOTAL BS",(x4+right)/2,y+6.1,{ size:10.4, align:"center" });

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
    drawTextFactura(doc,"BS " + moneyFacturaPrecio(price),(x3+x4)/2,rowY+9.4,{ size:9.2, align:"center" });
    drawTextFactura(doc,"BS " + moneyFactura(total,2),right-1,rowY+9.4,{ size:9.2, align:"right" });
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

  if(snapshot.form?.mostrar_monto_final !== false){
    drawFacturaReferenciaTotals(doc,snapshot);
  }

  return doc;
}

function drawPropuestaEconomicaIntro(doc,x,y,w){
  doc.setFont("helvetica","normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55,65,81);

  let ty = y;
  PROPUESTA_ECONOMICA_INTRO.forEach((parrafo,idx) => {
    const lines = doc.splitTextToSize(parrafo,w);
    doc.text(lines,x,ty);
    ty += (lines.length * 4.2) + (idx === 0 ? 3.2 : 0);
  });

  return ty;
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


function splitNotasPdf(doc,text,maxWidth){
  const raw = String(text || "").replace(/\r/g,"").trim();
  if(!raw) return [];

  const bloques = raw.split("\n");
  const lines = [];

  bloques.forEach((bloque,idx) => {
    const t = String(bloque || "").trim();

    if(!t){
      if(lines.length && idx < bloques.length - 1) lines.push("");
      return;
    }

    const wrapped = doc.splitTextToSize(t,maxWidth);

    wrapped.forEach((line,i) => {
      // Sangría visual para líneas continuadas de bullets.
      if(i > 0 && /^[\-•]/.test(t)){
        lines.push("  " + line);
      }else{
        lines.push(line);
      }
    });
  });

  return lines;
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

  // Campos compactos solo para Cotización / Nota de entrega / Propuesta Económica.
  // Factura usa su propio formato en crearDocumentoFacturaPDF() y no se toca.
  const FIELD_H = 8.5;
  const Y_DOC_FIELDS = 50;
  const Y_CLIENT_TITLE = 63.5;
  const Y_CLIENT_LINE = 65;
  const Y_CLIENT_ROW_1 = 67.5;
  const Y_CLIENT_ROW_2 = 78;

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

  drawPdfField(doc,14,Y_DOC_FIELDS,54,FIELD_H,"Fecha",form.fecha || "",{ valueBold:true });
  drawPdfField(doc,71,Y_DOC_FIELDS,62,FIELD_H,"N° Documento",form.numero || "",{ valueBold:true });
  drawPdfField(doc,136,Y_DOC_FIELDS,62,FIELD_H,"Válido hasta",form.vence || "",{ valueBold:true });

  doc.setFont("helvetica","bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...blue);
  doc.text("DATOS DEL CLIENTE",14,Y_CLIENT_TITLE);

  doc.setDrawColor(...line);
  doc.line(14,Y_CLIENT_LINE,W-14,Y_CLIENT_LINE);

  drawPdfField(doc,14,Y_CLIENT_ROW_1,67,FIELD_H,"Cliente",form.cliente || "",{ valueBold:true,valueSize:6.4 });
  drawPdfField(doc,84,Y_CLIENT_ROW_1,55,FIELD_H,"RIF / Cédula",form.rif || "",{ valueSize:6.4 });
  drawPdfField(doc,142,Y_CLIENT_ROW_1,56,FIELD_H,"Teléfono",form.telefono || "",{ valueSize:6.4 });
  drawPdfField(doc,14,Y_CLIENT_ROW_2,67,FIELD_H,"Email",form.email || "",{ valueSize:6.3 });
  drawPdfField(doc,84,Y_CLIENT_ROW_2,114,FIELD_H,"Dirección",form.direccion || "",{ valueSize:5.2, maxLines:2, valueY:5.9 });

  let tableStartY = 93;

  if(esPropuestaEconomicaTipo(form.tipo)){
    tableStartY = drawPropuestaEconomicaIntro(doc,14,91,W-28) + 6;
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
      const imagenes = getImagenesItem(item);

      if(imagenes.length){
        const imageList = imagenes.map(img => {
          const dims = getPdfImageSize(doc,img.src,18,18);

          return {
            src:img.src,
            w:dims.w,
            h:dims.h,
            format:getPdfImageFormat(img.src)
          };
        });

        const maxH = Math.max(...imageList.map(img => img.h),18);

        body.push([{
          content:"",
          colSpan:5,
          imageList,
          styles:{
            minCellHeight:maxH + 8,
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
      formatoCampoNumero(item.qty,2),
      monedaPrecioUnitario(item.price,form.tipo),
      monedaDocumento(total,form.tipo,2)
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

      if(cellData.section !== "body" || !raw) return;

      const imageList = Array.isArray(raw.imageList) && raw.imageList.length
        ? raw.imageList
        : (raw.imageSrc ? [{ src:raw.imageSrc, w:raw.imageW, h:raw.imageH, format:raw.imageFormat || "JPEG" }] : []);

      if(!imageList.length) return;

      try{
        const gap = 3;
        const maxTotalW = Math.max(10,cellData.cell.width - 8);
        const totalOriginalW = imageList.reduce((acc,img) => acc + (img.w || 0),0) + gap * Math.max(0,imageList.length - 1);
        const scale = totalOriginalW > maxTotalW ? maxTotalW / totalOriginalW : 1;
        const totalW = totalOriginalW * scale;
        let imgX = cellData.cell.x + (cellData.cell.width - totalW) / 2;

        imageList.forEach(img => {
          const w = (img.w || 18) * scale;
          const h = (img.h || 18) * scale;
          const imgY = cellData.cell.y + (cellData.cell.height - h) / 2;

          doc.addImage(img.src, img.format || "JPEG", imgX, imgY, w, h, undefined, "FAST");
          imgX += w + gap;
        });
      }catch(error){
        console.warn("No se pudo dibujar la imagen en PDF:", error);
      }
    },

    didDrawPage:() => drawPdfHeaderFooter(doc,footer,form)
  });

  let fy = doc.lastAutoTable.finalY + 6;

  const rightW = 53;
  const rightX = W - 14 - rightW;
  const fullX = 14;
  const fullW = W - 28;
  const rightBoxH = Number(t.iva || 0) > 0 ? 33 : 25;

  /*
    FIX v62:
    Cuando hay muchas Notas / condiciones, el cuadro ya no va en columna izquierda.
    Ahora ocupa el ancho completo del documento para que el texto respete el cuadro
    y no quede comprimido ni pegado al total.
  */
  let totalsY = fy;

  if(form.notas){
    const noteX = fullX + 4;
    const noteInnerW = fullW - 8;
    const noteFontSize = 7.4;
    const noteLineH = 3.45;

    doc.setFont("helvetica","normal");
    doc.setFontSize(noteFontSize);

    const noteLinesAll = splitNotasPdf(doc,form.notas,noteInnerW);
    const maxNoteLines = 30;
    const noteLines = noteLinesAll.slice(0,maxNoteLines);
    const notesH = Math.min(105, Math.max(34, 14 + (noteLines.length * noteLineH) + 5));
    const requiredH = notesH + 7 + rightBoxH;

    if(fy > H - requiredH - 26){
      doc.addPage();
      fy = 20;
    }

    doc.setDrawColor(...line);
    doc.setFillColor(252,252,254);
    doc.roundedRect(fullX,fy,fullW,notesH,3,3,"FD");

    doc.setFont("helvetica","bold");
    doc.setFontSize(7.6);
    doc.setTextColor(...blueDark);
    doc.text("NOTAS / CONDICIONES",noteX,fy+5.7);

    doc.setFont("helvetica","normal");
    doc.setFontSize(noteFontSize);
    doc.setTextColor(70,74,82);

    let noteY = fy + 10.5;
    noteLines.forEach(line => {
      if(noteY <= fy + notesH - 5){
        doc.text(String(line || ""),noteX,noteY);
        noteY += noteLineH;
      }
    });

    if(noteLinesAll.length > noteLines.length){
      doc.setFont("helvetica","bold");
      doc.setFontSize(6.5);
      doc.setTextColor(220,38,38);
      doc.text("Nota recortada por espacio disponible.",noteX,fy+notesH-3.5);
    }

    totalsY = fy + notesH + 7;
  }else{
    if(fy > H - rightBoxH - 26){
      doc.addPage();
      fy = 20;
    }
    totalsY = fy;
  }

  if(form.mostrar_monto_final !== false){
    doc.setDrawColor(...line);
    doc.setFillColor(255,255,255);
    doc.roundedRect(rightX,totalsY,rightW,rightBoxH,3,3,"FD");

    let rowY = totalsY;

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
  }

  drawPdfHeaderFooter(doc,footer,form);

  return doc;
}

function limpiarParteNombreArchivo(valor,max=80){
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9_-]+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_+|_+$/g,"")
    .slice(0,max);
}

function nombreArchivoPDF(snapshot){
  const form = snapshot.form || getForm();

  const tipo = limpiarParteNombreArchivo(form.tipo || "Cotizacion",35) || "Cotizacion";
  const numero = limpiarParteNombreArchivo(form.numero || "sin_numero",35) || "sin_numero";
  const cliente = limpiarParteNombreArchivo(form.cliente || "cliente",60) || "cliente";
  const descripcion = limpiarParteNombreArchivo(form.descripcion_archivo || "",70);

  const partes = [tipo,"Tuttovinilos",numero,cliente];
  if(descripcion) partes.push(descripcion);

  return `${partes.join("_")}.pdf`;
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
      version:6,
      modo:"texto_json_con_pdf_opcional",
      rows:snapshot.items,
      footer:snapshot.footer,
      iva_aplicado:form.iva,
      descripcion_archivo:form.descripcion_archivo || "",
      mostrar_monto_final:form.mostrar_monto_final !== false
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
  let descripcionArchivo = "";
  let mostrarMontoFinal = true;
  let ivaAplicado = Number(reg?.iva || 0) > 0;

  if(Array.isArray(raw)){
    rows = raw;
  }else if(raw && typeof raw === "object"){
    rows = Array.isArray(raw.rows) ? raw.rows : (Array.isArray(raw.items) ? raw.items : []);
    footer = raw.footer || null;
    descripcionArchivo = String(raw.descripcion_archivo || "");
    mostrarMontoFinal = raw.mostrar_monto_final !== false;

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
    descripcion_archivo: descripcionArchivo,
    mostrar_monto_final: mostrarMontoFinal,
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
      const imagenes = getImagenesItem(it);
      const imgs = imagenes.length
        ? `<div class="detail-image-list">${imagenes.map(img => `<img class="detail-image" src="${html(img.src)}" alt="${html(img.name || "Imagen")}">`).join("")}</div>`
        : `<div class="image-empty">Imagen pendiente</div>`;

      return `
        <div class="detail-item">
          <b>Imagen</b>
          ${imgs}
        </div>
      `;
    }

    const numero = itemDetalleNumero++;

    return `
      <div class="detail-item">
        <b>${numero}. ${html(it.desc || "")}</b><br>
        Cant: ${html(formatoCampoNumero(it.qty || 0,2))} · P.Unit: ${monedaPrecioUnitario(it.price || 0,form.tipo)} · Total: ${currencyDocumento(itemTotal(it),form.tipo)}
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
        <b>Responsable:</b> ${html(form.responsable || "")}<br>
        <b>Descripción corta:</b> ${html(form.descripcion_archivo || "—")}<br>
        <b>Monto final en PDF:</b> ${form.mostrar_monto_final !== false ? "Visible" : "Oculto"}
      </div>

      ${itemsHtml || `<div class="empty">Sin ítems</div>`}

      <div class="detail-item">
        <b>Notas:</b><br>
        ${html(form.notas || "—")}
      </div>

      <div class="detail-item">
        <b>Subtotal:</b> ${currencyDocumento(snap.totals.subtotal,form.tipo)}<br>
        <b>IVA:</b> ${currencyDocumento(snap.totals.iva,form.tipo)}<br>
        <b>Total:</b> ${currencyDocumento(snap.totals.total,form.tipo)}
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
  $("descripcionArchivo").value = f.descripcion_archivo || "";
  $("mostrarMontoFinal").checked = f.mostrar_monto_final !== false;
  $("notas").value = f.notas || "";
  ajustarNotasAuto();
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
  $("descripcionArchivo").value = "";
  $("mostrarMontoFinal").checked = true;
  $("notas").value = "";
  ajustarNotasAuto();
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
  if(eventosCotizadorVinculados) return;
  eventosCotizadorVinculados = true;

  document.addEventListener("focusin", e => {
    if(e.target.matches('#panelNueva input,#panelNueva textarea,#panelNueva select,#panelNueva [contenteditable="true"]')){
      guardarEstadoDeshacer();
    }
  });

  document.addEventListener("input", e => {
    if(e.target.id === "notas"){
      autoGrowTextarea(e.target);
    }

    if(e.target.matches("[data-index][data-field]")){
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      const value = e.target.value;

      if(!data.items[index]) return;

      data.items[index][field] =
        field === "qty" || field === "price"
          ? parseNumeroLocal(value)
          : value;

      updateItemVisualTotal(index);
      updateTotals();
    }
  });

  document.addEventListener("blur", e => {
    if(e.target.matches("[data-index][data-field]")){
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;

      if(field === "qty"){
        e.target.value = formatoCampoNumero(data.items[index]?.[field] || 0,2);
      }

      if(field === "price"){
        e.target.value = formatoPrecioUnitario(data.items[index]?.[field] || 0);
      }
    }
  }, true);

  document.addEventListener("change", async e => {
    if(e.target.matches("[data-image-add-index]")){
      await agregarImagenAlMismoRenglon(Number(e.target.dataset.imageAddIndex), e.target.files);
      e.target.value = "";
      return;
    }

    if(e.target.matches("[data-image-index]")){
      await cambiarImagenItem(Number(e.target.dataset.imageIndex), e.target.files && e.target.files[0], Number(e.target.dataset.imagePos || 0));
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
    const removeImg = e.target.closest("[data-image-remove-index]");

    if(removeImg){
      eliminarImagenDelRenglon(Number(removeImg.dataset.imageRemoveIndex), Number(removeImg.dataset.imageRemovePos || 0));
      return;
    }

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
      llenarDatosCliente(cliente);
    }else if(mini){
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
  let interfazLista = false;

  try{
    aplicarMenuDesplegable();
    setResponsableDesdeSesion();

    // Primero se montan botones/eventos y la primera fila.
    // Así la página no queda "muerta" si Supabase, CDN o el consecutivo tardan/fallan.
    bindEvents();
    render();
    updateTotals();
    ajustarNotasAuto();
    interfazLista = true;

    await initDates();

    aplicarModoNumeroDocumento($("tipoDocumento")?.value || data.tipo, false);
    setResponsableDesdeSesion();
    bloquearResponsableSiNoEsRoberto();

    render();
    updateTotals();
    ajustarNotasAuto();

    try{
      await cargarClientesCotizador();
    }catch(errorClientes){
      console.warn("No se pudieron cargar clientes, pero el cotizador sigue activo:", errorClientes);
    }

    try{
      await cargarCotizacionesPrevias();
    }catch(errorPrevias){
      console.warn("No se pudieron cargar cotizaciones previas, pero el cotizador sigue activo:", errorPrevias);
    }

  }catch(error){
    console.error("Error iniciando cotizador:", error);

    if(!interfazLista){
      try{
        bindEvents();
        render();
        updateTotals();
      }catch(errorFallback){
        console.error("No se pudo levantar interfaz básica:", errorFallback);
      }
    }

    showToast("Cotizador activo con modo seguro. Revisa consola si algo no carga.", "warn");
  }finally{
    actualizarBotonDeshacer();
  }
}



document.addEventListener("DOMContentLoaded", iniciarCotizador);

