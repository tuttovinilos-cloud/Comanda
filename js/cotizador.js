console.log("COTIZADOR JS conectado v33 texto-mas-pdf-en-tabla");

const $ = (id) => document.getElementById(id);

let clientesDB = [];
let cotizacionesDB = [];
let cotizacionSeleccionada = null;
let data = {
  tipo:"Cotización",
  responsable:"Ricardo",
  items:[{kind:"item", desc:"", qty:1, price:0}]
};

function db(){ return window.supabaseClient; }

function validarSupabase(){
  if(!db()){
    showToast("No existe conexión Supabase. Revisa js/supabase.js", "err");
    console.error("No existe window.supabaseClient");
    return false;
  }
  return true;
}

function pad2(n){ return String(n).padStart(2,"0"); }
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

async function obtenerSiguienteNumeroDocumento(fechaISO){
  if(!validarSupabase()) return crearNumeroDocumento(1, fechaISO);

  const sufijo = formatoFechaNumero(fechaISO);
  const { data:rows, error } = await db()
    .from("cotizaciones")
    .select("numero")
    .eq("fecha", fechaISO);

  if(error){
    console.warn("No se pudo calcular consecutivo del día:", error);
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

async function initDates(){
  const now = new Date();
  const fecha = todayISO();
  $("fecha").value = fecha;

  const due = new Date(now);
  due.setDate(due.getDate()+5);
  $("vence").value = `${due.getFullYear()}-${pad2(due.getMonth()+1)}-${pad2(due.getDate())}`;

  $("numero").value = await obtenerSiguienteNumeroDocumento(fecha);
}

async function refrescarNumeroPorFecha(){
  const fecha = $("fecha").value || todayISO();
  $("numero").value = await obtenerSiguienteNumeroDocumento(fecha);
}

function currency(n){ return "$" + Number(n || 0).toFixed(2); }
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
  return limpio.split(" ").map(p => p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "").join(" ");
}
function html(v){
  return String(v ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function itemTotal(item){ return Number(item.qty || 0) * Number(item.price || 0); }
function calcularTotales(items = data.items, ivaAplicado = $("ivaCheck")?.checked){
  const subtotal = (items || []).reduce((acc,it)=> acc + (it.kind === "item" ? itemTotal(it) : 0), 0);
  const iva = ivaAplicado ? subtotal * 0.16 : 0;
  return {subtotal, iva, total: subtotal + iva};
}
function totals(){ return calcularTotales(data.items, $("ivaCheck").checked); }
function updateTotals(){
  const t = totals();
  $("subtotal").textContent = currency(t.subtotal);
  $("iva").textContent = currency(t.iva);
  $("total").textContent = currency(t.total);
}
function updateItemVisualTotal(index){
  const item = data.items[index];
  if(!item) return;
  const total = itemTotal(item);
  document.querySelectorAll(`[data-total-index="${index}"]`).forEach(el => {
    if(el.tagName === "INPUT") el.value = total.toFixed(2);
    else el.textContent = currency(total);
  });
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
          <td colspan="4"><input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc" style="text-align:center;font-weight:900;color:var(--azulOsc)"></td>
          <td class="center"><button class="btn btn-red" data-remove="${index}" type="button">✕</button></td>
        </tr>
      `);
      mobile.insertAdjacentHTML("beforeend", `
        <div class="item-card">
          <div class="item-head"><span>Separador</span><button class="btn btn-red" data-remove="${index}" type="button">✕</button></div>
          <div class="item-body"><div class="field"><label>Título de sección</label><input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc"></div></div>
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
        <td class="center"><button class="btn btn-red" data-remove="${index}" type="button">✕</button></td>
      </tr>
    `);
    mobile.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="item-head"><span>Ítem ${number}</span><button class="btn btn-red" data-remove="${index}" type="button">✕</button></div>
        <div class="item-body">
          <div class="field"><label>Descripción</label><input value="${html(item.desc)}" placeholder="Descripción del producto o servicio" data-index="${index}" data-field="desc"></div>
          <div class="item-grid">
            <div class="field"><label>Cantidad</label><input type="number" min="0" step="0.01" value="${item.qty}" data-index="${index}" data-field="qty"></div>
            <div class="field"><label>P. Unit ($)</label><input type="number" min="0" step="0.01" value="${item.price}" data-index="${index}" data-field="price"></div>
          </div>
          <div class="item-total"><span>Total ítem</span><b data-total-index="${index}">${currency(total)}</b></div>
        </div>
      </div>
    `);
  });

  updateTotals();
}

