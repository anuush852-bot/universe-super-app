const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
let T=localStorage.t||'',ME=null,PR=[],CART=JSON.parse(localStorage.c||'[]'),CAT='All',EDIT=null;
const CATS=['All','Electronics','Fashion','Grocery','Home','Food','Medical','Other'];
const SERV=[['🛒','Shopping','Shop'],['🍔','Food','Food'],['💊','Medical','Medical'],['🛍️','Grocery','Grocery'],['📱','Electronics','Electronics'],['👗','Fashion','Fashion'],['🏠','Home','Home'],['🚕','Cab','#cab'],['💳','Wallet','#wallet'],['✈️','Flights','soon'],['🏨','Hotels','soon'],['🎬','Movies','soon']];
async function api(p,m='GET',b){const r=await fetch('/api'+p,{method:m,headers:{'Content-Type':'application/json',...(T?{Authorization:'Bearer '+T}:{})},body:b?JSON.stringify(b):undefined});
 const d=await r.json().catch(()=>({}));if(r.status===401&&T){logout(true)}if(!r.ok)throw new Error(d.error||'Something went wrong');return d}
function toast(m){const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2800)}
const go=id=>document.getElementById(id).scrollIntoView({behavior:'smooth'});
const UI={d:0,skip:0,push(){history.pushState({uv:1},'');this.d++},pop(){if(this.d>0){this.d--;this.skip++;history.back()}}};
window.addEventListener('popstate',()=>{if(UI.skip){UI.skip--;return}if(UI.d>0)UI.d--;const au=document.getElementById('authPage');if(au){closeAuth(true);return}const sh=document.getElementById('locSheet');if(sh){sh.remove();return}if($('#modal').classList.contains('on')){$('#modal').classList.remove('on');return}if(document.getElementById('cartPage'))closeCart(true)});
function modal(h,w){if(!$('#modal').classList.contains('on'))UI.push();$('#modal').innerHTML=`<div class="mbox ${w?'wide':''}"><button class="x" onclick="closeM()">×</button>${h}</div>`;$('#modal').classList.add('on')}
const closeM=()=>{if($('#modal').classList.contains('on')){$('#modal').classList.remove('on');UI.pop()}};
const wrap=f=>async(...a)=>{try{await f(...a)}catch(e){toast('⚠️ '+e.message)}};
function need(cb){if(!ME){AUTH_NEXT=cb||null;authM();return false}return true}

