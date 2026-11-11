const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');let T=localStorage[KEY]||'',ME=null;
async function api(p,m='GET',b){const r=await fetch('/api'+p,{method:m,headers:{'Content-Type':'application/json',...(T?{Authorization:'Bearer '+T}:{})},body:b?JSON.stringify(b):undefined});
 const d=await r.json().catch(()=>({}));if(r.status===401&&T){T='';delete localStorage[KEY];ME=null;window.onUnauth&&onUnauth()}if(!r.ok)throw new Error(d.error||'Something went wrong');return d}
function toast(m){const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2800)}
const wrap=f=>async(...a)=>{try{await f(...a)}catch(e){toast('⚠️ '+e.message)}};
const go=id=>document.getElementById(id).scrollIntoView({behavior:'smooth'});
function logout(){T='';delete localStorage[KEY];ME=null;view()}

async function payCashDue(after){const pg=await api('/partner/cash/pay-create','POST',{});if(!window.Razorpay)throw new Error('Payment checkout did not load. Please retry.');new Razorpay({key:pg.keyId,amount:pg.amount,currency:pg.currency,name:'UniVerse Super App',description:pg.description,order_id:pg.providerOrderId,prefill:pg.customer,handler:async r=>{try{await api('/partner/cash/pay-verify','POST',r);toast('Cash deposited ✅');after&&after()}catch(e){toast('⚠️ '+e.message)}},modal:{ondismiss:()=>toast('Payment not completed')}}).open()}
function cashBoxHtml(c,afterJs){if(!c)return'';return(c.blocked?'<div class="box" style="max-width:none;margin:14px 0;border-color:#ff7070">⛔ <b>Cash limit reached ('+inr(c.limit)+').</b><p class="mu">Naye orders tab milenge jab aap cash jama karenge.</p></div>':'')+(c.inHand>0?'<button class="full" style="margin:10px 0" onclick="payCashDue(()=>'+afterJs+').catch(e=>toast(\'⚠️ \'+e.message))">💳 Pay '+inr(c.inHand)+' now (UPI/Card)</button>':'')}

function alertSound(msg){try{toast('🔔 '+msg);if(navigator.vibrate)navigator.vibrate([250,120,250]);const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(.25,c.currentTime);o.start();o.stop(c.currentTime+.35);setTimeout(()=>c.close(),600)}catch(e){}}
const idleForRefresh=()=>!document.hidden&&!document.querySelector('#app input:focus,#app textarea:focus')&&![...document.querySelectorAll('#app input,#app textarea')].some(i=>i.value);

/* compress a chosen photo to a small JPEG data URL (used for product / document uploads) */
function imgToJpeg(file,max=900){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=()=>no(new Error('Could not read the photo'));r.onload=()=>{const im=new Image();im.onerror=()=>no(new Error('Please choose a valid photo (JPG/PNG)'));im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height)),w=Math.round(im.width*s),h=Math.round(im.height*s),cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);let q=.82,d=cv.toDataURL('image/jpeg',q);while(d.length>780000&&q>.35){q-=.1;d=cv.toDataURL('image/jpeg',q)}ok(d)};im.src=r.result};r.readAsDataURL(file)})}
