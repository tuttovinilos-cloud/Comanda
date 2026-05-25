console.log('ESTADISTICAS v41 barras pequeñas');

let pedidosStats = [];
const $ = id => document.getElementById(id);

function db(){
  return window.supabaseClient;
}

function normalizar(v){
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function limpiarTexto(v, fallback='Sin dato'){
  const t = String(v ?? '').trim();
  const n = normalizar(t);
  if(!t || n === 'empty' || n === 'null') return fallback;
  return t.replace(/\s+/g,' ').trim();
}

function escapeHtml(v){
  return String(v ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function numero(v){
  if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const m = String(v ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function fmt(n){
  const x = Number(n || 0);
  if(!Number.isFinite(x)) return '0';
  return x.toLocaleString('es-VE',{maximumFractionDigits:2});
}

function showToast(msg){
  const t=$('toast');
  if(!t){ console.log(msg); return; }
  t.textContent=msg;
  t.style.display='block';
  setTimeout(()=>t.style.display='none',2200);
}

async function cargarPedidosStats(){
  if(!db()){
    showToast('No existe conexión Supabase. Revisa js/supabase.js');
    console.error('No existe window.supabaseClient');
    return;
  }

  setEmptyAll('Cargando estadísticas...');

  let res = await db()
    .from('pedidos')
    .select('id,fecha,operador,cliente,descripcion,cantidad,material,tipo_impresion,estatus_trabajo,estatus_pago,fecha_entrega')
    .order('fecha', { ascending:false });

  if(res.error){
    console.warn('Consulta principal de estadísticas falló. Probando fallback:', res.error);
    res = await db()
      .from('pedidos')
      .select('*')
      .order('id', { ascending:false });
  }

  if(res.error){
    console.error('Error cargando estadísticas:', res.error);
    showToast('Error cargando estadísticas: ' + (res.error.message || 'revisa consola'));
    setEmptyAll('Error cargando datos: ' + (res.error.message || 'revisa consola'));
    return;
  }

  pedidosStats = res.data || [];
  llenarFiltros();
  renderEstadisticas();
}

function llenarFiltros(){
  const ySel = $('filterYear');
  if(ySel){
    const oldY = ySel.value || 'all';
    const years = [...new Set(
      pedidosStats
        .map(p => String(p.fecha || '').slice(0,4))
        .filter(y => /^\d{4}$/.test(y))
    )].sort((a,b)=>b.localeCompare(a));

    ySel.innerHTML = '<option value="all">Todos los años</option>' +
      years.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join('');

    ySel.value = years.includes(oldY) ? oldY : 'all';
  }

  const clientesMap = new Map();
  pedidosStats.forEach(p => {
    const nombre = limpiarTexto(p.cliente, '');
    const key = normalizar(nombre);
    if(key && !clientesMap.has(key)) clientesMap.set(key, nombre);
  });

  const clientes = [...clientesMap.values()].sort((a,b)=>a.localeCompare(b,'es'));
  const list = $('clientesStatsList');
  if(list){
    list.innerHTML = clientes.map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
  }
}

function filtrarPedidos(){
  const year = $('filterYear')?.value || 'all';
  const month = $('filterMonth')?.value || 'all';
  const clienteQ = normalizar($('filterClienteSearch')?.value || '');

  return pedidosStats.filter(p => {
    const fecha = String(p.fecha || '');

    if(year !== 'all' && fecha.slice(0,4) !== year) return false;
    if(month !== 'all' && fecha.slice(5,7) !== month) return false;
    if(clienteQ && !normalizar(p.cliente).includes(clienteQ)) return false;

    return true;
  });
}

function groupBy(rows, keyFn){
  const map = new Map();

  rows.forEach(p => {
    const show = limpiarTexto(keyFn(p), 'Sin dato');
    const key = normalizar(show) || 'sin dato';

    if(!map.has(key)){
      map.set(key, {
        key: show,
        pedidos:0,
        metros:0,
        listos:0,
        pagados:0,
        pendientes:0,
        primero:null,
        ultimo:null,
        items:[]
      });
    }

    const g = map.get(key);
    g.pedidos += 1;
    g.metros += numero(p.cantidad);

    if(normalizar(p.estatus_trabajo) === 'listo') g.listos += 1;
    if(normalizar(p.estatus_pago) === 'pagado') g.pagados += 1;
    if(normalizar(p.estatus_pago) !== 'pagado') g.pendientes += 1;

    const f = String(p.fecha || '').slice(0,10);
    if(f){
      if(!g.primero || f < g.primero) g.primero = f;
      if(!g.ultimo || f > g.ultimo) g.ultimo = f;
    }

    g.items.push(p);
  });

  return [...map.values()];
}


function renderList(id, rows, mode='metros'){
  const el = $(id);
  if(!el) return;

  if(!rows.length){
    el.innerHTML = '<div class="empty">Sin datos</div>';
    return;
  }

  const ordenados = rows.slice(0,10);
  const max = Math.max(...ordenados.map(r => mode === 'pedidos' ? r.pedidos : r.metros), 1);

  el.innerHTML = ordenados.map((r, i) => {
    const val = mode === 'pedidos' ? r.pedidos : r.metros;
    const label = mode === 'pedidos' ? `${fmt(r.pedidos)} pedidos` : `${fmt(r.metros)} m`;
    const pct = Math.max(3, (val / max) * 100);

    return `<div class="stat-mini">
      <div class="stat-mini-top">
        <div class="stat-mini-name">${i + 1}. ${escapeHtml(r.key)}</div>
        <div class="stat-mini-value">${escapeHtml(label)}</div>
      </div>
      <div class="stat-mini-meta">${fmt(r.pedidos)} pedido${r.pedidos===1?'':'s'} · Listos: ${fmt(r.listos)} · Pagados: ${fmt(r.pagados)}</div>
      <div class="stat-mini-track">
        <div class="stat-mini-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join('');
}


function renderMeses(rows){
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const data = meses.map(nombre => ({
    key:nombre,
    pedidos:0,
    metros:0,
    listos:0,
    pagados:0,
    pendientes:0
  }));

  rows.forEach(p => {
    const m = Number(String(p.fecha || '').slice(5,7));
    if(m >= 1 && m <= 12){
      const item = data[m-1];
      item.pedidos++;
      item.metros += numero(p.cantidad);
      if(normalizar(p.estatus_trabajo) === 'listo') item.listos++;
      if(normalizar(p.estatus_pago) === 'pagado') item.pagados++;
      if(normalizar(p.estatus_pago) !== 'pagado') item.pendientes++;
    }
  });

  renderList('metrosPorMes', data, 'metros');
}

function renderTablaClientes(grupos){
  const tbody = $('tablaClientes');
  if(!tbody) return;

  if(!grupos.length){
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Sin clientes</td></tr>';
    return;
  }

  tbody.innerHTML = grupos.map(g => `
    <tr>
      <td><b>${escapeHtml(g.key)}</b></td>
      <td>${fmt(g.pedidos)}</td>
      <td><b>${fmt(g.metros)}</b></td>
      <td>${escapeHtml(g.primero || '—')}</td>
      <td>${escapeHtml(g.ultimo || '—')}</td>
      <td><span class="pill green">${fmt(g.listos)}</span></td>
      <td><span class="pill blue">${fmt(g.pagados)}</span></td>
      <td><span class="pill red">${fmt(g.pendientes)}</span></td>
    </tr>`).join('');
}

function renderEstadisticas(){
  const rows = filtrarPedidos();

  const clientes = groupBy(rows, p => p.cliente).sort((a,b)=>b.metros-a.metros);
  const recurrentes = [...clientes].sort((a,b)=>b.pedidos-a.pedidos);
  const materiales = groupBy(rows, p => p.material).sort((a,b)=>b.metros-a.metros);
  const impresiones = groupBy(rows, p => p.tipo_impresion).sort((a,b)=>b.metros-a.metros);
  const operadores = groupBy(rows, p => p.operador).sort((a,b)=>b.pedidos-a.pedidos);

  const totalMetros = rows.reduce((a,p)=>a+numero(p.cantidad),0);

  if($('kpiPedidos')) $('kpiPedidos').textContent = fmt(rows.length);
  if($('kpiMetros')) $('kpiMetros').textContent = fmt(totalMetros);
  if($('kpiClientes')) $('kpiClientes').textContent = fmt(clientes.length);
  if($('kpiListos')) $('kpiListos').textContent = fmt(rows.filter(p => normalizar(p.estatus_trabajo) === 'listo').length);
  if($('kpiPagados')) $('kpiPagados').textContent = fmt(rows.filter(p => normalizar(p.estatus_pago) === 'pagado').length);

  const q = $('filterClienteSearch')?.value.trim() || '';

  if($('filterInfo')){
    $('filterInfo').innerHTML = `<span>Viendo estadísticas de <strong>${q ? escapeHtml(q) : 'todos los clientes'}</strong>.</span><span id="filterCount">${rows.length} pedido${rows.length===1?'':'s'} · ${fmt(totalMetros)} m</span>`;
  }

  renderList('topClientes', clientes, 'metros');
  renderList('clientesRecurrentes', recurrentes, 'pedidos');
  renderList('materialesUsados', materiales, 'metros');
  renderList('impresionesUsadas', impresiones, 'metros');
  renderList('operadoresUsados', operadores, 'pedidos');
  renderMeses(rows);
  renderTablaClientes(clientes);
}

function limpiarClienteStats(){
  const input = $('filterClienteSearch');
  if(input) input.value = '';
  renderEstadisticas();
}

function setEmptyAll(msg){
  ['topClientes','clientesRecurrentes','materialesUsados','impresionesUsadas','operadoresUsados','metrosPorMes'].forEach(id => {
    const el=$(id);
    if(el) el.innerHTML = `<div class="empty">${escapeHtml(msg)}</div>`;
  });

  const tbody = $('tablaClientes');
  if(tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(msg)}</td></tr>`;
}

document.addEventListener('DOMContentLoaded', function(){
  cargarPedidosStats();
});

window.cargarPedidosStats = cargarPedidosStats;
window.renderEstadisticas = renderEstadisticas;
window.limpiarClienteStats = limpiarClienteStats;