// ----- auth -----
let AUTH_NEXT=null;
const AA='autocapitalize="none" autocorrect="off" spellcheck="false"';
function closeAuth(fromPop){const a=document.getElementById('authPage');if(a){a.remove();if(!document.getElementById('cartPage'))document.body.classList.remove('noscroll');if(!fromPop)UI.pop()}}
function authM(tab='login'){
 let a=document.getElementById('authPage');
 if(!a){a=document.createElement('div');a.id='authPage';document.body.appendChild(a);document.body.classList.add('noscroll');
  const m=$('#modal');if(m.classList.contains('on'))m.classList.remove('on');else UI.push()} // reuse popup's history entry
 const L=tab=='login',lastId=(acctGet('user')[0]||{}).id||localStorage.uv_id||'';
 a.innerHTML=`<div class="au-h"><button onclick="closeAuth()" aria-label="Close">←</button><span>🚀 <b>UniVerse</b></span></div>
 <div class="au-b"><h1>${L?'Sign in':'Create account'}</h1><p class="mu au-sub">${L?'Track orders, use your wallet and checkout faster.':'Join now and get ₹100 welcome bonus in your wallet.'}</p>
 ${L?`${acctChips('user','a1','a2')}<div class="fld"><label for="a1">Mobile number or email</label><input id="a1" ${AA} autocomplete="username" value="${esc(lastId)}" placeholder="10-digit mobile or email"><small class="fe" id="e_a1"></small></div>
 <div class="fld"><label for="a2">Password</label><div class="pw"><input id="a2" type="password" autocomplete="current-password" ${AA} placeholder="Enter your password" onkeydown="if(event.key==='Enter')doAuth('login')"><button type="button" class="eye" onclick="togglePw('a2',this)" aria-label="Show password">👁️</button></div><small class="fe" id="e_a2"></small></div>`
 :`<div class="fld"><label for="n">Full name</label><input id="n" autocomplete="name" placeholder="Your name"><small class="fe" id="e_n"></small></div>
 <div class="fld"><label for="m">Mobile number</label><div class="pre"><span>+91</span><input id="m" maxlength="10" inputmode="numeric" autocomplete="tel" placeholder="10-digit number" oninput="this.value=this.value.replace(/\D/g,'')"></div><small class="fe" id="e_m"></small></div>
 <div class="fld"><label for="e">Email</label><input id="e" type="email" ${AA} autocomplete="email" placeholder="you@example.com"><small class="fe" id="e_e"></small></div>
 <div class="fld"><label for="ad">Delivery address <span class="mu">(optional)</span></label><textarea id="ad" rows="2" placeholder="House no, street, area">${esc((window.UVLoc&&UVLoc.get()||{}).addr||'')}</textarea></div>
 <div class="fld"><label for="pw">Create password</label><div class="pw"><input id="pw" type="password" autocomplete="new-password" ${AA} placeholder="At least 8 characters" oninput="pwMeter(this.value)" onkeydown="if(event.key==='Enter')doAuth('signup')"><button type="button" class="eye" onclick="togglePw('pw',this)" aria-label="Show password">👁️</button></div><div class="pm"><i id="pmi"></i></div><small class="fe" id="e_pw"></small></div>`}
 <p id="aerr" class="aerr"></p>
 <button class="full big" id="abtn" onclick="doAuth('${tab}')">${L?'Sign in':'Create account & get ₹100'}</button>
 ${L?'':'<p class="mu au-t">By creating an account you agree to our Terms &amp; Privacy Policy.</p>'}
 <div class="au-or"><span>${L?'New to UniVerse?':'Already have an account?'}</span></div>
 <button class="full ghostb big" onclick="authM('${L?'signup':'login'}')">${L?'Create your account':'Sign in'}</button>
 <p class="au-s"><a onclick="closeAuth()">Skip sign in</a> • <a href="https://wa.me/919319949612">Need help?</a></p></div>`;
 setTimeout(()=>{const f=L&&lastId?$('#a2'):a.querySelector('input');f&&f.focus()},250)}
function togglePw(id,b){const i=document.getElementById(id);i.type=i.type=='password'?'text':'password';b.textContent=i.type=='password'?'👁️':'🙈'}
function pwMeter(v){const sc=(v.length>=8)+(/[A-Z]/.test(v)&&/[a-z]/.test(v))+(/\d/.test(v))+(/[^A-Za-z0-9]/.test(v)),i=$('#pmi');if(!i)return;i.style.width=(v?Math.max(1,sc)*25:0)+'%';i.style.background=['#ff5c7a','#ff5c7a','#ffb84d','#68e0a1','#2fa36b'][sc]}
function fe(id,msg){const e=document.getElementById('e_'+id),i=document.getElementById(id);if(e)e.textContent=msg||'';if(i)i.classList.toggle('bad',!!msg);return !msg}
const doAuth=async k=>{const btn=$('#abtn'),er=$('#aerr');er.textContent='';let ok=true;const V=id=>$('#'+id).value;
 if(k=='login'){ok=fe('a1',V('a1').trim()?'':'Enter mobile number or email')&ok;ok=fe('a2',V('a2')?'':'Enter your password')&ok}
 else{ok=fe('n',V('n').trim().length>=2?'':'Enter your name')&ok;ok=fe('m',/^\d{10}$/.test(V('m'))?'':'Enter a valid 10-digit mobile number')&ok;ok=fe('e',/^\S+@\S+\.\S+$/.test(V('e').trim())?'':'Enter a valid email')&ok;ok=fe('pw',V('pw').length>=8?'':'Password must be at least 8 characters')&ok}
 if(!ok)return;btn.disabled=true;const old=btn.textContent;btn.textContent='Please wait…';
 try{let d;if(k=='login'){const id=V('a1').trim(),pw=V('a2');
   try{d=await api('/login','POST',{identity:id,password:pw})}catch(e){if(pw!==pw.trim()&&/wrong/i.test(e.message))d=await api('/login','POST',{identity:id,password:pw.trim()});else throw e}
   localStorage.uv_id=id}
  else{d=await api('/signup','POST',{name:V('n').trim(),mobile:V('m'),email:V('e').trim(),addr:V('ad').trim(),password:V('pw')});localStorage.uv_id=V('m')}
  T=d.token;localStorage.t=T;ME=d.user;acctSave('user',k=='login'?V('a1').trim():V('m'),ME.name);closeAuth();paint();toast((k=='signup'?'Account created! ₹100 added 🎁 ':'Welcome back, ')+ME.name.split(' ')[0]+'!');
  if(document.getElementById('cartPage'))openCart();const n=AUTH_NEXT;AUTH_NEXT=null;if(n)setTimeout(n,250);window.UVLoc&&UVLoc.watch&&UVLoc.watch()}
 catch(e){const m=e.message||'';btn.disabled=false;btn.textContent=old;
  er.innerHTML='⚠️ '+(/wrong login/i.test(m)?'Mobile/email or password is incorrect. Please check and try again, or <a onclick="authM(\'signup\')">create an account</a>.'
   :/already exists/i.test(m)?'An account with this mobile/email already exists. <a onclick="authM(\'login\')">Sign in instead</a>.'
   :/too many/i.test(m)?esc(m):/failed to fetch|network/i.test(m)?'No internet connection. Please check and retry.':esc(m))}};
