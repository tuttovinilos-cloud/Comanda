console.log('ESTADISTICAS v68 operadores agrupados');

let pedidosStats = [];
let operadoresStatsDB = [];
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

async function cargarOperadoresStats(){
  if(!db()) return [];

  try{
    const { data, error } = await db()
      .from('operadores')
      .select('id,nombre,activo,rol')
      .eq('activo', true)
      .order('id', { ascending:true });

    if(error) throw error;

    operadoresStatsDB = (data || [])
      .filter(op => op && limpiarTexto(op.nombre, '') !== '')
      .map(op => ({
        id: Number(op.id || 9999),
        nombre: limpiarTexto(op.nombre, 'Sin dato'),
        rol: limpiarTexto(op.rol, ''),
        activo: op.activo !== false
      }));

    return operadoresStatsDB;
  }catch(e){
    console.warn('No se pudo cargar operadores registrados:', e);
    operadoresStatsDB = [];
    return [];
  }
}

async function cargarPedidosStats(){
  if(!db()){
    showToast('No existe conexión Supabase. Revisa js/supabase.js');
    console.error('No existe window.supabaseClient');
    return;
  }

  setEmptyAll('Cargando estadísticas...');

  await cargarOperadoresStats();

  let res = await db()
    .from('pedidos')
    .select('id,fecha,operador,cliente,descripcion,cantidad,material,tipo_impresion,estatus_trabajo,estatus_pago,fecha_entrega,precio_total,monto_abonado,pago_simple_total,pago_simple_pagado,pago_simple_saldo,pago_simple_a_favor,pago_simple_estado,pago_simple_fecha')
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

function estadoPagoPedidoStats(p){
  const estadoNuevo = normalizar(p && p.pago_simple_estado ? p.pago_simple_estado : '');
  const estadoViejo = normalizar(p && p.estatus_pago ? p.estatus_pago : '');
  const totalSimple = numero(p && p.pago_simple_total !== undefined ? p.pago_simple_total : 0);
  const pagadoSimple = numero(p && p.pago_simple_pagado !== undefined ? p.pago_simple_pagado : 0);
  const saldoSimple = numero(p && p.pago_simple_saldo !== undefined ? p.pago_simple_saldo : 0);
  const aFavorSimple = numero(p && p.pago_simple_a_favor !== undefined ? p.pago_simple_a_favor : 0);
  const precioTotal = numero(p && p.precio_total !== undefined ? p.precio_total : 0);
  const montoAbonado = numero(p && p.monto_abonado !== undefined ? p.monto_abonado : 0);

  // Sistema nuevo de pagos: PAGADO domina aunque el monto sea 0.
  if(estadoNuevo === 'pagado') return 'pagado';
  if(aFavorSimple > 0.009) return 'pagado';
  if(saldoSimple > 0.009) return 'pendiente';
  if(totalSimple > 0 && pagadoSimple >= (totalSimple - 0.009)) return 'pagado';

  // Fallback viejo.
  if(estadoViejo === 'pagado') return 'pagado';
  if(precioTotal > 0 && montoAbonado >= (precioTotal - 0.009)) return 'pagado';

  return 'pendiente';
}

function pedidoPagadoStats(p){
  return estadoPagoPedidoStats(p) === 'pagado';
}

function pedidoPendienteStats(p){
  return !pedidoPagadoStats(p);
}

function crearGrupo(key, extra={}){
  return {
    key,
    pedidos:0,
    metros:0,
    listos:0,
    pagados:0,
    pendientes:0,
    primero:null,
    ultimo:null,
    items:[],
    registrado:false,
    orden:9999,
    ...extra
  };
}

function sumarPedidoGrupo(g, p){
  g.pedidos += 1;
  g.metros += numero(p.cantidad);

  if(normalizar(p.estatus_trabajo) === 'listo') g.listos += 1;
  if(pedidoPagadoStats(p)) g.pagados += 1;
  if(pedidoPendienteStats(p)) g.pendientes += 1;

  const f = String(p.fecha || '').slice(0,10);
  if(f){
    if(!g.primero || f < g.primero) g.primero = f;
    if(!g.ultimo || f > g.ultimo) g.ultimo = f;
  }

  g.items.push(p);
}

function groupBy(rows, keyFn){
  const map = new Map();

  rows.forEach(p => {
    const show = limpiarTexto(keyFn(p), 'Sin dato');
    const key = normalizar(show) || 'sin dato';

    if(!map.has(key)) map.set(key, crearGrupo(show));
    sumarPedidoGrupo(map.get(key), p);
  });

  return [...map.values()];
}

function nombreOperadorCanonico(nombre){
  const limpio = limpiarTexto(nombre, '');
  const n = normalizar(limpio);

  // Todo lo que venía vacío, "Añadir" o "Sin dato" fue cargado como operador accidental.
  // Roberto pidió agruparlo como Ricardo.
  if(!n || n === 'sin dato' || n === 'empty' || n === 'null' || n === 'anadir' || n === 'operador') return 'Ricardo';
  if(n.includes('ricardo')) return 'Ricardo';

  if(n.includes('roberto')) return 'Roberto';
  if(n.includes('chico') || n.includes('francisco')) return 'Chico';
  if(n.includes('gabriela') || n === 'm gabriela') return 'M. Gabriela';
  if(n.includes('ruben')) return 'Rubén';
  if(n.includes('miguel')) return 'Miguel Gonzales';
  if(n.includes('ana virginia') || n.includes('ana santana')) return 'Ana Virginia Santana';
  if(n.includes('carlos')) return 'Carlos Miguel';

  return limpio || 'Ricardo';
}

function operadoresBaseRegistrados(){
  const map = new Map();

  operadoresStatsDB.forEach((op, index) => {
    const nombre = nombreOperadorCanonico(op.nombre);
    const key = normalizar(nombre);
    if(!key) return;

    if(!map.has(key)){
      map.set(key, crearGrupo(nombre, {
        registrado:true,
        orden:Number(op.id || index + 1),
        rol:op.rol || ''
      }));
    }else{
      const g = map.get(key);
      g.registrado = true;
      g.orden = Math.min(g.orden || 9999, Number(op.id || index + 1));
    }
  });

  // Fallback mínimo por si la consulta de operadores falla.
  ['Roberto','Ricardo','Chico','M. Gabriela','Rubén'].forEach((nombre, idx) => {
    const key = normalizar(nombre);
    if(!map.has(key)){
      map.set(key, crearGrupo(nombre, { registrado:false, orden:9000 + idx }));
    }
  });

  return map;
}

function groupOperadores(rows){
  const map = operadoresBaseRegistrados();

  rows.forEach(p => {
    const nombre = nombreOperadorCanonico(p.operador);
    const key = normalizar(nombre) || 'ricardo';

    if(!map.has(key)){
      map.set(key, crearGrupo(nombre, { registrado:false, orden:9500 }));
    }

    sumarPedidoGrupo(map.get(key), p);
  });

  return [...map.values()].sort((a,b) => {
    const aCon = a.pedidos > 0;
    const bCon = b.pedidos > 0;
    if(aCon !== bCon) return aCon ? -1 : 1;
    if(b.pedidos !== a.pedidos) return b.pedidos - a.pedidos;
    return (a.orden || 9999) - (b.orden || 9999) || a.key.localeCompare(b.key, 'es');
  });
}

function renderList(id, rows, mode='metros'){
  const el = $(id);
  if(!el) return;

  if(!rows.length){
    el.innerHTML = '<div class="empty">Sin datos</div>';
    return;
  }

  const ordenados = id === 'metrosPorMes' ? rows.slice(0,12) : rows.slice(0,10);
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

function renderOperadores(rows){
  const el = $('operadoresUsados');
  if(!el) return;

  if(!rows.length){
    el.innerHTML = '<div class="empty">Sin operadores</div>';
    return;
  }

  const max = Math.max(...rows.map(r => r.pedidos), 1);

  el.innerHTML = rows.map((r, i) => {
    const pct = r.pedidos > 0 ? Math.max(4, (r.pedidos / max) * 100) : 0;
    const estado = r.pedidos > 0 ? `${fmt(r.pedidos)} pedidos` : 'Sin pedidos';
    const claseCero = r.pedidos > 0 ? '' : ' is-zero';

    return `<div class="operator-mini${claseCero}">
      <div class="operator-head">
        <div class="operator-title"><span>${i + 1}.</span> ${escapeHtml(r.key)}</div>
        <div class="operator-total">${escapeHtml(estado)}</div>
      </div>
      <div class="operator-grid">
        <span><b>${fmt(r.metros)}</b><small>metros</small></span>
        <span><b>${fmt(r.listos)}</b><small>listos</small></span>
        <span><b>${fmt(r.pagados)}</b><small>pagados</small></span>
        <span><b>${fmt(r.pendientes)}</b><small>pend.</small></span>
      </div>
      <div class="stat-mini-track operator-track">
        <div class="stat-mini-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join('');
}

function renderMeses(rows){
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const data = meses.map(nombre => crearGrupo(nombre));

  rows.forEach(p => {
    const m = Number(String(p.fecha || '').slice(5,7));
    if(m >= 1 && m <= 12){
      sumarPedidoGrupo(data[m-1], p);
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
  const operadores = groupOperadores(rows);

  const totalMetros = rows.reduce((a,p)=>a+numero(p.cantidad),0);

  if($('kpiPedidos')) $('kpiPedidos').textContent = fmt(rows.length);
  if($('kpiMetros')) $('kpiMetros').textContent = fmt(totalMetros);
  if($('kpiClientes')) $('kpiClientes').textContent = fmt(clientes.length);
  if($('kpiListos')) $('kpiListos').textContent = fmt(rows.filter(p => normalizar(p.estatus_trabajo) === 'listo').length);
  if($('kpiPagados')) $('kpiPagados').textContent = fmt(rows.filter(pedidoPagadoStats).length);

  const q = $('filterClienteSearch')?.value.trim() || '';

  if($('filterInfo')){
    const pagados = rows.filter(pedidoPagadoStats).length;
    const pendientes = rows.length - pagados;
    const activos = operadores.filter(o => o.pedidos > 0).length;
    $('filterInfo').innerHTML = `<span>Viendo estadísticas de <strong>${q ? escapeHtml(q) : 'todos los clientes'}</strong>.</span><span id="filterCount">${rows.length} pedido${rows.length===1?'':'s'} · ${fmt(totalMetros)} m · ${fmt(pagados)} pagado${pagados===1?'':'s'} · ${fmt(pendientes)} pendiente${pendientes===1?'':'s'} · ${fmt(activos)} operador${activos===1?'':'es'}</span>`;
  }

  renderList('topClientes', clientes, 'metros');
  renderList('clientesRecurrentes', recurrentes, 'pedidos');
  renderList('materialesUsados', materiales, 'metros');
  renderList('impresionesUsadas', impresiones, 'metros');
  renderOperadores(operadores);
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
