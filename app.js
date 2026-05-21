// Wrapper raíz: delega en js/app.js
(function(){
  var s=document.createElement('script');
  s.src='js/app.js';
  s.defer=true;
  document.head.appendChild(s);
})();
