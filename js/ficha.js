/* =========================================================
   FICHA · TUTTOVINILOS
   JS separado, con validación, debounce, backup y PDF.
========================================================= */

let ficha = { items: [], faltantes: [] };

const $ = id => document.getElementById(id);

const campos = [
  "codigo",
  "cliente",
  "fechaEntrega",
  "proyecto",
  "estado",
  "sede",
  "observacionesCriticas"
];

const ValidationRules = {
  cliente: {
    required: true,
    minLength: 2,
    message: "Cliente / empresa requerido."
  },
  proyecto: {
    required: true,
    minLength: 3,
    message: "Nombre del proyecto requerido."
  },
  fechaEntrega: {
    required: true,
    message: "Fecha de entrega requerida."
  },
  sede: {
    required: true,
    minLength: 2,
    message: "Sede o lugar requerido."
  }
};

const BackupManager = {
  KEY: "fichasTV_backup",

  init(){
    setInterval(() => this.backup(), 120000);
  },

  backup(){
    try{
      recolectar();
      const data = {
        data: ficha,
        timestamp: new Date().toISOString(),
        version: "1.0"
      };
      localStorage.setItem(this.KEY, JSON.stringify(data));
    }catch(err){
      console.warn("Backup no realizado", err);
    }
  },

  restore(){
    const raw = localStorage.getItem(this.KEY);
    if(!raw) return null;

    try{
      return JSON.parse(raw);
    }catch{
      return null;
    }
  }
};