function addItem(){ data.items.push({kind:"item", desc:"", qty:1, price:0}); render(); }
function addSeparator(){ data.items.push({kind:"separator", desc:""}); render(); }
function removeItem(index){
  if(data.items.length <= 1) data.items = [{kind:"item", desc:"", qty:1, price:0}];
  else data.items.splice(index,1);
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
    numero: cleanText($("numero").value || ""),
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
function crearSnapshotActual(){
  const form = getForm();
  const items = JSON.parse(JSON.stringify(data.items || []));
  const t = calcularTotales(items, form.iva);
  return {form, items, totals:t, footer:form.footer};
}

function showToast(msg,type="ok"){
  const t = $("toast");
  if(!t){ alert(msg); return; }
  t.textContent = msg;
  t.className = "toast " + type + " show";
  setTimeout(()=>{ t.className = "toast"; }, 3600);
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
  if(!lista) return;
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
  if(mini) mini.innerHTML = `Cliente encontrado: <b>${html(cliente.nombre)}</b>`;
}
function revisarClienteActual(){
  const nombre = $("cliente").value;
  const cliente = buscarClientePorNombre(nombre);
  const mini = $("clienteMini");
  if(cliente) llenarDatosCliente(cliente);
  else if(mini) mini.innerHTML = nombre.trim() ? `Cliente nuevo: se guardará automáticamente en clientes.` : `Escribe para buscar o crear cliente nuevo.`;
}
async function guardarOActualizarClienteDesdeCotizacion(){
  if(!validarSupabase()) throw new Error("No hay conexión Supabase.");
  const form = getForm();
  const nombre = nombreBonito(form.cliente);
  if(!nombre) throw new Error("Coloca el nombre del cliente.");

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
    if(typeof raw.iva_aplicado === "boolean") ivaAplicado = raw.iva_aplicado;
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
      direccion:"Avenida Universidad, Urbanización La Granja, Edificio Diario El Carabobeño, en el Municipio Naguanagua del estado Carabobo,",
      contacto:"Tel: (0414) 414.30.04 | tuttovinilos@gmail.com",
      preparado_texto:"Documento preparado por:"
    }
  };
  const t = {
    subtotal:Number(reg?.subtotal || calcularTotales(rows, ivaAplicado).subtotal),
    iva:Number(reg?.iva || calcularTotales(rows, ivaAplicado).iva),
    total:Number(reg?.total || calcularTotales(rows, ivaAplicado).total)
  };
  return {form, items:rows, totals:t, footer:form.footer};
}

