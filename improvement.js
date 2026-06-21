// ╔══════════════════════════════════════════════════════════════╗
// ║  KrishiOS  improvements.js  v2                              ║
// ╚══════════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────────────────────────
// 0. OPENROUTER KEY — set ONCE here, works everywhere
// ─────────────────────────────────────────────────────────────
const OPENROUTER_API_KEY = 'YOUR_OPENROUTER_API_KEY'; // ← replace with your own key from openrouter.ai
const AI_MODEL = 'meta-llama/llama-3.1-8b-instruct'; // paid, ~$0.02/1M tokens, no rate limit issue
window._callAIImpl = async function(prompt, systemPrompt = '') {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY') {
    return '⚠️ Add your OpenRouter API key in improvements.js line 5. Free at openrouter.ai';
  }
  try {
    const messages = [];
    if (systemPrompt) messages.push({ role:'system', content: systemPrompt });
    messages.push({ role:'user', content: prompt });
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'KrishiOS'
      },
      body: JSON.stringify({ model: AI_MODEL, messages, max_tokens: 800 })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      return `AI Error ${res.status}: ${err?.error?.message || res.statusText}`;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
  } catch(e) {
    return `AI Error: ${e.message}`;
  }
};

// ─────────────────────────────────────────────────────────────
// 1. LANGUAGE — full page re-render on toggle
// ─────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('kio_lang') || 'en';

const L10N = {
  en: {
    // nav
    nav_platform:'Platform', nav_dashboard:'Dashboard', nav_register:'Registration',
    nav_crop_lib:'Crop Library', nav_ai_quality:'AI Quality Grader', nav_market:'Marketplace',
    nav_farm_intel:'Farm Intelligence', nav_soil:'Soil Analysis', nav_plan:'Crop Planning',
    nav_growth:'Growth Tracking', nav_disease:'Disease Detection', nav_weather:'Weather',
    nav_market_fin:'Market & Finance', nav_price:'Market Intelligence', nav_auction:'Auction System',
    nav_warehouse:'Storage & Logistics', nav_finance:'Finance & Schemes',
    nav_community:'Community', nav_comm:'Community & Experts', nav_admin:'Admin Dashboard',
    // page strings
    dashboard_title:'🌾 KrishiOS — Agricultural Operating System',
    dashboard_sub:'AI-powered platform to maximize farmer profits and eliminate middlemen',
    active_crops:'Active Crops', revenue:'Revenue This Month', active_buyers:'Active Buyers',
    yield_pred:'Yield Prediction', quick_actions:'🚀 Quick Actions',
    grade_crop:'📸 Grade My Crop', sell_now:'🛒 Sell Now', plan_season:'🌾 Plan Season',
    check_disease:'🔬 Check Disease', market_price:'💹 Market Price', find_storage:'🏭 Find Storage',
    notifications:'📢 Notifications', leaderboard:'🏆 Farmer Quality Leaderboard',
    sell_tab:'➕ Sell My Crop', browse_tab:'🔍 Browse Crops',
    list_crop_title:'📸 List Your Crop with Photo',
    crop_label:'Crop', qty_label:'Quantity (Quintal)', price_label:'Asking Price (₹/Qtl)',
    grade_label:'Grade', delivery_label:'Delivery Option', desc_label:'Description',
    photo_label:'Crop Photo', list_btn:'📢 List Crop for Sale',
    ai_grade_btn:'🤖 AI Grade My Photo',
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
    dashboard_sub:'AI आधारित प्लेटफ़ॉर्म — किसानों का मुनाफ़ा बढ़ाएं, बिचौलियों को हटाएं',
    active_crops:'सक्रिय फसलें', revenue:'इस महीने की आय', active_buyers:'सक्रिय खरीदार',
    yield_pred:'उपज अनुमान', quick_actions:'🚀 त्वरित कार्य',
    grade_crop:'📸 फसल जाँचें', sell_now:'🛒 अभी बेचें', plan_season:'🌾 मौसम योजना',
    check_disease:'🔬 रोग जाँचें', market_price:'💹 बाज़ार भाव', find_storage:'🏭 भंडारण खोजें',
    notifications:'📢 सूचनाएं', leaderboard:'🏆 किसान गुणवत्ता सूची',
    sell_tab:'➕ फसल बेचें', browse_tab:'🔍 फसलें देखें',
    list_crop_title:'📸 फसल फोटो के साथ लिस्ट करें',
    crop_label:'फसल', qty_label:'मात्रा (क्विंटल)', price_label:'मांग मूल्य (₹/क्विंटल)',
    grade_label:'ग्रेड', delivery_label:'डिलीवरी विकल्प', desc_label:'विवरण',
    photo_label:'फसल की फोटो', list_btn:'📢 फसल बिक्री पर लगाएं',
    ai_grade_btn:'🤖 AI से ग्रेड जाँचें',
  }
};

function t(key) { return (L10N[currentLang] || L10N.en)[key] || (L10N.en)[key] || key; }

window.toggleLang = function() {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  localStorage.setItem('kio_lang', currentLang);
  // update sidebar data-i18n spans
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  // update lang button
  const lb = document.getElementById('lang-btn');
  if (lb) lb.textContent = currentLang === 'en' ? 'हि/En' : 'En/हि';
  document.body.className = currentLang === 'hi' ? 'lang-hi' : '';
  // re-render current page so all content translates
  showPage(window.currentPage || 'dashboard');
  addNotification(currentLang === 'hi' ? 'भाषा हिंदी में बदली ✅' : 'Language changed to English ✅', 'success');
};

// ─────────────────────────────────────────────────────────────
// 2. NOTIFICATION SYSTEM — real app-style drawer
// ─────────────────────────────────────────────────────────────
const NOTIF_STORE = JSON.parse(localStorage.getItem('kio_notifs') || 'null') || [
  { id:1, type:'deal',    icon:'💰', title:'New Buyer Offer', body:'FoodCorp offering ₹4,720/qtl for your Soybean Grade A', time: Date.now()-300000,  read:false, action:'marketplace' },
  { id:2, type:'price',   icon:'📈', title:'Price Alert', body:'Turmeric rose to ₹11,200/qtl — above your alert target', time: Date.now()-3600000, read:false, action:'price-intel' },
  { id:3, type:'scheme',  icon:'🏛️', title:'PM-KISAN Installment', body:'₹2,000 installment releases in 12 days. Make sure details are updated', time: Date.now()-7200000, read:false, action:'finance' },
  { id:4, type:'weather', icon:'🌧️', title:'Rain Alert', body:'Heavy rain expected Thursday. Postpone harvest by 2 days', time: Date.now()-86400000, read:true,  action:'weather' },
  { id:5, type:'deal',    icon:'🛒', title:'Bulk Order Available', body:'Agro Traders needs 500 Qtl Wheat at ₹2,350/qtl — deadline June 15', time: Date.now()-90000000, read:true, action:'marketplace' },
  { id:6, type:'disease', icon:'🔬', title:'Disease Risk Alert', body:'Leaf rust reported in Hingoli district. Check your wheat crop', time: Date.now()-172800000, read:true, action:'disease' },
];

function saveNotifs() { localStorage.setItem('kio_notifs', JSON.stringify(NOTIF_STORE)); }

function addNotification(body, type='info', title='KrishiOS', action='dashboard') {
  const icons = { success:'✅', error:'❌', info:'ℹ️', warn:'⚠️', deal:'💰', price:'📈', scheme:'🏛️', weather:'🌧️', disease:'🔬' };
  NOTIF_STORE.unshift({ id: Date.now(), type, icon: icons[type]||'🔔', title, body, time: Date.now(), read:false, action });
  if (NOTIF_STORE.length > 30) NOTIF_STORE.pop();
  saveNotifs();
  updateNotifBadge();
  showToast(body, type);
}

function updateNotifBadge() {
  const unread = NOTIF_STORE.filter(n=>!n.read).length;
  const cnt = document.getElementById('notif-count');
  if (cnt) { cnt.textContent = unread > 0 ? (unread > 9 ? '9+' : unread) : ''; cnt.style.display = unread > 0 ? 'flex' : 'none'; }
}

function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

