console.log("COTIZADOR JS conectado v30");

const COTIZACIONES_BUCKET = "cotizaciones";
const COTIZADOR_FOOTER_KEY = "tutto_cotizador_footer_v1";
const FOOTER_DEFAULTS = {
  address:"Avenida Universidad, Urbanización La Granja, Edificio Diario El Carabobeño, en el Municipio Naguanagua del estado Carabobo,",
  contact:"Tel: (0414) 414.30.04 | tuttovinilos@gmail.com",
  preparedLabel:"Documento preparado por:"
};

const $ = (id) => document.getElementById(id);

let clientesDB = [];
let cotizacionesPreviasDB = [];
let data = {
  tipo:"Cotización",
  responsable:"Ricardo",
  items:[
    {kind:"item", desc:"", qty:1, price:0}
  ]
};

function db(){
  return window.supabaseClient;
}

function validarSupabase(){
  if(!db()){
    showToast("No existe conexión Supabase. Revisa js/supabase.js", "err");
    console.error("No existe window.supabaseClient");
    return false;
  }
  return true;
}

function fechaLocalISO(date = new Date()){
  const d = new Date(date);
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function sumarDiasISO(fechaISO, dias){
  const [y,m,d] = String(fechaISO).split("-").map(Number);
  const base = new Date(y, (m || 1) - 1, d || 1);
  base.setDate(base.getDate() + dias);
  return fechaLocalISO(base);
}

function formatoNumeroDocumento(secuencia, fechaISO){
  const [y,m,d] = String(fechaISO || fechaLocalISO()).split("-");
  return `${String(secuencia).padStart(2,"0")}-${d}-${m}-${y}`;
}

function extraerSecuenciaDocumento(numero, fechaISO){
  const [y,m,d] = String(fechaISO || "").split("-");
  const re = new RegExp(`^(\\d{2})-${d}-${m}-${y}$`);
  const match = String(numero || "").match(re);
  return match ? Number(match[1]) : 0;
}

function initDates(){
  const hoy = fechaLocalISO();
  $("fecha").value = hoy;
  $("vence").value = sumarDiasISO(hoy, 5);
  $("numero").value = formatoNumeroDocumento(1, hoy);
}

async function generarNumeroDocumentoDelDia(){
  const fecha = $("fecha").value || fechaLocalISO();

  if(!validarSupabase()){
    $("numero").value = formatoNumeroDocumento(1, fecha);
    return $("numero").value;
  }

  const { data:docs, error } = await db()
    .from("cotizaciones")
    .select("numero")
    .eq("fecha", fecha);

  if(error){
    console.warn("No se pudo calcular número automático:", error);
    $("numero").value = formatoNumeroDocumento(1, fecha);
    return $("numero").value;
  }

  const mayor = (docs || []).reduce((max, row) => {
    return Math.max(max, extraerSecuenciaDocumento(row.numero, fecha));
  }, 0);

  $("numero").value = formatoNumeroDocumento(mayor + 1, fecha);
  return $("numero").value;
}

async function asegurarNumeroDocumentoDisponible(){
  const fecha = $("fecha").value || fechaLocalISO();
  let numero = cleanText($("numero").value);

  if(!numero){
    return await generarNumeroDocumentoDelDia();
  }

  const { data:existe, error } = await db()
    .from("cotizaciones")
    .select("id")
    .eq("fecha", fecha)
    .eq("numero", numero)
    .limit(1);

  if(error){
    console.warn("No se pudo verificar número de documento:", error);
    return numero;
  }

  if(existe && existe.length){
    numero = await generarNumeroDocumentoDelDia();
    showToast(`Número ya usado. Se asignó ${numero}`, "ok");
  }

  return numero;
}

function currency(n){
  return "$" + Number(n || 0).toFixed(2);
}

function cleanText(v){
  return String(v || "").trim();
}

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

  return limpio
    .split(" ")
    .map(p => p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "")
    .join(" ");
}

