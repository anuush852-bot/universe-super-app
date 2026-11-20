// Backend URL. Empty = same origin (website). The APK build script overwrites this with your server URL.
window.API_BASE='';
// Product images come back as /img/N from the server; in the APK they must point at the server.
(function(){var B=window.API_BASE;if(!B)return;
function fix(i){var s=i.getAttribute&&i.getAttribute('src');if(s&&s.indexOf('/img/')===0)i.setAttribute('src',B+s)}
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.tagName==='IMG')fix(n);n.querySelectorAll&&n.querySelectorAll('img[src^="/img/"]').forEach(fix)});if(m.type==='attributes')fix(m.target)})}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});})();
