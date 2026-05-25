console.log('ESTADISTICAS conectado v36 graficas');

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
  return t.replace(/\s+/g, ' ').trim();
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
  const raw = String(v ?? '').trim();
  if(!raw) return 0;
  const limpio = raw.replace(',', '.');
  const m = limpio.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function fmt(n){
  const x = Number(n || 0);
  if(!Number.isFinite(x)) return '0';
  return x.toLocaleString('es-VE',{maximumFractionDigits:2});
}

function showToast(msg){
  const t = $('toast');
  if(!t){ console.log(msg); return; }
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(()=>t.style.display='none',2200);
}

async function cargarPedidosStats(){
  if(!db()){
    showToast('No existe conexión Supabase. Revisa js/supabase.js');
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
  const years = [...new Set(
    pedidosStats
      .map(p => String(p.fecha || '').slice(0,4))
      .filter(y => /^\d{4}$/.test(y))
  )].sort((a,b)=>b.localeCompare(a));

  const ySel = $('filterYear');
  const oldY = ySel?.value || 'all';

  if(ySel){
    ySel.innerHTML = '<option value="all">Todos los años</option>' +
      years.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join('');
    ySel.value = years.includes(oldY) ? oldY : 'all';
  }

  const mapClientes = new Map();

  pedidosStats.forEach(p => {
    const nombre = limpiarTexto(p.cliente, 'Sin cliente');
    const key = normalizar(nombre);
    if(key && !mapClientes.has(key)){
      mapClientes.set(key, nombre);
    }
  });

  const clientes = [...mapClientes.values()].sort((a,b)=>a.localeCompare(b, 'es'));
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
    const norm = normalizar(show) || 'sin dato';

    if(!map.has(norm)){
      map.set(norm, {
        key: show,
        norm,
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

    const g = map.get(norm);

    g.pedidos += 1;
    g.metros += numero(p.cantidad);

    if(normalizar(p.estatus_trabajo) === 'listo') g.listos += 1;
    if(normalizar(p.estatus_pago) === 'pagado') g.pagados += 1;
    if(normalizar(p.estatus_pago) !== 'pagado') g.pendientes += 1;

    const f = String(p.fecha || '').slice(0,10);
    if(/^\d{4}-\d{2}-\d{2}$/.test(f)){
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

  const max = Math.max(...rows.map(r => mode === 'pedidos' ? r.pedidos : r.metros), 1);

  el.innerHTML = rows.slice(0,10).map(r => {
    const val = mode === 'pedidos' ? r.pedidos : r.metros;
    const label = mode === 'pedidos' ? `${r.pedidos} pedidos` : `${fmt(r.metros)} m`;
    const pct = Math.max(2, (val / max) * 100);

    return `<div class="row">
      <div class="row-title" title="${escapeHtml(r.key)}">${escapeHtml(r.key)}</div>
      <div class="row-val">${escapeHtml(label)}</div>
      <div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>
      <div class="row-sub">${r.pedidos} pedido${r.pedidos===1?'':'s'} · Listos: ${r.listos} · Pagados: ${r.pagados}</div>
    </div>`;
  }).join('');
}


function renderGraficaMeses(data){
  const cont = $('graficaMeses');
  if(!cont) return;

  const valores = data.map(x => Number(x.metros || 0));
  const hayDatos = valores.some(v => v > 0);

  if(!hayDatos){
    cont.innerHTML = '<div class="chart-empty">Sin datos para graficar</div>';
    return;
  }

  const w = 720;
  const h = 230;
  const padL = 42;
  const padR = 20;
  const padT = 22;
  const padB = 42;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...valores, 1);

  const pts = data.map((d, i) => {
    const x = padL + (innerW * i / Math.max(data.length - 1, 1));
    const y = padT + innerH - ((Number(d.metros || 0) / max) * innerH);
    return { x, y, ...d };
  });

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${padT + innerH} L ${pts[0].x.toFixed(1)} ${padT + innerH} Z`;

  const grid = [0, .25, .5, .75, 1].map(t => {
    const y = padT + innerH - (t * innerH);
    const val = max * t;
    return `
      <line class="chart-grid" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"></line>
      <text class="chart-label" x="8" y="${y + 4}">${fmt(val)}</text>
    `;
  }).join('');

  const labels = pts.map((p, i) => {
    const mes = String(p.key || '').slice(0,3);
    return `<text class="chart-label" x="${p.x}" y="${h - 15}" text-anchor="middle">${escapeHtml(mes)}</text>`;
  }).join('');

  const dots = pts.map(p => {
    const valueLabel = Number(p.metros || 0) > 0
      ? `<text class="chart-value" x="${p.x}" y="${p.y - 10}" text-anchor="middle">${fmt(p.metros)}</text>`
      : '';
    return `
      ${valueLabel}
      <circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="5"></circle>
    `;
  }).join('');

  cont.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Producción por mes">
      <defs>
        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#153bff" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#153bff" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      ${grid}
      <line class="chart-axis" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"></line>
      <path class="chart-area" d="${area}"></path>
      <path class="chart-line" d="${line}"></path>
      ${dots}
      ${labels}
    </svg>
  `;
}

function renderMeses(rows){
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const data = meses.map((nombre) => ({
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

  renderGraficaMeses(data);
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

  const clientes = groupBy(rows, p => String(p.cliente || '').trim()).sort((a,b)=>b.metros-a.metros);
  const recurrentes = [...clientes].sort((a,b)=>b.pedidos-a.pedidos);
  const materiales = groupBy(rows, p => String(p.material || '').trim()).sort((a,b)=>b.metros-a.metros);
  const impresiones = groupBy(rows, p => String(p.tipo_impresion || '').trim()).sort((a,b)=>b.metros-a.metros);
  const operadores = groupBy(rows, p => String(p.operador || '').trim()).sort((a,b)=>b.pedidos-a.pedidos);

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
    const el = $(id);
    if(el) el.innerHTML = `<div class="empty">${escapeHtml(msg)}</div>`;
  });

  const tbody = $('tablaClientes');
  if(tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(msg)}</td></tr>`;
}

document.addEventListener('DOMContentLoaded', cargarPedidosStats);

window.cargarPedidosStats = cargarPedidosStats;
window.renderEstadisticas = renderEstadisticas;
window.limpiarClienteStats = limpiarClienteStats;
