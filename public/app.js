const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
let T=localStorage.t||'',ME=null,PR=[],CART=JSON.parse(localStorage.c||'[]'),CAT='All',EDIT=null;
const CATS=['All','Electronics','Fashion','Grocery','Home','Food','Medical','Other'];
const SERV=[['🛒','Shopping','Shop'],['🍔','Food','Food'],['💊','Medical','Medical'],['🛍️','Grocery','Grocery'],['📱','Electronics','Electronics'],['👗','Fashion','Fashion'],['🏠','Home','Home'],['🚕','Cab','#cab'],['💳','Wallet','#wallet'],['✈️','Flights','soon'],['🏨','Hotels','soon'],['🎬','Movies','soon']];
async function api(p,m='GET',b){const r=await fetch('/api'+p,{method:m,headers:{'Content-Type':'application/json',...(T?{Authorization:'Bearer '+T}:{})},body:b?JSON.stringify(b):undefined});
 const d=await r.json().catch(()=>({}));if(r.status===401&&T){logout(true)}if(!r.ok)throw new Error(d.error||'Something went wrong');return d}
function toast(m){const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2800)}
const go=id=>document.getElementById(id).scrollIntoView({behavior:'smooth'});
function modal(h,w){$('#modal').innerHTML=`<div class="mbox ${w?'wide':''}"><button class="x" onclick="closeM()">×</button>${h}</div>`;$('#modal').classList.add('on')}
const closeM=()=>$('#modal').classList.remove('on');
const wrap=f=>async(...a)=>{try{await f(...a)}catch(e){toast('⚠️ '+e.message)}};
function need(){if(!ME){authM();return false}return true}

// ----- auth -----
function authM(tab='login'){modal(`<h2>${tab=='login'?'Welcome Back 👋':'Create Account 🚀'}</h2><div class="tabs"><button class="${tab=='login'?'on':''}" onclick="authM('login')">Login</button><button class="${tab!='login'?'on':''}" onclick="authM('signup')">Sign up</button></div>
${tab=='login'?`<label>Mobile or Email</label><input id="a1"><label>Password</label><input id="a2" type="password"><button class="full" onclick="doAuth('login')">🔐 Login</button>`
:`<label>Full Name</label><input id="n"><label>Mobile (10 digits)</label><input id="m" maxlength="10" inputmode="numeric"><label>Email</label><input id="e" type="email"><label>Address</label><textarea id="ad"></textarea><label>Password (8+ chars)</label><input id="pw" type="password"><button class="full" onclick="doAuth('signup')">🚀 Create Account (₹100 bonus)</button>`}`)}
const doAuth=wrap(async k=>{const d=k=='login'?await api('/login','POST',{identity:$('#a1').value,password:$('#a2').value})
 :await api('/signup','POST',{name:$('#n').value,mobile:$('#m').value,email:$('#e').value,addr:$('#ad').value,password:$('#pw').value});
 T=d.token;localStorage.t=T;ME=d.user;closeM();paint();toast('Welcome, '+ME.name+'!')});
function logout(q){T='';ME=null;delete localStorage.t;paint();if(!q)toast('Logged out')}
async function boot(){if(T)try{ME=(await api('/me')).user}catch{}paint();loadProducts()}
function paint(){$('#navUser').innerHTML=ME?`<button class="badge-u" onclick="userM()">👤 ${esc(ME.name.split(' ')[0])}</button>`:`<button class="primary" onclick="authM()">Login</button>`;
 $('#phHello').textContent=ME?'Hi, '+ME.name.split(' ')[0]:'Welcome';$('#phBal').textContent=ME?inr(ME.wallet):'₹0';$('#wBal').textContent=ME?inr(ME.wallet):'Login to view';$('#wName').textContent=ME?ME.name:'';
 {const n=CART.reduce((a,i)=>a+i.qty,0);$('#cc').textContent=n;const tb=$('#tbc');if(tb){tb.textContent=n;tb.style.display=n?'':'none'}}window.UVLoc&&UVLoc.paint();if(!ME)$('#mine').style.display='none'}
function userM(){modal(`<h2>👤 ${esc(ME.name)}</h2><p class="mu">${esc(ME.email)} • ${esc(ME.mobile)}</p><p style="margin:12px 0">Wallet: <b>${inr(ME.wallet)}</b></p><button class="full" onclick="closeM();loadMine(true)">📜 My Orders & Rides</button><br><br><button class="full" style="background:#7d2935" onclick="logout();closeM()">Logout</button>`)}

// ----- services / products -----
$('#sgrid').innerHTML=SERV.map(s=>`<div class="sc" onclick="svc('${s[2]}')"><i>${s[0]}</i><b>${s[1]}</b></div>`).join('');
function svc(t){if(t=='soon')return toast('🚧 Coming soon in the next release!');if(t[0]=='#')return go(t.slice(1));CAT=t=='Shop'?'All':t;loadProducts();go('shop')}
const doSearch=()=>{CAT='All';loadProducts();go('shop')};
const loadProducts=wrap(async()=>{PR=(await api('/products?cat='+encodeURIComponent(CAT)+'&q='+encodeURIComponent($('#q').value))).products;
 $('#chips').innerHTML=CATS.map(c=>`<button class="chip ${c==CAT?'on':''}" onclick="CAT='${c}';loadProducts()">${c}</button>`).join('');
 $('#pgrid').innerHTML=PR.map(p=>`<div class="pc" onclick="prodM(${p.id})">${p.image?`<img class="pimg" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="pimg">${esc(p.emoji)}</div>`}
 <div class="pi"><h3>${esc(p.name)}</h3><p>${esc(p.descr)}</p><span class="price">${inr(p.price)}</span>${p.stock<=5?`<span class="stk">${p.stock?'Only '+p.stock+' left':'Out of stock'}</span>`:''}
 <button class="pb" onclick="event.stopPropagation();prodM(${p.id})">View Product</button></div></div>`).join('')||'<p class="mu" style="text-align:center;grid-column:1/-1">No products found.</p>'});
