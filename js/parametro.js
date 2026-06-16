console.log("PARAMETROS LASER JS conectado v1 sin Supabase");

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "tutto_parametros_laser_v1";
let parametrosLaser = [];
let editandoId = null;

const parametrosIniciales = [
  {
    id: crearId(),
    material: "Acrílico",
    espesor: "3 mm",
    tipoTrabajo: "Corte",
    laser: "1",
    potMin: 30,
    potMax: 30,
    velocidad: 30,
    unidadVelocidad: "mm/s",
    gas: "Aire",
    psi: 8,
    autofocus: "Sí",
    foco: 1.5,
    altura: 8,
    estado: "Recomendado",
    resultado: "Bueno",
    operador: "Roberto",
    nota: "Parámetro de referencia. Corte limpio."
  },
  {
    id: crearId(),
    material: "Rowmark",
    espesor: "1.5 mm",
    tipoTrabajo: "Grabado",
    laser: "1",
    potMin: 18,
    potMax: 22,
    velocidad: 300,
    unidadVelocidad: "mm/s",
    gas: "Aire",
    psi: 3,
    autofocus: "No",
    foco: 0,
    altura: 8,
    estado: "Recomendado",
    resultado: "Bueno",
    operador: "Roberto",
    nota: "Grabado limpio. Ajustar según color del Rowmark."
  },
  {
    id: crearId(),
    material: "SS",
    espesor: "0.8 mm",
    tipoTrabajo: "Corte",
    laser: "2",
    potMin: 55,
    potMax: 65,
    velocidad: 35,
    unidadVelocidad: "mm/s",
    gas: "Oxígeno",
    psi: 80,
    autofocus: "Sí",
    foco: 0.5,
    altura: 8,
    estado: "En prueba",
    resultado: "Regular",
    operador: "Roberto",
    nota: "Usar oxígeno. Validar rebaba y color del borde."
  },
  {
    id: crearId(),
    material: "MDF",
    espesor: "3 mm",
    tipoTrabajo: "Corte",
    laser: "1",
    potMin: 35,
    potMax: 40,
    velocidad: 25,
    unidadVelocidad: "mm/s",
    gas: "Aire",
    psi: 8,
    autofocus: "Sí",
    foco: 1.5,
    altura: 8,
    estado: "En prueba",
    resultado: "Regular",
    operador: "",
    nota: "Revisar quemado del borde."
  }
];

function crearId(){
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function iniciar(){
  cargarDatos();
  enlazarEventos();
  pintarFiltrosMaterial();
  render();
}

function cargarDatos(){
  const guardado = localStorage.getItem(STORAGE_KEY);
  if(guardado){
    try{
      parametrosLaser = JSON.parse(guardado) || [];
      return;
    }catch(e){
      console.warn("No se pudo leer localStorage", e);
    }
  }
  parametrosLaser = [...parametrosIniciales];
  guardarDatos();
}

function guardarDatos(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parametrosLaser));
}

function enlazarEventos(){
  $("btnNuevo").addEventListener("click", abrirNuevo);
  $("btnCerrar").addEventListener("click", cerrarModal);
  $("btnCancelar").addEventListener("click", cerrarModal);
  $("modalBackdrop").addEventListener("click", (e) => {
    if(e.target.id === "modalBackdrop") cerrarModal();
  });

  $("formParametro").addEventListener("submit", guardarParametro);

  ["buscar","filtroMaterial","filtroTrabajo","filtroLaser","filtroEstado"].forEach(id => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });

  $("btnLimpiar").addEventListener("click", limpiarFiltros);
  $("btnReset").addEventListener("click", restaurarPrueba);
  $("btnExportar").addEventListener("click", exportarCSV);
}

function abrirNuevo(){
  editandoId = null;
  $("modalTitulo").textContent = "Nuevo parámetro";
  $("formParametro").reset();
  $("paramId").value = "";
  $("tipoTrabajo").value = "Corte";
  $("laser").value = "1";
  $("unidadVelocidad").value = "mm/s";
  $("gas").value = "Aire";
  $("autofocus").value = "Sí";
  $("estado").value = "Recomendado";
  $("resultado").value = "Bueno";
  abrirModal();
}

