<!DOCTYPE html>
<html lang="es" class="loading-menu">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<title>COMANDA · Producción · Tuttovinilos</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f0f2f9;
  --panel:#ffffff;
  --panel2:#f8f9ff;
  --border:#d9deea;
  --border2:#cbd3e6;
  --text:#111827;
  --muted:#6b7280;
  --muted2:#475569;
  --accent:#153bff;
  --accent2:#0b1f7a;
  --red:#dc2626;
  --yellow:#f59e0b;
  --green:#16a34a;
  --orange:#ff8616;
  --mono:'Roboto Mono',monospace;
  --head:'Montserrat',Arial,sans-serif;
  --body:'Inter',Arial,sans-serif;
  --sticky-head-top:58px;
  --sticky-quick-top:96px;
}
html{scroll-behavior:smooth}
body{
  background:var(--bg);
  color:var(--text);
  font-family:var(--body);
  min-height:100vh;
  -webkit-tap-highlight-color:transparent;
  padding-bottom:110px;
}
button,input,select,textarea{font:inherit}
button{touch-action:manipulation}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
/* HEADER */
.header{
  background:var(--panel);
  border-bottom:2px solid var(--accent);
  padding:10px 16px;
  display:flex;
  align-items:center;
  gap:12px;
  min-height:58px;
  position:sticky;
  top:0;
  z-index:300;
  box-shadow:0 4px 24px #0009;
  flex-wrap:wrap;
}
.logo{
  font-family:var(--head);
  font-size:21px;
  font-weight:900;
  letter-spacing:3px;
  color:var(--accent2);
  text-transform:uppercase;
  white-space:nowrap;
}
.logo small{
  color:var(--muted);
  font-weight:400;
  font-size:11px;
  letter-spacing:1px;
  margin-left:6px;
}
.header-tabs{
  display:flex;
  gap:6px;
  margin-left:auto;
  align-items:center;
  flex-wrap:wrap;
}
.tab-btn{
  font-family:var(--head);
  font-size:12px;
  font-weight:700;
  letter-spacing:1.5px;
  text-transform:uppercase;
  padding:7px 14px;
  border:1px solid var(--border2);
  background:transparent;
  color:var(--muted2);
  cursor:pointer;
  border-radius:6px;
  transition:all .2s;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
}
.tab-btn:hover{
  border-color:var(--accent);
  color:var(--accent2);
  background:#3b82f611;
}
.tab-btn.active{
  background:var(--accent);
  color:#fff;
  border-color:var(--accent);
  box-shadow:0 0 14px #3b82f644;
}
.mobile-menu-btn{
  display:none;
  font-family:var(--head);
  font-size:12px;
  font-weight:900;
  letter-spacing:1.5px;
  text-transform:uppercase;
  padding:8px 12px;
  border:1px solid var(--border2);
  background:var(--panel2);
  color:var(--accent2);
  border-radius:7px;
  cursor:pointer;
  margin-left:auto;
}
.mobile-menu-extra{display:none}
.menu-action-btn{width:100%}
/* TOOLBAR */
.toolbar{
  display:flex;
  gap:8px;
  padding:12px 16px;
  flex-wrap:wrap;
  border-bottom:1px solid var(--border);
  align-items:center;
  background:var(--bg);
  position:relative;
  z-index:50;
}
.search-wrap{
  display:flex;
  align-items:center;
  gap:8px;
  background:var(--panel);
  border:1px solid var(--border2);
  border-radius:7px;
  padding:9px 12px;
  flex:1;
  min-width:260px;
  min-height:40px;
}
.search-wrap input{
  background:none;
  border:none;
  outline:none;
  color:var(--text);
  font-family:var(--mono);
  font-size:13px;
  width:100%;
}
.search-wrap input::placeholder{color:var(--muted)}
.filter-sel{
  background:var(--panel);
  border:1px solid var(--border2);
  color:var(--text);
  font-family:var(--head);
  font-size:12px;
  font-weight:700;
  letter-spacing:1px;
  padding:8px 10px;
  border-radius:7px;
  outline:none;
  cursor:pointer;
  min-height:40px;
}
.btn-add{
  font-family:var(--head);
  font-size:12px;
  font-weight:700;
  letter-spacing:1.5px;
  text-transform:uppercase;
  padding:9px 14px;
  background:var(--accent);
  color:#fff;
  border:none;
  border-radius:7px;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  white-space:nowrap;
  transition:all .2s;
  text-decoration:none;
  min-height:40px;
}
.btn-add:hover{filter:brightness(1.1)}
.btn-add.secondary{
  background:transparent;
  color:var(--muted2);
  border:1px solid var(--border2);
}
.storage-badge{
  display:flex;
  align-items:center;
  gap:6px;
  background:var(--panel);
  border:1px solid var(--border2);
  border-radius:7px;
  padding:8px 10px;
  white-space:nowrap;
  min-height:40px;
}
.storage-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:var(--yellow);
}
.storage-badge.ok .storage-dot{background:var(--green)}
.storage-badge span{
  font-family:var(--head);
  font-size:11px;
  font-weight:700;
  letter-spacing:1px;
  color:var(--muted2);
  text-transform:uppercase;
}
.desktop-only{display:flex}
/* TABLE */
.table-wrap{
  overflow-x:auto;
  margin-top:0;
  padding:0 0 130px;
  -webkit-overflow-scrolling:touch;
}
table{
  width:100%;
  border-collapse:collapse;
  min-width:1180px;
}
thead tr{
  border-bottom:2px solid var(--border2);
  background:var(--panel);
}
th{
  position:static;
  top:auto;
  z-index:40;
  background:var(--panel);
  font-family:var(--head);
  font-size:10px;
  font-weight:700;
  letter-spacing:2px;
  text-transform:uppercase;
  color:var(--muted);
  padding:10px;
  text-align:left;
  white-space:nowrap;
}
td{
  padding:10px;
  font-size:13px;
  vertical-align:middle;
  border-bottom:1px solid rgba(255,255,255,0.06);
}
tbody tr{
  transition:background .12s;
  cursor:pointer;
}
tbody tr:nth-child(even){background:rgba(255,255,255,0.015)}
tbody tr:hover{background:rgba(59,130,246,0.08)}
tbody::before{
  content:"";
  display:block;
  height:6px;
}
#orderTableBody td:nth-child(2){
  color:#7f8ea3;
  font-size:12px;
  font-family:var(--mono);
}
#orderTableBody td:nth-child(3){
  font-weight:700;
  font-family:var(--head);
  letter-spacing:.5px;
  color:#8ec5ff;
}
#orderTableBody td:nth-child(4){
  color:#5ea8ff;
  font-weight:700;
}
#orderTableBody td:nth-child(5){
  color:#e5edf8;
  line-height:1.25;
}
.cell-edit,
.cell-select,
.quick-input,
.quick-select,
.quick-btn{
  width:100%;
  background:var(--bg);
  border:1px solid var(--border2);
  color:var(--text);
  border-radius:7px;
  padding:7px 8px;
  font-family:var(--body);
  font-size:12px;
  outline:none;
}
.cell-edit:focus,
.cell-select:focus,
.quick-input:focus,
.quick-select:focus{
  border-color:var(--accent);
  box-shadow:0 0 0 2px #3b82f622;
}
.cell-select option,
.quick-select option{
  background:var(--panel);
  color:var(--text);
}
.cell-edit:disabled,
.quick-input:disabled,
.quick-select:disabled{
  opacity:.55;
  cursor:not-allowed;
}
.quick-entry-row th{
  background:var(--panel2);
  padding:6px;
  border-bottom:1px solid var(--border2);
  position:static;
  top:auto;
  z-index:20;
}
.quick-btn{
  font-family:var(--head);
  font-weight:800;
  letter-spacing:1px;
  text-transform:uppercase;
  background:var(--accent);
  border-color:var(--accent);
  cursor:pointer;
  color:#fff;
  min-height:34px;
}
.quick-btn.secondary{
  background:transparent;
  color:var(--muted2);
  border-color:var(--border2);
}
.quick-textarea{
  min-height:34px;
  resize:vertical;
  line-height:1.25;
}
.quick-textarea:focus{min-height:90px}
.quick-hint{
  font-size:10px;
  color:var(--muted);
  margin-top:2px;
  text-align:left;
}
.quick-mini-btn{
  width:34px;
  min-width:34px;
  height:34px;
  border-radius:7px;
  border:1px dashed var(--border2);
  background:transparent;
  color:var(--accent2);
  cursor:pointer;
  font-weight:700;
}
.quick-mini-btn:hover{
  border-color:var(--accent);
  background:#3b82f611;
}
.add-symbol-btn{
  font-size:24px;
  font-weight:900;
  line-height:1;
  padding:4px 8px;
  width:70%;
  min-width:34px;
  margin-inline:auto;
}
/* STATUS */
.status-solicitud{color:var(--red);border-color:#FF3B3044;background:#FF3B3011}
.status-revisado{color:var(--yellow);border-color:#FFD60A44;background:#FFD60A11}
.status-listo{color:var(--green);border-color:#30D15844;background:#30D15811}
.pago-pendiente{color:var(--red);border-color:#FF3B3044;background:#FF3B3011}
.pago-abonado{color:var(--orange);border-color:#FF9F0A44;background:#FF9F0A11}
.pago-pagado{color:var(--green);border-color:#30D15844;background:#30D15811}
.empty{
  text-align:center;
  padding:60px 20px;
  color:var(--muted);
  font-family:var(--head);
  font-size:15px;
  letter-spacing:2px;
}
.file-link-chip,
.quick-attach-link{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:6px 10px;
  border:1px solid var(--border2);
  border-radius:7px;
  background:transparent;
  color:var(--accent2);
  cursor:pointer;
  font-family:var(--head);
  font-size:11px;
  letter-spacing:1px;
  text-transform:uppercase;
  text-decoration:none;
  transition:all .2s;
}
.file-link-chip:hover,
.quick-attach-link:hover{
  border-color:var(--accent);
  background:#3b82f611;
}
/* MODAL */
.backdrop{
  position:fixed;
  inset:0;
  background:#000b;
  z-index:500;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  backdrop-filter:blur(3px);
  padding:0;
}
.modal{
  background:var(--panel);
  border:1px solid var(--border2);
  width:100%;
  max-width:560px;
  max-height:94vh;
  overflow-y:auto;
  border-radius:14px 14px 0 0;
  box-shadow:0 -8px 60px #000c;
  animation:slideUp .22s ease;
}
@keyframes slideUp{
  from{transform:translateY(50px);opacity:0}
  to{transform:none;opacity:1}
}
.modal-handle{
  width:36px;
  height:4px;
  background:var(--border2);
  border-radius:2px;
  margin:10px auto 0;
}
.modal-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:16px 20px;
  border-bottom:1px solid var(--border);
}
.modal-title{
  font-family:var(--head);
  font-size:18px;
  font-weight:900;
  letter-spacing:2px;
  text-transform:uppercase;
}
.modal-close{
  width:32px;
  height:32px;
  border-radius:7px;
  border:1px solid var(--border2);
  background:transparent;
  color:var(--muted);
  cursor:pointer;
  font-size:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:all .2s;
}
.modal-close:hover{
  border-color:var(--red);
  color:var(--red);
}
.modal-body{
  padding:20px;
  display:flex;
  flex-direction:column;
  gap:14px;
}
.modal-footer{
  padding:14px 20px;
  border-top:1px solid var(--border);
  display:flex;
  gap:8px;
  justify-content:flex-end;
  flex-wrap:wrap;
}
.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}
.form-full{grid-column:1/-1}
.field{
  display:flex;
  flex-direction:column;
  gap:5px;
}
.field label{
  font-family:var(--head);
  font-size:10px;
  font-weight:700;
  letter-spacing:2px;
  color:var(--muted);
  text-transform:uppercase;
}
.field input,
.field select,
.field textarea{
  background:var(--bg);
  border:1px solid var(--border2);
  color:var(--text);
  border-radius:8px;
  padding:10px 12px;
  font-family:var(--body);
  font-size:14px;
  outline:none;
  transition:border .2s;
  width:100%;
}
.field input:focus,
.field select:focus,
.field textarea:focus{
  border-color:var(--accent);
  box-shadow:0 0 0 2px #3b82f622;
}
.field input:disabled,
.field select:disabled,
.field textarea:disabled{
  opacity:.55;
  cursor:not-allowed;
}
.field textarea{
  resize:vertical;
  min-height:76px;
}
.field select option{background:var(--panel)}
.file-drop{
  border:2px dashed var(--border2);
  border-radius:10px;
  padding:20px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:6px;
  transition:border-color .2s,background .2s;
  min-height:90px;
}
.file-drop:hover{
  border-color:var(--accent);
  background:#3b82f611;
}
.file-preview-box{
  border:1px solid var(--border2);
  border-radius:10px;
  overflow:hidden;
  position:relative;
  background:var(--bg);
  min-height:90px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.file-remove-btn{
  position:absolute;
  top:6px;
  right:6px;
  width:28px;
  height:28px;
  border-radius:50%;
  background:#0009;
  border:1px solid #ffffff22;
  color:#fff;
  font-size:12px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
}
.file-remove-btn:hover{background:#FF3B30cc}
#rowFileInput{display:none}
/* NOTIFICACIONES */
.noti-btn{
  font-family:var(--head);
  font-size:12px;
  font-weight:800;
  letter-spacing:1.2px;
  text-transform:uppercase;
  padding:8px 12px;
  border:1px solid var(--border2);
  background:var(--panel2);
  color:var(--accent2);
  border-radius:7px;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:7px;
  min-height:38px;
  white-space:nowrap;
}
.noti-btn:hover{
  border-color:var(--accent);
  background:#3b82f611;
}
.noti-count{
  min-width:22px;
  height:22px;
  padding:0 6px;
  border-radius:999px;
  background:var(--red);
  color:#fff;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-family:var(--mono);
  font-size:11px;
}
.noti-count.empty{
  background:var(--border2);
  color:var(--muted2);
}
.noti-list{
  display:grid;
  gap:10px;
}
.noti-item{
  border:1px solid var(--border2);
  background:var(--bg);
  border-radius:10px;
  padding:12px;
  display:grid;
  gap:6px;
}
.noti-item-title{
  font-family:var(--head);
  font-size:16px;
  font-weight:900;
  letter-spacing:1px;
  color:var(--accent2);
  text-transform:uppercase;
}
.noti-item-msg{
  color:var(--text);
  line-height:1.35;
  font-size:13px;
}
.noti-item-meta{
  color:var(--muted2);
  font-family:var(--mono);
  font-size:11px;
}
.noti-actions{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-top:4px;
}

.toast{
  position:fixed;
  left:50%;
  bottom:84px;
  transform:translateX(-50%);
  background:var(--panel2);
  color:var(--text);
  border:1px solid var(--border2);
  border-radius:10px;
  padding:10px 16px;
  z-index:999999;
  display:none;
  box-shadow:0 12px 35px #0008;
  font-family:var(--head);
  font-size:13px;
  font-weight:800;
  letter-spacing:1px;
  text-transform:uppercase;
  max-width:90vw;
  text-align:center;
}
/* DESKTOP MODAL */
@media(min-width:600px){
  .backdrop{
    align-items:center;
    padding:16px;
  }
  .modal{
    border-radius:12px;
    animation:popIn .18s ease;
  }
  @keyframes popIn{
    from{transform:scale(.96) translateY(10px);opacity:0}
    to{transform:none;opacity:1}
  }
}
/* TABLET */
@media(max-width:980px){
  .header{
    align-items:center;
  }
  .header-tabs{
    width:100%;
    margin-left:0;
  }
  .tab-btn{
    flex:1 1 calc(50% - 6px);
    justify-content:center;
    font-size:11px;
    padding:9px 8px;
  }
}
/* MOBILE */
@media(max-width:760px){
  body{
    padding-bottom:130px;
  }
  .header{
    padding:10px 12px;
    align-items:center;
  }
  .logo{
    font-size:19px;
  }
  .mobile-menu-btn{
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }
  .header-tabs{
    display:none;
    width:100%;
    margin-left:0;
    padding-top:8px;
    border-top:1px solid var(--border);
  }
  .header-tabs.open{
    display:grid;
    grid-template-columns:1fr;
    gap:7px;
  }
  .tab-btn{
    width:100%;
    justify-content:center;
    font-size:11px;
    min-height:38px;
    padding:8px 6px;
  }
  .toolbar{
    padding:10px;
    gap:7px;
  }
  .search-wrap{
    min-width:100%;
    flex:1 1 100%;
    order:1;
  }
  #filterStatus,
  #filterPago,
  #filterFechaDesde,
  #filterFechaHasta,
  #filterOperador{
    flex:1 1 calc(20% - 7px);
    min-width:0;
    order:2;
    font-size:8.5px;
    padding:7px 2px;
  }
  .desktop-only{
    display:none !important;
  }
  .mobile-menu-extra{
    display:flex;
    flex-direction:column;
    gap:7px;
    grid-column:1 / -1;
    padding-top:8px;
    border-top:1px solid var(--border);
  }
  .mobile-menu-extra .storage-badge{
    width:100%;
    justify-content:center;
  }
  .mobile-menu-extra .btn-add{
    width:100%;
  }
  .add-symbol-btn{
    width:70%;
    max-width:42px;
    min-width:38px;
  }
  th{
    position:static;
    top:auto;
  }
  .quick-entry-row th{
    position:static;
    top:auto;
  }
  thead tr:first-child th{
    position:sticky;
    top:0;
    z-index:40;
  }
  .table-wrap{
    margin-top:0;
    padding-bottom:140px;
  }
  tbody::before{
    height:8px;
  }
  table{
    min-width:1050px;
  }
  .quick-input,
  .quick-select,
  .quick-btn{
    min-height:36px;
  }
}
/* IPHONE SE */
@media(max-width:430px){
  .header-tabs.open{
    grid-template-columns:1fr;
  }
  .logo small{
    display:none;
  }
  #filterStatus,
  #filterPago,
  #filterFechaDesde,
  #filterFechaHasta,
  #filterOperador{
    flex:1 1 calc(20% - 7px);
    min-width:0;
    font-size:8px;
    padding:7px 2px;
  }
  .quick-input,
  .quick-select,
  .quick-btn{
    font-size:11px;
    padding:7px 6px;
  }
  .modal-body{
    padding:16px;
  }
  .form-grid{
    grid-template-columns:1fr;
  }
}


/* ═══════════════════════════════════════════════════
   TEMA CLARO · ESTILO COTIZADOR TUTTOVINILOS
   Solo cambia apariencia. No toca lógica ni scripts.
   ═══════════════════════════════════════════════════ */
body{
  background:var(--bg)!important;
  color:var(--text)!important;
}
::-webkit-scrollbar-track{background:#eef1ff!important}
::-webkit-scrollbar-thumb{background:#cbd3e6!important}
.header{
  background:linear-gradient(135deg,#153bff,#0b1f7a)!important;
  border-bottom:none!important;
  box-shadow:0 8px 24px rgba(21,59,255,.24)!important;
}
.logo{
  color:#fff!important;
  border:2px dashed rgba(255,255,255,.45);
  border-radius:12px;
  padding:7px 12px;
  letter-spacing:2px!important;
}
.logo small{color:rgba(255,255,255,.78)!important}
.mobile-menu-btn,
.noti-btn{
  background:rgba(255,255,255,.12)!important;
  color:#fff!important;
  border-color:rgba(255,255,255,.28)!important;
  border-radius:999px!important;
}
.header-tabs{gap:8px!important}
.tab-btn{
  background:rgba(255,255,255,.10)!important;
  color:rgba(255,255,255,.86)!important;
  border-color:rgba(255,255,255,.24)!important;
  border-radius:999px!important;
  box-shadow:none!important;
}
.tab-btn:hover{
  background:rgba(255,255,255,.18)!important;
  color:#fff!important;
  border-color:rgba(255,255,255,.40)!important;
}
.tab-btn.active{
  background:#fff!important;
  color:#153bff!important;
  border-color:#fff!important;
  box-shadow:0 8px 20px rgba(0,0,0,.14)!important;
}
.toolbar{
  background:#fff!important;
  border-bottom:1px solid var(--border)!important;
  box-shadow:0 4px 18px rgba(0,0,0,.045);
}
.search-wrap,
.storage-badge,
.filter-sel,
.quick-input,
.quick-select,
.cell-edit,
.cell-select,
.field input,
.field select,
.field textarea{
  background:#fff!important;
  color:#111827!important;
  border-color:#d9deea!important;
  box-shadow:none!important;
}
.search-wrap{
  border-radius:14px!important;
}
.search-wrap input{color:#111827!important}
.search-wrap input::placeholder,
.quick-input::placeholder,
.field input::placeholder,
.field textarea::placeholder{
  color:#8a94a6!important;
}
.filter-sel{
  border-radius:999px!important;
  font-weight:800!important;
  color:#153bff!important;
}
.quick-input:focus,
.quick-select:focus,
.cell-edit:focus,
.cell-select:focus,
.field input:focus,
.field select:focus,
.field textarea:focus{
  border-color:#153bff!important;
  box-shadow:0 0 0 3px rgba(21,59,255,.10)!important;
}
.table-wrap{
  background:#f0f2f9!important;
}
table{
  background:#fff!important;
}
thead tr,
.quick-entry-row th{
  background:#eef1ff!important;
  border-bottom:1px solid #d9deea!important;
}
th{
  background:#eef1ff!important;
  color:#6b7280!important;
}
td{
  color:#111827!important;
  border-bottom:1px solid #e5e7f0!important;
  background:#fff;
}
tbody tr:nth-child(even) td,
tbody tr:nth-child(even){
  background:#f8f9ff!important;
}
tbody tr:hover td,
tbody tr:hover{
  background:#eef1ff!important;
}
#orderTableBody td:nth-child(2){color:#6b7280!important}
#orderTableBody td:nth-child(3){color:#0b1f7a!important}
#orderTableBody td:nth-child(4),
.td-client{color:#153bff!important}
#orderTableBody td:nth-child(5),
.td-desc{color:#374151!important}
.quick-btn,
.btn-add{
  background:#153bff!important;
  color:#fff!important;
  border-color:#153bff!important;
  border-radius:12px!important;
  box-shadow:0 6px 16px rgba(21,59,255,.18);
}
.quick-btn.secondary,
.btn-add.secondary,
.quick-mini-btn,
.modal-close,
.btn-icon{
  background:#fff!important;
  color:#153bff!important;
  border-color:#cbd3e6!important;
  box-shadow:none!important;
}
.quick-mini-btn:hover,
.btn-icon:hover{
  background:#eef1ff!important;
  border-color:#153bff!important;
  color:#153bff!important;
}
.add-symbol-btn{
  background:#153bff!important;
  color:#fff!important;
  border-radius:14px!important;
}
.quick-hint,
.storage-badge span,
.field label{
  color:#6b7280!important;
}
.backdrop{
  background:rgba(17,24,39,.35)!important;
}
.modal{
  background:#fff!important;
  border-color:#d9deea!important;
  box-shadow:0 24px 80px rgba(17,24,39,.22)!important;
}
.modal-header,
.modal-footer{
  border-color:#d9deea!important;
  background:#fff!important;
}
.modal-title{
  color:#153bff!important;
}
.modal-handle{
  background:#cbd3e6!important;
}
.file-drop,
.file-preview-box,
.noti-item{
  background:#f8f9ff!important;
  border-color:#d9deea!important;
  color:#111827!important;
}
.noti-item-title{color:#153bff!important}
.noti-item-msg{color:#111827!important}
.noti-item-meta{color:#6b7280!important}
.toast{
  background:#111827!important;
  color:#fff!important;
  border-color:#111827!important;
}
.empty{
  color:#6b7280!important;
}
.status-solicitud,
.pago-pendiente{
  color:#dc2626!important;
  border-color:#fecaca!important;
  background:#fee2e2!important;
}
.status-revisado,
.pago-abonado{
  color:#b45309!important;
  border-color:#fde68a!important;
  background:#fef3c7!important;
}
.status-listo,
.pago-pagado{
  color:#16a34a!important;
  border-color:#86efac!important;
  background:#dcfce7!important;
}
.file-link-chip,
.quick-attach-link{
  color:#153bff!important;
  background:#eef1ff!important;
  border-color:#cbd3e6!important;
  border-radius:999px!important;
}
.file-link-chip:hover,
.quick-attach-link:hover{
  border-color:#153bff!important;
  background:#e4e9ff!important;
}
@media(max-width:760px){
  .header-tabs{
    border-top:1px solid rgba(255,255,255,.22)!important;
  }
  .mobile-menu-extra{
    border-top:1px solid rgba(255,255,255,.22)!important;
  }
  .mobile-menu-extra .storage-badge{
    background:rgba(255,255,255,.12)!important;
    border-color:rgba(255,255,255,.24)!important;
  }
  .mobile-menu-extra .storage-badge span{color:#fff!important}
}



/* === SAFE PATCH v4: solo visual. No toca JS, Supabase ni guardado === */
.logo{letter-spacing:2px;font-size:20px}
.logo small{font-family:var(--head);font-weight:800;letter-spacing:.8px}
.tab-btn,.btn-add,.filter-sel,.quick-btn,.field label,.modal-title,th{
  letter-spacing:.35px!important;
}
.header{
  background:linear-gradient(135deg,#153bff,#0b1f7a)!important;
  border-bottom:0!important;
  box-shadow:0 8px 24px rgba(21,59,255,.24)!important;
}
.logo{color:#fff!important}
.logo small{color:rgba(255,255,255,.74)!important}
.tab-btn{border-color:rgba(255,255,255,.24)!important;color:rgba(255,255,255,.88)!important;background:rgba(255,255,255,.08)!important}
.tab-btn.active{background:#fff!important;color:#153bff!important;border-color:#fff!important}
.noti-btn{background:rgba(255,255,255,.10)!important;color:#fff!important;border-color:rgba(255,255,255,.25)!important}
body{font-size:14px;line-height:1.35}
.table-wrap{background:#f0f2f9}
table{table-layout:fixed;min-width:1410px}
th,td{font-size:12px;line-height:1.25}
th{color:#5b6474!important;font-weight:900!important;background:#eef1ff!important}
thead tr{background:#eef1ff!important;border-bottom:1px solid #d9deea!important}
.quick-entry-row th{background:#f8f9ff!important}
td{background:#fff;border-bottom:1px solid #e4e8f2;color:#111827}
tbody tr:nth-child(even) td{background:#fbfcff}
tbody tr:hover td{background:#f3f6ff!important}
#orderTableBody td:nth-child(2){font-family:var(--mono);font-size:11px;color:#4b5563}
#orderTableBody td:nth-child(3){font-family:var(--body);font-size:12px;color:#111827;font-weight:700}
#orderTableBody td:nth-child(4){font-size:12px;color:#0b1f7a;font-weight:800}
#orderTableBody td:nth-child(5){font-size:12px;color:#111827;line-height:1.3}

/* Anchos controlados: sin crear columnas nuevas */
th:nth-child(1),td:nth-child(1){width:44px;min-width:44px;text-align:center}
th:nth-child(2),td:nth-child(2){width:90px;min-width:90px}
th:nth-child(3),td:nth-child(3){width:110px;min-width:110px}
th:nth-child(4),td:nth-child(4){width:145px;min-width:145px}
th:nth-child(5),td:nth-child(5){width:225px;min-width:225px;max-width:225px}
th:nth-child(6),td:nth-child(6){width:105px;min-width:105px}
th:nth-child(7),td:nth-child(7){width:130px;min-width:130px}
th:nth-child(8),td:nth-child(8){width:130px;min-width:130px}
th:nth-child(9),td:nth-child(9){width:85px;min-width:85px;text-align:center}
th:nth-child(10),td:nth-child(10){width:110px;min-width:110px}
th:nth-child(11),td:nth-child(11){width:110px;min-width:110px}
th:nth-child(12),td:nth-child(12){width:90px;min-width:90px;text-align:center}
th:nth-child(13),td:nth-child(13){width:105px;min-width:105px}
th:nth-child(14),td:nth-child(14){width:90px;min-width:90px;text-align:center}
.abono-cell{font-weight:900;color:#0b1f7a!important;text-align:center}
.quick-money{text-align:center;font-family:var(--mono)}

/* Descripción compacta: se ve una línea y al pasar/clicar en escritorio se expande visualmente */
#orderTableBody td:nth-child(5){
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  cursor:help;
}
#orderTableBody td:nth-child(5):hover{
  white-space:normal;
  overflow:visible;
  position:relative;
  z-index:20;
  box-shadow:0 8px 24px rgba(0,0,0,.16);
  border-radius:8px;
}
.cell-edit,.cell-select,.quick-input,.quick-select,.quick-btn{
  background:#fff!important;
  color:#111827!important;
  border-color:#d9deea!important;
  border-radius:10px!important;
  font-size:12px!important;
}
.quick-textarea{min-height:38px;max-height:54px}
.quick-textarea:focus{min-height:78px;max-height:120px}
.search-wrap,.storage-badge,.modal,.card{
  background:#fff!important;
  border-color:#d9deea!important;
  box-shadow:0 4px 18px rgba(0,0,0,.055);
}
.toast{font-family:var(--head);letter-spacing:.35px!important}
@media(max-width:760px){
  table{min-width:1220px}
  .logo{font-size:18px}
}



/* V6 · Colores de estados y abonos */
.status-solicitud,
.estado-solicitud,
td.estado-solicitud,
select.estado-solicitud{
  color:#dc2626!important;
  border-color:#fecaca!important;
  background:#fee2e2!important;
  font-weight:800!important;
}
.status-en-curso,
.status-encurso,
.estado-en-curso,
td.estado-en-curso,
select.estado-en-curso{
  color:#ffffff!important;
  border-color:#111827!important;
  background:#111827!important;
  font-weight:800!important;
}
.status-revisado,
.estado-revisado,
td.estado-revisado,
select.estado-revisado{
  color:#92400e!important;
  border-color:#fde68a!important;
  background:#fef3c7!important;
  font-weight:800!important;
}
.status-listo,
.estado-listo,
td.estado-listo,
select.estado-listo{
  color:#166534!important;
  border-color:#86efac!important;
  background:#dcfce7!important;
  font-weight:800!important;
}
.pago-pendiente,
td.pago-pendiente,
select.pago-pendiente{
  color:#dc2626!important;
  border-color:#fecaca!important;
  background:#fee2e2!important;
  font-weight:800!important;
}
.pago-abonado,
td.pago-abonado,
select.pago-abonado{
  color:#92400e!important;
  border-color:#fde68a!important;
  background:#fef3c7!important;
  font-weight:800!important;
}
.pago-pagado,
td.pago-pagado,
select.pago-pagado{
  color:#166534!important;
  border-color:#86efac!important;
  background:#dcfce7!important;
  font-weight:800!important;
}
.abono-cell{
  font-weight:900!important;
  text-align:center!important;
  font-variant-numeric:tabular-nums!important;
}
.abono-pos{color:#16a34a!important;background:#dcfce7!important;}
.abono-neg{color:#dc2626!important;background:#fee2e2!important;}
.abono-zero{color:#6b7280!important;background:#f8f9ff!important;}
.abono-edit{
  width:92px!important;
  min-height:32px!important;
  text-align:center!important;
  font-weight:900!important;
  border-radius:10px!important;
  padding:6px 8px!important;
  font-variant-numeric:tabular-nums!important;
}
.abono-edit.abono-pos{color:#16a34a!important;border-color:#86efac!important;background:#f0fdf4!important;}
.abono-edit.abono-neg{color:#dc2626!important;border-color:#fecaca!important;background:#fef2f2!important;}
.abono-edit.abono-zero{color:#6b7280!important;border-color:#d9deea!important;background:#f8f9ff!important;}
#q_monto_abonado.abono-pos,
#f_monto_abonado.abono-pos{color:#16a34a!important;border-color:#86efac!important;background:#f0fdf4!important;}
#q_monto_abonado.abono-neg,
#f_monto_abonado.abono-neg{color:#dc2626!important;border-color:#fecaca!important;background:#fef2f2!important;}



/* V7 · Limpieza visual: el color queda solo en el selector/pastilla, no en todo el TD */
#orderTableBody td.estado-solicitud,
#orderTableBody td.estado-en-curso,
#orderTableBody td.estado-revisado,
#orderTableBody td.estado-listo,
#orderTableBody td.pago-pendiente,
#orderTableBody td.pago-abonado,
#orderTableBody td.pago-pagado{
  background:inherit!important;
  border-color:#e4e8f2!important;
}
#orderTableBody tr:nth-child(even) td.estado-solicitud,
#orderTableBody tr:nth-child(even) td.estado-en-curso,
#orderTableBody tr:nth-child(even) td.estado-revisado,
#orderTableBody tr:nth-child(even) td.estado-listo,
#orderTableBody tr:nth-child(even) td.pago-pendiente,
#orderTableBody tr:nth-child(even) td.pago-abonado,
#orderTableBody tr:nth-child(even) td.pago-pagado{
  background:#fbfcff!important;
}
#orderTableBody td select.estado-solicitud,
#orderTableBody td select.estado-en-curso,
#orderTableBody td select.estado-revisado,
#orderTableBody td select.estado-listo,
#orderTableBody td select.pago-pendiente,
#orderTableBody td select.pago-abonado,
#orderTableBody td select.pago-pagado{
  border-radius:999px!important;
  min-height:34px!important;
  text-align:center!important;
  text-align-last:center!important;
  padding-left:10px!important;
  padding-right:26px!important;
  box-shadow:none!important;
}
.quick-entry-row select.estado-solicitud,
.quick-entry-row select.estado-en-curso,
.quick-entry-row select.estado-revisado,
.quick-entry-row select.estado-listo,
.quick-entry-row select.pago-pendiente,
.quick-entry-row select.pago-abonado,
.quick-entry-row select.pago-pagado{
  border-radius:999px!important;
  text-align-last:center!important;
}



/* =========================================================
   MENU GLOBAL v6 · Logo + COMANDA + precio oculto
   - Logo a la izquierda
   - Menú en una sola línea escritorio
   - Botones tipo pastilla como referencia
   - Badge SUPABASE dentro del menú
========================================================= */
.header{
  background:#1428c6!important;
  border-bottom:0!important;
  box-shadow:0 8px 22px rgba(20,40,198,.22)!important;
  min-height:72px!important;
  padding:16px 22px!important;
  gap:14px!important;
  flex-wrap:nowrap!important;
  align-items:center!important;
}
.header .logo{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  flex:0 0 auto!important;
  width:auto!important;
  min-width:210px!important;
  color:#fff!important;
  border:0!important;
  padding:0!important;
  margin:0!important;
  letter-spacing:0!important;
}
.header .logo img{
  display:block!important;
  width:112px!important;
  max-width:112px!important;
  height:auto!important;
  object-fit:contain!important;
  filter:drop-shadow(0 4px 8px rgba(0,0,0,.18));
}
.header .logo small{
  display:none!important;
}
.header-tabs{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:5px!important;
  flex:1 1 auto!important;
  width:auto!important;
  margin-left:auto!important;
  flex-wrap:nowrap!important;
  min-width:0!important;
}
.header-tabs .tab-btn,
.header-tabs .storage-pill{
  height:30px!important;
  min-height:30px!important;
  padding:0 10px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.28)!important;
  background:rgba(255,255,255,.09)!important;
  color:#ffffff!important;
  font-family:var(--head,Montserrat,Arial,sans-serif)!important;
  font-size:9.8px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.38px!important;
  text-transform:uppercase!important;
  text-decoration:none!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:5px!important;
  white-space:nowrap!important;
  cursor:pointer!important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)!important;
}
.header-tabs .tab-btn:hover,
.header-tabs .storage-pill:hover{
  background:rgba(255,255,255,.16)!important;
  border-color:rgba(255,255,255,.45)!important;
  color:#fff!important;
}
.header-tabs .tab-btn.active{
  background:#ffffff!important;
  color:#153bff!important;
  border-color:#ffffff!important;
  box-shadow:0 8px 18px rgba(0,0,0,.12)!important;
}
.header-tabs button.tab-btn{
  appearance:none!important;
}
.header-tabs .storage-pill{
  cursor:default!important;
  background:rgba(255,255,255,.12)!important;
}
.header-tabs .storage-pill .storage-dot{
  width:7px!important;
  height:7px!important;
  border-radius:50%!important;
  background:#22c55e!important;
  flex:0 0 auto!important;
}
.header-tabs .storage-pill span{
  color:#ffffff!important;
  font-family:var(--head,Montserrat,Arial,sans-serif)!important;
  font-size:9.8px!important;
  font-weight:900!important;
  letter-spacing:.38px!important;
  text-transform:uppercase!important;
}
.header .noti-btn{
  display:none!important;
}
.toolbar > #storageBadge{
  display:none!important;
}
.mobile-menu-btn{
  display:none!important;
}
@media(max-width:1180px){
  .header{padding:14px 14px!important;gap:10px!important;min-height:64px!important;}
  .header .logo img{width:94px!important;max-width:94px!important;}
  .header .logo{min-width:94px!important;}
  .header .logo small{display:none!important;}
  .header-tabs{gap:4px!important;}
  .header-tabs .tab-btn,
  .header-tabs .storage-pill{
    padding:0 8px!important;
    font-size:9.2px!important;
    gap:4px!important;
    letter-spacing:.28px!important;
  }
  .header-tabs .storage-pill span{font-size:9.2px!important;}
}
@media(max-width:980px){
  .header{
    flex-wrap:wrap!important;
    padding:12px!important;
    min-height:58px!important;
    justify-content:space-between!important;
  }
  .header .logo{
    display:flex!important;
    min-width:120px!important;
  }
  .header .logo img{
    width:118px!important;
    max-width:118px!important;
  }
  .mobile-menu-btn{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    margin-left:auto!important;
    color:#fff!important;
    background:rgba(255,255,255,.12)!important;
    border:1px solid rgba(255,255,255,.28)!important;
    border-radius:999px!important;
    min-height:34px!important;
    padding:8px 14px!important;
  }
  .header-tabs{
    display:none!important;
    width:100%!important;
    flex:1 1 100%!important;
    margin-left:0!important;
    padding-top:10px!important;
    border-top:1px solid rgba(255,255,255,.22)!important;
    grid-template-columns:1fr!important;
    gap:8px!important;
  }
  .header-tabs.open{
    display:grid!important;
  }
  .header-tabs .tab-btn,
  .header-tabs .storage-pill{
    width:100%!important;
    min-height:42px!important;
    height:42px!important;
    font-size:11px!important;
    justify-content:center!important;
  }
  .header-tabs .storage-pill span{font-size:11px!important;}
}


/* =========================================================
   V5 · Ocultar columna PRECIO temporalmente
   No borra datos, solo oculta la columna visualmente.
   Columnas: 1 #, 2 Fecha, 3 Operador, 4 Cliente,
   5 Descripción, 6 Cantidad, 7 Material, 8 Impresión, 9 Precio.
========================================================= */
table th:nth-child(9),
table td:nth-child(9){
  display:none!important;
}

/* Ajuste visual después de ocultar precio */
table{
  min-width:1325px!important;
}
@media(max-width:760px){
  table{min-width:1135px!important;}
}

/* FIX parpadeo negro al cambiar de pestaña */
.header{
  box-shadow:0 8px 20px rgba(21,59,255,.20)!important;
  transition:none!important;
}
.header *,
.header-tabs *,
.tab-btn,
.mobile-menu-btn{
  transition:none!important;
}
html,body{
  background:#f0f2f9!important;
}



/* =========================================================
   FIX v6 · COMANDA COMPLETO
   - Fuerza controles nativos en modo claro
   - Quita cuadro negro en desplegables/select
   - Mantiene el header sin parpadeo negro
   - Mantiene columna PRECIO oculta temporalmente
========================================================= */
html,
body{
  background:#f0f2f9!important;
  color-scheme:light!important;
}

input,
select,
textarea,
button{
  color-scheme:light!important;
  -webkit-tap-highlight-color:transparent!important;
}

/* Desplegable nativo blanco */
select,
select option,
select optgroup,
.cell-select option,
.quick-select option,
.filter-sel option,
#q_estatus_trabajo option,
#q_estatus_pago option,
#f_estatus_trabajo option,
#f_estatus_pago option{
  background:#ffffff!important;
  background-color:#ffffff!important;
  color:#111827!important;
}

select:focus,
select:active,
select:hover{
  color-scheme:light!important;
}

#orderTableBody select,
.quick-select,
.cell-select,
.filter-sel{
  color-scheme:light!important;
}

/* Mantener los select de estatus tipo pastilla cuando están cerrados */
#orderTableBody td select.estado-solicitud{
  color:#dc2626!important;
  border-color:#fecaca!important;
  background:#fee2e2!important;
}

#orderTableBody td select.estado-en-curso{
  color:#ffffff!important;
  border-color:#111827!important;
  background:#111827!important;
}

#orderTableBody td select.estado-revisado{
  color:#92400e!important;
  border-color:#fde68a!important;
  background:#fef3c7!important;
}

#orderTableBody td select.estado-listo{
  color:#166534!important;
  border-color:#86efac!important;
  background:#dcfce7!important;
}

#orderTableBody td select.pago-pendiente{
  color:#dc2626!important;
  border-color:#fecaca!important;
  background:#fee2e2!important;
}

#orderTableBody td select.pago-abonado{
  color:#92400e!important;
  border-color:#fde68a!important;
  background:#fef3c7!important;
}

#orderTableBody td select.pago-pagado{
  color:#166534!important;
  border-color:#86efac!important;
  background:#dcfce7!important;
}

/* Header limpio sin flash negro */
.header{
  box-shadow:0 8px 20px rgba(21,59,255,.20)!important;
  background:#172bd8!important;
  transition:none!important;
}

.header *,
.header-tabs *,
.tab-btn,
.mobile-menu-btn{
  transition:none!important;
}

/* PRECIO oculto temporalmente */
table th:nth-child(9),
table td:nth-child(9),
.quick-entry-row th:nth-child(9){
  display:none!important;
}

table{
  min-width:1320px!important;
}

@media(max-width:760px){
  table{
    min-width:1160px!important;
  }
}



/* =========================================================
   FIX v7 · Menú estable sin salto visual
   - El menú se arma antes de mostrarse
   - Evita que se vea desplegado/desordenado al cargar
   - Mantiene el header con altura estable
========================================================= */
.header{
  min-height:64px!important;
  height:64px!important;
  overflow:hidden!important;
  background:#172bd8!important;
  box-shadow:0 8px 20px rgba(21,59,255,.18)!important;
}
.header-tabs{
  min-height:34px!important;
  opacity:0!important;
  visibility:hidden!important;
}
.header.menu-ready .header-tabs{
  opacity:1!important;
  visibility:visible!important;
}
.header,
.header *,
.header-tabs,
.header-tabs *,
.tab-btn,
.storage-pill,
.mobile-menu-btn{
  transition:none!important;
  animation:none!important;
}
.logo{
  flex-shrink:0!important;
}
.logo img{
  display:block!important;
  height:32px!important;
  width:auto!important;
}
.logo small{
  color:#fff!important;
  font-weight:900!important;
  letter-spacing:1.4px!important;
}
.header-tabs .tab-btn,
.header-tabs .storage-pill{
  min-height:31px!important;
  height:31px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  white-space:nowrap!important;
}
@media(max-width:980px){
  .header{
    height:auto!important;
    min-height:64px!important;
    overflow:visible!important;
  }
  .header-tabs{
    opacity:1!important;
    visibility:visible!important;
  }
}

</style>
<link rel="stylesheet" href="css/menu.css?v=34">

<style>
/* =========================================================
   PAGINACIÓN v31 · 1-20 / 1-40 / 1-100
   Corregida desde app.js, sin doble render.
========================================================= */
.pagination-bar{
  position:sticky;
  left:0;
  bottom:0;
  z-index:120;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  flex-wrap:wrap;
  padding:12px 14px;
  background:rgba(255,255,255,.96);
  border-top:1px solid #d9deea;
  box-shadow:0 -8px 24px rgba(15,23,42,.08);
  backdrop-filter:blur(8px);
}

.page-btn,
.page-select,
.page-info{
  min-height:36px;
  border-radius:999px;
  border:1px solid #cbd3e6;
  background:#fff;
  color:#153bff;
  font-family:var(--head,Montserrat,Arial,sans-serif);
  font-size:11px;
  font-weight:900;
  letter-spacing:.45px;
  text-transform:uppercase;
  padding:8px 12px;
  white-space:nowrap;
}

.page-btn,
.page-select{
  cursor:pointer;
}

.page-btn:hover{
  background:#eef1ff;
  border-color:#153bff;
}

.page-btn:disabled{
  opacity:.45;
  cursor:not-allowed;
  filter:grayscale(1);
}

.page-info{
  background:#eef1ff;
  color:#0b1f7a;
  border-color:#c7d2fe;
}

/* Reduce movimientos visuales mientras se actualizan filas */
#orderTableBody,
#orderTableBody tr,
#orderTableBody td,
.cell-edit,
.cell-select,
.quick-input,
.quick-select{
  transition:none!important;
  animation:none!important;
}

@media(max-width:760px){
  .pagination-bar{
    position:relative;
    bottom:auto;
    padding:10px;
    gap:6px;
  }

  .page-btn,
  .page-info,
  .page-select{
    flex:1 1 calc(50% - 6px);
    font-size:10px;
    padding:8px 8px;
  }
}
</style>


<style>
/* =========================================================
   FIX v33 · actualización limpia sin flash visual
========================================================= */
#orderTableBody,
#orderTableBody tr,
#orderTableBody td,
.cell-edit,
.cell-select{
  transition:none!important;
  animation:none!important;
}

.cell-select:focus,
.cell-select:active,
.cell-edit:focus,
.cell-edit:active{
  outline:none!important;
  box-shadow:0 0 0 3px rgba(21,59,255,.10)!important;
}

/* Evita que el select cambie bruscamente de tamaño al actualizar clase de estado */
.cell-select{
  min-width:98px!important;
}
</style>


<style>
/* =========================================================
   CATÁLOGOS v34 · sin flash al pintar Material / Impresión
========================================================= */
.catalog-pill{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border-radius:999px!important;
  padding:5px 9px!important;
  font-size:11px!important;
  font-weight:800!important;
  line-height:1!important;
  min-width:54px!important;
  min-height:24px!important;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)!important;
  white-space:nowrap!important;
  transition:none!important;
  animation:none!important;
}

.catalog-select-colored{
  font-weight:800!important;
  border-radius:10px!important;
  transition:none!important;
  animation:none!important;
}

#q_material,
#q_impresion,
#f_material,
#f_impresion{
  transition:none!important;
  animation:none!important;
}
</style>

</head>
<body>
<header class="header">
  <div class="logo">
    <img src="Logo tutto1.svg" alt="Tutto Vinilos">
    <small>COMANDA</small>
  </div>

  <button class="noti-btn" id="notiBtnGlobal" type="button" onclick="abrirNotificaciones()">
    🔔 <span class="noti-count empty" id="notiCount">0</span>
  </button>

  <button class="mobile-menu-btn" id="mobileMenuBtn" type="button" aria-label="Abrir menú">☰ Menú</button>

  <nav class="header-tabs" data-auth-menu id="authMenu"></nav>
</header>
<div class="toolbar">
  <div class="search-wrap">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
    <input id="searchInput" type="text" placeholder="Nombre, teléfono o descripción..." oninput="onSearch()"/>
  </div>
  <select class="filter-sel" id="filterStatus" onchange="onSearch()">
    <option value="">Estado</option>
    <option value="Solicitud">🔴 Solicitud</option>
    <option value="Revisado">🟡 Revisado</option>
    <option value="Listo">🟢 Listo</option>
  </select>
  <select class="filter-sel" id="filterPago" onchange="onSearch()">
    <option value="">Pago</option>
    <option value="Pendiente">Pendiente</option>
    <option value="Abonado">Abonado</option>
    <option value="Pagado">Pagado</option>
  </select>
  <input class="filter-sel" id="filterFechaDesde" type="date" onchange="onSearch()" title="Desde"/>
  <input class="filter-sel" id="filterFechaHasta" type="date" onchange="onSearch()" title="Hasta"/>
  <select class="filter-sel" id="filterOperador" onchange="onSearch()">
    <option value="">Operador</option>
  </select>
  <div class="storage-badge desktop-only" id="storageBadge">
    <div class="storage-dot"></div>
    <span id="storageBadgeText">Local</span>
  </div>
</div>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Fecha</th>
        <th>Operador</th>
        <th>Cliente</th>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Material</th>
        <th>Impresión</th>
        <th>Precio</th>
        <th>Estatus</th>
        <th>Pago</th>
        <th>Abono</th>
        <th>Entrega</th>
        <th>Archivo</th>
      </tr>
      <tr class="quick-entry-row">
        <th>
          <button class="quick-btn secondary" type="button" onclick="clearQuickEntry()">✕</button>
        </th>
        <th>
          <input class="quick-input" id="q_fecha" type="date"/>
        </th>
        <th>
          <select class="quick-select" id="q_operador">
            <option value="">Operador</option>
          </select>
        </th>
        <th>
          <input class="quick-input" id="q_cliente" type="text" placeholder="Cliente" list="clientesDatalist" autocomplete="off"/>
          <datalist id="clientesDatalist"></datalist>
          <div class="quick-hint" id="quickClientHint"></div>
        </th>
        <th>
          <textarea class="quick-input quick-textarea" id="q_descripcion" placeholder="Descripción"></textarea>
        </th>
        <th>
          <input class="quick-input" id="q_cantidad" type="text" placeholder="Cantidad / m"/>
        </th>
        <th>
          <select class="quick-select" id="q_material">
            <option value="">Material</option>
          </select>
        </th>
        <th>
          <select class="quick-select" id="q_impresion">
            <option value="">Impresión</option>
          </select>
        </th>
        <th>
          <div class="quick-hint" id="q_precio_preview">$0.00</div>
        </th>
        <th>
          <select class="quick-select" id="q_estatus_trabajo">
            <option selected>Solicitud</option>
            <option>En curso</option>
            <option>Revisado</option>
            <option>Listo</option>
          </select>
        </th>
        <th>
          <select class="quick-select" id="q_estatus_pago">
            <option selected>Pendiente</option>
            <option>Abonado</option>
            <option>Pagado</option>
          </select>
        </th>
        <th>
          <input class="quick-input quick-money" id="q_monto_abonado" type="number" step="0.01" placeholder="0.00"/>
        </th>
        <th>
          <input class="quick-input" id="q_entrega" type="date"/>
        </th>
        <th>
          <button class="quick-mini-btn" type="button" title="Adjuntar archivo" onclick="openQuickAttach()">📎</button>
          <button class="quick-btn add-symbol-btn" type="button" onclick="saveQuickOrder()" style="margin-top:5px" title="Guardar pedido">+</button>
        </th>
      </tr>
    </thead>
    <tbody id="orderTableBody"></tbody>
  </table>
  <div id="emptyState" class="empty" style="display:none">— SIN PEDIDOS —</div>
  <div id="paginationBar" class="pagination-bar"></div>
</div>
<div class="backdrop" id="orderBackdrop" style="display:none" onclick="bdClick(event,'orderBackdrop')">
  <div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-header">
      <span class="modal-title" id="orderModalTitle">NUEVO PEDIDO</span>
      <button class="modal-close" type="button" onclick="closeModal('orderBackdrop')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field">
          <label>Fecha</label>
          <input type="date" id="f_fecha"/>
        </div>
        <div class="field">
          <label>Operador</label>
          <select id="f_operador">
            <option value="">Seleccionar…</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Cliente</label>
        <input type="text" id="f_cliente" placeholder="Nombre del cliente..." autocomplete="off" list="clientesDatalist"/>
      </div>
      <div class="field form-full">
        <label>Descripción del trabajo</label>
        <textarea id="f_descripcion" placeholder="Ej: Banner exterior 3x1m..." rows="3"></textarea>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Cantidad / Metros</label>
          <input type="text" id="f_cantidad" placeholder="Ej: 5 m² / 1200 stickers"/>
        </div>
        <div class="field">
          <label>Monto abonado</label>
          <input type="number" id="f_monto_abonado" step="0.01" placeholder="0.00"/>
        </div>
        <div class="field form-full">
          <label>Fecha de entrega</label>
          <input type="date" id="f_entrega"/>
        </div>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Material</label>
          <select id="f_material">
            <option value="">Material</option>
          </select>
        </div>
        <div class="field">
          <label>Tipo de impresión</label>
          <select id="f_impresion">
            <option value="">Impresión</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Imagen / Archivo de referencia</label>
        <div id="filePreviewArea" onclick="document.getElementById('f_archivo').click()" style="cursor:pointer">
          <div id="fileEmpty" class="file-drop">
            <span style="font-size:28px">📎</span>
            <span style="font-family:var(--head);font-size:12px;letter-spacing:1px;color:var(--muted)">TOCA PARA ADJUNTAR</span>
            <span style="font-size:11px;color:var(--muted)">Imagen, PDF o archivo</span>
          </div>
          <div id="filePreview" style="display:none" class="file-preview-box">
            <img id="fileImg" style="display:none;max-height:160px;border-radius:6px;object-fit:contain;width:100%"/>
            <div id="fileGeneric" style="display:none;text-align:center;padding:16px">
              <div id="fileIconBig" style="font-size:40px"></div>
              <div id="fileName" style="font-size:12px;color:var(--muted2);margin-top:6px;word-break:break-all"></div>
            </div>
            <button class="file-remove-btn" type="button" onclick="event.stopPropagation();removeFile()" title="Quitar archivo">✕</button>
          </div>
        </div>
        <input type="file" id="f_archivo" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" style="display:none" onchange="handleFileSelect(event)"/>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-add secondary" type="button" onclick="closeModal('orderBackdrop')">Cancelar</button>
      <button class="btn-add" type="button" onclick="saveOrder()">Guardar</button>
    </div>
  </div>
</div>
<input type="file" id="rowFileInput" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onchange="handleRowFileSelect(event)"/>

<div class="backdrop" id="notiBackdrop" style="display:none" onclick="bdClick(event,'notiBackdrop')">
  <div class="modal" style="max-width:660px">
    <div class="modal-handle"></div>
    <div class="modal-header">
      <span class="modal-title">NOTIFICACIONES</span>
      <button class="modal-close" type="button" onclick="closeModal('notiBackdrop')">✕</button>
    </div>
    <div class="modal-body">
      <div class="noti-list" id="notiList">
        <div class="empty">Cargando notificaciones...</div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase.js?v=24"></script>
<script src="js/auth.js?v=24"></script>
<script src="js/menu.js?v=40"></script>
<script src="js/app.js?v=35"></script>

<script>
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
</script>

<script src="js/notificaciones.js?v=35"></script>

<script>
(function(){
  const ABONO_FIELD = "monto_abonado";
  let pintandoAbonos = false;
  let timerAbono = null;

  function $(id){ return document.getElementById(id); }
  function money(n){ return Number(n || 0).toFixed(2); }
  function num(v){
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  function esc(v){
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function toast(msg){
    const t = $("toast");
    if(!t){ console.log(msg); return; }
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(()=> t.style.display = "none", 2200);
  }
  function leerAbonoRapido(){ return num($("q_monto_abonado")?.value); }
  function leerAbonoModal(){ return num($("f_monto_abonado")?.value); }
  function setPagoAbonadoSiAplica(){
    const abono = leerAbonoRapido();
    const pago = $("q_estatus_pago");
    if(abono > 0 && pago && pago.value === "Pendiente") pago.value = "Abonado";
  }
  function datosBusquedaDesdeQuick(){
    return {
      fecha: $("q_fecha")?.value || "",
      operador: $("q_operador")?.value || "",
      cliente: $("q_cliente")?.value || "",
      descripcion: $("q_descripcion")?.value || ""
    };
  }
  function datosBusquedaDesdeModal(){
    return {
      fecha: $("f_fecha")?.value || "",
      operador: $("f_operador")?.value || "",
      cliente: $("f_cliente")?.value || "",
      descripcion: $("f_descripcion")?.value || ""
    };
  }
  async function buscarPedidoReciente(datos){
    if(!window.supabaseClient) return null;
    let q = window.supabaseClient
      .from("pedidos")
      .select("id,fecha,operador,cliente,descripcion")
      .order("id", { ascending:false })
      .limit(12);
    if(datos.fecha) q = q.eq("fecha", datos.fecha);
    if(datos.cliente) q = q.eq("cliente", datos.cliente);
    if(datos.operador) q = q.eq("operador", datos.operador);
    const { data, error } = await q;
    if(error) throw error;
    const desc = String(datos.descripcion || "").trim();
    return (data || []).find(p => String(p.descripcion || "").trim() === desc) || (data || [])[0] || null;
  }
  async function guardarAbonoPedido(datos, monto){
    if(!window.supabaseClient || monto === 0) return;
    const pedido = await buscarPedidoReciente(datos);
    if(!pedido) return;
    await guardarAbonoDirecto(pedido.id, monto);
  }
  async function guardarAbonoDirecto(id, monto){
    if(!window.supabaseClient || !id) return;
    const payload = { [ABONO_FIELD]: monto };
    if(monto > 0) payload.estatus_pago = "Abonado";
    const { error } = await window.supabaseClient
      .from("pedidos")
      .update(payload)
      .eq("id", id);
    if(error) throw error;
  }
  function claseAbono(monto){
    const n = num(monto);
    if(n > 0) return "abono-pos";
    if(n < 0) return "abono-neg";
    return "abono-zero";
  }
  function inputAbonoHtml(id, monto){
    return `<input class="cell-edit abono-edit ${claseAbono(monto)}" data-abono-id="${esc(id)}" type="number" step="0.01" value="${money(monto)}" title="Editar abono"/>`;
  }
  async function leerAbonosMap(){
    if(!window.supabaseClient) return new Map();
    const { data, error } = await window.supabaseClient
      .from("pedidos")
      .select("id,monto_abonado")
      .order("id", { ascending:false })
      .limit(600);
    if(error){ console.warn("No se pudo leer monto_abonado:", error); return new Map(); }
    return new Map((data || []).map(p => [String(p.id), p.monto_abonado || 0]));
  }
  async function pintarAbonosEnTabla(){
    if(pintandoAbonos) return;
    const tbody = $("orderTableBody");
    if(!tbody || !window.supabaseClient) return;
    const rows = [...tbody.querySelectorAll("tr")];
    if(!rows.length) return;

    pintandoAbonos = true;
    try{
      const abonos = await leerAbonosMap();
      rows.forEach(tr => {
        const cells = [...tr.children];
        if(cells.length < 13) return;
        if(cells.length >= 14) return;
        const id = String(cells[0]?.textContent || "").trim();
        const monto = abonos.get(id) || 0;
        const td = document.createElement("td");
        td.className = "abono-cell";
        td.innerHTML = inputAbonoHtml(id, monto);
        tr.insertBefore(td, cells[11]);
      });
    }catch(error){
      console.warn("pintarAbonosEnTabla error:", error);
    }finally{
      pintandoAbonos = false;
    }
  }
  function programarPintarAbonos(){
    clearTimeout(timerAbono);
    timerAbono = setTimeout(pintarAbonosEnTabla, 350);
  }
  function instalarWrapperAbono(){
    if(window.__abonoWrapperInstalado) return;
    if(typeof window.saveQuickOrder !== "function" && typeof window.saveOrder !== "function") return;
    window.__abonoWrapperInstalado = true;

    if(typeof window.saveQuickOrder === "function"){
      const originalQuick = window.saveQuickOrder;
      window.saveQuickOrder = async function(){
        setPagoAbonadoSiAplica();
        const monto = leerAbonoRapido();
        const datos = datosBusquedaDesdeQuick();
        const res = await originalQuick.apply(this, arguments);
        try{
          await new Promise(r => setTimeout(r, 450));
          await guardarAbonoPedido(datos, monto);
          if(monto > 0) toast("Abono guardado");
          programarPintarAbonos();
        }catch(error){
          console.error("No se pudo guardar abono:", error);
          toast("Pedido guardado, pero no se guardó el abono. Revisa SQL monto_abonado.");
        }
        return res;
      };
    }

    if(typeof window.saveOrder === "function"){
      const originalSave = window.saveOrder;
      window.saveOrder = async function(){
        const monto = leerAbonoModal();
        const datos = datosBusquedaDesdeModal();
        const res = await originalSave.apply(this, arguments);
        try{
          await new Promise(r => setTimeout(r, 450));
          await guardarAbonoPedido(datos, monto);
          if(monto > 0) toast("Abono guardado");
          programarPintarAbonos();
        }catch(error){
          console.error("No se pudo guardar abono modal:", error);
          toast("Pedido guardado, pero no se guardó el abono. Revisa SQL monto_abonado.");
        }
        return res;
      };
    }
  }

  document.addEventListener("input", function(e){
    if(e.target && e.target.id === "q_monto_abonado") setPagoAbonadoSiAplica();
    if(e.target && e.target.classList && e.target.classList.contains("abono-edit")){
      e.target.classList.remove("abono-pos", "abono-neg", "abono-zero");
      e.target.classList.add(claseAbono(e.target.value));
    }
  });
  document.addEventListener("keydown", function(e){
    if(e.target && e.target.classList && e.target.classList.contains("abono-edit") && e.key === "Enter"){
      e.preventDefault();
      e.target.blur();
    }
  });
  document.addEventListener("change", async function(e){
    if(!(e.target && e.target.classList && e.target.classList.contains("abono-edit"))) return;
    const id = e.target.dataset.abonoId;
    const monto = num(e.target.value);
    try{
      e.target.disabled = true;
      await guardarAbonoDirecto(id, monto);
      e.target.value = money(monto);
      e.target.classList.remove("abono-pos", "abono-neg", "abono-zero");
      e.target.classList.add(claseAbono(monto));
      toast("Abono actualizado");
    }catch(error){
      console.error("No se pudo actualizar abono:", error);
      toast("No se pudo actualizar abono. Revisa Supabase.");
    }finally{
      e.target.disabled = false;
    }
  });
  window.addEventListener("load", function(){
    setTimeout(instalarWrapperAbono, 800);
    setTimeout(programarPintarAbonos, 1600);
    const tbody = $("orderTableBody");
    if(tbody && window.MutationObserver){
      const obs = new MutationObserver(programarPintarAbonos);
      obs.observe(tbody, { childList:true });
    }
  });
})();
</script>

<script>
(function(){
  function norm(v){
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
  }
  function num(v){
    const n = Number(String(v ?? "").replace(/[^0-9,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  function limpiarClases(el, prefijos){
    if(!el) return;
    [...el.classList].forEach(c => {
      if(prefijos.some(p => c.startsWith(p))) el.classList.remove(c);
    });
  }
  function aplicarClaseEstado(el, valor){
    if(!el) return;
    const n = norm(valor);
    limpiarClases(el, ["estado-", "status-"]);
    if(n === "solicitud") el.classList.add("estado-solicitud");
    else if(n === "en curso" || n === "encurso") el.classList.add("estado-en-curso");
    else if(n === "revisado") el.classList.add("estado-revisado");
    else if(n === "listo") el.classList.add("estado-listo");
  }
  function aplicarClasePago(el, valor){
    if(!el) return;
    const n = norm(valor);
    limpiarClases(el, ["pago-"]);
    if(n === "pendiente") el.classList.add("pago-pendiente");
    else if(n === "abonado") el.classList.add("pago-abonado");
    else if(n === "pagado") el.classList.add("pago-pagado");
  }
  function aplicarClaseAbono(el, valor){
    if(!el) return;
    const n = num(valor);
    el.classList.remove("abono-pos", "abono-neg", "abono-zero");
    if(n > 0) el.classList.add("abono-pos");
    else if(n < 0) el.classList.add("abono-neg");
    else el.classList.add("abono-zero");
  }
  function valorCelda(td){
    const control = td?.querySelector?.("select,input,textarea");
    return control ? control.value : (td?.textContent || "");
  }
  function colorearTabla(){
    const tbody = document.getElementById("orderTableBody");
    if(!tbody) return;
    [...tbody.querySelectorAll("tr")].forEach(tr => {
      const cells = [...tr.children];
      if(cells.length < 11) return;
      const estatusCell = cells[9];
      const pagoCell = cells[10];
      const abonoCell = cells[11];
      aplicarClaseEstado(estatusCell, valorCelda(estatusCell));
      const estatusControl = estatusCell?.querySelector?.("select,input");
      if(estatusControl) aplicarClaseEstado(estatusControl, estatusControl.value);
      aplicarClasePago(pagoCell, valorCelda(pagoCell));
      const pagoControl = pagoCell?.querySelector?.("select,input");
      if(pagoControl) aplicarClasePago(pagoControl, pagoControl.value);
      if(abonoCell && abonoCell.classList.contains("abono-cell")) aplicarClaseAbono(abonoCell, valorCelda(abonoCell));
    });
  }
  function colorearInputsAbono(){
    aplicarClaseAbono(document.getElementById("q_monto_abonado"), document.getElementById("q_monto_abonado")?.value);
    aplicarClaseAbono(document.getElementById("f_monto_abonado"), document.getElementById("f_monto_abonado")?.value);
  }
  function aplicarTodo(){
    colorearTabla();
    colorearInputsAbono();
  }
  document.addEventListener("input", function(e){
    if(e.target && (e.target.id === "q_monto_abonado" || e.target.id === "f_monto_abonado")) colorearInputsAbono();
  });
  document.addEventListener("change", function(e){
    const t = e.target;
    if(!t) return;
    if(t.matches("select,input")) setTimeout(aplicarTodo, 30);
  });
  window.addEventListener("load", function(){
    setTimeout(aplicarTodo, 500);
    setTimeout(aplicarTodo, 1500);
    const tbody = document.getElementById("orderTableBody");
    if(tbody && window.MutationObserver){
      const obs = new MutationObserver(() => setTimeout(aplicarTodo, 40));
      obs.observe(tbody, {childList:true, subtree:true, characterData:true});
    }
  });
  window.aplicarColoresEstadosYAbonos = aplicarTodo;
})();
</script>


<script>
/* V9 · Comportamiento seguro de tabla:
   - Solo abrir edición al hacer clic en CLIENTE.
   - Descripción muestra vista rápida.
   - Abono editable directo sin abrir modal.
   - El modal toma/sincroniza el abono del pedido. */
(function(){
  const ABONO_FIELD = "monto_abonado";
  let pedidoActivoParaModal = null;

  function $(id){ return document.getElementById(id); }
  function num(v){
    const n = Number(String(v ?? "").replace(/[^0-9,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  function money(n){ return Number(n || 0).toFixed(2); }
  function esc(v){
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function claseAbono(monto){
    const n = num(monto);
    if(n > 0) return "abono-pos";
    if(n < 0) return "abono-neg";
    return "abono-zero";
  }
  function aplicarClaseAbonoInput(input, valor){
    if(!input) return;
    input.classList.remove("abono-pos", "abono-neg", "abono-zero");
    input.classList.add(claseAbono(valor));
  }
  function getRowFromTarget(target){ return target?.closest?.("#orderTableBody tr") || null; }
  function getPedidoIdFromRow(tr){ return String(tr?.children?.[0]?.textContent || "").trim(); }
  function getDescripcionFromRow(tr){ return String(tr?.children?.[4]?.textContent || "").trim(); }
  function toast(msg){
    const t = $("toast");
    if(!t){ console.log(msg); return; }
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(()=> t.style.display = "none", 2300);
  }

  function abrirVistaDescripcion(texto){
    let bd = $("descPreviewBackdrop");
    if(!bd){
      bd = document.createElement("div");
      bd.id = "descPreviewBackdrop";
      bd.className = "backdrop";
      bd.style.display = "none";
      bd.innerHTML = `
        <div class="modal" style="max-width:520px">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <span class="modal-title">DESCRIPCIÓN</span>
            <button class="modal-close" type="button" id="cerrarDescPreview">✕</button>
          </div>
          <div class="modal-body">
            <div id="descPreviewText" style="white-space:pre-wrap;line-height:1.45;font-size:15px;color:var(--text)"></div>
          </div>
        </div>`;
      document.body.appendChild(bd);
      bd.addEventListener("click", function(e){ if(e.target === bd) bd.style.display = "none"; });
      bd.querySelector("#cerrarDescPreview").addEventListener("click", function(){ bd.style.display = "none"; });
    }
    $("descPreviewText").innerHTML = esc(texto || "Sin descripción");
    bd.style.display = "flex";
  }

  async function leerAbonoPedido(id){
    if(!window.supabaseClient || !id) return 0;
    const { data, error } = await window.supabaseClient
      .from("pedidos")
      .select(`id,${ABONO_FIELD}`)
      .eq("id", id)
      .single();
    if(error){ console.warn("No se pudo leer abono del pedido", id, error); return 0; }
    return num(data?.[ABONO_FIELD]);
  }

  async function cargarAbonoEnModal(id){
    const input = $("f_monto_abonado");
    if(!input || !id) return;
    const monto = await leerAbonoPedido(id);
    input.value = money(monto);
    input.dataset.pedidoId = id;
    aplicarClaseAbonoInput(input, monto);
  }

  function sincronizarModalSiMismoPedido(id, monto){
    const input = $("f_monto_abonado");
    if(!input) return;
    const modalVisible = $("orderBackdrop") && $("orderBackdrop").style.display !== "none";
    if(!modalVisible) return;
    if(String(input.dataset.pedidoId || pedidoActivoParaModal || "") !== String(id)) return;
    input.value = money(monto);
    aplicarClaseAbonoInput(input, monto);
  }

  function prepararClickCliente(tr){
    const id = getPedidoIdFromRow(tr);
    pedidoActivoParaModal = id;
    window.__pedidoActivoParaModal = id;
    setTimeout(()=>cargarAbonoEnModal(id), 450);
    setTimeout(()=>cargarAbonoEnModal(id), 1000);
  }

  // Captura antes del onclick general del app.js.
  document.addEventListener("click", function(e){
    const tr = getRowFromTarget(e.target);
    if(!tr) return;
    const td = e.target.closest("td");
    if(!td) return;
    const index = [...tr.children].indexOf(td);

    // Controles: deben funcionar, pero NO abrir modal.
    if(e.target.closest("input,select,textarea,button,a")){
      e.stopPropagation();
      return;
    }

    // Cliente: único sitio que abre edición.
    if(index === 3){
      prepararClickCliente(tr);
      return;
    }

    // Descripción: vista rápida.
    if(index === 4){
      e.preventDefault();
      e.stopImmediatePropagation();
      abrirVistaDescripcion(getDescripcionFromRow(tr));
      return;
    }

    // Cualquier otra columna no abre edición.
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  // Al tocar abono: seleccionar todo para editar rápido, como cantidad/material.
  document.addEventListener("focusin", function(e){
    if(e.target && e.target.classList && e.target.classList.contains("abono-edit")){
      setTimeout(()=> e.target.select?.(), 20);
    }
  });
  document.addEventListener("click", function(e){
    if(e.target && e.target.classList && e.target.classList.contains("abono-edit")){
      e.stopPropagation();
      e.target.focus();
      e.target.select?.();
    }
  }, true);

  // Refuerza guardado directo y sincronización con modal.
  document.addEventListener("change", async function(e){
    if(!(e.target && e.target.classList && e.target.classList.contains("abono-edit"))) return;
    const id = e.target.dataset.abonoId;
    const monto = num(e.target.value);
    try{
      sincronizarModalSiMismoPedido(id, monto);
    }catch(_){ }
  }, true);

  // Si el usuario cambia el abono dentro del modal, conserva color y marca pago Abonado si aplica.
  document.addEventListener("input", function(e){
    if(e.target && e.target.id === "f_monto_abonado"){
      aplicarClaseAbonoInput(e.target, e.target.value);
      const pago = $("f_estatus_pago");
      if(num(e.target.value) > 0 && pago && pago.value === "Pendiente") pago.value = "Abonado";
    }
    if(e.target && e.target.id === "q_monto_abonado"){
      aplicarClaseAbonoInput(e.target, e.target.value);
    }
  });

  // Observa apertura del modal para cargar abono, por si app.js abre con retardo.
  window.addEventListener("load", function(){
    const modal = $("orderBackdrop");
    if(modal && window.MutationObserver){
      const obs = new MutationObserver(function(){
        const visible = modal.style.display !== "none";
        const id = pedidoActivoParaModal || window.__pedidoActivoParaModal;
        if(visible && id) setTimeout(()=>cargarAbonoEnModal(id), 250);
      });
      obs.observe(modal, {attributes:true, attributeFilter:["style", "class"]});
    }
  });
})();
</script>


<style>
/* V10 · colores de materiales e impresión en pedidos */
.catalog-pill{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:999px;
  padding:5px 9px;
  font-size:11px;
  font-weight:800;
  line-height:1;
  min-width:54px;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);
  white-space:nowrap;
}
.catalog-select-colored{
  font-weight:800!important;
  border-radius:10px!important;
}


/* =========================================================
   FIX v8 · Quitar flash negro/raro al cargar
   - Oculta el menú hasta que JS lo arma
   - Estabiliza el header desde el primer segundo
   - Mantiene precio oculto
========================================================= */
html,
body{
  background:#f0f2f9!important;
}

/* Mientras el menú se arma, queda invisible pero con espacio reservado */
html.loading-menu .header-tabs{
  opacity:0!important;
  visibility:hidden!important;
}

/* Cuando menu.js termina, aparece estable */
html.menu-ready .header-tabs,
.header.menu-ready .header-tabs{
  opacity:1!important;
  visibility:visible!important;
}

/* Header estable para evitar fondo negro/salto visual */
.header{
  background:#172bd8!important;
  box-shadow:0 8px 20px rgba(21,59,255,.18)!important;
  min-height:64px!important;
  height:64px!important;
  overflow:hidden!important;
  transition:none!important;
  animation:none!important;
}

.header,
.header *,
.header-tabs,
.header-tabs *,
.tab-btn,
.storage-pill,
.mobile-menu-btn{
  transition:none!important;
  animation:none!important;
}

.header-tabs{
  min-height:34px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:7px!important;
  flex-wrap:nowrap!important;
  margin-left:auto!important;
}

.header-tabs .tab-btn,
.header-tabs .storage-pill{
  min-height:31px!important;
  height:31px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  white-space:nowrap!important;
}

.logo{
  flex-shrink:0!important;
}

.logo img{
  display:block!important;
  height:32px!important;
  width:auto!important;
}

.logo small{
  color:#fff!important;
  font-weight:900!important;
  letter-spacing:1.4px!important;
}

/* Select desplegable blanco */
select,
select option,
.cell-select option,
.quick-select option,
.filter-sel option,
#q_estatus_trabajo option,
#q_estatus_pago option,
#f_estatus_trabajo option,
#f_estatus_pago option{
  background:#ffffff!important;
  color:#111827!important;
}

input,
select,
textarea,
button{
  -webkit-tap-highlight-color:transparent!important;
}

/* PRECIO oculto temporalmente */
table th:nth-child(9),
table td:nth-child(9),
.quick-entry-row th:nth-child(9){
  display:none!important;
}

table{
  min-width:1320px!important;
}

@media(max-width:980px){
  .header{
    height:auto!important;
    min-height:64px!important;
    overflow:visible!important;
  }

  html.loading-menu .header-tabs,
  html.menu-ready .header-tabs,
  .header.menu-ready .header-tabs{
    opacity:1!important;
    visibility:visible!important;
  }

  .header-tabs{
    display:none!important;
  }

  .header-tabs.open{
    display:grid!important;
  }
}

@media(max-width:760px){
  table{
    min-width:1160px!important;
  }
}


/* =========================================================
   FIX MOBILE · Tabla comienza en CLIENTE
   Solo en celulares se ocultan las columnas:
   1) # / Nro pedido
   2) Fecha de emisión
   3) Operador
   Así la tabla arranca visualmente en Cliente y Descripción.
========================================================= */
@media(max-width:760px){
  table th:nth-child(1),
  table td:nth-child(1),
  table th:nth-child(2),
  table td:nth-child(2),
  table th:nth-child(3),
  table td:nth-child(3){
    display:none!important;
  }

  .quick-entry-row th:nth-child(1),
  .quick-entry-row th:nth-child(2),
  .quick-entry-row th:nth-child(3){
    display:none!important;
  }

  table{
    min-width:850px!important;
  }

  table th:nth-child(4),
  table td:nth-child(4){
    width:210px!important;
    min-width:210px!important;
    padding-left:28px!important;
  }

  table th:nth-child(5),
  table td:nth-child(5){
    width:330px!important;
    min-width:330px!important;
  }
}
</style>
<script>
/* =========================================================
   CATÁLOGOS v34
   La pintura de Material e Impresión ahora ocurre directamente en js/app.js
   antes de renderizar la tabla. Se eliminó el repaint posterior que causaba flash.
========================================================= */
window.refrescarColoresCatalogos = window.refrescarColoresCatalogos || function(){};
</script>


<style>
/* =========================================================
   FIX FINAL MENU + BUSCADOR + FILTROS · v35
   Limpia conflictos visuales sin tocar Supabase ni app.js
========================================================= */
html,body{
  background:#f0f2f9!important;
  color-scheme:light!important;
}
.header{
  position:sticky!important;
  top:0!important;
  z-index:500!important;
  min-height:64px!important;
  height:auto!important;
  overflow:visible!important;
  display:flex!important;
  align-items:center!important;
  gap:14px!important;
  padding:12px 18px!important;
  background:#172bd8!important;
  box-shadow:0 8px 20px rgba(21,59,255,.18)!important;
  border-bottom:0!important;
  flex-wrap:nowrap!important;
}
.header .logo{
  flex:0 0 auto!important;
  min-width:auto!important;
  width:auto!important;
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  border:0!important;
  padding:0!important;
  margin:0!important;
}
.header .logo img{
  display:block!important;
  height:36px!important;
  width:auto!important;
  max-width:130px!important;
  object-fit:contain!important;
}
.header .logo small{
  display:inline!important;
  color:#fff!important;
  font-family:var(--head)!important;
  font-weight:900!important;
  font-size:12px!important;
  letter-spacing:1.2px!important;
}
.mobile-menu-btn{
  display:none!important;
  margin-left:auto!important;
  min-height:36px!important;
  padding:8px 14px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.30)!important;
  background:rgba(255,255,255,.12)!important;
  color:#fff!important;
  font-family:var(--head)!important;
  font-size:12px!important;
  font-weight:900!important;
  letter-spacing:.4px!important;
  text-transform:uppercase!important;
  cursor:pointer!important;
}
.header-tabs{
  flex:1 1 auto!important;
  min-width:0!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:6px!important;
  margin-left:auto!important;
  width:auto!important;
  padding:0!important;
  border:0!important;
  opacity:1!important;
  visibility:visible!important;
  flex-wrap:nowrap!important;
}
.header-tabs .tab-btn,
.header-tabs .storage-pill{
  height:32px!important;
  min-height:32px!important;
  padding:0 10px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.28)!important;
  background:rgba(255,255,255,.10)!important;
  color:#fff!important;
  font-family:var(--head)!important;
  font-size:10px!important;
  font-weight:900!important;
  letter-spacing:.25px!important;
  text-transform:uppercase!important;
  white-space:nowrap!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  box-shadow:none!important;
}
.header-tabs .tab-btn.active{
  background:#fff!important;
  color:#153bff!important;
  border-color:#fff!important;
}
.toolbar{
  position:sticky!important;
  top:64px!important;
  z-index:250!important;
  display:grid!important;
  grid-template-columns:minmax(280px,1fr) repeat(5, minmax(118px, auto));
  gap:8px!important;
  align-items:center!important;
  padding:10px 14px!important;
  background:#fff!important;
  border-bottom:1px solid #d9deea!important;
  box-shadow:0 4px 18px rgba(0,0,0,.045)!important;
}
.search-wrap{
  min-width:0!important;
  width:100%!important;
  display:flex!important;
  align-items:center!important;
  min-height:42px!important;
  border-radius:14px!important;
  background:#fff!important;
  border:1px solid #d9deea!important;
  padding:9px 12px!important;
  box-shadow:none!important;
}
.search-wrap input{
  width:100%!important;
  min-width:0!important;
  color:#111827!important;
}
.filter-sel{
  width:100%!important;
  min-width:0!important;
  min-height:42px!important;
  border-radius:12px!important;
  border:1px solid #d9deea!important;
  background:#fff!important;
  color:#153bff!important;
  font-size:11px!important;
  font-weight:900!important;
  padding:8px 10px!important;
}
.toolbar > #storageBadge{
  display:none!important;
}
.table-wrap{
  position:relative!important;
  z-index:1!important;
}
@media(max-width:1180px){
  .header{padding:12px 14px!important;gap:10px!important;}
  .header .logo img{height:32px!important;max-width:110px!important;}
  .header .logo small{display:none!important;}
  .header-tabs{gap:4px!important;}
  .header-tabs .tab-btn,
  .header-tabs .storage-pill{font-size:9px!important;padding:0 7px!important;}
}
@media(max-width:980px){
  .header{
    min-height:60px!important;
    flex-wrap:wrap!important;
    padding:10px 12px!important;
  }
  .header .logo img{height:34px!important;max-width:125px!important;}
  .mobile-menu-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;}
  .header-tabs{
    display:none!important;
    flex:1 1 100%!important;
    width:100%!important;
    margin-left:0!important;
    padding-top:10px!important;
    border-top:1px solid rgba(255,255,255,.22)!important;
    grid-template-columns:1fr 1fr!important;
    gap:8px!important;
  }
  .header-tabs.open{display:grid!important;}
  .header-tabs .tab-btn,
  .header-tabs .storage-pill{
    width:100%!important;
    min-height:40px!important;
    height:40px!important;
    font-size:11px!important;
  }
  .toolbar{
    position:relative!important;
    top:auto!important;
    grid-template-columns:1fr 1fr!important;
    padding:10px!important;
    gap:8px!important;
  }
  .search-wrap{grid-column:1 / -1!important;}
  #filterStatus,
  #filterPago,
  #filterFechaDesde,
  #filterFechaHasta,
  #filterOperador{
    flex:none!important;
    min-width:0!important;
    font-size:11px!important;
    padding:8px 9px!important;
  }
  #filterOperador{grid-column:1 / -1!important;}
}
@media(max-width:430px){
  .toolbar{grid-template-columns:1fr 1fr!important;}
  .filter-sel{font-size:10px!important;padding:8px 7px!important;}
  .search-wrap input{font-size:13px!important;}
}
</style>
<style>
/* =========================================================
   FIX FINAL v36 · Menú + buscador + filtros
   Corrige solapamiento del logo, campana, menú y toolbar.
   Este bloque debe quedar al final para ganar sobre parches anteriores.
========================================================= */
html,body{background:#f0f2f9!important;color-scheme:light!important;}

.header{
  position:sticky!important;
  top:0!important;
  z-index:900!important;
  display:grid!important;
  grid-template-columns:155px minmax(0,1fr)!important;
  align-items:center!important;
  gap:10px!important;
  width:100%!important;
  min-height:58px!important;
  height:58px!important;
  padding:10px 16px!important;
  overflow:hidden!important;
  background:#172bd8!important;
  border-bottom:0!important;
  box-shadow:0 8px 20px rgba(21,59,255,.18)!important;
  flex-wrap:nowrap!important;
}

.header .logo{
  grid-column:1!important;
  grid-row:1!important;
  width:155px!important;
  min-width:155px!important;
  max-width:155px!important;
  height:38px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:6px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  overflow:hidden!important;
  flex:none!important;
}

.header .logo img{
  display:block!important;
  width:auto!important;
  height:34px!important;
  max-width:138px!important;
  max-height:34px!important;
  object-fit:contain!important;
  filter:none!important;
}

.header .logo small{display:none!important;}
.header .noti-btn{display:none!important;}
.mobile-menu-btn{display:none!important;}

.header-tabs{
  grid-column:2!important;
  grid-row:1!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  gap:5px!important;
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  height:36px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  overflow:hidden!important;
  opacity:1!important;
  visibility:visible!important;
  flex-wrap:nowrap!important;
}

.header-tabs .tab-btn,
.header-tabs .storage-pill{
  flex:0 1 auto!important;
  height:30px!important;
  min-height:30px!important;
  max-height:30px!important;
  padding:0 9px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.28)!important;
  background:rgba(255,255,255,.10)!important;
  color:#fff!important;
  font-family:var(--head,Montserrat,Arial,sans-serif)!important;
  font-size:9.5px!important;
  font-weight:900!important;
  letter-spacing:.25px!important;
  line-height:1!important;
  text-transform:uppercase!important;
  white-space:nowrap!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:4px!important;
  box-shadow:none!important;
  overflow:hidden!important;
}

.header-tabs .tab-btn.active{
  background:#fff!important;
  color:#153bff!important;
  border-color:#fff!important;
}

.toolbar{
  position:sticky!important;
  top:58px!important;
  z-index:700!important;
  display:grid!important;
  grid-template-columns:minmax(340px,1fr) 120px 120px 135px 135px 120px!important;
  gap:8px!important;
  align-items:center!important;
  width:100%!important;
  padding:10px 14px!important;
  background:#fff!important;
  border-bottom:1px solid #d9deea!important;
  box-shadow:0 4px 18px rgba(0,0,0,.045)!important;
  margin:0!important;
}

.search-wrap{
  grid-column:auto!important;
  width:100%!important;
  min-width:0!important;
  min-height:42px!important;
  display:flex!important;
  align-items:center!important;
  border-radius:14px!important;
  background:#fff!important;
  border:1px solid #d9deea!important;
  padding:9px 12px!important;
  box-shadow:none!important;
}

.search-wrap input{
  width:100%!important;
  min-width:0!important;
  font-size:13px!important;
  color:#111827!important;
}

.filter-sel,
#filterStatus,
#filterPago,
#filterFechaDesde,
#filterFechaHasta,
#filterOperador{
  width:100%!important;
  min-width:0!important;
  max-width:none!important;
  min-height:42px!important;
  height:42px!important;
  border-radius:12px!important;
  border:1px solid #d9deea!important;
  background:#fff!important;
  color:#153bff!important;
  font-size:11px!important;
  font-weight:900!important;
  padding:8px 10px!important;
  flex:none!important;
}

.toolbar > #storageBadge{display:none!important;}
.table-wrap{margin-top:0!important;position:relative!important;z-index:1!important;}

@media(max-width:1280px){
  .header{grid-template-columns:130px minmax(0,1fr)!important;padding:10px 12px!important;}
  .header .logo{width:130px!important;min-width:130px!important;max-width:130px!important;}
  .header .logo img{max-width:118px!important;height:31px!important;}
  .header-tabs{gap:4px!important;}
  .header-tabs .tab-btn,
  .header-tabs .storage-pill{font-size:8.7px!important;padding:0 7px!important;gap:3px!important;}
  .toolbar{grid-template-columns:minmax(300px,1fr) 112px 112px 128px 128px 112px!important;}
}

@media(max-width:980px){
  .header{
    display:grid!important;
    grid-template-columns:1fr auto!important;
    height:auto!important;
    min-height:60px!important;
    overflow:visible!important;
    padding:10px 12px!important;
  }
  .header .logo{
    width:150px!important;
    min-width:150px!important;
    max-width:150px!important;
  }
  .header .logo img{height:34px!important;max-width:140px!important;}
  .mobile-menu-btn{
    grid-column:2!important;
    grid-row:1!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    min-height:36px!important;
    padding:8px 14px!important;
    border-radius:999px!important;
    border:1px solid rgba(255,255,255,.30)!important;
    background:rgba(255,255,255,.12)!important;
    color:#fff!important;
    font-family:var(--head,Montserrat,Arial,sans-serif)!important;
    font-size:12px!important;
    font-weight:900!important;
  }
  .header-tabs{
    grid-column:1 / -1!important;
    grid-row:2!important;
    display:none!important;
    width:100%!important;
    height:auto!important;
    margin-top:10px!important;
    padding-top:10px!important;
    border-top:1px solid rgba(255,255,255,.22)!important;
    overflow:visible!important;
    grid-template-columns:1fr 1fr!important;
    gap:8px!important;
  }
  .header-tabs.open{display:grid!important;}
  .header-tabs .tab-btn,
  .header-tabs .storage-pill{
    width:100%!important;
    min-height:40px!important;
    height:40px!important;
    font-size:11px!important;
    padding:0 10px!important;
  }
  .toolbar{
    position:relative!important;
    top:auto!important;
    z-index:500!important;
    grid-template-columns:1fr 1fr!important;
    padding:10px!important;
    gap:8px!important;
  }
  .search-wrap{grid-column:1 / -1!important;}
  #filterOperador{grid-column:1 / -1!important;}
}

@media(max-width:430px){
  .header .logo{width:132px!important;min-width:132px!important;max-width:132px!important;}
  .header .logo img{height:31px!important;max-width:126px!important;}
  .mobile-menu-btn{font-size:11px!important;padding:7px 11px!important;}
  .toolbar{grid-template-columns:1fr 1fr!important;}
  .filter-sel,
  #filterStatus,
  #filterPago,
  #filterFechaDesde,
  #filterFechaHasta,
  #filterOperador{
    font-size:10px!important;
    padding:8px 7px!important;
  }
}
</style>



<style>
/* =========================================================
   FIX FINAL v37 · Regresa campana + estabiliza menú
   - Logo | Campana | Menú en escritorio
   - Logo | Campana | Botón menú en móvil
   - No toca Supabase ni lógica de pedidos
========================================================= */
.header{
  display:grid!important;
  grid-template-columns:155px 44px minmax(0,1fr)!important;
  align-items:center!important;
  gap:8px!important;
  height:58px!important;
  min-height:58px!important;
  overflow:hidden!important;
}

.header .logo{
  grid-column:1!important;
  grid-row:1!important;
}

.header .noti-btn,
#notiBtnGlobal{
  grid-column:2!important;
  grid-row:1!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:38px!important;
  min-width:38px!important;
  max-width:38px!important;
  height:34px!important;
  min-height:34px!important;
  max-height:34px!important;
  padding:0!important;
  margin:0!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.30)!important;
  background:rgba(255,255,255,.12)!important;
  color:#fff!important;
  font-size:13px!important;
  line-height:1!important;
  box-shadow:none!important;
  cursor:pointer!important;
  white-space:nowrap!important;
  overflow:visible!important;
}

#notiBtnGlobal .noti-count{
  position:absolute!important;
  transform:translate(12px,-10px)!important;
  min-width:18px!important;
  width:auto!important;
  height:18px!important;
  padding:0 5px!important;
  border-radius:999px!important;
  background:#e5e7eb!important;
  color:#64748b!important;
  font-size:10px!important;
  font-family:var(--mono,monospace)!important;
  font-weight:900!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid rgba(255,255,255,.35)!important;
}

#notiBtnGlobal .noti-count:not(.empty){
  background:#dc2626!important;
  color:#fff!important;
}

.header-tabs{
  grid-column:3!important;
  grid-row:1!important;
}

@media(max-width:1280px){
  .header{
    grid-template-columns:130px 42px minmax(0,1fr)!important;
  }
}

@media(max-width:980px){
  .header{
    grid-template-columns:1fr 42px auto!important;
    height:auto!important;
    min-height:60px!important;
    overflow:visible!important;
  }

  .header .logo{
    grid-column:1!important;
    grid-row:1!important;
  }

  .header .noti-btn,
  #notiBtnGlobal{
    grid-column:2!important;
    grid-row:1!important;
  }

  .mobile-menu-btn{
    grid-column:3!important;
    grid-row:1!important;
  }

  .header-tabs{
    grid-column:1 / -1!important;
    grid-row:2!important;
  }
}
</style>



<style id="fix-mobile-compact-v39">
/* =========================================================
   FIX v39 · SOLO MÓVIL
   - Reduce aprox. 25% el tamaño visual en móvil
   - Oculta filtro de fecha Desde/Hasta solo en móvil
   - No modifica escritorio/web
========================================================= */
@media (max-width:980px){
  body{
    padding-bottom:92px!important;
  }

  .header{
    min-height:48px!important;
    padding:7px 9px!important;
    gap:6px!important;
  }

  .header .logo{
    width:118px!important;
    min-width:118px!important;
    max-width:118px!important;
  }

  .header .logo img{
    height:26px!important;
    max-width:112px!important;
  }

  .header .noti-btn,
  #notiBtnGlobal{
    width:32px!important;
    min-width:32px!important;
    max-width:32px!important;
    height:31px!important;
    min-height:31px!important;
    max-height:31px!important;
    font-size:12px!important;
  }

  #notiBtnGlobal .noti-count{
    min-width:14px!important;
    height:14px!important;
    padding:0 4px!important;
    font-size:8px!important;
    transform:translate(9px,-8px)!important;
  }

  .mobile-menu-btn{
    min-height:31px!important;
    height:31px!important;
    padding:6px 10px!important;
    font-size:10px!important;
    letter-spacing:1px!important;
  }

  .header-tabs{
    margin-top:7px!important;
    padding-top:7px!important;
    gap:6px!important;
  }

  .header-tabs .tab-btn,
  .header-tabs .storage-pill,
  .tab-btn{
    min-height:31px!important;
    height:31px!important;
    font-size:8.5px!important;
    padding:0 7px!important;
    border-radius:7px!important;
    letter-spacing:.8px!important;
  }

  .toolbar{
    padding:7px 9px!important;
    gap:6px!important;
    grid-template-columns:1fr 1fr!important;
  }

  .search-wrap{
    min-height:32px!important;
    height:32px!important;
    padding:5px 8px!important;
    border-radius:10px!important;
  }

  .search-wrap input{
    font-size:10px!important;
  }

  #filterFechaDesde,
  #filterFechaHasta{
    display:none!important;
  }

  .filter-sel,
  #filterStatus,
  #filterPago,
  #filterOperador{
    min-height:32px!important;
    height:32px!important;
    font-size:9px!important;
    padding:5px 7px!important;
    border-radius:9px!important;
  }

  #filterOperador{
    grid-column:auto!important;
  }

  .table-wrap{
    margin:0 7px!important;
    border-radius:8px!important;
    padding-bottom:95px!important;
  }

  table{
    min-width:890px!important;
    font-size:9px!important;
  }

  th{
    font-size:7.5px!important;
    padding:4px 4px!important;
    height:25px!important;
  }

  td{
    font-size:8.8px!important;
    padding:4px 4px!important;
    height:28px!important;
  }

  .quick-input,
  .quick-select,
  .quick-btn,
  .cell-edit,
  .cell-select{
    min-height:27px!important;
    height:27px!important;
    font-size:8.8px!important;
    padding:3px 5px!important;
    border-radius:6px!important;
  }

  .quick-textarea{
    min-height:27px!important;
    max-height:38px!important;
  }

  .status-pill,
  .pay-pill,
  .pill{
    font-size:7.8px!important;
    padding:3px 5px!important;
  }

  .btn-icon,
  .btn-mini,
  .icon-btn{
    min-width:26px!important;
    min-height:26px!important;
    width:26px!important;
    height:26px!important;
    font-size:10px!important;
  }
}

@media (max-width:430px){
  .header .logo{
    width:108px!important;
    min-width:108px!important;
    max-width:108px!important;
  }

  .header .logo img{
    height:24px!important;
    max-width:104px!important;
  }

  .mobile-menu-btn{
    min-height:30px!important;
    height:30px!important;
    padding:5px 9px!important;
    font-size:9.5px!important;
  }

  .toolbar{
    padding:6px 8px!important;
    gap:5px!important;
  }

  .filter-sel,
  #filterStatus,
  #filterPago,
  #filterOperador{
    font-size:8.5px!important;
    padding:5px 6px!important;
  }
}
</style>

</body>
</html>
