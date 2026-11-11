/* ---- saved accounts (Amazon/Zomato style): remember who logged in on this phone, never the password ---- */
const _ak=r=>'uv_accts_'+r;
function acctGet(r){try{return JSON.parse(localStorage[_ak(r)]||'[]')}catch(e){return[]}}
function acctSave(r,id,name){id=String(id||'').trim();if(!id)return;const l=acctGet(r).filter(x=>x.id.toLowerCase()!==id.toLowerCase());l.unshift({id,name:name||'',ts:Date.now()});try{localStorage[_ak(r)]=JSON.stringify(l.slice(0,3))}catch(e){}}
const acctMask=id=>/^\d{10}$/.test(id)?'+91 '+id.slice(0,2)+'••••••'+id.slice(-2):String(id).replace(/^(.).*(@.*)$/,(m,a,b)=>a+'•••'+b);
function acctChips(r,idEl,pwEl){const l=acctGet(r);if(!l.length)return'';
 return `<div class="acct" data-r="${r}"><small>Saved accounts – tap to continue</small>${l.map(a=>`<div class="acct-i"><button type="button" class="acct-b" data-id="${esc(a.id)}" data-i="${idEl}" data-p="${pwEl}" onclick="acctUse(this)"><span class="av3">${esc((a.name||a.id).trim().charAt(0).toUpperCase())}</span><span><b>${esc(a.name||'Your account')}</b><em>${esc(acctMask(a.id))}</em></span></button><button type="button" class="acct-x" aria-label="Remove" data-id="${esc(a.id)}" onclick="acctRm(this)">×</button></div>`).join('')}</div>`}
function acctUse(b){const i=document.getElementById(b.dataset.i),p=document.getElementById(b.dataset.p);if(i)i.value=b.dataset.id;document.querySelectorAll('.acct-b').forEach(x=>x.classList.toggle('on',x===b));if(p){p.focus()}}
function acctRm(b){const w=b.closest('.acct'),r=w.dataset.r;try{localStorage[_ak(r)]=JSON.stringify(acctGet(r).filter(x=>x.id!==b.dataset.id))}catch(e){}b.closest('.acct-i').remove();if(!w.querySelector('.acct-i'))w.remove()}