function abrirEditar(id){
  const p = parametrosLaser.find(x => x.id === id);
  if(!p) return;

  editandoId = id;
  $("modalTitulo").textContent = "Editar parámetro";
  $("paramId").value = p.id;
  $("material").value = p.material || "";
  $("espesor").value = p.espesor || "";
  $("tipoTrabajo").value = p.tipoTrabajo || "Corte";
  $("laser").value = p.laser || "1";
  $("potMin").value = p.potMin ?? "";
  $("potMax").value = p.potMax ?? "";
  $("velocidad").value = p.velocidad ?? "";
  $("unidadVelocidad").value = p.unidadVelocidad || "mm/s";
  $("gas").value = p.gas || "Aire";
  $("psi").value = p.psi ?? "";
  $("autofocus").value = p.autofocus || "Sí";
  $("foco").value = p.foco ?? "";
  $("altura").value = p.altura ?? "";
  $("estado").value = p.estado || "Recomendado";
  $("resultado").value = p.resultado || "Bueno";
  $("operador").value = p.operador || "";
  $("nota").value = p.nota || "";
  abrirModal();
}

function abrirModal(){
  $("modalBackdrop").classList.add("show");
}

function cerrarModal(){
  $("modalBackdrop").classList.remove("show");
}

function guardarParametro(e){
  e.preventDefault();

  const data = {
    id: editandoId || crearId(),
    material: $("material").value.trim(),
    espesor: $("espesor").value.trim(),
    tipoTrabajo: $("tipoTrabajo").value,
    laser: $("laser").value,
    potMin: numeroONull($("potMin").value),
    potMax: numeroONull($("potMax").value),
    velocidad: numeroONull($("velocidad").value),
    unidadVelocidad: $("unidadVelocidad").value,
    gas: $("gas").value,
    psi: numeroONull($("psi").value),
    autofocus: $("autofocus").value,
    foco: numeroONull($("foco").value),
    altura: numeroONull($("altura").value),
    estado: $("estado").value,
    resultado: $("resultado").value,
    operador: $("operador").value.trim(),
    nota: $("nota").value.trim(),
    updatedAt: new Date().toISOString()
  };

  if(!data.material || !data.espesor){
    toast("Material y espesor son obligatorios");
    return;
  }

  if(editandoId){
    parametrosLaser = parametrosLaser.map(p => p.id === editandoId ? data : p);
    toast("Parámetro actualizado");
  }else{
    parametrosLaser.unshift(data);
    toast("Parámetro agregado");
  }

  guardarDatos();
  pintarFiltrosMaterial();
  render();
  cerrarModal();
}