function logout(q){T='';ME=null;delete localStorage.t;paint();if(!q)toast('Logged out')}
async function boot(){if(T)try{ME=(await api('/me')).user}catch{}paint();loadProducts()}
function paint(){$('#navUser').innerHTML=ME?`<button class="badge-u" onclick="userM()">👤 ${esc(ME.name.split(' ')[0])}</button>`:`<button class="primary" onclick="authM()">Login</button>`;
 $('#phHello').textContent=ME?'Hi, '+ME.name.split(' ')[0]:'Welcome';$('#phBal').textContent=ME?inr(ME.wallet):'₹0';$('#wBal').textContent=ME?inr(ME.wallet):'Login to view';$('#wName').textContent=ME?ME.name:'';
 {const n=CART.reduce((a,i)=>a+i.qty,0);$('#cc').textContent=n;const tb=$('#tbc');if(tb){tb.textContent=n;tb.style.display=n?'':'none'}}window.UVLoc&&UVLoc.paint();if(!ME)$('#mine').style.display='none'}
function userM(){modal(`<div class="acc"><div class="av">${esc(ME.name.trim()[0]||'U').toUpperCase()}</div><div><h2 style="margin:0">${esc(ME.name)}</h2><p class="mu" style="font-size:13px">${esc(ME.mobile)}<br>${esc(ME.email)}</p></div></div>
<div class="accw"><span>Super Wallet</span><b>${inr(ME.wallet)}</b></div>
<button class="full" onclick="closeM();setTimeout(()=>loadMine(true),150)">📜 My Orders & Rides</button>
<button class="full ghostb" onclick="closeM();setTimeout(()=>UVLoc.open(),150)">📍 Change delivery location</button>
<button class="full ghostb" style="color:#ff8896" onclick="if(confirm('Log out of UniVerse?')){logout();closeM()}">Log out</button>`)}

// ----- services / products -----
$('#sgrid').innerHTML=SERV.map(s=>`<div class="sc" onclick="svc('${s[2]}')"><i>${s[0]}</i><b>${s[1]}</b></div>`).join('');
function svc(t){if(t=='soon')return toast('🚧 Coming soon in the next release!');if(t[0]=='#')return go(t.slice(1));CAT=t=='Shop'?'All':t;loadProducts();go('shop')}
const doSearch=()=>{CAT='All';loadProducts();go('shop')};
const loadProducts=wrap(async()=>{PR=(await api('/products?cat='+encodeURIComponent(CAT)+'&q='+encodeURIComponent($('#q').value))).products;
 $('#chips').innerHTML=CATS.map(c=>`<button class="chip ${c==CAT?'on':''}" onclick="CAT='${c}';loadProducts()">${c}</button>`).join('');
 $('#pgrid').innerHTML=PR.map(p=>`<div class="pc" onclick="prodM(${p.id})">${p.image?`<img class="pimg" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="pimg">${esc(p.emoji)}</div>`}
 <div class="pi"><h3>${esc(p.name)}</h3><p>${esc(p.descr)}</p><span class="price">${inr(p.price)}</span>${p.stock<=5?`<span class="stk">${p.stock?'Only '+p.stock+' left':'Out of stock'}</span>`:''}
 ${p.stock?`<button class="pb" onclick="event.stopPropagation();addCart(${p.id})">🛒 Add to Cart</button>`:`<button class="pb" disabled style="opacity:.5">Out of stock</button>`}</div></div>`).join('')||'<p class="mu" style="text-align:center;grid-column:1/-1">No products found.</p>'});
