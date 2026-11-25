var TV_PREVIEW_MODE = new URLSearchParams(location.search).get('preview') === '1';
var TV_AUTOFIT = !TV_PREVIEW_MODE && new URLSearchParams(location.search).get('autofit') !== '0';
if (TV_AUTOFIT) document.body.classList.add('tv-autofit');
var TV_LAST_BG = '#eee5f8';
var TV_LAST_CFG = {};
if (TV_PREVIEW_MODE) {
  document.body.classList.add('tv-preview-mode');
  document.getElementById('receiverPreview').hidden = false;
} else {
  var receiverFrame = document.getElementById('receiver');
  receiverFrame.src = receiverFrame.dataset.src;
  receiverFrame.hidden = false;
}
function tvSyncBannerTheme() {
  var frame = document.getElementById('banner');
  if (frame && frame.contentWindow) frame.contentWindow.postMessage(Object.assign({},TV_LAST_CFG,{type:'cmucoop:banner-theme',bg:TV_LAST_BG}), location.origin);
}
document.getElementById('banner').addEventListener('load', tvSyncBannerTheme);
/* ค่าเริ่มต้น (ใช้ตอนโหลดหน้า/เมื่อติดต่อเซิร์ฟเวอร์ไม่ได้) — ค่าจริงตั้งได้ที่ ระบบหลัก > ตั้งค่า > หน้าจอ TV */
var TEXT = {
  shop:     'ร้านสหกรณ์ มช. (CMU CO-OP)',
  helloMain:'ยินดีต้อนรับ',
  helloSub: '"ขอให้วันนี้เป็นวันที่สดใสสำหรับคุณ"',
  caption:  'ร้านสหกรณ์ มช. ยินดีให้บริการ'
};
var $ = function (id) { return document.getElementById(id); };
/* ข้อความไหล: ข้อความเดียว เริ่มนอกขอบขวา เลื่อนพ้นขอบซ้ายแล้ววนเริ่มใหม่ */
var capText = '', capSpeed = 80, capPaused = false, tvCurScale = 1;
function setCaption(t) {
  t = t || '';
  var el = $('caption'), btn = $('capToggle');
  el.style.display = t ? '' : 'none';
  if (btn) btn.style.display = t ? '' : 'none';
  if (t === capText && el.firstChild) return;
  capText = t; el.textContent = '';
  if (!t) return;
  var tr = document.createElement('span'); tr.className = 'track'; tr.textContent = t; el.appendChild(tr);
  el.classList.toggle('paused', capPaused);
  layoutCaption();
}
function layoutCaption() {
  var el = $('caption'), tr = el.firstChild; if (!capText || !tr) return;
  var cw = el.clientWidth || 760, w = tr.getBoundingClientRect().width || 1;
  tr.style.setProperty('--cw', cw + 'px');
  tr.style.setProperty('--dur', ((cw + w) / (Math.max(10, capSpeed) * (TV_AUTOFIT ? tvCurScale : 1))).toFixed(2) + 's');
}
$('capToggle').addEventListener('click', function () {
  capPaused = !capPaused;
  $('caption').classList.toggle('paused', capPaused);
  this.setAttribute('aria-pressed', capPaused ? 'true' : 'false');
  this.setAttribute('aria-label', capPaused ? 'เล่นข้อความวิ่งต่อ' : 'หยุดข้อความวิ่งชั่วคราว');
  this.textContent = capPaused ? ' เล่นข้อความวิ่ง' : ' หยุดข้อความวิ่ง';
});
window.addEventListener('resize', layoutCaption);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutCaption);

/* คำนวณสีตัวอักษร (#ffffff หรือ #1f1530) ที่มีความต่าง (contrast ratio) สูงสุดเทียบกับสีพื้นหลังที่ Admin ตั้ง */
function parseColor(str) {
  str = String(str || '').trim();
  var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str);
  if (m) {
    var h = m[1];
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  }
  var rgb = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(str);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  return null;
}
function relLum(c) {
  function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}
