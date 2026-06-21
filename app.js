// ===================== CONFIG =====================
// NOTE: the OpenRouter API key now lives ONLY in Vercel's environment variables and is read
// server-side by /api/ai.js — it is never present in this file, which is public in the browser.
// Free model IDs on OpenRouter get renamed/retired every few months (calling a stale one
// returns 404). 'openrouter/free' is OpenRouter's own auto-router — it always points at
// whichever free model is currently live, so this list doesn't need constant upkeep.
let AI_MODEL = 'openrouter/free';
const AI_MODEL_FALLBACKS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'deepseek/deepseek-r1:free'
];

// ===================== SAFE LOCALSTORAGE =====================
const safeLS = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch(e) { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch(e) {} },
  remove(key) { try { localStorage.removeItem(key); } catch(e) {} }
};

// ===================== STATE =====================
let currentPage = 'dashboard';
let auctionTimers = {};
let chatHistory = [];
let cropGrowth = [];
try { cropGrowth = JSON.parse(safeLS.get('cropGrowth','[]')); } catch(e) {}

// ===================== REGISTERED USERS STORE =====================
// Load registered farmers/buyers from localStorage (persisted across sessions)
function getRegisteredFarmers() {
  try { return JSON.parse(safeLS.get('kio_reg_farmers','[]')); } catch(e) { return []; }
}
function saveRegisteredFarmers(arr) { safeLS.set('kio_reg_farmers', JSON.stringify(arr)); }
function getRegisteredBuyers() {
  try { return JSON.parse(safeLS.get('kio_reg_buyers','[]')); } catch(e) { return []; }
}
function saveRegisteredBuyers(arr) { safeLS.set('kio_reg_buyers', JSON.stringify(arr)); }

// ===================== LANGUAGE =====================
let currentLang = safeLS.get('kio_lang','en');
const L10N = {
  en: {
    nav_platform:'Platform', nav_dashboard:'Dashboard', nav_register:'Registration',
    nav_crop_lib:'Crop Library', nav_ai_quality:'AI Quality Grader', nav_market:'Marketplace',
    nav_farm_intel:'Farm Intelligence', nav_soil:'Soil Analysis', nav_plan:'Crop Planning',
    nav_growth:'Growth Tracking', nav_disease:'Disease Detection', nav_weather:'Weather',
    nav_market_fin:'Market & Finance', nav_price:'Market Intelligence', nav_auction:'Auction System',
    nav_warehouse:'Storage & Logistics', nav_finance:'Finance & Schemes',
    nav_community:'Community', nav_comm:'Community & Experts', nav_admin:'Admin Dashboard',
    dashboard_title:'🌾 KrishiOS — Agricultural Operating System',
    dashboard_sub:'AI-powered platform to maximize farmer profits and eliminate middlemen',
    active_crops:'Active Crops', revenue:'Revenue This Month', active_buyers:'Active Buyers',
    yield_pred:'Yield Prediction', quick_actions:'🚀 Quick Actions',
    grade_crop:'📸 Grade My Crop', sell_now:'🛒 Sell Now', plan_season:'🌾 Plan Season',
    check_disease:'🔬 Check Disease', market_price:'💹 Market Price', find_storage:'🏭 Find Storage',
    notifications:'📢 Notifications', leaderboard:'🏆 Farmer Quality Leaderboard',
    sell_tab:'➕ Sell My Crop', browse_tab:'🔍 Browse Crops',
    list_crop_title:'📸 List Your Crop with Photo', crop_label:'Crop',
    qty_label:'Quantity (Quintal)', price_label:'Asking Price (₹/Qtl)',
    grade_label:'Grade', delivery_label:'Delivery Option', desc_label:'Description',
    photo_label:'Crop Photo', list_btn:'📢 List Crop for Sale', ai_grade_btn:'🤖 AI Grade My Photo',
  },
  hi: {
    nav_platform:'प्लेटफ़ॉर्म', nav_dashboard:'डैशबोर्ड', nav_register:'पंजीकरण',
    nav_crop_lib:'फसल पुस्तकालय', nav_ai_quality:'AI गुणवत्ता जाँच', nav_market:'बाज़ार',
    nav_farm_intel:'खेत बुद्धिमत्ता', nav_soil:'मिट्टी विश्लेषण', nav_plan:'फसल योजना',
    nav_growth:'विकास ट्रैकिंग', nav_disease:'रोग पहचान', nav_weather:'मौसम',
    nav_market_fin:'बाज़ार और वित्त', nav_price:'बाज़ार जानकारी', nav_auction:'नीलामी',
    nav_warehouse:'भंडारण', nav_finance:'वित्त और योजनाएं',
    nav_community:'समुदाय', nav_comm:'समुदाय और विशेषज्ञ', nav_admin:'व्यवस्थापक',
    dashboard_title:'🌾 कृषिOS — कृषि ऑपरेटिंग सिस्टम',
    dashboard_sub:'AI आधारित प्लेटफ़ॉर्म — किसानों का मुनाफ़ा बढ़ाएं',
    active_crops:'सक्रिय फसलें', revenue:'इस महीने की आय', active_buyers:'सक्रिय खरीदार',
    yield_pred:'उपज अनुमान', quick_actions:'🚀 त्वरित कार्य',
    grade_crop:'📸 फसल जाँचें', sell_now:'🛒 अभी बेचें', plan_season:'🌾 मौसम योजना',
    check_disease:'🔬 रोग जाँचें', market_price:'💹 बाज़ार भाव', find_storage:'🏭 भंडारण खोजें',
    notifications:'📢 सूचनाएं', leaderboard:'🏆 किसान गुणवत्ता सूची',
    sell_tab:'➕ फसल बेचें', browse_tab:'🔍 फसलें देखें',
    list_crop_title:'📸 फसल फोटो के साथ लिस्ट करें', crop_label:'फसल',
    qty_label:'मात्रा (क्विंटल)', price_label:'मांग मूल्य (₹/क्विंटल)',
    grade_label:'ग्रेड', delivery_label:'डिलीवरी विकल्प', desc_label:'विवरण',
    photo_label:'फसल की फोटो', list_btn:'📢 फसल बिक्री पर लगाएं', ai_grade_btn:'🤖 AI से ग्रेड जाँचें',
  }
};
function t(key) { return (L10N[currentLang]||L10N.en)[key] || L10N.en[key] || key; }
window.t = t;

// ===================== TOAST =====================
function showToast(msg, type='info') {
  let tc = document.getElementById('toast-container');
  if (!tc) { tc = document.createElement('div'); tc.id='toast-container'; document.body.appendChild(tc); }
  const icons = {success:'✅',error:'❌',info:'ℹ️',warn:'⚠️',deal:'💰',price:'📈'};
  const colors = {success:'var(--green-bright)',error:'var(--red)',info:'var(--sky)',warn:'var(--gold)'};
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.style.borderLeftColor = colors[type]||'var(--sky)';
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span style="flex:1">${msg}</span><button style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:1rem" onclick="this.parentElement.remove()">✕</button>`;
  el.onclick = () => el.remove();
  tc.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(120%)'; setTimeout(()=>el.remove(),400); },4000);
}
window.showToast = showToast;
window.toast = showToast;

// ===================== NOTIFICATIONS =====================
let NOTIF_STORE;
try { NOTIF_STORE = JSON.parse(safeLS.get('kio_notifs','null'))||null; } catch(e){ NOTIF_STORE=null; }
if (!NOTIF_STORE) NOTIF_STORE = [
  {id:1,type:'deal',icon:'💰',title:'New Buyer Offer',body:'FoodCorp offering ₹4,720/qtl for your Soybean',time:Date.now()-300000,read:false,action:'marketplace'},
  {id:2,type:'price',icon:'📈',title:'Price Alert',body:'Turmeric rose to ₹11,200/qtl',time:Date.now()-3600000,read:false,action:'price-intel'},
  {id:3,type:'scheme',icon:'🏛️',title:'PM-KISAN',body:'₹2,000 installment releases in 12 days',time:Date.now()-7200000,read:false,action:'finance'},
  {id:4,type:'weather',icon:'🌧️',title:'Rain Alert',body:'Heavy rain Thursday — postpone harvest',time:Date.now()-86400000,read:true,action:'weather'},
  {id:5,type:'disease',icon:'🔬',title:'Disease Risk',body:'Leaf rust reported in Hingoli district',time:Date.now()-172800000,read:true,action:'disease'},
];
function saveNotifs(){ safeLS.set('kio_notifs', JSON.stringify(NOTIF_STORE)); }
function addNotification(body, type='info', title='KrishiOS', action='dashboard') {
  const icons = {success:'✅',error:'❌',info:'ℹ️',warn:'⚠️',deal:'💰',price:'📈',scheme:'🏛️',weather:'🌧️',disease:'🔬'};
  NOTIF_STORE.unshift({id:Date.now(),type,icon:icons[type]||'🔔',title,body,time:Date.now(),read:false,action});
  if (NOTIF_STORE.length>30) NOTIF_STORE.pop();
  saveNotifs(); updateNotifBadge(); showToast(body, type);
}
window.addNotification = addNotification;
function updateNotifBadge() {
  const unread = NOTIF_STORE.filter(n=>!n.read).length;
  const cnt = document.getElementById('notif-count');
  if (cnt) { cnt.textContent = unread>0?(unread>9?'9+':unread):''; cnt.style.display=unread>0?'flex':'none'; }
}
function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s<60) return 'Just now'; if (s<3600) return Math.floor(s/60)+'m ago';
  if (s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago';
}
window.openNotifications = function() {
  const panel = document.getElementById('notif-panel');
  if (panel.style.display==='block') { panel.style.display='none'; return; }
  const unread = NOTIF_STORE.filter(n=>!n.read).length;
  const tc={deal:'var(--gold)',price:'var(--green-light)',scheme:'var(--sky)',weather:'#fb923c',disease:'var(--red)',success:'var(--green-light)',info:'var(--sky)',warn:'var(--gold)',error:'var(--red)'};
  panel.innerHTML=`
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <span style="font-weight:700;font-size:1rem">🔔 Notifications ${unread>0?`<span style="background:var(--red);color:#fff;border-radius:20px;padding:1px 7px;font-size:0.7rem;margin-left:4px">${unread}</span>`:''}</span>
      <div style="display:flex;gap:6px">
        <button style="background:none;border:none;color:var(--green-light);font-size:0.75rem;cursor:pointer;font-weight:600" onclick="markAllRead()">Mark all read</button>
        <button style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:1.1rem" onclick="document.getElementById('notif-panel').style.display='none'">✕</button>
      </div>
    </div>
    <div id="notif-list-inner" style="max-height:400px;overflow-y:auto">
      ${NOTIF_STORE.map(n=>`
        <div onclick="clickNotif(${n.id})" style="display:flex;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(45,90,62,0.3);cursor:pointer;background:${!n.read?'rgba(64,145,108,0.06)':'transparent'}">
          <div style="width:36px;height:36px;border-radius:50%;background:${tc[n.type]||'#40916c'}22;border:1.5px solid ${tc[n.type]||'#40916c'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${n.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;gap:6px">
              <span style="font-weight:${n.read?500:700};font-size:0.85rem">${n.title}</span>
              <span style="font-size:0.7rem;color:var(--text3);white-space:nowrap">${timeAgo(n.time)}</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text2);margin-top:2px;line-height:1.4">${n.body}</div>
          </div>
          ${!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:var(--green-bright);flex-shrink:0;margin-top:6px"></div>':''}
        </div>`).join('')}
    </div>
    <div style="padding:10px 14px;border-top:1px solid var(--border);text-align:center">
      <button style="background:none;border:none;color:var(--text3);font-size:0.78rem;cursor:pointer" onclick="clearAllNotifs()">🗑️ Clear all</button>
    </div>`;
  panel.style.display='block'; updateNotifBadge();
};
window.markAllRead = function(){ NOTIF_STORE.forEach(n=>n.read=true); saveNotifs(); updateNotifBadge(); openNotifications(); };
window.clearAllNotifs = function(){ NOTIF_STORE.length=0; saveNotifs(); updateNotifBadge(); document.getElementById('notif-panel').style.display='none'; };
window.clickNotif = function(id){ const n=NOTIF_STORE.find(x=>x.id===id); if(!n)return; n.read=true; saveNotifs(); updateNotifBadge(); document.getElementById('notif-panel').style.display='none'; if(n.action)showPage(n.action); };

// ===================== AI CALL =====================
// Calls our own /api/ai serverless function (see api/ai.js) instead of OpenRouter directly —
// this keeps the real API key server-side only, never exposed in this browser-loaded file.
async function callAI(prompt, systemPrompt='') {
  const models = [AI_MODEL, ...AI_MODEL_FALLBACKS.filter(m=>m!==AI_MODEL)];
  let lastErr = '';
  for (const model of models) {
    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt, systemPrompt, model})
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); lastErr=`Error ${res.status}: ${e?.error?.message||res.statusText}`; if(res.status===404||res.status===429)continue; return lastErr; }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch(e) { lastErr=`AI Error: ${e.message}`; }
  }
  return `⚠️ All AI models failed. Last: ${lastErr}`;
}
window.callAI = callAI;

// ===================== NAVIGATION =====================
function showPage(page) {
  currentPage=page; window.currentPage=page;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const titles={dashboard:'Dashboard',register:'Registration','crop-library':'Crop Library','ai-quality':'AI Quality Grader',marketplace:'Direct Marketplace',soil:'Soil Analysis','crop-planning':'Crop Planning','growth-tracking':'Crop Growth Tracking',disease:'Disease Detection',weather:'Weather Intelligence','price-intel':'Market Intelligence',auction:'Auction System',warehouse:'Storage & Logistics',finance:'Finance & Schemes',community:'Community & Experts',admin:'Admin Dashboard'};
  document.getElementById('topbar-title').textContent=titles[page]||page;
  const pages={dashboard:renderDashboard,register:renderRegister,'crop-library':renderCropLibrary,'ai-quality':renderAIQuality,marketplace:renderMarketplace,soil:renderSoil,'crop-planning':renderCropPlanning,'growth-tracking':renderGrowthTracking,disease:renderDisease,weather:renderWeather,'price-intel':renderPriceIntel,auction:renderAuction,warehouse:renderWarehouse,finance:renderFinance,community:renderCommunity,admin:renderAdmin};
  document.getElementById('content').innerHTML='';
  if (pages[page]) pages[page]();
  if (window.innerWidth<900) document.getElementById('sidebar').classList.remove('open');
}
window.showPage=showPage;
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); }
window.toggleSidebar=toggleSidebar;

// ===================== LANG TOGGLE =====================
window.toggleLang = function() {
  currentLang = currentLang==='en'?'hi':'en';
  safeLS.set('kio_lang',currentLang);
  document.querySelectorAll('[data-i18n]').forEach(el=>{const v=t(el.getAttribute('data-i18n'));if(v)el.textContent=v;});
  const lb=document.getElementById('lang-btn'); if(lb)lb.textContent=currentLang==='en'?'हि/En':'En/हि';
  document.body.className=currentLang==='hi'?'lang-hi':'';
  showPage(window.currentPage||'dashboard');
  addNotification(currentLang==='hi'?'भाषा हिंदी में बदली ✅':'Language changed to English ✅','success');
};

// ===================== AUTH =====================
let _confirmResult=null;
try{ window.currentUser=JSON.parse(safeLS.get('kio_user','null')); }catch(e){ window.currentUser=null; }
window.openAuthModal=function(){ document.getElementById('auth-modal').style.display='flex'; };
window.closeAuthModal=function(){ document.getElementById('auth-modal').style.display='none'; };
window.sendOTP=async function(){
  const phone=document.getElementById('auth-phone').value.trim();
  if(phone.length!==10){ showToast('Enter valid 10-digit number','error'); return; }
  if(!window._fbAuth){ demoLogin(); return; }
  try{
    const{RecaptchaVerifier,signInWithPhoneNumber}=window._fbFns;
    if(!window._recap) window._recap=new RecaptchaVerifier(window._fbAuth,'recaptcha-container',{size:'invisible'});
    _confirmResult=await signInWithPhoneNumber(window._fbAuth,'+91'+phone,window._recap);
    document.getElementById('auth-step1').style.display='none';
    document.getElementById('auth-step2').style.display='block';
    document.getElementById('auth-msg').textContent=`✅ OTP sent to +91${phone}`;
  }catch(e){ showToast('OTP failed — using demo login','error'); demoLogin(); }
};
window.verifyOTP=async function(){
  const otp=document.getElementById('auth-otp').value.trim();
  if(!_confirmResult){ showToast('Start over','error'); return; }
  try{ const r=await _confirmResult.confirm(otp); finishLogin({uid:r.user.uid,phone:r.user.phoneNumber,name:'Farmer',role:'farmer'}); }
  catch(e){ showToast('Wrong OTP','error'); }
};
window.demoLogin=function(){
  const name=prompt(currentLang==='hi'?'आपका नाम दर्ज करें:':'Enter your name:')||'Ramesh Patil';
  const role=confirm(currentLang==='hi'?'किसान हैं? OK=किसान':'Are you a Farmer? OK=Farmer')?'farmer':'buyer';
  // Reconnect to an existing registered identity by name (case-insensitive) instead of always
  // minting a fresh random uid — otherwise re-logging-in orphans all of that person's past
  // listings/orders, which were tied to their previous (now-lost) uid.
  const existing=role==='farmer'
    ?getRegisteredFarmers().find(f=>f.name.trim().toLowerCase()===name.trim().toLowerCase())
    :getRegisteredBuyers().find(b=>b.name.trim().toLowerCase()===name.trim().toLowerCase());
  const uid=existing?existing.uid:'demo_'+Date.now();
  finishLogin({uid,name,role,demo:true});
};
window.finishLogin=function(user){
  window.currentUser=user; safeLS.set('kio_user',JSON.stringify(user));
  closeAuthModal(); updateUIForUser(user);
  // Don't re-render page here — let caller decide
};
window.logoutUser=function(){
  if(window._fbAuth&&window._fbFns) window._fbFns.signOut(window._fbAuth).catch(()=>{});
  window.currentUser=null; safeLS.remove('kio_user');
  updateUIForUser(null); showToast('Logged out','info'); showPage('dashboard');
};
window.updateUIForUser=function(user){
  const chip=document.getElementById('topbar-user');
  const mini=document.getElementById('user-profile-mini');
  if(user){
    if(chip) chip.textContent=`${user.role==='farmer'?'👨‍🌾':'🛒'} ${user.name}`;
    if(mini){ mini.style.display='flex'; document.getElementById('sidebar-user-name').textContent=user.name; document.getElementById('sidebar-user-role').textContent=user.role==='farmer'?'🌾 Farmer':'🛒 Buyer'; }
  } else {
    if(chip) chip.textContent='👤 Login';
    if(mini) mini.style.display='none';
  }
};

// ===================== FIREBASE SAVE =====================
// IMPORTANT: many callers already write their record directly into its own kio_<col> key
// (e.g. confirmPurchase writes kio_purchases itself) before also calling this function for the
// optional remote sync. This used to ALSO unshift a second local copy with a freshly generated
// id, silently overwriting data.id and creating a duplicate, ghost entry with a broken/different
// id than the one shown to the user. Now: only fall back to writing locally if the caller hasn't
// already stored this exact record (matched by its own `id`, when it has one) as the most recent
// entry for that key. The remote Firebase sync always runs regardless, using the original data.
window.saveToFirestore=async function(col,data){
  const key=`kio_${col}`; let arr=[];
  try{ arr=JSON.parse(safeLS.get(key,'[]')); }catch(e){}
  // Check the whole array, not just the most recent entry — a single arr[0] check
  // misses cases where the matching record isn't first (e.g. after other writes interleave).
  const alreadySaved = data && data.id!==undefined && arr.some(a=>a.id===data.id);
  if(!alreadySaved){
    arr.unshift(data.id!==undefined?data:{...data,id:Date.now()});
    safeLS.set(key,JSON.stringify(arr.slice(0,50)));
  }
  if(!window._fbDb||!window._fbFns) return;
  try{ const{collection,addDoc}=window._fbFns; await addDoc(collection(window._fbDb,col),{...data,ts:Date.now()}); }catch(e){}
};

