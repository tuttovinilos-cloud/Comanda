console.log("Organizador JS conectado");

const ORG_LOCAL_KEY = "tv_organizador_v2";
const ORG_TABLE = "organizador_ideas";
const ORG_ROW_ID = 1;

let orgData = { projects: [] };

function dbOrg() {
  return window.supabaseClient;
}

function normText(v) {
  return String(v || "").trim();
}

function showOrgToast(msg, type) {
  const t = document.getElementById("orgToast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + (type || "ok");
  setTimeout(() => { t.className = "toast"; }, 2000);
}

function ensureShape() {
  if (!orgData || !Array.isArray(orgData.projects)) orgData = { projects: [] };
  orgData.projects.forEach(p => {
    if (!Array.isArray(p.tasks)) p.tasks = [];
  });
}

function countStats() {
  const tasks = orgData.projects.flatMap(p => p.tasks || []);
  const pending = tasks.filter(t => t.status !== "Listo").length;
  const done = tasks.filter(t => t.status === "Listo").length;

  document.getElementById("mProjects").textContent = String(orgData.projects.length);
  document.getElementById("mTasks").textContent = String(tasks.length);
  document.getElementById("mPending").textContent = String(pending);
  document.getElementById("mDone").textContent = String(done);
}

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  ensureShape();
  countStats();

  const list = document.getElementById("projects");
  if (!list) return;

  if (!orgData.projects.length) {
    list.innerHTML = `<div class="empty">Sin proyectos. Usa "Nuevo proyecto".</div>`;
    return;
  }

  list.innerHTML = orgData.projects.map((p, pi) => {
    const rows = (p.tasks || []).map((t, ti) => `
      <tr>
        <td>${ti + 1}</td>
        <td><input value="${esc(t.desc || "")}" oninput="orgUpdateTask(${pi},${ti},'desc',this.value)"></td>
        <td>
          <select onchange="orgUpdateTask(${pi},${ti},'status',this.value)">
            <option ${t.status === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option ${t.status === "En proceso" ? "selected" : ""}>En proceso</option>
            <option ${t.status === "Listo" ? "selected" : ""}>Listo</option>
          </select>
        </td>
        <td><input value="${esc(t.responsible || "")}" oninput="orgUpdateTask(${pi},${ti},'responsible',this.value)"></td>
        <td><button class="mini-btn del" onclick="orgDeleteTask(${pi},${ti})">Eliminar</button></td>
      </tr>
    `).join("");

    return `
      <section class="card">
        <div class="card-head">
          <input class="project-name" value="${esc(p.name || "Proyecto")}" oninput="orgUpdateProject(${pi},'name',this.value)">
          <div class="head-actions">
            <button class="mini-btn" onclick="orgAddTask(${pi})">+ Tarea</button>
            <button class="mini-btn del" onclick="orgDeleteProject(${pi})">Eliminar</button>
          </div>
        </div>
        <div class="meta-grid">
          <label>Prioridad <input type="number" min="1" value="${Number(p.priority || 1)}" onchange="orgUpdateProject(${pi},'priority',Number(this.value||1))"></label>
          <label>Notas <input value="${esc(p.notes || "")}" oninput="orgUpdateProject(${pi},'notes',this.value)"></label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Idea</th><th>Estado</th><th>Responsable</th><th>Acción</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }).join("");
}

function saveLocal() {
  localStorage.setItem(ORG_LOCAL_KEY, JSON.stringify(orgData));
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(ORG_LOCAL_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.projects)) return false;
    orgData = data;
    return true;
  } catch {
    return false;
  }
}

async function loadRemote() {
  const db = dbOrg();
  if (!db) return false;

  try {
    const { data, error } = await db.from(ORG_TABLE).select("id,data").eq("id", ORG_ROW_ID).maybeSingle();
    if (error) return false;
    if (data && data.data && Array.isArray(data.data.projects)) {
      orgData = data.data;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function saveRemote() {
  const db = dbOrg();
  if (!db) return false;

  try {
    const payload = { id: ORG_ROW_ID, data: orgData, updated_at: new Date().toISOString() };
    const { error } = await db.from(ORG_TABLE).upsert(payload, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}

async function saveAll(notify) {
  saveLocal();
  const remoteOk = await saveRemote();
  if (notify) showOrgToast(remoteOk ? "Guardado en Supabase" : "Guardado local", remoteOk ? "ok" : "warn");
}

function orgAddProject() {
  orgData.projects.push({
    name: "Nuevo proyecto",
    priority: orgData.projects.length + 1,
    notes: "",
    tasks: [{ desc: "", status: "Pendiente", responsible: "" }]
  });
  render();
  saveAll(false);
}

function orgDeleteProject(pi) {
  if (!confirm("¿Eliminar proyecto?")) return;
  orgData.projects.splice(pi, 1);
  render();
  saveAll(false);
}

function orgAddTask(pi) {
  orgData.projects[pi].tasks.push({ desc: "", status: "Pendiente", responsible: "" });
  render();
  saveAll(false);
}

function orgDeleteTask(pi, ti) {
  orgData.projects[pi].tasks.splice(ti, 1);
  render();
  saveAll(false);
}

function orgUpdateProject(pi, field, value) {
  orgData.projects[pi][field] = value;
  countStats();
  saveAll(false);
}

function orgUpdateTask(pi, ti, field, value) {
  orgData.projects[pi].tasks[ti][field] = value;
  countStats();
  saveAll(false);
}

window.orgAddProject = orgAddProject;
window.orgDeleteProject = orgDeleteProject;
window.orgAddTask = orgAddTask;
window.orgDeleteTask = orgDeleteTask;
window.orgUpdateProject = orgUpdateProject;
window.orgUpdateTask = orgUpdateTask;

window.addEventListener("DOMContentLoaded", async () => {
  let loaded = await loadRemote();
  if (!loaded) loaded = loadLocal();

  if (!loaded) {
    orgData = {
      projects: [
        {
          name: "OWC",
          priority: 1,
          notes: "Proyecto inicial",
          tasks: [
            { desc: "Definir pendientes", status: "Pendiente", responsible: "" }
          ]
        }
      ]
    };
  }

  render();

  const addBtn = document.getElementById("addProjectBtn");
  const saveBtn = document.getElementById("saveBtn");
  if (addBtn) addBtn.onclick = orgAddProject;
  if (saveBtn) saveBtn.onclick = () => saveAll(true);
});