window.openNotifications = function() {
  let panel = document.getElementById('notif-panel');
  if (panel.style.display !== 'none') { panel.style.display='none'; return; }

  const unread = NOTIF_STORE.filter(n=>!n.read).length;
  const typeColors = { deal:'var(--gold)', price:'var(--green-light)', scheme:'var(--sky)', weather:'#fb923c', disease:'var(--red)', success:'var(--green-light)', info:'var(--sky)', warn:'var(--gold)', error:'var(--red)' };

  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <span style="font-weight:700;font-size:1rem">🔔 Notifications ${unread>0?`<span style="background:var(--red);color:#fff;border-radius:20px;padding:1px 7px;font-size:0.7rem;font-weight:700;margin-left:4px">${unread}</span>`:''}</span>
      <div style="display:flex;gap:6px">
        <button style="background:none;border:none;color:var(--green-light);font-size:0.75rem;cursor:pointer;font-weight:600" onclick="markAllRead()">Mark all read</button>
        <button style="background:none;border:none;color:var(--text3);font-size:1rem;cursor:pointer;padding:0 4px" onclick="document.getElementById('notif-panel').style.display='none'">✕</button>
      </div>
    </div>
    <div style="display:flex;gap:0;padding:8px 12px;border-bottom:1px solid var(--border)">
      ${['All','Deals','Price','Weather','Scheme'].map((f,i)=>`<button onclick="filterNotifs('${f.toLowerCase()}')" style="background:${i===0?'var(--green-mid)':'none'};border:none;color:${i===0?'#fff':'var(--text3)'};padding:4px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:600" class="notif-filter-btn">${f}</button>`).join('')}
    </div>
    <div id="notif-list-inner" style="max-height:380px;overflow-y:auto">
      ${renderNotifList(NOTIF_STORE)}
    </div>
    <div style="padding:10px 14px;border-top:1px solid var(--border);text-align:center">
      <button style="background:none;border:none;color:var(--text3);font-size:0.78rem;cursor:pointer" onclick="clearAllNotifs()">🗑️ Clear all notifications</button>
    </div>`;

  panel.style.display = 'block';
  updateNotifBadge();
};

function renderNotifList(notifs) {
  if (!notifs.length) return '<div style="padding:30px;text-align:center;color:var(--text3)">No notifications</div>';
  const typeColors = { deal:'var(--gold)', price:'var(--green-light)', scheme:'var(--sky)', weather:'#fb923c', disease:'var(--red)', success:'var(--green-light)', info:'var(--sky)', warn:'var(--gold)', error:'var(--red)' };
  return notifs.map(n=>`
    <div onclick="clickNotif(${n.id})" style="display:flex;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(45,90,62,0.3);cursor:pointer;background:${!n.read?'rgba(64,145,108,0.06)':'transparent'};transition:background 0.15s" onmouseover="this.style.background='rgba(64,145,108,0.1)'" onmouseout="this.style.background='${!n.read?'rgba(64,145,108,0.06)':'transparent'}'">
      <div style="width:38px;height:38px;border-radius:50%;background:${typeColors[n.type]||'var(--green-mid)'}22;border:1.5px solid ${typeColors[n.type]||'var(--green-bright)'};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">${n.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
          <span style="font-weight:${n.read?'500':'700'};font-size:0.85rem;color:var(--text)">${n.title}</span>
          <span style="font-size:0.7rem;color:var(--text3);white-space:nowrap;flex-shrink:0">${timeAgo(n.time)}</span>
        </div>
        <div style="font-size:0.78rem;color:var(--text2);margin-top:2px;line-height:1.4">${n.body}</div>
      </div>
      ${!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:var(--green-bright);flex-shrink:0;margin-top:5px"></div>':''}
    </div>`).join('');
}

window.filterNotifs = function(filter) {
  document.querySelectorAll('.notif-filter-btn').forEach((b,i) => {
    b.style.background = b.textContent.toLowerCase()===filter||( filter==='all'&&i===0) ? 'var(--green-mid)':'none';
    b.style.color = b.textContent.toLowerCase()===filter||(filter==='all'&&i===0) ? '#fff':'var(--text3)';
  });
  const filtered = filter==='all' ? NOTIF_STORE : NOTIF_STORE.filter(n=>n.type===filter||n.type.includes(filter));
  const inner = document.getElementById('notif-list-inner');
  if (inner) inner.innerHTML = renderNotifList(filtered);
};

window.markAllRead = function() {
  NOTIF_STORE.forEach(n => n.read=true);
  saveNotifs(); updateNotifBadge(); openNotifications();
};

window.clearAllNotifs = function() {
  NOTIF_STORE.length = 0;
  saveNotifs(); updateNotifBadge();
  document.getElementById('notif-panel').style.display = 'none';
};

window.clickNotif = function(id) {
  const n = NOTIF_STORE.find(x=>x.id===id);
  if (!n) return;
  n.read = true; saveNotifs(); updateNotifBadge();
  document.getElementById('notif-panel').style.display = 'none';
  if (n.action) showPage(n.action);
};

// ─────────────────────────────────────────────────────────────
// 3. TOAST — proper slide-in, stacked, dismiss on click
// ─────────────────────────────────────────────────────────────
function showToast(msg, type='info') {
  let tc = document.getElementById('toast-container');
  if (!tc) { tc = document.createElement('div'); tc.id='toast-container'; document.body.appendChild(tc); }
  const icons = { success:'✅', error:'❌', info:'ℹ️', warn:'⚠️', deal:'💰', price:'📈' };
  const colors = { success:'var(--green-bright)', error:'var(--red)', info:'var(--sky)', warn:'var(--gold)' };
  const t2 = document.createElement('div');
  t2.className = `toast ${type}`;
  t2.style.borderLeftColor = colors[type]||'var(--sky)';
  t2.innerHTML = `<span style="flex-shrink:0">${icons[type]||'ℹ️'}</span><span style="flex:1">${msg}</span><button style="background:none;border:none;color:var(--text3);cursor:pointer;padding:0;font-size:1rem;line-height:1" onclick="this.parentElement.remove()">✕</button>`;
  t2.onclick = () => t2.remove();
  tc.appendChild(t2);
  setTimeout(() => { t2.style.opacity='0'; t2.style.transform='translateX(120%)'; setTimeout(()=>t2.remove(), 400); }, 4000);
}
// alias so all old code still works
window.toast = showToast;

// ─────────────────────────────────────────────────────────────
// 4. FARMER CROP SELL FLOW — photo upload + AI grade + listing
// ─────────────────────────────────────────────────────────────
// Override renderMarketplace to inject the full sell-with-photo flow
const _origMarket = window.renderMarketplace;
window.renderMarketplace = function() {
  const c = document.getElementById('content');
  const sellTabLabel = t('sell_tab');
  const browseTabLabel = t('browse_tab');
  c.innerHTML = `
  <div class="page-header"><h1>🛒 ${currentLang==='hi'?'सीधा बाज़ार':'Direct Marketplace'}</h1><p>${currentLang==='hi'?'सीधे बेचें — कोई बिचौलिया नहीं':'Buy and sell directly — no middlemen, fair prices'}</p></div>
  <div class="tabs">
    <button class="tab active" onclick="switchTab(this,'mp-browse')">${browseTabLabel}</button>
    <button class="tab" onclick="switchTab(this,'mp-sell')">${sellTabLabel}</button>
    <button class="tab" onclick="switchTab(this,'mp-bulk')">📦 ${currentLang==='hi'?'बल्क ऑर्डर':'Bulk Orders'}</button>
    <button class="tab" onclick="switchTab(this,'mp-matching')">🤝 ${currentLang==='hi'?'खरीदार मिलान':'Buyer Matching'}</button>
  </div>

  <div id="mp-browse">
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px">
      <input class="form-input" style="max-width:220px" placeholder="🔍 ${currentLang==='hi'?'फसल खोजें':'Search crops...'}"/>
      <select class="form-select" style="max-width:150px"><option>${currentLang==='hi'?'सभी ग्रेड':'All Grades'}</option><option>Grade A+</option><option>Grade A</option><option>Grade B</option></select>
      <select class="form-select" style="max-width:160px"><option>${currentLang==='hi'?'सभी राज्य':'All States'}</option><option>Maharashtra</option><option>Punjab</option><option>UP</option><option>MP</option></select>
    </div>
    <div class="grid-3">
      ${FARMERS.flatMap((f,fi)=> f.crops.map((crop,ci)=>{
        const cd = CROPS.find(x=>x.name===crop)||{msp:2000,emoji:'🌾',price:[2000]};
        const price = cd.price[cd.price.length-1];
        const grades=['A','A+','B','A']; const qtys=[50,120,30,80];
        const g=grades[(fi+ci)%4]; const qty=qtys[(fi+ci)%4];
        return `<div class="card">
          <div class="flex-between mb-16"><div style="font-size:2rem">${cd.emoji||'🌾'}</div><span class="badge badge-${g.includes('A')?'green':'gold'}">Grade ${g}</span></div>
          <div style="font-weight:700;font-size:1.05rem">${crop}</div>
          <div style="color:var(--text3);font-size:0.82rem;margin-bottom:10px">${currentLang==='hi'?'किसान':'by'} ${f.name} · ${f.village}, ${f.state}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <div><div class="text-sm">${currentLang==='hi'?'मूल्य':'Price'}</div><div style="font-weight:700;color:var(--gold)">₹${price.toLocaleString()}/qtl</div></div>
            <div><div class="text-sm">${currentLang==='hi'?'उपलब्ध':'Available'}</div><div style="font-weight:700">${qty} Qtl</div></div>
            <div><div class="text-sm">${currentLang==='hi'?'रेटिंग':'Rating'}</div><div style="font-weight:700">⭐ ${f.rating}</div></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="razorpay-btn" style="flex:1;justify-content:center;padding:8px 10px;font-size:0.8rem" onclick="initiatePayment('${crop}',${price*qty},'${f.name}')">💳 ${currentLang==='hi'?'खरीदें':'Buy'} ₹${(price*qty/1000).toFixed(0)}k</button>
            <button class="btn btn-outline btn-sm" onclick="showPage('auction')">🔨</button>
            <button class="wa-btn btn-sm" style="padding:7px 10px" onclick="contactSellerWA('${f.name}','${crop}',${price})">💬</button>
          </div>
        </div>`;
      })).join('')}
    </div>
  </div>

  <!-- ══ SELL WITH PHOTO TAB ══ -->
  <div id="mp-sell" style="display:none">
    <div class="two-col">
      <!-- LEFT: Photo Upload + AI Grade -->
      <div class="card">
        <div class="card-title">${t('list_crop_title')}</div>
        <div class="form-group"><label class="form-label">${t('crop_label')}</label>
          <select class="form-select" id="sell-crop">${CROPS.map(x=>`<option>${x.name}</option>`).join('')}</select>
        </div>
        <!-- Photo upload area -->
        <div class="form-group">
          <label class="form-label">${t('photo_label')}</label>
          <div class="sell-photo-area" id="sell-photo-area" onclick="document.getElementById('sell-photo-input').click()"
            ondragover="event.preventDefault();this.classList.add('drag')"
            ondragleave="this.classList.remove('drag')"
            ondrop="handleSellPhotoDrop(event)">
            <input type="file" id="sell-photo-input" accept="image/*" style="display:none" onchange="handleSellPhotoSelect(event)"/>
            <div id="sell-photo-placeholder">
              <div style="font-size:2.5rem;margin-bottom:8px">📷</div>
              <div style="font-weight:600;margin-bottom:4px">${currentLang==='hi'?'फोटो खींचें या क्लिक करें':'Click or drag crop photo here'}</div>
              <div style="font-size:0.75rem;color:var(--text3)">JPG, PNG up to 10MB</div>
            </div>
            <img id="sell-photo-preview" style="display:none;width:100%;border-radius:8px;max-height:200px;object-fit:cover"/>
          </div>
        </div>
        <button class="btn btn-outline" style="width:100%;margin-bottom:14px" id="ai-grade-btn" onclick="aiGradeSellPhoto()" disabled>
          ${t('ai_grade_btn')}
        </button>
        <!-- AI Grade Result badge — hidden until graded -->
        <div id="sell-grade-result" style="display:none;border:1px solid var(--green-bright);border-radius:10px;padding:14px;margin-bottom:14px;background:rgba(64,145,108,0.07)">
          <div style="display:flex;align-items:center;gap:12px">
            <div id="sell-grade-circle" style="width:56px;height:56px;border-radius:50%;border:3px solid var(--green-bright);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;font-family:var(--font-display);flex-shrink:0"></div>
            <div style="flex:1">
              <div id="sell-grade-label" style="font-weight:700;font-size:1rem"></div>
              <div id="sell-grade-details" style="font-size:0.8rem;color:var(--text2);margin-top:3px"></div>
            </div>
            <div style="text-align:right"><div id="sell-grade-value" class="text-gold fw-bold" style="font-size:1.1rem"></div><div class="text-sm">Market Value</div></div>
          </div>
        </div>
        <div class="form-group"><label class="form-label">${t('qty_label')}</label><input class="form-input" id="sell-qty" placeholder="50"/></div>
        <div class="form-group"><label class="form-label">${t('price_label')}</label><input class="form-input" id="sell-price" placeholder="4600"/></div>
        <div class="form-group"><label class="form-label">${t('grade_label')}</label>
          <select class="form-select" id="sell-grade-sel"><option>A+</option><option>A</option><option selected>B</option><option>C</option></select>
        </div>
        <div class="form-group"><label class="form-label">${t('delivery_label')}</label>
          <select class="form-select"><option>${currentLang==='hi'?'खेत से उठाएं':'Farm Pickup'}</option><option>${currentLang==='hi'?'मंडी तक देंगे':'Deliver to Mandi'}</option><option>${currentLang==='hi'?'खरीदार तक देंगे':'Deliver to Buyer'}</option></select>
        </div>
        <div class="form-group"><label class="form-label">${t('desc_label')}</label>
          <textarea class="form-textarea" id="sell-desc" placeholder="${currentLang==='hi'?'ताज़ी फसल, कोई कीटनाशक नहीं...':'Freshly harvested, no pesticide residue...'}"></textarea>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="listCropForSale()">${t('list_btn')}</button>
        <button class="wa-btn" style="width:100%;margin-top:8px;justify-content:center" onclick="shareListingWA()">💬 ${currentLang==='hi'?'WhatsApp पर शेयर करें':'Share listing on WhatsApp'}</button>
      </div>
      <!-- RIGHT: Sell Now vs Store -->
      <div class="card">
        <div class="card-title">💡 ${currentLang==='hi'?'अभी बेचें या बाद में?':'Sell Now vs Store Later'}</div>
        <div class="notif notif-info mb-16">🤖 AI ${currentLang==='hi'?'सोयाबीन के लिए सुझाव':'Recommendation for Soybean'}</div>
        ${[
          [currentLang==='hi'?'अभी बेचें':'Sell Now', currentLang==='hi'?'तुरंत नकद। अभी ₹4,620/qtl':'Immediate cash. Current: ₹4,620/qtl','btn-primary',currentLang==='hi'?'✅ सुझावित':'✅ Recommended'],
          [currentLang==='hi'?'30 दिन रखें':'Store 30 Days', currentLang==='hi'?'अनुमानित ₹4,900/qtl। भंडारण ₹240/qtl':'Predicted ₹4,900/qtl. Storage ₹240/qtl','btn-outline',currentLang==='hi'?'सीमांत':'Marginal'],
          [currentLang==='hi'?'60 दिन रखें':'Store 60 Days', currentLang==='hi'?'जोखिम — ₹4,200 तक गिर सकता है':'High risk — could drop to ₹4,200/qtl','btn-danger',currentLang==='hi'?'⚠️ जोखिम':'⚠️ Risky']
        ].map(([tt,d,cls,badge])=>`
          <div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
            <div class="flex-between mb-16"><span class="fw-bold">${tt}</span><span class="badge badge-${cls==='btn-primary'?'green':cls==='btn-danger'?'red':'gold'}">${badge}</span></div>
            <p style="font-size:0.83rem;color:var(--text2);margin-bottom:10px">${d}</p>
            <button class="btn ${cls} btn-sm">${tt}</button>
          </div>`).join('')}
        <hr class="divider"/>
        <div class="card-title">${currentLang==='hi'?'📋 मेरी लिस्टिंग':'📋 My Active Listings'}</div>
        <div id="my-listings-area">
          ${renderMyListings()}
        </div>
      </div>
    </div>
  </div>

  <div id="mp-bulk" style="display:none">
    <div class="card mb-16"><div class="card-title">📦 ${currentLang==='hi'?'खरीदारों से बल्क ऑर्डर':'Active Bulk Orders from Buyers'}</div>
    <div class="table-wrap"><table><thead><tr><th>${currentLang==='hi'?'खरीदार':'Buyer'}</th><th>${currentLang==='hi'?'फसल':'Crop'}</th><th>${currentLang==='hi'?'मात्रा':'Qty'}</th><th>${currentLang==='hi'?'मूल्य':'Price'}</th><th>${currentLang==='hi'?'समयसीमा':'Deadline'}</th><th>${currentLang==='hi'?'कार्य':'Action'}</th></tr></thead>
    <tbody>${[['Agro Traders Ltd.','Wheat',500,'₹2,350/qtl','15 Jun'],['FoodCorp India','Soybean',200,'₹4,700/qtl','20 Jun'],['Spice Exports','Turmeric',80,'₹11,500/qtl','10 Jun'],['Sunrise Mills','Maize',300,'₹2,100/qtl','25 Jun']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="text-gold fw-bold">${r[3]}</td><td>${r[4]}</td><td><button class="btn btn-primary btn-sm" onclick="expressInterest('${r[0]}','${r[1]}')">Express Interest</button></td></tr>`).join('')}</tbody></table></div></div>
  </div>

  <div id="mp-matching" style="display:none">
    <div class="card">
      <div class="card-title">🤝 AI Buyer Matching</div>
      ${[{name:'Agro Traders Ltd.',type:'Trader',offer:'₹4,720/qtl',match:'97%',note:'Premium, 24hr payment'},
         {name:'Maharashtra FPO Hub',type:'FPO',offer:'₹4,680/qtl',match:'94%',note:'Bulk pickup'},
         {name:'VitaOil Processing',type:'Processor',offer:'₹4,640/qtl',match:'88%',note:'Regular buyer'},
         {name:'Export Quality Foods',type:'Exporter',offer:'₹4,850/qtl',match:'85%',note:'Grade strict'}].map(b=>`
        <div style="display:flex;align-items:center;gap:16px;padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:10px">
          <div style="text-align:center;min-width:55px"><div style="font-size:1.2rem;font-weight:800;color:var(--green-light)">${b.match}</div><div class="text-sm">Match</div></div>
          <div style="flex:1"><div class="fw-bold">${b.name}</div><div class="text-sm">${b.type} · ${b.note}</div></div>
          <div style="text-align:right">
            <div class="text-gold fw-bold">${b.offer}</div>
            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;justify-content:flex-end">
              <button class="btn btn-primary btn-sm" onclick="connectBuyer('${b.name}')">Connect</button>
              <button class="wa-btn btn-sm" onclick="contactBuyerWA('${b.name}','${b.offer}')">💬</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
};

function renderMyListings() {
  const listings = JSON.parse(localStorage.getItem('kio_listings') || '[]');
  if (!listings.length) return `<div style="padding:20px;text-align:center;color:var(--text3);font-size:0.85rem">${currentLang==='hi'?'अभी कोई लिस्टिंग नहीं':'No active listings yet'}</div>`;
  return listings.slice(0,3).map(l=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
      <div><div class="fw-bold" style="font-size:0.85rem">${l.crop} — ${l.qty} Qtl</div><div class="text-sm">₹${l.price}/qtl · <span class="badge badge-green" style="font-size:0.65rem">Live</span></div></div>
      <button class="btn btn-outline btn-sm" onclick="removeMyListing(${l.id})">✕</button>
    </div>`).join('');
}

// Photo handling
window.handleSellPhotoSelect = function(e) {
  const file = e.target.files[0];
  if (file) loadSellPhoto(file);
};
window.handleSellPhotoDrop = function(e) {
  e.preventDefault();
  document.getElementById('sell-photo-area').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadSellPhoto(file);
};

function loadSellPhoto(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('sell-photo-placeholder').style.display = 'none';
    const img = document.getElementById('sell-photo-preview');
    img.src = ev.target.result;
    img.style.display = 'block';
    // store base64 for AI
    window._sellPhotoBase64 = ev.target.result.split(',')[1];
    window._sellPhotoMime = file.type;
    // enable AI grade button
    const btn = document.getElementById('ai-grade-btn');
    if (btn) { btn.disabled = false; btn.classList.remove('btn-outline'); btn.classList.add('btn-primary'); }
  };
  reader.readAsDataURL(file);
}

window.aiGradeSellPhoto = async function() {
  const crop = document.getElementById('sell-crop')?.value || 'crop';
  const btn = document.getElementById('ai-grade-btn');
  btn.disabled = true; btn.textContent = '⏳ Grading...';

  const prompt = `You are an expert agricultural quality inspector in India. A farmer uploaded a photo of their ${crop}. Analyze it as if you can see it.
Respond ONLY with valid JSON, no markdown:
{"score":88,"grade":"A","freshness":"High","defects":"Minor surface blemishes","diseaseSymptoms":"None detected","marketValue":"₹4,800/qtl","premiumBadge":true,"recommendation":"Ready for premium listing","color":"var(--green-bright)"}`;

  const result = await callAI(prompt);
  btn.disabled = false; btn.textContent = t('ai_grade_btn');

  try {
    const d = JSON.parse(result.replace(/```json|```/g,'').trim());
    const gradeEl = document.getElementById('sell-grade-result');
    document.getElementById('sell-grade-circle').textContent = d.grade;
    document.getElementById('sell-grade-circle').style.borderColor = d.score>=85?'var(--green-bright)':d.score>=70?'var(--gold)':'var(--red)';
    document.getElementById('sell-grade-label').textContent = `Grade ${d.grade} — Score ${d.score}/100 ${d.premiumBadge?'🏅 Premium':''}`;
    document.getElementById('sell-grade-details').textContent = `${d.freshness} freshness · ${d.defects} · ${d.recommendation}`;
    document.getElementById('sell-grade-value').textContent = d.marketValue;
    gradeEl.style.display = 'block';
    // auto-fill grade select
    const gs = document.getElementById('sell-grade-sel');
    if (gs) { for (let o of gs.options) { if (o.value===d.grade||o.text===d.grade) { gs.value=o.value; break; } } }
    // auto-fill price suggestion
    const priceInput = document.getElementById('sell-price');
    if (priceInput && !priceInput.value) priceInput.value = d.marketValue.replace(/[^0-9]/g,'');
    addNotification(`AI graded your ${crop}: Grade ${d.grade}, ${d.marketValue}`, 'success', '🤖 AI Grading Done');
  } catch {
    showToast('AI response: ' + result.slice(0,80), 'info');
  }
};

window.listCropForSale = function() {
  const user = JSON.parse(localStorage.getItem('kio_user') || 'null');
  if (!user) { openAuthModal(); showToast(currentLang==='hi'?'पहले लॉगिन करें':'Please login to list crops','warn'); return; }
  const crop  = document.getElementById('sell-crop')?.value;
  const qty   = document.getElementById('sell-qty')?.value;
  const price = document.getElementById('sell-price')?.value;
  const grade = document.getElementById('sell-grade-sel')?.value;
  const desc  = document.getElementById('sell-desc')?.value;
  if (!qty || !price) { showToast(currentLang==='hi'?'मात्रा और मूल्य भरें':'Enter quantity and price','error'); return; }
  const listing = { id:Date.now(), crop, qty, price, grade, desc, farmer:user.name||'Farmer',
    hasPhoto: !!window._sellPhotoBase64, date: new Date().toLocaleDateString('en-IN') };
  const arr = JSON.parse(localStorage.getItem('kio_listings')||'[]');
  arr.unshift(listing);
  localStorage.setItem('kio_listings', JSON.stringify(arr.slice(0,20)));
  saveToFirestore('listings', listing);
  window._sellPhotoBase64 = null;
  // refresh my listings
  const myListingsArea = document.getElementById('my-listings-area');
  if (myListingsArea) myListingsArea.innerHTML = renderMyListings();
  addNotification(`${crop} listed at ₹${price}/qtl — buyers will contact you!`, 'deal', '📢 Crop Listed');
  showToast(currentLang==='hi'?`✅ ${crop} सफलतापूर्वक लिस्ट हुई!`:`✅ ${crop} listed! Buyers will contact you.`, 'success');
};

window.removeMyListing = function(id) {
  const arr = JSON.parse(localStorage.getItem('kio_listings')||'[]').filter(l=>l.id!==id);
  localStorage.setItem('kio_listings', JSON.stringify(arr));
  const area = document.getElementById('my-listings-area');
  if (area) area.innerHTML = renderMyListings();
};

window.shareListingWA = function() {
  const crop=document.getElementById('sell-crop')?.value||'Crop';
  const qty=document.getElementById('sell-qty')?.value||'?';
  const price=document.getElementById('sell-price')?.value||'?';
  const grade=document.getElementById('sell-grade-sel')?.value||'A';
  const msg=`🌾 *फसल बिक्री / Crop for Sale*\n\n*${crop}*\nGrade: ${grade}\nQty: ${qty} Quintal\nPrice: ₹${price}/qtl\n\n📍 Contact me on KrishiOS\n_via KrishiOS — AI Agricultural OS_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

// ─────────────────────────────────────────────────────────────
// 5. OVERRIDE renderDashboard with translated content
// ─────────────────────────────────────────────────────────────
const _origDashboard = window.renderDashboard;
window.renderDashboard = function() {
  const c = document.getElementById('content');
  c.innerHTML = `
  <div class="page-header">
    <h1>${t('dashboard_title')}</h1>
    <p>${t('dashboard_sub')}</p>
  </div>
  <div class="grid-4 section-gap">
    <div class="stat-card green"><div class="stat-icon">🌾</div><div class="stat-label">${t('active_crops')}</div><div class="stat-val">4</div><div class="stat-sub">${currentLang==='hi'?'2 कटाई के करीब':'2 near harvest'}</div></div>
    <div class="stat-card gold"><div class="stat-icon">💰</div><div class="stat-label">${t('revenue')}</div><div class="stat-val">₹1.42L</div><div class="stat-sub">↑ 18%</div></div>
    <div class="stat-card sky"><div class="stat-icon">🛒</div><div class="stat-label">${t('active_buyers')}</div><div class="stat-val">23</div><div class="stat-sub">${currentLang==='hi'?'8 जवाब का इंतज़ार':'8 awaiting reply'}</div></div>
    <div class="stat-card purple"><div class="stat-icon">📊</div><div class="stat-label">${t('yield_pred')}</div><div class="stat-val">92%</div><div class="stat-sub">${currentLang==='hi'?'सोयाबीन 18 दिन में':'Soybean in 18 days'}</div></div>
  </div>

  <div class="card section-gap">
    <div class="card-title">📡 ${currentLang==='hi'?'लाइव मूल्य टिकर':'Live Price Ticker'}</div>
    <div style="overflow:hidden;padding:8px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
      <span id="ticker-inner" style="display:inline-block;animation:ticker 32s linear infinite;font-size:0.85rem;white-space:nowrap"></span>
    </div>
  </div>

  <div class="two-col section-gap">
    <div class="card"><div class="card-title">📈 ${currentLang==='hi'?'मासिक आय (₹)':'Monthly Revenue (₹)'}</div><div class="chart-wrap"><canvas id="rev-chart"></canvas></div></div>
    <div class="card"><div class="card-title">🥧 ${currentLang==='hi'?'फसल मिश्रण':'Crop Mix This Season'}</div><div class="chart-wrap"><canvas id="crop-mix-chart"></canvas></div></div>
  </div>

  <div class="two-col section-gap">
    <div class="card"><div class="card-title">💹 ${currentLang==='hi'?'मूल्य प्रवृत्ति':'Price Trends (₹/Qtl)'}</div><div class="chart-wrap"><canvas id="price-trend-chart"></canvas></div></div>
    <div class="card">
      <div class="card-title">🌤️ ${currentLang==='hi'?'आज का मौसम':'Today\'s Weather'}</div>
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:14px">
        <div style="font-size:3rem">⛅</div>
        <div><div style="font-size:2rem;font-weight:800;font-family:var(--font-display)">32°C</div><div style="color:var(--text2);font-size:0.85rem">${currentLang==='hi'?'आंशिक बादल · नमी 68%':'Partly Cloudy · Humidity 68%'}</div></div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="showPage('weather')">${currentLang==='hi'?'पूरा पूर्वानुमान →':'Full Forecast →'}</button>
      </div>
      <div class="notif notif-warn">⚠️ ${currentLang==='hi'?'बुधवार को कवकनाशी न डालें। गुरु–शनि कटाई करें।':'High humidity mid-week. Avoid fungicide Wed. Harvest Thu–Sat.'}</div>
      <hr class="divider"/>
      <div class="card-title">🔔 ${currentLang==='hi'?'मूल्य अलर्ट':'Price Alerts'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${MARKET_PRICES.slice(0,4).map(m=>`<div class="alert-chip" onclick="showPage('price-intel')"><span>${m.crop}</span><span class="${m.trend==='up'?'text-green':'text-red'}" style="font-weight:700">₹${m.price.toLocaleString()}</span><span style="font-size:0.7rem">${m.trend==='up'?'↑':'↓'}${Math.abs(m.change)}</span></div>`).join('')}
      </div>
    </div>
  </div>

  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">${t('leaderboard')}</div>
      ${FARMERS.map((f,i)=>`
        <div class="rank-row">
          <div class="rank-num rank-${i+1}">${['🥇','🥈','🥉','4️⃣'][i]||i+1}</div>
          <div class="rank-info"><div class="rank-name">${f.name}</div><div class="rank-sub">${f.crops.join(', ')} · ${f.village}</div></div>
          <div style="text-align:right"><span class="badge badge-${f.badge==='Premium'?'gold':'sky'}">${f.badge}</span><div style="font-size:0.8rem;color:var(--text3);margin-top:3px">⭐ ${f.rating}</div></div>
        </div>`).join('')}
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

  // ticker
  const ti = document.getElementById('ticker-inner');
  if (ti) { const txt=MARKET_PRICES.map(m=>`${m.crop}: ₹${m.price.toLocaleString()}/qtl ${m.trend==='up'?'↑':'↓'}${Math.abs(m.change)}   ·   `).join(''); ti.textContent=txt+txt; }

  // Charts
  setTimeout(() => {
    if (typeof Chart === 'undefined') return;
    const months = currentLang==='hi'
      ? ['जन','फर','मार','अप्र','मई','जून','जुल','अग','सित','अक्त','नव','दिस']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const rev = [82,91,78,110,95,125,142,138,160,145,175,142];
    makeBarChart('rev-chart', months, [{ label:currentLang==='hi'?'आय (₹K)':'Revenue (₹K)', data:rev, colors:rev.map((_,i)=>i===11?'#f4a228':'#40916c') }]);
    makeDoughnutChart('crop-mix-chart',
      currentLang==='hi'?['सोयाबीन','कपास','गेहूं','प्याज']:['Soybean','Cotton','Wheat','Onion'],
      [40,25,20,15], ['#40916c','#f4a228','#0ea5e9','#8b5cf6']
    );
    makeLineChart('price-trend-chart', ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
      [{ label:'Soybean', data:[3800,4000,4200,4400,4600,4700,4650,4620], color:'#40916c', bg:'rgba(64,145,108,0.1)' },
       { label:'Wheat',   data:[1900,2100,2050,2200,2275,2300,2400,2350], color:'#f4a228', bg:'rgba(244,162,40,0.1)' }]
    );
  }, 80);
};

// ─────────────────────────────────────────────────────────────
// 6. CHART HELPERS (Chart.js)
// ─────────────────────────────────────────────────────────────
const chartInstances = {};
function destroyChart(id) { if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];} }

window.makeLineChart = function(canvasId, labels, datasets) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId); if(!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, { type:'line', data:{ labels, datasets: datasets.map(d=>({ tension:0.4,fill:true,borderWidth:2,pointRadius:3, backgroundColor:d.bg||'rgba(64,145,108,0.15)', borderColor:d.color||'#40916c',...d })) }, options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{labels:{color:'#9dbfa8',font:{size:11}}}}, scales:{ x:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{color:'rgba(45,90,62,0.4)'}}, y:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{color:'rgba(45,90,62,0.4)'}} } } });
};
window.makeBarChart = function(canvasId, labels, datasets) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId); if(!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, { type:'bar', data:{ labels, datasets:datasets.map(d=>({borderRadius:5,borderWidth:0,backgroundColor:d.colors||'#40916c',...d})) }, options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{labels:{color:'#9dbfa8',font:{size:11}}}}, scales:{ x:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{display:false}}, y:{ticks:{color:'#6b9e7a',font:{size:10}},grid:{color:'rgba(45,90,62,0.4)'}} } } });
};
window.makeDoughnutChart = function(canvasId, labels, data, colors) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId); if(!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, { type:'doughnut', data:{ labels, datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:'#1c3a28'}] }, options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:'#9dbfa8',font:{size:11},padding:12}}} } });
};

// ─────────────────────────────────────────────────────────────
// 7. AUTH
// ─────────────────────────────────────────────────────────────
let _confirmResult = null;
window.currentUser = JSON.parse(localStorage.getItem('kio_user')||'null');

window.openAuthModal  = function() { document.getElementById('auth-modal').style.display='flex'; };
window.closeAuthModal = function() { document.getElementById('auth-modal').style.display='none'; };

window.sendOTP = async function() {
  const phone = document.getElementById('auth-phone').value.trim();
  if (phone.length!==10){ showToast('Enter valid 10-digit number','error'); return; }
  if (!window._fbAuth){ demoLogin(); return; }
  try {
    const {RecaptchaVerifier,signInWithPhoneNumber} = window._fbFns;
    if (!window._recap) window._recap = new RecaptchaVerifier(window._fbAuth,'recaptcha-container',{size:'invisible'});
    _confirmResult = await signInWithPhoneNumber(window._fbAuth,'+91'+phone,window._recap);
    document.getElementById('auth-step1').style.display='none';
    document.getElementById('auth-step2').style.display='block';
    document.getElementById('auth-msg').textContent=`✅ OTP sent to +91${phone}`;
  } catch(e){ showToast('OTP failed. Using demo login.','error'); demoLogin(); }
};

window.verifyOTP = async function() {
  const otp = document.getElementById('auth-otp').value.trim();
  if (!_confirmResult){ showToast('Start over','error'); return; }
  try {
    const r = await _confirmResult.confirm(otp);
    finishLogin({uid:r.user.uid, phone:r.user.phoneNumber, name:'Farmer', role:'farmer'});
  } catch(e){ showToast('Wrong OTP','error'); }
};

window.demoLogin = function() {
  const name = prompt(currentLang==='hi'?'आपका नाम दर्ज करें:':'Enter your name:') || 'Ramesh Patil';
  const role = confirm(currentLang==='hi'?'क्या आप किसान हैं? OK=किसान, Cancel=खरीदार':'Are you a Farmer? OK=Farmer, Cancel=Buyer') ? 'farmer' : 'buyer';
  finishLogin({ uid:'demo_'+Date.now(), name, role, demo:true });
};

window.finishLogin = function(user) {
  window.currentUser = user;
  localStorage.setItem('kio_user', JSON.stringify(user));
  closeAuthModal();
  updateUIForUser(user);
  addNotification(`${currentLang==='hi'?'स्वागत है':'Welcome'}, ${user.name}! 🌾`, 'success', currentLang==='hi'?'लॉगिन सफल':'Login Successful');
  showPage(window.currentPage||'dashboard');
};

window.logoutUser = function() {
  if (window._fbAuth && window._fbFns) window._fbFns.signOut(window._fbAuth).catch(()=>{});
  window.currentUser = null;
  localStorage.removeItem('kio_user');
  updateUIForUser(null);
  showToast(currentLang==='hi'?'लॉगआउट हो गए':'Logged out','info');
  showPage('dashboard');
};

window.updateUIForUser = function(user) {
  const chip = document.getElementById('topbar-user');
  const mini = document.getElementById('user-profile-mini');
  if (user) {
    if (chip) chip.textContent=`👨‍🌾 ${user.name}`;
    if (mini) { mini.style.display='flex'; document.getElementById('sidebar-user-name').textContent=user.name; document.getElementById('sidebar-user-role').textContent=user.role==='farmer'?'🌾 Farmer':'🛒 Buyer'; }
  } else {
    if (chip) chip.textContent='👤 Login';
    if (mini) mini.style.display='none';
  }
};

// ─────────────────────────────────────────────────────────────
// 8. FIREBASE SAVE (fallback to localStorage)
// ─────────────────────────────────────────────────────────────
window.saveToFirestore = async function(col, data) {
  const key=`kio_${col}`; const arr=JSON.parse(localStorage.getItem(key)||'[]');
  arr.unshift({...data,id:Date.now()}); localStorage.setItem(key,JSON.stringify(arr.slice(0,50)));
  if (!window._fbDb||!window._fbFns) return;
  try { const {collection,addDoc}=window._fbFns; await addDoc(collection(window._fbDb,col),{...data,ts:Date.now()}); } catch(e){}
};

// ─────────────────────────────────────────────────────────────
// 9. RAZORPAY
// ─────────────────────────────────────────────────────────────
window.initiatePayment = function(crop,amount,farmerName) {
  const user=JSON.parse(localStorage.getItem('kio_user')||'null');
  if (!user){ openAuthModal(); showToast(currentLang==='hi'?'पहले लॉगिन करें':'Login to purchase','warn'); return; }
  if (typeof Razorpay==='undefined') {
    const s=document.createElement('script'); s.src='https://checkout.razorpay.com/v1/checkout.js';
    s.onload=()=>openRazorpay(crop,amount,farmerName,user);
    s.onerror=()=>showToast('Payment gateway unavailable','error');
    document.head.appendChild(s); return;
  }
  openRazorpay(crop,amount,farmerName,user);
};

window.openRazorpay = function(crop,amount,farmerName,user) {
  try {
    new Razorpay({ key:'YOUR_RAZORPAY_KEY_ID', amount:amount*100, currency:'INR',
      name:'KrishiOS', description:`${crop} from ${farmerName}`,
      handler:(r)=>{ addNotification(`Payment done! ID: ${r.razorpay_payment_id}`, 'deal', '💳 Payment Successful'); saveToFirestore('transactions',{crop,amount,farmer:farmerName,buyer:user.name,paymentId:r.razorpay_payment_id}); },
      prefill:{name:user.name||'',contact:user.phone||''}, theme:{color:'#2d6a4f'},
      modal:{ondismiss:()=>showToast('Payment cancelled','info')}
    }).open();
  } catch(e){ showToast(`Razorpay: Add YOUR_RAZORPAY_KEY_ID in improvements.js`,'warn'); }
};

// ─────────────────────────────────────────────────────────────
// 10. WHATSAPP
// ─────────────────────────────────────────────────────────────
window.contactSellerWA = function(name,crop,price) {
  window.open(`https://wa.me/?text=${encodeURIComponent(`🌾 *KrishiOS Enquiry*\nHello ${name},\nI want to buy your *${crop}* at ₹${price}/qtl.\nPlease confirm.\n_via KrishiOS_`)}`, '_blank');
};
window.contactBuyerWA = function(name,offer) {
  window.open(`https://wa.me/?text=${encodeURIComponent(`🌾 *KrishiOS*\nHello ${name},\nI saw your ${offer} offer. My crop is ready.\n_via KrishiOS_`)}`, '_blank');
};
window.shareOnWhatsApp = function(type) {
  const msg = type==='price' ? `*🌾 KrishiOS Live Prices*\n${MARKET_PRICES.map(m=>`• ${m.crop}: ₹${m.price.toLocaleString()}/qtl`).join('\n')}` : '';
  if (msg) window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};
window.connectBuyer = name => addNotification(`Connection request sent to ${name}!`,'success','🤝 Connected');
window.expressInterest = (buyer,crop) => addNotification(`Interest sent to ${buyer} for ${crop}!`,'deal','📦 Bulk Interest');

// ─────────────────────────────────────────────────────────────
// 11. ONLINE/OFFLINE
// ─────────────────────────────────────────────────────────────
window.updateOnlineStatus = function() {
  const banner=document.getElementById('offline-banner'); const badge=document.getElementById('live-badge');
  if (navigator.onLine) { if(banner)banner.style.display='none'; if(badge)badge.textContent='🟢 Live'; document.body.style.paddingTop=''; }
  else { if(banner){banner.style.display='block';document.body.style.paddingTop='36px';} if(badge)badge.innerHTML='<span class="offline-chip">📶 Offline</span>'; showToast('You are offline. Showing cached data.','warn'); }
};
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ─────────────────────────────────────────────────────────────
// 12. PWA
// ─────────────────────────────────────────────────────────────
let _dip = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); _dip=e; showPWABanner(); });
window.showPWABanner = function() {
  if (document.getElementById('pwa-banner')) return;
  const b=document.createElement('div'); b.id='pwa-banner';
  b.innerHTML=`<span style="font-size:1.4rem">🌾</span><p>Install KrishiOS on your phone — works offline!</p><button class="btn btn-primary btn-sm" onclick="installPWA()">Install</button><button class="btn btn-outline btn-sm" onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(b); b.style.display='flex';
};
window.installPWA = async function() {
  if (!_dip){ showToast('Open in Chrome to install','info'); return; }
  _dip.prompt(); const {outcome}=await _dip.userChoice;
  if(outcome==='accepted') addNotification('KrishiOS installed! 🎉','success','📱 App Installed');
  _dip=null; document.getElementById('pwa-banner')?.remove();
};

// ─────────────────────────────────────────────────────────────
// 13. SERVICE WORKER
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// ─────────────────────────────────────────────────────────────
// 14. INIT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // restore user session
  const u = JSON.parse(localStorage.getItem('kio_user')||'null');
  if (u) { window.currentUser=u; updateUIForUser(u); }
  // language
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const v=t(el.getAttribute('data-i18n')); if(v) el.textContent=v; });
  if (currentLang==='hi') { document.body.className='lang-hi'; const lb=document.getElementById('lang-btn'); if(lb) lb.textContent='En/हि'; }
  // notification badge
  updateNotifBadge();
  // online status
  updateOnlineStatus();
  // auth modal close on overlay click
  document.getElementById('auth-modal')?.addEventListener('click', e => { if(e.target.id==='auth-modal') closeAuthModal(); });
  // close notif panel on outside click
  document.addEventListener('click', e => {
    const panel=document.getElementById('notif-panel');
    if (panel && panel.style.display!=='none' && !panel.contains(e.target) && !e.target.closest('[onclick*="openNotifications"]')) panel.style.display='none';
  });
  // price alert checker
  setInterval(()=>{
    const alerts=JSON.parse(localStorage.getItem('kio_price_alerts')||'[]');
    alerts.forEach(a=>{ const live=MARKET_PRICES.find(m=>m.crop===a.crop); if(live&&live.price>=a.target) addNotification(`${a.crop} hit ₹${live.price}/qtl — sell now!`,'price','🔔 Price Alert','price-intel'); });
  }, 30000);
});

// ─────────────────────────────────────────────────────────────
// 15. PRICE INTEL OVERRIDE — Chart.js + price alerts
// ─────────────────────────────────────────────────────────────
window.renderPriceIntel = function() {
  const c = document.getElementById('content');
  c.innerHTML = `
  <div class="page-header"><h1>💹 ${currentLang==='hi'?'बाज़ार जानकारी':'Market Intelligence'}</h1><p>${currentLang==='hi'?'लाइव मूल्य, पूर्वानुमान और निर्यात अवसर':'Live prices, AI forecasts and export opportunities'}</p></div>
  <div class="card section-gap">
    <div class="flex-between mb-16">
      <div class="card-title" style="margin:0">📊 ${currentLang==='hi'?'लाइव मंडी मूल्य':'Live Mandi Prices'}</div>
      <button class="wa-btn" style="padding:7px 14px;font-size:0.8rem" onclick="shareOnWhatsApp('price')">💬 ${currentLang==='hi'?'WhatsApp पर शेयर करें':'Share on WhatsApp'}</button>
    </div>
    <div class="table-wrap">
      <table><thead><tr><th>${currentLang==='hi'?'फसल':'Crop'}</th><th>${currentLang==='hi'?'मंडी':'Mandi'}</th><th>${currentLang==='hi'?'मूल्य':'Price'} (₹/Qtl)</th><th>${currentLang==='hi'?'बदलाव':'Change'}</th><th>MSP</th><th>${currentLang==='hi'?'अंतर':'Premium'}</th><th>${currentLang==='hi'?'अलर्ट':'Alert'}</th></tr></thead>
      <tbody>
        ${MARKET_PRICES.map(m => {
          const cr=CROPS.find(x=>x.name===m.crop); const msp=cr?.msp||null; const diff=msp?m.price-msp:null;
          return `<tr>
            <td class="fw-bold">${m.crop}</td><td>${m.mandi}</td>
            <td style="font-weight:700;color:var(--gold)">₹${m.price.toLocaleString()}</td>
            <td class="${m.trend==='up'?'text-green':'text-red'}">${m.trend==='up'?'↑':'↓'} ₹${Math.abs(m.change)}</td>
            <td>${msp?'₹'+msp:'—'}</td>
            <td>${diff!==null?`<span class="${diff>=0?'text-green':'text-red'}">${diff>=0?'+':''}₹${diff}</span>`:'—'}</td>
            <td><button class="btn btn-outline btn-sm" onclick="setPriceAlert('${m.crop}',${m.price})">🔔</button></td>
          </tr>`;
        }).join('')}
      </tbody></table>
    </div>
  </div>
  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">📈 ${currentLang==='hi'?'मूल्य इतिहास चार्ट':'Price History Chart'}</div>
      <div class="form-group" style="margin-bottom:10px">
        <select class="form-select" id="ph-crop-sel" onchange="updatePriceChart()" style="max-width:200px">
          ${CROPS.map(x=>`<option>${x.name}</option>`).join('')}
        </select>
      </div>
      <div class="chart-wrap" style="height:220px"><canvas id="price-hist-chart"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">🔮 ${currentLang==='hi'?'AI मूल्य पूर्वानुमान':'AI Price Forecast (30 Days)'}</div>
      <div class="form-group"><select class="form-select" id="pf-crop">${CROPS.map(x=>`<option>${x.name}</option>`).join('')}</select></div>
      <button class="btn btn-primary" onclick="getPriceForecast()">🤖 ${currentLang==='hi'?'पूर्वानुमान लगाएं':'Generate Forecast'}</button>
      <div id="price-forecast-result" style="margin-top:14px"></div>
    </div>
  </div>
  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">📅 ${currentLang==='hi'?'मौसमी जानकारी':'Seasonal Intelligence'}</div>
      ${[['Onion','Dec–Feb','High','Buy in Oct, sell Feb'],['Tomato','Summer','Peak','Cold storage in winter'],['Wheat','Post Rabi','Steady','MSP safe floor'],['Cotton','Sep–Nov','Very High','Sell at peak Q3']].map(([cr,season,demand,tip])=>`
        <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:1.3rem">${CROPS.find(x=>x.name===cr)?.emoji||'🌾'}</div>
          <div style="flex:1"><div class="fw-bold">${cr}</div><div class="text-sm">${season} · ${currentLang==='hi'?'मांग':'Demand'}: <span class="text-gold">${demand}</span></div><div style="font-size:0.78rem;color:var(--green-light);margin-top:3px">💡 ${tip}</div></div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">🌍 ${currentLang==='hi'?'निर्यात अवसर':'Export Opportunities'}</div>
      ${[{c:'Turmeric',cc:'UAE, Saudi Arabia',p:'+22%'},{c:'Onion',cc:'Malaysia, Sri Lanka',p:'+18%'},{c:'Rice',cc:'Europe, USA',p:'+35%'},{c:'Chilli',cc:'China, UK',p:'+28%'}].map(e=>`
        <div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div><div class="fw-bold" style="font-size:0.9rem">${e.c} → ${e.cc}</div></div>
          <div class="text-green fw-bold">${e.p}</div>
          <button class="btn btn-primary btn-sm" onclick="addNotification('Export enquiry sent for ${e.c}!','deal','🌍 Export Enquiry')">Enquire</button>
        </div>`).join('')}
      <div class="notif notif-info mt-16">📢 ${currentLang==='hi'?'मध्य पूर्व से हल्दी और प्याज की मांग बढ़ी है':'Turmeric & Onion demand surging from Middle East this quarter.'}</div>
    </div>
  </div>
  <div class="card section-gap">
    <div class="card-title">🔔 ${currentLang==='hi'?'मेरे मूल्य अलर्ट':'My Price Alerts'}</div>
    <div id="my-alerts-list">${renderMyAlerts()}</div>
  </div>`;
  setTimeout(() => updatePriceChart(), 80);
};

window.updatePriceChart = function() {
  const sel = document.getElementById('ph-crop-sel'); if(!sel) return;
  const crop = CROPS.find(x=>x.name===sel.value); if(!crop) return;
  makeLineChart('price-hist-chart',
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
    [{label:`${crop.name} ₹/Qtl`, data:crop.price, color:'#f4a228', bg:'rgba(244,162,40,0.1)'}]
  );
};

window.setPriceAlert = function(crop, currentPrice) {
  const target = prompt(
    `${currentLang==='hi'?'मूल्य अलर्ट सेट करें':'Set Price Alert'} — ${crop}\n${currentLang==='hi'?'अभी':'Current'}: ₹${currentPrice}/qtl\n${currentLang==='hi'?'लक्ष्य मूल्य दर्ज करें (₹/qtl):':'Alert when price reaches (₹/qtl):'}`
  );
  if (!target || isNaN(target)) return;
  const alerts = JSON.parse(localStorage.getItem('kio_price_alerts')||'[]');
  alerts.push({crop, target:parseInt(target), set:currentPrice, date:new Date().toLocaleDateString('en-IN')});
  localStorage.setItem('kio_price_alerts', JSON.stringify(alerts));
  addNotification(`${currentLang==='hi'?'अलर्ट सेट हुआ!':'Alert set!'} ${crop} @ ₹${target}/qtl`, 'price', '🔔 Price Alert');
  const area = document.getElementById('my-alerts-list');
  if (area) area.innerHTML = renderMyAlerts();
};

function renderMyAlerts() {
  const alerts = JSON.parse(localStorage.getItem('kio_price_alerts')||'[]');
  if (!alerts.length) return `<div style="padding:16px;text-align:center;color:var(--text3);font-size:0.85rem">${currentLang==='hi'?'कोई अलर्ट नहीं। ऊपर 🔔 बटन दबाएं।':'No alerts set. Click 🔔 next to any crop above.'}</div>`;
  return alerts.map((a,i)=>`
    <div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div><span class="fw-bold">${a.crop}</span> <span class="text-sm">— ${currentLang==='hi'?'अलर्ट':'Alert at'} <span class="text-gold">₹${a.target}/qtl</span></span></div>
      <div class="text-sm" style="display:flex;align-items:center;gap:8px">
        <span style="color:var(--text3)">${currentLang==='hi'?'सेट':'Set'}: ₹${a.set} · ${a.date}</span>
        <button class="btn btn-outline btn-sm" style="padding:3px 8px" onclick="removeAlert(${i})">✕</button>
      </div>
    </div>`).join('');
}
window.removeAlert = function(i) {
  const alerts = JSON.parse(localStorage.getItem('kio_price_alerts')||'[]');
  alerts.splice(i,1);
  localStorage.setItem('kio_price_alerts', JSON.stringify(alerts));
  const area = document.getElementById('my-alerts-list');
  if (area) area.innerHTML = renderMyAlerts();
};

// ─────────────────────────────────────────────────────────────
// 16. ADMIN OVERRIDE — Chart.js analytics
// ─────────────────────────────────────────────────────────────
window.renderAdmin = function() {
  const c = document.getElementById('content');
  c.innerHTML = `
  <div class="page-header"><h1>⚙️ Admin Dashboard</h1><p>Platform overview, analytics, supply chain and management</p></div>
  <div class="grid-4 section-gap">
    ${[['Total Farmers','2,847','↑ 124 this week','green'],['Total Buyers','486','↑ 32 this week','gold'],['Transactions','₹4.2Cr','↑ 18% MoM','sky'],['Active Listings','1,234','↑ 89 today','purple']].map(([l,v,s,cl])=>`<div class="stat-card ${cl}"><div class="stat-label">${l}</div><div class="stat-val">${v}</div><div class="stat-sub">${s}</div></div>`).join('')}
  </div>
  <div class="three-col section-gap">
    <div class="card"><div class="card-title">📊 Listings by State</div><div class="chart-wrap"><canvas id="state-chart"></canvas></div></div>
    <div class="card"><div class="card-title">💰 Revenue by Month</div><div class="chart-wrap"><canvas id="admin-rev-chart"></canvas></div></div>
    <div class="card"><div class="card-title">🥧 Crop Split</div><div class="chart-wrap"><canvas id="admin-crop-chart"></canvas></div></div>
  </div>
  <div class="card section-gap">
    <div class="card-title">📦 Supply Chain Tracking</div>
    <div class="table-wrap"><table><thead><tr><th>Order ID</th><th>Crop</th><th>Farmer → Buyer</th><th>Qty</th><th>Value</th><th>Stage</th><th>ETA</th><th>Track</th></tr></thead>
    <tbody>${[['KR-2401','Soybean','Ramesh → FoodCorp','50 Qtl','₹2.31L','🚛 In Transit','Today 6PM'],['KR-2402','Turmeric','Lakshmi → Spice Exports','20 Qtl','₹2.24L','✅ Delivered','Done'],['KR-2403','Wheat','Suresh → Sunrise Mills','120 Qtl','₹2.76L','📦 Packed','Tomorrow'],['KR-2404','Onion','Gopal → LocalMart','80 Qtl','₹1.68L','⏳ Quality Check','2 days']].map(r=>`<tr><td class="fw-bold text-sky">${r[0]}</td><td>${r[1]}</td><td style="font-size:0.8rem">${r[2]}</td><td>${r[3]}</td><td class="text-gold fw-bold">${r[4]}</td><td>${r[5]}</td><td class="text-sm">${r[6]}</td><td><button class="btn btn-outline btn-sm" onclick="trackOrder('${r[0]}')">Track</button></td></tr>`).join('')}</tbody></table></div>
  </div>
  <div class="two-col section-gap">
    <div class="card"><div class="card-title">📈 Demand Forecast</div><div class="chart-wrap"><canvas id="demand-chart"></canvas></div></div>
    <div class="card">
      <div class="card-title">🌍 Export Opportunities</div>
      ${[{c:'Turmeric',cc:'UAE',p:'+22%',q:'500 MT'},{c:'Onion',cc:'Malaysia',p:'+18%',q:'2000 MT'},{c:'Rice',cc:'Europe',p:'+35%',q:'300 MT'},{c:'Chilli',cc:'China',p:'+28%',q:'150 MT'}].map(e=>`
        <div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div><div class="fw-bold" style="font-size:0.9rem">${e.c} → ${e.cc}</div><div class="text-sm">${e.q} needed</div></div>
          <div class="text-green fw-bold">${e.p}</div>
          <button class="btn btn-primary btn-sm" onclick="addNotification('Export enquiry sent!','deal','🌍 Export')">Enquire</button>
        </div>`).join('')}
    </div>
  </div>
  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">👥 Farmer Management</div>
      <div class="flex-between mb-16">
        <input class="form-input" style="max-width:220px" placeholder="Search farmers..." oninput="adminSearchFarmer(this.value)"/>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="addNotification('CSV export started','info','⬇ Export')">⬇ Export</button>
          <button class="wa-btn" style="padding:6px 12px;font-size:0.8rem" onclick="addNotification('WhatsApp broadcast sent!','success','💬 Broadcast')">💬 Notify All</button>
        </div>
      </div>
      <div class="table-wrap" id="admin-farmer-table">${adminFarmerTable(FARMERS)}</div>
    </div>
    <div class="card">
      <div class="card-title">🛡️ Platform Health</div>
      ${[['Server Uptime','99.8%','green'],['API Response','142ms','green'],['Payment Success','98.2%','green'],['Dispute Rate','1.2%','gold'],['Fraud Alerts','3 pending','red'],['Active Sessions','847','sky']].map(([k,v,cl])=>`
        <div class="flex-between" style="padding:9px 0;border-bottom:1px solid var(--border)">
          <span class="text-sm">${k}</span>
          <span class="fw-bold" style="color:var(--${cl==='green'?'green-light':cl==='gold'?'gold':cl==='red'?'red':'sky'})">${v}</span>
        </div>`).join('')}
      <div class="notif notif-warn mt-16">⚠️ 3 fraud alerts. <button class="btn btn-danger btn-sm" onclick="addNotification('Fraud review opened','warn','🚨 Fraud Review')">Review</button></div>
    </div>
  </div>`;

  setTimeout(()=>{
    if (typeof Chart==='undefined') return;
    makeBarChart('state-chart',['MH','UP','PB','MP','GJ','RJ','KA','AP'],[{label:'Listings %',data:[45,38,32,28,22,18,15,12],colors:['#40916c','#40916c','#40916c','#40916c','#74c69d','#74c69d','#74c69d','#74c69d']}]);
    makeLineChart('admin-rev-chart',['Jan','Feb','Mar','Apr','May','Jun'],[{label:'Revenue ₹L',data:[32,38,29,44,41,52],color:'#f4a228',bg:'rgba(244,162,40,0.1)'}]);
    makeDoughnutChart('admin-crop-chart',['Wheat','Rice','Soybean','Cotton','Others'],[28,22,18,16,16],['#40916c','#0ea5e9','#f4a228','#8b5cf6','#74c69d']);
    makeBarChart('demand-chart',['Wheat','Soybean','Onion','Rice','Cotton','Turmeric','Maize','Mustard'],[{label:'Demand Index',data:[85,92,78,70,65,95,60,75],colors:['#40916c','#f4a228','#40916c','#40916c','#40916c','#f4a228','#74c69d','#40916c']}]);
  }, 80);
};

// ─────────────────────────────────────────────────────────────
// 17. WAREHOUSE OVERRIDE — Leaflet map
// ─────────────────────────────────────────────────────────────
window.renderWarehouse = function() {
  const c = document.getElementById('content');
  c.innerHTML = `
  <div class="page-header"><h1>🏭 ${currentLang==='hi'?'भंडारण और लॉजिस्टिक्स':'Storage & Logistics'}</h1><p>${currentLang==='hi'?'वेयरहाउस खोजें, परिवहन बुक करें':'Find warehouses, book storage, arrange transport'}</p></div>
  <div class="card section-gap">
    <div class="card-title">🗺️ ${currentLang==='hi'?'आपके पास वेयरहाउस':'Warehouses Near You'}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
      <input class="form-input" style="max-width:200px" placeholder="${currentLang==='hi'?'आपकी जगह...':'Your location...'}" value="Nagpur, MH"/>
      <select class="form-select" style="max-width:150px"><option>Within 50km</option><option>Within 20km</option><option>Any Distance</option></select>
      <select class="form-select" style="max-width:160px"><option>${currentLang==='hi'?'सभी प्रकार':'All Types'}</option><option>Cold Storage</option><option>Dry Storage</option></select>
      <button class="btn btn-primary" onclick="addNotification('Searching warehouses...','info','🔍 Search')">Search</button>
    </div>
    <div id="warehouse-map"></div>
  </div>
  <div class="grid-3 section-gap">
    ${WAREHOUSES.map(w=>`
      <div class="card" style="padding:16px">
        <div class="flex-between mb-16"><span class="fw-bold">${w.name}</span>${w.cold?'<span class="badge badge-sky">❄️ Cold</span>':'<span class="badge badge-gold">📦 Dry</span>'}</div>
        <div class="text-sm" style="margin-bottom:12px">📍 ${w.city} · ${w.dist}</div>
        ${[['Total',w.capacity],['Available',w.avail],['Rate',w.rate]].map(([k,v])=>`<div class="flex-between" style="padding:5px 0;font-size:0.83rem"><span style="color:var(--text3)">${k}</span><span>${v}</span></div>`).join('')}
        <div class="progress-wrap mt-16"><div class="progress-bar" style="width:${w.cold?68:45}%"></div></div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="bookWarehouse('${w.name}')">📅 ${currentLang==='hi'?'बुक करें':'Book'}</button>
          <button class="btn btn-outline btn-sm" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(w.city)}','_blank')">📍</button>
        </div>
      </div>`).join('')}
  </div>
  <div class="two-col section-gap">
    <div class="card">
      <div class="card-title">🚛 ${currentLang==='hi'?'परिवहन बोली':'Logistics Bids'}</div>
      <div class="form-group"><label class="form-label">${currentLang==='hi'?'से (खेत)':'From (Farm)'}</label><input class="form-input" id="log-from" placeholder="Hingoli, Maharashtra"/></div>
      <div class="form-group"><label class="form-label">${currentLang==='hi'?'तक':'To'}</label><input class="form-input" id="log-to" placeholder="Nagpur Market"/></div>
      <div class="form-group"><label class="form-label">${currentLang==='hi'?'फसल और मात्रा':'Crop & Quantity'}</label><input class="form-input" id="log-qty" placeholder="Soybean, 50 Quintal"/></div>
      <button class="btn btn-primary" onclick="getTransportBids()">🤖 ${currentLang==='hi'?'बोलियां पाएं':'Get Transport Bids'}</button>
      <div id="transport-result" style="margin-top:14px"></div>
    </div>
    <div class="card">
      <div class="card-title">🏘️ ${currentLang==='hi'?'सामुदायिक भंडारण':'Community Storage'}</div>
      <div class="notif notif-info mb-16">💡 ${currentLang==='hi'?'पड़ोसी किसानों के साथ — 40% बचत':'Pool with nearby farmers — save 40%'}</div>
      ${[{g:'FPO Hingoli Group',members:12,crop:'Soybean',fill:75},{g:'Wardha Wheat Farmers',members:8,crop:'Wheat',fill:50},{g:'Cotton Growers MH',members:18,crop:'Cotton',fill:30}].map(g=>`
        <div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">
          <div class="flex-between"><span class="fw-bold" style="font-size:0.9rem">${g.g}</span><span class="text-sm">${g.members} ${currentLang==='hi'?'सदस्य':'members'}</span></div>
          <div class="text-sm" style="margin:4px 0">${g.crop}</div>
          <div class="progress-wrap mt-16"><div class="progress-bar" style="width:${g.fill}%"></div></div>
          <div class="flex-between mt-16"><span class="text-sm">${g.fill}% ${currentLang==='hi'?'भरा':'filled'}</span><button class="btn btn-primary btn-sm" onclick="joinStorageGroup('${g.g}')">Join</button></div>
        </div>`).join('')}
    </div>
  </div>`;
  setTimeout(()=>initWarehouseMap(), 120);
};

window.initWarehouseMap = function() {
  if (typeof L==='undefined') return;
  const mapEl = document.getElementById('warehouse-map');
  if (!mapEl || mapEl._leaflet_id) return;
  const map = L.map('warehouse-map').setView([21.1458,79.0882],8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);
  const wIcon = L.divIcon({html:'<div style="background:#2d6a4f;border:2px solid #74c69d;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px">🏭</div>',className:'',iconSize:[28,28]});
  const fIcon = L.divIcon({html:'<div style="background:#1a4731;border:2px solid #f4a228;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px">👨‍🌾</div>',className:'',iconSize:[26,26]});
  [[21.15,79.09,'NAFED Nagpur','1200 MT · ₹8/qtl/day',wIcon],[20.75,78.60,'State Agri WH Wardha','800 MT · ₹6/qtl/day',wIcon],[20.93,77.75,'CWC Amravati','3500 MT · ₹9/qtl/day',wIcon],[19.72,77.32,'Hingoli APMC','500 MT · ₹7/qtl/day',wIcon],[21.28,79.05,'Ramesh Farm','Soybean — 50 Qtl',fIcon],[20.70,78.45,'Gopal Farm','Wheat — 120 Qtl',fIcon]].forEach(([lat,lng,title,desc,icon])=>{
    L.marker([lat,lng],{icon}).addTo(map).bindPopup(`<strong>${title}</strong><br/>${desc}`);
  });
  if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos=>{
    const myIcon=L.divIcon({html:'<div style="background:#0ea5e9;border:3px solid #fff;border-radius:50%;width:20px;height:20px"></div>',className:'',iconSize:[20,20]});
    L.marker([pos.coords.latitude,pos.coords.longitude],{icon:myIcon}).addTo(map).bindPopup('📍 You are here');
  },()=>{});
};

window.bookWarehouse = function(name) {
  const user=JSON.parse(localStorage.getItem('kio_user')||'null');
  if (!user){ openAuthModal(); showToast(currentLang==='hi'?'पहले लॉगिन करें':'Login to book','warn'); return; }
  saveToFirestore('bookings',{warehouse:name,user:user.name,date:new Date().toISOString()});
  addNotification(`${currentLang==='hi'?'बुकिंग भेजी गई':'Booking sent'}: ${name}!`, 'success', '🏭 Warehouse Booked');
};

window.joinStorageGroup = function(group) {
  addNotification(`${currentLang==='hi'?'समूह में जुड़ गए':'Joined'}: ${group}!`, 'success', '🏘️ Storage Group');
};

window.getTransportBids = async function() {
  const div=document.getElementById('transport-result'); if(!div) return;
  div.innerHTML='<div class="ai-thinking"><div class="loading-dots"><span></span><span></span><span></span></div> Getting bids...</div>';
  await new Promise(r=>setTimeout(r,900));
  const bids=[{name:'Kumar Transport',rate:'₹3,800',time:'Same day',rating:'4.6 ⭐',best:false},{name:'Shree Logistics',rate:'₹3,400',time:'Next day',rating:'4.8 ⭐',best:true},{name:'AgriMove Express',rate:'₹4,200',time:'Same day',rating:'4.3 ⭐',best:false}];
  div.innerHTML=bids.map(b=>`<div style="display:flex;align-items:center;gap:12px;border:1px solid ${b.best?'var(--green-bright)':'var(--border)'};border-radius:10px;padding:12px;margin-bottom:8px;background:${b.best?'rgba(64,145,108,0.07)':''}"><div style="flex:1"><div class="fw-bold">${b.name} ${b.best?'<span class="badge badge-green">Best</span>':''}</div><div class="text-sm">${b.time} · ${b.rating}</div></div><div class="text-gold fw-bold">${b.rate}</div><button class="btn btn-primary btn-sm" onclick="addNotification('${b.name} booked!','success','🚛 Transport Booked')">Book</button></div>`).join('');
};