function numeroONull(valor){
  if(valor === "" || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function duplicarParametro(id){
  const p = parametrosLaser.find(x => x.id === id);
  if(!p) return;

  const copia = {
    ...p,
    id: crearId(),
    estado: "En prueba",
    nota: (p.nota || "") + " | Duplicado para nueva prueba",
    updatedAt: new Date().toISOString()
  };

  parametrosLaser.unshift(copia);
  guardarDatos();
  pintarFiltrosMaterial();
  render();
  toast("Parámetro duplicado");
}

function eliminarParametro(id){
  const p = parametrosLaser.find(x => x.id === id);
  if(!p) return;

  const ok = confirm(`Eliminar parámetro: ${p.material} ${p.espesor} ${p.tipoTrabajo}?`);
  if(!ok) return;

  parametrosLaser = parametrosLaser.filter(x => x.id !== id);
  guardarDatos();
  pintarFiltrosMaterial();
  render();
  toast("Parámetro eliminado");
}

function render(){
  const datos = obtenerFiltrados();
  pintarStats();
  pintarTabla(datos);
}

function obtenerFiltrados(){
  const q = $("buscar").value.trim().toLowerCase();
  const mat = $("filtroMaterial").value;
  const trabajo = $("filtroTrabajo").value;
  const laser = $("filtroLaser").value;
  const estado = $("filtroEstado").value;

  return parametrosLaser.filter(p => {
    const texto = [
      p.material,
      p.espesor,
      p.tipoTrabajo,
      p.laser,
      p.gas,
      p.estado,
      p.resultado,
      p.operador,
      p.nota
    ].join(" ").toLowerCase();

    if(q && !texto.includes(q)) return false;
    if(mat && p.material !== mat) return false;
    if(trabajo && p.tipoTrabajo !== trabajo) return false;
    if(laser && p.laser !== laser) return false;
    if(estado && p.estado !== estado) return false;
    return true;
  });
}

function pintarTabla(datos){
  const tbody = $("tablaBody");
  const empty = $("emptyBox");

  if(!datos.length){
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  tbody.innerHTML = datos.map(p => `
    <tr>
      <td><div class="material-name">${esc(p.material)}</div></td>
      <td class="mono">${esc(p.espesor)}</td>
      <td>${badgeTrabajo(p.tipoTrabajo)}</td>
      <td><span class="badge badge-laser">Láser ${esc(p.laser)}</span></td>
      <td class="mono">${fmt(p.potMin)}%</td>
      <td class="mono">${fmt(p.potMax)}%</td>
      <td class="mono">${fmt(p.velocidad)} ${esc(p.unidadVelocidad || "mm/s")}</td>
      <td>${esc(p.gas || "")}</td>
      <td class="mono">${fmt(p.psi)}</td>
      <td>${esc(p.autofocus || "")}</td>
      <td class="mono">${fmt(p.foco)}</td>
      <td class="mono">${fmt(p.altura)} mm</td>
      <td>${badgeEstado(p.estado)}</td>
      <td title="${escAttr(p.nota || "")}">${esc(recortar(p.nota || "", 42))}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-small" onclick="abrirEditar('${p.id}')">Editar</button>
          <button class="btn btn-small btn-soft" onclick="duplicarParametro('${p.id}')">Duplicar</button>
          <button class="btn btn-small btn-danger" onclick="eliminarParametro('${p.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function pintarStats(){
  const materiales = new Set(parametrosLaser.map(p => p.material).filter(Boolean));
  $("statTotal").textContent = parametrosLaser.length;
  $("statMateriales").textContent = materiales.size;
  $("statCorte").textContent = parametrosLaser.filter(p => p.tipoTrabajo === "Corte").length;
  $("statGrabado").textContent = parametrosLaser.filter(p => p.tipoTrabajo === "Grabado").length;
}

function pintarFiltrosMaterial(){
  const select = $("filtroMaterial");
  const actual = select.value;
  const materiales = [...new Set(parametrosLaser.map(p => p.material).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

  select.innerHTML = `<option value="">Todos</option>` + materiales.map(m => `<option value="${escAttr(m)}">${esc(m)}</option>`).join("");
  if(materiales.includes(actual)) select.value = actual;
}

function limpiarFiltros(){
  $("buscar").value = "";
  $("filtroMaterial").value = "";
  $("filtroTrabajo").value = "";
  $("filtroLaser").value = "";
  $("filtroEstado").value = "";
  render();
}

function restaurarPrueba(){
  const ok = confirm("Esto borrará los cambios locales y restaurará los parámetros de prueba. ¿Continuar?");
  if(!ok) return;
  parametrosLaser = [...parametrosIniciales].map(p => ({...p, id: crearId()}));
  guardarDatos();
  pintarFiltrosMaterial();
  render();
  toast("Parámetros de prueba restaurados");
}

function exportarCSV(){
  const datos = obtenerFiltrados();
  const headers = [
    "Material","Espesor","Trabajo","Laser","Potencia Min","Potencia Max","Velocidad","Unidad Velocidad",
    "Gas/Aire","PSI","Autofocus","Foco","Altura","Estado","Resultado","Operador","Nota"
  ];

  const filas = datos.map(p => [
    p.material,p.espesor,p.tipoTrabajo,`Laser ${p.laser}`,p.potMin,p.potMax,p.velocidad,p.unidadVelocidad,
    p.gas,p.psi,p.autofocus,p.foco,p.altura,p.estado,p.resultado,p.operador,p.nota
  ]);

  const csv = [headers, ...filas]
    .map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "parametros-laser.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("CSV exportado");
}

function badgeTrabajo(valor){
  const cls = valor === "Grabado" ? "badge-grabado" : "badge-corte";
  return `<span class="badge ${cls}">${esc(valor || "")}</span>`;
}

function badgeEstado(valor){
  let cls = "badge-test";
  if(valor === "Recomendado") cls = "badge-ok";
  if(valor === "Descartado") cls = "badge-bad";
  return `<span class="badge ${cls}">${esc(valor || "")}</span>`;
}

function fmt(v){
  if(v === null || v === undefined || v === "") return "-";
  return Number.isFinite(Number(v)) ? String(Number(v)) : String(v);
}

function recortar(texto, max){
  if(!texto) return "";
  return texto.length > max ? texto.slice(0, max - 1) + "…" : texto;
}

function esc(texto){
  return String(texto ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escAttr(texto){
  return esc(texto);
}

function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

window.abrirEditar = abrirEditar;
window.duplicarParametro = duplicarParametro;
window.eliminarParametro = eliminarParametro;

document.addEventListener("DOMContentLoaded", iniciar);