function prodM(id){const p=PR.find(x=>x.id==id);if(!p)return;modal(`${p.image?`<img class="pimg" style="border-radius:14px;margin-bottom:14px" src="${esc(p.image)}">`:`<div class="pimg" style="border-radius:14px;margin-bottom:14px">${esc(p.emoji)}</div>`}
<h2>${esc(p.name)}</h2><div class="price" style="margin-bottom:10px">${inr(p.price)}</div><p class="mu" style="margin-bottom:16px;line-height:1.6">${esc(p.descr)}</p>
${p.stock?`<div class="row"><button class="full" onclick="addCart(${p.id})">🛒 Add to Cart</button><button class="full" style="background:#2fa36b" onclick="addCart(${p.id},1)">⚡ Buy Now</button></div>`:'<p style="color:#ff7070">Out of stock</p>'}`)}
function addCart(id,buy){const p=PR.find(x=>x.id==id),i=CART.find(x=>x.id==id);if(i){if(i.qty<p.stock)i.qty++}else CART.push({id:p.id,name:p.name,price:p.price,emoji:p.emoji,image:p.image||'',stock:p.stock,qty:1});
 localStorage.c=JSON.stringify(CART);paint();if(buy)return checkout();closeM();toast('Added to cart 🛒')}
const CARTART=`<svg viewBox="0 0 240 160" width="220" aria-hidden="true"><ellipse cx="120" cy="80" rx="95" ry="70" fill="#1a2140"/><path d="M60 40h22l16 62h74l14-44H92" fill="none" stroke="#a895ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M96 58h86l-10 34H104z" fill="#7657ff" opacity=".35"/><circle cx="110" cy="122" r="9" fill="#a895ff"/><circle cx="170" cy="122" r="9" fill="#a895ff"/><path d="M40 138h160" stroke="#343d52" stroke-width="3" stroke-linecap="round"/></svg>`;
const cartTotal=()=>CART.reduce((a,i)=>a+i.price*i.qty,0);
function closeCart(fromPop){const c=document.getElementById('cartPage');if(c){c.remove();document.body.classList.remove('noscroll');if(!fromPop)UI.pop()}}
function openCart(){let c=document.getElementById('cartPage');if(!c){c=document.createElement('div');c.id='cartPage';document.body.appendChild(c);document.body.classList.add('noscroll');UI.push()}
 const n=CART.reduce((a,i)=>a+i.qty,0),t=cartTotal(),left=500-t;
 const head=`<div class="cp-h"><button onclick="closeCart()" aria-label="Back">←</button><b>Your Cart${n?' ('+n+')':''}</b></div>`;
 if(!CART.length){c.innerHTML=head+`<div class="cp-b cp-empty">${CARTART}<h2>Your Cart is empty</h2><a class="lnk" onclick="closeCart();go('offers')">Shop today's deals</a>
  ${ME?'':`<button class="full" onclick="authM('login')">Sign in to your account</button><button class="full ghostb" onclick="authM('signup')">Sign up now</button>`}
  <button class="full ${ME?'':'ghostb'}" onclick="closeCart();go('shop')">Continue shopping</button></div>`;return}
 c.innerHTML=head+`<div class="cp-b">${left>0?`<div class="cp-free">🚚 Add <b>${inr(left)}</b> more for <b>free delivery</b><div class="bar"><i style="width:${Math.min(100,t/5)}%"></i></div></div>`:'<div class="cp-free ok">🎉 You get <b>free delivery</b> on this order</div>'}
  ${CART.map((i,k)=>`<div class="ci">${i.image?`<img class="cth" src="${esc(i.image)}" alt="">`:`<div class="e">${esc(i.emoji)}</div>`}<div><b>${esc(i.name)}</b><div class="mu">${inr(i.price)} each</div><div class="q"><button aria-label="Less" onclick="qty(${k},-1)">−</button><span>${i.qty}</span><button aria-label="More" onclick="qty(${k},1)">+</button><button class="rm" onclick="qty(${k},-99)">🗑 Remove</button></div></div><div class="cp-p">${inr(i.price*i.qty)}</div></div>`).join('')}
  <div class="cp-sum"><div><span>Subtotal</span><span>${inr(t)}</span></div><div><span>Delivery fee</span><span>${t>=500?'FREE':inr(30)}</span></div><div class="g"><span>Total</span><span>${inr(t+(t>=500?0:30))}</span></div></div></div>
  <div class="cp-f"><div><small class="mu">Total</small><div class="price">${inr(t+(t>=500?0:30))}</div></div><button class="full" onclick="closeCart(true);checkout()">Proceed to Order →</button></div>`}
