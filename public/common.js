const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');let T=localStorage[KEY]||'',ME=null;
async function api(p,m='GET',b){const r=await fetch('/api'+p,{method:m,headers:{'Content-Type':'application/json',...(T?{Authorization:'Bearer '+T}:{})},body:b?JSON.stringify(b):undefined});
 const d=await r.json().catch(()=>({}));if(r.status===401&&T){T='';delete localStorage[KEY];ME=null;window.onUnauth&&onUnauth()}if(!r.ok)throw new Error(d.error||'Something went wrong');return d}
function toast(m){const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2800)}
const wrap=f=>async(...a)=>{try{await f(...a)}catch(e){toast('⚠️ '+e.message)}};
const go=id=>document.getElementById(id).scrollIntoView({behavior:'smooth'});
function logout(){T='';delete localStorage[KEY];ME=null;view()}