function debounce(fn, wait = 250){
  let timer;
  return function(...args){
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

const debouncedRender = debounce(() => renderPaper(), 180);

function showToast(message, type = "info"){
  let toast = document.querySelector(".ficha-toast");

  if(!toast){
    toast = document.createElement("div");
    toast.className = "ficha-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `ficha-toast ${type}`;

  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function insertarFichaMenu(){
  const menu = document.getElementById("authMenu");
  if(!menu) return;

  if(menu.querySelector('a[href="ficha.html"]')) return;

  const a = document.createElement("a");
  a.href = "ficha.html";
  a.textContent = "▤ Ficha";
  a.className = "tab-btn active";

  const config = Array.from(menu.querySelectorAll("a")).find(x => {
    return (x.getAttribute("href") || "").toLowerCase() === "configuracion.html";
  });

  if(config) menu.insertBefore(a, config);
  else menu.insertBefore(a, menu.lastElementChild);
}

window.bdClick = window.bdClick || function(e,id){
  if(e && e.target && e.target.id === id){
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  }
};

window.closeModal = window.closeModal || function(id){
  const el = document.getElementById(id);
  if(el) el.style.display = "none";
};

function hoyCodigo(){
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getFullYear()).slice(-2)}`;
}

function generarCodigo(){
  const prefix = `FT-${hoyCodigo()}`;
  const saved = JSON.parse(localStorage.getItem("fichasTV") || "[]");
  const count = saved.filter(f => (f.codigo || "").startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3,"0")}`;
}

function nuevaFicha(){
  if(!confirm("¿Crear una ficha nueva?")) return;

  campos.forEach(id => $(id).value = "");
  $("estado").value = "Pendiente";
  $("codigo").value = generarCodigo();

  ficha.items = [];
  ficha.faltantes = ["Fecha de entrega", "Sede o lugar"];

  agregarItem({
    nombre:"Ítem 1",
    checks:["Medida revisada","Material listo","Fabricación / corte","Acabado","Revisión final"]
  });

  renderAll();
  showToast("Ficha nueva creada", "info");
}

function recolectar(){
  campos.forEach(id => {
    ficha[id] = $(id).value.trim ? $(id).value.trim() : $(id).value;
  });

  return ficha;
}

function llenarFormulario(data){
  campos.forEach(id => $(id).value = data[id] || "");

  ficha = JSON.parse(JSON.stringify(data));
  ficha.items ||= [];
  ficha.faltantes ||= [];

  renderAll();
}

function guardarFicha(){
  recolectar();

  const valid = validarTodo(false);

  if(!ficha.codigo) ficha.codigo = generarCodigo();

  const saved = JSON.parse(localStorage.getItem("fichasTV") || "[]");
  const idx = saved.findIndex(f => f.codigo === ficha.codigo);

  ficha.actualizado = new Date().toISOString();

  if(idx >= 0) saved[idx] = ficha;
  else saved.unshift(ficha);

  localStorage.setItem("fichasTV", JSON.stringify(saved));
  BackupManager.backup();

  renderSaved();

  if(valid){
    showToast("Ficha guardada correctamente", "success");
  }else{
    showToast("Ficha guardada con datos pendientes", "info");
  }
}

function agregarItem(data = {}){
  ficha.items.push({
    nombre:data.nombre || `Ítem ${ficha.items.length+1}`,
    tipo:data.tipo || "",
    material:data.material || "",
    espesor:data.espesor || "",
    medidas:data.medidas || "",
    cantidad:data.cantidad || "",
    acabado:data.acabado || "",
    ambiente:data.ambiente || "",
    observaciones:data.observaciones || "",
    imagen:data.imagen || "",

    llevaLuz:!!data.llevaLuz,
    tipoLuz:data.tipoLuz || "",
    sistemaLed:data.sistemaLed || "",
    colorLuz:data.colorLuz || "",
    transformador:data.transformador || "",
    transformadorCompartido:data.transformadorCompartido || "No",
    ubicacionTransformador:data.ubicacionTransformador || "",
    puntoElectrico:data.puntoElectrico || "",
    obsElectricas:data.obsElectricas || "",

    llevaInstalacion:!!data.llevaInstalacion,
    superficie:data.superficie || "",
    altura:data.altura || "",
    acceso:data.acceso || "",
    fijacion:data.fijacion || "",
    plantilla:data.plantilla || "",
    obsInstalacion:data.obsInstalacion || "",

    checks:data.checks || ["Medida revisada","Material listo","Fabricación / corte","Acabado","Revisión final"]
  });

  renderItems();
  renderPaper();
}

function eliminarItem(i){
  if(confirm("¿Eliminar este ítem?")){
    ficha.items.splice(i,1);
    renderItems();
    renderPaper();
  }
}

function updateItem(i,key,val){
  ficha.items[i][key] = val;
  debouncedRender();
}

function toggleItem(i,key,checked){
  ficha.items[i][key] = checked;
  renderItems();
  renderPaper();
}

function agregarCheck(i){
  ficha.items[i].checks.push("Nuevo check");
  renderItems();
  renderPaper();
}

function updateCheck(i,j,val){
  ficha.items[i].checks[j] = val;
  debouncedRender();
}

function eliminarCheck(i,j){
  ficha.items[i].checks.splice(j,1);
  renderItems();
  renderPaper();
}

function cargarImagen(i,input){
  const file = input.files && input.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    ficha.items[i].imagen = e.target.result;
    renderItems();
    renderPaper();
    showToast("Imagen cargada", "success");
  };

  reader.readAsDataURL(file);
}

function renderItems(){
  const cont = $("items");
  cont.innerHTML = "";

  ficha.items.forEach((it,i) => {
    const div = document.createElement("div");
    div.className = "item-box";

    div.innerHTML = `
      <div class="item-head">
        <div class="item-title">
          <div class="item-num">${i+1}</div>
          <strong>${safe(it.nombre || "Ítem")}</strong>
        </div>
        <button class="ficha-btn ficha-btn--small ficha-btn--red" type="button" onclick="eliminarItem(${i})">Eliminar</button>
      </div>

      <div class="item-body">
        <div class="ficha-form-grid ficha-form-grid--item-main">
          <div class="ficha-field">
            <label>Nombre del ítem</label>
            <input value="${attr(it.nombre)}" oninput="updateItem(${i},'nombre',this.value)" placeholder="Ej: Neón 1, Caja de luz circular">
          </div>

          <div class="ficha-field">
            <label>Tipo de ítem</label>
            <select onchange="updateItem(${i},'tipo',this.value)">
              ${optionList(["","Acrílico","PVC","PVC laminado","PVC + acrílico","Automotriz","Caja de luz","FrontLit","Neón","Neón LED","Galvanizado sólido","Galvanizado con riel","SS / Acero inoxidable","Base","Personalizado"], it.tipo)}
            </select>
          </div>
        </div>

        <div class="ficha-form-grid ficha-form-grid--item-specs">
          <div class="ficha-field">
            <label>Material</label>
            <input value="${attr(it.material)}" oninput="updateItem(${i},'material',this.value)" placeholder="Ej: Acrílico">
          </div>

          <div class="ficha-field">
            <label>Espesor</label>
            <input value="${attr(it.espesor)}" oninput="updateItem(${i},'espesor',this.value)" placeholder="Ej: 8mm">
          </div>

          <div class="ficha-field">
            <label>Cantidad</label>
            <input value="${attr(it.cantidad)}" oninput="updateItem(${i},'cantidad',this.value)" placeholder="Ej: 1, 2, 30 unidades">
          </div>
        </div>

        <div class="ficha-form-grid ficha-form-grid--item-details">
          <div class="ficha-field">
            <label>Medida</label>
            <input value="${attr(it.medidas)}" oninput="updateItem(${i},'medidas',this.value)" placeholder="Ej: Neón 1: 120x240 / 3: 80x65">
          </div>

          <div class="ficha-field">
            <label>Acabado</label>
            <input value="${attr(it.acabado)}" oninput="updateItem(${i},'acabado',this.value)" placeholder="Ej: Acrílico natural, vinil, pintura">
          </div>

          <div class="ficha-field">
            <label>Interior / exterior</label>
            <select onchange="updateItem(${i},'ambiente',this.value)">
              ${optionList(["","Interior","Exterior","Interior y exterior"], it.ambiente)}
            </select>
          </div>
        </div>

        <div class="ficha-field">
          <label>Observaciones del ítem</label>
          <textarea oninput="updateItem(${i},'observaciones',this.value)" placeholder="Ej: A ras de piso en pared de bloque">${safe(it.observaciones)}</textarea>
        </div>

        <div class="item-mini-summary">
          <div class="mini-pill ${it.tipo ? 'on' : 'warn'}">${safe(it.tipo || 'Sin tipo')}</div>
          <div class="mini-pill ${it.medidas ? 'on' : 'warn'}">${safe(it.medidas || 'Sin medida')}</div>
          <div class="mini-pill ${it.llevaLuz ? 'on' : ''}">${it.llevaLuz ? 'Con luz' : 'Sin luz'}</div>
          <div class="mini-pill ${it.llevaInstalacion ? 'on' : ''}">${it.llevaInstalacion ? 'Con instalación' : 'Sin instalación'}</div>
        </div>

        <div class="ficha-field">
          <label>Imagen opcional del ítem</label>
          <input type="file" accept="image/*" onchange="cargarImagen(${i},this)">
          ${it.imagen ? `<img class="img-preview" loading="lazy" style="display:block" src="${it.imagen}">` : `<div class="ficha-muted">Opcional. Sirve como referencia visual en la ficha y como imagen principal en el PDF.</div>`}
        </div>

        <div class="switch-row">
          <div class="switch-card">
            <label>Con luz <input type="checkbox" ${it.llevaLuz ? "checked" : ""} onchange="toggleItem(${i},'llevaLuz',this.checked)"></label>
            <div class="ficha-muted">Activa preguntas de luz solo para este ítem.</div>
          </div>

          <div class="switch-card">
            <label>Con instalación <input type="checkbox" ${it.llevaInstalacion ? "checked" : ""} onchange="toggleItem(${i},'llevaInstalacion',this.checked)"></label>
            <div class="ficha-muted">Activa preguntas de instalación solo para este ítem.</div>
          </div>
        </div>

        <div class="conditional ${it.llevaLuz ? "show" : ""}">
          <div class="ficha-section">Luz del ítem</div>

          <div class="ficha-form-grid">
            <div class="ficha-field">
              <label>Tipo de luz</label>
              <select onchange="updateItem(${i},'tipoLuz',this.value)">
                ${optionList(["","Frontal","Posterior","Directa","Neón","Neón LED","Caja de luz","Mixta"], it.tipoLuz)}
              </select>
            </div>

            <div class="ficha-field">
              <label>Sistema LED</label>
              <select onchange="updateItem(${i},'sistemaLed',this.value)">
                ${optionList(["","Módulos LED","Cinta LED","Neón","Neón LED","Módulos + cinta","Otro"], it.sistemaLed)}
              </select>
            </div>
          </div>

          <div class="ficha-form-grid ficha-form-grid--item-specs">
            <div class="ficha-field">
              <label>Color de luz</label>
              <select onchange="updateItem(${i},'colorLuz',this.value)">
                ${optionList(["","Cálida","Media / neutra","Blanca fría","RGB","Otro"], it.colorLuz)}
              </select>
            </div>

            <div class="ficha-field">
              <label>Transformador</label>
              <input value="${attr(it.transformador)}" oninput="updateItem(${i},'transformador',this.value)" placeholder="Ej: 12V 30A">
            </div>

            <div class="ficha-field">
              <label>Transformador compartido</label>
              <select onchange="updateItem(${i},'transformadorCompartido',this.value)">
                ${optionList(["No","Sí","Pendiente"], it.transformadorCompartido)}
              </select>
            </div>
          </div>

          <div class="ficha-form-grid">
            <div class="ficha-field">
              <label>Ubicación transformador</label>
              <input value="${attr(it.ubicacionTransformador)}" oninput="updateItem(${i},'ubicacionTransformador',this.value)" placeholder="Ej: detrás del letrero">
            </div>

            <div class="ficha-field">
              <label>Punto eléctrico</label>
              <select onchange="updateItem(${i},'puntoElectrico',this.value)">
                ${optionList(["","Pendiente por confirmar","Disponible","No disponible","Debe instalarlo el cliente"], it.puntoElectrico)}
              </select>
            </div>
          </div>

          <div class="ficha-field">
            <label>Observaciones de luz</label>
            <textarea oninput="updateItem(${i},'obsElectricas',this.value)">${safe(it.obsElectricas)}</textarea>
          </div>
        </div>

        <div class="conditional ${it.llevaInstalacion ? "show" : ""}">
          <div class="ficha-section">Instalación del ítem</div>

          <div class="ficha-form-grid">
            <div class="ficha-field">
              <label>Tipo de superficie / pared</label>
              <select onchange="updateItem(${i},'superficie',this.value)">
                ${optionList(["","Pendiente por confirmar","Pared de bloque","Drywall","Vidrio","ACM / Alucobond","Cerámica","Madera","Metal","Wall panel","Concreto","Otro"], it.superficie)}
              </select>
            </div>

            <div class="ficha-field">
              <label>Altura / ubicación</label>
              <input value="${attr(it.altura)}" oninput="updateItem(${i},'altura',this.value)" placeholder="Ej: a ras de piso, 2.5m, 4m">
            </div>
          </div>

          <div class="ficha-form-grid ficha-form-grid--item-specs">
            <div class="ficha-field">
              <label>Acceso</label>
              <select onchange="updateItem(${i},'acceso',this.value)">
                ${optionList(["","Pendiente","Sin equipo especial","Escalera","Andamio","Grúa","Por definir"], it.acceso)}
              </select>
            </div>

            <div class="ficha-field">
              <label>Fijación</label>
              <select onchange="updateItem(${i},'fijacion',this.value)">
                ${optionList(["","Pendiente","Doble faz","Chupones","Tornillos","Ganchos","Pernos","Mixto","Otro"], it.fijacion)}
              </select>
            </div>

            <div class="ficha-field">
              <label>Plantilla</label>
              <select onchange="updateItem(${i},'plantilla',this.value)">
                ${optionList(["","Pendiente por definir","Sin plantilla","Plantilla impresa","Plantilla cortada en cartón","Plantilla mixta"], it.plantilla)}
              </select>
            </div>
          </div>

          <div class="ficha-field">
            <label>Observaciones instalación</label>
            <textarea oninput="updateItem(${i},'obsInstalacion',this.value)">${safe(it.obsInstalacion)}</textarea>
          </div>
        </div>

        <div class="ficha-section">Checklist del ítem</div>
        <div class="check-editor">
          ${(it.checks || []).map((ch,j) => `
            <div class="check-line">
              <input value="${attr(ch)}" oninput="updateCheck(${i},${j},this.value)">
              <button class="ficha-btn ficha-btn--small ficha-btn--light" type="button" onclick="eliminarCheck(${i},${j})">x</button>
            </div>
          `).join("")}
        </div>

        <button class="ficha-btn ficha-btn--small ficha-btn--light" type="button" style="margin-top:8px" onclick="agregarCheck(${i})">+ Check</button>
      </div>
    `;

    cont.appendChild(div);
  });
}

function agregarFaltante(txt){
  const val = txt || $("faltanteNuevo").value.trim();
  if(!val) return;

  ficha.faltantes.push(val);
  $("faltanteNuevo").value = "";
  renderFaltantes();
  renderPaper();
}

function eliminarFaltante(i){
  ficha.faltantes.splice(i,1);
  renderFaltantes();
  renderPaper();
}

function renderFaltantes(){
  const cont = $("faltantes");
  cont.innerHTML = "";

  ficha.faltantes.forEach((m,i) => {
    const row = document.createElement("div");
    row.className = "simple-row";
    row.innerHTML = `
      <input value="${attr(m)}" oninput="ficha.faltantes[${i}]=this.value;debouncedRender()">
      <button class="ficha-btn ficha-btn--small ficha-btn--light" type="button" onclick="eliminarFaltante(${i})">x</button>
    `;
    cont.appendChild(row);
  });
}

function renderResumen(faltantes){
  const items = ficha.items || [];
  const conLuz = items.filter(x => x.llevaLuz).length;
  const conInst = items.filter(x => x.llevaInstalacion).length;
  const sinImagen = items.filter(x => !x.imagen).length;

  $("resumenPendientes").innerHTML = `
    <div class="ficha-kpi ${faltantes.length ? 'ficha-kpi--red' : 'ficha-kpi--green'}">
      <span>Pendientes</span>
      <strong>${faltantes.length}</strong>
    </div>

    <div class="ficha-kpi ficha-kpi--black">
      <span>Ítems</span>
      <strong>${items.length}</strong>
    </div>

    <div class="ficha-kpi ${conLuz ? 'ficha-kpi--yellow' : 'ficha-kpi--green'}">
      <span>Con luz</span>
      <strong>${conLuz}</strong>
    </div>

    <div class="ficha-kpi ${conInst ? 'ficha-kpi--orange' : 'ficha-kpi--green'}">
      <span>Instalación</span>
      <strong>${conInst}</strong>
    </div>

    <div class="ficha-kpi ${sinImagen ? 'ficha-kpi--yellow' : 'ficha-kpi--green'}">
      <span>Sin imagen</span>
      <strong>${sinImagen}</strong>
    </div>
  `;
}

function renderPaper(){
  recolectar();

  $("codigoBadge").textContent = ficha.codigo || "FT";

  validarTodo(true);

  const items = ficha.items || [];
  const falt = detectarFaltantes();

  renderResumen(falt);

  const checks = [];
  items.forEach((it,i) => {
    (it.checks || []).forEach(ch => {
      if(ch && ch.trim()) checks.push(`${it.nombre || "Ítem " + (i+1)} — ${ch}`);
    });
  });

  const itemsConImagen = items.filter(x => x.imagen);
  const imagenPrincipal = itemsConImagen[0] || null;

  const bloqueImagenPrincipal = imagenPrincipal ? `
    <div class="paper-hero-image">
      <img src="${imagenPrincipal.imagen}" alt="Imagen principal">
      <div>
        <h4>Imagen principal del proyecto</h4>
        <p><strong>${safe(imagenPrincipal.nombre || "Ítem")}</strong></p>
        <p>${safe(imagenPrincipal.tipo || "")} ${safe(imagenPrincipal.material || "")} ${safe(imagenPrincipal.espesor || "")}</p>
        <p>${safe(imagenPrincipal.medidas || "")}</p>
      </div>
    </div>
  ` : "";

  const bloqueImagenesExtra = itemsConImagen.length > 1 ? `
    <div class="paper-image-strip">
      ${itemsConImagen.slice(1,4).map(it => `
        <div class="paper-image-card">
          <img src="${it.imagen}" alt="Imagen item">
          <span>${safe(it.nombre || "Ítem")}</span>
        </div>
      `).join("")}
    </div>
  ` : "";

  const itemCards = items.map((it,i) => `
    <div class="paper-item-card">
      <div class="paper-item-head">
        <span>${i+1}. ${safe(it.nombre || "Ítem")}</span>
        <span>${safe(it.tipo || "Pendiente")}</span>
      </div>

      <div class="paper-item-body">
        <div class="paper-item-info">
          <div class="paper-item-field"><label>Material</label><strong>${safe(it.material || "Pendiente")}</strong></div>
          <div class="paper-item-field"><label>Espesor</label><strong>${safe(it.espesor || "Pendiente")}</strong></div>
          <div class="paper-item-field"><label>Cantidad</label><strong>${safe(it.cantidad || "Pendiente")}</strong></div>
          <div class="paper-item-field"><label>Medida</label><strong>${safe(it.medidas || "Pendiente")}</strong></div>
          <div class="paper-item-field"><label>Acabado</label><strong>${safe(it.acabado || "Pendiente")}</strong></div>
          <div class="paper-item-field"><label>Ambiente</label><strong>${safe(it.ambiente || "Pendiente")}</strong></div>
          <div class="paper-item-field"><label>Luz</label><strong>${it.llevaLuz ? "Sí" : "No"}</strong></div>
          <div class="paper-item-field"><label>Instalación</label><strong>${it.llevaInstalacion ? "Sí" : "No"}</strong></div>
          <div class="paper-item-field"><label>Imagen</label><strong>${it.imagen ? "Sí" : "No"}</strong></div>
          <div class="paper-item-field paper-item-obs"><label>Observaciones</label><strong>${safe(it.observaciones || "Sin observaciones")}</strong></div>
        </div>

        <div class="paper-item-img">
          ${it.imagen ? `<img src="${it.imagen}" alt="Imagen del ítem">` : `<span style="font-family:var(--ficha-head);font-size:10px;color:#475569;text-transform:uppercase">Sin imagen</span>`}
        </div>
      </div>
    </div>
  `).join("");

  const luzRows = items.filter(x => x.llevaLuz).map(it => `
    <tr>
      <td>${safe(it.nombre || "Ítem")}</td>
      <td>${safe(it.tipoLuz || "Pendiente")}</td>
      <td>${safe(it.sistemaLed || "Pendiente")}</td>
      <td>${safe(it.colorLuz || "Pendiente")}</td>
      <td>${safe(it.transformador || "Pendiente")}</td>
      <td>${safe(it.transformadorCompartido || "No")}</td>
      <td>${safe(it.puntoElectrico || "Pendiente")}</td>
    </tr>
  `).join("");

  const instRows = items.filter(x => x.llevaInstalacion).map(it => `
    <tr>
      <td>${safe(it.nombre || "Ítem")}</td>
      <td>${safe(it.superficie || "Pendiente")}</td>
      <td>${safe(it.altura || "Pendiente")}</td>
      <td>${safe(it.acceso || "Pendiente")}</td>
      <td>${safe(it.fijacion || "Pendiente")}</td>
      <td>${safe(it.plantilla || "Pendiente")}</td>
    </tr>
  `).join("");

  $("paper").innerHTML = `
    <div class="paper-header">
      <div class="paper-brand">
        <img src="Logo tutto1.svg" alt="Tutto Vinilos">
        <div>
          <h3>FICHA DE PRODUCCIÓN</h3>
          <p>Hoja para cartelera / taller</p>
        </div>
      </div>

      <div class="paper-code">
        <span>CÓDIGO</span>
        <strong>${safe(ficha.codigo || "FT")}</strong>
        <span>${formatDate(new Date())}</span>
      </div>
    </div>

    <div class="paper-title">
      <h2>${safe(ficha.proyecto || "Ficha de producción")}</h2>
      <p>Estado: <strong>${safe(ficha.estado || "Pendiente")}</strong></p>
    </div>

    ${bloqueImagenPrincipal}
    ${bloqueImagenesExtra}

    <div class="paper-grid">
      <div class="info-box"><label>Cliente / empresa</label><strong>${safe(ficha.cliente || "Pendiente")}</strong></div>
      <div class="info-box"><label>Entrega</label><strong>${safe(formatInputDate(ficha.fechaEntrega) || "Pendiente")}</strong></div>
      <div class="info-box"><label>Sede / lugar</label><strong>${safe(ficha.sede || "Pendiente")}</strong></div>
      <div class="info-box"><label>Ítems</label><strong>${items.length}</strong></div>
      <div class="info-box"><label>Pendientes</label><strong>${falt.length}</strong></div>
    </div>

    <div class="critical">
      <h4>Observaciones generales</h4>
      <p>${safe(ficha.observacionesCriticas || "Sin observaciones generales registradas.")}</p>
    </div>

    <div class="paper-section missing">
      <h4>Resumen previo de pendientes</h4>
      <div class="paper-list">
        ${(falt.length ? falt : ["Sin datos faltantes detectados"]).map(ch => `
          <div class="paper-check"><span class="box">□</span><span>${safe(ch)}</span></div>
        `).join("")}
      </div>
    </div>

    <div class="paper-section">
      <h4>Proyecto / Ítems</h4>
      ${itemCards || `<div class="paper-check"><span class="box">□</span><span>Sin ítems registrados.</span></div>`}
    </div>

    ${luzRows ? `
      <div class="paper-section">
        <h4>Luz por ítem</h4>
        <table class="paper-subtable">
          <tr>
            <th>Ítem</th>
            <th>Tipo luz</th>
            <th>Sistema LED</th>
            <th>Color</th>
            <th>Transformador</th>
            <th>Compartido</th>
            <th>Punto eléctrico</th>
          </tr>
          ${luzRows}
        </table>
      </div>
    ` : ""}

    ${instRows ? `
      <div class="paper-section">
        <h4>Instalación por ítem</h4>
        <table class="paper-subtable">
          <tr>
            <th>Ítem</th>
            <th>Superficie</th>
            <th>Altura / ubicación</th>
            <th>Acceso</th>
            <th>Fijación</th>
            <th>Plantilla</th>
          </tr>
          ${instRows}
        </table>
      </div>
    ` : ""}

    <div class="paper-section">
      <h4>Checklist de producción</h4>
      <div class="paper-checklist-columns">
        ${(checks.length ? checks : ["Medida revisada","Material listo","Fabricación / corte","Acabado","Revisión final"]).map(ch => `
          <div class="paper-check"><span class="box">□</span><span>${safe(ch)}</span></div>
        `).join("")}
      </div>
    </div>

    <div class="footer-note">
      <div class="sign-box">Revisado por producción</div>
      <div class="sign-box">Observación final / entrega</div>
    </div>
  `;
}

function detectarFaltantes(){
  const falt = [...(ficha.faltantes || [])].filter(Boolean);

  if(!ficha.cliente) falt.push("Nombre del cliente / empresa");
  if(!ficha.proyecto) falt.push("Nombre del proyecto");
  if(!ficha.fechaEntrega) falt.push("Fecha de entrega");
  if(!ficha.sede) falt.push("Sede o lugar");
  if(!ficha.items.length) falt.push("Agregar al menos un ítem");

  ficha.items.forEach((it,i) => {
    const n = it.nombre || `Ítem ${i+1}`;

    if(!it.tipo) falt.push(`Tipo de ${n}`);
    if(!it.material) falt.push(`Material de ${n}`);
    if(!it.espesor) falt.push(`Espesor de ${n}`);
    if(!it.medidas) falt.push(`Medida de ${n}`);
    if(!it.cantidad) falt.push(`Cantidad de ${n}`);
    if(!it.acabado) falt.push(`Acabado de ${n}`);
    if(!it.ambiente) falt.push(`Interior / exterior de ${n}`);

    if(it.llevaLuz){
      if(!it.tipoLuz) falt.push(`Tipo de luz de ${n}`);
      if(!it.sistemaLed) falt.push(`Sistema LED de ${n}`);
      if(!it.colorLuz) falt.push(`Color de luz de ${n}`);
      if(!it.transformador) falt.push(`Transformador de ${n}`);
      if(!it.puntoElectrico) falt.push(`Punto eléctrico de ${n}`);
    }

    if(it.llevaInstalacion){
      if(!it.superficie) falt.push(`Tipo de pared/superficie de ${n}`);
      if(!it.altura) falt.push(`Altura o ubicación de ${n}`);
      if(!it.fijacion) falt.push(`Fijación de ${n}`);
      if(!it.plantilla) falt.push(`Plantilla de ${n}`);
    }
  });

  return [...new Set(falt)];
}

function validateField(field, value, silent = false){
  const rule = ValidationRules[field];
  if(!rule) return true;

  const el = $(field);
  const msg = document.querySelector(`[data-error-for="${field}"]`);
  let valid = true;
  let error = "";

  if(rule.required && !String(value || "").trim()){
    valid = false;
    error = rule.message;
  }else if(rule.minLength && String(value || "").trim().length < rule.minLength){
    valid = false;
    error = rule.message;
  }

  if(el){
    el.classList.toggle("error", !valid && !silent);
  }

  if(msg){
    msg.textContent = (!valid && !silent) ? error : "";
  }

  return valid;
}

function validarTodo(silent = true){
  let ok = true;

  Object.keys(ValidationRules).forEach(field => {
    const valid = validateField(field, $(field)?.value || "", silent);
    if(!valid) ok = false;
  });

  return ok;
}

function renderSaved(){
  const cont = $("savedList");
  const saved = JSON.parse(localStorage.getItem("fichasTV") || "[]");

  if(!saved.length){
    cont.innerHTML = `<div class="ficha-muted">No hay fichas guardadas todavía.</div>`;
    return;
  }

  cont.innerHTML = saved.slice(0,12).map(f => `
    <div class="saved-item">
      <div>
        <strong>${safe(f.codigo || "Sin código")} · ${safe(f.cliente || "Sin cliente")}</strong>
        <span>${safe(f.proyecto || "Sin proyecto")} · Entrega: ${safe(formatInputDate(f.fechaEntrega) || "Pendiente")}</span>
      </div>

      <div style="display:flex;gap:6px">
        <button class="ficha-btn ficha-btn--small ficha-btn--light" type="button" onclick="cargarGuardada('${safeAttr(f.codigo)}')">Abrir</button>
        <button class="ficha-btn ficha-btn--small ficha-btn--red" type="button" onclick="borrarGuardada('${safeAttr(f.codigo)}')">x</button>
      </div>
    </div>
  `).join("");
}

function cargarGuardada(codigo){
  const saved = JSON.parse(localStorage.getItem("fichasTV") || "[]");
  const f = saved.find(x => x.codigo === codigo);

  if(f){
    llenarFormulario(f);
    showToast("Ficha cargada", "success");
  }
}

function borrarGuardada(codigo){
  if(!confirm("¿Eliminar ficha guardada?")) return;

  let saved = JSON.parse(localStorage.getItem("fichasTV") || "[]");
  saved = saved.filter(x => x.codigo !== codigo);
  localStorage.setItem("fichasTV", JSON.stringify(saved));

  renderSaved();
  showToast("Ficha eliminada", "info");
}

function crearPDF(){
  recolectar();
  renderPaper();

  const element = $("paper");
  const codigo = safeFileName(ficha.codigo || "ficha");
  const cliente = safeFileName(ficha.cliente || "cliente");

  const opt = {
    margin: 8,
    filename: `${codigo}_${cliente}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: {
      unit: "mm",
      format: "letter",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"]
    }
  };

  if(typeof html2pdf === "undefined"){
    showToast("No cargó html2pdf. Usa imprimir > guardar PDF.", "error");
    window.print();
    return;
  }

  showToast("Generando PDF...", "info");

  html2pdf().set(opt).from(element).save().then(() => {
    showToast("PDF creado", "success");
  }).catch(() => {
    showToast("Error al crear PDF. Usa imprimir.", "error");
  });
}

function renderAll(){
  renderItems();
  renderFaltantes();
  renderSaved();
  renderPaper();
}

function bindInputs(){
  campos.forEach(id => {
    const el = $(id);
    if(!el) return;

    el.addEventListener("input", () => {
      validateField(id, el.value);
      debouncedRender();
    });

    el.addEventListener("change", () => {
      validateField(id, el.value);
      renderPaper();
    });
  });
}

function optionList(list,selected){
  return list.map(v => `<option value="${attr(v)}" ${v === selected ? "selected" : ""}>${v || "Pendiente / personalizado"}</option>`).join("");
}

function safe(v){
  return escapeHtml(String(v ?? ""));
}

function attr(v){
  return escapeHtml(String(v ?? ""));
}

function safeAttr(v){
  return String(v ?? "").replace(/'/g,"&#39;").replace(/"/g,"&quot;");
}

function small(v){
  return v ? `<span style="font-size:10px;color:#475569">${safe(v)}</span>` : "";
}

function escapeHtml(str){
  return String(str ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function safeFileName(str){
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9_-]+/g,"_")
    .replace(/^_+|_+$/g,"")
    .slice(0,80);
}

function formatInputDate(v){
  if(!v) return "";
  const p = v.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : v;
}

function formatDate(d){
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

document.addEventListener("DOMContentLoaded", () => {
  bindInputs();

  setTimeout(insertarFichaMenu, 80);
  setTimeout(insertarFichaMenu, 350);

  $("codigo").value = generarCodigo();

  ficha.faltantes = ["Fecha de entrega", "Sede o lugar"];

  ficha.items = [{
    nombre:"Ítem 1",
    tipo:"",
    material:"",
    espesor:"",
    medidas:"",
    cantidad:"",
    acabado:"",
    ambiente:"",
    observaciones:"",
    imagen:"",
    llevaLuz:false,
    tipoLuz:"",
    sistemaLed:"",
    colorLuz:"",
    transformador:"",
    transformadorCompartido:"No",
    ubicacionTransformador:"",
    puntoElectrico:"",
    obsElectricas:"",
    llevaInstalacion:false,
    superficie:"",
    altura:"",
    acceso:"",
    fijacion:"",
    plantilla:"",
    obsInstalacion:"",
    checks:["Medida revisada","Material listo","Fabricación / corte","Acabado","Revisión final"]
  }];

  const backup = BackupManager.restore();
  if(backup && backup.data && confirm("Hay un backup automático reciente. ¿Deseas restaurarlo?")){
    llenarFormulario(backup.data);
  }else{
    renderAll();
  }

  BackupManager.init();
});
