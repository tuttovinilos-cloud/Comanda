// Wrapper to load the real auth logic from the project root.
// Some pages reference `js/auth.js`; keep it stable and delegate.

(() => {
  const script = document.createElement("script");
  script.src = "auth.js";
  script.defer = true;
  document.head.appendChild(script);
})();