function qty(k,d){const i=CART[k];if(!i)return;if(d>0&&i.stock!=null&&i.qty>=i.stock){toast('Only '+i.stock+' available');return}i.qty+=d;if(i.qty<=0)CART.splice(k,1);localStorage.c=JSON.stringify(CART);paint();openCart()}
function checkout(){if(!need(checkout))return;const SL=window.UVLoc&&UVLoc.get();OPIN=SL&&SL.lat!=null?{lat:SL.lat,lng:SL.lng}:null;const t=CART.reduce((a,i)=>a+i.price*i.qty,0);modal(`<h2>📦 Place Your Order</h2><label>Full Name</label><input id="on" value="${esc(ME.name)}"><label>Mobile</label><input id="om" maxlength="10" value="${esc(ME.mobile)}">
<label>Delivery Address</label><textarea id="oa">${esc((SL&&SL.addr)||ME.addr||'')}</textarea><button type="button" class="secondary" style="width:100%;margin:6px 0 4px" onclick="useMyLocation()">📍 Use my current location</button><p id="ol" class="mu" style="margin:0 0 12px"></p><label>Payment</label><select id="op"><option value="COD">Cash on Delivery</option><option value="Wallet">Super Wallet (${inr(ME.wallet)})</option><option value="Online">UPI / Card / Netbanking</option></select>
<div class="tot">Total: ${inr(t)}</div><p class="mu" style="margin:-8px 0 12px">+ ₹30 delivery fee on orders under ₹500</p><button class="full" onclick="placeOrder()">✅ Place Order</button>`);if(!OPIN&&(!ME.addr||!ME.addr.trim()))setTimeout(()=>useMyLocation(true),300)}
let OPIN=null;
function useMyLocation(silent){if(!navigator.geolocation){if(!silent)toast('GPS available nahi hai');return}const l=$('#ol');if(l)l.textContent='📍 Location le rahe hain...';
 navigator.geolocation.getCurrentPosition(async p=>{OPIN={lat:p.coords.latitude,lng:p.coords.longitude};const l2=$('#ol');if(l2)l2.textContent='✅ Location mil gayi. Delivery partner ko exact pin milega.';
  try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+OPIN.lat+'&lon='+OPIN.lng,{headers:{'Accept-Language':'en'}}),j=await r.json(),a=$('#oa');if(a&&j.display_name)a.value=j.display_name}catch(e){}},
  ()=>{const l3=$('#ol');if(l3)l3.textContent=silent?'':'⚠️ Location permission allow karo ya address khud likho.'},{enableHighAccuracy:true,timeout:15000})}
const placeOrder=wrap(async()=>{const d=await api('/orders','POST',{items:CART.map(i=>({id:i.id,qty:i.qty})),name:$('#on').value,mobile:$('#om').value,addr:$('#oa').value,pay:$('#op').value,lat:OPIN?.lat,lng:OPIN?.lng});
 if($('#op').value==='Online'){const pg=await api('/payments/create-order','POST',{orderId:d.orderId});if(!window.Razorpay)throw new Error('Payment checkout did not load. Please retry.');const checkout=new Razorpay({key:pg.keyId,amount:pg.amount,currency:pg.currency,name:'UniVerse Super App',description:'Order '+d.orderId,order_id:pg.providerOrderId,prefill:pg.customer,handler:async response=>{await api('/payments/verify','POST',response);finishOrder(d)},modal:{ondismiss:()=>toast('Payment pending. Contact support before retrying.')}});checkout.open();return;}finishOrder(d)});
