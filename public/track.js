/* Universe live tracking map (Leaflet + OpenStreetMap) */
(function(){
let map,mk={},timer,fitted=0;
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say=m=>{if(typeof toast==='function')toast(m);else alert(m)};
function loadLeaflet(cb){
  if(window.L)return cb();
  const c=document.createElement('link');c.rel='stylesheet';
  c.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  document.head.appendChild(c);
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  s.onload=cb;s.onerror=()=>say('Map load nahi hua. Internet check karo.');
  document.head.appendChild(s);
}
const ico=e=>L.divIcon({html:'<div style="font-size:30px;line-height:30px;text-align:center">'+e+'</div>',className:'',iconSize:[30,30],iconAnchor:[15,15]});
function put(k,e,pos,tip){
  if(mk[k])mk[k].setLatLng(pos);
  else mk[k]=L.marker(pos,{icon:ico(e)}).addTo(map).bindTooltip(tip);
}
window.closeTrack=function(){
  clearInterval(timer);
  const b=document.getElementById('trkBox');if(b)b.remove();
  if(map){map.remove();map=null}
  mk={};fitted=0;
};
window.openTrack=function(id,role){
  closeTrack();
  const b=document.createElement('div');b.id='trkBox';
  b.style.cssText='position:fixed;inset:0;z-index:9999;background:#0b0b1a;display:flex;flex-direction:column;color:#fff';
  b.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px"><b>📍 Live Tracking</b><button onclick="closeTrack()" style="background:#222;color:#fff;border:1px solid #444;border-radius:10px;padding:8px 14px">✕ Close</button></div><div id="trkMap" style="flex:1;min-height:0"></div><div id="trkInfo" style="padding:12px 16px;font-size:14px;line-height:1.7"></div>';
  document.body.appendChild(b);
  const info=document.getElementById('trkInfo');
  loadLeaflet(()=>{
    map=L.map('trkMap').setView([22.5,79],5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    setTimeout(()=>map&&map.invalidateSize(),250);
    if(role==='customer'&&navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        p=>api('/orders/'+id+'/pin','POST',{lat:p.coords.latitude,lng:p.coords.longitude}).catch(()=>{}),
        ()=>{},{enableHighAccuracy:true,timeout:15000});
    }
    const tick=async()=>{
      try{
        const d=await api('/orders/'+id+'/track'),pts=[];
        (d.shops||[]).forEach((s,i)=>{put('s'+i,'🏪',[s.lat,s.lng],'Shop');pts.push([s.lat,s.lng])});
        if(d.drop){put('drop','🏠',[d.drop.lat,d.drop.lng],'Delivery location');pts.push([d.drop.lat,d.drop.lng])}
        if(d.partner){put('p','🛵',[d.partner.lat,d.partner.lng],'Delivery partner');pts.push([d.partner.lat,d.partner.lng])}
        if(pts.length&&pts.length!==fitted){map.fitBounds(pts,{padding:[50,50],maxZoom:16});fitted=pts.length}
        let t='Status: <b>'+h(d.status)+'</b><br>';
        if(d.partner){
          const sec=Math.max(0,Math.round((Date.now()-d.partner.ts)/1000));
          t+='🛵 '+h(d.partner.name||'Delivery partner')+' ('+sec+' sec pehle update)';
        }else if(d.assigned){t+='🛵 Partner ka location abhi nahi mil raha (app khuli honi chahiye).'}
        else t+='⏳ Abhi koi delivery partner assign nahi hua.';
        if(!d.drop)t+='<br>🏠 Customer ka drop location abhi set nahi hua.';
        if(!(d.shops||[]).length)t+='<br>🏪 Seller ne shop location set nahi ki.';
        if(role==='partner'){
          const nav=(l,p)=>'<br><a style="color:#a895ff" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination='+p.lat+','+p.lng+'">🧭 '+l+'</a>';
          (d.shops||[]).forEach(s=>{t+=nav('Shop tak route',s)});
          if(d.drop)t+=nav('Customer tak route',d.drop);
        }
        info.innerHTML=t;
      }catch(e){info.textContent=e.message}
    };
    tick();timer=setInterval(tick,5000);
  });
};
window.setShopPin=function(){
  if(!navigator.geolocation)return say('GPS available nahi hai');
  say('Location le rahe hain...');
  navigator.geolocation.getCurrentPosition(async p=>{
    try{await api('/seller/pin','POST',{lat:p.coords.latitude,lng:p.coords.longitude});say('Shop location save ho gayi ✅');window.afterPin&&afterPin()}
    catch(e){say(e.message)}
  },()=>say('Location permission allow karo'),{enableHighAccuracy:true,timeout:20000});
};
})();
