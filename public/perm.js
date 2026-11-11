/* UniVerse shared start-up permissions + notifications (seller & admin apps) */
(function(){
const LS=localStorage,PL=(window.Capacitor&&Capacitor.Plugins)||{};
async function askNotif(){
  try{
    if(PL.LocalNotifications){const p=await PL.LocalNotifications.checkPermissions();if(p.display==='granted')return true;if(p.display==='denied')return false;return (await PL.LocalNotifications.requestPermissions()).display==='granted'}
    if('Notification' in window){if(Notification.permission==='granted')return true;if(Notification.permission==='denied')return false;return (await Notification.requestPermission())==='granted'}
  }catch(e){}return false}
async function getPos(){
  if(PL.Geolocation){let p=await PL.Geolocation.checkPermissions();if(p.location!=='granted'&&p.coarseLocation!=='granted'){p=await PL.Geolocation.requestPermissions();if(p.location!=='granted'&&p.coarseLocation!=='granted')throw new Error('Location permission denied')}
    const r=await PL.Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:15000});return{lat:r.coords.latitude,lng:r.coords.longitude}}
  return new Promise((ok,no)=>{if(!navigator.geolocation)return no(new Error('GPS not available'));navigator.geolocation.getCurrentPosition(p=>ok({lat:p.coords.latitude,lng:p.coords.longitude}),e=>no(new Error('Location permission denied')),{enableHighAccuracy:true,timeout:15000,maximumAge:60000})})}
async function notify(t,b){
  try{if(navigator.vibrate)navigator.vibrate([250,120,250])}catch(e){}
  try{
    if(PL.LocalNotifications){await PL.LocalNotifications.schedule({notifications:[{id:Math.floor(Date.now()%2147483000),title:t,body:b,schedule:{at:new Date(Date.now()+300)}}]});return}
    if('Notification' in window&&Notification.permission==='granted'){const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r&&r.showNotification){await r.showNotification(t,{body:b,icon:'/pwa-192.png',vibrate:[250,120,250]});return}new Notification(t,{body:b,icon:'/pwa-192.png'});return}
  }catch(e){}
  if(typeof toast==='function')toast('🔔 '+t+' – '+b)}
/* first-run sheet: opts={title,why,loc:bool,onLoc:async(lat,lng)=>label} */
async function first(key,o){
  if(LS['uv_pm_'+key])return;LS['uv_pm_'+key]='1';
  const el=document.createElement('div');el.className='ps-ov sheet';el.style.zIndex=4000;
  el.innerHTML=`<div class="ps-sheet"><div class="ps-sh"><b>${o.title||'Permission required'}</b><button aria-label="Close">×</button></div><p class="ps-pp">${o.why}</p>
  <div class="ps-pr"><span>🔔</span><div><b>Notifications</b><small>${o.notifWhy||'Instant alerts'}</small></div><i id="upn">⚠️</i></div>
  ${o.loc?`<div class="ps-pr"><span>📍</span><div><b>Location</b><small>${o.locWhy||'To set your location'}</small></div><i id="upl">⚠️</i></div>`:''}
  <button class="full big">Allow access</button></div>`;
  document.body.appendChild(el);const close=()=>el.remove();
  el.querySelector('.ps-sh button').onclick=close;el.onclick=e=>{if(e.target===el)close()};
  el.querySelector('.full').onclick=async function(){
    this.disabled=true;this.textContent='Please wait…';
    const n=await askNotif();el.querySelector('#upn').textContent=n?'✅':'⚠️';
    if(o.loc){try{const p=await getPos();el.querySelector('#upl').textContent='✅';if(o.onLoc){const label=await o.onLoc(p.lat,p.lng);if(label)notify('📍 Location set',label)}}catch(e){el.querySelector('#upl').textContent='⚠️';if(typeof toast==='function')toast('Location allow nahi hui. Phone Settings se allow karein.')}}
    setTimeout(close,800)};
}
window.UVP={askNotif,getPos,notify,first};
})();