function crearDocumentoPDF(snapshot = crearSnapshotActual()){
  if(!window.jspdf || !window.jspdf.jsPDF) throw new Error("No cargó la librería PDF.");

  const form = snapshot.form;
  const items = snapshot.items || [];
  const t = snapshot.totals || calcularTotales(items, form.iva);
  const footer = snapshot.footer || form.footer || getFooter();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"letter"});
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(21,59,255); doc.rect(0,0,W,32,"F");
  doc.setFillColor(11,31,122); doc.rect(W*0.56,0,W*0.44,32,"F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text("TUTTO VINILOS",14,13);
  doc.setFont("helvetica","normal"); doc.setFontSize(8);
  doc.text("Tel: 0414-414-3004  |  tuttovinilos@gmail.com",14,20);
  doc.text("RIF: ____________",14,26);
  doc.setFont("helvetica","bold"); doc.setFontSize(10);
  doc.text((form.tipo || "Cotización").toUpperCase() + " N° " + (form.numero || ""), W-14, 13, {align:"right"});
  doc.setFont("helvetica","normal"); doc.setFontSize(8);
  doc.text("Fecha: " + (form.fecha || "—"), W-14, 20, {align:"right"});
  doc.text("Válido hasta: " + (form.vence || "—"), W-14, 26, {align:"right"});

  doc.setFillColor(238,241,255); doc.rect(0,34,W,11,"F");
  doc.setTextColor(11,31,122); doc.setFont("helvetica","bold"); doc.setFontSize(13);
  doc.text((form.tipo || "Cotización").toUpperCase(), W/2, 42, {align:"center"});

  let y = 52;
  doc.setTextColor(21,59,255); doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.text("DATOS DEL CLIENTE",14,y);
  doc.setDrawColor(21,59,255); doc.setLineWidth(.35); doc.line(14,y+1,88,y+1); y += 7;

  const clientRows = [["Cliente:", form.cliente],["RIF / Cédula:", form.rif],["Teléfono:", form.telefono],["Email:", form.email],["Dirección:", form.direccion]].filter(r=>r[1]);
  doc.setFontSize(9);
  clientRows.forEach(([label,value])=>{
    doc.setFont("helvetica","bold"); doc.setTextColor(85,85,85); doc.text(label,14,y);
    doc.setFont("helvetica","normal"); doc.setTextColor(17,17,17);
    const lines = doc.splitTextToSize(String(value || ""),155);
    doc.text(lines,42,y); y += Math.max(6, lines.length*5);
  });
  y += 3;

  let count = 1;
  const body = items.map(item=>{
    if(item.kind === "separator"){
      return [{content:item.desc || "SECCIÓN", colSpan:5, styles:{halign:"center", fontStyle:"bold", fillColor:[224,228,248], textColor:[11,31,122]}}];
    }
    const total = itemTotal(item);
    return [String(count++), item.desc || "", String(item.qty || 0), "$" + Number(item.price || 0).toFixed(2), "$" + total.toFixed(2)];
  });

  doc.autoTable({
    startY:y,
    head:[["#","Descripción del Producto / Servicio","Cant.","P. Unit ($)","Total ($)"]],
    body,
    theme:"grid",
    margin:{left:14,right:14},
    styles:{font:"helvetica",fontSize:8.6,cellPadding:3,textColor:[17,17,17],overflow:"linebreak"},
    headStyles:{fillColor:[238,241,255],textColor:[17,17,17],fontStyle:"bold",halign:"center",fontSize:7.8},
    columnStyles:{0:{halign:"center",cellWidth:12},1:{cellWidth:"auto"},2:{halign:"center",cellWidth:16},3:{halign:"center",cellWidth:26},4:{halign:"center",cellWidth:26,fontStyle:"bold"}},
    alternateRowStyles:{fillColor:[248,249,255]}
  });

  let fy = doc.lastAutoTable.finalY + 6;
  if(fy > H - 68){ doc.addPage(); fy = 18; }
  const rx = W - 76;

  if(form.notas){
    doc.setFillColor(238,241,255); doc.roundedRect(14,fy,rx-20,34,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(11,31,122); doc.text("NOTAS / CONDICIONES:",17,fy+6);
    doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
    const lines = doc.splitTextToSize(form.notas,rx-26); doc.text(lines.slice(0,5),17,fy+12);
  }

  doc.setDrawColor(217,222,234); doc.setFillColor(248,249,255); doc.rect(rx,fy,62,8,"FD");
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(85,85,85); doc.text("Sub Total:",rx+3,fy+5.5);
  doc.setFont("helvetica","bold"); doc.setTextColor(17,17,17); doc.text(currency(t.subtotal),rx+59,fy+5.5,{align:"right"});
  let ry = fy + 8;
  if(Number(t.iva || 0) > 0){
    doc.setFillColor(248,249,255); doc.rect(rx,ry,62,8,"FD");
    doc.setFont("helvetica","normal"); doc.setTextColor(85,85,85); doc.text("IVA 16%:",rx+3,ry+5.5);
    doc.setFont("helvetica","bold"); doc.setTextColor(17,17,17); doc.text(currency(t.iva),rx+59,ry+5.5,{align:"right"});
    ry += 8;
  }
  doc.setFillColor(21,59,255); doc.rect(rx,ry,62,11,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(255,255,255);
  doc.text("TOTAL",rx+3,ry+8); doc.text(currency(t.total),rx+59,ry+8,{align:"right"});

  doc.setFillColor(238,241,255); doc.rect(0,H-24,W,24,"F");
  doc.setFont("helvetica","normal"); doc.setFontSize(7.2); doc.setTextColor(85,85,85);
  const dirLines = doc.splitTextToSize(footer.direccion || "", W-28);
  doc.text(dirLines.slice(0,2), W/2, H-15, {align:"center"});
  doc.text(footer.contacto || "", W/2, H-8, {align:"center"});
  doc.setFontSize(7); doc.setTextColor(150,150,150);
  doc.text((footer.preparado_texto || "Documento preparado por:") + " " + (form.responsable || ""), W/2, H-3, {align:"center"});

  return doc;
}

function nombreArchivoPDF(snapshot){
  const form = snapshot.form || getForm();
  const clientName = (form.cliente || "cliente").replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_").slice(0,60);
  const tipo = (form.tipo || "Cotizacion").replace(/\s+/g,"_");
  return `${tipo}_Tuttovinilos_${form.numero || "sin_numero"}_${clientName}.pdf`;
}


function blobToBase64(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, mime="application/pdf"){
  const clean = String(base64 || "").includes(",") ? String(base64).split(",").pop() : String(base64 || "");
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for(let i=0;i<len;i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {type:mime});
}

function abrirBlobPdf(blob){
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

async function numeroExiste(numero){
  const { data:rows, error } = await db().from("cotizaciones").select("id").eq("numero", numero).limit(1);
  if(error) throw error;
  return (rows || []).length > 0;
}
async function asegurarNumeroDisponible(){
  const form = getForm();
  if(!form.numero){
    $("numero").value = await obtenerSiguienteNumeroDocumento(form.fecha || todayISO());
    return;
  }
  if(await numeroExiste(form.numero)){
    $("numero").value = await obtenerSiguienteNumeroDocumento(form.fecha || todayISO());
  }
}

async function guardarRegistroCotizacionTexto(clienteGuardado, pdfInfo = null){
  const snapshot = crearSnapshotActual();
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
    items: {
      version: 3,
      modo: "texto_json_mas_pdf_base64",
      rows: snapshot.items,
      footer: snapshot.footer,
      iva_aplicado: form.iva
    },
    notas: form.notas,
    subtotal: Number(t.subtotal.toFixed(2)),
    iva: Number(t.iva.toFixed(2)),
    total: Number(t.total.toFixed(2)),
    pdf_path: "",
    pdf_url: ""
  };

  const registroConPdf = {
    ...registroBase,
    pdf_base64: pdfInfo?.base64 || "",
    pdf_mime: pdfInfo?.mime || "application/pdf",
    pdf_nombre: pdfInfo?.nombre || ""
  };

  let res = await db()
    .from("cotizaciones")
    .insert([registroConPdf])
    .select()
    .single();

  if(res.error){
    const msg = String(res.error.message || "");
    const faltaColumnasPdf = msg.includes("pdf_base64") || msg.includes("pdf_mime") || msg.includes("pdf_nombre") || msg.includes("schema cache");
    if(!faltaColumnasPdf) throw res.error;

    console.warn("Faltan columnas PDF en cotizaciones. Guardando solo texto:", res.error);
    res = await db()
      .from("cotizaciones")
      .insert([registroBase])
      .select()
      .single();

    if(res.error) throw res.error;
    showToast("Guardó texto. Para guardar PDF aplica el SQL de columnas PDF.", "warn");
  }

  return res.data;
}

async function createPDF(){
  const btn = $("pdfBtn");
  try{
    if(!validarSupabase()) return;
    let form = getForm();
    if(!form.cliente){ showToast("Coloca el nombre del cliente", "err"); return; }
    if(!data.items.some(it => it.kind === "item" && cleanText(it.desc))){ showToast("Agrega al menos un ítem con descripción", "err"); return; }

    btn.classList.add("loading"); btn.disabled = true;

    await asegurarNumeroDisponible();
    form = getForm();
    const clienteGuardado = await guardarOActualizarClienteDesdeCotizacion();

    const snapshot = crearSnapshotActual();
    const doc = crearDocumentoPDF(snapshot);
    const pdfBlob = doc.output("blob");
    const pdfNombre = nombreArchivoPDF(snapshot);
    const pdfBase64 = await blobToBase64(pdfBlob);

    await guardarRegistroCotizacionTexto(clienteGuardado, {
      base64: pdfBase64,
      mime: "application/pdf",
      nombre: pdfNombre
    });

    doc.save(pdfNombre);

    showToast("Cotización guardada con texto + PDF en Supabase", "ok");
    await cargarCotizacionesPrevias();
    await refrescarNumeroPorFecha();
  }catch(err){
    console.error(err);
    showToast("Error: " + (err.message || err), "err");
  }finally{
    btn.classList.remove("loading"); btn.disabled = false;
  }
}

async function cargarCotizacionesPrevias(){
  if(!validarSupabase()) return;
  const body = $("cotizacionesBody");
  if(body) body.innerHTML = `<tr><td colspan="6" class="empty">Cargando...</td></tr>`;

  const { data:rows, error } = await db()
    .from("cotizaciones")
    .select("id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_nombre,pdf_mime,created_at")
    .order("created_at", { ascending:false })
    .limit(150);

  if(error){
    console.error("Error cargando cotizaciones:", error);
    if(body) body.innerHTML = `<tr><td colspan="6" class="empty">Error cargando cotizaciones</td></tr>`;
    showToast("Error cargando cotizaciones", "err");
    return;
  }
  cotizacionesDB = rows || [];
  renderCotizacionesPrevias();
}
function renderCotizacionesPrevias(){
  const body = $("cotizacionesBody");
  if(!body) return;
  const q = normalizar($("buscarCotizaciones")?.value || "");
  let lista = [...cotizacionesDB];
  if(q){
    lista = lista.filter(c => normalizar([c.fecha,c.numero,c.cliente,c.telefono,c.total,c.tipo_documento].join(" ")).includes(q));
  }
  if(!lista.length){
    body.innerHTML = `<tr><td colspan="6" class="empty">Sin cotizaciones</td></tr>`;
    return;
  }
  body.innerHTML = lista.map(c => `
    <tr>
      <td>${html(c.fecha || "")}</td>
      <td><b>${html(c.numero || "")}</b></td>
      <td>${html(c.cliente || "")}</td>
      <td>${html(c.telefono || "")}</td>
      <td><b>${currency(c.total || 0)}</b></td>
      <td class="center">
        <button class="mini-btn dark" type="button" data-ver-cot="${Number(c.id)}">Abrir</button>
        <button class="mini-btn" type="button" data-pdf-cot="${Number(c.id)}">${c.pdf_nombre ? "Abrir PDF" : "Generar PDF"}</button>
      </td>
    </tr>
  `).join("");
}
function buscarCotizacionPorId(id){ return cotizacionesDB.find(c => Number(c.id) === Number(id)) || null; }

async function obtenerCotizacionCompleta(id){
  let reg = buscarCotizacionPorId(id);
  if(reg && Object.prototype.hasOwnProperty.call(reg, "pdf_base64")) return reg;

  const { data:full, error } = await db()
    .from("cotizaciones")
    .select("id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_base64,pdf_mime,pdf_nombre,created_at")
    .eq("id", id)
    .single();

  if(error) throw error;
  if(full){
    cotizacionesDB = cotizacionesDB.map(c => Number(c.id) === Number(id) ? {...c, ...full} : c);
    return full;
  }
  return reg;
}
function abrirDetalleCotizacion(id){
  const reg = buscarCotizacionPorId(id);
  if(!reg){ showToast("No se encontró la cotización", "err"); return; }
  cotizacionSeleccionada = reg;
  const snap = normalizarSnapshotDesdeRegistro(reg);
  const form = snap.form;
  $("detalleTitle").textContent = `${form.tipo || "Cotización"} · ${form.numero || ""}`;
  const itemsHtml = (snap.items || []).map((it, i) => {
    if(it.kind === "separator") return `<div class="detail-item"><b>${html(it.desc || "SECCIÓN")}</b></div>`;
    return `<div class="detail-item"><b>${i+1}. ${html(it.desc || "")}</b><br>Cant: ${html(it.qty || 0)} · P.Unit: ${currency(it.price || 0)} · Total: ${currency(itemTotal(it))}</div>`;
  }).join("");
  $("detalleBody").innerHTML = `
    <div class="detail-list">
      <div class="detail-item"><b>Cliente:</b> ${html(form.cliente || "")}<br><b>Teléfono:</b> ${html(form.telefono || "")}<br><b>Correo:</b> ${html(form.email || "")}<br><b>Dirección:</b> ${html(form.direccion || "")}</div>
      <div class="detail-item"><b>Fecha:</b> ${html(form.fecha || "")} · <b>Vence:</b> ${html(form.vence || "")}<br><b>Responsable:</b> ${html(form.responsable || "")}</div>
      ${itemsHtml || `<div class="empty">Sin ítems</div>`}
      <div class="detail-item"><b>Notas:</b><br>${html(form.notas || "—")}</div>
      <div class="detail-item"><b>Subtotal:</b> ${currency(snap.totals.subtotal)}<br><b>IVA:</b> ${currency(snap.totals.iva)}<br><b>Total:</b> ${currency(snap.totals.total)}</div>
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
    if(!base){ showToast("No se encontró la cotización", "err"); return; }

    const reg = await obtenerCotizacionCompleta(base.id);

    if(reg?.pdf_base64){
      const blob = base64ToBlob(reg.pdf_base64, reg.pdf_mime || "application/pdf");
      abrirBlobPdf(blob);
      showToast("PDF guardado abierto", "ok");
      return;
    }

    const snap = normalizarSnapshotDesdeRegistro(reg);
    const doc = crearDocumentoPDF(snap);
    doc.save(nombreArchivoPDF(snap));
    showToast("Esta cotización no tenía PDF guardado; se generó desde el texto", "warn");
  }catch(error){
    console.error(error);
    showToast("No se pudo abrir/generar el PDF", "err");
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
  if(f.footer){
    $("footerDireccion").innerText = f.footer.direccion || $("footerDireccion").innerText;
    $("footerContacto").innerText = f.footer.contacto || $("footerContacto").innerText;
    $("footerPreparadoTexto").innerText = f.footer.preparado_texto || $("footerPreparadoTexto").innerText;
  }
  data.items = JSON.parse(JSON.stringify(snap.items && snap.items.length ? snap.items : [{kind:"item", desc:"", qty:1, price:0}]));
  render();
  cerrarDetalle();
  activarTab("nueva");
  showToast("Cotización cargada para editar", "ok");
}

function clearAll(){
  if(!confirm("¿Seguro que deseas limpiar todo?")) return;
  data.items = [{kind:"item", desc:"", qty:1, price:0}];
  $("cliente").value = ""; $("rif").value = ""; $("telefono").value = ""; $("email").value = ""; $("direccion").value = ""; $("notas").value = ""; $("ivaCheck").checked = false;
  $("clienteMini").textContent = "Escribe para buscar o crear cliente nuevo.";
  initDates().then(()=>{ render(); updateTotals(); });
}
function setResponsableDesdeSesion(){
  try{
    if(typeof window.getSesionOperador !== "function") return;
    const op = window.getSesionOperador();
    const nombre = op?.nombre || "";
    if(!nombre) return;
    const select = $("responsable");
    const existe = [...select.options].some(o => normalizar(o.value) === normalizar(nombre));
    if(!existe){ const opt = document.createElement("option"); opt.value = nombre; opt.textContent = "👤 " + nombre; select.appendChild(opt); }
    select.value = [...select.options].find(o => normalizar(o.value) === normalizar(nombre))?.value || select.value;
  }catch(error){ console.warn("No se pudo tomar responsable desde sesión", error); }
}
function activarTab(cual){
  const nueva = cual === "nueva";
  $("tabNueva").classList.toggle("active", nueva);
  $("tabPrevias").classList.toggle("active", !nueva);
  $("panelNueva").classList.toggle("active", nueva);
  $("panelPrevias").classList.toggle("active", !nueva);
  if(!nueva) cargarCotizacionesPrevias();
}
function bindEvents(){
  document.addEventListener("input", (e)=>{
    if(e.target.matches("[data-index][data-field]")){
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      const value = e.target.value;
      if(!data.items[index]) return;
      if(field === "qty" || field === "price") data.items[index][field] = Number(value || 0);
      else data.items[index][field] = value;
      updateItemVisualTotal(index);
      updateTotals();
    }
  });
  document.addEventListener("change", async (e)=>{
    if(e.target.id === "tipoDocumento" || e.target.id === "responsable") render();
    if(e.target.id === "ivaCheck") updateTotals();
    if(e.target.id === "fecha") await refrescarNumeroPorFecha();
  });
  document.addEventListener("click", (e)=>{
    const remove = e.target.closest("[data-remove]");
    if(remove){ removeItem(Number(remove.dataset.remove)); return; }
    const ver = e.target.closest("[data-ver-cot]");
    if(ver){ abrirDetalleCotizacion(Number(ver.dataset.verCot)); return; }
    const pdf = e.target.closest("[data-pdf-cot]");
    if(pdf){ generarPdfDesdeCotizacion(Number(pdf.dataset.pdfCot)); return; }
  });

  $("cliente").addEventListener("change", revisarClienteActual);
  $("cliente").addEventListener("blur", revisarClienteActual);
  $("cliente").addEventListener("input", ()=>{
    const mini = $("clienteMini");
    const cliente = buscarClientePorNombre($("cliente").value);
    if(cliente) mini.innerHTML = `Cliente encontrado: <b>${html(cliente.nombre)}</b>`;
    else mini.textContent = $("cliente").value.trim() ? "Cliente nuevo: se guardará automáticamente en clientes." : "Escribe para buscar o crear cliente nuevo.";
  });

  $("addItem").addEventListener("click", addItem);
  $("addSep").addEventListener("click", addSeparator);
  $("pdfBtn").addEventListener("click", createPDF);
  $("printBtn").addEventListener("click", ()=>window.print());
  $("clearBtn").addEventListener("click", clearAll);
  $("tabNueva").addEventListener("click", ()=>activarTab("nueva"));
  $("tabPrevias").addEventListener("click", ()=>activarTab("previas"));
  $("recargarCotizaciones").addEventListener("click", cargarCotizacionesPrevias);
  $("buscarCotizaciones").addEventListener("input", renderCotizacionesPrevias);
  $("cerrarDetalle").addEventListener("click", cerrarDetalle);
  $("detalleBackdrop").addEventListener("click", (e)=>{ if(e.target.id === "detalleBackdrop") cerrarDetalle(); });
  $("pdfDetalle").addEventListener("click", ()=>generarPdfDesdeCotizacion());
  $("cargarDetalleForm").addEventListener("click", cargarCotizacionEnFormulario);
}
async function iniciarCotizador(){
  setResponsableDesdeSesion();
  await initDates();
  render();
  bindEvents();
  await cargarClientesCotizador();
  await cargarCotizacionesPrevias();
}
document.addEventListener("DOMContentLoaded", iniciarCotizador);