// ===================== CHARTS =====================
const chartInstances={};
function destroyChart(id){ if(chartInstances[id]){ chartInstances[id].destroy(); delete chartInstances[id]; } }
window.makeLineChart=function(id,labels,datasets){
  destroyChart(id); const ctx=document.getElementById(id); if(!ctx||typeof Chart==='undefined') return;
  chartInstances[id]=new Chart(ctx,{type:'line',data:{labels,datasets:datasets.map(d=>({tension:0.4,fill:true,borderWidth:2,pointRadius:3,backgroundColor:d.bg||'rgba(64,145,108,0.15)',borderColor:d.color||'#40916c',...d}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#9dbfa8',font:{size:11}}}},scales:{x:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{color:'rgba(45,90,62,0.4)'}},y:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{color:'rgba(45,90,62,0.4)'}}}}});
};
window.makeBarChart=function(id,labels,datasets){
  destroyChart(id); const ctx=document.getElementById(id); if(!ctx||typeof Chart==='undefined') return;
  chartInstances[id]=new Chart(ctx,{type:'bar',data:{labels,datasets:datasets.map(d=>({borderRadius:5,borderWidth:0,backgroundColor:d.colors||'#40916c',...d}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#9dbfa8',font:{size:11}}}},scales:{x:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{display:false}},y:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{color:'rgba(45,90,62,0.4)'}}}}});
};
window.makeDoughnutChart=function(id,labels,data,colors){
  destroyChart(id); const ctx=document.getElementById(id); if(!ctx||typeof Chart==='undefined') return;
  chartInstances[id]=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:'#1c3a28'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#9dbfa8',font:{size:11},padding:12}}}}});
};

// ===================== TAB HELPERS =====================
function switchTab(btn,tabId){
  btn.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  let el=btn.closest('.tabs').nextElementSibling;
  while(el){ if(el.tagName==='DIV'&&el.id){ el.style.display=el.id===tabId?'block':'none'; } el=el.nextElementSibling; }
}
function switchRegTab(btn,tabId){
  // Guard: a logged-in user shouldn't switch to the opposite role's registration tab —
  // doing so previously let a buyer submit a farmer profile (or vice versa) under the same uid.
  const user=window.currentUser;
  if(user&&tabId==='buyer-tab'&&user.role==='farmer'){ showToast('You are logged in as a Farmer. Log out to register as a Buyer.','warn'); return; }
  if(user&&tabId==='farmer-tab'&&user.role==='buyer'){ showToast('You are logged in as a Buyer. Log out to register as a Farmer.','warn'); return; }
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  ['farmer-tab','buyer-tab'].forEach(id=>document.getElementById(id).style.display=id===tabId?'block':'none');
}
window.switchTab=switchTab; window.switchRegTab=switchRegTab;

// ===================== WHATSAPP =====================
window.contactSellerWA=function(name,crop,price){ window.open(`https://wa.me/?text=${encodeURIComponent(`🌾 KrishiOS Enquiry\nHello ${name},\nI want to buy your ${crop} at ₹${price}/qtl.\n_via KrishiOS_`)}`,'_blank'); };
window.contactBuyerWA=function(name,offer){ window.open(`https://wa.me/?text=${encodeURIComponent(`🌾 KrishiOS\nHello ${name},\nI saw your ${offer} offer.\n_via KrishiOS_`)}`,'_blank'); };
window.shareOnWhatsApp=function(type){ const msg=type==='price'?`*🌾 KrishiOS Live Prices*\n${MARKET_PRICES.map(m=>`• ${m.crop}: ₹${m.price.toLocaleString()}/qtl`).join('\n')}`:''; if(msg)window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank'); };
window.connectBuyer=name=>addNotification(`Connection request sent to ${name}!`,'success','🤝 Connected');
window.expressInterest=(buyer,crop)=>addNotification(`Interest sent to ${buyer} for ${crop}!`,'deal','📦 Bulk Interest');

// ===================== BUY FLOW (farmer-confirmation required) =====================
window.initiatePayment=function(crop,amount,farmerName,qty,price,farmerId){
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(!user){ openAuthModal(); showToast('Please login to purchase','warn'); return; }
  if(user.role==='farmer'){ showToast('Farmers cannot buy — please register as a Buyer','warn'); return; }

  // Show purchase confirmation modal
  const overlay=document.createElement('div');
  overlay.id='order-request-modal';
  overlay.style='position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML=`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px;max-width:420px;width:100%">
      <h2 style="font-family:var(--font-display);margin-bottom:16px">📨 Send Order Request</h2>
      <div style="background:var(--bg3);border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Crop</span><span class="fw-bold">${crop}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Seller</span><span>${farmerName}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Quantity</span><span>${qty} Qtl</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Price</span><span class="text-gold fw-bold">₹${price}/qtl</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:var(--text3)">Total Amount</span><span style="font-size:1.2rem;font-weight:800;color:var(--gold)">₹${amount.toLocaleString()}</span></div>
      </div>
      <div class="form-group">
        <label class="form-label">Preferred Payment Method</label>
        <select class="form-select" id="pay-method">
          <option value="upi">UPI (Google Pay / PhonePe / Paytm)</option>
          <option value="bank">Bank Transfer (NEFT/RTGS)</option>
          <option value="cash">Cash on Delivery</option>
          <option value="kcc">Kisan Credit Card</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Delivery Preference</label>
        <select class="form-select" id="pay-delivery">
          <option>Farm Pickup (I will collect)</option>
          <option>Seller delivers to my location</option>
          <option>Nearest Mandi handover</option>
        </select>
      </div>
      <div class="notif notif-info" style="margin-bottom:4px">ℹ️ This sends a request to <strong>${farmerName}</strong>. You'll be asked to pay only after they confirm the order.</div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-primary" style="flex:1" id="send-order-btn">📨 Send Order Request</button>
        <button class="btn btn-outline" id="cancel-order-btn">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.remove(); });

  // Bind handlers via addEventListener rather than inline onclick="" attribute strings —
  // avoids any risk of the dynamic crop/farmerName/farmerId values breaking attribute parsing,
  // and is more reliable across browsers than relying on the legacy inline-handler model.
  const sendBtn=document.getElementById('send-order-btn');
  if(sendBtn) sendBtn.addEventListener('click', function(){
    this.disabled=true; this.textContent='Sending...';
    confirmPurchase(crop, farmerName, amount, qty, price, farmerId||null);
  });
  const cancelBtn=document.getElementById('cancel-order-btn');
  if(cancelBtn) cancelBtn.addEventListener('click', ()=>overlay.remove());
};


// Buyer sends a request -> order sits as "Pending Farmer Confirmation".
// Farmer must confirm before buyer is asked to pay.
window.confirmPurchase=function(crop,farmerName,amount,qty,price,knownFarmerId){
  try{
    confirmPurchaseInner(crop,farmerName,amount,qty,price,knownFarmerId);
  }catch(err){
    // Surface the real error instead of leaving the button stuck on "Sending..." forever.
    console.error('confirmPurchase failed:', err);
    const btn=document.getElementById('send-order-btn');
    if(btn){ btn.disabled=false; btn.textContent='📨 Send Order Request'; }
    showToast('Something went wrong sending the request: '+(err&&err.message?err.message:'unknown error'),'error');
  }
};

// Safely turn any order id (string 'ORD-169...' or a legacy/corrupted numeric id left over
// from older data) into a millisecond timestamp for the recent-duplicate check below.
// Numbers don't have .replace — calling it directly on a non-string id threw
// "(p.id || "").replace is not a function" and aborted the whole request before it was ever sent.
function orderIdToTimestamp(id){
  const idStr = typeof id === 'string' ? id : String(id==null?'':id);
  const digits = idStr.replace('ORD-','');
  const ts = parseInt(digits, 10);
  return isNaN(ts) ? null : ts;
}

function confirmPurchaseInner(crop,farmerName,amount,qty,price,knownFarmerId){
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(!user){
    // Session wasn't readable at submit time (e.g. cleared between opening the modal and
    // clicking send) — this previously failed silently because user.uid was used below
    // without a check, throwing and leaving the button stuck on "Sending...".
    document.getElementById('send-order-btn')?.removeAttribute('disabled');
    const btn=document.getElementById('send-order-btn'); if(btn) btn.textContent='📨 Send Order Request';
    showToast('Your session expired. Please log in again and retry.','error');
    openAuthModal();
    return;
  }
  const payMethod=document.getElementById('pay-method')?.value||'upi';
  const delivery=document.getElementById('pay-delivery')?.value||'Farm Pickup';

  // Guard against duplicate submissions (double-click, slow render, accidental re-tap):
  // if an identical pending request from this buyer to this farmer for this exact
  // crop/qty/price was created in the last 10 seconds, don't create a second one.
  let existingPurchases=[]; try{ existingPurchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  const dupe=existingPurchases.find(p=>{
    const ts=orderIdToTimestamp(p.id);
    return p.buyerId===user.uid && p.farmerName===farmerName && p.crop===crop &&
      p.qty==qty && p.price==price && p.amount===amount &&
      p.status==='Pending Farmer Confirmation' && ts!==null && (Date.now()-ts)<10000;
  });
  if(dupe){
    document.getElementById('order-request-modal')?.remove();
    showToast('This order request was already sent.','info');
    return;
  }

  // Resolve the farmer's uid: prefer the id carried by the actual listing (most reliable),
  // fall back to matching against registered farmers by name (covers static/demo listings
  // when the seller happens to also be registered locally on this device).
  let resolvedFarmerId=knownFarmerId||null;
  if(!resolvedFarmerId){
    const regFarmers=getRegisteredFarmers();
    const matched=regFarmers.find(f=>f.name===farmerName);
    resolvedFarmerId=matched?matched.uid:null;
  }

  // Save order record — starts in "Pending" state, NOT confirmed/paid yet
  const order={
    id:'ORD-'+Date.now(),
    crop, farmerName, amount, qty, price,
    farmerId:resolvedFarmerId,
    buyer:user.name, buyerId:user.uid,
    payMethod, delivery,
    status:'Pending Farmer Confirmation',
    date:new Date().toLocaleDateString('en-IN'),
    time:new Date().toLocaleTimeString('en-IN')
  };
  let purchases=[]; try{ purchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  purchases.unshift(order); safeLS.set('kio_purchases',JSON.stringify(purchases.slice(0,50)));
  saveToFirestore('purchases',order);

  // Close modal
  document.getElementById('order-request-modal')?.remove();

  // Show "request sent" confirmation to the buyer (NOT a payment success screen)
  const sentOverlay=document.createElement('div');
  sentOverlay.style='position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  sentOverlay.innerHTML=`
    <div style="background:var(--card);border:1px solid var(--sky);border-radius:14px;padding:32px;max-width:400px;width:100%;text-align:center">
      <div style="font-size:4rem;margin-bottom:12px">📨</div>
      <h2 style="font-family:var(--font-display);color:var(--sky);margin-bottom:8px">Order Request Sent!</h2>
      <p style="color:var(--text2);margin-bottom:16px">Order ID: <strong class="text-gold">${order.id}</strong></p>
      <div style="background:var(--bg3);border-radius:10px;padding:14px;margin-bottom:16px;text-align:left">
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--text3)">Crop</span><span>${crop} (${qty} Qtl)</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--text3)">Seller</span><span>${farmerName}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border);margin-top:6px"><span style="color:var(--text3)">Total</span><span class="text-gold fw-bold" style="font-size:1.1rem">₹${amount.toLocaleString()}</span></div>
      </div>
      <div class="notif notif-warn" style="text-align:left;margin-bottom:16px">⏳ Waiting for <strong>${farmerName}</strong> to confirm this order. You'll be notified to complete payment once they accept.</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1" onclick="this.closest('[style*=fixed]').remove()">Done</button>
        <button class="wa-btn" style="flex:1;justify-content:center" onclick="window.open('https://wa.me/?text=${encodeURIComponent(`🌾 KrishiOS Order Request\nOrder: ${order.id}\nCrop: ${crop} (${qty} Qtl)\nSeller: ${farmerName}\nAmount: ₹${amount.toLocaleString()}\n_via KrishiOS_`)}','_blank')">💬 WhatsApp</button>
      </div>
    </div>`;
  document.body.appendChild(sentOverlay);

  // Notify the buyer that the request is pending (not a payment confirmation)
  addNotification(`Order request sent for ${crop}! Waiting for ${farmerName} to confirm. Order ${order.id}.`,'info','📨 Request Sent','marketplace');

  // Notify the farmer (if they're resolvable to a real account on this device) that a new order needs confirmation
  if(resolvedFarmerId){
    addNotification(`New order request: ${qty} Qtl ${crop} from ${user.name} for ₹${amount.toLocaleString()}. Please confirm in Registration → My Orders.`,'deal','🔔 Confirm Order','register');
  }
}

// Farmer confirms the order — only NOW is the buyer asked to pay
window.farmerConfirmOrder=function(orderId){
  let purchases=[]; try{ purchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  const order=purchases.find(p=>p.id===orderId);
  if(!order){ showToast('Order not found','error'); return; }
  order.status='Confirmed — Awaiting Payment';
  order.confirmedAt=new Date().toISOString();
  safeLS.set('kio_purchases',JSON.stringify(purchases));
  saveToFirestore('order_confirmations',{orderId,status:order.status});

  addNotification(`You confirmed the order for ${order.qty} Qtl ${order.crop}. ${order.buyer} has been notified to complete payment.`,'success','✅ Order Confirmed','register');

  // Refresh the farmer's order list if currently visible
  const area=document.getElementById('farmer-orders-area');
  if(area) area.innerHTML=renderFarmerOrders(window.currentUser?.uid);

  showToast('Order confirmed! Buyer notified to pay.','success');
};

// Farmer declines the order
window.farmerDeclineOrder=function(orderId){
  let purchases=[]; try{ purchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  const order=purchases.find(p=>p.id===orderId);
  if(!order){ showToast('Order not found','error'); return; }
  order.status='Declined by Farmer';
  safeLS.set('kio_purchases',JSON.stringify(purchases));
  addNotification(`Order ${orderId} declined.`,'warn','❌ Order Declined','register');
  const area=document.getElementById('farmer-orders-area');
  if(area) area.innerHTML=renderFarmerOrders(window.currentUser?.uid);
  showToast('Order declined','info');
};

// Buyer completes payment — only allowed once farmer has confirmed
window.initiateBuyerPayment=function(orderId){
  let purchases=[]; try{ purchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  const order=purchases.find(p=>p.id===orderId);
  if(!order){ showToast('Order not found','error'); return; }
  if(order.status!=='Confirmed — Awaiting Payment' && order.status!=='Paid'){
    showToast('This order is not yet confirmed by the farmer.','warn'); return;
  }
  if(order.status==='Paid'){ showToast('This order is already paid.','info'); return; }

  const overlay=document.createElement('div');
  overlay.id='payment-modal';
  overlay.style='position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML=`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px;max-width:420px;width:100%">
      <h2 style="font-family:var(--font-display);margin-bottom:16px">💳 Complete Payment</h2>
      <div class="notif notif-success" style="margin-bottom:16px">✅ ${order.farmerName} has confirmed this order. Please complete payment.</div>
      <div style="background:var(--bg3);border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Crop</span><span class="fw-bold">${order.crop}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Seller</span><span>${order.farmerName}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Quantity</span><span>${order.qty} Qtl</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:var(--text3)">Total Amount</span><span style="font-size:1.2rem;font-weight:800;color:var(--gold)">₹${order.amount.toLocaleString()}</span></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-primary" style="flex:1" onclick="finalizeBuyerPayment('${orderId}')">✅ Pay ₹${order.amount.toLocaleString()}</button>
        <button class="btn btn-outline" onclick="this.closest('[style*=fixed]').remove()">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.remove(); });
};

window.finalizeBuyerPayment=function(orderId){
  let purchases=[]; try{ purchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  const order=purchases.find(p=>p.id===orderId);
  if(!order) return;
  order.status='Paid';
  order.paidAt=new Date().toISOString();
  safeLS.set('kio_purchases',JSON.stringify(purchases));
  saveToFirestore('payments',{orderId,amount:order.amount});

  document.getElementById('payment-modal')?.remove();

  const successOverlay=document.createElement('div');
  successOverlay.style='position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  successOverlay.innerHTML=`
    <div style="background:var(--card);border:1px solid var(--green-bright);border-radius:14px;padding:32px;max-width:400px;width:100%;text-align:center">
      <div style="font-size:4rem;margin-bottom:12px">✅</div>
      <h2 style="font-family:var(--font-display);color:var(--green-light);margin-bottom:8px">Payment Complete!</h2>
      <p style="color:var(--text2);margin-bottom:16px">Order ID: <strong class="text-gold">${order.id}</strong></p>
      <p style="font-size:0.82rem;color:var(--text3);margin-bottom:16px">${order.farmerName} has been notified. They will arrange ${order.delivery.toLowerCase()}.</p>
      <button class="btn btn-primary" style="width:100%" onclick="this.closest('[style*=fixed]').remove()">Done</button>
    </div>`;
  document.body.appendChild(successOverlay);

  addNotification(`Payment of ₹${order.amount.toLocaleString()} received for order ${order.id}!`,'deal','💰 Payment Received','register');
  const area=document.getElementById('my-purchases-area');
  if(area) area.innerHTML=renderMyPurchases(window.currentUser?.uid);
};

// ===================== DASHBOARD =====================
function renderDashboard(){
  const user=window.currentUser;
  const regFarmers=getRegisteredFarmers();
  const regBuyers=getRegisteredBuyers();
  const myListings=user?JSON.parse(safeLS.get('kio_listings','[]')).filter(l=>l.farmerId===user.uid):[];
  const myPurchases=user?JSON.parse(safeLS.get('kio_purchases','[]')).filter(p=>p.buyerId===user.uid):[];

  // Pending order confirmations for a logged-in farmer — surfaced right on the dashboard
  let pendingForFarmer=[];
  if(user&&user.role==='farmer'){
    renderFarmerOrders(user.uid); // side-effect: heals any stale farmerId on past orders by name-match
    let allPurchases=[]; try{ allPurchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
    pendingForFarmer=allPurchases.filter(p=>p.farmerId===user.uid&&p.status==='Pending Farmer Confirmation');
  }

  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>${t('dashboard_title')}</h1><p>${t('dashboard_sub')}</p></div>
  ${pendingForFarmer.length>0?`
  <div class="card section-gap" style="border-color:var(--gold)">
    <div class="card-title">🔔 Orders Awaiting Your Confirmation (${pendingForFarmer.length})</div>
    ${pendingForFarmer.map(o=>`
      <div style="display:flex;align-items:center;gap:14px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <div class="fw-bold">${o.crop} — ${o.qty} Qtl</div>
          <div class="text-sm">Buyer: ${o.buyer} · ₹${o.amount.toLocaleString()} total</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="farmerConfirmOrder('${o.id}')">✅ Confirm</button>
        <button class="btn btn-outline btn-sm" style="border-color:var(--red);color:var(--red)" onclick="farmerDeclineOrder('${o.id}')">✕ Decline</button>
      </div>`).join('')}
  </div>`:''}
  <div class="grid-4 section-gap">
    <div class="stat-card green"><div class="stat-icon">🌾</div><div class="stat-label">${t('active_crops')}</div><div class="stat-val">${myListings.length||4}</div><div class="stat-sub">${currentLang==='hi'?'2 कटाई के करीब':'2 near harvest'}</div></div>
    <div class="stat-card gold"><div class="stat-icon">💰</div><div class="stat-label">${t('revenue')}</div><div class="stat-val">₹1.42L</div><div class="stat-sub">↑ 18%</div></div>
    <div class="stat-card sky"><div class="stat-icon">🛒</div><div class="stat-label">${t('active_buyers')}</div><div class="stat-val">${regBuyers.length+23}</div><div class="stat-sub">${currentLang==='hi'?'8 जवाब का इंतज़ार':'8 awaiting reply'}</div></div>
    <div class="stat-card purple"><div class="stat-icon">📊</div><div class="stat-label">${t('yield_pred')}</div><div class="stat-val">92%</div><div class="stat-sub">${currentLang==='hi'?'सोयाबीन 18 दिन में':'Soybean in 18 days'}</div></div>
  </div>
  <div class="card section-gap">
    <div class="card-title">📡 Live Price Ticker</div>
    <div style="overflow:hidden;padding:8px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
      <span id="ticker-inner" style="display:inline-block;animation:ticker 32s linear infinite;font-size:0.85rem;white-space:nowrap"></span>
    </div>
  </div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">📈 Monthly Revenue</div><div class="chart-wrap"><canvas id="rev-chart"></canvas></div></div>
    <div class="card"><div class="card-title">🥧 Crop Mix</div><div class="chart-wrap"><canvas id="crop-mix-chart"></canvas></div></div>
  </div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">💹 Price Trends</div><div class="chart-wrap"><canvas id="price-trend-chart"></canvas></div></div>
    <div class="card">
      <div class="card-title">🌤️ Today's Weather</div>
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:14px">
        <div style="font-size:3rem">⛅</div>
        <div><div style="font-size:2rem;font-weight:800;font-family:var(--font-display)">32°C</div><div style="color:var(--text2);font-size:0.85rem">Partly Cloudy · Humidity 68%</div></div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="showPage('weather')">Forecast →</button>
      </div>
      <div class="notif notif-warn">⚠️ ${WEATHER.advisory}</div>
      <hr class="divider"/>
      <div class="card-title">🔔 Price Alerts</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${MARKET_PRICES.slice(0,4).map(m=>`<div class="alert-chip" onclick="showPage('price-intel')"><span>${m.crop}</span><span class="${m.trend==='up'?'text-green':'text-red'}" style="font-weight:700">₹${m.price.toLocaleString()}</span><span style="font-size:0.7rem">${m.trend==='up'?'↑':'↓'}${Math.abs(m.change)}</span></div>`).join('')}
      </div>
    </div>
  </div>
  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">${t('leaderboard')}</div>
      ${[...FARMERS,...getRegisteredFarmers().slice(0,2)].slice(0,5).map((f,i)=>`<div class="rank-row"><div class="rank-num rank-${i+1}">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]||i+1}</div><div class="rank-info"><div class="rank-name">${f.name}</div><div class="rank-sub">${(f.crops||[f.crop]).join?.(', ')||f.crop||'—'} · ${f.village||f.district||'—'}</div></div><div style="text-align:right"><span class="badge badge-${f.badge==='Premium'?'gold':'sky'}">${f.badge||'Verified'}</span><div style="font-size:0.8rem;color:var(--text3);margin-top:3px">⭐ ${f.rating||'4.5'}</div></div></div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">${t('quick_actions')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${[[t('grade_crop'),'ai-quality'],[t('sell_now'),'marketplace'],[t('plan_season'),'crop-planning'],[t('check_disease'),'disease'],[t('market_price'),'price-intel'],[t('find_storage'),'warehouse']].map(([tt,p])=>`<button class="btn btn-outline" onclick="showPage('${p}')">${tt}</button>`).join('')}
      </div>
      <hr class="divider"/>
      <div class="card-title">${t('notifications')}</div>
      <div class="notif notif-success">✅ ${currentLang==='hi'?'सोयाबीन ग्रेड A — ₹4,720/qtl खरीदार मिला!':'Soybean Grade A — ₹4,720/qtl buyer found!'}</div>
      <div class="notif notif-warn">⚠️ ${currentLang==='hi'?'कपास की कीमत 8% गिर सकती है':'Cotton price may drop 8% next week'}</div>
      <div class="notif notif-info">ℹ️ ${currentLang==='hi'?'PM-KISAN 12 दिन में आएगी':'PM-KISAN releases in 12 days'}</div>
    </div>
  </div>`;
  const ti=document.getElementById('ticker-inner');
  if(ti){ const txt=MARKET_PRICES.map(m=>`${m.crop}: ₹${m.price.toLocaleString()}/qtl ${m.trend==='up'?'↑':'↓'}${Math.abs(m.change)}   ·   `).join(''); ti.textContent=txt+txt; }
  setTimeout(()=>{
    if(typeof Chart==='undefined') return;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const rev=[82,91,78,110,95,125,142,138,160,145,175,142];
    makeBarChart('rev-chart',months,[{label:'Revenue ₹K',data:rev,colors:rev.map((_,i)=>i===11?'#f4a228':'#40916c')}]);
    makeDoughnutChart('crop-mix-chart',['Soybean','Cotton','Wheat','Onion'],[40,25,20,15],['#40916c','#f4a228','#0ea5e9','#8b5cf6']);
    makeLineChart('price-trend-chart',['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],[{label:'Soybean',data:[3800,4000,4200,4400,4600,4700,4650,4620],color:'#40916c',bg:'rgba(64,145,108,0.1)'},{label:'Wheat',data:[1900,2100,2050,2200,2275,2300,2400,2350],color:'#f4a228',bg:'rgba(244,162,40,0.1)'}]);
  },80);
}

// ===================== REGISTRATION (fixed) =====================
function renderRegister(){
  const c=document.getElementById('content');
  // Check if already registered — show their section
  const user=window.currentUser;
  const myFarmer=user&&user.role==='farmer'?getRegisteredFarmers().find(f=>f.uid===user.uid):null;
  const myBuyer=user&&user.role==='buyer'?getRegisteredBuyers().find(b=>b.uid===user.uid):null;

  c.innerHTML=`
  <div class="page-header"><h1>👤 ${currentLang==='hi'?'पंजीकरण':'Registration'}</h1><p>${currentLang==='hi'?'किसान या खरीदार के रूप में जुड़ें':'Join KrishiOS as a Farmer or Buyer'}</p></div>

  ${user?`<div class="notif notif-success" style="margin-bottom:20px">✅ Logged in as <strong>${user.name}</strong> (${user.role==='farmer'?'🌾 Farmer':'🛒 Buyer'})</div>`:''}

  <div class="tabs">
    <button class="tab ${!user||user.role==='farmer'?'active':''}" onclick="switchRegTab(this,'farmer-tab')">🌾 Farmer Registration</button>
    <button class="tab ${user&&user.role==='buyer'?'active':''}" onclick="switchRegTab(this,'buyer-tab')">🛒 Buyer Registration</button>
  </div>

  <div id="farmer-tab" style="${user&&user.role==='buyer'?'display:none':''}">
    ${user&&user.role==='farmer'?`
    <!-- MY ORDERS — always visible to any logged-in farmer, registered or not -->
    <div class="card section-gap" style="border-color:var(--gold)">
      <div class="card-title">📦 My Orders <span style="font-size:0.75rem;color:var(--text3);font-weight:400">— confirm before buyers are asked to pay</span></div>
      <div id="farmer-orders-area">${renderFarmerOrders(user.uid)}</div>
    </div>`:''}
    ${myFarmer?`
    <!-- FARMER PROFILE SECTION -->
    <div class="card section-gap" style="border-color:var(--green-bright)">
      <div class="flex-between mb-16">
        <div class="card-title" style="margin:0">🌾 Your Farmer Profile</div>
        <span class="badge badge-green">✅ Registered</span>
      </div>
      <div class="two-col">
        <div>
          ${[['Full Name',myFarmer.name],['Mobile',myFarmer.mobile||'—'],['Village',myFarmer.village||'—'],['District',myFarmer.district||'—'],['State',myFarmer.state||'—']].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3);font-size:0.82rem">${k}</span><span style="font-size:0.85rem;font-weight:600">${v}</span></div>`).join('')}
        </div>
        <div>
          ${[['Land Area',myFarmer.land+' Acres'],['Primary Crop',myFarmer.crop||'—'],['Bank Account',myFarmer.bank?'****'+myFarmer.bank.slice(-4):'—'],['IFSC',myFarmer.ifsc||'—'],['Member Since',myFarmer.date||'—']].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3);font-size:0.82rem">${k}</span><span style="font-size:0.85rem;font-weight:600">${v}</span></div>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-primary" onclick="showPage('marketplace')">🛒 Go to Marketplace to Sell</button>
        <button class="btn btn-outline" onclick="showPage('crop-planning')">📋 Plan My Crops</button>
      </div>
    </div>
    <!-- ALL REGISTERED FARMERS TABLE -->
    <div class="card">
      <div class="card-title">👨‍🌾 All Registered Farmers (${FARMERS.length + getRegisteredFarmers().length})</div>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Village</th><th>State</th><th>Land</th><th>Crop</th><th>Badge</th></tr></thead><tbody>
        ${[...FARMERS,...getRegisteredFarmers()].map(f=>`<tr${f.uid===user?.uid?' style="background:rgba(64,145,108,0.1)"':''}><td><div class="fw-bold">${f.name}${f.uid===user?.uid?' <span class="badge badge-green" style="font-size:0.65rem">You</span>':''}</div><div class="text-sm">${f.village||f.district||'—'}</div></td><td>${f.state||'—'}</td><td>${f.land||'—'} ac</td><td style="font-size:0.82rem">${(f.crops||[f.crop]).join?.(', ')||f.crop||'—'}</td><td><span class="badge badge-${f.badge==='Premium'?'gold':'sky'}">${f.badge||'Verified'}</span></td></tr>`).join('')}
      </tbody></table></div>
    </div>`:`
    <!-- FARMER REGISTRATION FORM -->
    <div class="notif notif-info section-gap">💡 You can confirm buyer order requests above even before completing registration — but registering adds your bank details and profile for faster payouts.</div>
    <div class="two-col">
      <div class="card"><div class="card-title">Farmer Details</div>
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" id="f-name" placeholder="Ramesh Patil" value="${user?.name||''}"/></div>
        <div class="form-group"><label class="form-label">Mobile Number</label><input class="form-input" id="f-mobile" placeholder="9876543210"/></div>
        <div class="form-group"><label class="form-label">Village</label><input class="form-input" id="f-village" placeholder="Hingoli"/></div>
        <div class="form-group"><label class="form-label">District</label><input class="form-input" id="f-district" placeholder="Hingoli"/></div>
        <div class="form-group"><label class="form-label">State</label><select class="form-select" id="f-state"><option>Maharashtra</option><option>Punjab</option><option>Haryana</option><option>Uttar Pradesh</option><option>Madhya Pradesh</option><option>Gujarat</option><option>Andhra Pradesh</option><option>Karnataka</option><option>Tamil Nadu</option><option>Rajasthan</option><option>Telangana</option></select></div>
      </div>
      <div class="card"><div class="card-title">Farm & Crop Details</div>
        <div class="form-group"><label class="form-label">Land Area (Acres) *</label><input class="form-input" id="f-land" placeholder="5.2"/></div>
        <div class="form-group"><label class="form-label">Primary Crop *</label><select class="form-select" id="f-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Aadhar Number</label><input class="form-input" id="f-aadhar" placeholder="XXXX-XXXX-XXXX"/></div>
        <div class="form-group"><label class="form-label">Bank Account</label><input class="form-input" id="f-bank" placeholder="Account number"/></div>
        <div class="form-group"><label class="form-label">IFSC Code</label><input class="form-input" id="f-ifsc" placeholder="SBIN0001234"/></div>
        <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="registerFarmer()">✅ Register as Farmer</button>
      </div>
    </div>`}
  </div>

  <div id="buyer-tab" style="${user&&user.role==='buyer'?'':'display:none'}">
    ${myBuyer?`
    <!-- BUYER PROFILE SECTION -->
    <div class="card section-gap" style="border-color:var(--gold)">
      <div class="flex-between mb-16">
        <div class="card-title" style="margin:0">🛒 Your Buyer Profile</div>
        <span class="badge badge-gold">✅ Registered</span>
      </div>
      <div class="two-col">
        <div>
          ${[['Company / Name',myBuyer.name],['Mobile',myBuyer.mobile||'—'],['Business Type',myBuyer.businessType||'—'],['GSTIN',myBuyer.gst||'—'],['Member Since',myBuyer.date||'—']].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3);font-size:0.82rem">${k}</span><span style="font-size:0.85rem;font-weight:600">${v}</span></div>`).join('')}
        </div>
        <div>
          ${[['Crops Interested',myBuyer.crops||'—'],['Monthly Volume',myBuyer.volume?myBuyer.volume+' Qtl':'—'],['Preferred States',myBuyer.states||'—'],['Payment Terms',myBuyer.paymentTerms||'—']].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3);font-size:0.82rem">${k}</span><span style="font-size:0.85rem;font-weight:600">${v}</span></div>`).join('')}
        </div>
      </div>
      <div style="margin-top:16px">
        <div class="card-title">📦 My Purchase History <span style="font-size:0.75rem;color:var(--text3);font-weight:400">— pay only after the farmer confirms</span></div>
        <div id="my-purchases-area">${renderMyPurchases(user.uid)}</div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-primary" onclick="showPage('marketplace')">🛒 Browse Crops to Buy</button>
        <button class="btn btn-outline" onclick="showPage('auction')">🔨 Go to Auction</button>
      </div>
    </div>
    <!-- ALL REGISTERED BUYERS TABLE -->
    <div class="card">
      <div class="card-title">🛒 All Registered Buyers (${getRegisteredBuyers().length})</div>
      <div class="table-wrap"><table><thead><tr><th>Company/Name</th><th>Type</th><th>Crops</th><th>Volume</th><th>States</th><th>Payment</th></tr></thead><tbody>
        ${getRegisteredBuyers().map(b=>`<tr${b.uid===user?.uid?' style="background:rgba(244,162,40,0.08)"':''}><td><div class="fw-bold">${b.name}${b.uid===user?.uid?' <span class="badge badge-gold" style="font-size:0.65rem">You</span>':''}</div></td><td>${b.businessType||'—'}</td><td style="font-size:0.82rem">${b.crops||'—'}</td><td>${b.volume?b.volume+' Qtl':'—'}</td><td style="font-size:0.82rem">${b.states||'—'}</td><td style="font-size:0.82rem">${b.paymentTerms||'—'}</td></tr>`).join('')}
        ${getRegisteredBuyers().length===0?'<tr><td colspan="6" style="text-align:center;color:var(--text3)">No buyers registered yet</td></tr>':''}
      </tbody></table></div>
    </div>`:`
    <!-- BUYER REGISTRATION FORM -->
    <div class="two-col">
      <div class="card"><div class="card-title">Buyer Details</div>
        <div class="form-group"><label class="form-label">Company / Name *</label><input class="form-input" id="b-name" placeholder="Agro Traders Ltd." value="${user?.name||''}"/></div>
        <div class="form-group"><label class="form-label">Mobile</label><input class="form-input" id="b-mobile" placeholder="9876543210"/></div>
        <div class="form-group"><label class="form-label">Business Type</label><select class="form-select" id="b-type"><option>Trader</option><option>Processor</option><option>Exporter</option><option>Retailer</option><option>Wholesaler</option><option>FPO</option></select></div>
        <div class="form-group"><label class="form-label">GSTIN</label><input class="form-input" id="b-gst" placeholder="22AAAAA0000A1Z5"/></div>
      </div>
      <div class="card"><div class="card-title">Procurement Details</div>
        <div class="form-group"><label class="form-label">Crops Interested In</label><input class="form-input" id="b-crops" placeholder="Wheat, Soybean, Onion"/></div>
        <div class="form-group"><label class="form-label">Monthly Volume (Quintal)</label><input class="form-input" id="b-volume" placeholder="500"/></div>
        <div class="form-group"><label class="form-label">Preferred States</label><input class="form-input" id="b-states" placeholder="Maharashtra, MP, Punjab"/></div>
        <div class="form-group"><label class="form-label">Payment Terms</label><select class="form-select" id="b-payment"><option>Advance (100%)</option><option>50% Advance</option><option>7 Days Credit</option><option>15 Days Credit</option></select></div>
        <button class="btn btn-gold" style="width:100%;margin-top:8px" onclick="registerBuyer()">✅ Register as Buyer</button>
      </div>
    </div>`}
  </div>`;
}

// Farmer-facing order queue: pending confirmations + history, with Confirm/Decline actions
function renderFarmerOrders(uid){
  let allOrders=[]; try{ allOrders=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  let orders=allOrders.filter(p=>p.farmerId===uid);

  // Recovery path: orders placed before a farmer's uid changed (e.g. session lost and they
  // re-registered) still carry the old, now-mismatched farmerId. Catch those by matching on
  // the farmer's name instead, and heal the record by writing the correct uid back in —
  // so this only needs to happen once per stale order.
  const me=getRegisteredFarmers().find(f=>f.uid===uid)||window.currentUser;
  if(me&&me.name){
    let healed=false;
    allOrders.forEach(p=>{
      if(p.farmerId!==uid&&p.farmerName&&p.farmerName.trim().toLowerCase()===me.name.trim().toLowerCase()){
        p.farmerId=uid; healed=true;
      }
    });
      if(healed){
      safeLS.set('kio_purchases',JSON.stringify(allOrders));
      orders=allOrders.filter(p=>p.farmerId===uid);
    }
  }

  // Cleanup pass: collapse accidental duplicate orders created by an earlier double-submit bug
  // (same buyer/farmer/crop/qty/price/amount, created moments apart). Keep whichever copy has
  // progressed furthest (Paid > Confirmed > Pending), discard the redundant twin(s).
  const rank={'Paid':3,'Confirmed — Awaiting Payment':2,'Pending Farmer Confirmation':1,'Declined by Farmer':0};
  const seen=new Map();
  let dupesRemoved=false;
  orders.forEach(o=>{
    const key=[o.buyerId,o.farmerId,o.crop,o.qty,o.price,o.amount].join('|');
    const existing=seen.get(key);
    if(!existing){ seen.set(key,o); return; }
    const keep=(rank[o.status]||0) >= (rank[existing.status]||0) ? o : existing;
    const drop=keep===o?existing:o;
    seen.set(key,keep);
    allOrders.splice(allOrders.findIndex(p=>p.id===drop.id),1);
    dupesRemoved=true;
  });
  if(dupesRemoved){
    safeLS.set('kio_purchases',JSON.stringify(allOrders));
    orders=allOrders.filter(p=>p.farmerId===uid);
  }

  if(!orders.length) return `<div style="padding:16px;text-align:center;color:var(--text3)">No orders yet. When a buyer requests to buy your crop, it will appear here for confirmation.</div>`;
  const statusBadge=s=>{
    if(s==='Pending Farmer Confirmation') return `<span class="badge badge-gold">⏳ Pending</span>`;
    if(s==='Confirmed — Awaiting Payment') return `<span class="badge badge-sky">✅ Confirmed · Awaiting Payment</span>`;
    if(s==='Paid') return `<span class="badge badge-green">💰 Paid</span>`;
    if(s==='Declined by Farmer') return `<span class="badge badge-red">✕ Declined</span>`;
    return `<span class="badge badge-sky">${s}</span>`;
  };
  return `<div class="table-wrap"><table><thead><tr><th>Order ID</th><th>Crop</th><th>Buyer</th><th>Qty</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${orders.map(o=>`<tr><td class="fw-bold text-sky" style="font-size:0.8rem">${o.id}</td><td>${o.crop}</td><td>${o.buyer}</td><td>${o.qty} Qtl</td><td class="text-gold fw-bold">₹${o.amount?.toLocaleString()}</td><td class="text-sm">${o.date}</td><td>${statusBadge(o.status)}</td><td>${o.status==='Pending Farmer Confirmation'?`<div style="display:flex;gap:6px"><button class="btn btn-primary btn-sm" onclick="farmerConfirmOrder('${o.id}')">Confirm</button><button class="btn btn-outline btn-sm" style="border-color:var(--red);color:var(--red)" onclick="farmerDeclineOrder('${o.id}')">Decline</button></div>`:'—'}</td></tr>`).join('')}
  </tbody></table></div>`;
}
window.renderFarmerOrders=renderFarmerOrders;

// Buyer-facing purchase history: shows status, lets buyer pay once confirmed
function renderMyPurchases(uid){
  let allOrders=[]; try{ allOrders=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  let purchases=allOrders.filter(p=>p.buyerId===uid);

  // Same dedup cleanup as renderFarmerOrders — runs independently so a buyer who checks
  // their purchases before any farmer-side view also gets a clean, de-duplicated list.
  const rank={'Paid':3,'Confirmed — Awaiting Payment':2,'Pending Farmer Confirmation':1,'Declined by Farmer':0};
  const seen=new Map();
  let dupesRemoved=false;
  purchases.forEach(o=>{
    const key=[o.buyerId,o.farmerId||o.farmerName,o.crop,o.qty,o.price,o.amount].join('|');
    const existing=seen.get(key);
    if(!existing){ seen.set(key,o); return; }
    const keep=(rank[o.status]||0) >= (rank[existing.status]||0) ? o : existing;
    const drop=keep===o?existing:o;
    seen.set(key,keep);
    const idx=allOrders.findIndex(p=>p.id===drop.id);
    if(idx>-1) allOrders.splice(idx,1);
    dupesRemoved=true;
  });
  if(dupesRemoved){
    safeLS.set('kio_purchases',JSON.stringify(allOrders));
    purchases=allOrders.filter(p=>p.buyerId===uid);
  }

  if(!purchases.length) return `<div style="padding:16px;text-align:center;color:var(--text3)">No purchases yet. <button class="btn btn-primary btn-sm" onclick="showPage('marketplace')">Browse Crops →</button></div>`;
  const statusBadge=s=>{
    if(s==='Pending Farmer Confirmation') return `<span class="badge badge-gold">⏳ Awaiting Farmer</span>`;
    if(s==='Confirmed — Awaiting Payment') return `<span class="badge badge-sky">✅ Confirmed</span>`;
    if(s==='Paid') return `<span class="badge badge-green">💰 Paid</span>`;
    if(s==='Declined by Farmer') return `<span class="badge badge-red">✕ Declined</span>`;
    return `<span class="badge badge-sky">${s}</span>`;
  };
  return `<div class="table-wrap"><table><thead><tr><th>Order ID</th><th>Crop</th><th>Seller</th><th>Qty</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${purchases.map(p=>`<tr><td class="fw-bold text-sky" style="font-size:0.8rem">${p.id}</td><td>${p.crop}</td><td>${p.farmerName}</td><td>${p.qty} Qtl</td><td class="text-gold fw-bold">₹${p.amount?.toLocaleString()}</td><td class="text-sm">${p.date}</td><td>${statusBadge(p.status)}</td><td>${p.status==='Confirmed — Awaiting Payment'?`<button class="btn btn-primary btn-sm" onclick="initiateBuyerPayment('${p.id}')">💳 Pay Now</button>`:'—'}</td></tr>`).join('')}
  </tbody></table></div>`;
}

// FIX: registerFarmer — save profile, don't call showPage
function registerFarmer(){
  // Guard: don't let an existing buyer account register as a farmer too — that
  // would leave currentUser.role==='buyer' while a farmer profile exists under the same uid,
  // breaking order routing (My Orders, Dashboard banner) for that account.
  if(window.currentUser&&window.currentUser.role==='buyer'){
    showToast('You are logged in as a Buyer. Log out first to register as a Farmer.','error');
    return;
  }
  const name=document.getElementById('f-name').value.trim();
  if(!name){ showToast('Please enter your name','error'); return; }
  const land=document.getElementById('f-land').value.trim();
  if(!land){ showToast('Please enter land area','error'); return; }

  // Login first (or use existing session)
  let user=window.currentUser;
  if(!user){
    // Reconnect to an existing farmer profile by name if one exists, rather than always
    // minting a fresh uid — prevents orphaning past listings/orders when the session was lost
    // (e.g. localStorage cleared, different tab) but the person re-registers with the same name.
    const existing=getRegisteredFarmers().find(f=>f.name.trim().toLowerCase()===name.trim().toLowerCase());
    user={uid:existing?existing.uid:'farmer_'+Date.now(),name,role:'farmer',demo:true};
    window.currentUser=user; safeLS.set('kio_user',JSON.stringify(user));
    updateUIForUser(user);
  }

  const farmerProfile={
    uid:user.uid,
    name,
    mobile:document.getElementById('f-mobile').value,
    village:document.getElementById('f-village').value,
    district:document.getElementById('f-district').value,
    state:document.getElementById('f-state').value,
    land,
    crop:document.getElementById('f-crop').value,
    aadhar:document.getElementById('f-aadhar').value,
    bank:document.getElementById('f-bank').value,
    ifsc:document.getElementById('f-ifsc').value,
    badge:'Verified', rating:'4.5',
    crops:[document.getElementById('f-crop').value],
    date:new Date().toLocaleDateString('en-IN'),
    sales:0
  };

  // Save to farmers store
  const arr=getRegisteredFarmers().filter(f=>f.uid!==user.uid);
  arr.unshift(farmerProfile);
  saveRegisteredFarmers(arr);
  saveToFirestore('farmers',farmerProfile);

  addNotification(`Welcome to KrishiOS, ${name}! 🌾 Your farmer profile is ready.`,'success','✅ Registration Successful');
  showToast(`✅ Registered as Farmer! Welcome, ${name}!`,'success');

  // Re-render registration page to show profile
  setTimeout(()=>renderRegister(), 500);
}

// FIX: registerBuyer — save profile, show buyer profile
function registerBuyer(){
  // Guard: don't let an existing farmer account register as a buyer too — symmetric to the
  // registerFarmer guard. Prevents currentUser.role mismatching the actual registration stores.
  if(window.currentUser&&window.currentUser.role==='farmer'){
    showToast('You are logged in as a Farmer. Log out first to register as a Buyer.','error');
    return;
  }
  const name=document.getElementById('b-name').value.trim();
  if(!name){ showToast('Please enter company/name','error'); return; }

  let user=window.currentUser;
  if(!user){
    // Same reconnection logic as registerFarmer — match by name to an existing buyer
    // profile rather than minting a fresh uid that would orphan their order/purchase history.
    const existing=getRegisteredBuyers().find(b=>b.name.trim().toLowerCase()===name.trim().toLowerCase());
    user={uid:existing?existing.uid:'buyer_'+Date.now(),name,role:'buyer',demo:true};
    window.currentUser=user; safeLS.set('kio_user',JSON.stringify(user));
    updateUIForUser(user);
  }

  const buyerProfile={
    uid:user.uid,
    name,
    mobile:document.getElementById('b-mobile').value,
    businessType:document.getElementById('b-type').value,
    gst:document.getElementById('b-gst').value,
    crops:document.getElementById('b-crops').value,
    volume:document.getElementById('b-volume').value,
    states:document.getElementById('b-states').value,
    paymentTerms:document.getElementById('b-payment').value,
    date:new Date().toLocaleDateString('en-IN')
  };

  const arr=getRegisteredBuyers().filter(b=>b.uid!==user.uid);
  arr.unshift(buyerProfile);
  saveRegisteredBuyers(arr);
  saveToFirestore('buyers',buyerProfile);

  addNotification(`Welcome, ${name}! 🛒 Buyer profile created. Browse crops and start buying!`,'success','✅ Registration Successful');
  showToast(`✅ Registered as Buyer! Welcome, ${name}!`,'success');

  setTimeout(()=>renderRegister(), 500);
}
window.registerFarmer=registerFarmer; window.registerBuyer=registerBuyer;

// ===================== CROP LIBRARY =====================
function renderCropLibrary(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>📚 National Crop Library</h1><p>Complete guide to all major Indian crops</p></div>
  <div class="flex-between mb-16" style="flex-wrap:wrap;gap:10px">
    <input class="form-input" style="max-width:280px" id="crop-search" oninput="filterCrops()" placeholder="🔍 Search crops..."/>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${['All','Kharif','Rabi','Cash Crop','Spice','Oilseed','Vegetable','Fruit'].map(tag=>`<button class="btn btn-outline btn-sm" onclick="filterByTag('${tag}')">${tag}</button>`).join('')}</div>
  </div>
  <div class="grid-auto" id="crop-grid">${CROPS.map(crop=>cropCard(crop)).join('')}</div>
  <div id="crop-modal" style="display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.8);overflow-y:auto"><div id="crop-modal-content" style="max-width:700px;margin:40px auto;padding:20px"></div></div>`;
}
function cropCard(crop){ return `<div class="crop-card" onclick="openCrop('${crop.id}')"><div class="crop-img">${crop.image?`<img src="${crop.image}" alt="${crop.name}" onerror="this.parentElement.innerHTML='<span style=font-size:4rem>${crop.emoji}</span>'"/>`:`<span style="font-size:4rem">${crop.emoji}</span>`}</div><div class="crop-info"><div class="crop-name">${crop.emoji} ${crop.name}</div><div class="crop-sci">${crop.scientific}</div><div style="margin-bottom:10px">${crop.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="crop-meta"><span>🗓️ ${crop.season.split(' ')[0]}</span><span>💧 ${crop.water.split('–')[0]}mm+</span><span>📈 ${crop.demand}</span><span>💰 ${crop.msp?'₹'+crop.msp:'Market'}</span></div></div></div>`; }
function filterCrops(){ const q=document.getElementById('crop-search').value.toLowerCase(); const f=CROPS.filter(c=>c.name.toLowerCase().includes(q)||c.scientific.toLowerCase().includes(q)||c.tags.some(t=>t.toLowerCase().includes(q))); document.getElementById('crop-grid').innerHTML=f.map(c=>cropCard(c)).join('')||'<p style="color:var(--text3)">No crops found.</p>'; }
function filterByTag(tag){ const f=tag==='All'?CROPS:CROPS.filter(c=>c.tags.some(t=>t.toLowerCase().includes(tag.toLowerCase()))||c.season.toLowerCase().includes(tag.toLowerCase())); document.getElementById('crop-grid').innerHTML=f.map(c=>cropCard(c)).join('')||'<p style="color:var(--text3)">No crops found.</p>'; }
function openCrop(id){
  const crop=CROPS.find(c=>c.id===id); if(!crop) return;
  const max=Math.max(...crop.price);
  document.getElementById('crop-modal').style.display='block';
  document.getElementById('crop-modal-content').innerHTML=`<div class="card"><div class="flex-between mb-16"><h2 style="font-family:var(--font-display);font-size:1.5rem">${crop.emoji} ${crop.name}</h2><button class="btn btn-outline btn-sm" onclick="document.getElementById('crop-modal').style.display='none'">✕ Close</button></div><div class="two-col"><div><div class="crop-img" style="height:200px;border-radius:10px;overflow:hidden;margin-bottom:14px">${crop.image?`<img src="${crop.image}" style="width:100%;height:200px;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=font-size:6rem;text-align:center;padding:40px>${crop.emoji}</div>'"/>`:`<div style="font-size:6rem;text-align:center;padding:40px">${crop.emoji}</div>`}</div><div class="notif notif-info">📖 ${crop.desc}</div></div><div>${[['🔬 Scientific',crop.scientific],['🗓️ Season',crop.season],['💧 Water',crop.water],['🌡️ Temp',crop.temp],['🟫 Soil',crop.soil],['📊 Demand',crop.demand],['💰 MSP',crop.msp?'₹'+crop.msp+'/qtl':'Free market']].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3);font-size:0.82rem">${l}</span><span style="font-size:0.85rem">${v}</span></div>`).join('')}</div></div><hr class="divider"/><div class="card-title">📉 Price History (₹/Qtl)</div><div class="bar-chart" style="margin-top:8px">${crop.price.map((p,i)=>`<div class="bar-wrap"><div class="bar-val">₹${p}</div><div class="bar" style="height:${(p/max)*130}px"></div><div class="bar-label">M${i+1}</div></div>`).join('')}</div><div style="margin-top:16px;display:flex;gap:10px"><button class="btn btn-primary" onclick="document.getElementById('crop-modal').style.display='none';showPage('marketplace')">🛒 Sell/Buy</button><button class="btn btn-outline" onclick="document.getElementById('crop-modal').style.display='none';showPage('crop-planning')">📋 Plan</button></div></div>`;
}
window.filterCrops=filterCrops; window.filterByTag=filterByTag; window.openCrop=openCrop;

// ===================== AI QUALITY GRADER =====================
function renderAIQuality(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>🤖 AI Crop Quality Grader</h1><p>Upload a crop photo — AI analyzes quality, grade, and market value</p></div>
  <div class="two-col">
    <div class="card">
      <div class="card-title">📸 Upload Crop Image</div>
      <div class="form-group"><label class="form-label">Crop Type</label><select class="form-select" id="q-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="upload-area" onclick="document.getElementById('q-file').click()"><input type="file" id="q-file" accept="image/*" onchange="previewImage(event)"/><div class="upload-icon">📷</div><p>Click or drag a crop photo here</p></div>
      <div id="img-preview" style="margin-top:14px;display:none"><img id="preview-img" style="width:100%;border-radius:10px;max-height:220px;object-fit:cover"/></div>
      <button class="btn btn-primary mt-16" style="width:100%" onclick="analyzeQuality()" id="analyze-btn">🤖 Analyze with AI</button>
    </div>
    <div class="card">
      <div class="card-title">📊 Quality Analysis Result</div>
      <div id="quality-placeholder" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:3rem;margin-bottom:12px">🔍</div><p>Upload a crop image to get AI analysis</p></div>
      <div class="quality-result" id="quality-result"><div class="score-circle" id="q-score">-</div><div class="grade-badge" id="q-grade">-</div><div id="q-details"></div></div>
    </div>
  </div>
  <div class="card mt-16">
    <div class="card-title">🏆 Quality Leaderboard</div>
    <div class="table-wrap"><table><thead><tr><th>Rank</th><th>Farmer</th><th>Crop</th><th>Grade</th><th>Score</th><th>Market Value</th><th>Status</th></tr></thead><tbody>
      ${[['🥇1','Lakshmi Devi','Turmeric','A+',96,'₹12,000/qtl','Premium'],['🥈2','Ramesh Patil','Soybean','A',91,'₹4,800/qtl','Listed'],['🥉3','Suresh Kumar','Wheat','A',88,'₹2,400/qtl','Sold'],['4','Gopal Yadav','Onion','B',74,'₹2,100/qtl','Auction']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="badge badge-${r[3].includes('A')?'green':'gold'}">${r[3]}</span></td><td>${r[4]}%</td><td class="text-gold">${r[5]}</td><td><span class="badge badge-sky">${r[6]}</span></td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
}
function previewImage(e){ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=ev=>{ document.getElementById('preview-img').src=ev.target.result; document.getElementById('img-preview').style.display='block'; }; reader.readAsDataURL(file); }
async function analyzeQuality(){
  const cropName=document.getElementById('q-crop').value; const btn=document.getElementById('analyze-btn');
  btn.disabled=true; btn.textContent='⏳ Analyzing...';
  document.getElementById('quality-placeholder').style.display='none';
  document.getElementById('quality-result').classList.add('show');
  document.getElementById('q-score').textContent='...'; document.getElementById('q-grade').textContent='⏳';
  document.getElementById('q-details').innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> AI analyzing...</div>';
  const result=await callAI(`Expert agricultural quality inspector. Analyze a ${cropName} crop sample. Respond ONLY with valid JSON:\n{"score":85,"grade":"A","freshness":"High","defects":"Minor surface blemishes","diseaseSymptoms":"None detected","marketValue":"₹4,800/qtl","premiumBadge":true,"recommendation":"Ready for premium market listing","improvements":"Clean and sort before packing"}`);
  btn.disabled=false; btn.textContent='🤖 Analyze with AI';
  try{
    const data=JSON.parse(result.replace(/```json|```/g,'').trim());
    const gc=data.grade.includes('A')?'grade-A':data.grade==='B'?'grade-B':'grade-C';
    document.getElementById('q-score').textContent=data.score;
    document.getElementById('q-score').style.borderColor=data.score>=85?'var(--green-bright)':data.score>=70?'var(--gold)':'var(--red)';
    document.getElementById('q-grade').innerHTML=`<div class="${gc}">Grade ${data.grade}</div>`;
    document.getElementById('q-details').innerHTML=`${[['🌿 Freshness',data.freshness],['⚠️ Defects',data.defects],['🔬 Disease',data.diseaseSymptoms],['💰 Value',data.marketValue],['💡 Tip',data.recommendation],['📦 Improve',data.improvements]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3);font-size:0.82rem;min-width:110px">${k}</span><span style="font-size:0.85rem;text-align:right">${v}</span></div>`).join('')}${data.premiumBadge?'<div class="notif notif-success mt-16">🏅 Premium Badge Awarded!</div>':''}<button class="btn btn-primary mt-16" onclick="showPage(\'marketplace\')">🛒 List in Marketplace</button>`;
  }catch{ document.getElementById('q-details').innerHTML=`<div style="white-space:pre-wrap;font-size:0.85rem;color:var(--text2)">${result}</div>`; }
}
window.previewImage=previewImage; window.analyzeQuality=analyzeQuality;

// ===================== MARKETPLACE (fixed) =====================
function renderMarketplace(){
  const c=document.getElementById('content');
  const user=window.currentUser;

  // All listings = static FARMERS crops + user-listed crops from localStorage
  let userListings=[]; try{ userListings=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}

  c.innerHTML=`
  <div class="page-header"><h1>🛒 Direct Marketplace</h1><p>Buy and sell directly — no middlemen, fair prices</p></div>
  ${user?`<div class="notif notif-${user.role==='farmer'?'success':'info'}" style="margin-bottom:16px">${user.role==='farmer'?`🌾 Logged in as Farmer <strong>${user.name}</strong> — use "Sell My Crop" tab to list your crops`:`🛒 Logged in as Buyer <strong>${user.name}</strong> — click Buy to purchase crops`}</div>`:''}
  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'mp-browse')">${t('browse_tab')}</button>
    <button class="tab" onclick="switchTab(this,'mp-sell')">${t('sell_tab')}</button>
    <button class="tab" onclick="switchTab(this,'mp-bulk')">📦 Bulk Orders</button>
    <button class="tab" onclick="switchTab(this,'mp-matching')">🤝 Buyer Matching</button>
  </div>

  <div id="mp-browse">
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px">
      <input class="form-input" style="max-width:220px" id="mp-search" oninput="filterMarketplace()" placeholder="🔍 Search crops..."/>
      <select class="form-select" style="max-width:150px" id="mp-grade-filter" onchange="filterMarketplace()"><option value="">All Grades</option><option>A+</option><option>A</option><option>B</option></select>
      <select class="form-select" style="max-width:160px" id="mp-state-filter" onchange="filterMarketplace()"><option value="">All States</option><option>Maharashtra</option><option>Punjab</option><option>UP</option><option>Andhra</option></select>
    </div>
    <div class="grid-3" id="mp-browse-grid">
      ${buildMarketplaceCards([...FARMERS.flatMap((f,fi)=>f.crops.map((crop,ci)=>{
        const cd=CROPS.find(x=>x.name===crop)||{emoji:'🌾',price:[2000]};
        const price=cd.price[cd.price.length-1];
        const grades=['A','A+','B','A']; const qtys=[50,120,30,80];
        return {id:`static_${fi}_${ci}`,crop,farmerName:f.name,village:f.village,state:f.state,rating:f.rating,price,qty:qtys[(fi+ci)%4],grade:grades[(fi+ci)%4],emoji:cd.emoji||'🌾',isUserListing:false};
      })),...userListings.map(l=>({id:l.id,crop:l.crop,farmerName:l.farmer,village:'',state:'',rating:'4.5',price:parseInt(l.price),qty:parseInt(l.qty),grade:l.grade||'B',emoji:CROPS.find(x=>x.name===l.crop)?.emoji||'🌾',isUserListing:true,listingId:l.id,farmerId:l.farmerId}))])}
    </div>
  </div>

  <div id="mp-sell" style="display:none">
    ${!user?`<div class="notif notif-warn" style="margin-bottom:16px">⚠️ Please <button class="btn btn-primary btn-sm" onclick="openAuthModal()">Login</button> or <button class="btn btn-outline btn-sm" onclick="showPage('register')">Register as Farmer</button> to sell crops.</div>`:''}
    ${user&&user.role==='buyer'?`<div class="notif notif-warn" style="margin-bottom:16px">⚠️ You are registered as a Buyer. Only Farmers can sell crops. <button class="btn btn-outline btn-sm" onclick="showPage('register')">Re-register as Farmer</button></div>`:''}
    <div class="two-col">
      <div class="card">
        <div class="card-title">${t('list_crop_title')}</div>
        <div class="form-group"><label class="form-label">${t('crop_label')}</label><select class="form-select" id="sell-crop">${CROPS.map(x=>`<option>${x.name}</option>`).join('')}</select></div>
        <div class="form-group">
          <label class="form-label">${t('photo_label')}</label>
          <div class="sell-photo-area" id="sell-photo-area" onclick="document.getElementById('sell-photo-input').click()" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')" ondrop="handleSellPhotoDrop(event)">
            <input type="file" id="sell-photo-input" accept="image/*" style="display:none" onchange="handleSellPhotoSelect(event)"/>
            <div id="sell-photo-placeholder"><div style="font-size:2.5rem;margin-bottom:8px">📷</div><div style="font-weight:600">Click or drag crop photo here</div><div style="font-size:0.75rem;color:var(--text3)">JPG, PNG up to 10MB</div></div>
            <img id="sell-photo-preview" style="display:none;width:100%;border-radius:8px;max-height:200px;object-fit:cover"/>
          </div>
        </div>
        <button class="btn btn-outline" style="width:100%;margin-bottom:14px" id="ai-grade-btn" onclick="aiGradeSellPhoto()" disabled>${t('ai_grade_btn')}</button>
        <div id="sell-grade-result" style="display:none;border:1px solid var(--green-bright);border-radius:10px;padding:14px;margin-bottom:14px;background:rgba(64,145,108,0.07)">
          <div style="display:flex;align-items:center;gap:12px">
            <div id="sell-grade-circle" style="width:56px;height:56px;border-radius:50%;border:3px solid var(--green-bright);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;flex-shrink:0"></div>
            <div style="flex:1"><div id="sell-grade-label" style="font-weight:700;font-size:1rem"></div><div id="sell-grade-details" style="font-size:0.8rem;color:var(--text2);margin-top:3px"></div></div>
            <div style="text-align:right"><div id="sell-grade-value" class="text-gold fw-bold" style="font-size:1.1rem"></div><div class="text-sm">Market Value</div></div>
          </div>
        </div>
        <div class="form-group"><label class="form-label">${t('qty_label')}</label><input class="form-input" id="sell-qty" placeholder="50"/></div>
        <div class="form-group"><label class="form-label">${t('price_label')}</label><input class="form-input" id="sell-price" placeholder="4600"/></div>
        <div class="form-group"><label class="form-label">${t('grade_label')}</label><select class="form-select" id="sell-grade-sel"><option>A+</option><option>A</option><option selected>B</option><option>C</option></select></div>
        <div class="form-group"><label class="form-label">${t('delivery_label')}</label><select class="form-select"><option>Farm Pickup</option><option>Deliver to Mandi</option><option>Deliver to Buyer</option></select></div>
        <div class="form-group"><label class="form-label">${t('desc_label')}</label><textarea class="form-textarea" id="sell-desc" placeholder="Freshly harvested, no pesticide residue..."></textarea></div>
        <button class="btn btn-primary" style="width:100%" onclick="listCropForSale()">${t('list_btn')}</button>
        <button class="wa-btn" style="width:100%;margin-top:8px;justify-content:center" onclick="shareListingWA()">💬 Share on WhatsApp</button>
      </div>
      <div class="card">
        <div class="card-title">💡 Sell Now vs Store Later</div>
        <div class="notif notif-info mb-16">🤖 AI Recommendation for Soybean</div>
        ${[['Sell Now','Immediate cash. Current ₹4,620/qtl','btn-primary','✅ Recommended'],['Store 30 Days','Predicted ₹4,900/qtl. Storage ₹240/qtl','btn-outline','Marginal'],['Store 60 Days','High risk — could drop to ₹4,200/qtl','btn-danger','⚠️ Risky']].map(([tt,d,cls,badge])=>`<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px"><div class="flex-between mb-16"><span class="fw-bold">${tt}</span><span class="badge badge-${cls==='btn-primary'?'green':cls==='btn-danger'?'red':'gold'}">${badge}</span></div><p style="font-size:0.83rem;color:var(--text2);margin-bottom:10px">${d}</p><button class="btn ${cls} btn-sm">${tt}</button></div>`).join('')}
        <hr class="divider"/>
        <div class="card-title">📋 My Active Listings</div>
        <div id="my-listings-area">${renderMyListings()}</div>
      </div>
    </div>
  </div>

  <div id="mp-bulk" style="display:none">
    <div class="card"><div class="card-title">📦 Active Bulk Orders</div>
    <div class="table-wrap"><table><thead><tr><th>Buyer</th><th>Crop</th><th>Qty</th><th>Price</th><th>Deadline</th><th>Action</th></tr></thead>
    <tbody>${[['Agro Traders Ltd.','Wheat',500,'₹2,350/qtl','15 Jun'],['FoodCorp India','Soybean',200,'₹4,700/qtl','20 Jun'],['Spice Exports','Turmeric',80,'₹11,500/qtl','10 Jun'],['Sunrise Mills','Maize',300,'₹2,100/qtl','25 Jun']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="text-gold fw-bold">${r[3]}</td><td>${r[4]}</td><td><button class="btn btn-primary btn-sm" onclick="expressInterest('${r[0]}','${r[1]}')">Express Interest</button></td></tr>`).join('')}</tbody></table></div></div>
  </div>

  <div id="mp-matching" style="display:none">
    <div class="card"><div class="card-title">🤝 AI Buyer Matching</div>
    ${[{name:'Agro Traders Ltd.',type:'Trader',offer:'₹4,720/qtl',match:'97%',note:'Premium, 24hr payment'},{name:'Maharashtra FPO Hub',type:'FPO',offer:'₹4,680/qtl',match:'94%',note:'Bulk pickup'},{name:'VitaOil Processing',type:'Processor',offer:'₹4,640/qtl',match:'88%',note:'Regular buyer'},{name:'Export Quality Foods',type:'Exporter',offer:'₹4,850/qtl',match:'85%',note:'Grade strict'},...getRegisteredBuyers().map(b=>({name:b.name,type:b.businessType||'Buyer',offer:'₹4,600/qtl',match:'90%',note:`Reg. buyer · ${b.crops||'All crops'}`}))].map(b=>`<div style="display:flex;align-items:center;gap:16px;padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:10px"><div style="text-align:center;min-width:55px"><div style="font-size:1.2rem;font-weight:800;color:var(--green-light)">${b.match}</div><div class="text-sm">Match</div></div><div style="flex:1"><div class="fw-bold">${b.name}</div><div class="text-sm">${b.type} · ${b.note}</div></div><div style="text-align:right"><div class="text-gold fw-bold">${b.offer}</div><div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-sm" onclick="connectBuyer('${b.name}')">Connect</button><button class="wa-btn btn-sm" onclick="contactBuyerWA('${b.name}','${b.offer}')">💬</button></div></div></div>`).join('')}</div>
  </div>`;
}

function buildMarketplaceCards(items){
  const user=window.currentUser;
  return items.map(item=>`
    <div class="card" id="card-${item.id}">
      <div class="flex-between mb-16"><div style="font-size:2rem">${item.emoji}</div><span class="badge badge-${item.grade.includes('A')?'green':'gold'}">Grade ${item.grade}${item.isUserListing?' <span style="font-size:0.6rem;background:rgba(14,165,233,0.2);border-radius:4px;padding:1px 4px;color:var(--sky)">NEW</span>':''}</span></div>
      <div style="font-weight:700;font-size:1.05rem">${item.crop}</div>
      <div style="color:var(--text3);font-size:0.82rem;margin-bottom:10px">by ${item.farmerName}${item.village?` · ${item.village}`:''}${item.state?`, ${item.state}`:''}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div><div class="text-sm">Price</div><div style="font-weight:700;color:var(--gold)">₹${item.price.toLocaleString()}/qtl</div></div>
        <div><div class="text-sm">Qty</div><div style="font-weight:700">${item.qty} Qtl</div></div>
        <div><div class="text-sm">Rating</div><div style="font-weight:700">⭐ ${item.rating}</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${user&&user.role==='buyer'?
          `<button class="btn btn-primary btn-sm" style="flex:1" onclick="initiatePayment('${item.crop}',${item.price*item.qty},'${item.farmerName}',${item.qty},${item.price},${item.farmerId?`'${item.farmerId}'`:'null'})">📨 Request ₹${(item.price*item.qty/1000).toFixed(0)}k</button>`:
          `<button class="btn btn-primary btn-sm" style="flex:1" onclick="${user?'showToast(\'Buyers only can purchase. You are a farmer.\',\'warn\')':'openAuthModal()'}">📨 Request</button>`
        }
        <button class="btn btn-outline btn-sm" onclick="showPage('auction')">🔨</button>
        <button class="wa-btn btn-sm" onclick="contactSellerWA('${item.farmerName}','${item.crop}',${item.price})">💬</button>
        ${item.isUserListing&&user&&item.farmerName===user.name?`<button class="btn btn-outline btn-sm" onclick="removeMyListing(${item.listingId})" style="border-color:var(--red);color:var(--red)">✕</button>`:''}
      </div>
    </div>`).join('');
}

window.filterMarketplace=function(){
  const q=(document.getElementById('mp-search')?.value||'').toLowerCase();
  const grade=document.getElementById('mp-grade-filter')?.value||'';
  const state=document.getElementById('mp-state-filter')?.value||'';
  let userListings=[]; try{ userListings=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}
  const allItems=[...FARMERS.flatMap((f,fi)=>f.crops.map((crop,ci)=>{
    const cd=CROPS.find(x=>x.name===crop)||{emoji:'🌾',price:[2000]};
    const price=cd.price[cd.price.length-1];
    const grades=['A','A+','B','A']; const qtys=[50,120,30,80];
    return {id:`static_${fi}_${ci}`,crop,farmerName:f.name,village:f.village,state:f.state,rating:f.rating,price,qty:qtys[(fi+ci)%4],grade:grades[(fi+ci)%4],emoji:cd.emoji||'🌾',isUserListing:false};
  })),...userListings.map(l=>({id:l.id,crop:l.crop,farmerName:l.farmer,village:'',state:'',rating:'4.5',price:parseInt(l.price),qty:parseInt(l.qty),grade:l.grade||'B',emoji:CROPS.find(x=>x.name===l.crop)?.emoji||'🌾',isUserListing:true,listingId:l.id,farmerId:l.farmerId}))];
  const filtered=allItems.filter(i=>{
    if(q&&!i.crop.toLowerCase().includes(q)&&!i.farmerName.toLowerCase().includes(q)) return false;
    if(grade&&i.grade!==grade) return false;
    if(state&&i.state&&!i.state.includes(state)) return false;
    return true;
  });
  const grid=document.getElementById('mp-browse-grid');
  if(grid) grid.innerHTML=filtered.length?buildMarketplaceCards(filtered):'<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:40px">No crops found matching your filters.</p>';
};

function renderMyListings(){
  const user=window.currentUser;
  let arr=[]; try{ arr=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}
  if(user) arr=arr.filter(l=>l.farmerId===user.uid||l.farmer===user.name);
  if(!arr.length) return`<div style="padding:20px;text-align:center;color:var(--text3);font-size:0.85rem">No active listings yet.<br/>Fill the form above and click "List Crop for Sale".</div>`;
  return arr.slice(0,5).map(l=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
      <div>
        <div class="fw-bold" style="font-size:0.85rem">${l.crop} — ${l.qty} Qtl</div>
        <div class="text-sm">₹${l.price}/qtl · Grade ${l.grade} · <span class="badge badge-green" style="font-size:0.65rem">Live</span></div>
        <div class="text-sm" style="color:var(--text3)">${l.date}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="removeMyListing(${l.id})" style="border-color:var(--red);color:var(--red)">✕ Remove</button>
    </div>`).join('');
}

window.handleSellPhotoSelect=function(e){ const file=e.target.files[0]; if(file) loadSellPhoto(file); };
window.handleSellPhotoDrop=function(e){ e.preventDefault(); document.getElementById('sell-photo-area').classList.remove('drag'); const file=e.dataTransfer.files[0]; if(file&&file.type.startsWith('image/')) loadSellPhoto(file); };
function loadSellPhoto(file){ const reader=new FileReader(); reader.onload=ev=>{ document.getElementById('sell-photo-placeholder').style.display='none'; const img=document.getElementById('sell-photo-preview'); img.src=ev.target.result; img.style.display='block'; window._sellPhotoBase64=ev.target.result.split(',')[1]; const btn=document.getElementById('ai-grade-btn'); if(btn){ btn.disabled=false; btn.classList.remove('btn-outline'); btn.classList.add('btn-primary'); } }; reader.readAsDataURL(file); }
window.aiGradeSellPhoto=async function(){
  const crop=document.getElementById('sell-crop')?.value||'crop'; const btn=document.getElementById('ai-grade-btn');
  btn.disabled=true; btn.textContent='⏳ Grading...';
  const result=await callAI(`Expert agricultural quality inspector. Farmer uploaded photo of ${crop}. Respond ONLY with valid JSON:\n{"score":88,"grade":"A","freshness":"High","defects":"Minor surface blemishes","diseaseSymptoms":"None detected","marketValue":"₹4,800/qtl","premiumBadge":true,"recommendation":"Ready for premium listing"}`);
  btn.disabled=false; btn.textContent=t('ai_grade_btn');
  try{
    const d=JSON.parse(result.replace(/```json|```/g,'').trim());
    document.getElementById('sell-grade-circle').textContent=d.grade;
    document.getElementById('sell-grade-circle').style.borderColor=d.score>=85?'var(--green-bright)':d.score>=70?'var(--gold)':'var(--red)';
    document.getElementById('sell-grade-label').textContent=`Grade ${d.grade} — Score ${d.score}/100 ${d.premiumBadge?'🏅':''}`;
    document.getElementById('sell-grade-details').textContent=`${d.freshness} freshness · ${d.recommendation}`;
    document.getElementById('sell-grade-value').textContent=d.marketValue;
    document.getElementById('sell-grade-result').style.display='block';
    const gs=document.getElementById('sell-grade-sel'); if(gs) for(let o of gs.options) if(o.value===d.grade){ gs.value=o.value; break; }
    const pi=document.getElementById('sell-price'); if(pi&&!pi.value) pi.value=d.marketValue.replace(/[^0-9]/g,'');
    addNotification(`AI graded ${crop}: Grade ${d.grade}, ${d.marketValue}`,'success','🤖 AI Grading Done');
  }catch{ showToast('AI: '+result.slice(0,80),'info'); }
};

// FIX: listCropForSale — also saves farmerId so it's tied to the farmer
window.listCropForSale=function(){
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(!user){ openAuthModal(); showToast('Please login to list crops','warn'); return; }
  if(user.role==='buyer'){ showToast('Only Farmers can list crops. You are registered as a Buyer.','warn'); return; }
  const crop=document.getElementById('sell-crop')?.value;
  const qty=document.getElementById('sell-qty')?.value;
  const price=document.getElementById('sell-price')?.value;
  const grade=document.getElementById('sell-grade-sel')?.value;
  const desc=document.getElementById('sell-desc')?.value;
  if(!qty||!price){ showToast('Enter quantity and price','error'); return; }
  if(isNaN(price)||parseFloat(price)<=0){ showToast('Enter a valid price','error'); return; }
  if(isNaN(qty)||parseFloat(qty)<=0){ showToast('Enter a valid quantity','error'); return; }

  const listing={
    id:Date.now(),
    crop, qty, price, grade, desc,
    farmer:user.name,
    farmerId:user.uid,      // key fix: tie listing to farmer
    date:new Date().toLocaleDateString('en-IN')
  };
  let arr=[]; try{ arr=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}
  arr.unshift(listing); safeLS.set('kio_listings',JSON.stringify(arr.slice(0,50)));
  saveToFirestore('listings',listing);
  window._sellPhotoBase64=null;

  // Refresh my listings panel
  const area=document.getElementById('my-listings-area');
  if(area) area.innerHTML=renderMyListings();

  // Refresh browse grid so newly listed crop appears immediately
  const grid=document.getElementById('mp-browse-grid');
  if(grid){
    let userListings=[]; try{ userListings=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}
    const items=[...FARMERS.flatMap((f,fi)=>f.crops.map((crop2,ci)=>{
      const cd=CROPS.find(x=>x.name===crop2)||{emoji:'🌾',price:[2000]};
      const price2=cd.price[cd.price.length-1];
      const grades=['A','A+','B','A']; const qtys=[50,120,30,80];
      return {id:`static_${fi}_${ci}`,crop:crop2,farmerName:f.name,village:f.village,state:f.state,rating:f.rating,price:price2,qty:qtys[(fi+ci)%4],grade:grades[(fi+ci)%4],emoji:cd.emoji||'🌾',isUserListing:false};
    })),...userListings.map(l=>({id:l.id,crop:l.crop,farmerName:l.farmer,village:'',state:'',rating:'4.5',price:parseInt(l.price),qty:parseInt(l.qty),grade:l.grade||'B',emoji:CROPS.find(x=>x.name===l.crop)?.emoji||'🌾',isUserListing:true,listingId:l.id,farmerId:l.farmerId}))];
    grid.innerHTML=buildMarketplaceCards(items);
  }

  addNotification(`${crop} listed at ₹${price}/qtl! Buyers can now see your crop.`,'deal','📢 Crop Listed');
  showToast(`✅ ${crop} listed! Switch to "Browse Crops" tab to see it.`,'success');
};

window.removeMyListing=function(id){
  let arr=[]; try{ arr=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}
  arr=arr.filter(l=>l.id!==id); safeLS.set('kio_listings',JSON.stringify(arr));
  const area=document.getElementById('my-listings-area'); if(area) area.innerHTML=renderMyListings();
  showToast('Listing removed','info');
  // Refresh browse grid
  const grid=document.getElementById('mp-browse-grid');
  if(grid){ let ul=[]; try{ul=JSON.parse(safeLS.get('kio_listings','[]'));}catch(e){} const items=[...FARMERS.flatMap((f,fi)=>f.crops.map((crop,ci)=>{const cd=CROPS.find(x=>x.name===crop)||{emoji:'🌾',price:[2000]};const price=cd.price[cd.price.length-1];const grades=['A','A+','B','A'];const qtys=[50,120,30,80];return{id:`static_${fi}_${ci}`,crop,farmerName:f.name,village:f.village,state:f.state,rating:f.rating,price,qty:qtys[(fi+ci)%4],grade:grades[(fi+ci)%4],emoji:cd.emoji||'🌾',isUserListing:false};})),...ul.map(l=>({id:l.id,crop:l.crop,farmerName:l.farmer,village:'',state:'',rating:'4.5',price:parseInt(l.price),qty:parseInt(l.qty),grade:l.grade||'B',emoji:CROPS.find(x=>x.name===l.crop)?.emoji||'🌾',isUserListing:true,listingId:l.id,farmerId:l.farmerId}))]; grid.innerHTML=buildMarketplaceCards(items); }
};

window.shareListingWA=function(){ const crop=document.getElementById('sell-crop')?.value||'Crop'; const qty=document.getElementById('sell-qty')?.value||'?'; const price=document.getElementById('sell-price')?.value||'?'; const grade=document.getElementById('sell-grade-sel')?.value||'A'; window.open(`https://wa.me/?text=${encodeURIComponent(`🌾 *Crop for Sale*\n\n*${crop}*\nGrade: ${grade}\nQty: ${qty} Quintal\nPrice: ₹${price}/qtl\n_via KrishiOS_`)}`,'_blank'); };

// ===================== SOIL =====================
function renderSoil(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>🧪 Soil Analysis & Crop Recommendation</h1><p>Enter soil parameters for AI-powered recommendations</p></div>
  <div class="tabs"><button class="tab active" onclick="switchTab(this,'soil-tab')">🧪 Soil Analysis</button><button class="tab" onclick="switchTab(this,'fert-tab')">🌿 Fertilizer Planner</button><button class="tab" onclick="switchTab(this,'water-tab')">💧 Water Management</button></div>
  <div id="soil-tab"><div class="two-col">
    <div class="card"><div class="card-title">Enter Soil Parameters</div>
      ${[['Nitrogen (kg/ha)','s-n','120'],['Phosphorus (kg/ha)','s-p','32'],['Potassium (kg/ha)','s-k','78'],['pH Level','s-ph','6.8'],['Rainfall (mm)','s-rain','800'],['Temperature (°C)','s-temp','28'],['Humidity (%)','s-hum','65']].map(([l,id,def])=>`<div class="form-group"><label class="form-label">${l}</label><input class="form-input" id="${id}" value="${def}" placeholder="${def}"/></div>`).join('')}
      <div class="form-group"><label class="form-label">Soil Type</label><select class="form-select" id="s-type"><option>Alluvial</option><option>Black (Regur)</option><option>Red</option><option>Laterite</option><option>Arid</option></select></div>
      <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="analyzeSoil()" id="soil-btn">🤖 Get AI Crop Recommendation</button>
    </div>
    <div class="card"><div class="card-title">🌾 Recommendations</div><div id="soil-result"><div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:3rem;margin-bottom:10px">🧪</div><p>Enter parameters and click Analyze</p></div></div></div>
  </div></div>
  <div id="fert-tab" style="display:none"><div class="two-col">
    <div class="card"><div class="card-title">🌿 Fertilizer Calculator</div>
      <div class="form-group"><label class="form-label">Crop</label><select class="form-select" id="fert-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Land Area (Acres)</label><input class="form-input" id="fert-area" value="5"/></div>
      <div class="form-group"><label class="form-label">Nitrogen Status</label><select class="form-select" id="fert-n"><option>Deficient</option><option>Adequate</option><option>Excess</option></select></div>
      <div class="form-group"><label class="form-label">Phosphorus Status</label><select class="form-select" id="fert-p"><option>Adequate</option><option>Deficient</option></select></div>
      <div class="form-group"><label class="form-label">Farming Method</label><select class="form-select" id="fert-method"><option>Chemical</option><option>Organic</option><option>Mixed</option></select></div>
      <button class="btn btn-primary" style="width:100%" onclick="getFertPlan()">🤖 Generate Fertilizer Plan</button>
    </div>
    <div class="card" id="fert-result"><div class="card-title">📋 Fertilizer Schedule</div><div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:3rem">🌿</div><p>Fill form and generate plan</p></div></div>
  </div>
  <div class="card mt-16"><div class="card-title">📦 Fertilizer Prices Today</div>
  <div class="table-wrap"><table><thead><tr><th>Fertilizer</th><th>Type</th><th>MRP</th><th>Subsidy</th><th>Net Cost</th><th>Stock</th></tr></thead><tbody>
  ${[['Urea (50kg)','N','₹266','Govt Fixed','₹266','High'],['DAP (50kg)','N+P','₹1,350','₹500/bag','₹850','Medium'],['MOP (50kg)','K','₹1,700','₹200/bag','₹1,500','Low'],['NPK 10:26:26','Mixed','₹1,600','₹300/bag','₹1,300','High'],['SSP (50kg)','P+S','₹450','Nil','₹450','High']].map(r=>`<tr><td class="fw-bold">${r[0]}</td><td><span class="badge badge-green">${r[1]}</span></td><td>${r[2]}</td><td class="text-sky">${r[3]}</td><td class="text-gold fw-bold">${r[4]}</td><td><span class="badge badge-${r[5]==='High'?'green':r[5]==='Low'?'red':'gold'}">${r[5]}</span></td></tr>`).join('')}
  </tbody></table></div></div></div>
  <div id="water-tab" style="display:none"><div class="two-col">
    <div class="card"><div class="card-title">💧 Irrigation Calculator</div>
      <div class="form-group"><label class="form-label">Crop</label><select class="form-select" id="irr-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Growth Stage</label><select class="form-select" id="irr-stage"><option>Germination</option><option>Vegetative</option><option>Flowering</option><option>Grain Filling</option><option>Maturity</option></select></div>
      <div class="form-group"><label class="form-label">Soil Moisture (%)</label><input class="form-input" id="irr-moisture" value="40"/></div>
      <div class="form-group"><label class="form-label">Temperature (°C)</label><input class="form-input" id="irr-temp" value="32"/></div>
      <div class="form-group"><label class="form-label">Method</label><select class="form-select" id="irr-method"><option>Drip</option><option>Sprinkler</option><option>Flood</option></select></div>
      <button class="btn btn-primary" style="width:100%" onclick="getIrrigationPlan()">💧 Calculate Water Need</button>
    </div>
    <div class="card" id="irr-result"><div class="card-title">💧 Irrigation Plan</div><div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:3rem">💧</div><p>Enter details to get water schedule</p></div></div>
  </div></div>`;
}
async function analyzeSoil(){
  const vals=['s-n','s-p','s-k','s-ph','s-rain','s-temp','s-hum'].map(id=>document.getElementById(id)?.value);
  const soilType=document.getElementById('s-type')?.value;
  const btn=document.getElementById('soil-btn'); btn.disabled=true; btn.textContent='⏳ Analyzing...';
  document.getElementById('soil-result').innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Analyzing soil...</div>';
  const result=await callAI(`Agricultural soil expert. N=${vals[0]}, P=${vals[1]}, K=${vals[2]}, pH=${vals[3]}, Rain=${vals[4]}mm, Temp=${vals[5]}°C, Humidity=${vals[6]}%, Soil=${soilType}.\nRespond ONLY with JSON:\n{"topCrops":[{"name":"Wheat","suitability":"High","expectedYield":"35 qtl/acre","estimatedRevenue":"₹79,000/acre","season":"Rabi"},{"name":"Soybean","suitability":"Medium","expectedYield":"12 qtl/acre","estimatedRevenue":"₹55,000/acre","season":"Kharif"},{"name":"Mustard","suitability":"Medium","expectedYield":"8 qtl/acre","estimatedRevenue":"₹45,000/acre","season":"Rabi"}],"npkStatus":{"N":"Deficient","P":"Adequate","K":"Adequate"},"phStatus":"Slightly Acidic","fertilizerAdvice":"Apply Urea 50kg/acre","soilHealth":"Moderate","improvements":"Add organic matter"}`);
  btn.disabled=false; btn.textContent='🤖 Get AI Crop Recommendation';
  try{
    const data=JSON.parse(result.replace(/```json|```/g,'').trim());
    const colors={'High':'green','Medium':'gold','Low':'red'};
    document.getElementById('soil-result').innerHTML=`<div class="card-title">🌱 Recommended Crops</div>${data.topCrops.map((cr,i)=>`<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px"><div class="flex-between"><span class="fw-bold">${['🥇','🥈','🥉'][i]} ${cr.name} <span style="font-size:0.8rem;color:var(--text3)">(${cr.season})</span></span><span class="badge badge-${colors[cr.suitability]||'sky'}">${cr.suitability}</span></div><div style="display:flex;gap:20px;margin-top:8px"><div><div class="text-sm">Yield</div><div class="fw-bold">${cr.expectedYield}</div></div><div><div class="text-sm">Revenue</div><div class="text-gold fw-bold">${cr.estimatedRevenue}</div></div></div></div>`).join('')}<hr class="divider"/><div class="card-title">🧪 NPK Status</div>${Object.entries(data.npkStatus).map(([k,v])=>`<div class="flex-between" style="padding:6px 0"><span>${k}</span><span class="badge badge-${v==='Adequate'?'green':v==='Deficient'?'red':'gold'}">${v}</span></div>`).join('')}<div class="notif notif-warn mt-16">💡 ${data.fertilizerAdvice}</div><div class="notif notif-info">🌿 ${data.improvements}</div>`;
  }catch{ document.getElementById('soil-result').innerHTML=`<div style="white-space:pre-wrap;font-size:0.85rem">${result}</div>`; }
}
async function getFertPlan(){
  const crop=document.getElementById('fert-crop').value; const area=document.getElementById('fert-area').value; const nStatus=document.getElementById('fert-n').value; const method=document.getElementById('fert-method').value;
  const result=document.getElementById('fert-result'); result.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Generating plan...</div>';
  const r=await callAI(`Fertilizer plan: Crop=${crop}, Area=${area} acres, N=${nStatus}, Method=${method}.\nJSON only:\n{"basal":{"urea":"50 kg/acre","dap":"25 kg/acre","mop":"10 kg/acre","totalCost":"₹2,800"},"topDressing":[{"week":"Week 3","fertilizer":"Urea 20kg/acre","purpose":"Boost growth"},{"week":"Week 7","fertilizer":"MOP 10kg/acre","purpose":"Strengthen roots"}],"totalSeasonCost":"₹4,500/acre","expectedYieldBoost":"20-25%","warnings":"Do not apply urea in waterlogged soil"}`);
  try{
    const d=JSON.parse(r.replace(/```json|```/g,'').trim());
    result.innerHTML=`<div class="card-title">📋 ${crop} Plan (${area} acres)</div><div class="notif notif-info mb-16">💰 Total: <strong>${d.totalSeasonCost}</strong> · Boost: <strong class="text-green">${d.expectedYieldBoost}</strong></div><div class="card-title" style="margin-bottom:8px">🌱 Basal Dose</div>${Object.entries(d.basal).filter(([k])=>k!=='totalCost').map(([k,v])=>`<div class="flex-between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="text-sm">${k.toUpperCase()}</span><span class="fw-bold">${v}</span></div>`).join('')}<div class="card-title" style="margin:14px 0 8px">📅 Top Dressing</div>${d.topDressing.map(t2=>`<div style="border-left:3px solid var(--gold);padding:8px 12px;margin-bottom:6px;background:var(--bg3);border-radius:0 8px 8px 0"><div class="fw-bold" style="font-size:0.85rem">${t2.week}: ${t2.fertilizer}</div><div class="text-sm">${t2.purpose}</div></div>`).join('')}<div class="notif notif-warn mt-16">⚠️ ${d.warnings}</div>`;
  }catch{ result.innerHTML=`<div style="white-space:pre-wrap;font-size:0.85rem">${r}</div>`; }
}
async function getIrrigationPlan(){
  const crop=document.getElementById('irr-crop').value; const stage=document.getElementById('irr-stage').value; const moisture=document.getElementById('irr-moisture').value; const temp=document.getElementById('irr-temp').value; const method=document.getElementById('irr-method').value;
  const result=document.getElementById('irr-result'); result.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Calculating...</div>';
  const r=await callAI(`Irrigation: Crop=${crop}, Stage=${stage}, Moisture=${moisture}%, Temp=${temp}°C, Method=${method}.\nJSON only:\n{"nextIrrigationIn":"2 days","waterRequired":"3 cm","frequency":"Every 5 days","criticalPeriods":"Flowering","weeklySchedule":[{"day":"Monday","action":"Irrigate 3cm","duration":"2 hours"},{"day":"Saturday","action":"Check moisture","duration":"If <40% irrigate"}],"waterSavingTip":"Mulching reduces need 30%","totalSeasonWater":"450 mm","status":"Adequate"}`);
  try{
    const d=JSON.parse(r.replace(/```json|```/g,'').trim()); const urgent=d.status?.toLowerCase().includes('now');
    result.innerHTML=`<div class="notif notif-${urgent?'danger':'success'} mb-16">${urgent?'🚨 Irrigate Now!':'✅ Adequate'} — ${d.status}</div>${[['⏱️ Next',d.nextIrrigationIn],['💧 Per session',d.waterRequired],['🔄 Frequency',d.frequency],['🌊 Total season',d.totalSeasonWater],['⚠️ Critical',d.criticalPeriods]].map(([k,v])=>`<div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span class="text-sm">${k}</span><span style="font-size:0.85rem;font-weight:600">${v}</span></div>`).join('')}<div class="card-title" style="margin:14px 0 8px">📅 This Week</div>${d.weeklySchedule.map(s=>`<div style="display:flex;gap:10px;padding:6px 0"><span style="min-width:80px;color:var(--gold);font-weight:600;font-size:0.82rem">${s.day}</span><div><div style="font-size:0.85rem">${s.action}</div><div class="text-sm">${s.duration}</div></div></div>`).join('')}<div class="notif notif-info mt-16">💡 ${d.waterSavingTip}</div>`;
  }catch{ result.innerHTML=`<div style="white-space:pre-wrap;font-size:0.85rem">${r}</div>`; }
}
window.analyzeSoil=analyzeSoil; window.getFertPlan=getFertPlan; window.getIrrigationPlan=getIrrigationPlan;

// ===================== CROP PLANNING =====================
function renderCropPlanning(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>🗓️ Crop Planning & Yield Prediction</h1><p>Plan your season with AI — maximize profit per acre</p></div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">Plan a New Crop</div>
      <div class="form-group"><label class="form-label">Crop</label><select class="form-select" id="cp-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Land Area (Acres)</label><input class="form-input" id="cp-area" value="5"/></div>
      <div class="form-group"><label class="form-label">Sowing Date</label><input class="form-input" id="cp-date" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
      <div class="form-group"><label class="form-label">Irrigation Type</label><select class="form-select" id="cp-irr"><option>Drip</option><option>Sprinkler</option><option>Flood</option><option>Rainfed</option></select></div>
      <div class="form-group"><label class="form-label">Budget for Inputs (₹)</label><input class="form-input" id="cp-budget" value="25000"/></div>
      <button class="btn btn-primary" style="width:100%" onclick="planCrop()">📊 Generate Crop Plan</button>
    </div>
    <div class="card" id="cp-result"><div class="card-title">📋 Crop Plan</div><div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:3rem">🌱</div><p>Fill the form and generate your plan</p></div></div>
  </div>
  <div class="card section-gap"><div class="card-title">📈 Growth Stages Timeline</div>
    <div style="display:flex;overflow-x:auto;padding-bottom:8px">
      ${['Soil Prep','Sowing','Germination','Vegetative','Flowering','Grain Fill','Maturity','Harvest'].map((s,i)=>`<div style="flex:1;min-width:90px;text-align:center;position:relative"><div style="width:32px;height:32px;border-radius:50%;background:${i<3?'var(--green-bright)':'var(--bg3)'};border:2px solid ${i<3?'var(--green-bright)':'var(--border)'};display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:0.85rem;font-weight:700;color:${i<3?'#fff':'var(--text3)'};">${i+1}</div>${i<7?`<div style="position:absolute;top:15px;left:50%;width:100%;height:2px;background:${i<2?'var(--green-bright)':'var(--border)'}"></div>`:''}<div style="font-size:0.7rem;color:${i<3?'var(--text)':'var(--text3)'};margin-top:8px;font-weight:${i<3?600:400}">${s}</div></div>`).join('')}
    </div>
  </div>`;
}
async function planCrop(){
  const crop=document.getElementById('cp-crop').value; const area=document.getElementById('cp-area').value; const budget=document.getElementById('cp-budget').value; const irr=document.getElementById('cp-irr').value;
  const result=document.getElementById('cp-result'); result.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Generating plan...</div>';
  const r=await callAI(`Crop plan: Crop=${crop}, Area=${area} acres, Budget=₹${budget}, Irrigation=${irr}, Central India.\nJSON only:\n{"yieldPrediction":"45 qtl/acre","revenue":"₹1,03,500","roi":"320%","harvestDate":"November 2025","stages":[{"week":"Week 1-2","task":"Land preparation and sowing","input":"Urea 10kg, DAP 20kg"},{"week":"Week 3-6","task":"Irrigation and weeding","input":"Water 3 times"},{"week":"Week 7-12","task":"Pest monitoring","input":"Spray if needed"},{"week":"Week 13-16","task":"Harvest preparation","input":"Stop irrigation 15 days before"}],"totalCost":"₹18,000","profitEstimate":"₹85,500","riskFactors":["Excess rain in August","Pest pressure in October"]}`);
  try{
    const d=JSON.parse(r.replace(/```json|```/g,'').trim());
    result.innerHTML=`<div class="card-title">📋 ${crop} Plan (${area} acres)</div><div class="grid-3" style="margin-bottom:16px"><div style="text-align:center;background:var(--bg3);border-radius:10px;padding:14px"><div class="text-sm">Yield</div><div style="font-size:1.2rem;font-weight:800;color:var(--green-light)">${d.yieldPrediction}</div></div><div style="text-align:center;background:var(--bg3);border-radius:10px;padding:14px"><div class="text-sm">Revenue</div><div style="font-size:1.2rem;font-weight:800;color:var(--gold)">${d.revenue}</div></div><div style="text-align:center;background:var(--bg3);border-radius:10px;padding:14px"><div class="text-sm">ROI</div><div style="font-size:1.2rem;font-weight:800;color:var(--sky)">${d.roi}</div></div></div><div class="card-title">📅 Schedule</div>${d.stages.map(s=>`<div style="border-left:3px solid var(--green-bright);padding:8px 14px;margin-bottom:8px;background:var(--bg3);border-radius:0 8px 8px 0"><div class="fw-bold" style="font-size:0.85rem">${s.week}: ${s.task}</div><div class="text-sm">${s.input}</div></div>`).join('')}<div class="notif notif-warn mt-16">⚠️ Risks: ${d.riskFactors.join(' · ')}</div><div class="flex-between mt-16"><span class="text-sm">Cost: <span class="text-red">${d.totalCost}</span></span><span class="text-sm">Profit: <span class="text-green fw-bold">${d.profitEstimate}</span></span></div>`;
  }catch{ result.innerHTML=`<div style="white-space:pre-wrap;font-size:0.85rem">${r}</div>`; }
}
window.planCrop=planCrop;

// ===================== GROWTH TRACKING =====================
function renderGrowthTracking(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>📈 Crop Growth Tracking</h1><p>Monitor your crops day by day</p></div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">Log Today's Observation</div>
      <div class="form-group"><label class="form-label">Crop</label><select class="form-select" id="gt-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Growth Stage</label><select class="form-select" id="gt-stage"><option>Germination</option><option>Seedling</option><option>Vegetative</option><option>Flowering</option><option>Grain Fill</option><option>Maturity</option></select></div>
      <div class="form-group"><label class="form-label">Plant Height (cm)</label><input class="form-input" id="gt-height" placeholder="45"/></div>
      <div class="form-group"><label class="form-label">Leaf Color</label><select class="form-select" id="gt-leaf"><option>Dark Green (Healthy)</option><option>Light Green</option><option>Yellow</option><option>Brown spots</option></select></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="gt-notes" placeholder="Observations..."></textarea></div>
      <button class="btn btn-primary" style="width:100%" onclick="logGrowth()">💾 Log Observation</button>
    </div>
    <div class="card"><div class="card-title">🛰️ Satellite Monitoring</div>
      <div class="map-placeholder" style="height:160px;margin-bottom:14px"><div style="font-size:2.5rem">🛰️</div><span>NDVI View — Hingoli Farm</span><span style="font-size:0.75rem;color:var(--green-light)">NDVI: 0.72 — Healthy</span></div>
      <div class="grid-3" style="margin-bottom:10px">${[['NDVI','0.72'],['Soil Moisture','64%'],['Canopy','78%'],['Stress','Low'],['GDD','820'],['Days to Harvest','18']].map(([l,v])=>`<div style="background:var(--bg3);border-radius:8px;padding:10px;text-align:center"><div class="text-sm">${l}</div><div style="font-weight:800;color:var(--green-light);font-size:1.1rem">${v}</div></div>`).join('')}</div>
      <div class="notif notif-success">✅ Crop health excellent. Harvest in 18 days.</div>
    </div>
  </div>
  <div class="card"><div class="card-title">📝 Growth Log</div>
    <div class="table-wrap"><table><thead><tr><th>Date</th><th>Crop</th><th>Stage</th><th>Height</th><th>Leaf</th><th>Notes</th></tr></thead>
    <tbody id="growth-log-body">${cropGrowth.length===0?'<tr><td colspan="6" style="text-align:center;color:var(--text3)">No observations yet.</td></tr>':cropGrowth.map(g=>`<tr><td>${g.date}</td><td>${g.crop}</td><td><span class="badge badge-green">${g.stage}</span></td><td>${g.height}cm</td><td>${g.leaf}</td><td>${g.notes||'—'}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}
function logGrowth(){
  const entry={date:new Date().toLocaleDateString('en-IN'),crop:document.getElementById('gt-crop').value,stage:document.getElementById('gt-stage').value,height:document.getElementById('gt-height').value||'—',leaf:document.getElementById('gt-leaf').value,notes:document.getElementById('gt-notes').value};
  cropGrowth.unshift(entry); cropGrowth=cropGrowth.slice(0,50); safeLS.set('cropGrowth',JSON.stringify(cropGrowth));
  const tbody=document.getElementById('growth-log-body');
  tbody.innerHTML=cropGrowth.map(g=>`<tr><td>${g.date}</td><td>${g.crop}</td><td><span class="badge badge-green">${g.stage}</span></td><td>${g.height}cm</td><td>${g.leaf}</td><td>${g.notes||'—'}</td></tr>`).join('');
  showToast('Observation logged ✅','success');
}
window.logGrowth=logGrowth;

// ===================== DISEASE DETECTION =====================
function renderDisease(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>🔬 Disease & Pest Detection</h1><p>Describe symptoms or upload image — AI diagnoses instantly</p></div>
  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">📸 Diagnose Your Crop</div>
      <div class="form-group"><label class="form-label">Crop</label><select class="form-select" id="d-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
      <div class="upload-area mb-16" onclick="document.getElementById('d-file').click()"><input type="file" id="d-file" accept="image/*"/><div class="upload-icon">🔍</div><p>Upload affected crop/leaf image</p></div>
      <div class="card-title">OR Describe Symptoms</div>
      <textarea class="form-textarea" id="d-symptom" placeholder="Yellow spots on leaves, white powder, holes in stems..." style="height:110px"></textarea>
      <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="detectDisease()">🔬 Diagnose with AI</button>
    </div>
    <div class="card" id="disease-result"><div class="card-title">🧫 Diagnosis Result</div><div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:3rem;margin-bottom:10px">🔍</div><p>Describe symptoms or upload image</p></div></div>
  </div>
  <div class="card section-gap"><div class="card-title">📚 Common Diseases Database</div>
    <div class="grid-2">${DISEASES.map(d=>`<div style="border:1px solid var(--border);border-radius:10px;padding:16px"><div class="flex-between mb-16"><span class="fw-bold">${d.name}</span><span class="badge badge-${d.severity==='Very High'?'red':d.severity==='High'?'gold':'sky'}">${d.severity}</span></div><div class="text-sm" style="margin-bottom:6px">🌾 Affects: ${d.crop}</div><div style="font-size:0.82rem;color:var(--text2);margin-bottom:8px">🔍 ${d.symptom}</div><div style="font-size:0.82rem;color:var(--green-light);margin-bottom:4px">💊 ${d.treatment}</div><div style="font-size:0.82rem;color:var(--sky)">🛡️ ${d.prevention}</div></div>`).join('')}</div>
  </div>`;
}
async function detectDisease(){
  const crop=document.getElementById('d-crop').value; const symptoms=document.getElementById('d-symptom').value||'visible damage on crop';
  const result=document.getElementById('disease-result'); result.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> AI diagnosing...</div>';
  const r=await callAI(`Agricultural disease expert. Crop=${crop}, Symptoms: ${symptoms}.\nJSON only:\n{"disease":"Leaf Spot Disease","type":"Fungal","severity":"Moderate","affectedPart":"Leaves","confidence":"87%","treatment":"Apply Mancozeb 75 WP at 2g/litre, spray every 7 days","organicTreatment":"Spray neem oil 5ml/litre","prevention":"Avoid overhead irrigation","yield_loss_risk":"10-25% if untreated","urgency":"Spray within 48 hours","pesticide_dosage":"2g per litre, 200 litres per acre"}`);
  try{
    const d=JSON.parse(r.replace(/```json|```/g,'').trim()); const sc=d.severity==='High'||d.severity==='Very High'?'red':d.severity==='Moderate'?'gold':'green';
    result.innerHTML=`<div class="card-title">🧫 ${d.disease}</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px"><span class="badge badge-${sc}">⚠️ ${d.severity}</span><span class="badge badge-sky">${d.type}</span><span class="badge badge-gold">${d.confidence}</span></div>${[['🌿 Affected',d.affectedPart],['💊 Treatment',d.treatment],['🌱 Organic',d.organicTreatment],['🛡️ Prevention',d.prevention],['📉 Risk',d.yield_loss_risk],['⚗️ Dosage',d.pesticide_dosage]].map(([k,v])=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div style="font-size:0.75rem;color:var(--text3)">${k}</div><div style="font-size:0.87rem">${v}</div></div>`).join('')}<div class="notif notif-danger mt-16">🚨 Action: ${d.urgency}</div>`;
  }catch{ result.innerHTML=`<div style="white-space:pre-wrap;font-size:0.85rem">${r}</div>`; }
}
window.detectDisease=detectDisease;

// ===================== WEATHER =====================
function renderWeather(){
  const c=document.getElementById('content'); const w=WEATHER;
  c.innerHTML=`
  <div class="page-header"><h1>🌤️ Weather Intelligence</h1></div>
  <div class="grid-4 section-gap">${[['🌡️ Temperature',`${w.current.temp}°C`,'Feels like 35°C','sky'],['💧 Humidity',`${w.current.humidity}%`,'Dew point 24°C','green'],['💨 Wind',`${w.current.wind} km/h`,'NW direction','purple'],['☀️ UV Index',`${w.current.uv}/10`,'High','gold']].map(([l,v,s,cl])=>`<div class="stat-card ${cl}"><div class="stat-label">${l}</div><div class="stat-val">${v}</div><div class="stat-sub">${s}</div></div>`).join('')}</div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">📅 7-Day Forecast</div>
      ${w.forecast.map(d=>`<div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-weight:600;width:70px">${d.day}</span><span style="font-size:1.4rem">${d.icon}</span><span style="color:var(--text2)">${d.low}°–${d.high}°C</span><div style="display:flex;align-items:center;gap:6px"><div class="progress-wrap" style="width:50px"><div class="progress-bar sky" style="width:${d.rain}%"></div></div><span style="font-size:0.8rem;color:var(--sky)">${d.rain}%</span></div></div>`).join('')}
    </div>
    <div class="card"><div class="card-title">🌾 Farm Advisory</div>
      <div class="notif notif-warn">${w.advisory}</div>
      <div id="weather-ai-advice"><button class="btn btn-primary mt-16" onclick="getWeatherAdvice()">🤖 Get AI Farm Advice</button></div>
    </div>
  </div>`;
}
async function getWeatherAdvice(){ const div=document.getElementById('weather-ai-advice'); div.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div></div>'; const r=await callAI(`Weather: Temp ${WEATHER.current.temp}°C, Humidity ${WEATHER.current.humidity}%, 70% rain tomorrow. Farmer grows Soybean and Cotton in Maharashtra. Give 5 specific farm actions for today and this week.`); div.innerHTML=`<div style="white-space:pre-wrap;font-size:0.87rem;color:var(--text2);line-height:1.6;margin-top:12px">${r}</div>`; }
window.getWeatherAdvice=getWeatherAdvice;

// ===================== PRICE INTEL =====================
function renderPriceIntel(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>💹 Market Intelligence</h1><p>Live prices, AI forecasts and export opportunities</p></div>
  <div class="card section-gap">
    <div class="flex-between mb-16"><div class="card-title" style="margin:0">📊 Live Mandi Prices</div><button class="wa-btn" style="padding:7px 14px;font-size:0.8rem" onclick="shareOnWhatsApp('price')">💬 Share on WhatsApp</button></div>
    <div class="table-wrap"><table><thead><tr><th>Crop</th><th>Mandi</th><th>Price (₹/Qtl)</th><th>Change</th><th>MSP</th><th>Premium</th><th>Alert</th></tr></thead><tbody>
      ${MARKET_PRICES.map(m=>{ const cr=CROPS.find(x=>x.name===m.crop); const msp=cr?.msp||null; const diff=msp?m.price-msp:null; return `<tr><td class="fw-bold">${m.crop}</td><td>${m.mandi}</td><td style="font-weight:700;color:var(--gold)">₹${m.price.toLocaleString()}</td><td class="${m.trend==='up'?'text-green':'text-red'}">${m.trend==='up'?'↑':'↓'} ₹${Math.abs(m.change)}</td><td>${msp?'₹'+msp:'—'}</td><td>${diff!==null?`<span class="${diff>=0?'text-green':'text-red'}">${diff>=0?'+':''}₹${diff}</span>`:'—'}</td><td><button class="btn btn-outline btn-sm" onclick="setPriceAlert('${m.crop}',${m.price})">🔔</button></td></tr>`; }).join('')}
    </tbody></table></div>
  </div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">📈 Price History Chart</div>
      <select class="form-select" id="ph-crop-sel" onchange="updatePriceChart()" style="max-width:200px;margin-bottom:10px">${CROPS.map(x=>`<option>${x.name}</option>`).join('')}</select>
      <div class="chart-wrap" style="height:220px"><canvas id="price-hist-chart"></canvas></div>
    </div>
    <div class="card"><div class="card-title">🔮 AI Price Forecast (30 Days)</div>
      <div class="form-group"><select class="form-select" id="pf-crop">${CROPS.map(x=>`<option>${x.name}</option>`).join('')}</select></div>
      <button class="btn btn-primary" onclick="getPriceForecast()">🤖 Generate Forecast</button>
      <div id="price-forecast-result" style="margin-top:14px"></div>
    </div>
  </div>
  <div class="card section-gap"><div class="card-title">🔔 My Price Alerts</div><div id="my-alerts-list">${renderMyAlerts()}</div></div>`;
  setTimeout(()=>updatePriceChart(),80);
}
window.updatePriceChart=function(){ const sel=document.getElementById('ph-crop-sel'); if(!sel) return; const crop=CROPS.find(x=>x.name===sel.value); if(!crop) return; makeLineChart('price-hist-chart',['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],[{label:`${crop.name} ₹/Qtl`,data:crop.price,color:'#f4a228',bg:'rgba(244,162,40,0.1)'}]); };
async function getPriceForecast(){ const crop=document.getElementById('pf-crop').value; const div=document.getElementById('price-forecast-result'); div.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div></div>'; const cd=CROPS.find(c=>c.name===crop); const r=await callAI(`Market analyst. Forecast ${crop} prices in India for next 30 days. Current: ₹${cd?.price?.slice(-1)[0]||2000}/qtl. MSP=${cd?.msp||'N/A'}. Give week-by-week prediction and sell/hold recommendation.`); div.innerHTML=`<div style="white-space:pre-wrap;font-size:0.86rem;color:var(--text2);line-height:1.6;margin-top:12px">${r}</div>`; }
window.getPriceForecast=getPriceForecast;
window.setPriceAlert=function(crop,currentPrice){ const target=prompt(`Set Price Alert — ${crop}\nCurrent: ₹${currentPrice}/qtl\nAlert when price reaches (₹/qtl):`); if(!target||isNaN(target)) return; let alerts=[]; try{ alerts=JSON.parse(safeLS.get('kio_price_alerts','[]')); }catch(e){} alerts.push({crop,target:parseInt(target),set:currentPrice,date:new Date().toLocaleDateString('en-IN')}); safeLS.set('kio_price_alerts',JSON.stringify(alerts)); addNotification(`Alert set! ${crop} @ ₹${target}/qtl`,'price','🔔 Price Alert'); const area=document.getElementById('my-alerts-list'); if(area) area.innerHTML=renderMyAlerts(); };
function renderMyAlerts(){ let alerts=[]; try{ alerts=JSON.parse(safeLS.get('kio_price_alerts','[]')); }catch(e){} if(!alerts.length) return`<div style="padding:16px;text-align:center;color:var(--text3);font-size:0.85rem">No alerts set. Click 🔔 next to any crop above.</div>`; return alerts.map((a,i)=>`<div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><span class="fw-bold">${a.crop}</span> — Alert at <span class="text-gold">₹${a.target}/qtl</span></div><button class="btn btn-outline btn-sm" style="padding:3px 8px" onclick="removeAlert(${i})">✕</button></div>`).join(''); }
window.removeAlert=function(i){ let alerts=[]; try{ alerts=JSON.parse(safeLS.get('kio_price_alerts','[]')); }catch(e){} alerts.splice(i,1); safeLS.set('kio_price_alerts',JSON.stringify(alerts)); const area=document.getElementById('my-alerts-list'); if(area) area.innerHTML=renderMyAlerts(); };

// ===================== AUCTION =====================
function renderAuction(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>🔨 Live Auction System</h1><p>Compete for the best price — transparent, real-time bidding</p></div>
  <div class="grid-3 section-gap">${AUCTIONS.map(a=>`<div class="auction-card"><div class="flex-between mb-16"><span style="font-size:2rem">${a.image}</span><span class="badge badge-${a.grade.includes('A')?'green':'gold'}">${a.grade}</span></div><div class="fw-bold" style="font-size:1.1rem">${a.crop}</div><div class="text-sm" style="margin-bottom:10px">by ${a.farmer} · ${a.qty}</div><div class="flex-between" style="margin-bottom:12px"><div><div class="text-sm">Current Bid</div><div style="font-weight:800;font-size:1.3rem;color:var(--gold)">₹${a.currentBid.toLocaleString()}</div></div><div style="text-align:right"><div class="text-sm">${a.bids} bids</div><div class="auction-timer" id="timer-${a.id}">--:--:--</div></div></div><div class="bid-row"><input class="form-input" id="bid-${a.id}" placeholder="Enter bid" type="number"/><button class="btn btn-gold btn-sm" onclick="placeBid('${a.id}')">Bid</button></div></div>`).join('')}</div>
  <div class="card"><div class="card-title">📜 Bid History</div>
    <div class="table-wrap"><table><thead><tr><th>Time</th><th>Bidder</th><th>Amount</th><th>Status</th></tr></thead><tbody>
      ${[['10:45 AM','FoodCorp India','₹4,620','Leading'],['10:42 AM','Agro Traders','₹4,600','Outbid'],['10:38 AM','VitaOil Co.','₹4,570','Outbid']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="text-gold fw-bold">${r[2]}</td><td><span class="badge badge-${r[3]==='Leading'?'green':'red'}">${r[3]}</span></td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
  AUCTIONS.forEach(a=>{ let rem=a.endsIn; const el=document.getElementById(`timer-${a.id}`); if(!el) return; if(auctionTimers[a.id]) clearInterval(auctionTimers[a.id]); const tick=()=>{ if(!document.getElementById(`timer-${a.id}`)) return clearInterval(auctionTimers[a.id]); const h=Math.floor(rem/3600),m=Math.floor((rem%3600)/60),s=rem%60; el.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; if(rem<=300) el.style.color='var(--red)'; rem--; if(rem<0){ el.textContent='ENDED'; clearInterval(auctionTimers[a.id]); } }; tick(); auctionTimers[a.id]=setInterval(tick,1000); });
}
function placeBid(auctionId){
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(!user){ openAuthModal(); showToast('Login to place a bid','warn'); return; }
  const input=document.getElementById(`bid-${auctionId}`); const auction=AUCTIONS.find(a=>a.id===auctionId); const bid=parseInt(input.value);
  if(!bid||bid<=auction.currentBid){ showToast(`Bid must be > ₹${auction.currentBid.toLocaleString()}`,'error'); return; }
  auction.currentBid=bid; auction.bids++;
  addNotification(`Your bid of ₹${bid.toLocaleString()} on ${auction.crop} is now leading!`,'deal','🔨 Bid Placed');
  renderAuction();
}
window.placeBid=placeBid;

// ===================== WAREHOUSE =====================
function renderWarehouse(){
  const c=document.getElementById('content');
  c.innerHTML=`
  <div class="page-header"><h1>🏭 Storage & Logistics</h1><p>Find warehouses, book storage, arrange transport</p></div>
  <div class="card section-gap"><div class="card-title">🗺️ Warehouses Near You</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
      <input class="form-input" style="max-width:200px" placeholder="Your location..." value="Nagpur, MH"/>
      <select class="form-select" style="max-width:150px"><option>Within 50km</option><option>Within 20km</option></select>
      <button class="btn btn-primary" onclick="addNotification('Searching warehouses...','info','🔍 Search')">Search</button>
    </div>
    <div id="warehouse-map" style="width:100%;height:280px;background:var(--bg3);border-radius:var(--radius);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text3)">🗺️ Loading map...</div>
  </div>
  <div class="grid-3 section-gap">${WAREHOUSES.map(w=>`<div class="card" style="padding:16px"><div class="flex-between mb-16"><span class="fw-bold">${w.name}</span>${w.cold?'<span class="badge badge-sky">❄️ Cold</span>':'<span class="badge badge-gold">📦 Dry</span>'}</div><div class="text-sm" style="margin-bottom:12px">📍 ${w.city} · ${w.dist}</div>${[['Total',w.capacity],['Available',w.avail],['Rate',w.rate]].map(([k,v])=>`<div class="flex-between" style="padding:5px 0;font-size:0.83rem"><span style="color:var(--text3)">${k}</span><span>${v}</span></div>`).join('')}<div class="progress-wrap mt-16"><div class="progress-bar" style="width:${w.cold?68:45}%"></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-primary btn-sm" onclick="bookWarehouse('${w.name}')">📅 Book</button><button class="btn btn-outline btn-sm" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(w.city)}','_blank')">📍 Map</button></div></div>`).join('')}</div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">🚛 Transport Bids</div>
      <div class="form-group"><label class="form-label">From</label><input class="form-input" id="log-from" placeholder="Hingoli, Maharashtra"/></div>
      <div class="form-group"><label class="form-label">To</label><input class="form-input" id="log-to" placeholder="Nagpur Market"/></div>
      <div class="form-group"><label class="form-label">Crop & Quantity</label><input class="form-input" id="log-qty" placeholder="Soybean, 50 Quintal"/></div>
      <button class="btn btn-primary" onclick="getTransportBids()">🤖 Get Transport Bids</button>
      <div id="transport-result" style="margin-top:14px"></div>
    </div>
    <div class="card"><div class="card-title">🏘️ Community Storage</div>
      <div class="notif notif-info mb-16">💡 Pool storage with nearby farmers — save 40%</div>
      ${[{g:'FPO Hingoli Group',members:12,crop:'Soybean',fill:75},{g:'Wardha Wheat Farmers',members:8,crop:'Wheat',fill:50},{g:'Cotton Growers MH',members:18,crop:'Cotton',fill:30}].map(g=>`<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px"><div class="flex-between"><span class="fw-bold" style="font-size:0.9rem">${g.g}</span><span class="text-sm">${g.members} members</span></div><div class="text-sm" style="margin:4px 0">${g.crop}</div><div class="progress-wrap mt-16"><div class="progress-bar" style="width:${g.fill}%"></div></div><div class="flex-between mt-16"><span class="text-sm">${g.fill}% filled</span><button class="btn btn-primary btn-sm" onclick="addNotification('Joined ${g.g}!','success','🏘️ Group')">Join</button></div></div>`).join('')}
    </div>
  </div>`;
  setTimeout(()=>{
    if(typeof L==='undefined'){ const el=document.getElementById('warehouse-map'); if(el) el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3)">🗺️ Map requires internet.</div>'; return; }
    const mapEl=document.getElementById('warehouse-map'); if(!mapEl||mapEl._leaflet_id) return;
    const map=L.map('warehouse-map').setView([21.1458,79.0882],8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);
    const wIcon=L.divIcon({html:'<div style="background:#2d6a4f;border:2px solid #74c69d;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px">🏭</div>',className:'',iconSize:[28,28]});
    [[21.15,79.09,'NAFED Nagpur','1200 MT · ₹8/qtl/day'],[20.75,78.60,'State Agri WH Wardha','800 MT · ₹6/qtl/day'],[20.93,77.75,'CWC Amravati','3500 MT · ₹9/qtl/day']].forEach(([lat,lng,title,desc])=>{ L.marker([lat,lng],{icon:wIcon}).addTo(map).bindPopup(`<strong>${title}</strong><br/>${desc}`); });
  },200);
}
window.bookWarehouse=function(name){ let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){} if(!user){ openAuthModal(); showToast('Login to book','warn'); return; } saveToFirestore('bookings',{warehouse:name,user:user.name,date:new Date().toISOString()}); addNotification(`Booking sent: ${name}!`,'success','🏭 Booked'); };
window.getTransportBids=async function(){ const div=document.getElementById('transport-result'); if(!div) return; div.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Getting bids...</div>'; await new Promise(r=>setTimeout(r,900)); const bids=[{name:'Kumar Transport',rate:'₹3,800',time:'Same day',rating:'4.6 ⭐',best:false},{name:'Shree Logistics',rate:'₹3,400',time:'Next day',rating:'4.8 ⭐',best:true},{name:'AgriMove Express',rate:'₹4,200',time:'Same day',rating:'4.3 ⭐',best:false}]; div.innerHTML=bids.map(b=>`<div style="display:flex;align-items:center;gap:12px;border:1px solid ${b.best?'var(--green-bright)':'var(--border)'};border-radius:10px;padding:12px;margin-bottom:8px;background:${b.best?'rgba(64,145,108,0.07)':''}"><div style="flex:1"><div class="fw-bold">${b.name} ${b.best?'<span class="badge badge-green">Best</span>':''}</div><div class="text-sm">${b.time} · ${b.rating}</div></div><div class="text-gold fw-bold">${b.rate}</div><button class="btn btn-primary btn-sm" onclick="addNotification('${b.name} booked!','success','🚛 Transport')">Book</button></div>`).join(''); };

// ===================== GOVERNMENT SCHEMES — verified official links =====================
// Each scheme links to its real, official Government of India portal (verified June 2026).
const SCHEMES_OFFICIAL = [
  {
    name:'PM-KISAN Samman Nidhi', badge:'₹6,000/yr',
    desc:'Direct income support of ₹6,000/year in 3 installments to all landholding farmer families, paid straight to your bank account.',
    url:'https://pmkisan.gov.in/', urlLabel:'pmkisan.gov.in',
    deadline:'Open year-round'
  },
  {
    name:'Pradhan Mantri Fasal Bima Yojana (PMFBY)', badge:'Crop Insurance',
    desc:'Affordable crop insurance against natural calamities, pests and disease. Premium just 2% (Kharif) / 1.5% (Rabi) of sum insured.',
    url:'https://pmfby.gov.in/', urlLabel:'pmfby.gov.in',
    deadline:'Before sowing season'
  },
  {
    name:'Kisan Credit Card (via Kisan Rin Portal)', badge:'Low-interest Credit',
    desc:'Easy, single-window agricultural credit up to ₹3 lakh at subsidized 4% interest. Apply through your bank or the official Kisan Rin Portal.',
    url:'https://fasalrin.gov.in/', urlLabel:'fasalrin.gov.in',
    deadline:'Open year-round'
  },
  {
    name:'e-NAM (National Agriculture Market)', badge:'Better Price Discovery',
    desc:'Pan-India electronic trading platform connecting 1,600+ mandis — sell your produce to buyers across India, not just your local mandi.',
    url:'https://enam.gov.in/web/', urlLabel:'enam.gov.in',
    deadline:'Open year-round'
  },
  {
    name:'Soil Health Card Scheme', badge:'Free Soil Testing',
    desc:'Free soil testing covering 12 key parameters (N, P, K, pH, micronutrients) with personalized fertilizer recommendations.',
    url:'https://soilhealth.dac.gov.in/', urlLabel:'soilhealth.dac.gov.in',
    deadline:'Every 2 years'
  },
  {
    name:'All Central Schemes (MyScheme Portal)', badge:'Eligibility Finder',
    desc:'Government aggregator to check your eligibility across all central and state farmer welfare schemes in one place.',
    url:'https://www.myscheme.gov.in/search/category/Agriculture,Rural%20%26%20Environment', urlLabel:'myscheme.gov.in',
    deadline:'Open year-round'
  }
];
window.SCHEMES_OFFICIAL=SCHEMES_OFFICIAL;

// ===================== INSURANCE POLICIES (persisted, realistic) =====================
function getMyInsurancePolicies(uid){ let all=[]; try{ all=JSON.parse(safeLS.get('kio_insurance_policies','[]')); }catch(e){} return all.filter(p=>p.uid===uid); }
function saveInsurancePolicy(policy){ let all=[]; try{ all=JSON.parse(safeLS.get('kio_insurance_policies','[]')); }catch(e){} all.unshift(policy); safeLS.set('kio_insurance_policies',JSON.stringify(all.slice(0,50))); }
function renderMyInsurancePolicies(uid){
  const policies=getMyInsurancePolicies(uid);
  if(!policies.length) return `<div style="padding:16px;text-align:center;color:var(--text3);font-size:0.85rem">No active policies yet. Calculate your premium below and click "Register for PMFBY" to add one.</div>`;
  return policies.map(p=>`
    <div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
      <div class="flex-between mb-16"><span class="fw-bold">${p.crop} · ${p.area} acres</span><span class="badge badge-green">✅ ${p.status||'Active'}</span></div>
      <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:0.82rem">
        <div><span style="color:var(--text3)">Policy No.</span><div class="fw-bold text-sky">${p.policyNo}</div></div>
        <div><span style="color:var(--text3)">Sum Insured</span><div class="fw-bold">₹${p.sumInsured.toLocaleString()}</div></div>
        <div><span style="color:var(--text3)">Your Premium</span><div class="fw-bold text-gold">₹${p.farmerShare}</div></div>
        <div><span style="color:var(--text3)">Season</span><div class="fw-bold">${p.season}</div></div>
        <div><span style="color:var(--text3)">Issued</span><div class="fw-bold">${p.date}</div></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-outline btn-sm" onclick="window.open('https://pmfby.gov.in/','_blank')">📄 View on PMFBY Portal</button>
        <button class="btn btn-outline btn-sm" onclick="reportCropLoss('${p.policyNo}')" style="border-color:var(--red);color:var(--red)">🚨 Report Crop Loss</button>
      </div>
    </div>`).join('');
}
window.reportCropLoss=function(policyNo){ addNotification(`Loss intimation for policy ${policyNo} submitted. A loss assessor will be appointed within 48 hours, per PMFBY guidelines. Helpline: 14447.`,'warn','🚨 Loss Reported'); };

// ===================== EXPERT CONSULTATION (booking persisted) =====================
const EXPERTS=[
  {id:'exp1',name:'Dr. Anil Sharma',role:'Soil & Agronomy Expert',exp:'18 yrs',qualification:'PhD Agronomy, IARI New Delhi',available:'Today 4:00 PM',rate:'Free (Govt. KVK)',lang:'Hindi, Marathi, English'},
  {id:'exp2',name:'Dr. Priya Nair',role:'Plant Pathologist',exp:'12 yrs',qualification:'PhD Plant Pathology, TNAU',available:'Tomorrow 10:00 AM',rate:'₹200/session',lang:'English, Tamil, Hindi'},
  {id:'exp3',name:'CA Suresh Mehta',role:'Farm Finance Advisor',exp:'10 yrs',qualification:'Chartered Accountant, NABARD empanelled',available:'Available Now',rate:'Free (PM Scheme)',lang:'Hindi, Gujarati, English'},
  {id:'exp4',name:'Dr. Ramesh Verma',role:'Horticulture Expert',exp:'15 yrs',qualification:'PhD Horticulture, PAU Ludhiana',available:'Wed 11:00 AM',rate:'₹300/session',lang:'Punjabi, Hindi, English'},
  {id:'exp5',name:'Dr. Kavita Reddy',role:'Entomologist (Pest Control)',exp:'9 yrs',qualification:'PhD Entomology, ANGRAU',available:'Today 6:00 PM',rate:'₹150/session',lang:'Telugu, English, Hindi'}
];
window.EXPERTS=EXPERTS;
function getMyExpertBookings(uid){ let all=[]; try{ all=JSON.parse(safeLS.get('kio_expert_bookings','[]')); }catch(e){} return all.filter(b=>b.uid===uid); }
function saveExpertBooking(b){ let all=[]; try{ all=JSON.parse(safeLS.get('kio_expert_bookings','[]')); }catch(e){} all.unshift(b); safeLS.set('kio_expert_bookings',JSON.stringify(all.slice(0,50))); }
window.bookExpert=function(expId){
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(!user){ openAuthModal(); showToast('Login to book a consultation','warn'); return; }
  const exp=EXPERTS.find(e=>e.id===expId); if(!exp) return;
  const topic=prompt(`Briefly describe your question for ${exp.name} (${exp.role}):`);
  if(!topic||!topic.trim()) return;
  const booking={id:'CONS-'+Date.now(),uid:user.uid,farmerName:user.name,expertId:exp.id,expertName:exp.name,role:exp.role,slot:exp.available,rate:exp.rate,topic,status:'Scheduled',date:new Date().toLocaleDateString('en-IN')};
  saveExpertBooking(booking); saveToFirestore('expert_bookings',booking);
  addNotification(`Consultation booked with ${exp.name} (${exp.available}). They'll call you on your registered number.`,'success','👨‍⚕️ Booking Confirmed','community');
  const area=document.getElementById('my-expert-bookings'); if(area) area.innerHTML=renderMyExpertBookings(user.uid);
};
function renderMyExpertBookings(uid){
  const bookings=getMyExpertBookings(uid);
  if(!bookings.length) return `<div style="padding:14px;text-align:center;color:var(--text3);font-size:0.82rem">No consultations booked yet.</div>`;
  return bookings.map(b=>`<div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><div class="fw-bold" style="font-size:0.85rem">${b.expertName} <span class="text-sm">(${b.role})</span></div><div class="text-sm">${b.topic}</div><div class="text-sm" style="color:var(--text3)">${b.slot} · ${b.date}</div></div><span class="badge badge-sky">${b.status}</span></div>`).join('');
}
window.renderMyExpertBookings=renderMyExpertBookings;

// ===================== COMMUNITY FORUM (persisted posts + replies) =====================
function getForumPosts(){
  let posts=[]; try{ posts=JSON.parse(safeLS.get('kio_forum_posts','null')); }catch(e){}
  if(!posts){
    posts=[
      {id:'p1',user:'Lakshmi D.',state:'Andhra Pradesh',time:Date.now()-7200000,q:'Soybean leaves turning yellow from the bottom up — is this nitrogen deficiency or root rot? Used DAP 2 weeks ago.',replies:[{user:'Dr. Anil Sharma (Expert)',time:Date.now()-6000000,text:'Bottom-up yellowing after waterlogged days usually points to root rot, not N deficiency. Check soil drainage and roots for blackening first.'},{user:'Suresh K.',time:Date.now()-3600000,text:'Had the same issue last Kharif. Improved after I added gypsum and stopped irrigation for 4 days.'}],likes:8},
      {id:'p2',user:'Suresh K.',state:'Punjab',time:Date.now()-18000000,q:'Which MSP procurement agents are reliable in Ludhoke mandi, Ludhiana this season?',replies:[{user:'Gopal Y.',time:Date.now()-14400000,text:'PUNGRAIN and MARKFED both procured on time for me last year. Avoid unregistered local agents.'}],likes:5},
      {id:'p3',user:'Gopal Y.',state:'Uttar Pradesh',time:Date.now()-86400000,q:'Applied for drip irrigation subsidy under PMKSY 3 months ago — no update. How do I check claim status?',replies:[{user:'CA Suresh Mehta (Expert)',time:Date.now()-72000000,text:'Check status on your state horticulture department portal using your application ID, or call the Kisan Call Centre at 1800-180-1551 — they can escalate stuck applications.'}],likes:3}
    ];
    safeLS.set('kio_forum_posts',JSON.stringify(posts));
  }
  return posts;
}
function saveForumPosts(posts){ safeLS.set('kio_forum_posts',JSON.stringify(posts)); }
window.getForumPosts=getForumPosts;

// ===================== FINANCE & SCHEMES =====================
function renderFinance(){
  const c=document.getElementById('content');
  const user=window.currentUser;
  c.innerHTML=`
  <div class="page-header"><h1>💰 Finance, Schemes & Insurance</h1><p>Government schemes, loans, insurance and equipment rental</p></div>
  <div class="grid-3 section-gap">
    <div class="stat-card green"><div class="stat-icon">🏛️</div><div class="stat-label">PM-KISAN Annual</div><div class="stat-val">₹6,000</div><div class="stat-sub">In 3 installments</div></div>
    <div class="stat-card gold"><div class="stat-icon">💳</div><div class="stat-label">KCC Credit Limit</div><div class="stat-val">₹3 Lakh</div><div class="stat-sub">At 4% interest</div></div>
    <div class="stat-card sky"><div class="stat-icon">🛡️</div><div class="stat-label">Crop Insurance</div><div class="stat-val">94%</div><div class="stat-sub">PMFBY Coverage</div></div>
  </div>
  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'schemes-tab')">🏛️ Govt Schemes</button>
    <button class="tab" onclick="switchTab(this,'insurance-tab')">🛡️ Crop Insurance</button>
    <button class="tab" onclick="switchTab(this,'equipment-tab')">🚜 Equipment Rental</button>
    <button class="tab" onclick="switchTab(this,'planner-tab')">📊 Financial Planner</button>
  </div>
  <div id="schemes-tab">
    <div class="notif notif-info section-gap">🔗 All links below go directly to the official Government of India portal for that scheme — verified and bookmark-safe.</div>
    <div class="grid-2 section-gap">${SCHEMES_OFFICIAL.map(s=>`<div style="border:1px solid var(--border);border-radius:10px;padding:16px"><div class="flex-between mb-16"><span class="fw-bold">${s.name}</span><span class="badge badge-green">${s.badge}</span></div><p style="font-size:0.83rem;color:var(--text2);margin-bottom:10px">${s.desc}</p><div class="flex-between" style="flex-wrap:wrap;gap:8px"><span class="text-sm">Deadline: <span class="text-gold">${s.deadline}</span></span><a class="btn btn-primary btn-sm" href="${s.url}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">🔗 Apply on ${s.urlLabel}</a></div></div>`).join('')}</div>
    <div class="card section-gap"><div class="card-title">📞 Helplines for Scheme Queries</div>
      ${[['Kisan Call Centre','1800-180-1551','All scheme queries, free 24/7'],['PM-KISAN Helpline','155261 / 011-24300606','PM-KISAN status & grievances'],['PMFBY Insurance Helpline','14447','Crop insurance & claims'],['eNAM Helpline','1800-270-0224','Marketplace & trading support']].map(([n,num,d])=>`<div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)"><div><div class="fw-bold" style="font-size:0.85rem">${n}</div><div class="text-sm">${d}</div></div><span class="text-gold fw-bold">${num}</span></div>`).join('')}
    </div>
  </div>
  <div id="insurance-tab" style="display:none">
    <div class="two-col section-gap">
      <div class="card"><div class="card-title">🛡️ Crop Insurance Calculator (PMFBY)</div>
        <div class="form-group"><label class="form-label">Crop</label><select class="form-select" id="ins-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Area (Acres)</label><input class="form-input" id="ins-area" value="5"/></div>
        <div class="form-group"><label class="form-label">Sum Insured (₹/acre)</label><input class="form-input" id="ins-val" value="50000"/></div>
        <button class="btn btn-primary" style="width:100%" onclick="calcInsurance()">🧮 Calculate Premium</button>
        <div id="ins-result" style="margin-top:14px"></div>
      </div>
      <div class="card"><div class="card-title">📋 PMFBY Key Features</div>
        ${[['Premium Rate','Kharif: 2% | Rabi: 1.5% | Commercial: 5%'],['Coverage','Sowing to post-harvest (incl. 14 days post-harvest drying)'],['Claim Process','Report loss within 72 hrs via app/portal/helpline 14447'],['Eligibility','All farmers & sharecroppers, loanee and non-loanee'],['Documents','Land records, bank passbook, Aadhaar'],['Official Portal','pmfby.gov.in']].map(([k,v])=>`<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div style="font-size:0.75rem;color:var(--text3)">${k}</div><div style="font-size:0.87rem;margin-top:2px">${v}</div></div>`).join('')}
        <a class="btn btn-primary" style="width:100%;margin-top:14px;text-decoration:none;display:flex;justify-content:center" href="https://pmfby.gov.in/" target="_blank" rel="noopener">🔗 Go to Official PMFBY Portal</a>
      </div>
    </div>
    <div class="card section-gap"><div class="card-title">📄 My Insurance Policies</div><div id="my-insurance-policies">${user?renderMyInsurancePolicies(user.uid):'<div style="padding:16px;text-align:center;color:var(--text3)">Login to view your policies.</div>'}</div></div>
  </div>
  <div id="equipment-tab" style="display:none">
    <div class="card section-gap"><div class="card-title">🚜 Equipment Rental Marketplace</div>
      <div class="grid-3">
        ${[{name:'Tractor (55HP)',owner:'Ramesh, 5km',rate:'₹800/hr',avail:'Today',rating:'4.8 ⭐',img:'🚜'},{name:'Combine Harvester',owner:'State Agency',rate:'₹2,500/hr',avail:'Book 3 days ahead',rating:'4.5 ⭐',img:'🌾'},{name:'Rotavator',owner:'Suresh, 8km',rate:'₹600/hr',avail:'Today',rating:'4.7 ⭐',img:'⚙️'},{name:'Power Sprayer',owner:'FPO Hingoli',rate:'₹300/hr',avail:'Tomorrow',rating:'4.6 ⭐',img:'💦'},{name:'Thresher',owner:'Gopal, 12km',rate:'₹400/hr',avail:'Available',rating:'4.4 ⭐',img:'🏭'},{name:'Mini Tractor (25HP)',owner:'Lakshmi, 3km',rate:'₹500/hr',avail:'Today',rating:'4.9 ⭐',img:'🚜'}].map(e=>`<div class="card" style="padding:16px"><div style="font-size:2.5rem;margin-bottom:10px">${e.img}</div><div class="fw-bold" style="margin-bottom:4px">${e.name}</div><div class="text-sm" style="margin-bottom:4px">👤 ${e.owner}</div><div class="text-sm" style="margin-bottom:4px">${e.rating}</div><div style="color:var(--green-light);font-size:0.82rem;margin-bottom:8px">${e.avail}</div><div class="text-gold fw-bold" style="margin-bottom:10px">${e.rate}</div><button class="btn btn-primary btn-sm" style="width:100%" onclick="bookEquipment('${e.name}','${e.owner}')">📅 Book</button></div>`).join('')}
      </div>
      <div class="card mt-16"><div class="card-title">📋 My Equipment Bookings</div><div id="equipment-bookings">${renderEquipmentBookings()}</div></div>
    </div>
  </div>
  <div id="planner-tab" style="display:none">
    <div class="two-col section-gap">
      <div class="card"><div class="card-title">📊 AI Financial Planner</div>
        <div class="form-group"><label class="form-label">Monthly Income (₹)</label><input class="form-input" id="fp-income" value="15000"/></div>
        <div class="form-group"><label class="form-label">Monthly Expenses (₹)</label><input class="form-input" id="fp-expense" value="8000"/></div>
        <div class="form-group"><label class="form-label">Loan EMI (₹)</label><input class="form-input" id="fp-emi" value="2000"/></div>
        <div class="form-group"><label class="form-label">Primary Crop</label><select class="form-select" id="fp-crop">${CROPS.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Land (Acres)</label><input class="form-input" id="fp-land" value="5"/></div>
        <button class="btn btn-primary" style="width:100%" onclick="getFinancialPlan()">🤖 Generate Financial Plan</button>
      </div>
      <div class="card" id="fp-result"><div class="card-title">💡 Your Financial Plan</div><div style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:3rem">📊</div><p>Fill the form and generate your plan</p></div></div>
    </div>
  </div>`;
}
function calcInsurance(){
  const area=parseFloat(document.getElementById('ins-area').value)||5; const val=parseFloat(document.getElementById('ins-val').value)||50000; const crop=document.getElementById('ins-crop').value;
  const total=area*val; const isKharif=['Rice','Cotton','Sugarcane','Soybean','Maize','Tomato','Onion','Chilli','Turmeric','Banana'].includes(crop);
  const rate=isKharif?0.02:0.015; const fullPremium=total*rate; const farmerShare=fullPremium*0.5;
  window._lastInsuranceCalc={crop,area,sumInsured:total,farmerShare:farmerShare.toFixed(0),season:isKharif?'Kharif':'Rabi'};
  document.getElementById('ins-result').innerHTML=`<div class="notif notif-success"><div><div class="fw-bold">PMFBY Insurance Calculation</div><div style="margin-top:8px;font-size:0.85rem"><div>Sum Insured: <strong>₹${total.toLocaleString()}</strong></div><div>Premium Rate: <strong>${(rate*100)}%</strong> (${isKharif?'Kharif':'Rabi'})</div><div>Your Share (50%): <span style="color:var(--green-light);font-size:1rem;font-weight:700">₹${farmerShare.toFixed(0)}</span></div></div></div></div><button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="registerForPMFBY()">📝 Register for PMFBY</button><a class="btn btn-outline" style="width:100%;margin-top:8px;text-decoration:none;display:flex;justify-content:center" href="https://pmfby.gov.in/" target="_blank" rel="noopener">🔗 Official PMFBY Portal</a>`;
}
window.registerForPMFBY=function(){
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(!user){ openAuthModal(); showToast('Login to register a policy','warn'); return; }
  const calc=window._lastInsuranceCalc;
  if(!calc){ showToast('Calculate your premium first','warn'); return; }
  const policy={
    uid:user.uid, policyNo:'PMFBY-'+Math.floor(100000+Math.random()*900000),
    crop:calc.crop, area:calc.area, sumInsured:calc.sumInsured, farmerShare:calc.farmerShare, season:calc.season,
    status:'Active', date:new Date().toLocaleDateString('en-IN')
  };
  saveInsurancePolicy(policy); saveToFirestore('insurance_policies',policy);
  addNotification(`PMFBY policy ${policy.policyNo} registered for ${policy.crop}! Complete final KYC at pmfby.gov.in within 7 days.`,'success','🛡️ Policy Registered','finance');
  const area2=document.getElementById('my-insurance-policies'); if(area2) area2.innerHTML=renderMyInsurancePolicies(user.uid);
  showToast('Policy registered! Visit pmfby.gov.in to complete KYC.','success');
};
async function getFinancialPlan(){
  const income=document.getElementById('fp-income').value; const expense=document.getElementById('fp-expense').value; const emi=document.getElementById('fp-emi').value; const crop=document.getElementById('fp-crop').value; const land=document.getElementById('fp-land').value;
  const result=document.getElementById('fp-result'); result.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Generating plan...</div>';
  const r=await callAI(`Financial advisor for Indian farmer. Income=₹${income}/month, Expenses=₹${expense}/month, EMI=₹${emi}/month, Crop=${crop}, Land=${land} acres. Give practical advice: savings plan, schemes to apply for, ways to increase farm income.`);
  result.innerHTML=`<div class="card-title">💡 Your Financial Plan</div><div style="white-space:pre-wrap;font-size:0.87rem;color:var(--text2);line-height:1.7">${r}</div><hr class="divider"/><div class="grid-3"><div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div class="text-sm">Monthly Savings</div><div style="font-weight:800;color:var(--green-light)">₹${Math.max(0,parseInt(income)-parseInt(expense)-parseInt(emi)).toLocaleString()}</div></div><div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div class="text-sm">Savings Rate</div><div style="font-weight:800;color:var(--gold)">${Math.max(0,Math.round(((parseInt(income)-parseInt(expense)-parseInt(emi))/parseInt(income))*100))}%</div></div><div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div class="text-sm">KCC Eligible</div><div style="font-weight:800;color:var(--sky)">Yes ✅</div></div></div>`;
}
function renderEquipmentBookings(){ let bookings=[]; try{ bookings=JSON.parse(safeLS.get('kio_equip_bookings','[]')); }catch(e){} if(!bookings.length) return`<div style="padding:16px;text-align:center;color:var(--text3)">No equipment booked yet.</div>`; return bookings.slice(0,3).map(b=>`<div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div><div class="fw-bold" style="font-size:0.85rem">${b.name}</div><div class="text-sm">${b.date}</div></div><span class="badge badge-green">Booked</span></div>`).join(''); }
window.bookEquipment=function(name,owner){ let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){} if(!user){ openAuthModal(); showToast('Login to book equipment','warn'); return; } const booking={name,owner,date:new Date().toLocaleDateString('en-IN'),id:Date.now()}; let arr=[]; try{ arr=JSON.parse(safeLS.get('kio_equip_bookings','[]')); }catch(e){} arr.unshift(booking); safeLS.set('kio_equip_bookings',JSON.stringify(arr.slice(0,10))); addNotification(`${name} booked from ${owner}!`,'success','🚜 Equipment Booked'); const area=document.getElementById('equipment-bookings'); if(area) area.innerHTML=renderEquipmentBookings(); };
window.calcInsurance=calcInsurance; window.getFinancialPlan=getFinancialPlan;

// ===================== COMMUNITY =====================
function renderCommunity(){
  const c=document.getElementById('content');
  const user=window.currentUser;
  c.innerHTML=`
  <div class="page-header"><h1>👥 Community, Experts & Knowledge Hub</h1></div>
  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'chat-tab')">🤖 AI Assistant</button>
    <button class="tab" onclick="switchTab(this,'expert-tab')">👨‍⚕️ Expert Consultation</button>
    <button class="tab" onclick="switchTab(this,'forum-tab')">💬 Community Forum</button>
    <button class="tab" onclick="switchTab(this,'knowledge-tab')">📚 Knowledge Hub</button>
  </div>
  <div id="chat-tab">
    <div class="two-col section-gap">
      <div class="card"><div class="card-title">🤖 KrishiOS AI Farm Assistant</div>
        <div class="chat-wrap">
          <div class="chat-messages" id="chat-msgs">
            <div class="msg ai"><div class="msg-label">KrishiOS AI</div>${currentLang==='hi'?'नमस्ते! मैं आपका AI खेत सहायक हूँ। 🌾':'Namaste! I am your AI farm assistant. Ask me anything. 🌾'}</div>
          </div>
          <div class="chat-input-row">
            <input class="form-input" id="chat-input" placeholder="Ask in English or Hindi..." onkeydown="if(event.key==='Enter')sendChat()"/>
            <button class="btn btn-primary" onclick="sendChat()">Send</button>
            <button class="btn btn-outline" onclick="startVoice()" title="Voice">🎤</button>
          </div>
        </div>
      </div>
      <div class="card"><div class="card-title">💡 Quick Questions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${['What is the best soybean variety?','How to register for PM-KISAN?','Treatment for wheat rust disease?','How to get drip irrigation subsidy?','What is today\'s onion market price?'].map(q=>`<button class="btn btn-outline btn-sm" style="text-align:left;white-space:normal;height:auto;padding:8px 12px;font-size:0.8rem" onclick="setQuestion('${q.replace(/'/g,"\\'")}')">${q}</button>`).join('')}
        </div>
        <hr class="divider"/>
        <div class="card-title">📞 Kisan Helplines</div>
        ${[['Kisan Call Centre','1800-180-1551','Free 24/7'],['PM-KISAN Helpline','155261','Scheme queries'],['PMFBY Insurance','14447','Crop insurance'],['Agri Market eNAM','1800-270-0224','Price queries']].map(([name,num,desc])=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between"><span class="fw-bold" style="font-size:0.82rem">${name}</span><span class="text-gold fw-bold">${num}</span></div><div class="text-sm">${desc}</div></div>`).join('')}
      </div>
    </div>
  </div>
  <div id="expert-tab" style="display:none">
    <div class="two-col section-gap">
      <div class="card"><div class="card-title">👨‍⚕️ Book a Consultation</div>
        ${EXPERTS.map(e=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:10px"><div style="width:44px;height:44px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">👨‍⚕️</div><div style="flex:1"><div class="fw-bold">${e.name}</div><div class="text-sm">${e.role} · ${e.exp}</div><div class="text-sm" style="color:var(--text3)">${e.qualification}</div><div class="text-sm" style="color:var(--text3)">🗣️ ${e.lang}</div><div style="color:var(--green-light);font-size:0.8rem;margin-top:2px">${e.available}</div></div><div style="text-align:right"><div style="font-size:0.8rem;margin-bottom:6px">${e.rate}</div><button class="btn btn-primary btn-sm" onclick="bookExpert('${e.id}')">Book</button></div></div>`).join('')}
      </div>
      <div class="card"><div class="card-title">📋 My Consultations</div>
        <div id="my-expert-bookings">${user?renderMyExpertBookings(user.uid):'<div style="padding:14px;text-align:center;color:var(--text3)">Login to book and track consultations.</div>'}</div>
        <hr class="divider"/>
        <div class="notif notif-info">💡 Experts call you back on your registered mobile number at the slot shown. Keep your phone reachable.</div>
      </div>
    </div>
  </div>
  <div id="forum-tab" style="display:none">
    <div class="two-col section-gap">
      <div class="card"><div class="card-title">💬 Community Forum</div>
        <button class="btn btn-primary btn-sm" style="margin-bottom:14px" onclick="postForumQuestion()">+ Ask Community</button>
        <div id="forum-posts">${renderForumPosts()}</div>
      </div>
      <div class="card"><div class="card-title">📊 Community Stats</div>
        ${[['Active Farmers',FARMERS.length+getRegisteredFarmers().length+' registered'],['Active Buyers',getRegisteredBuyers().length+' registered'],['Active Listings',JSON.parse(safeLS.get('kio_listings','[]')).length+' live'],['Forum Discussions',getForumPosts().length+' threads'],['Experts Online',EXPERTS.length]].map(([k,v])=>`<div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span class="text-sm">${k}</span><span class="fw-bold text-gold">${v}</span></div>`).join('')}
        <div class="notif notif-info mt-16">📢 Turmeric & Onion demand surging this quarter.</div>
      </div>
    </div>
  </div>
  <div id="knowledge-tab" style="display:none">
    <div class="two-col section-gap">
      <div class="card"><div class="card-title">📚 Knowledge Hub</div>
        ${[{title:'Soybean Disease Management 2024',type:'Video · 12 min',rating:'⭐ 4.8'},{title:'Drip Irrigation Setup Guide',type:'PDF · 8 pages',rating:'⭐ 4.9'},{title:'PM-KISAN Registration Step by Step',type:'Video · 5 min',rating:'⭐ 5.0'},{title:'Understanding MSP and How to Get It',type:'Article',rating:'⭐ 4.6'},{title:'Organic Farming — How to Start',type:'PDF · 12 pages',rating:'⭐ 4.8'}].map(item=>`<div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="addNotification('Opening: ${item.title.substring(0,30)}...','info','📚 Knowledge')"><div style="flex:1"><div style="font-size:0.9rem;font-weight:500">${item.title}</div><div class="text-sm">${item.type}</div></div><div class="text-sm">${item.rating}</div></div>`).join('')}
      </div>
      <div class="card"><div class="card-title">🎤 Voice Assistant</div>
        <div class="notif notif-info" style="margin-bottom:14px">📱 Ask questions by voice. Works best in Chrome browser.</div>
        <button class="btn btn-primary" style="width:100%;margin-bottom:14px" onclick="startVoice()">🎤 Start Voice Assistant</button>
        <div id="voice-status" style="margin-bottom:14px"></div>
        <hr class="divider"/>
        <div class="card-title">📻 Kisan Suvidha Helpline</div>
        <div class="notif notif-info">Call <strong>1551</strong> for voice-based farm advisory in your local language. Available 24/7.</div>
      </div>
    </div>
  </div>`;
}
function setQuestion(q){ const input=document.getElementById('chat-input'); if(input){ input.value=q; sendChat(); } }

// Render forum posts with their replies — pulled from persisted store
function renderForumPosts(){
  const posts=getForumPosts();
  return posts.map(p=>`
    <div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:32px;height:32px;border-radius:50%;background:var(--green-mid);display:flex;align-items:center;justify-content:center">👨‍🌾</div><div><div style="font-weight:600;font-size:0.85rem">${p.user}</div><div class="text-sm">${p.state} · ${timeAgo(p.time)}</div></div></div>
      <div class="fw-bold" style="font-size:0.9rem;margin-bottom:8px">${p.q}</div>
      ${p.replies&&p.replies.length?`<div style="background:var(--bg3);border-radius:8px;padding:10px;margin-bottom:8px">${p.replies.map(r=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between"><span class="fw-bold" style="font-size:0.8rem;color:${r.user.includes('Expert')?'var(--green-light)':'var(--text)'}">${r.user}</span><span class="text-sm">${timeAgo(r.time)}</span></div><div style="font-size:0.8rem;color:var(--text2);margin-top:2px">${r.text}</div></div>`).join('')}</div>`:''}
      <div style="display:flex;gap:12px">
        <button class="btn btn-outline btn-sm" onclick="toggleReplyBox('${p.id}')">💬 ${(p.replies||[]).length} Replies</button>
        <button class="btn btn-outline btn-sm" onclick="likeForumPost('${p.id}')">❤️ ${p.likes} Likes</button>
      </div>
      <div id="reply-box-${p.id}" style="display:none;margin-top:8px;gap:8px;display:none">
        <input class="form-input" id="reply-input-${p.id}" placeholder="Write a reply..." onkeydown="if(event.key==='Enter')submitForumReply('${p.id}')"/>
        <button class="btn btn-primary btn-sm mt-16" style="width:100%" onclick="submitForumReply('${p.id}')">Reply</button>
      </div>
    </div>`).join('');
}
window.toggleReplyBox=function(id){ const box=document.getElementById(`reply-box-${id}`); if(box) box.style.display=box.style.display==='none'?'block':'none'; };
window.submitForumReply=function(id){
  const input=document.getElementById(`reply-input-${id}`); if(!input) return;
  const text=input.value.trim(); if(!text) return;
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  const posts=getForumPosts(); const post=posts.find(p=>p.id===id); if(!post) return;
  post.replies=post.replies||[];
  post.replies.push({user:user?user.name:'Guest Farmer',time:Date.now(),text});
  saveForumPosts(posts);
  const area=document.getElementById('forum-posts'); if(area) area.innerHTML=renderForumPosts();
  showToast('Reply posted','success');
};
window.likeForumPost=function(id){
  const posts=getForumPosts(); const post=posts.find(p=>p.id===id); if(!post) return;
  post.likes=(post.likes||0)+1; saveForumPosts(posts);
  const area=document.getElementById('forum-posts'); if(area) area.innerHTML=renderForumPosts();
};
function postForumQuestion(){
  const q=prompt('Enter your question for the community:');
  if(!q||!q.trim()) return;
  let user=null; try{ user=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  const posts=getForumPosts();
  posts.unshift({id:'p'+Date.now(),user:user?user.name:'Guest Farmer',state:user&&user.role==='farmer'?(getRegisteredFarmers().find(f=>f.uid===user.uid)?.state||'India'):'India',time:Date.now(),q,replies:[],likes:0});
  saveForumPosts(posts);
  const areaEl=document.getElementById('forum-posts'); if(areaEl) areaEl.innerHTML=renderForumPosts();
  addNotification('Your question posted to community!','success','💬 Forum');
}
async function sendChat(){
  const input=document.getElementById('chat-input'); const msgs=document.getElementById('chat-msgs');
  const text=input.value.trim(); if(!text) return; input.value='';
  msgs.innerHTML+=`<div class="msg user">${text}</div>`;
  msgs.innerHTML+=`<div class="msg ai" id="ai-thinking-msg"><div class="msg-label">KrishiOS AI</div><div class="loading-dots"><span></span><span></span><span></span></div></div>`;
  msgs.scrollTop=msgs.scrollHeight;
  chatHistory.push({role:'user',content:text});
  const systemContext=`You are KrishiOS — an AI assistant for Indian farmers. Answer in clear, practical language. Today: ${new Date().toLocaleDateString('en-IN')}. If asked in Hindi, respond in Hindi.`;
  const response=await callAI(chatHistory.map(m=>m.content).join('\n\n'),systemContext);
  const thinkEl=document.getElementById('ai-thinking-msg');
  if(thinkEl) thinkEl.outerHTML=`<div class="msg ai"><div class="msg-label">KrishiOS AI</div>${response}</div>`;
  chatHistory.push({role:'assistant',content:response});
  if(chatHistory.length>20) chatHistory=chatHistory.slice(-20);
  msgs.scrollTop=msgs.scrollHeight;
}
function startVoice(){
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){ showToast('Voice not supported — use Chrome','warn'); return; }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; const rec=new SR();
  rec.lang=currentLang==='hi'?'hi-IN':'en-IN';
  const statusEl=document.getElementById('voice-status');
  if(statusEl) statusEl.innerHTML='<div class="notif notif-info">🎤 Listening...</div>';
  showToast('🎤 Listening...','info');
  rec.onresult=e=>{ const transcript=e.results[0][0].transcript; const input=document.getElementById('chat-input'); if(input){ input.value=transcript; sendChat(); } if(statusEl) statusEl.innerHTML=`<div class="notif notif-success">Heard: "${transcript}"</div>`; };
  rec.onerror=()=>{ showToast('Voice error — try again','error'); if(statusEl) statusEl.innerHTML=''; };
  rec.start();
}
window.sendChat=sendChat; window.startVoice=startVoice; window.postForumQuestion=postForumQuestion; window.setQuestion=setQuestion;

// ===================== ADMIN =====================
function renderAdmin(){
  const c=document.getElementById('content');
  const regFarmers=getRegisteredFarmers();
  const regBuyers=getRegisteredBuyers();
  const allFarmers=[...FARMERS,...regFarmers];
  let allListings=[]; try{ allListings=JSON.parse(safeLS.get('kio_listings','[]')); }catch(e){}
  let allOrders=[]; try{ allOrders=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){}
  const pendingCount=allOrders.filter(o=>o.status==='Pending Farmer Confirmation').length;
  const confirmedCount=allOrders.filter(o=>o.status==='Confirmed — Awaiting Payment').length;
  const paidCount=allOrders.filter(o=>o.status==='Paid').length;

  c.innerHTML=`
  <div class="page-header"><h1>⚙️ Admin Dashboard</h1><p>Platform overview, analytics, supply chain and management</p></div>
  <div class="grid-4 section-gap">
    <div class="stat-card green"><div class="stat-label">Total Farmers</div><div class="stat-val">${allFarmers.length}</div><div class="stat-sub">${regFarmers.length} newly registered</div></div>
    <div class="stat-card gold"><div class="stat-label">Total Buyers</div><div class="stat-val">${regBuyers.length}</div><div class="stat-sub">Registered on platform</div></div>
    <div class="stat-card sky"><div class="stat-label">Active Listings</div><div class="stat-val">${allListings.length}</div><div class="stat-sub">Live crop listings</div></div>
    <div class="stat-card purple"><div class="stat-label">Total Orders</div><div class="stat-val">${allOrders.length}</div><div class="stat-sub">${pendingCount} pending · ${confirmedCount} confirmed · ${paidCount} paid</div></div>
  </div>
  <div class="three-col section-gap">
    <div class="card"><div class="card-title">📊 Listings by State</div><div class="chart-wrap"><canvas id="state-chart"></canvas></div></div>
    <div class="card"><div class="card-title">💰 Revenue by Month</div><div class="chart-wrap"><canvas id="admin-rev-chart"></canvas></div></div>
    <div class="card"><div class="card-title">🥧 Crop Split</div><div class="chart-wrap"><canvas id="admin-crop-chart"></canvas></div></div>
  </div>

  ${allOrders.length>0?`
  <div class="card section-gap"><div class="card-title">📦 Orders (${allOrders.length})</div>
    <div class="table-wrap"><table><thead><tr><th>Order ID</th><th>Crop</th><th>Buyer</th><th>Seller</th><th>Qty</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>
      ${allOrders.slice(0,10).map(p=>{
        const statusColor=p.status==='Paid'?'green':p.status==='Confirmed — Awaiting Payment'?'sky':p.status==='Declined by Farmer'?'red':'gold';
        return `<tr><td class="fw-bold text-sky" style="font-size:0.8rem">${p.id}</td><td>${p.crop}</td><td>${p.buyer||'—'}</td><td>${p.farmerName||'—'}</td><td>${p.qty} Qtl</td><td class="text-gold fw-bold">₹${p.amount?.toLocaleString()}</td><td class="text-sm">${p.date}</td><td><span class="badge badge-${statusColor}">${p.status}</span></td></tr>`;
      }).join('')}
    </tbody></table></div>
  </div>`:
  `<div class="card section-gap"><div class="card-title">📦 Orders</div><div style="padding:30px;text-align:center;color:var(--text3)">No orders yet. When buyers request to purchase crops, orders will appear here.</div></div>`}

  <div class="two-col section-gap">
    <div class="card"><div class="card-title">👨‍🌾 All Farmers (${allFarmers.length})</div>
      <div class="flex-between mb-16">
        <input class="form-input" style="max-width:220px" placeholder="Search farmers..." oninput="adminSearchFarmer(this.value)"/>
        <button class="wa-btn" style="padding:6px 12px;font-size:0.8rem" onclick="addNotification('WhatsApp broadcast sent!','success','💬 Broadcast')">💬 Notify All</button>
      </div>
      <div class="table-wrap" id="admin-farmer-table">${adminFarmerTable(allFarmers)}</div>
    </div>
    <div class="card"><div class="card-title">🛒 All Buyers (${regBuyers.length})</div>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Crops</th><th>Volume</th><th>Payment</th></tr></thead><tbody>
        ${regBuyers.map(b=>`<tr><td class="fw-bold">${b.name}</td><td>${b.businessType||'—'}</td><td style="font-size:0.82rem">${b.crops||'—'}</td><td>${b.volume?b.volume+' Qtl':'—'}</td><td style="font-size:0.82rem">${b.paymentTerms||'—'}</td></tr>`).join('')}
        ${regBuyers.length===0?'<tr><td colspan="5" style="text-align:center;color:var(--text3)">No buyers registered yet</td></tr>':''}
      </tbody></table></div>
    </div>
  </div>

  <div class="two-col section-gap">
    <div class="card"><div class="card-title">📋 Active Crop Listings (${allListings.length})</div>
      <div class="table-wrap"><table><thead><tr><th>Crop</th><th>Farmer</th><th>Qty</th><th>Price</th><th>Grade</th><th>Date</th></tr></thead><tbody>
        ${allListings.slice(0,8).map(l=>`<tr><td class="fw-bold">${l.crop}</td><td>${l.farmer}</td><td>${l.qty} Qtl</td><td class="text-gold">₹${l.price}/qtl</td><td><span class="badge badge-${(l.grade||'B').includes('A')?'green':'gold'}">${l.grade||'B'}</span></td><td class="text-sm">${l.date}</td></tr>`).join('')}
        ${allListings.length===0?'<tr><td colspan="6" style="text-align:center;color:var(--text3)">No listings yet</td></tr>':''}
      </tbody></table></div>
    </div>
    <div class="card"><div class="card-title">🛡️ Platform Health</div>
      ${[['Server Uptime','99.8%','green'],['Registered Farmers',allFarmers.length,'sky'],['Registered Buyers',regBuyers.length,'gold'],['Active Listings',allListings.length,'green'],['Orders Awaiting Confirmation',pendingCount,'gold'],['Completed (Paid) Orders',paidCount,'sky']].map(([k,v,cl])=>`<div class="flex-between" style="padding:9px 0;border-bottom:1px solid var(--border)"><span class="text-sm">${k}</span><span class="fw-bold" style="color:var(--${cl==='green'?'green-light':cl==='gold'?'gold':cl==='red'?'red':'sky'})">${v}</span></div>`).join('')}
    </div>
  </div>`;
  setTimeout(()=>{
    if(typeof Chart==='undefined') return;
    makeBarChart('state-chart',['MH','UP','PB','MP','GJ','RJ','KA','AP'],[{label:'Listings %',data:[45,38,32,28,22,18,15,12],colors:['#40916c','#40916c','#40916c','#40916c','#74c69d','#74c69d','#74c69d','#74c69d']}]);
    makeLineChart('admin-rev-chart',['Jan','Feb','Mar','Apr','May','Jun'],[{label:'Revenue ₹L',data:[32,38,29,44,41,52],color:'#f4a228',bg:'rgba(244,162,40,0.1)'}]);
    makeDoughnutChart('admin-crop-chart',['Wheat','Rice','Soybean','Cotton','Others'],[28,22,18,16,16],['#40916c','#0ea5e9','#f4a228','#8b5cf6','#74c69d']);
  },80);
}
function adminFarmerTable(farmers){ return `<table><thead><tr><th>Farmer</th><th>State</th><th>Crop</th><th>Land</th><th>Badge</th><th>Status</th></tr></thead><tbody>${farmers.map(f=>`<tr><td><div class="fw-bold">${f.name}</div><div class="text-sm">${f.village||f.district||'—'}</div></td><td>${f.state||'—'}</td><td style="font-size:0.82rem">${(f.crops||[f.crop]).join?.(', ')||f.crop||'—'}</td><td>${f.land||'—'} ac</td><td><span class="badge badge-${f.badge==='Premium'?'gold':'sky'}">${f.badge||'Verified'}</span></td><td><span class="badge badge-green">Active</span></td></tr>`).join('')}</tbody></table>`; }
function adminSearchFarmer(q){ const allFarmers=[...FARMERS,...getRegisteredFarmers()]; const filtered=allFarmers.filter(f=>f.name.toLowerCase().includes(q.toLowerCase())||((f.state||'').toLowerCase().includes(q.toLowerCase()))||((f.crops||[f.crop]).join?.(' ')||'').toLowerCase().includes(q.toLowerCase())); const el=document.getElementById('admin-farmer-table'); if(el) el.innerHTML=adminFarmerTable(filtered.length?filtered:allFarmers); }
window.adminFarmerTable=adminFarmerTable; window.adminSearchFarmer=adminSearchFarmer;

// ===================== ONLINE/OFFLINE =====================
window.updateOnlineStatus=function(){ const banner=document.getElementById('offline-banner'); const badge=document.getElementById('live-badge'); if(navigator.onLine){ if(banner) banner.style.display='none'; if(badge) badge.textContent='🟢 Live'; document.body.style.paddingTop=''; } else { if(banner){ banner.style.display='block'; document.body.style.paddingTop='36px'; } if(badge) badge.innerHTML='<span class="offline-chip">📶 Offline</span>'; showToast('You are offline.','warn'); } };
window.addEventListener('online',updateOnlineStatus); window.addEventListener('offline',updateOnlineStatus);

// ===================== PWA =====================
let _dip=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); _dip=e; if(!document.getElementById('pwa-banner')){ const b=document.createElement('div'); b.id='pwa-banner'; b.innerHTML=`<span style="font-size:1.4rem">🌾</span><p>Install KrishiOS on your phone!</p><button class="btn btn-primary btn-sm" onclick="installPWA()">Install</button><button class="btn btn-outline btn-sm" onclick="this.parentElement.remove()">✕</button>`; document.body.appendChild(b); b.style.display='flex'; } });
window.installPWA=async function(){ if(!_dip){ showToast('Open in Chrome to install','info'); return; } _dip.prompt(); const{outcome}=await _dip.userChoice; if(outcome==='accepted') addNotification('KrishiOS installed! 🎉','success','📱 Installed'); _dip=null; document.getElementById('pwa-banner')?.remove(); };
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// ===================== ONE-TIME DATA REPAIR =====================
// A prior version of saveToFirestore unconditionally re-wrote a second copy of records that
// callers (orders, listings, farmer/buyer registration, expert bookings, insurance policies)
// had already saved directly — producing "ghost" duplicates with a different, often malformed
// id (no 'ORD-' prefix etc.) but otherwise identical data. This repairs any data already
// corrupted by that bug before the app renders anything, by collapsing entries that share every
// field except id/time-of-write, keeping the first (earliest, most likely correctly-IDed) one.
function dedupeStorageKey(key, identityFields){
  let arr=[]; try{ arr=JSON.parse(safeLS.get(key,'[]')); }catch(e){ return; }
  if(!Array.isArray(arr)||arr.length<2) return;
  const seen=new Set(); const result=[];
  arr.forEach(item=>{
    const sig=identityFields.map(f=>item?.[f]).join('|');
    if(seen.has(sig)) return; // drop the duplicate ghost copy
    seen.add(sig);
    result.push(item);
  });
  if(result.length!==arr.length) safeLS.set(key,JSON.stringify(result));
}
function repairDuplicateRecords(){
  // status is deliberately excluded from the purchases signature: if a person already actioned
  // one of the two ghost duplicates (e.g. clicked Confirm), that copy's status diverges from its
  // sibling's, but they're still the same underlying order and must collapse to one record.
  // When statuses differ, the more "advanced" one is kept (Paid > Confirmed > Pending > Declined).
  let purchases=[]; try{ purchases=JSON.parse(safeLS.get('kio_purchases','[]')); }catch(e){ purchases=null; }
  if(Array.isArray(purchases)&&purchases.length>1){
    const rank={'Paid':3,'Confirmed — Awaiting Payment':2,'Pending Farmer Confirmation':1,'Declined by Farmer':1};
    const byKey=new Map();
    purchases.forEach(p=>{
      const sig=['crop','farmerName','buyer','amount','qty','date'].map(f=>p?.[f]).join('|');
      const existing=byKey.get(sig);
      if(!existing||(rank[p.status]||0)>(rank[existing.status]||0)) byKey.set(sig,p);
    });
    const deduped=[...byKey.values()];
    if(deduped.length!==purchases.length) safeLS.set('kio_purchases',JSON.stringify(deduped));
  }
  dedupeStorageKey('kio_listings',['crop','farmer','qty','price','date']);
  dedupeStorageKey('kio_reg_farmers',['uid']);
  dedupeStorageKey('kio_reg_buyers',['uid']);
  dedupeStorageKey('kio_expert_bookings',['expertId','uid','topic']);
  dedupeStorageKey('kio_insurance_policies',['policyNo']);
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded',()=>{
  repairDuplicateRecords();

  let u=null; try{ u=JSON.parse(safeLS.get('kio_user','null')); }catch(e){}
  if(u){ window.currentUser=u; updateUIForUser(u); }

  document.querySelectorAll('[data-i18n]').forEach(el=>{ const v=t(el.getAttribute('data-i18n')); if(v) el.textContent=v; });
  if(currentLang==='hi'){ document.body.className='lang-hi'; const lb=document.getElementById('lang-btn'); if(lb) lb.textContent='En/हि'; }

  updateNotifBadge();
  updateOnlineStatus();

  document.getElementById('auth-modal')?.addEventListener('click',e=>{ if(e.target.id==='auth-modal') closeAuthModal(); });
  document.addEventListener('click',e=>{
    const panel=document.getElementById('notif-panel');
    if(panel&&panel.style.display==='block'&&!panel.contains(e.target)&&!e.target.closest('[onclick*="openNotifications"]')) panel.style.display='none';
  });

  setInterval(()=>{
    let alerts=[]; try{ alerts=JSON.parse(safeLS.get('kio_price_alerts','[]')); }catch(e){}
    alerts.forEach(a=>{ const live=MARKET_PRICES.find(m=>m.crop===a.crop); if(live&&live.price>=a.target) addNotification(`${a.crop} hit ₹${live.price}/qtl — sell now!`,'price','🔔 Price Alert','price-intel'); });
  },30000);

  showPage('dashboard');
});