function prodM(id){const p=PR.find(x=>x.id==id);if(!p)return;modal(`${p.image?`<img class="pimg" style="border-radius:14px;margin-bottom:14px" src="${esc(p.image)}">`:`<div class="pimg" style="border-radius:14px;margin-bottom:14px">${esc(p.emoji)}</div>`}
<h2>${esc(p.name)}</h2><div class="price" style="margin-bottom:10px">${inr(p.price)}</div><p class="mu" style="margin-bottom:16px;line-height:1.6">${esc(p.descr)}</p>
${p.stock?`<div class="row"><button class="full" onclick="addCart(${p.id})">🛒 Add to Cart</button><button class="full" style="background:#2fa36b" onclick="addCart(${p.id},1)">⚡ Buy Now</button></div>`:'<p style="color:#ff7070">Out of stock</p>'}`)}
function addCart(id,buy){const p=PR.find(x=>x.id==id),i=CART.find(x=>x.id==id);if(i){if(i.qty<p.stock)i.qty++}else CART.push({id:p.id,name:p.name,price:p.price,emoji:p.emoji,qty:1});
 localStorage.c=JSON.stringify(CART);paint();if(buy)return checkout();closeM();toast('Added to cart 🛒')}
function openCart(){const t=CART.reduce((a,i)=>a+i.price*i.qty,0);modal(`<h2>🛒 Your Cart</h2>${CART.map((i,k)=>`<div class="ci"><div class="e">${esc(i.emoji)}</div><div><b>${esc(i.name)}</b><div class="mu">${inr(i.price)}</div></div>
<div class="q"><button onclick="qty(${k},-1)">−</button> ${i.qty} <button onclick="qty(${k},1)">+</button></div></div>`).join('')||'<p class="mu">Your cart is empty.</p>'}
<div class="tot">Total: ${inr(t)}</div>${CART.length?'<button class="full" onclick="checkout()">📦 Proceed to Order</button>':''}`)}
function qty(k,d){CART[k].qty+=d;if(CART[k].qty<=0)CART.splice(k,1);localStorage.c=JSON.stringify(CART);paint();openCart()}
function checkout(){if(!need())return;const SL=window.UVLoc&&UVLoc.get();OPIN=SL&&SL.lat!=null?{lat:SL.lat,lng:SL.lng}:null;const t=CART.reduce((a,i)=>a+i.price*i.qty,0);modal(`<h2>📦 Place Your Order</h2><label>Full Name</label><input id="on" value="${esc(ME.name)}"><label>Mobile</label><input id="om" maxlength="10" value="${esc(ME.mobile)}">
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
 s.innerHTML=`<div class="st"><h2>📜 My Orders, Rides & Wallet</h2></div><div class="tw"><table><tr><th>Order</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>${o.orders.map(x=>`<tr><td>${x.ref}<br><span class="mu">${new Date(x.ts).toLocaleDateString()}</span></td><td>${x.items.map(i=>esc(i.name)+' ×'+i.qty).join('<br>')}</td><td>${inr(x.total)}</td><td>${x.pay}</td><td>${stx(x,1)}</td></tr>`).join('')||'<tr><td colspan=5 class="mu">No orders yet</td></tr>'}</table></div><br>
<div class="tw"><table><tr><th>Ride</th><th>Route</th><th>Cab</th><th>Fare</th><th>Status</th></tr>${c.rides.map(x=>`<tr><td>CAB${10000+x.id}</td><td>${esc(x.pickup)} → ${esc(x.dest)}</td><td>${x.type}</td><td>${inr(x.fare)}</td><td>${stx(x,0)}${x.pname?`<br>🚘 ${esc(x.pveh||"")}`:""}</td></tr>`).join('')||'<tr><td colspan=5 class="mu">No rides yet</td></tr>'}</table></div><br>
<div class="tw"><table><tr><th>Wallet history</th><th>Amount</th></tr>${w.tx.map(x=>`<tr><td>${esc(x.note)} <span class="mu">${new Date(x.ts).toLocaleString()}</span></td><td style="color:${x.amt<0?'#ff7070':'#68e0a1'}">${x.amt<0?'−':'+'}${inr(Math.abs(x.amt))}</td></tr>`).join('')}</table></div>`;if(show)go('mine')});

const stx=(x,o)=>`<span class="tag">${x.status}</span>${x.pname?`<br>🧑 ${esc(x.pname)}<br><a style="color:#a895ff" href="tel:${esc(x.pmobile)}">📞 ${esc(x.pmobile)}</a>`:''}${x.delivery_otp?`<br>🔐 Delivery OTP: <b>${esc(x.delivery_otp)}</b>`:''}${o&&/out/i.test(x.status)?`<br><button class="sm" onclick="openTrack(${x.id},'customer')">📍 Track</button>`:''}${o&&!['Delivered','Cancelled'].includes(x.status)?`<br><button class="sm d" onclick="cancelOrder(${x.id})">Cancel</button>`:''}`;
const cancelOrder=wrap(async id=>{if(!confirm('Cancel this order?'))return;await api('/orders/'+id+'/cancel','POST');ME=(await api('/me')).user;paint();loadProducts();loadMine();toast('Order cancelled, refund done if paid by wallet')});
setInterval(()=>{if(ME&&$('#mine').style.display=='block'&&!$('#modal').classList.contains('on'))loadMine()},10000);
boot();