function contrastRatio(l1, l2) {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function syncContrast(bgStr, textColor) {
  var c = parseColor(bgStr) || parseColor(getComputedStyle(document.body).backgroundColor) || { r: 139, g: 99, b: 166 };
  var bgLum = relLum(c);
  var whiteLum = 1.0, darkLum = relLum({ r: 31, g: 21, b: 48 }); // #1f1530
  var rWhite = contrastRatio(whiteLum, bgLum), rDark = contrastRatio(darkLum, bgLum);
  var useDark = rDark > rWhite && rWhite < 4.5;
  var r = document.documentElement.style;
  if (useDark) {
    r.setProperty('--tv-fg', '#1f1530');
    r.setProperty('--tv-shadow', 'none');
    r.setProperty('--btn-bg', 'rgba(255,255,255,.72)');
    r.setProperty('--btn-hover', 'rgba(255,255,255,.9)');
    r.setProperty('--btn-border', 'rgba(31,21,48,.65)');
  } else {
    r.setProperty('--tv-fg', '#ffffff');
    r.setProperty('--tv-shadow', '0 1px 2px rgba(58,32,80,.35)');
    r.setProperty('--btn-bg', 'rgba(26,15,46,.48)');
    r.setProperty('--btn-hover', 'rgba(26,15,46,.68)');
    r.setProperty('--btn-border', 'rgba(255,255,255,.78)');
  }
  // ปุ่มใช้สีที่อ่านง่ายบนพื้นปุ่มเสมอ แม้จะเลือกสีข้อความส่วนอื่นเอง
  r.setProperty('--tv-button-fg', useDark ? '#1f1530' : '#ffffff');
  if (/^#[0-9a-f]{6}$/i.test(String(textColor || ''))) {
    r.setProperty('--tv-fg', textColor);
    r.setProperty('--tv-shadow', 'none');
  }
}

/* โหลดฟอนต์ที่เลือกจาก Google Fonts (Tahoma / TH Sarabun New ใช้ฟอนต์ในเครื่อง) */
var fontLoaded = {};
function useFont(name) {
  if (!name) return;
  document.documentElement.style.setProperty('--font', "'" + name + "'");
  if (fontLoaded[name] || name === 'Tahoma' || name === 'TH Sarabun New' || name === 'Sarabun') return;
  fontLoaded[name] = 1;
  var l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + ':wght@400;600;700&display=swap';
  document.head.appendChild(l);
  if (document.fonts && document.fonts.ready) setTimeout(function () { document.fonts.ready.then(layoutCaption); }, 1500);
}
function applyCfg(c) {
  c = c || {};
  TV_LAST_CFG = c;
  var T = function (k) { return c[k] === undefined || c[k] === null ? TEXT[k] : c[k]; };
  $('shopName').textContent = T('shop'); $('shopName').style.display = T('shop') ? '' : 'none';
  $('helloMain').textContent = T('helloMain'); $('helloSub').textContent = T('helloSub');
  $('helloMain').parentNode.style.display = (T('helloMain') || T('helloSub')) ? '' : 'none';
  setCaption(T('caption'));
  var r = document.documentElement.style;
  var bgVal = /^#[0-9a-f]{6}$/i.test(String(c.bg || '')) ? c.bg : '#eee5f8';
  TV_LAST_BG = bgVal;
  r.setProperty('--bg', bgVal);
  syncContrast(bgVal, c.textColor);
  var opacity = Number.isFinite(Number(c.controlOpacity)) ? Math.min(100,Math.max(0,Number(c.controlOpacity))) / 100 : 1;
  function buttonBackground(color) {
    var rgb = parseColor(color);
    return rgb ? 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+opacity+')' : '';
  }
  var controlBg = /^#[0-9a-f]{6}$/i.test(String(c.controlBg||'')) ? buttonBackground(c.controlBg) : '';
  if (controlBg) {
    r.setProperty('--btn-bg',controlBg);r.setProperty('--btn-hover',controlBg);
    var buttonRgb=parseColor(c.controlBg),pageRgb=parseColor(bgVal),mixed={};
    ['r','g','b'].forEach(function(key){mixed[key]=buttonRgb[key]*opacity+pageRgb[key]*(1-opacity);});
    var buttonLum=relLum(mixed),darkLum=relLum({r:31,g:21,b:48});
    r.setProperty('--tv-button-fg',contrastRatio(buttonLum,darkLum)>contrastRatio(buttonLum,1)?'#1f1530':'#ffffff');
  }
  else if (opacity !== 1) {
    ['--btn-bg','--btn-hover'].forEach(function(key){var value=r.getPropertyValue(key);r.setProperty(key,value.replace(/,([\d.]+)\)$/,function(_,a){return ','+(Number(a)*opacity)+')';}));});
  }
  if (/^#[0-9a-f]{6}$/i.test(String(c.controlColor||''))) r.setProperty('--tv-button-fg',c.controlColor);
  if (/^#[0-9a-f]{6}$/i.test(String(c.controlBorderColor||''))) r.setProperty('--btn-border',c.controlBorderColor);
  [['clockColor','--tv-clock'],['shopColor','--tv-shop'],['welcomeColor','--tv-welcome'],['subColor','--tv-sub'],['captionColor','--tv-caption'],['footColor','--tv-foot']].forEach(function (p) {
    var v = String(c[p[0]] || '');
    if (/^#[0-9a-f]{6}$/i.test(v)) r.setProperty(p[1], v); else r.removeProperty(p[1]);
  });
  applyMetrics(c, 1);
  useFont(c.font);
  $('head').setAttribute('data-layout', c.headLayout || 'side');
  if (c.capSpeed) capSpeed = Number(c.capSpeed) || 80;
  $('logo').style.display = c.showLogo === false ? 'none' : '';
  $('clock').style.display = c.showClock === false ? 'none' : '';
  $('banner').style.display = c.showBanner === false ? 'none' : '';
  $('receiverPreview').style.marginTop = (c.gapReceiver === null || c.gapReceiver === undefined || c.gapReceiver === '' ? (c.gap === undefined ? 14 : c.gap) : c.gapReceiver) + 'px';
  if (TV_AUTOFIT) fitTvStage();
  else layoutCaption();
  tvSyncBannerTheme();
}
function applyMetrics(c, scale) {
  c = c || {};
  var s = scale > 0 ? scale : 1;
  var r = document.documentElement.style;
  var sc = function (v, def) {
    var n = (v === undefined || v === null || v === '') ? def : Number(v);
    return (Math.round(n * s * 100) / 100) + 'px';
  };
  r.setProperty('--w', sc(c.width, 760));
  r.setProperty('--banner-h', sc(c.bannerH, 230));
  if (c.receiverH) r.setProperty('--receiver-h', c.receiverH + 'px');
  r.setProperty('--f-clock', sc(c.fontClock, 22));
  r.setProperty('--f-shop', sc(c.fontShop, 22));
  r.setProperty('--f-hello', sc(c.fontHello, 22));
  r.setProperty('--f-caption', sc(c.fontCaption, 22));
  r.setProperty('--gap', sc(c.gap, 14));
  r.setProperty('--banner-w', Number(c.bannerW) > 0 ? sc(c.bannerW, 0) : '100%');
  r.setProperty('--receiver-w', Number(c.receiverW) > 0 ? c.receiverW + 'px' : '100%');
  r.setProperty('--pad-top', sc(c.padTop, 14));
  r.setProperty('--logo', sc(c.logoSize, 84));
  r.setProperty('--head-gap', sc(c.headGap, 18));
  [['gapBanner','--g-banner'],['gapCaption','--g-caption']].forEach(function (p) {
    var v = c[p[0]]; if (v === null || v === undefined || v === '') r.removeProperty(p[1]); else r.setProperty(p[1], sc(v, 0));
  });
  [['gapReceiver','--g-receiver'],['gapFoot','--g-foot']].forEach(function (p) {
    var v = c[p[0]]; if (v === null || v === undefined || v === '') r.removeProperty(p[1]); else r.setProperty(p[1], v + 'px');
  });
}
var tvFitRaf = 0;
function measureStageHeight(c, s) {
  var head = $('head'), banner = $('banner'), cap = $('caption');
  var baseGap = (c.gap === undefined || c.gap === null) ? 14 : Number(c.gap);
  var gBanner = (c.gapBanner === null || c.gapBanner === undefined || c.gapBanner === '') ? baseGap : Number(c.gapBanner);
  var gCaption = (c.gapCaption === null || c.gapCaption === undefined || c.gapCaption === '') ? baseGap : Number(c.gapCaption);
  var headH = head ? head.getBoundingClientRect().height : 0;
  var bannerVis = banner && banner.style.display !== 'none';
  var bannerH = bannerVis ? banner.getBoundingClientRect().height : 0;
  var capVis = cap && cap.style.display !== 'none';
  var capH = capVis ? cap.getBoundingClientRect().height : 0;
  return headH + (bannerVis ? gBanner * s + bannerH : 0) + (capVis ? gCaption * s + capH : 0);
}
function fitTvStage() {
  if (!TV_AUTOFIT) { tvCurScale = 1; layoutCaption(); return; }
  var c = TV_LAST_CFG || {};
  applyMetrics(c, 1);
  var baseW = Math.max(320, Number(c.width) || 760);
  var naturalH = measureStageHeight(c, 1);
  if (naturalH < 100) naturalH = 400;
  var availW = Math.max(300, Math.min(window.innerWidth - 48, window.innerWidth * 0.90));
  var availH = Math.max(300, Math.min(window.innerHeight - 48, window.innerHeight * 0.86));
  var scale = Math.max(0.4, Math.min(4.0, Math.min(availW / baseW, availH / naturalH)));
  applyMetrics(c, scale);
  var actualH = measureStageHeight(c, scale);
  if (actualH > availH) {
    scale = Math.max(0.4, scale * (availH / actualH) * 0.985);
    applyMetrics(c, scale);
  }
  tvCurScale = scale;
  layoutCaption();
}
function scheduleFitTvStage() {
  if (!TV_AUTOFIT) return;
  if (tvFitRaf) cancelAnimationFrame(tvFitRaf);
  tvFitRaf = requestAnimationFrame(function () { tvFitRaf = 0; fitTvStage(); });
}
window.addEventListener('resize', scheduleFitTvStage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFitTvStage);
applyCfg({});
window.addEventListener('message', function (event) {
  if (!TV_PREVIEW_MODE || window.parent === window || event.origin !== location.origin || event.source !== window.parent || !event.data) return;
  if (event.data.type === 'cmucoop:tv-banner-refresh') { $('banner').contentWindow.postMessage({type:'cmucoop:banner-refresh'},location.origin); return; }
  if (event.data.type !== 'cmucoop:tv-preview') return;
  if (!event.data.config || typeof event.data.config !== 'object' || Array.isArray(event.data.config)) return;
  applyCfg(event.data.config);
  var sequence = event.data.seq;
  requestAnimationFrame(function () {
    window.parent.postMessage({type:'cmucoop:tv-preview-applied',seq:sequence,overflow:document.documentElement.scrollHeight > innerHeight + 2}, location.origin);
  });
});
if (TV_PREVIEW_MODE && window.parent !== window) window.parent.postMessage({type:'cmucoop:tv-preview-ready'}, location.origin);
/* ดึงค่าตั้งค่าจากเซิร์ฟเวอร์ แล้วตรวจซ้ำทุก 1 นาที (เปลี่ยนค่าที่ระบบหลักแล้ว TV อัปเดตเอง ไม่ต้องรีเฟรช) */
function loadCfg() {
  if (TV_PREVIEW_MODE) return;
  if (!window.google || !google.script) return;
  google.script.run.withSuccessHandler(applyCfg).withFailureHandler(function () {}).getTvPublic();
}
if (!TV_PREVIEW_MODE) { loadCfg(); setInterval(function () { if (!document.hidden) loadCfg(); }, 60000); }

/* นาฬิกา: เวลาไทย พ.ศ. อัปเดตทุกวินาที */
var TZ = 'Asia/Bangkok';
function tick() {
  var d = new Date();
  var t = d.toLocaleTimeString('en-GB', { hour12: false, timeZone: TZ });
  var day = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ, calendar: 'buddhist' });
  document.getElementById('clock').textContent = t + ' น. ' + day;
}
tick(); setInterval(tick, 1000);

/* คัดลอกลิงก์หน้านี้ */
document.getElementById('copyLink').addEventListener('click', function () {
  var btn = this, url = location.href.split('#')[0], old = btn.textContent;
  function done(ok) { btn.textContent = ok ? 'คัดลอกลิงก์แล้ว ✓' : 'คัดลอกไม่ได้ กรุณาคัดลอกจากแถบที่อยู่'; setTimeout(function () { btn.textContent = old; }, 2000); }
  if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); }); return; }
  var ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta); done(ok);
});
