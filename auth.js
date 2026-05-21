// Wrapper raíz: delega en js/auth.js
(function(){
  var s=document.createElement('script');
  s.src='js/auth.js';
  s.defer=true;
  document.head.appendChild(s);
})();
