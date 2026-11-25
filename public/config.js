// Backend URL. Empty = same origin (website). The APK build script overwrites this with your server URL.
window.API_BASE='';
// Product images come back as /img/N from the server; in the APK they must point at the server.
(function(){var B=window.API_BASE;if(!B)return;
function fix(i){var s=i.getAttribute&&i.getAttribute('src');if(s&&s.indexOf('/img/')===0)i.setAttribute('src',B+s)}
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.tagName==='IMG')fix(n);n.querySelectorAll&&n.querySelectorAll('img[src^="/img/"]').forEach(fix)});if(m.type==='attributes')fix(m.target)})}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});})();

// Small badge: shows which server this app talks to (customer, driver and seller must all show the SAME name)
(function () {
  var B = window.API_BASE; if (!B) return;
  function mk() {
    var d = document.createElement('div'), host = B.replace(/^https?:\/\//, '');
    d.style.cssText = 'position:fixed;left:6px;bottom:2px;font:9px/1.2 sans-serif;color:#9aa;opacity:.7;z-index:9999;pointer-events:none;text-shadow:0 0 2px #000';
    d.textContent = '⚪ ' + host; document.body.appendChild(d);
    function ping() { fetch(B + '/api/config', { cache: 'no-store' }).then(function (r) { d.textContent = (r.ok ? '🟢 ' : '🔴 ') + host; }, function () { d.textContent = '🔴 ' + host + ' (connect nahi hua)'; }); }
    ping(); setInterval(ping, 30000);
  }
  if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
})();
