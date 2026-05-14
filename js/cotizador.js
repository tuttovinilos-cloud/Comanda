console.log("COTIZADOR JS conectado v25");

const $ = (id) => document.getElementById(id);

let clientesDB = [];
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

function initDates(){
  const now = new Date();
  $("fecha").valueAsDate = now;

  const due = new Date(now);
  due.setDate(due.getDate()+5);
  $("vence").valueAsDate = due;

  generarNumeroDocumento();
}

function generarNumeroDocumento(){
  const d = new Date();
  const pad = n => String(n).padStart(2,"0");
  const numero = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getDate())}${pad(d.getMonth()+1)}${d.getFullYear()}`;
  $("numero").value = numero;
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

function updateTotals(){
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
        <td class="center total-cell"><input readonly value="${total.toFixed(2)}"></td>
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
          <div class="item-total"><span>Total ítem</span><b>${currency(total)}</b></div>
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
  doc.text("Tel: 0414-414-3004  |  tuttovinilos@hotmail.com",14,20);
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
  doc.rect(0,H-22,W,22,"F");
  doc.setFont("helvetica","normal");
  doc.setFontSize(7.5);
  doc.setTextColor(85,85,85);
  doc.text("Calle 137-A. Edif. Res. Madrid, Piso 2, Apto. 2C – Torre 1. Urb. Prebo 2, Valencia – Edo. Carabobo",W/2,H-13,{align:"center"});
  doc.text("Tel: (0414) 414.30.04  |  tuttovinilos@hotmail.com",W/2,H-8,{align:"center"});
  doc.setFontSize(7);
  doc.setTextColor(150,150,150);
  doc.text("Documento preparado por " + form.responsable + " · Tutto Vinilos",W/2,H-3,{align:"center"});

  return doc;
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
    .from("cotizaciones")
    .upload(filePath, pdfBlob, {
      contentType:"application/pdf",
      upsert:true
    });

  if(uploadError) throw uploadError;

  const publicData = db()
    .storage
    .from("cotizaciones")
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

    const clienteGuardado = await guardarOActualizarClienteDesdeCotizacion();
    const doc = crearDocumentoPDF();
    const pdfInfo = await subirPDFSupabase(doc, form);
    await guardarRegistroCotizacion(clienteGuardado, pdfInfo);

    const clientName = (form.cliente || "cliente").replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_");
    const fileName = form.tipo.replace(/\s+/g,"_") + "_Tuttovinilos_" + clientName + "_" + (form.fecha || "sin_fecha") + ".pdf";

    doc.save(fileName);
    showToast("PDF generado y guardado en Supabase", "ok");
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

  $("addItem").addEventListener("click", addItem);
  $("addSep").addEventListener("click", addSeparator);
  $("pdfBtn").addEventListener("click", createPDF);
  $("printBtn").addEventListener("click", ()=>window.print());
  $("clearBtn").addEventListener("click", clearAll);
}

async function iniciarCotizador(){
  setResponsableDesdeSesion();
  initDates();
  render();
  bindEvents();
  await cargarClientesCotizador();
}

document.addEventListener("DOMContentLoaded", iniciarCotizador);