function html(v){
  return String(v || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function textoPlanoEditable(id){
  const el = $(id);
  return cleanText(el ? el.textContent : "");
}

function getFooterInfo(){
  return {
    address: textoPlanoEditable("footerAddress") || FOOTER_DEFAULTS.address,
    contact: textoPlanoEditable("footerContact") || FOOTER_DEFAULTS.contact,
    preparedLabel: textoPlanoEditable("preparedLabel") || FOOTER_DEFAULTS.preparedLabel
  };
}

function guardarFooterInfo(){
  try{
    localStorage.setItem(COTIZADOR_FOOTER_KEY, JSON.stringify(getFooterInfo()));
  }catch(error){
    console.warn("No se pudo guardar footer del cotizador", error);
  }
}

function cargarFooterInfo(){
  try{
    const raw = localStorage.getItem(COTIZADOR_FOOTER_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    const info = {...FOOTER_DEFAULTS, ...saved};

    if($("footerAddress")) $("footerAddress").textContent = info.address;
    if($("footerContact")) $("footerContact").textContent = info.contact;
    if($("preparedLabel")) $("preparedLabel").textContent = info.preparedLabel;
  }catch(error){
    console.warn("No se pudo cargar footer del cotizador", error);
  }
}

function itemTotal(item){
  return Number(item.qty || 0) * Number(item.price || 0);
}

function totals(){
  const subtotal = data.items.reduce((acc,it)=>{
    return acc + (it.kind === "item" ? itemTotal(it) : 0);
  },0);
  const iva = $("ivaCheck").checked ? subtotal * 0.16 : 0;
  return {subtotal, iva, total: subtotal + iva};
}

function syncVisibleItemTotals(){
  document.querySelectorAll("[data-total-index]").forEach(el => {
    const index = Number(el.dataset.totalIndex);
    const item = data.items[index];
    if(!item || item.kind !== "item") return;

    const valor = itemTotal(item);

    if(el.tagName === "INPUT") el.value = valor.toFixed(2);
    else el.textContent = currency(valor);
  });
}

function updateTotals(){
  syncVisibleItemTotals();
  const t = totals();
  $("subtotal").textContent = currency(t.subtotal);
  $("iva").textContent = currency(t.iva);
  $("total").textContent = currency(t.total);
}

function render(){
  data.tipo = $("tipoDocumento").value;
  data.responsable = $("responsable").value;
  $("banner").textContent = data.tipo;
  $("creditName").textContent = data.responsable;

  const tbody = $("tbody");
  const mobile = $("mobileItems");
  tbody.innerHTML = "";
  mobile.innerHTML = "";

  let visibleNumber = 1;

  data.items.forEach((item,index)=>{
    if(item.kind === "separator"){
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td class="num"></td>
          <td colspan="4">
            <input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc" style="text-align:center;font-weight:900;color:var(--azulOsc)">
          </td>
          <td class="center"><button class="btn btn-red" data-remove="${index}">✕</button></td>
        </tr>
      `);

      mobile.insertAdjacentHTML("beforeend", `
        <div class="item-card">
          <div class="item-head">
            <span>Separador</span>
            <button class="btn btn-red" data-remove="${index}">✕</button>
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

    const number = visibleNumber++;
    const total = itemTotal(item);

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="num">${number}</td>
        <td class="desc"><input value="${html(item.desc)}" placeholder="Descripción" data-index="${index}" data-field="desc"></td>
        <td class="center"><input type="number" min="0" step="0.01" value="${item.qty}" data-index="${index}" data-field="qty"></td>
        <td class="center"><input type="number" min="0" step="0.01" value="${item.price}" data-index="${index}" data-field="price"></td>
        <td class="center total-cell"><input readonly data-total-index="${index}" value="${total.toFixed(2)}"></td>
        <td class="center"><button class="btn btn-red" data-remove="${index}">✕</button></td>
      </tr>
    `);

    mobile.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="item-head">
          <span>Ítem ${number}</span>
          <button class="btn btn-red" data-remove="${index}">✕</button>
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
          <div class="item-total"><span>Total ítem</span><b data-total-index="${index}">${currency(total)}</b></div>
        </div>
      </div>
    `);
  });

  updateTotals();
}

function addItem(){
  data.items.push({kind:"item", desc:"", qty:1, price:0});
  render();
}

function addSeparator(){
  data.items.push({kind:"separator", desc:""});
  render();
}

function removeItem(index){
  if(data.items.length <= 1){
    data.items = [{kind:"item", desc:"", qty:1, price:0}];
  }else{
    data.items.splice(index,1);
  }
  render();
}

function getForm(){
  return {
    tipo: $("tipoDocumento").value,
    responsable: $("responsable").value,
    fecha: $("fecha").value,
    numero: cleanText($("numero").value || "001"),
    vence: $("vence").value,
    cliente: nombreBonito($("cliente").value),
    rif: cleanText($("rif").value),
    telefono: cleanText($("telefono").value),
    email: cleanText($("email").value),
    direccion: cleanText($("direccion").value),
    notas: cleanText($("notas").value),
    iva: $("ivaCheck").checked
  };
}

function showToast(msg,type="ok"){
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast " + type + " show";
  setTimeout(()=>{ t.className = "toast"; }, 3200);
}

async function cargarClientesCotizador(){
  if(!validarSupabase()) return;

  const { data:clientes, error } = await db()
    .from("clientes")
    .select("id,nombre,rif_cedula,telefono,correo,direccion,tipo_cliente,notas,activo")
    .order("nombre", { ascending:true });

  if(error){
    console.error("Error cargando clientes:", error);
    showToast("Error cargando clientes", "err");
    return;
  }

  clientesDB = clientes || [];
  renderClientesDatalist();
}

function renderClientesDatalist(){
  const lista = $("clientesList");
  lista.innerHTML = clientesDB
    .filter(c => c.activo !== false)
    .map(c => `<option value="${html(c.nombre || "")}"></option>`)
    .join("");
}

function buscarClientePorNombre(nombre){
  const n = normalizar(nombre);
  if(!n) return null;
  return clientesDB.find(c => normalizar(c.nombre) === n) || null;
}

function llenarDatosCliente(cliente){
  if(!cliente) return;

  $("rif").value = cliente.rif_cedula || "";
  $("telefono").value = cliente.telefono || "";
  $("email").value = cliente.correo || "";
  $("direccion").value = cliente.direccion || "";

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
      ? `Cliente nuevo: se guardará automáticamente en clientes.`
      : `Escribe para buscar o crear cliente nuevo.`;
  }
}

async function guardarOActualizarClienteDesdeCotizacion(){
  if(!validarSupabase()) throw new Error("No hay conexión Supabase.");

  const form = getForm();
  const nombre = nombreBonito(form.cliente);

  if(!nombre){
    throw new Error("Coloca el nombre del cliente.");
  }

  const existente = buscarClientePorNombre(nombre);

  const datosCliente = {
    nombre,
    rif_cedula: form.rif || "",
    telefono: form.telefono || "",
    correo: form.email || "",
    direccion: form.direccion || "",
    tipo_cliente: existente?.tipo_cliente || "Cliente Básico",
    activo: true
  };

  if(existente){
    const { data:actualizado, error } = await db()
      .from("clientes")
      .update(datosCliente)
      .eq("id", existente.id)
      .select()
      .single();

    if(error) throw error;

    const idx = clientesDB.findIndex(c => Number(c.id) === Number(existente.id));
    if(idx >= 0) clientesDB[idx] = actualizado;

    return actualizado;
  }

  const { data:nuevo, error } = await db()
    .from("clientes")
    .insert([datosCliente])
    .select()
    .single();

  if(error) throw error;

  clientesDB.push(nuevo);
  renderClientesDatalist();

  return nuevo;
}

function crearDocumentoPDF(){
  if(!window.jspdf || !window.jspdf.jsPDF){
    throw new Error("No cargó la librería PDF.");
  }

  const form = getForm();
  const t = totals();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"letter"});
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(21,59,255);
  doc.rect(0,0,W,32,"F");
  doc.setFillColor(11,31,122);
  doc.rect(W*0.56,0,W*0.44,32,"F");

  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(18);
  doc.text("TUTTO VINILOS",14,13);
  doc.setFont("helvetica","normal");
  doc.setFontSize(8);
  doc.text(getFooterInfo().contact,14,20);
  doc.text("RIF: ____________",14,26);

  doc.setFont("helvetica","bold");
  doc.setFontSize(10);
  doc.text(form.tipo.toUpperCase() + " N° " + form.numero, W-14, 13, {align:"right"});
  doc.setFont("helvetica","normal");
  doc.setFontSize(8);
  doc.text("Fecha: " + (form.fecha || "—"), W-14, 20, {align:"right"});
  doc.text("Válido hasta: " + (form.vence || "—"), W-14, 26, {align:"right"});

  doc.setFillColor(238,241,255);
  doc.rect(0,34,W,11,"F");
  doc.setTextColor(11,31,122);
  doc.setFont("helvetica","bold");
  doc.setFontSize(13);
  doc.text(form.tipo.toUpperCase(), W/2, 42, {align:"center"});

  let y = 52;
  doc.setTextColor(21,59,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(8);
  doc.text("DATOS DEL CLIENTE",14,y);
  doc.setDrawColor(21,59,255);
  doc.setLineWidth(.35);
  doc.line(14,y+1,88,y+1);
  y += 7;

  const clientRows = [
    ["Cliente:", form.cliente],
    ["RIF / Cédula:", form.rif],
    ["Teléfono:", form.telefono],
    ["Email:", form.email],
    ["Dirección:", form.direccion]
  ].filter(r=>r[1]);

  doc.setFontSize(9);
  clientRows.forEach(([label,value])=>{
    doc.setFont("helvetica","bold");
    doc.setTextColor(85,85,85);
    doc.text(label,14,y);
    doc.setFont("helvetica","normal");
    doc.setTextColor(17,17,17);
    const lines = doc.splitTextToSize(value,155);
    doc.text(lines,42,y);
    y += Math.max(6, lines.length*5);
  });
  y += 3;

  let count = 1;
  const body = data.items.map(item=>{
    if(item.kind === "separator"){
      return [{
        content:item.desc || "SECCIÓN",
        colSpan:5,
        styles:{
          halign:"center",
          fontStyle:"bold",
          fillColor:[224,228,248],
          textColor:[11,31,122]
        }
      }];
    }

    const total = itemTotal(item);
    return [
      String(count++),
      item.desc || "",
      String(item.qty || 0),
      "$" + Number(item.price || 0).toFixed(2),
      "$" + total.toFixed(2)
    ];
  });

  doc.autoTable({
    startY:y,
    head:[["#","Descripción del Producto / Servicio","Cant.","P. Unit ($)","Total ($)"]],
    body,
    theme:"grid",
    margin:{left:14,right:14},
    styles:{
      font:"helvetica",
      fontSize:8.6,
      cellPadding:3,
      textColor:[17,17,17],
      overflow:"linebreak"
    },
    headStyles:{
      fillColor:[238,241,255],
      textColor:[17,17,17],
      fontStyle:"bold",
      halign:"center",
      fontSize:7.8
    },
    columnStyles:{
      0:{halign:"center",cellWidth:12},
      1:{cellWidth:"auto"},
      2:{halign:"center",cellWidth:16},
      3:{halign:"center",cellWidth:26},
      4:{halign:"center",cellWidth:26,fontStyle:"bold"}
    },
    alternateRowStyles:{fillColor:[248,249,255]}
  });

  let fy = doc.lastAutoTable.finalY + 6;
  if(fy > H - 68){
    doc.addPage();
    fy = 18;
  }

  const rx = W - 76;

  if(form.notas){
    doc.setFillColor(238,241,255);
    doc.roundedRect(14,fy,rx-20,34,2,2,"F");
    doc.setFont("helvetica","bold");
    doc.setFontSize(8);
    doc.setTextColor(11,31,122);
    doc.text("NOTAS / CONDICIONES:",17,fy+6);
    doc.setFont("helvetica","normal");
    doc.setTextColor(60,60,60);
    const lines = doc.splitTextToSize(form.notas,rx-26);
    doc.text(lines.slice(0,5),17,fy+12);
  }

  doc.setDrawColor(217,222,234);
  doc.setFillColor(248,249,255);
  doc.rect(rx,fy,62,8,"FD");
  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  doc.setTextColor(85,85,85);
  doc.text("Sub Total:",rx+3,fy+5.5);
  doc.setFont("helvetica","bold");
  doc.setTextColor(17,17,17);
  doc.text(currency(t.subtotal),rx+59,fy+5.5,{align:"right"});

  let ry = fy + 8;
  if(form.iva){
    doc.setFillColor(248,249,255);
    doc.rect(rx,ry,62,8,"FD");
    doc.setFont("helvetica","normal");
    doc.setTextColor(85,85,85);
    doc.text("IVA 16%:",rx+3,ry+5.5);
    doc.setFont("helvetica","bold");
    doc.setTextColor(17,17,17);
    doc.text(currency(t.iva),rx+59,ry+5.5,{align:"right"});
    ry += 8;
  }

  doc.setFillColor(21,59,255);
  doc.rect(rx,ry,62,11,"F");
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.setTextColor(255,255,255);
  doc.text("TOTAL",rx+3,ry+8);
  doc.text(currency(t.total),rx+59,ry+8,{align:"right"});

  doc.setFillColor(238,241,255);
  doc.rect(0,H-26,W,26,"F");
  doc.setFont("helvetica","normal");
  doc.setFontSize(7.5);
  doc.setTextColor(85,85,85);
  const footerInfo = getFooterInfo();
  const addressLines = doc.splitTextToSize(footerInfo.address, W - 24);
  doc.text(addressLines.slice(0,2), W/2, H-15, {align:"center"});
  doc.text(footerInfo.contact, W/2, H-8, {align:"center"});
  doc.setFontSize(7);
  doc.setTextColor(150,150,150);
  doc.text(footerInfo.preparedLabel + " " + form.responsable, W/2, H-3, {align:"center"});

  return doc;
}

function esErrorBucketNoExiste(error){
  const texto = String(error?.message || error?.error || error || "").toLowerCase();
  return texto.includes("bucket not found") || texto.includes("bucket") && texto.includes("not found");
}

async function probarBucketCotizaciones(){
  const dummy = new Blob(["test"], {type:"text/plain"});
  const testPath = `_test_${Date.now()}.txt`;

  const { error } = await db()
    .storage
    .from(COTIZACIONES_BUCKET)
    .upload(testPath, dummy, {upsert:true});

  if(error) throw error;

  await db()
    .storage
    .from(COTIZACIONES_BUCKET)
    .remove([testPath]);
}

async function subirPDFSupabase(doc, form){
  const pdfBlob = doc.output("blob");

  const safeClient = (form.cliente || "cliente")
    .replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_")
    .slice(0,60);

  const safeTipo = (form.tipo || "Documento")
    .replace(/\s+/g,"_")
    .replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_");

  const filePath = `${form.fecha || "sin_fecha"}/${safeTipo}_${form.numero}_${safeClient}.pdf`;

  const { error:uploadError } = await db()
    .storage
    .from(COTIZACIONES_BUCKET)
    .upload(filePath, pdfBlob, {
      contentType:"application/pdf",
      upsert:true
    });

  if(uploadError){
    if(esErrorBucketNoExiste(uploadError)){
      throw new Error(`No existe el bucket de Storage llamado "${COTIZACIONES_BUCKET}". Créalo en Supabase > Storage > New bucket.`);
    }
    throw uploadError;
  }

  const publicData = db()
    .storage
    .from(COTIZACIONES_BUCKET)
    .getPublicUrl(filePath);

  return {
    pdf_path:filePath,
    pdf_url:publicData?.data?.publicUrl || ""
  };
}

async function guardarRegistroCotizacion(clienteGuardado, pdfInfo){
  const form = getForm();
  const t = totals();

  const registro = {
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
    items: data.items,
    notas: form.notas,
    subtotal: Number(t.subtotal.toFixed(2)),
    iva: Number(t.iva.toFixed(2)),
    total: Number(t.total.toFixed(2)),
    pdf_path: pdfInfo.pdf_path,
    pdf_url: pdfInfo.pdf_url
  };

  const { error } = await db()
    .from("cotizaciones")
    .insert([registro]);

  if(error) throw error;

  return registro;
}


async function cargarCotizacionesPrevias(){
  const tbody = $("cotizacionesPreviasBody");
  const info = $("cotizacionesPreviasInfo");

  if(!tbody) return;

  if(!db()){
    tbody.innerHTML = `<tr><td colspan="6" class="prev-empty">Sin conexión Supabase</td></tr>`;
    return;
  }

  tbody.innerHTML = `<tr><td colspan="6" class="prev-empty">Cargando cotizaciones...</td></tr>`;

  const { data:rows, error } = await db()
    .from("cotizaciones")
    .select("id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_path,pdf_url,created_at")
    .order("created_at", { ascending:false })
    .limit(50);

  if(error){
    console.error("Error cargando cotizaciones previas:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="prev-empty">Error cargando cotizaciones</td></tr>`;
    if(info) info.textContent = error.message || "Error en Supabase";
    return;
  }

  cotizacionesPreviasDB = rows || [];
  renderCotizacionesPrevias();
}

function obtenerUrlPDFCotizacion(c){
  if(c?.pdf_url) return c.pdf_url;
  if(c?.pdf_path && db()){
    try{
      const res = db().storage.from(COTIZACIONES_BUCKET).getPublicUrl(c.pdf_path);
      return res?.data?.publicUrl || "";
    }catch(error){
      console.warn("No se pudo generar URL pública del PDF", error);
    }
  }
  return "";
}

function renderCotizacionesPrevias(){
  const tbody = $("cotizacionesPreviasBody");
  const info = $("cotizacionesPreviasInfo");
  const filtro = normalizar($("buscarCotizaciones")?.value || "");

  if(!tbody) return;

  let lista = [...cotizacionesPreviasDB];

  if(filtro){
    lista = lista.filter(c => normalizar([
      c.fecha,
      c.numero,
      c.tipo_documento,
      c.cliente,
      c.telefono,
      c.correo,
      c.total
    ].join(" ")).includes(filtro));
  }

  if(info){
    info.textContent = `${lista.length} cotización${lista.length === 1 ? "" : "es"} mostrada${lista.length === 1 ? "" : "s"}`;
  }

  if(!lista.length){
    tbody.innerHTML = `<tr><td colspan="6" class="prev-empty">No hay cotizaciones guardadas</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const pdfUrl = obtenerUrlPDFCotizacion(c);
    const pdf = pdfUrl
      ? `<a class="prev-link" href="${html(pdfUrl)}" target="_blank" rel="noopener">Abrir PDF</a>`
      : `<span class="prev-link disabled">Sin PDF</span>`;

    return `
      <tr>
        <td>${html(c.fecha || "—")}</td>
        <td><b>${html(c.numero || "—")}</b><div class="prev-muted">${html(c.tipo_documento || "Cotización")}</div></td>
        <td><div class="prev-client">${html(c.cliente || "—")}</div><div class="prev-muted">${html(c.correo || "")}</div></td>
        <td>${html(c.telefono || "—")}</td>
        <td class="prev-total">${currency(c.total || 0)}</td>
        <td>
          <div class="prev-actions">
            ${pdf}
            <button class="prev-btn" type="button" onclick="verDetalleCotizacion(${Number(c.id)})">Detalle</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function parseItemsCotizacion(items){
  if(Array.isArray(items)) return items;
  if(typeof items === "string"){
    try{ return JSON.parse(items) || []; }catch(e){ return []; }
  }
  return [];
}

function verDetalleCotizacion(id){
  const c = cotizacionesPreviasDB.find(row => Number(row.id) === Number(id));
  if(!c){
    showToast("No se encontró la cotización", "err");
    return;
  }

  const modal = $("detalleCotizacionBackdrop");
  const title = $("detalleCotizacionTitle");
  const body = $("detalleCotizacionBody");
  const items = parseItemsCotizacion(c.items);
  const pdfUrl = obtenerUrlPDFCotizacion(c);

  if(title) title.textContent = `${c.tipo_documento || "Cotización"} · ${c.numero || ""}`;

  const filas = items.length ? items.map((it, idx) => {
    if(it.kind === "separator"){
      return `<tr><td colspan="5" style="text-align:center;font-weight:900;color:var(--azulOsc);background:#eef1ff">${html(it.desc || "SECCIÓN")}</td></tr>`;
    }
    const qty = Number(it.qty || 0);
    const price = Number(it.price || 0);
    const total = qty * price;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${html(it.desc || "")}</td>
        <td style="text-align:center">${html(qty)}</td>
        <td style="text-align:right">${currency(price)}</td>
        <td style="text-align:right"><b>${currency(total)}</b></td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="5" class="prev-empty">Sin ítems guardados</td></tr>`;

  if(body){
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-box"><b>Fecha</b>${html(c.fecha || "—")}</div>
        <div class="detail-box"><b>Cliente</b>${html(c.cliente || "—")}</div>
        <div class="detail-box"><b>Total</b>${currency(c.total || 0)}</div>
        <div class="detail-box"><b>RIF / Cédula</b>${html(c.rif_cedula || "—")}</div>
        <div class="detail-box"><b>Teléfono</b>${html(c.telefono || "—")}</div>
        <div class="detail-box"><b>Correo</b>${html(c.correo || "—")}</div>
        <div class="detail-box" style="grid-column:1/-1"><b>Dirección</b>${html(c.direccion || "—")}</div>
      </div>

      <div class="prev-actions">
        ${pdfUrl ? `<a class="prev-link" href="${html(pdfUrl)}" target="_blank" rel="noopener">Abrir PDF guardado</a>` : `<span class="prev-link disabled">PDF no disponible</span>`}
      </div>

      <table class="detail-items">
        <thead>
          <tr><th>#</th><th>Descripción</th><th>Cant.</th><th>P. Unit</th><th>Total</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <div class="summary" style="max-width:340px;margin-left:auto">
        <div class="summary-row"><span>Sub Total</span><b>${currency(c.subtotal || 0)}</b></div>
        <div class="summary-row"><span>IVA</span><b>${currency(c.iva || 0)}</b></div>
        <div class="summary-row final"><span>TOTAL</span><span>${currency(c.total || 0)}</span></div>
      </div>

      ${c.notas ? `<div class="detail-box"><b>Notas</b>${html(c.notas).replaceAll("\n","<br>")}</div>` : ""}
    `;
  }

  if(modal) modal.classList.add("show");
}

function cerrarDetalleCotizacion(){
  const modal = $("detalleCotizacionBackdrop");
  if(modal) modal.classList.remove("show");
}

function cerrarDetalleSiFondo(event){
  if(event.target && event.target.id === "detalleCotizacionBackdrop") cerrarDetalleCotizacion();
}

function cambiarVistaCotizador(vista){
  const esHistorial = vista === "historial";
  const nueva = $("vistaNueva");
  const historial = $("vistaHistorial");
  const tabNueva = $("tabNueva");
  const tabHistorial = $("tabHistorial");

  if(nueva) nueva.classList.toggle("active", !esHistorial);
  if(historial) historial.classList.toggle("active", esHistorial);
  if(tabNueva) tabNueva.classList.toggle("active", !esHistorial);
  if(tabHistorial) tabHistorial.classList.toggle("active", esHistorial);
  document.body.classList.toggle("view-history", esHistorial);

  if(esHistorial) cargarCotizacionesPrevias();
}

async function createPDF(){
  const btn = $("pdfBtn");

  try{
    const form = getForm();

    if(!form.cliente){
      showToast("Coloca el nombre del cliente", "err");
      return;
    }

    if(!data.items.some(it => it.kind === "item" && cleanText(it.desc))){
      showToast("Agrega al menos un ítem con descripción", "err");
      return;
    }

    btn.classList.add("loading");
    btn.disabled = true;

    await asegurarNumeroDocumentoDisponible();
    const formFinal = getForm();

    const clienteGuardado = await guardarOActualizarClienteDesdeCotizacion();
    const doc = crearDocumentoPDF();

    let pdfInfo = { pdf_path:"", pdf_url:"" };
    let pdfSubido = true;

    let bucketFaltante = false;
    try{
      pdfInfo = await subirPDFSupabase(doc, formFinal);
    }catch(uploadError){
      pdfSubido = false;
      bucketFaltante = esErrorBucketNoExiste(uploadError);
      console.warn("PDF no subido a Supabase:", uploadError);
    }

    await guardarRegistroCotizacion(clienteGuardado, pdfInfo);
    await cargarCotizacionesPrevias();

    const clientName = (formFinal.cliente || "cliente").replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_");
    const fileName = formFinal.tipo.replace(/\s+/g,"_") + "_Tuttovinilos_" + clientName + "_" + (formFinal.numero || "sin_numero") + ".pdf";

    doc.save(fileName);

    if(pdfSubido){
      showToast("PDF generado y guardado en Supabase", "ok");
    }else if(bucketFaltante){
      showToast("Cotización guardada y PDF descargado. Falta crear el bucket cotizaciones para guardar el PDF online.", "warn");
    }else{
      showToast("Cotización guardada y PDF descargado. No se pudo subir el PDF online.", "warn");
    }
  }catch(err){
    console.error(err);
    showToast("Error: " + (err.message || err), "err");
  }finally{
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

function clearAll(){
  if(!confirm("¿Seguro que deseas limpiar todo?")) return;

  data.items = [{kind:"item", desc:"", qty:1, price:0}];
  $("cliente").value = "";
  $("rif").value = "";
  $("telefono").value = "";
  $("email").value = "";
  $("direccion").value = "";
  $("notas").value = "";
  $("ivaCheck").checked = false;
  $("clienteMini").textContent = "Escribe para buscar o crear cliente nuevo.";

  initDates();
  render();
  updateTotals();
}

function setResponsableDesdeSesion(){
  try{
    if(typeof window.getSesionOperador !== "function") return;

    const op = window.getSesionOperador();
    const nombre = op?.nombre || "";
    if(!nombre) return;

    const select = $("responsable");
    const existe = [...select.options].some(o => normalizar(o.value) === normalizar(nombre));

    if(!existe){
      const opt = document.createElement("option");
      opt.value = nombre;
      opt.textContent = "👤 " + nombre;
      select.appendChild(opt);
    }

    select.value = [...select.options].find(o => normalizar(o.value) === normalizar(nombre))?.value || select.value;
  }catch(error){
    console.warn("No se pudo tomar responsable desde sesión", error);
  }
}

function bindEvents(){
  document.addEventListener("input", (e)=>{
    if(e.target.matches("[data-index][data-field]")){
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      const value = e.target.value;

      if(field === "qty" || field === "price") data.items[index][field] = Number(value || 0);
      else data.items[index][field] = value;

      updateTotals();
    }
  });

  document.addEventListener("change", (e)=>{
    if(e.target.id === "tipoDocumento" || e.target.id === "responsable") render();
    if(e.target.id === "ivaCheck") updateTotals();
    if(e.target.id === "fecha"){
      $("vence").value = sumarDiasISO($("fecha").value, 5);
      generarNumeroDocumentoDelDia();
    }
  });

  document.addEventListener("click", (e)=>{
    const remove = e.target.closest("[data-remove]");
    if(remove){
      removeItem(Number(remove.dataset.remove));
    }
  });

  $("cliente").addEventListener("change", revisarClienteActual);
  $("cliente").addEventListener("blur", revisarClienteActual);
  $("cliente").addEventListener("input", ()=>{
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

  ["footerAddress","footerContact","preparedLabel"].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener("input", guardarFooterInfo);
  });

  $("addItem").addEventListener("click", addItem);
  $("addSep").addEventListener("click", addSeparator);
  $("pdfBtn").addEventListener("click", createPDF);
  $("printBtn").addEventListener("click", ()=>window.print());
  $("clearBtn").addEventListener("click", clearAll);

  const buscarCotizaciones = $("buscarCotizaciones");
  if(buscarCotizaciones) buscarCotizaciones.addEventListener("input", renderCotizacionesPrevias);

  const refreshCotizaciones = $("refreshCotizaciones");
  if(refreshCotizaciones) refreshCotizaciones.addEventListener("click", cargarCotizacionesPrevias);

  document.querySelectorAll("[data-vista]").forEach(btn => {
    btn.addEventListener("click", () => cambiarVistaCotizador(btn.dataset.vista));
  });
}

async function iniciarCotizador(){
  setResponsableDesdeSesion();
  cargarFooterInfo();
  initDates();
  render();
  bindEvents();
  await cargarClientesCotizador();
  await generarNumeroDocumentoDelDia();
  await cargarCotizacionesPrevias();
}

document.addEventListener("DOMContentLoaded", iniciarCotizador);
