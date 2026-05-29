
/* COMANDA · Contador de horas de impresión v1
   - Calcula horas por pedido según Material + Tipo de impresión + Cantidad.
   - Regla especial: si el material tiene velocidad_m2_h, domina sobre el tipo de impresión.
   - Agrega 10 minutos por pedido.
   - Se monta solo: no rompe app.js.
*/
(function(){
  const CAMBIO_MINUTOS = 10;
  const $ = (id)=>document.getElementById(id);

  function norm(v){
    return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }

  function num(v){
    const s = String(v ?? '').replace(',', '.');
    const m = s.match(/-?\d+(\.\d+)?/);
    const n = m ? Number(m[0]) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function hmin(horas){
    const totalMin = Math.round(Number(horas||0) * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if(h <= 0) return `${m}m`;
    if(m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function velocidadFallbackTipo(nombre){
    const n = norm(nombre);
    if(n === 'normal') return 10;
    if(n === 'barniz') return 5;
    if(n === '5 capas') return 2;
    if(n === 'cbc') return 7;
    if(n === 'placa especial') return 5;
    if(n === 'sobre impresion') return 5;
    return 0;
  }

  function velocidadFallbackMaterial(nombre){
    const n = norm(nombre);
    if(n === 'glasse' || n === 'glassé' || n === 'glase' || n === 'glasee') return 5;
    return 0;
  }

  function leerCatalogo(arr, nombre){
    const n = norm(nombre);
    if(!Array.isArray(arr)) return null;
    return arr.find(x => norm(x.nombre) === n) || null;
  }

  async function cargarCatalogosDirecto(){
    if(!window.supabaseClient) return {materiales:[], tipos:[]};
    try{
      const [mat, imp] = await Promise.all([
        window.supabaseClient.from('materiales').select('nombre,velocidad_m2_h,activo'),
        window.supabaseClient.from('tipos_impresion').select('nombre,velocidad_m2_h,activo')
      ]);
      return {
        materiales: mat.error ? [] : (mat.data||[]),
        tipos: imp.error ? [] : (imp.data||[])
      };
    }catch(e){
      console.warn('No se pudieron cargar velocidades', e);
      return {materiales:[], tipos:[]};
    }
  }

  let cacheMateriales = [];
  let cacheTipos = [];

  function velocidadPedido(material, impresion){
    const mat = leerCatalogo(cacheMateriales.length ? cacheMateriales : window.materialesDB, material);
    const imp = leerCatalogo(cacheTipos.length ? cacheTipos : (window.tiposImpresionDB || window.impresionDB), impresion);

    const vMat = Number(mat?.velocidad_m2_h || 0) || velocidadFallbackMaterial(material);
    if(vMat > 0) return vMat; // Glasse o cualquier material con regla propia domina.

    const vImp = Number(imp?.velocidad_m2_h || 0) || velocidadFallbackTipo(impresion);
    return vImp;
  }

  function calcularPedido({cantidad, material, impresion}){
    const metros = num(cantidad);
    const velocidad = velocidadPedido(material, impresion);
    if(!metros || !velocidad) return {metros, velocidad, horas:0, cambio:0, total:0, ok:false};

    const horas = metros / velocidad;
    const cambio = CAMBIO_MINUTOS / 60;
    return {metros, velocidad, horas, cambio, total:horas + cambio, ok:true};
  }

  function crearPanel(){
    if($('contadorTiempoPanel')) return;

    const css = document.createElement('style');
    css.textContent = `
      .tiempo-panel{
        position:sticky;top:110px;z-index:650;margin:8px 14px 0;background:#fff;border:1px solid #d9deea;border-radius:16px;
        box-shadow:0 6px 20px rgba(15,23,42,.08);padding:10px 12px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;align-items:center
      }
      .tiempo-box{border:1px solid #e4e8f2;background:#f8f9ff;border-radius:12px;padding:8px 10px;min-width:0}
      .tiempo-label{font-family:var(--head,Montserrat);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .tiempo-value{font-family:var(--mono,monospace);font-size:17px;font-weight:900;color:#153bff;margin-top:2px;white-space:nowrap}
      .tiempo-note{grid-column:1/-1;font-size:11px;color:#64748b;line-height:1.25}
      .tiempo-chip{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#eef1ff;color:#153bff;border:1px solid #c7d2fe;font-family:var(--mono,monospace);font-size:11px;font-weight:900;padding:5px 8px;white-space:nowrap}
      @media(max-width:980px){.tiempo-panel{position:relative;top:auto;margin:7px 8px 0;grid-template-columns:1fr 1fr;padding:8px}.tiempo-value{font-size:14px}.tiempo-note{font-size:10px}}
      @media(max-width:430px){.tiempo-panel{grid-template-columns:1fr 1fr;gap:6px}.tiempo-box{padding:7px}.tiempo-label{font-size:8px}.tiempo-value{font-size:13px}}
    `;
    document.head.appendChild(css);

    const panel = document.createElement('div');
    panel.id = 'contadorTiempoPanel';
    panel.className = 'tiempo-panel';
    panel.innerHTML = `
      <div class="tiempo-box"><div class="tiempo-label">Pedidos visibles</div><div class="tiempo-value" id="tpPedidos">0</div></div>
      <div class="tiempo-box"><div class="tiempo-label">Metros visibles</div><div class="tiempo-value" id="tpMetros">0</div></div>
      <div class="tiempo-box"><div class="tiempo-label">Horas impresión</div><div class="tiempo-value" id="tpHoras">0m</div></div>
      <div class="tiempo-box"><div class="tiempo-label">Total + cambios</div><div class="tiempo-value" id="tpTotal">0m</div></div>
      <div class="tiempo-note">Incluye ${CAMBIO_MINUTOS} min por pedido. Si el material tiene velocidad propia, domina sobre el tipo de impresión. Glasse = 5 m²/h.</div>
    `;

    const toolbar = document.querySelector('.toolbar');
    if(toolbar) toolbar.insertAdjacentElement('afterend', panel);
    else document.body.prepend(panel);
  }

  function asegurarColumnaTiempo(){
    const table = document.querySelector('.table-wrap table');
    if(!table || table.dataset.tiempoCol === '1') return;

    const headRows = table.querySelectorAll('thead tr');
    if(headRows[0]){
      const th = document.createElement('th');
      th.textContent = 'Tiempo';
      headRows[0].insertBefore(th, headRows[0].children[13] || null);
    }
    if(headRows[1]){
      const th = document.createElement('th');
      th.innerHTML = '<div class="quick-hint">Auto</div>';
      headRows[1].insertBefore(th, headRows[1].children[13] || null);
    }

    table.style.minWidth = Math.max(num(table.style.minWidth), 1420) + 'px';
    table.dataset.tiempoCol = '1';
  }

  function leerTextoCelda(td){
    if(!td) return '';
    const control = td.querySelector('input,select,textarea');
    return control ? control.value : td.textContent;
  }

  function actualizarFilas(){
    asegurarColumnaTiempo();
    const rows = [...document.querySelectorAll('#orderTableBody tr')];
    let pedidos = 0, metrosTotal = 0, horasImp = 0, cambios = 0, total = 0;

    rows.forEach(tr=>{
      const c = tr.children;
      if(c.length < 13) return;

      // Si ya insertamos la columna, los índices originales siguen antes de tiempo.
      const cantidad = leerTextoCelda(c[5]);
      const material = leerTextoCelda(c[6]);
      const impresion = leerTextoCelda(c[7]);
      const calc = calcularPedido({cantidad, material, impresion});

      let tdTiempo = tr.querySelector('td[data-tiempo-cell="1"]');
      if(!tdTiempo){
        tdTiempo = document.createElement('td');
        tdTiempo.dataset.tiempoCell = '1';
        tr.insertBefore(tdTiempo, c[13] || null);
      }

      tdTiempo.innerHTML = calc.ok
        ? `<span class="tiempo-chip" title="${calc.metros} m² / ${calc.velocidad} m²/h + ${CAMBIO_MINUTOS} min cambio">${hmin(calc.total)}</span>`
        : `<span class="tiempo-chip" style="opacity:.45">—</span>`;

      if(calc.ok){
        pedidos++;
        metrosTotal += calc.metros;
        horasImp += calc.horas;
        cambios += calc.cambio;
        total += calc.total;
      }
    });

    if($('tpPedidos')) $('tpPedidos').textContent = pedidos;
    if($('tpMetros')) $('tpMetros').textContent = metrosTotal.toFixed(2);
    if($('tpHoras')) $('tpHoras').textContent = hmin(horasImp);
    if($('tpTotal')) $('tpTotal').textContent = hmin(total);
  }

  async function init(){
    crearPanel();
    const cats = await cargarCatalogosDirecto();
    cacheMateriales = cats.materiales;
    cacheTipos = cats.tipos;
    actualizarFilas();

    setInterval(actualizarFilas, 1200);

    const tbody = $('orderTableBody');
    if(tbody && window.MutationObserver){
      new MutationObserver(()=>setTimeout(actualizarFilas, 80)).observe(tbody,{childList:true,subtree:true,characterData:true});
    }
    document.addEventListener('change', ()=>setTimeout(actualizarFilas,80));
    document.addEventListener('input', ()=>setTimeout(actualizarFilas,80));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
