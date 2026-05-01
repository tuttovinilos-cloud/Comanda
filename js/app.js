console.log("APP JS conectado correctamente");
console.log("Supabase:", window.supabaseClient);
// Forzar indicador a Supabase
const badge = document.getElementById("storageBadgeText");
if (badge) {
  badge.textContent = "SUPABASE";
}

const badgeBox = document.getElementById("storageBadge");
if (badgeBox) {
  badgeBox.classList.add("ok");
}