function finishOrder(d){CART=[];localStorage.c='[]';api('/me').then(x=>{ME=x.user;paint()});loadProducts();modal(`<h2>🎉 Order placed!</h2><p>Order ID: <b>${d.orderId}</b></p><p>Total: <b>${inr(d.total)}</b></p><div class="box"><b>Delivery OTP: ${d.deliveryOtp}</b><p class="mu">Share this OTP with the delivery partner only after receiving your order.</p></div><br><button class="full" onclick="closeM();loadMine(true)">Track my orders</button>`)}

// ----- wallet / cab / my orders -----
const topup=wrap(async a=>{if(!need())return;const d=await api('/wallet/topup','POST',{amount:a});ME.wallet=d.wallet;paint();toast('Added '+inr(a)+' (demo top-up)')});
const bookCab=wrap(async()=>{if(!need())return;const d=await api('/cab','POST',{pickup:$('#pickup').value,dest:$('#dest').value,type:$('#ctype').value});
 modal(`<h2>🚕 Cab booked!</h2><p>Ride ID: <b>${d.rideId}</b></p><p>Distance ≈ ${d.km} km • Fare ≈ <b>${inr(d.fare)}</b></p><p class="mu">Searching for a driver nearby…</p>`)});
const loadMine=wrap(async show=>{if(!need())return;const[o,c,w]=await Promise.all([api('/orders'),api('/cab'),api('/wallet')]);const s=$('#mine');s.style.display='block';
 s.innerHTML=`<div class="st"><h2>📜 My Orders, Rides & Wallet</h2></div><div class="mylist"><h3>🛒 Orders</h3>${o.orders.map(x=>`<div class="oc"><div class="row sb"><b>${esc(x.ref)}</b><span class="mu">${new Date(x.ts).toLocaleDateString()}</span></div><div class="oi">${x.items.map(i=>esc(i.name)+' ×'+i.qty).join('<br>')}</div><div class="row sb"><span>${inr(x.total)} • ${esc(x.pay)}</span></div><div class="os">${stx(x,1)}</div></div>`).join('')||'<div class="oc mu">No orders yet — <a class="lnk" onclick="go(\'shop\')">start shopping</a></div>'}
 <h3>🚕 Rides</h3>${c.rides.map(x=>`<div class="oc"><div class="row sb"><b>CAB${10000+x.id}</b><span>${inr(x.fare)}</span></div><div class="oi">${esc(x.pickup)} → ${esc(x.dest)} • ${esc(x.type)}</div><div class="os">${stx(x,0)}${x.pname?`<br>🚘 ${esc(x.pveh||'')}`:''}</div></div>`).join('')||'<div class="oc mu">No rides yet</div>'}
 <h3>💳 Wallet history</h3>${w.tx.map(x=>`<div class="oc row sb"><span>${esc(x.note)}<br><small class="mu">${new Date(x.ts).toLocaleString()}</small></span><b style="color:${x.amt<0?'#ff7070':'#68e0a1'}">${x.amt<0?'−':'+'}${inr(Math.abs(x.amt))}</b></div>`).join('')||'<div class="oc mu">No transactions</div>'}</div>`;if(show)go('mine')});

const stx=(x,o)=>`<span class="tag">${x.status}</span>${x.pname?`<br>🧑 ${esc(x.pname)}<br><a style="color:#a895ff" href="tel:${esc(x.pmobile)}">📞 ${esc(x.pmobile)}</a>`:''}${x.delivery_otp?`<br>🔐 Delivery OTP: <b>${esc(x.delivery_otp)}</b>`:''}${o&&/out/i.test(x.status)?`<br><button class="sm" onclick="openTrack(${x.id},'customer')">📍 Track</button>`:''}${o&&!['Delivered','Cancelled'].includes(x.status)?`<br><button class="sm d" onclick="cancelOrder(${x.id})">Cancel</button>`:''}`;
const cancelOrder=wrap(async id=>{if(!confirm('Cancel this order?'))return;await api('/orders/'+id+'/cancel','POST');ME=(await api('/me')).user;paint();loadProducts();loadMine();toast('Order cancelled, refund done if paid by wallet')});
setInterval(()=>{if(ME&&$('#mine').style.display=='block'&&!$('#modal').classList.contains('on'))loadMine()},10000);
$('#pgrid').innerHTML='<div class="pc sk"></div>'.repeat(4);
boot();
